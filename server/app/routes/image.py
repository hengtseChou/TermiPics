from datetime import UTC, datetime
from typing import Annotated

import requests
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Path,
    UploadFile,
    status,
)
from fastapi.responses import Response, StreamingResponse
from postgrest.exceptions import APIError

from app.dependencies.db import DatabaseClient, get_db_client, get_db_handler
from app.dependencies.storage import StorageClient, get_storage_client, get_storage_handler
from app.schemas import ImageInfoResponse, ImageUploadResponse
from app.utils.auth import get_access_token, validate_token
from app.utils.image import (
    enable_image_streaming,
    generate_thumbnail,
)

SUPPORTED_CONTENT_TYPES = {"image/png", "image/jpeg"}


router = APIRouter()


@router.post("/upload", status_code=status.HTTP_201_CREATED, response_model=ImageUploadResponse)
async def upload_image(
    file: Annotated[UploadFile, File(...)],
    title: Annotated[str, Form(...)],
    labels: Annotated[str, Form(...)],
    access_token: Annotated[str, Depends(get_access_token)],
    db_client: Annotated[DatabaseClient, Depends(get_db_client)],
    storage_client: Annotated[StorageClient, Depends(get_storage_client)],
):
    """
    Upload an image to TermiPics. Access token is required — this endpoint is only accessible to the user it belongs to.

    Form body:

        - file (jpeg/png)
            The image file to be uploaded.
        - title (str)
            Little something to describe this image.
        - labels (str)
            Comma-separated labels for the image.

    Response:

        - image_id (str)
            UID of the newly uploaded image.
    """
    payload = validate_token(access_token)
    user_uid = payload["sub"]

    # 1. enable image streaming
    if file.content_type not in SUPPORTED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported or missing content type."
        )
    file_name = file.filename
    content_type = file.content_type

    image = await file.read()
    image = enable_image_streaming(image, content_type)
    labels_cleaned = [label.strip() for label in labels.split(",")] if labels else []

    # 2. insert new image into the database
    db = get_db_handler(db_client)
    try:
        image_uid = db.insert_new_image(
            user_uid=user_uid,
            title=title,
            file_name=file_name,
            content_type=content_type,
            size=len(image),
            labels=labels_cleaned,
        )
        user_info = db.get_user_info(user_uid=user_uid, keys=["image_count", "labels"])
        current_image_count = user_info.get("image_count")
        user_labels = list(set(user_info.get("labels")) | set(labels_cleaned))
        db.update_user_info(
            user_uid=user_uid,
            data={
                "image_count": current_image_count + 1,
                "last_active": datetime.now(UTC).isoformat(),
                "labels": user_labels,
            },
        )
    except APIError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error connecting to database.",
        )

    # 3. generate thumbnail
    thumbnail = generate_thumbnail(image)
    # 4. save image and thumbnail in storage
    storage = get_storage_handler(storage_client)
    storage.upload_original(image_uid=image_uid, file=image, content_type=content_type)
    storage.upload_thumbnail(
        image_uid=image_uid,
        file=thumbnail,
    )

    return ImageUploadResponse(image_uid=image_uid)


@router.get("/{image_uid}", status_code=status.HTTP_200_OK)
async def get_original_image(
    image_uid: Annotated[str, Path(...)],
    db_client: Annotated[DatabaseClient, Depends(get_db_client)],
    storage_client: Annotated[StorageClient, Depends(get_storage_client)],
):
    """
    Retrieve the uploaded image by image UID. This endpoint is open to public.

    Response:

        - The requested image in bytes.
    """
    db = get_db_handler(db_client)
    try:
        if not db.is_image_exists(image_uid):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
        content_type = db.get_image_info(image_uid, keys=["content_type"]).get("content_type")
    except APIError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error connecting to database.",
        )

    storage = get_storage_handler(storage_client)
    try:
        image_url = storage.get_original_url(image_uid=image_uid)
        r = requests.get(image_url, stream=True)
    except APIError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error connecting to storage."
        )

    return StreamingResponse(r.raw, media_type=content_type)


@router.get("/thumbnail/{image_uid}", status_code=status.HTTP_200_OK)
async def get_thumbnail(
    image_uid: Annotated[str, Path(...)],
    db_client: Annotated[DatabaseClient, Depends(get_db_client)],
    storage_client: Annotated[StorageClient, Depends(get_storage_client)],
):
    """
    Retrieve the thumbnail of the uploaded image by image UID. Access token is required — this endpoint is only accessible to the user it belongs to.

    Header Parameters:

        - Authorization: Bearer <access_token>

    Response:

        - The thumbnail of the requested image in bytes.
    """
    db = get_db_handler(db_client)
    try:
        if not db.is_image_exists(image_uid):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    except APIError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error connecting to database.",
        )

    storage = get_storage_handler(storage_client)
    try:
        image_url = storage.get_thumbnail_url(image_uid)
        r = requests.get(image_url)
    except APIError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error connecting to storage."
        )

    return Response(r.content, media_type="image/png")


@router.get("/info/{image_uid}", status_code=status.HTTP_200_OK, response_model=ImageInfoResponse)
async def get_image_info(
    image_uid: Annotated[str, Path(...)],
    access_token: Annotated[str, Depends(get_access_token)],
    db_client: Annotated[DatabaseClient, Depends(get_db_client)],
):
    validate_token(access_token)
    db = get_db_handler(db_client)
    try:
        if not db.is_image_exists(image_uid):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
        image_info = db.get_image_info(
            image_uid=image_uid, keys=["title", "file_name", "labels", "created_at", "updated_at"]
        )
    except APIError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error connecting to database.",
        )
    return ImageInfoResponse(**image_info)
