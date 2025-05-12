from io import BytesIO

from PIL import Image, UnidentifiedImageError

from app.dependencies.db import DatabaseClient, get_db_handler
from app.dependencies.storage import StorageClient, get_storage_handler

SUPPORTED_FORMATS = {"PNG", "JPEG", "GIF", "WEBP"}


class UnsupportedFormatError(Exception):
    pass


def generate_thumbnail(image_bytes: bytes) -> bytes:
    """
    Crop image to center square and resize to 128x128 (upscaling if needed).
    Supports PNG, JPEG, GIF (first frame), and WEBP.

    Returns:
        - thumbnail_bytes: the thumbnail as raw bytes
    """
    try:
        image = Image.open(BytesIO(image_bytes))
    except UnidentifiedImageError:
        raise UnsupportedFormatError("Cannot identify image format.")

    if image.format is not None and image.format.upper() not in SUPPORTED_FORMATS:
        raise UnsupportedFormatError(f"Unsupported format: {image.format}")

    # Use first frame for animated formats
    if getattr(image, "is_animated", False):
        image.seek(0)

    # Convert mode if needed (e.g., GIF might be P-mode)
    if image.mode not in ("RGB", "RGBA"):
        image = image.convert("RGBA" if "transparency" in image.info else "RGB")

    width, height = image.size
    min_dim = min(width, height)
    left = (width - min_dim) // 2
    top = (height - min_dim) // 2
    image_cropped = image.crop((left, top, left + min_dim, top + min_dim))

    thumbnail = image_cropped.resize((128, 128), Image.Resampling.LANCZOS)
    buffer = BytesIO()
    thumbnail.save(buffer, format="PNG")

    return buffer.getvalue()


def upload_original(
    file: bytes, image_uid: str, db_client: DatabaseClient, storage_client: StorageClient
) -> None:
    db = get_db_handler(db_client)
    format = db.get_image_info(image_uid=image_uid, keys=["format"])
    storage = get_storage_handler(storage_client)
    storage.upload_original(image_uid=image_uid, file=file, content_type=format)


def upload_thumbnail(file: bytes, image_uid: str, storage_client: StorageClient) -> None:
    storage = get_storage_handler(storage_client)
    storage.upload_thumbnail(image_uid=image_uid, file=file)
