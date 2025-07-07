from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from postgrest.exceptions import APIError

from app.dependencies.db import DatabaseClient, get_db_client, get_db_handler
from app.models import User
from app.schemas import (
    ImageQueryRequest,
    ImageQueryResponse,
    UserInfoQueryRequest,
    UserInfoResponse,
)
from app.utils.auth import get_access_token, validate_token

router = APIRouter()


@router.get("/info", status_code=status.HTTP_200_OK, response_model=UserInfoResponse)
async def get_user_info(
    request: Annotated[UserInfoQueryRequest, Query(...)],
    access_token: Annotated[str, Depends(get_access_token)],
    db_client: Annotated[DatabaseClient, Depends(get_db_client)],
):
    """
    Retrieve user info. Access token is required — this endpoint is only accessible to the user it belongs to.

    Query Parameters:

        - keys (str)
            Comma-separated list of user fields to retrieve.

    Possible keys:

        - user_uid (str): User UID.
        - email (str): User's email.
        - username (str): Display name.
        - created_at (str): Account creation time.
        - last_active (str): Last active timestamp.
        - auth_provider (str): "email" (default) or "google".
        - password (str): Hashed password.
        - avatar (str): Avatar URL.
        - image_count (int): Total images.
        - labels (list[str]): Labels from uploaded images.
        - is_premium (bool): Whether the user has premium access.

    Header Parameters:

        - Authorization: Bearer <access_token>

    Response:

        - <key>: <value> pairs for the requested fields.
    """
    payload = validate_token(access_token)
    user_uid = payload.get("sub")
    if not user_uid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")
    keys = [key.strip() for key in request.keys.split(",")] if request.keys else []
    keys_available = User.model_fields.keys()
    for key in keys:
        if key not in keys_available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unrecognized key: {key}"
            )
    db = get_db_handler(db_client)
    try:
        user_data = db.get_user_info(user_uid=user_uid, keys=keys)
    except APIError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error connecting to database.",
        )

    return UserInfoResponse(**user_data)


@router.get("/images", status_code=status.HTTP_200_OK, response_model=ImageQueryResponse)
async def query_images(
    request: Annotated[ImageQueryRequest, Query(...)],
    access_token: Annotated[str, Depends(get_access_token)],
    db_client: Annotated[DatabaseClient, Depends(get_db_client)],
):
    """
    Filter and retrieve image UIDs. Access token is required — this endpoint is only accessible to the user it belongs to.

    Query Parameters:

        - page (int)
            Page number for pagination. Each page returns up to 50 images.
        - sort_by (str)
            Sort field. Options: "title", "created_at", "updated_at".
        - sort_order (str)
            Sort direction. Options: "desc" (descending), "asc" (ascending).
        - labels (str)
            Comma-separated list of labels to filter images by.

    Header Parameters:

        - Authorization: Bearer <access_token>

    Response:

        - image_uid (list[str])
            A list of image UIDs matching the filters.
    """
    payload = validate_token(access_token)
    user_uid = payload.get("sub")
    if not user_uid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")
    labels = [label.strip() for label in request.labels.split(",")] if request.labels else []
    db = get_db_handler(db_client)
    try:
        image_uid = db.filter_images(
            user_uid=user_uid,
            page=request.page,
            sort_by=request.sort_by,
            sort_order=request.sort_order,
            labels=labels,
        )
    except APIError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error connecting to database.",
        )
    if not image_uid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No image can be found.")

    return ImageQueryResponse(image_uid=image_uid)
