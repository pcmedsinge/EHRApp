from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password


class AuthService:
    """Authentication and user management service"""
    
    @staticmethod
    async def get_user_by_username(db: AsyncSession, username: str) -> Optional[User]:
        """Get user by username"""
        result = await db.execute(
            select(User).where(User.username == username, User.is_deleted == False)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
        """Get user by email"""
        result = await db.execute(
            select(User).where(User.email == email, User.is_deleted == False)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
        """Get user by ID"""
        result = await db.execute(
            select(User).where(User.id == user_id, User.is_deleted == False)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def create_user(db: AsyncSession, user_data: UserCreate) -> User:
        """Create a new user"""
        # Check if username exists
        existing_user = await AuthService.get_user_by_username(db, user_data.username)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
        
        # Check if email exists
        existing_email = await AuthService.get_user_by_email(db, user_data.email)
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create user
        user = User(
            username=user_data.username,
            email=user_data.email,
            full_name=user_data.full_name,
            role=user_data.role,
            password_hash=get_password_hash(user_data.password),
            is_active=True,
        )
        
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        return user
    
    @staticmethod
    async def authenticate_user(db: AsyncSession, username: str, password: str) -> Optional[User]:
        """Authenticate user with username and password"""
        user = await AuthService.get_user_by_username(db, username)
        
        if not user:
            return None
        
        if not user.is_active:
            return None
        
        if not verify_password(password, user.password_hash):
            return None
        
        return user
    
    @staticmethod
    async def update_user(db: AsyncSession, user_id: str, user_update: UserUpdate) -> User:
        """Update user information"""
        user = await AuthService.get_user_by_id(db, user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update fields
        if user_update.email is not None:
            # Check if new email is already taken by another user
            existing = await AuthService.get_user_by_email(db, user_update.email)
            if existing and existing.id != user.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            user.email = user_update.email
        
        if user_update.full_name is not None:
            user.full_name = user_update.full_name
        
        if user_update.password is not None:
            user.password_hash = get_password_hash(user_update.password)
        
        if user_update.is_active is not None:
            user.is_active = user_update.is_active
        
        await db.commit()
        await db.refresh(user)
        
        return user
