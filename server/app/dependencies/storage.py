from abc import ABC, abstractmethod
from typing import Union

from fastapi import HTTPException, status
from postgrest.exceptions import APIError
from supabase.client import Client as SupabaseClient

from app.config import STORAGE_PROVIDER
from app.utils.supabase import supabase_client

type StorageClient = Union[SupabaseClient]


class UnknownStorageProvider(Exception):
    pass


class StorageOperator(ABC):
    def __init__(self, client):
        self.client = client

    @abstractmethod
    def upload_original(self, image_uid: str, file: bytes, content_type: str):
        pass

    @abstractmethod
    def upload_thumbnail(self, image_uid: str, file: bytes):
        pass

    @abstractmethod
    def get_original(self, image_uid: str, format: str) -> bytes:
        pass

    @abstractmethod
    def get_thumbnail(self, image_uid: str):
        pass

    @abstractmethod
    def delete_original(self, image_uid: str):
        pass

    @abstractmethod
    def delete_thumbnail(self, image_uid: str):
        pass


class SupabaseStorage(StorageOperator):
    def __init__(self, client: SupabaseClient):
        super().__init__(client)

    def upload_original(self, image_uid: str, file: bytes, content_type: str):
        try:
            self.client.storage.from_("images").upload(
                path=f"original/{image_uid}",
                file=file,
                file_options={"content-type": content_type},
            )
        except APIError:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error connecting to database",
            )

    def upload_thumbnail(self, image_uid: str, file: bytes):
        try:
            self.client.storage.from_("images").upload(
                path=f"thumbnail/{image_uid}",
                file=file,
                file_options={"content-type": "image/png"},
            )
        except APIError:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error connecting to database",
            )

    def get_original(self, image_uid: str) -> bytes:
        try:
            response = self.client.storage.from_("images").download(path=f"original/{image_uid}")
            return response
        except APIError:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error connecting to database",
            )

    def get_thumbnail(self, image_uid: str):
        try:
            response = self.client.storage.from_("images").download(path=f"thumbnail/{image_uid}")
            return response
        except APIError:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error connecting to database",
            )

    def delete_original(self, image_uid: str):
        pass

    def delete_thumbnail(self, image_uid: str):
        pass


match STORAGE_PROVIDER:
    case "supabase":
        get_storage_client = supabase_client
        get_storage_handler = SupabaseStorage
    case _:
        raise UnknownStorageProvider(f"Unknown storage provider: {STORAGE_PROVIDER}")
