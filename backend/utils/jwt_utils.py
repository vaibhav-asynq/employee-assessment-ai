import env_variables
import jwt
from fastapi import HTTPException, status
from jwt.jwks_client import PyJWKClient

CLERK_JWKS_URL = env_variables.CLERK_JWKS_URL

jwks_client = PyJWKClient(CLERK_JWKS_URL)


def verify_clerk_token(token: str) -> dict:
    try:
        # Get the signing key from JWKS
        signing_key = jwks_client.get_signing_key_from_jwt(token)

        # Decode and verify the token
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_aud": True},
        )
        return payload
    except Exception as e:
        print(f"Error details: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {str(e)}",
        ) from e
