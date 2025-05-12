from typing import Annotated

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    Path,
    UploadFile,
    status,
)
from fastapi.responses import Response
from postgrest.exceptions import APIError

from app.dependencies.db import DatabaseClient, get_db_client, get_db_handler
from app.dependencies.storage import StorageClient, get_storage_client, get_storage_handler
from app.schemas import ImageUploadResponse
from app.utils.auth import get_access_token, validate_token
from app.utils.image import generate_thumbnail, upload_original, upload_thumbnail

SUPPORTED_CONTENT_TYPES = {"image/png", "image/jpeg", "image/gif", "image/webp"}


router = APIRouter()


@router.post("/upload", status_code=status.HTTP_201_CREATED, response_model=ImageUploadResponse)
async def upload_image(
    file: Annotated[UploadFile, File(...)],
    title: Annotated[str, Form(...)],
    labels: Annotated[str, Form(...)],
    access_token: Annotated[str, Depends(get_access_token)],
    db_client: Annotated[DatabaseClient, Depends(get_db_client)],
    storage_client: Annotated[StorageClient, Depends(get_storage_client)],
    background_tasks: BackgroundTasks,
):
    """
    Upload an image to TermiPics. Access token is required — this endpoint is only accessible to the user it belongs to.

    Form body:

        - file (jpeg/png/gif/webp)
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

    db = get_db_handler(db_client)
    try:
        image_uid = db.insert_new_image(
            user_uid=user_uid,
            title=title,
            file_name=file_name,
            format=format,
            size=size,
            labels=labels_cleaned,
        )
    except APIError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error connecting to database.",
        )
    # 2. generate thumbnail
    thumbnail = generate_thumbnail(image)
    # 3. save image and thumbnail in storage using background tasks
    background_tasks.add_task(
        upload_original,
        file=image,
        image=image_uid,
        db_client=db_client,
        storage_client=storage_client,
    )
    background_tasks.add_task(
        upload_thumbnail, file=thumbnail, image=image_uid, storage_client=storage_client
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
    except APIError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error connecting to database.",
        )

    format = db.get_image_info(image_uid=image_uid, keys=["format"])["format"]
    storage = get_storage_handler(storage_client)
    try:
        image_bytes = storage.get_original(image_uid=image_uid, format=format)
    except APIError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error connecting to storage."
        )

    return Response(content=image_bytes, media_type=f"image/{format}")


@router.get("/thumbnail/{image_uid}", status_code=status.HTTP_200_OK)
async def get_thumbnail(
    image_uid: Annotated[str, Path(...)],
    access_token: Annotated[str, Depends(get_access_token)],
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
    validate_token(access_token)
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
        thumbnail_bytes = storage.get_thumbnail(image_uid=image_uid)
    except APIError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error connecting to storage."
        )

    return Response(content=thumbnail_bytes, media_type="image/png")
