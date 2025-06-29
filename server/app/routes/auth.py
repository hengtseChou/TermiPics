from datetime import UTC, datetime
from typing import Annotated

import httpx
from fastapi import APIRouter, Body, HTTPException, status
from fastapi.params import Depends
from google.auth.transport import requests
from google.oauth2 import id_token
from postgrest.exceptions import APIError

from app.config import GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET
from app.dependencies.db import DatabaseClient, get_db_client, get_db_handler
from app.schemas import (
    AuthTokenResponse,
    GoogleOAuthRequest,
    LoginRequest,
    RefreshRequest,
    SignupRequest,
    SignupResponse,
    VerificationRequest,
    VerificationResponse,
)
from app.utils.auth import (
    create_access_token,
    create_refresh_token,
    validate_token,
    verify_password,
)

router = APIRouter()


@router.post("/signup", status_code=status.HTTP_201_CREATED, response_model=SignupResponse)
async def signup(
    request: Annotated[SignupRequest, Body(...)],
    db_client: Annotated[DatabaseClient, Depends(get_db_client)],
):
    """
    Create a new account using default email and password combination.

    Request body:

        - email (str)
            User email, which is used to log user in and should be unique.
        - username (str)
            User username, which should also be unique.
        - password (str)
            User password. Must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one digit.

    Response:

        - user_uid (str)
            UID for the newly registered user.
    """
    db = get_db_handler(db_client)
    if db.is_email_exists(email=request.email, auth_provider="email"):
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.is_username_exists(username=request.username, auth_provider="email"):
        raise HTTPException(status_code=400, detail="Username already taken")
    user_uid = db.insert_new_user(
        email=request.email,
        username=request.username,
        password=request.password,
        auth_provider="email",
    )

    return SignupResponse(user_uid=user_uid)


@router.post("/login", status_code=status.HTTP_200_OK, response_model=AuthTokenResponse)
async def login(
    request: Annotated[LoginRequest, Body(...)],
    db_client: Annotated[DatabaseClient, Depends(get_db_client)],
):
    """
    Login an user using email and password.

    Request body:

        - email (str)
            User email.
        - password (str)
            User password.

    Response:

        - access_token (str)
            The access token for the authenticated session.
        - refresh_token (str)
            Token used to issue new access tokens.
        - user_uid (str)
            UID for the authenticated user.
    """
    db = get_db_handler(db_client)
    try:
        user_creds = db.get_user_info(email=request.email, keys=["user_uid", "password"])
    except APIError:
        raise HTTPException(status_code=500, detail="Error connecting to database")
    if not user_creds:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if not verify_password(request.password, user_creds["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect password")

    user_uid = user_creds["user_uid"]
    access_token = create_access_token(user_uid=user_uid)
    refresh_token = create_refresh_token(user_uid=user_uid)
    try:
        db.update_user_info(user_uid=user_uid, data={"last_active": datetime.now(UTC).isoformat()})
    except APIError:
        raise HTTPException(status_code=500, detail="Error connecting to database")

    return AuthTokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_uid=user_uid,
    )


@router.post("/google", status_code=status.HTTP_201_CREATED, response_model=AuthTokenResponse)
async def continue_with_google(
    request: GoogleOAuthRequest, db_client: Annotated[DatabaseClient, Depends(get_db_client)]
):
    """
    Authenticate user with Google OAuth.

    Request body:

        - code (str)
            Authorization code received from Google OAuth flow.

    Response:

        - access_token (str)
            The access token for the authenticated session.
        - refresh_token (str)
            Token used to issue new access tokens.
        - user_uid (str)
            UID for the authenticated user.
    """
    token_request_uri = "https://oauth2.googleapis.com/token"
    data = {
        "code": request.code,
        "client_id": GOOGLE_OAUTH_CLIENT_ID,
        "client_secret": GOOGLE_OAUTH_CLIENT_SECRET,
        "redirect_uri": "postmessage",
        "grant_type": "authorization_code",
    }
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(token_request_uri, data=data)
            response.raise_for_status()
            token_response = response.json()
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to get token from Google: {str(e)}",
        )

    id_token_value = token_response.get("id_token")
    if not id_token_value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Missing id_token in response."
        )
    id_info = id_token.verify_oauth2_token(
        id_token_value,
        requests.Request(),
        GOOGLE_OAUTH_CLIENT_ID,
    )
    email = id_info.get("email")

    db = get_db_handler(db_client)
    if db.is_email_exists(email, auth_provider="google"):
        user_uid = db.get_user_uid(email=email, auth_provider="google")
        db.update_user_info(user_uid=user_uid, data={"last_active": datetime.now(UTC).isoformat()})
    else:
        username = email.split("@")[0]
        user_uid = db.insert_new_user(
            email=email,
            username=username,
            auth_provider="google",
            avatar=id_info.get("picture"),
        )

    access_token = create_access_token(user_uid=user_uid)
    refresh_token = create_refresh_token(user_uid=user_uid)

    return AuthTokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_uid=user_uid,
    )


@router.post("/verify-token", response_model=VerificationResponse)
async def verify_token(request: VerificationRequest):
    """
    Verify the access token.

    Request body:

        - token (str)
            The access token to be verified.

    Response:

        - user_uid (str)
            UID for the user associated with the token.
    """
    payload = validate_token(request.token)
    user_uid = payload["sub"]

    return VerificationResponse(
        user_uid=user_uid,
    )


@router.post("/refresh-token/", response_model=AuthTokenResponse)
async def refresh_token(request: RefreshRequest):
    """
    Refresh the access token using a valid refresh token.

    Request body:

        - token (str)
            The refresh token to be used for generating a new access token.

    Response:

        - access_token (str)
            The newly issued access token for the authenticated session.
        - refresh_token (str)
            The same refresh token, returned for convenience.
        - user_uid (str)
            UID for the user associated with the token.
    """
    payload = validate_token(request.token)
    user_uid = payload["sub"]
    access_token = create_access_token(user_uid=user_uid)
    refresh_token = request.token

    return AuthTokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_uid=user_uid,
    )
