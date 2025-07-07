from io import BytesIO

from PIL import Image, ImageFile, UnidentifiedImageError

from app.dependencies.db import DatabaseClient, get_db_handler
from app.dependencies.storage import StorageClient, get_storage_handler

SUPPORTED_FORMATS = {"PNG", "JPEG"}
THUMBNAIL_SIZE = (400, 225)


class UnsupportedFormat(Exception):
    pass


def generate_thumbnail(image_bytes: bytes) -> bytes:
    """
    Crop image to center 16:9 aspect ratio and resize if larger than THUMBNAIL_SIZE.
    Supports PNG, JPEG.

    Returns:
        - thumbnail_bytes: the thumbnail as raw bytes
    """
    try:
        image = Image.open(BytesIO(image_bytes))
    except UnidentifiedImageError:
        raise UnsupportedFormat("Cannot identify image format.")

    if image.format.upper() not in SUPPORTED_FORMATS:
        raise UnsupportedFormat(f"Unsupported format: {image.format}")

    width, height = image.size
    target_aspect_ratio = THUMBNAIL_SIZE[0] / THUMBNAIL_SIZE[1]

    # Calculate cropping dimensions for 16:9 aspect ratio
    if width / height > target_aspect_ratio:
        new_width = int(height * target_aspect_ratio)
        left = (width - new_width) // 2
        top = 0
        right = left + new_width
        bottom = height
    else:
        new_height = int(width / target_aspect_ratio)
        left = 0
        top = (height - new_height) // 2
        right = width
        bottom = top + new_height

    cropped = image.crop((left, top, right, bottom))

    # Resize only if the image is larger than THUMBNAIL_SIZE
    if cropped.size[0] > THUMBNAIL_SIZE[0] or cropped.size[1] > THUMBNAIL_SIZE[1]:
        cropped = cropped.resize(THUMBNAIL_SIZE, Image.Resampling.LANCZOS)

    buffer = BytesIO()
    cropped.save(buffer, format="PNG")

    return buffer.getvalue()


def is_streaming_optimized(image: ImageFile, content_type: str) -> bool:
    if content_type == "image/jpeg":
        return image.info.get("progressive", False)
    elif content_type == "image/png":
        return image.info.get("interlace", False)
    else:
        raise ValueError(f"Unsupported content type: {content_type}")


def enable_image_streaming(image_bytes: bytes, content_type: str) -> bytes:
    """
    Convert image bytes into a progressive JPEG or interlaced PNG,
    preserving transparency and format when appropriate.

    Returns:
        Converted image bytes.
    """
    image = Image.open(BytesIO(image_bytes))
    if is_streaming_optimized(image, content_type):
        return image_bytes

    buffer = BytesIO()
    if content_type == "image/jpeg":
        image.save(buffer, format="JPEG", progressive=True)
    elif content_type == "image/png":
        image.save(buffer, format="PNG", interlace=True)
    else:
        raise ValueError(f"Unsupported content type: {content_type}")

    return buffer.getvalue()


def upload_original(
    file: bytes, image_uid: str, db_client: DatabaseClient, storage_client: StorageClient
) -> None:
    db = get_db_handler(db_client)
    content_type = db.get_image_info(image_uid=image_uid, keys=["content_type"]).get("content_type")
    storage = get_storage_handler(storage_client)
    storage.upload_original(image_uid=image_uid, file=file, content_type=content_type)
    db.update_image_info(image_uid=image_uid, data={"is_uploaded": True})


def upload_thumbnail(
    file: bytes, image_uid: str, db_client: DatabaseClient, storage_client: StorageClient
) -> None:
    storage = get_storage_handler(storage_client)
    storage.upload_thumbnail(image_uid=image_uid, file=file)
    db = get_db_handler(db_client)
    db.update_image_info(image_uid=image_uid, data={"is_thumbnail_uploaded": True})
