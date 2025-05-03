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
    images: int = 0
    is_premium: bool = False


class Image(BaseModel):
    image_uid: str
    user_uid: str
    title: str
    file_name: str
    uploaded_at: str
    updated_at: str
    url: str
    thumbnail_url: str
    labels: Optional[list[str]] = None
    is_deleted: bool = False
