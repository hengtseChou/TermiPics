from pydantic import BaseModel


class SignupRequest(BaseModel):
    email: str
    username: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    user_uid: str
    email: str
    username: str
    last_active: str
    access_token: str
    refresh_token: str
