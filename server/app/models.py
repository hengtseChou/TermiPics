from datetime import datetime
from uuid import UUID


class User:
    def __init__(
        self,
        user_uid: UUID,
        email: str,
        username: str,
        password: str | None = None,
        auth_provider: str | None = None,
        created_at: datetime | None = None,
        last_active: datetime | None = None,
    ):
        self.user_uid = user_uid
        self.email = email
        self.username = username
        self.password = password
        self.auth_provider = auth_provider
        self.created_at = created_at
        self.last_active = last_active
