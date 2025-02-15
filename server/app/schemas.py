from pydantic import BaseModel


class SignupRequest(BaseModel):
    email: str
    username: str
    password: str


class UserResponse(BaseModel):
    user_uid: str
    email: str
    username: str
    created_at: str
    last_active: str
    access_token: str
    refresh_token: str
