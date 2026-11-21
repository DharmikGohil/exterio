import bcrypt

from domain.interfaces.services.security_service import IPasswordHasher

# bcrypt ignores everything past 72 bytes; truncate explicitly instead of failing.
BCRYPT_MAX_BYTES = 72


class BcryptPasswordHasher(IPasswordHasher):
    def hash(self, password: str) -> str:
        return bcrypt.hashpw(self._encode(password), bcrypt.gensalt()).decode("ascii")

    def verify(self, password: str, password_hash: str) -> bool:
        try:
            return bcrypt.checkpw(self._encode(password), password_hash.encode("ascii"))
        except ValueError:
            return False

    @staticmethod
    def _encode(password: str) -> bytes:
        return password.encode("utf-8")[:BCRYPT_MAX_BYTES]
