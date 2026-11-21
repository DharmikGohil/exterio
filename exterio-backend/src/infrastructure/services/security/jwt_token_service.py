from datetime import UTC, datetime, timedelta

import jwt

from domain.interfaces.services.security_service import ITokenService

ALGORITHM = "HS256"


class JwtTokenService(ITokenService):
    def __init__(self, secret: str, expiry_days: int) -> None:
        self._secret = secret
        self._expiry = timedelta(days=expiry_days)

    def issue(self, user_id: str) -> str:
        now = datetime.now(UTC)
        payload = {"sub": user_id, "iat": now, "exp": now + self._expiry}
        return jwt.encode(payload, self._secret, algorithm=ALGORITHM)

    def verify(self, token: str) -> str | None:
        try:
            payload = jwt.decode(token, self._secret, algorithms=[ALGORITHM])
        except jwt.PyJWTError:
            return None
        subject = payload.get("sub")
        return subject if isinstance(subject, str) else None
