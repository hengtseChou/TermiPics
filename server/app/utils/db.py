from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from fastapi import HTTPException
from postgrest.exceptions import APIError
from supabase import create_client

from app.config import SUPABASE_KEY, SUPABASE_URL
from app.utils.auth import hash_password


@contextmanager
def supabase_client(url, key):
    client = create_client(url, key)
    try:
        yield client
    finally:
        pass


def is_email_exists(email: str, auth_provider: str) -> bool:
    """
    Check if the email is in the database.
    """
    with supabase_client(SUPABASE_URL, SUPABASE_KEY) as supabase:
        if auth_provider == "email":
            response = (
                supabase.table("users")
                .select("email")
                .eq("email", email)
                .eq("auth_provider", "email")
                .execute()
            )
        elif auth_provider == "google":
            response = (
                supabase.table("users")
                .select("email")
                .eq("email", email)
                .eq("auth_provider", "google")
                .execute()
            )
        else:
            response = supabase.table("users").select("email").eq("email", email).execute()
        return len(response.data) > 0


def is_username_exists(username: str, auth_provider: str) -> bool:
    """
    Check if the username is in the database.
    """
    with supabase_client(SUPABASE_URL, SUPABASE_KEY) as supabase:
        if auth_provider == "email":
            response = (
                supabase.table("users")
                .select("username")
                .eq("username", username)
                .eq("auth_provider", "email")
                .execute()
            )
        elif auth_provider == "google":
            response = (
                supabase.table("users")
                .select("username")
                .eq("username", username)
                .eq("auth_provider", "google")
                .execute()
            )
        else:
            response = supabase.table("users").select("username").eq("username", username).execute()
        return len(response.data) > 0


def insert_new_user(
    email: str,
    username: str,
    auth_provider: str,
    password: Optional[str] = None,
    avatar: Optional[str] = None,
) -> str:
    """
    Insert a new user into the database. The function willl generate and return an user_uid, if successful.
    """
    user_uid = str(uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    last_active = created_at

    if auth_provider == "email":
        hashed_password = hash_password(password)
        with supabase_client(SUPABASE_URL, SUPABASE_KEY) as supabase:
            try:
                supabase.table("users").insert(
                    {
                        "user_uid": user_uid,
                        "email": email,
                        "username": username,
                        "password": hashed_password,
                        "auth_provider": "email",
                        "created_at": created_at,
                        "last_active": last_active,
                    }
                ).execute()
            except APIError:
                raise HTTPException(status_code=500, detail="Error connecting to database")
        return user_uid

    elif auth_provider == "google":
        with supabase_client(SUPABASE_URL, SUPABASE_KEY) as supabase:
            try:
                supabase.table("users").insert(
                    {
                        "user_uid": user_uid,
                        "email": email,
                        "username": username,
                        "auth_provider": "google",
                        "created_at": created_at,
                        "last_active": last_active,
                        "avatar": avatar,
                    }
                ).execute()
            except APIError:
                raise HTTPException(status_code=500, detail="Error connecting to database")
        return user_uid

    else:
        raise HTTPException(status_code=400, detail="Invalid provider")


def update_last_active(user_uid: str) -> None:
    """
    Update the last active time of the user.
    """
    last_active = datetime.now(timezone.utc).isoformat()
    with supabase_client(SUPABASE_URL, SUPABASE_KEY) as supabase:
        try:
            supabase.table("users").update({"last_active": last_active}).eq(
                "user_uid", user_uid
            ).execute()
        except APIError:
            raise HTTPException(status_code=500, detail="Error connecting to database")


def get_user_creds(email: str) -> dict:
    """
    Get the user credentials.
    """
    with supabase_client(SUPABASE_URL, SUPABASE_KEY) as supabase:
        response = (
            supabase.table("users").select("user_uid", "password").eq("email", email).execute()
        )
    if not response.data:
        return {}
    return response.data[0]


def get_user_uid(email: str, auth_provider: str) -> str:
    """
    Get the user_uid from the email.
    """
    with supabase_client(SUPABASE_URL, SUPABASE_KEY) as supabase:
        response = (
            supabase.table("users")
            .select("user_uid")
            .eq("email", email)
            .eq("auth_provider", auth_provider)
            .execute()
        )
    if not response.data:
        return ""
    return response.data[0]["user_uid"]
