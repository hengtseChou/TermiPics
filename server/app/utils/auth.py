from datetime import UTC, datetime, timedelta
from typing import Annotated, Any

import bcrypt
import jwt
from fastapi import Header, HTTPException, status

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


def create_access_token(user_uid: str) -> str:
    expires_delta = timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    now = datetime.now(UTC)
    expire = now + expires_delta
    data = {"sub": user_uid, "exp": expire, "iat": now}
    encoded_jwt = jwt.encode(data, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def create_refresh_token(user_uid: str) -> str:
    expires_delta = timedelta(days=JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    now = datetime.now(UTC)
    expire = now + expires_delta
    data = {"sub": user_uid, "exp": expire, "iat": now}
    encoded_jwt = jwt.encode(data, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> dict[str, Any]:
    """
    Decode the JWT token. Raise jwt exceptions if invalid.
    """
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])


def validate_token(token: str) -> dict[str, Any]:
    """
    Validate token and translate decoding errors into HTTP exceptions.
    """
    try:
        payload = decode_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    if not all(key in payload for key in ["sub", "exp", "iat"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Required claims missing"
        )
    return payload


def get_access_token(authorization: Annotated[str, Header()]) -> str:
    """
    Dependency to extract the Bearer token from the Authorization header.
    """
    if authorization is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing"
        )

    token_parts = authorization.split(" ")
    if len(token_parts) != 2 or token_parts[0] != "Bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authorization format"
        )
    return token_parts[1]  # Return the access token
