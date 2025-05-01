from pydantic import BaseModel


class Signup(BaseModel):
    email: str
    username: str
    password: str


class SignupResponse(BaseModel):
    user_uid: str


class Login(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    token: str


class GoogleOAuth(BaseModel):
    code: str


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user_uid: str


class VerificationResponse(BaseModel):
    user_uid: str
