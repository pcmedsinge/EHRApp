from pydantic import BaseModel, Field


class Token(BaseModel):
    """JWT token response"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token payload data"""
    username: str
    user_id: str


class LoginRequest(BaseModel):
    """Login request schema"""
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)


class RegisterRequest(BaseModel):
    """Registration request (extends UserCreate)"""
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=6, max_length=50)
    full_name: str = Field(..., min_length=1, max_length=100)
    role: str = Field(default="receptionist")
