from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse

from app.utils.auth import decode_token, get_access_token
from app.utils.db import SupabaseTable, supabase_client

router = APIRouter()


@router.get("/info", status_code=status.HTTP_200_OK)
async def get_user_info(keys: str, access_token: str = Depends(get_access_token)):
    user_uid = decode_token(access_token).get("user_uid")
    if not user_uid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    with supabase_client() as client:
        supabase = SupabaseTable(client)
        keys = keys.split(",")
        user_data = supabase.get_user_info_by_keys(user_uid, keys)
    return JSONResponse(user_data)
