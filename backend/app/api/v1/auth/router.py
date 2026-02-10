from datetime import timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.config import settings
from app.core.security import create_access_token, decode_access_token
from app.api.v1.auth.schemas import Token, LoginRequest, RegisterRequest
from app.api.v1.auth.service import AuthService
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.models.user import User, UserRole

router = APIRouter()

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token", auto_error=False)


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Dependency to get current authenticated user from JWT token.
    Use this in protected endpoints: current_user: User = Depends(get_current_user)
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Decode token
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception
    
    # Get user from database
    user = await AuthService.get_user_by_username(db, username)
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    return user


async def get_current_user_optional(
    token: Annotated[str | None, Depends(oauth2_scheme)] = None,
    db: AsyncSession = Depends(get_db)
) -> User | None:
    """
    Dependency to get current authenticated user from JWT token.
    Returns None if no token is provided (optional authentication).
    Use this in endpoints that work with or without authentication.
    """
    if not token:
        return None
    
    try:
        # Decode token
        payload = decode_access_token(token)
        if payload is None:
            return None
        
        username: str = payload.get("sub")
        if username is None:
            return None
        
        # Get user from database
        user = await AuthService.get_user_by_username(db, username)
        if user is None:
            return None
        
        if not user.is_active:
            return None
        
        return user
    except Exception:
        return None


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    """Dependency to ensure user is active"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: RegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user.
    
    - **username**: Unique username (3-50 characters)
    - **email**: Valid email address
    - **password**: Password (minimum 6 characters)
    - **full_name**: User's full name
    - **role**: User role (admin, doctor, nurse, receptionist)
    """
    # Convert RegisterRequest to UserCreate
    user_create = UserCreate(
        username=user_data.username,
        email=user_data.email,
        password=user_data.password,
        full_name=user_data.full_name,
        role=UserRole(user_data.role)
    )
    
    user = await AuthService.create_user(db, user_create)
    return user


@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: AsyncSession = Depends(get_db)
):
    """
    OAuth2 compatible token login, get an access token for future requests.
    
    Use this endpoint in Swagger UI's "Authorize" button.
    """
    user = await AuthService.authenticate_user(db, form_data.username, form_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "user_id": str(user.id)},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login", response_model=Token)
async def login(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Login with username and password, get JWT token.
    
    - **username**: Your username
    - **password**: Your password
    
    Returns JWT token to use in Authorization header: `Bearer <token>`
    """
    user = await AuthService.authenticate_user(db, login_data.username, login_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "user_id": str(user.id)},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """
    Get current user information.
    
    Requires authentication token in header: `Authorization: Bearer <token>`
    """
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db)
):
    """
    Update current user information.
    
    - **email**: New email address (optional)
    - **full_name**: New full name (optional)
    - **password**: New password (optional)
    """
    updated_user = await AuthService.update_user(db, str(current_user.id), user_update)
    return updated_user
