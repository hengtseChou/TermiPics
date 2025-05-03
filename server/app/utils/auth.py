from datetime import UTC, datetime, timedelta
from typing import Annotated, Any

import bcrypt
import jwt
from fastapi import Header, HTTPException

from app.config import (
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
    JWT_ALGORITHM,
    JWT_REFRESH_TOKEN_EXPIRE_DAYS,
    JWT_SECRET,
)


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed_password.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_access_token(data: dict[str, Any]) -> str:
    expires_delta = timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = datetime.now(UTC) + expires_delta
    to_encode = data.copy()
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    expires_delta = timedelta(days=JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    expire = datetime.now(UTC) + expires_delta
    to_encode = data.copy()
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> dict[str, Any]:
    """
    Decode the JWT token and return the payload.
    """
    try:
        payload: dict[str, Any] = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Could not decode the token")


def validate_token(token: str) -> dict[str, Any]:
    """
    Validate the JWT token. Check if it has expired and if it's a valid token.
    """
    payload = decode_token(token)
    if "user_uid" not in payload or "exp" not in payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    if datetime.now(UTC) > datetime.fromtimestamp(payload["exp"], UTC):
        raise HTTPException(status_code=401, detail="Token has expired")
    return payload


def get_access_token(authorization: Annotated[str, Header()]) -> str:
    """
    Dependency to extract the Bearer token from the Authorization header.
    """
    if authorization is None:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    token_parts = authorization.split(" ")
    if len(token_parts) != 2 or token_parts[0] != "Bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization format")
    return token_parts[1]  # Return the access token
