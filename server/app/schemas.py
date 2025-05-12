from typing import Literal, Optional

from pydantic import BaseModel, EmailStr


class SignupRequest(BaseModel):
    email: EmailStr
    username: str
    password: str

    @classmethod
    def model_validator(cls, values):
        password = values.get("password")
        if password:
            if len(password) < 8:
                raise ValueError("Password must be at least 8 characters long")
            if not any(c.isupper() for c in password):
                raise ValueError("Password must contain at least one uppercase letter")
            if not any(c.islower() for c in password):
                raise ValueError("Password must contain at least one lowercase letter")
            if not any(c.isdigit() for c in password):
                raise ValueError("Password must contain at least one digit")
        return values


class SignupResponse(BaseModel):
    user_uid: str


class LoginRequest(BaseModel):
    email: str
    password: str


class GoogleOAuthRequest(BaseModel):
    code: str


class RefreshRequest(BaseModel):
    token: str


class AuthTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    user_uid: str


class VerificationRequest(BaseModel):
    token: str


class VerificationResponse(BaseModel):
    user_uid: str


class UserInfoQueryRequest(BaseModel):
    keys: str


class UserInfoResponse(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    created_at: Optional[str] = None
    last_active: Optional[str] = None
    auth_provider: Optional[str] = None
    password: Optional[str] = None
    avatar: Optional[str] = None
    image_count: Optional[int] = None
    is_premium: Optional[bool] = None


class ImageQueryRequest(BaseModel):
    page: int
    sort_by: Literal["title", "created_at", "updated_at"]
    sort_order: Literal["desc", "asc"]
    labels: str


class ImageQueryResponse(BaseModel):
    image_uid: list[str]


class ImageUploadResponse(BaseModel):
    image_uid: str
