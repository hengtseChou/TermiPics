from datetime import datetime, timedelta, timezone
from uuid import uuid4

import httpx
import jwt
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
from google.auth.transport import requests
from google.oauth2 import id_token
from passlib.context import CryptContext
from postgrest.exceptions import APIError

from app.config import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    ALGORITHM,
    FRONTEND_URL,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    REFRESH_TOKEN_EXPIRE_DAYS,
    SECRET_KEY,
    supabase,
)
from app.schemas import LoginRequest, SignupRequest, UserResponse

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


@router.post("/signup", response_model=UserResponse)
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


@router.post("/login", response_model=UserResponse)
async def login(request: LoginRequest):
    """
    Handle email/password login.
    """
    response = supabase.table("users").select("email").eq("email", request.email).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="User not found")

    user = response.data
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


@router.get("/google")
async def continue_with_google(request: Request):
    """
    Redirect the user to Google's OAuth2 consent screen.
    """
    redirect_uri = request.url_for("process_google_oauth")
    google_auth_url = f"https://accounts.google.com/o/oauth2/auth?client_id={GOOGLE_CLIENT_ID}&redirect_uri={redirect_uri}&response_type=code&scope=openid email profile"

    return RedirectResponse(url=google_auth_url)


@router.get("/google/callback")
async def process_google_oauth(code: str, request: Request):
    """
    Handle the OAuth2 callback from Google.
    """
    token_request_uri = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": request.url_for("process_google_oauth"),
        "grant_type": "authorization_code",
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(token_request_uri, data=data)
        response.raise_for_status()  # Will raise an HTTPException if the status is not 2xx
        token_response = response.json()
    id_token_value = token_response.get("id_token")
    if not id_token_value:
        raise HTTPException(status_code=400, detail="Missing id_token in response.")

    try:
        id_info = id_token.verify_oauth2_token(id_token_value, requests.Request(), GOOGLE_CLIENT_ID)
        response = (
            supabase.table("users")
            .select("user_uid, email, auth_provider")
            .eq("email", id_info.get("email"))
            .eq("auth_provider", "google")
            .execute()
        )
        if not response.data:
            user_uid = str(uuid4())
            created_at = datetime.now(timezone.utc).isoformat()
            last_active = created_at
            email = id_info.get("email")
            username = email.split("@")[0]

            supabase.table("users").insert(
                {
                    "user_uid": user_uid,
                    "email": email,
                    "username": username,
                    "auth_provider": "google",
                    "created_at": created_at,
                    "last_active": last_active,
                    "avatar": id_info.get("picture"),
                }
            ).execute()
        else:
            user_uid = response.data[0]["user_uid"]
            last_active = datetime.now(timezone.utc).isoformat()
            supabase.table("users").update({"last_active": last_active}).eq(
                "user_uid", user_uid
            ).execute()
        access_token = create_access_token(data={"user_uid": user_uid})
        refresh_token = create_refresh_token(data={"user_uid": user_uid})

        response = RedirectResponse(url=f"{FRONTEND_URL}/dashboard")
        response.set_cookie(key="access_token", value=access_token, httponly=True)
        response.set_cookie(key="refresh_token", value=refresh_token, httponly=True)

        return response

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid id_token: {str(e)}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error, {str(e)}")


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
