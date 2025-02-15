from datetime import datetime
from uuid import UUID


class User:
    def __init__(
        self,
        user_uid: UUID,
        email: str,
        username: str,
        password: str = None,
        auth_provider: str = None,
        created_at: datetime = None,
        last_active: datetime = None,
    ):
        self.user_uid = user_uid
        self.email = email
        self.username = username
        self.password = password
        self.auth_provider = auth_provider
        self.created_at = created_at
        self.last_active = last_active
