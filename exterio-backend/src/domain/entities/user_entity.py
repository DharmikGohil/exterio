"""User entity."""

from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class User:
    id: str
    name: str
    is_guest: bool
    created_at: datetime
    email: str | None = None
    password_hash: str | None = None
