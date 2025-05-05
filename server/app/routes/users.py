from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.config import DATABASE_PROVIDER
from app.schemas import UserInfoResponse
from app.utils.auth import get_access_token, validate_token
from app.utils.db import SupabaseTable, UnknownDatabaseProvider
from app.utils.supabase import supabase_client

match DATABASE_PROVIDER:
    case "supabase":
        db_client = supabase_client
        db_handler = SupabaseTable
    case _:
        raise UnknownDatabaseProvider(f"Unknown database provider: {DATABASE_PROVIDER}")

router = APIRouter()


@router.get("/info", status_code=status.HTTP_200_OK, response_model=UserInfoResponse)
async def get_user_info(
    keys: Annotated[str, Query(..., description="Comma-separated keys to retrieve")],
    access_token: Annotated[str, Depends(get_access_token)],
):
    payload = validate_token(access_token)
    user_uid = payload.get("sub")
    if not user_uid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")
    with db_client() as client:
        db = db_handler(client)
        query_keys = keys.split(",")
        user_data = db.get_user_info(user_uid, query_keys)
    return UserInfoResponse(**user_data)


@router.get("/images", status_code=status.HTTP_200_OK)
async def get_images(
    page: Annotated[int, Query(...)],
    sort_by: Annotated[str, Query(...)],
    sort_order: Annotated[str, Query(...)],
    labels: Annotated[str, Query(...)],
    access_token: Annotated[str, Depends(get_access_token)],
):
    """
    Filter and retrieve image uid.
    """
    payload = validate_token(access_token)
    user_uid = payload.get("sub")
    if not user_uid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")
    with db_client() as client:
        db = db_handler(client)
        labels_cleaned = [label.strip() for label in labels.split(",")] if labels else []
        image_uids = db.filter_images(
            user_uid=user_uid,
            page=page,
            sort_by=sort_by,
            sort_order=sort_order,
            labels=labels_cleaned,
        )
    return image_uids
