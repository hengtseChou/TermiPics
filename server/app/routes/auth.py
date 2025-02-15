from datetime import datetime, timedelta, timezone
from uuid import uuid4

import jwt
from fastapi import APIRouter, HTTPException
from passlib.context import CryptContext
from postgrest.exceptions import APIError

from app.config import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    ALGORITHM,
    REFRESH_TOKEN_EXPIRE_DAYS,
    SECRET_KEY,
    supabase,
)
from app.schemas import SignupRequest, LoginRequest, UserResponse

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_access_token(data: dict, expires_delta: timedelta = None):
    if expires_delta is None:
        expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode = data.copy()
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict, expires_delta: timedelta = None):
    if expires_delta is None:
        expires_delta = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode = data.copy()
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Could not validate token")


@router.post("/signup/", response_model=UserResponse)
async def signup(request: SignupRequest):
    """
    Handle normal email/password signup.
    """
    duplicated_email = supabase.table("users").select("email").eq("email", request.email).execute()
    if duplicated_email.data:
        raise HTTPException(status_code=400, detail="Email already registered")
    duplicated_username = (
        supabase.table("users").select("username").eq("username", request.username).execute()
    )
    if duplicated_username.data:
        raise HTTPException(status_code=400, detail="Username already taken")

    user_uid = str(uuid4())
    hashed_password = pwd_context.hash(request.password)
    created_at = datetime.now(timezone.utc).isoformat()
    last_active = created_at

    try:
        supabase.table("users").insert(
            {
                "user_uid": user_uid,
                "email": request.email,
                "username": request.username,
                "password": hashed_password,
                "auth_provider": "email",
                "created_at": created_at,
                "last_active": last_active,
            }
        ).execute()
    except APIError:
        raise HTTPException(status_code=500, detail="Error connecting to database")

    access_token = create_access_token(data={"user_uid": user_uid})
    refresh_token = create_refresh_token(data={"user_uid": user_uid})

    return UserResponse(
        user_uid=user_uid,
        email=request.email,
        username=request.username,
        last_active=last_active,
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/login/", response_model=UserResponse)
async def login(request: LoginRequest):
    """
    Handle email/password login.
    """
    user = supabase.table("users").select("*").eq("email", request.email).single().execute()
    if not user.data:
        raise HTTPException(status_code=404, detail="User not found")

    user = user.data
    if not pwd_context.verify(request.password, user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect password")

    user_uid = user["user_uid"]
    access_token = create_access_token(data={"user_uid": user_uid})
    refresh_token = create_refresh_token(data={"user_uid": user_uid})
    last_active = datetime.now(timezone.utc).isoformat()

    try:
        supabase.table("users").update({"last_active": last_active}).eq(
            "user_uid", user_uid
        ).execute()
    except APIError:
        raise HTTPException(status_code=500, detail="Error connecting to supabase")

    return UserResponse(
        user_uid=user["user_uid"],
        email=user["email"],
        username=user["username"],
        last_active=last_active,
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/refresh-token/", response_model=UserResponse)
async def refresh_token(refresh_token: str):
    """
    Refresh the access token using a valid refresh token.
    """
    # Verify the refresh token
    payload = verify_token(refresh_token)

    # You can now extract the user_uid from the payload
    user_uid = payload.get("user_uid")

    # Generate new access token
    access_token = create_access_token(data={"user_uid": user_uid})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,  # Optional: you could also generate a new refresh token here
    }
