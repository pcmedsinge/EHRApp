"""
Security Module
===============

Purpose:
    Password hashing and JWT token management.
    Uses Argon2 for password hashing (OWASP recommended).

Module: app/core/security.py
Phase: 1C (Auth Backend)

References:
    - Auth Flow: docs/phases/phase1/diagrams/auth-flow.md
    - Phase 1C Spec: docs/phases/phase1/Phase1C_AuthBackend.md

Functions:
    - verify_password(): Validate password against hash
    - get_password_hash(): Create password hash
    - create_access_token(): Generate JWT token
    - verify_token(): Validate and decode JWT

Security Notes:
    - Argon2 used instead of bcrypt (no 72-byte limit)
    - JWT tokens include user_id and role claims
    - Token expiry configurable via settings
"""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# Password hashing context (using argon2 for better security and no bcrypt 72-byte limit)
pwd_context = CryptContext(
    schemes=["argon2", "bcrypt"],
    deprecated="auto",
    argon2__memory_cost=65536,
    argon2__time_cost=3,
    argon2__parallelism=4
)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Dictionary containing claims to encode
        expires_delta: Token expiration time
        
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decode and verify a JWT access token.
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded token payload or None if invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None
