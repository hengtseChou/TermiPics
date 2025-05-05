from typing import Optional

from pydantic import BaseModel


class User(BaseModel):
    user_uid: str
    email: str
    username: str
    created_at: str
    last_active: str
    auth_provider: str = "email"  # email (default), google.
    password: Optional[str] = None
    avatar: Optional[str] = None
    image_count: int = 0
    is_premium: bool = False


class Image(BaseModel):
    image_uid: str
    user_uid: str
    title: str
    file_name: str
    format: str
    size: int
    created_at: str
    updated_at: str
    labels: list[str]
    is_deleted: bool = False
