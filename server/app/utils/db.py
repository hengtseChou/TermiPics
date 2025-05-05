from abc import ABC, abstractmethod
from datetime import UTC, datetime
from typing import Optional
from uuid import uuid4

from fastapi import HTTPException, status
from postgrest.exceptions import APIError
from supabase.client import Client as SupabaseClient

from app.models import Image, User
from app.utils.auth import hash_password


class UnknownDatabaseProvider(Exception):
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
    def get_user_uid(
        self,
        auth_provider: str,
        *,
        email: Optional[str] = None,
        username: Optional[str] = None,
    ) -> str:
        """
        Retrieve the unique identifier (user_uid) of a user based on their authentication provider
        and either their email or username.

        Args:
            auth_provider (str): The authentication provider (e.g., "email", "google").
            email (Optional[str]): The email of the user. Must be provided if username is not.
            username (Optional[str]): The username of the user. Must be provided if email is not.

        Returns:
            str: The unique identifier (user_uid) of the user.

        Raises:
            ValueError: If neither email nor username is provided, or if both are provided.
            HTTPException: If there is an error connecting to the database or if the user is not found.
        """
        pass

    @abstractmethod
    def get_user_info(self, user_uid: str, keys: list[str]) -> dict:
        pass

    @abstractmethod
    def insert_new_image(
        self, user_uid: str, title: str, file_name: str, format: str, size: int, labels: list[str]
    ) -> str:
        pass

    @abstractmethod
    def is_image_exists(self, image_uid: str) -> bool:
        pass

    @abstractmethod
    def get_image_info(self, image_uid: str, keys: list[str]) -> dict:
        pass

    @abstractmethod
    def filter_images(
        self, user_uid: str, page: int, sort_by: str, sort_order: str, labels: list[str]
    ) -> list[str]:
        pass


class SupabaseTable(TableOperator):
    def __init__(self, client: SupabaseClient):
        super().__init__(client)

    def is_email_exists(self, email: str, auth_provider: str) -> bool:
        try:
            response = (
                self.client.table("users")
                .select("email")
                .eq("email", email)
                .eq("auth_provider", auth_provider)
                .execute()
            )
            return len(response.data) > 0
        except APIError:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error connecting to database",
            )

    def is_username_exists(self, username: str, auth_provider: str) -> bool:
        try:
            response = (
                self.client.table("users")
                .select("username")
                .eq("username", username)
                .eq("auth_provider", auth_provider)
                .execute()
            )
            return len(response.data) > 0
        except APIError:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error connecting to database",
            )

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

        match auth_provider:
            case "email":
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
            case "google":
                new_user = User(
                    user_uid=user_uid,
                    email=email,
                    username=username,
                    auth_provider="google",
                    created_at=created_at,
                    last_active=last_active,
                    avatar=avatar,
                )
            case _:
                raise ValueError("Invalid auth provider")
        try:
            self.client.table("users").insert(new_user.dict()).execute()
        except APIError:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error connecting to database",
            )
        return user_uid

    def update_last_active(self, user_uid: str) -> None:
        last_active = datetime.now(UTC).isoformat()
        try:
            self.client.table("users").update({"last_active": last_active}).eq(
                "user_uid",
                user_uid,
            ).execute()
        except APIError:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error connecting to database",
            )

    def get_user_creds(self, email: str) -> dict:
        try:
            response = (
                self.client.table("users")
                .select("user_uid", "password")
                .eq("email", email)
                .execute()
            )
        except APIError:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error connecting to database",
            )
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return response.data[0]

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
        try:
            response = (
                self.client.table("users")
                .select("user_uid")
                .eq(field, value)
                .eq("auth_provider", auth_provider)
                .execute()
            )
        except APIError:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error connecting to database",
            )
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return response.data[0]["user_uid"]

    def get_user_info(self, user_uid: str, keys: list[str]) -> dict:
        try:
            response = self.client.table("users").select(*keys).eq("user_uid", user_uid).execute()
        except APIError:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error connecting to database",
            )
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return {key: response.data[0].get(key) for key in keys}

    def insert_new_image(
        self, user_uid: str, title: str, file_name: str, format: str, size: int, labels: list[str]
    ) -> str:
        image_uid = str(uuid4())
        created_at = datetime.now(UTC).isoformat()
        updated_at = created_at
        new_image = Image(
            image_uid=image_uid,
            user_uid=user_uid,
            title=title,
            file_name=file_name,
            format=format,
            size=size,
            labels=labels,
            created_at=created_at,
            updated_at=updated_at,
            is_deleted=False,
        )
        try:
            self.client.table("images").insert(new_image.dict()).execute()
        except APIError:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error connecting to database",
            )
        return image_uid

    def is_image_exists(self, image_uid: str) -> bool:
        try:
            response = (
                self.client.table("images").select("image_uid").eq("image_uid", image_uid).execute()
            )
            return len(response.data) > 0
        except APIError:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error connecting to database",
            )

    def get_image_info(self, image_uid: str, keys: list[str]) -> dict:
        try:
            response = (
                self.client.table("images").select(*keys).eq("image_uid", image_uid).execute()
            )
        except APIError:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error connecting to database",
            )
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
        return {key: response.data[0].get(key) for key in keys}

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
        try:
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
        except APIError:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error connecting to database",
            )
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No images found")
        return [entry["image_uid"] for entry in response.data]
