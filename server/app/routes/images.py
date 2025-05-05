import io
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Path, UploadFile, status
from fastapi.responses import StreamingResponse

from app.config import DATABASE_PROVIDER, STORAGE_PROVIDER
from app.schemas import ImageUploadResponse
from app.utils.auth import get_access_token, validate_token
from app.utils.db import SupabaseTable, UnknownDatabaseProvider
from app.utils.image import generate_thumbnail
from app.utils.storage import SupabaseStorage, UnknownStorageProvider
from app.utils.supabase import supabase_client

SUPPORTED_CONTENT_TYPES = {"image/png", "image/jpeg", "image/gif", "image/webp"}

match DATABASE_PROVIDER:
    case "supabase":
        db_client = supabase_client
        db_handler = SupabaseTable
    case _:
        raise UnknownDatabaseProvider(f"Unknown database provider: {DATABASE_PROVIDER}")

match STORAGE_PROVIDER:
    case "supabase":
        storage_client = supabase_client
        storage_handler = SupabaseStorage
    case _:
        raise UnknownStorageProvider(f"Unknown storage provider: {STORAGE_PROVIDER}")

router = APIRouter()


@router.post("/upload", status_code=status.HTTP_201_CREATED, response_model=ImageUploadResponse)
async def upload_image(
    file: Annotated[UploadFile, File(...)],
    title: Annotated[str, Form(...)],
    labels: Annotated[str, Form(...)],
    access_token: Annotated[str, Depends(get_access_token)],
):
    """
    Handle image upload.
    """
    payload = validate_token(access_token)
    user_uid = payload["sub"]
    # 1. insert new image into the database
    if file.content_type not in SUPPORTED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported or missing content type."
        )
    format = file.content_type.split("/")[1]
    file_name = file.filename if file.filename is not None else f"untitled.{format}"

    image = await file.read()
    size = len(image)
    labels_cleaned = [label.strip() for label in labels.split(",")] if labels else []

    with db_client() as client:
        db = db_handler(client)
        image_uid = db.insert_new_image(
            user_uid=user_uid,
            title=title,
            file_name=file_name,
            format=format,
            size=size,
            labels=labels_cleaned,
        )
    # 2. generate thumbnail
    thumbnail = generate_thumbnail(image)
    # 3. save image and thumbnail in storage
    with storage_client() as client:
        storage = storage_handler(client)
        storage.upload_original(image_uid=image_uid, file=image, content_type=file.content_type)
        storage.upload_thumbnail(image_uid=image_uid, file=thumbnail)
    return ImageUploadResponse(image_uid=image_uid)


@router.get("/{image_uid}")
async def get_original_image(image_uid: Annotated[str, Path(...)]):
    """
    Get original image. Open to public.
    """
    with db_client() as client:
        db = db_handler(client)
        if not db.is_image_exists(image_uid):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
        format = db.get_image_info(image_uid=image_uid, keys=["format"])["format"]
    with storage_client() as client:
        storage = storage_handler(client)
        image_bytes = storage.get_original(image_uid=image_uid, format=format)
        return StreamingResponse(io.BytesIO(image_bytes), media_type=f"image/{format}")


@router.get("/thumbnail/{image_uid}")
async def get_thumbnail(
    image_uid: Annotated[str, Path(...)], access_token: Annotated[str, Depends(get_access_token)]
):
    """
    Get thumbnail image. Should only be accessible to the owner of the image.
    """
    validate_token(access_token)
    with db_client() as client:
        db = db_handler(client)
        if not db.is_image_exists(image_uid):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    with storage_client() as client:
        storage = storage_handler(client)
        image_bytes = storage.get_thumbnail(image_uid=image_uid)
        return StreamingResponse(io.BytesIO(image_bytes), media_type="image/png")
