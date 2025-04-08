from abc import ABC, abstractmethod
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from fastapi import HTTPException
from postgrest.exceptions import APIError
from supabase import create_client
from supabase.client import Client as SupabaseClient

from app.config import SUPABASE_KEY, SUPABASE_URL
from app.models import User
from app.utils.auth import hash_password


@contextmanager
def supabase_client():
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    try:
        yield client
    finally:
        pass


class TableOperator(ABC):

    def __init__(self, client):
        self.client = client

    @abstractmethod
    def is_email_exists(self, email: str, auth_provider: str) -> bool:
        pass

    @abstractmethod
    def is_username_exists(self, username: str, auth_provider: str) -> bool:
        pass

    @abstractmethod
    def insert_new_user(
        self,
        email: str,
        username: str,
        auth_provider: str,
        password: Optional[str] = None,
        avatar: Optional[str] = None,
    ) -> str:
        pass

    @abstractmethod
    def update_last_active(self, user_uid: str) -> None:
        pass

    @abstractmethod
    def get_user_creds(self, email: str) -> dict:
        pass

    @abstractmethod
    def get_user_uid(self, email: str, auth_provider: str) -> Optional[str]:
        pass

    @abstractmethod
    def get_user_info_by_keys(self, user_uid: str, keys: list[str]) -> int:
        pass


class SupabaseTable(TableOperator):

    def __init__(self, client: SupabaseClient):
        super().__init__(client)
        self.client = client

    def is_email_exists(self, email: str, auth_provider: str) -> bool:
        response = (
            self.client.table("users")
            .select("email")
            .eq("email", email)
            .eq("auth_provider", auth_provider)
            .execute()
        )
        return len(response.data) > 0

    def is_username_exists(self, username: str, auth_provider: str) -> bool:
        response = (
            self.client.table("users")
            .select("username")
            .eq("username", username)
            .eq("auth_provider", auth_provider)
            .execute()
        )
        return len(response.data) > 0

    def insert_new_user(
        self,
        email: str,
        username: str,
        auth_provider: str,
        password: Optional[str] = None,
        avatar: Optional[str] = None,
    ) -> str:
        user_uid = str(uuid4())
        created_at = datetime.now(timezone.utc).isoformat()
        last_active = created_at

        if auth_provider == "email":
            if not password:
                raise ValueError("Password is required for email registration")
            hashed_password = hash_password(password)
            new_user = User(
                user_uid=user_uid,
                email=email,
                username=username,
                password=hashed_password,
                auth_provider="email",
                created_at=created_at,
                last_active=last_active,
            )
        elif auth_provider == "google":
            new_user = User(
                user_uid=user_uid,
                email=email,
                username=username,
                auth_provider="google",
                created_at=created_at,
                last_active=last_active,
                avatar=avatar,
            )
        else:
            raise ValueError("Invalid auth provider")

        try:
            self.client.table("users").insert(new_user.to_dict()).execute()
        except APIError:
            raise HTTPException(status_code=500, detail="Error connecting to database")

        return user_uid

    def update_last_active(self, user_uid: str) -> None:
        last_active = datetime.now(timezone.utc).isoformat()
        try:
            self.client.table("users").update({"last_active": last_active}).eq(
                "user_uid", user_uid
            ).execute()
        except APIError:
            raise HTTPException(status_code=500, detail="Error connecting to database")

    def get_user_creds(self, email: str) -> dict:
        try:
            response = (
                self.client.table("users")
                .select("user_uid", "password")
                .eq("email", email)
                .execute()
            )
        except APIError:
            raise HTTPException(status_code=500, detail="Error connecting to database")
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")

        return response.data[0]

    def get_user_uid(self, email: str, auth_provider: str) -> Optional[str]:
        try:
            response = (
                self.client.table("users")
                .select("user_uid")
                .eq("email", email)
                .eq("auth_provider", auth_provider)
                .execute()
            )
        except APIError:
            raise HTTPException(status_code=500, detail="Error connecting to database")
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")

        return response.data[0]["user_uid"]

    def get_user_info_by_keys(self, user_uid: str, keys: list[str]) -> dict:
        try:
            response = self.client.table("users").select(*keys).eq("user_uid", user_uid).execute()
        except APIError:
            raise HTTPException(status_code=500, detail="Error connecting to database")
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")

        return {key: response.data[0].get(key) for key in keys}
