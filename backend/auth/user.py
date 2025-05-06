from typing import Optional

from fastapi import Header, HTTPException
from pydantic import BaseModel
from utils.jwt_utils import verify_clerk_token


class User(BaseModel):
    user_id: str

async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, detail="Missing or invalid Authorization header"
        )

    token = authorization.split("Bearer ")[1]
    
    user_claims = verify_clerk_token(token)
    user_id = user_claims.get("sub")
    if not user_id:
        user_id = (
            user_claims.get("id")
            or user_claims.get("user_id")
            or user_claims.get("userId")
        )
    if user_id:
        user_claims["user_id"] = user_id
    return User(**user_claims)
