from typing import Optional

from pydantic import BaseModel


class SignupRequest(BaseModel):
    email: str
    username: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class GoogleOAuthRequest(BaseModel):
    code: str


class VerificationRequest(BaseModel):
    token: str


class RefreshRequest(BaseModel):
    token: str


class SignupResponse(BaseModel):
    user_uid: str


class AuthTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    user_uid: str


class VerificationResponse(BaseModel):
    user_uid: str


class ImageUploadResponse(BaseModel):
    image_uid: str


class UserInfoResponse(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    created_at: Optional[str] = None
    last_active: Optional[str] = None
    auth_provider: Optional[str] = None
    password: Optional[str] = None
    avatar: Optional[str] = None
    image_count: Optional[int] = None
    is_premium: Optional[bool] = False
