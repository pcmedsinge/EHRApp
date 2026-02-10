# Phase 1C: Authentication Backend

**Sub-Phase:** 1C  
**Estimated Time:** 4-5 hours  
**Prerequisites:** Phase 1B Complete

---

## 1. Objective

Implement complete authentication system with user management, JWT tokens, password hashing, and authentication endpoints.

---

## 2. Deliverables

- [ ] User SQLAlchemy model with roles
- [ ] User Pydantic schemas
- [ ] Password hashing utilities
- [ ] JWT token utilities
- [ ] Authentication service
- [ ] Authentication endpoints
- [ ] Database migration for users table
- [ ] Working login/register via Swagger

---

## 3. Files to Create

```
backend/app/
├── core/
│   └── security.py              # Password & JWT utilities
├── models/
│   └── user.py                  # User SQLAlchemy model
├── schemas/
│   └── user.py                  # User Pydantic schemas
└── api/v1/
    └── auth/
        ├── __init__.py
        ├── router.py            # Auth endpoints
        ├── schemas.py           # Auth-specific schemas
        └── service.py           # Auth business logic
```

---

## 4. Implementation

### Step 1: Security Utilities

File: `backend/app/core/security.py`

```python
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


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
```

---

### Step 2: User Model

File: `backend/app/models/user.py`

```python
from sqlalchemy import Column, String, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from app.models.base import BaseModel


class UserRole(str, enum.Enum):
    """User role enumeration"""
    ADMIN = "admin"
    DOCTOR = "doctor"
    NURSE = "nurse"
    RECEPTIONIST = "receptionist"


class User(BaseModel):
    """User model for authentication and authorization"""
    
    __tablename__ = "users"
    
    username = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )
    
    email = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )
    
    password_hash = Column(
        String(255),
        nullable=False,
    )
    
    full_name = Column(
        String(100),
        nullable=False,
    )
    
    role = Column(
        SQLEnum(UserRole),
        nullable=False,
        default=UserRole.RECEPTIONIST,
    )
    
    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
    )
    
    def __repr__(self):
        return f"<User {self.username} ({self.role})>"
```

---

### Step 3: User Schemas

File: `backend/app/schemas/user.py`

```python
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID

from app.models.user import UserRole


class UserBase(BaseModel):
    """Base user schema with common fields"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    role: UserRole = UserRole.RECEPTIONIST


class UserCreate(UserBase):
    """Schema for creating a new user"""
    password: str = Field(..., min_length=8, max_length=100)


class UserUpdate(BaseModel):
    """Schema for updating user"""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserInDB(UserBase):
    """Schema for user in database"""
    id: UUID
    password_hash: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    is_deleted: bool
    
    model_config = ConfigDict(from_attributes=True)


class UserResponse(UserBase):
    """Schema for user response (without sensitive data)"""
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
```

---

### Step 4: Auth Schemas

File: `backend/app/api/v1/auth/schemas.py`

```python
from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    """Schema for login request"""
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=8)


class TokenResponse(BaseModel):
    """Schema for token response"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    user: dict  # UserResponse
```

---

### Step 5: Auth Service

File: `backend/app/api/v1/auth/service.py`

```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from datetime import timedelta
from typing import Optional

from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token,
)
from app.core.config import settings


class AuthService:
    """Authentication service with business logic"""
    
    @staticmethod
    async def register_user(
        db: AsyncSession,
        user_data: UserCreate
    ) -> User:
        """
        Register a new user.
        
        Args:
            db: Database session
            user_data: User creation data
            
        Returns:
            Created user
            
        Raises:
            HTTPException: If username or email already exists
        """
        # Check if username exists
        stmt = select(User).where(User.username == user_data.username)
        result = await db.execute(stmt)
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
        
        # Check if email exists
        stmt = select(User).where(User.email == user_data.email)
        result = await db.execute(stmt)
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create new user
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
    async def authenticate_user(
        db: AsyncSession,
        username: str,
        password: str
    ) -> Optional[User]:
        """
        Authenticate a user with username and password.
        
        Args:
            db: Database session
            username: Username
            password: Plain password
            
        Returns:
            User if authenticated, None otherwise
        """
        stmt = select(User).where(User.username == username)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            return None
        
        if not user.is_active:
            return None
        
        if not verify_password(password, user.password_hash):
            return None
        
        return user
    
    @staticmethod
    def create_token_response(user: User) -> dict:
        """
        Create token response for authenticated user.
        
        Args:
            user: Authenticated user
            
        Returns:
            Token response dictionary
        """
        access_token_expires = timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
        access_token = create_access_token(
            data={"sub": user.username, "user_id": str(user.id)},
            expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "user": {
                "id": str(user.id),
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
                "is_active": user.is_active,
            }
        }
    
    @staticmethod
    async def get_current_user(
        db: AsyncSession,
        token: str
    ) -> Optional[User]:
        """
        Get current user from JWT token.
        
        Args:
            db: Database session
            token: JWT token
            
        Returns:
            User if token valid, None otherwise
        """
        payload = decode_access_token(token)
        if not payload:
            return None
        
        username: str = payload.get("sub")
        if not username:
            return None
        
        stmt = select(User).where(User.username == username)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        
        return user if user and user.is_active else None
```

---

### Step 6: Auth Router

File: `backend/app/api/v1/auth/router.py`

