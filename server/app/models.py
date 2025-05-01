from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class User:
    user_uid: str
    email: str
    username: str
    created_at: datetime
    last_active: datetime
    auth_provider: str = "email"  # email (default), google.
    password: Optional[str] = None
    avatar: Optional[str] = None
    images: int = 0
    is_premium: bool = False

    def to_dict(self):
        return {
            "user_uid": self.user_uid,
            "email": self.email,
            "username": self.username,
            "password": self.password,
            "auth_provider": self.auth_provider,
            "created_at": self.created_at,
            "last_active": self.last_active,
            "avatar": self.avatar,
            "images": self.images,
            "is_premium": self.is_premium,
        }


@dataclass
class Image:
    image_uid: str
    user_uid: str
    title: str
    format: str
    uploaded_at: datetime
    updated_at: datetime
    url: str
    thumbnail_url: str
    labels: Optional[list[str]] = None
    is_deleted: bool = False

    def to_dict(self):
        return {
            "image_uid": self.image_uid,
            "user_uid": self.user_uid,
            "title": self.title,
            "format": self.format,
            "labels": self.labels,
            "uploaded_at": self.uploaded_at,
            "updated_at": self.updated_at,
            "url": self.url,
            "thumbnail_url": self.thumbnail_url,
            "is_deleted": self.is_deleted,
        }
