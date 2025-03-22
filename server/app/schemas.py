from pydantic import BaseModel


class SignupRequest(BaseModel):
    email: str
    username: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenRequest(BaseModel):
    token: str


class GoogleOAuthRequest(BaseModel):
    code: str


class MessageResponse(BaseModel):
    message: str


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user_uid: str


class VerificationResponse(BaseModel):
    user_uid: str
