import json
from functools import lru_cache

import httpx
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings

security_scheme = HTTPBearer()


@lru_cache(maxsize=1)
def _get_jwks() -> list[dict]:
    """Fetch Supabase public JWKS. Cached after first call — restart to refresh."""
    url = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
    response = httpx.get(url, timeout=10)
    response.raise_for_status()
    return response.json()["keys"]


def _get_public_key(kid: str | None) -> object:
    """Return the public key matching the token kid, or the first key."""
    keys = _get_jwks()
    if kid:
        matched = [k for k in keys if k.get("kid") == kid]
        key_data = matched[0] if matched else keys[0]
    else:
        key_data = keys[0]
    return jwt.algorithms.ECAlgorithm.from_jwk(json.dumps(key_data))


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> dict:
    token = credentials.credentials
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "ES256")
        kid = header.get("kid")

        if alg == "HS256" and settings.JWT_SECRET:
            # Legacy fallback — tokens signed with old HS256 shared secret
            payload = jwt.decode(
                token,
                settings.JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
            )
        else:
            # Current Supabase: ECC P-256 / ES256 — verified via public JWKS
            public_key = _get_public_key(kid)
            payload = jwt.decode(
                token,
                public_key,
                algorithms=["ES256"],
                audience="authenticated",
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalido.")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token sin user_id.")

    return {
        "user_id": user_id,
        "email": payload.get("email"),
        "role": payload.get("role"),
    }


async def get_raw_token(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> str:
    """Returns the raw JWT token to pass to the Supabase client."""
    return credentials.credentials