```python
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from app.core.database import get_db
from app.schemas.user import UserCreate, UserResponse
from app.api.v1.auth.schemas import LoginRequest, TokenResponse
from app.api.v1.auth.service import AuthService

router = APIRouter()

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: AsyncSession = Depends(get_db)
):
    """Dependency to get current authenticated user"""
    user = await AuthService.get_current_user(db, token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user.
    
    - **username**: Unique username (3-50 chars)
    - **email**: Valid email address
    - **password**: Strong password (min 8 chars)
    - **full_name**: User's full name
    - **role**: User role (admin, doctor, nurse, receptionist)
    """
    user = await AuthService.register_user(db, user_data)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: AsyncSession = Depends(get_db)
):
    """
    Login with username and password to get access token.
    
    Returns JWT token for subsequent API calls.
    """
    user = await AuthService.authenticate_user(
        db,
        form_data.username,
        form_data.password
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return AuthService.create_token_response(user)


@router.post("/login/json", response_model=TokenResponse)
async def login_json(
    credentials: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Login with JSON body (alternative to form-based login).
    
    Useful for frontend applications that prefer JSON over form data.
    """
    user = await AuthService.authenticate_user(
        db,
        credentials.username,
        credentials.password
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    
    return AuthService.create_token_response(user)


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user = Depends(get_current_user)
):
    """
    Get current authenticated user information.
    
    Requires valid JWT token in Authorization header.
    """
    return current_user
```

---

### Step 7: Update API Router

File: `backend/app/api/v1/router.py`

```python
from fastapi import APIRouter

from app.api.v1.auth.router import router as auth_router

# Create main API router
api_router = APIRouter()

# Include auth router
api_router.include_router(
    auth_router,
    prefix="/auth",
    tags=["Authentication"]
)

# Patient router will be added in Phase 1D
```

---

### Step 8: Update Main App

File: `backend/app/main.py` (add this line after the root endpoint)

```python
# Include API router
app.include_router(api_router, prefix="/api/v1")
```

---

### Step 9: Create Database Migration

```bash
# Activate virtual environment
cd backend
source venv/bin/activate

# Update models/__init__.py to import User model
# File: backend/app/models/__init__.py
from app.models.base import BaseModel
from app.models.user import User

# Create migration
alembic revision --autogenerate -m "add users table"

# Apply migration
alembic upgrade head
```

---

## 5. Verification Steps

```bash
# 1. Ensure migrations applied
cd backend
source venv/bin/activate
alembic current
# Should show: (head) add users table

# 2. Start server
uvicorn app.main:app --reload

# 3. Open Swagger UI
# http://localhost:8000/docs

# 4. Test Register Endpoint
# POST /api/v1/auth/register
{
    "username": "admin",
    "email": "admin@hospital.com",
    "password": "Admin123!",
    "full_name": "System Administrator",
    "role": "admin"
}
# Expected: 201 Created with user data

# 5. Test Login Endpoint (OAuth2 form)
# POST /api/v1/auth/login
# username: admin
# password: Admin123!
# Expected: 200 OK with access_token

# 6. Test Login JSON Endpoint
# POST /api/v1/auth/login/json
{
    "username": "admin",
    "password": "Admin123!"
}
# Expected: 200 OK with access_token

# 7. Test Protected Endpoint
# GET /api/v1/auth/me
# Click "Authorize" in Swagger, paste token
# Expected: 200 OK with current user data

# 8. Test with curl
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "doctor1",
    "email": "doctor@hospital.com",
    "password": "Doctor123!",
    "full_name": "Dr. Sharma",
    "role": "doctor"
  }'

# 9. Get token
TOKEN=$(curl -X POST "http://localhost:8000/api/v1/auth/login/json" \
  -H "Content-Type: application/json" \
  -d '{"username":"doctor1","password":"Doctor123!"}' \
  | jq -r '.access_token')

# 10. Use token
curl -X GET "http://localhost:8000/api/v1/auth/me" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 6. Database Verification

```bash
# Connect to PostgreSQL
docker exec -it ehr_postgres psql -U ehr_user -d ehr_db

# Check users table
\d users

# View users
SELECT id, username, email, full_name, role, is_active FROM users;

# Exit
\q
```

---

## 7. Expected Swagger UI

After implementation, Swagger should show:

```
Authentication
  POST /api/v1/auth/register - Register a new user
  POST /api/v1/auth/login - Login with username and password
  POST /api/v1/auth/login/json - Login with JSON body
  GET /api/v1/auth/me - Get current authenticated user

Health
  GET /health - Health check endpoint

Root
  GET / - Root endpoint
```

---

## 8. Troubleshooting

| Issue | Solution |
|-------|----------|
| "Username already registered" | Use different username |
| "Could not validate credentials" | Check token format and expiry |
| Alembic migration error | Check models/__init__.py imports |
| Password too short | Min 8 characters required |
| 401 Unauthorized | Token expired or invalid |

---

## 9. Security Notes

- Passwords are hashed with bcrypt (12 rounds)
- JWT tokens expire after 60 minutes (configurable)
- Tokens include user_id and username
- Inactive users cannot authenticate
- No password reset implemented (Phase 2+)

---

## 10. Next Sub-Phase

Once verified, proceed to **Phase 1D: Patient Backend**

---

## 11. Checklist

- [ ] Security utilities created
- [ ] User model with roles
- [ ] User schemas defined
- [ ] Auth service implemented
- [ ] Auth endpoints created
- [ ] API router updated
- [ ] Main app updated
- [ ] Database migration created
- [ ] Migration applied successfully
- [ ] Can register user via Swagger
- [ ] Can login and get token
- [ ] Token works for /me endpoint
- [ ] Users table in database
- [ ] All tests pass

---

*End of Phase 1C*
