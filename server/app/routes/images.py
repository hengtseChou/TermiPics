from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.schemas import ImageUploadResponse
from app.utils.auth import decode_token, get_access_token

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
    user_uid = decode_token(access_token).get("user_uid")
    if not user_uid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    # Here you would typically save the file to a storage service
    # For demonstration, we will just return a success message
    return ImageUploadResponse(image_uid="1234567890")
