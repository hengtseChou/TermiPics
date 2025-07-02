"""
The database client objects and handler objects.

We don't deal with the database error here. They'll be handled in the api routes.
"""

from abc import ABC, abstractmethod
from datetime import UTC, datetime
from typing import Any, Optional, Union
from uuid import uuid4

from supabase.client import Client as SupabaseClient

from app.config import DATABASE_PROVIDER
from app.models import Image, User
from app.utils.auth import hash_password
from app.utils.supabase import supabase_client

type DatabaseClient = Union[SupabaseClient]


class UnknownDatabaseProvider(Exception):
    pass


class TableOperator(ABC):
    def __init__(self, client) -> None:
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
    def get_user_uid(
        self,
        auth_provider: str,
        *,
        email: Optional[str] = None,
        username: Optional[str] = None,
    ) -> str:
        """
        Retrieve the UID of a user based on their authentication provider
        and either their email or username.

        Args:
            auth_provider (str): The authentication provider (e.g., "email", "google").
            email (Optional[str]): The email of the user. Must be provided if username is not.
            username (Optional[str]): The username of the user. Must be provided if email is not.

        Returns:
            str: The UID of the user.

        Raises:
            ValueError: If neither email nor username is provided, or if both are provided.
        """
        pass

    @abstractmethod
    def get_user_info(
        self, keys: list[str], *, user_uid: Optional[str] = None, email: Optional[str] = None
    ) -> dict:
        pass

    @abstractmethod
    def update_user_info(self, user_uid: str, data: dict[str, Any]) -> None:
        pass

    @abstractmethod
    def is_image_exists(self, image_uid: str) -> bool:
        pass

    @abstractmethod
    def insert_new_image(
        self, user_uid: str, title: str, file_name: str, format: str, size: int, labels: list[str]
    ) -> str:
        pass

    @abstractmethod
    def get_image_info(self, image_uid: str, keys: list[str]) -> dict:
        pass

    @abstractmethod
    def update_image_info(self, image_uid: str, data: dict[str, Any]) -> None:
        pass

    @abstractmethod
    def filter_images(
        self, user_uid: str, page: int, sort_by: str, sort_order: str, labels: list[str]
    ) -> list[str]:
        pass


class SupabaseTable(TableOperator):
    def __init__(self, client: SupabaseClient) -> None:
        super().__init__(client)

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
        created_at = datetime.now(UTC).isoformat()
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
                labels=[],
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
                labels=[],
            )
        else:
            raise ValueError("Invalid auth provider")
        self.client.table("users").insert(new_user.model_dump()).execute()
        return user_uid

    def get_user_uid(
        self,
        auth_provider: str,
        *,
        email: Optional[str] = None,
        username: Optional[str] = None,
    ) -> str:
        if bool(email) == bool(username):
            raise ValueError("Must provide exactly one of email or username")
        field, value = ("email", email) if email else ("username", username)
        response = (
            self.client.table("users")
            .select("user_uid")
            .eq(field, value)
            .eq("auth_provider", auth_provider)
            .execute()
        )
        if not response.data:
            return ""
        return response.data[0]["user_uid"]

    def get_user_info(
        self, keys: list[str], *, user_uid: Optional[str] = None, email: Optional[str] = None
    ) -> dict:
        if bool(user_uid) == bool(email):
            raise ValueError("Must provide exactly one of email or username")
        field, value = ("user_uid", user_uid) if user_uid else ("email", email)
        response = self.client.table("users").select(*keys).eq(field, value).execute()
        if not response.data:
            return {}
        return {key: response.data[0].get(key) for key in keys}

    def update_user_info(self, user_uid: str, data: dict[str, Any]) -> None:
        self.client.table("users").update(data).eq("user_uid", user_uid).execute()

    def insert_new_image(
        self,
        user_uid: str,
        title: str,
        file_name: str,
        content_type: str,
        size: int,
        labels: list[str],
    ) -> str:
        image_uid = str(uuid4())
        created_at = datetime.now(UTC).isoformat()
        updated_at = created_at
        new_image = Image(
            image_uid=image_uid,
            user_uid=user_uid,
            title=title,
            file_name=file_name,
            content_type=content_type,
            size=size,
            labels=labels,
            created_at=created_at,
            updated_at=updated_at,
            is_deleted=False,
        )
        self.client.table("images").insert(new_image.model_dump()).execute()
        return image_uid

    def is_image_exists(self, image_uid: str) -> bool:
        response = (
            self.client.table("images").select("image_uid").eq("image_uid", image_uid).execute()
        )
        return len(response.data) > 0

    def get_image_info(self, image_uid: str, keys: list[str]) -> dict:
        response = self.client.table("images").select(*keys).eq("image_uid", image_uid).execute()
        if not response.data:
            return {}
        return {key: response.data[0].get(key) for key in keys}

    def update_image_info(self, image_uid: str, data: dict[str, Any]) -> None:
        self.client.table("images").update(data).eq("image_uid", image_uid).execute()

    def filter_images(
        self,
        user_uid: str,
        page: int,
        sort_by: str,
        sort_order: str,
        labels: list[str],
    ) -> list[str]:
        desc = True if sort_order == "desc" else False
        images_per_page = 50
        start = (page - 1) * images_per_page
        end = start + images_per_page
        if labels:
            response = (
                self.client.table("images")
                .select("image_uid")
                .eq("user_uid", user_uid)
                .overlaps("labels", labels)
                .order(sort_by, desc=desc)
                .range(start, end)
                .execute()
            )
        else:
            response = (
                self.client.table("images")
                .select("image_uid")
                .eq("user_uid", user_uid)
                .order(sort_by, desc=desc)
                .range(start, end)
                .execute()
            )
        if not response.data:
            return []
        return [item["image_uid"] for item in response.data]


match DATABASE_PROVIDER:
    case "supabase":
        get_db_client = supabase_client
        get_db_handler = SupabaseTable
    case _:
        raise UnknownDatabaseProvider(f"Unknown database provider: {DATABASE_PROVIDER}")
