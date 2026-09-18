from typing import List, Optional

from pydantic import BaseModel, EmailStr


# --- Role Schemas ---
class RoleBase(BaseModel):
    name: str

class RoleCreate(RoleBase):
    pass

class RoleOut(RoleBase):
    id: int

    class Config:
        from_attributes = True

class AssignRole(BaseModel):
    role_id: int


# --- User Schemas ---
class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None

class UserOut(UserBase):
    id: int
    roles: List[RoleOut] = []

    class Config:
        from_attributes = True


# --- Auth Schemas ---
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_name: str
    role: str

class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class SignupResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    user_name: str
    email: str
    role: str