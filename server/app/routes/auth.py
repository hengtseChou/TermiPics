import httpx
from fastapi import APIRouter, HTTPException, status
from google.auth.transport import requests
from google.oauth2 import id_token

from app.config import GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET
from app.schemas import (
    AuthResponse,
    GoogleOAuthRequest,
    LoginRequest,
    MessageResponse,
    SignupRequest,
    TokenRequest,
    VerificationResponse,
)
from app.utils.auth import (
    create_access_token,
    create_refresh_token,
    validate_token,
    verify_password,
)
from app.utils.db import SupabaseTable, supabase_client

router = APIRouter()


@router.post("/signup", status_code=status.HTTP_201_CREATED, response_model=MessageResponse)
async def signup(request: SignupRequest):
    """
    Handle normal email/password signup.
    """
    with supabase_client() as client:
        supabase = SupabaseTable(client)
        if supabase.is_email_exists(email=request.email, auth_provider="email"):
            raise HTTPException(status_code=400, detail="Email already registered")
        if supabase.is_username_exists(username=request.username, auth_provider="email"):
            raise HTTPException(status_code=400, detail="Username already taken")
        supabase.insert_new_user(
            email=request.email,
            username=request.username,
            password=request.password,
            auth_provider="email",
        )

    return MessageResponse(message="User created successfully")


@router.post("/login", status_code=status.HTTP_200_OK, response_model=AuthResponse)
async def login(request: LoginRequest):
    """
    Handle email/password login.
    """
    with supabase_client() as client:
        supabase = SupabaseTable(client)
        user_creds = supabase.get_user_creds(request.email)
        if not user_creds:
            raise HTTPException(status_code=401, detail="User not found")
        if not verify_password(request.password, user_creds["password"]):
            raise HTTPException(status_code=401, detail="Incorrect password")

        user_uid = user_creds["user_uid"]
        access_token = create_access_token(data={"user_uid": user_uid})
        refresh_token = create_refresh_token(data={"user_uid": user_uid})
        supabase.update_last_active(user_uid)

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_uid=user_uid,
    )


@router.post("/google", status_code=status.HTTP_201_CREATED, response_model=AuthResponse)
async def continue_with_google(request: GoogleOAuthRequest):
    """
    Handle continue with Google.
    """
    token_request_uri = "https://oauth2.googleapis.com/token"
    data = {
        "code": request.code,
        "client_id": GOOGLE_OAUTH_CLIENT_ID,
        "client_secret": GOOGLE_OAUTH_CLIENT_SECRET,
        "redirect_uri": "postmessage",
        "grant_type": "authorization_code",
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(token_request_uri, data=data)
        response.raise_for_status()
        token_response = response.json()

    id_token_value = token_response.get("id_token")
    if not id_token_value:
        raise HTTPException(status_code=400, detail="Missing id_token in response.")
    id_info = id_token.verify_oauth2_token(
        id_token_value, requests.Request(), GOOGLE_OAUTH_CLIENT_ID
    )
    email = id_info.get("email")
    with supabase_client() as client:
        supabase = SupabaseTable(client)
        if supabase.is_email_exists(email, auth_provider="google"):
            user_uid = supabase.get_user_uid(email=email, auth_provider="google")
            supabase.update_last_active(user_uid)
        else:
            username = email.split("@")[0]
            user_uid = supabase.insert_new_user(
                email=email,
                username=username,
                auth_provider="google",
                avatar=id_info.get("picture"),
            )

    access_token = create_access_token(data={"user_uid": user_uid})
    refresh_token = create_refresh_token(data={"user_uid": user_uid})

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_uid=user_uid,
    )


@router.post("/verify-token", response_model=VerificationResponse)
async def verify_token(access_token: TokenRequest):
    """
    Verify the access token.
    """
    payload = validate_token(access_token.token)
    user_uid = payload.get("user_uid")
    return VerificationResponse(
        user_uid=user_uid,
    )


@router.post("/refresh-token/", response_model=AuthResponse)
async def refresh_token(refresh_token: TokenRequest):
    """
    Refresh the access token using a valid refresh token.
    """
    payload = validate_token(refresh_token.token)
    user_uid = payload.get("user_uid")
    access_token = create_access_token(data={"user_uid": user_uid})

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token.token,
        user_uid=user_uid,
    )
