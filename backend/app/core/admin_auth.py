from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings
security = HTTPBearer(auto_error=False)


def check_admin_credentials(username: str, password: str) -> bool:
    return username == settings.ADMIN_USERNAME and password == settings.ADMIN_PASSWORD


def create_admin_token() -> str:
    payload = {
        "sub": "admin",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.ADMIN_JWT_EXPIRE_MINUTES),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(
        payload,
        settings.ADMIN_JWT_SECRET,
        algorithm=settings.ADMIN_JWT_ALGORITHM,
    )


def verify_admin_token(token: str) -> bool:
    try:
        jwt.decode(
            token,
            settings.ADMIN_JWT_SECRET,
            algorithms=[settings.ADMIN_JWT_ALGORITHM],
        )
        return True
    except jwt.PyJWTError:
        return False


async def require_admin(
    creds: HTTPAuthorizationCredentials | None = Depends(security),
) -> None:
    if not creds or creds.scheme != "Bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization",
        )
    if not verify_admin_token(creds.credentials):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
