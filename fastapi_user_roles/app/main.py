import os
from datetime import datetime, timedelta, timezone
from typing import List

import bcrypt
from fastapi import APIRouter, Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy.orm import Session

from . import models, schemas
from .database import engine, get_db

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="User and Role Management API",
    description="Role and User Management API with JWT Bearer Authentication",
    version="1.0.0"
)

# -------------------------------------------------------------
# CORS
# -------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://fastapi-user-roles-frontend.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------
# SECURITY & JWT CONFIGURATION
# -------------------------------------------------------------
SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-jwt-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

security = HTTPBearer(auto_error=True)

def hash_password(password: str) -> str:
    """Hashes password with bcrypt safely enforcing the 72-byte limit."""
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

def verify_password(plain_password: str, stored_password: str) -> bool:
    """Verifies hashed password with bcrypt, falling back to plaintext for legacy rows."""
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        stored_bytes = stored_password.encode("utf-8")
        if bcrypt.checkpw(pwd_bytes, stored_bytes):
            return True
    except Exception:
        pass
    
    return plain_password == stored_password

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

class TokenData(BaseModel):
    id: int
    email: str
    role: str

def get_current_user_claims(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> TokenData:
    token = credentials.credentials
    auth_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        role: str = payload.get("role")
        
        if user_id is None or email is None:
            raise auth_exception
            
        return TokenData(id=int(user_id), email=email, role=role or "No Role")
    except JWTError:
        raise auth_exception

# -------------------------------------------------------------
# RBAC: ADMIN ROLE CHECK DEPENDENCY
# -------------------------------------------------------------
def require_admin(
    db: Session = Depends(get_db),
    token_user: TokenData = Depends(get_current_user_claims)
):
    """Enforces that only accounts with the 'Admin' role can proceed."""
    user = db.query(models.User).filter(models.User.id == token_user.id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user_roles = [r.name for r in user.roles]
    if "Admin" not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Admin privileges required to perform this action."
        )
    return user


# =============================================================
# PUBLIC ROUTES (UNLOCKED 🔓)
# =============================================================

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "message": "API is operational"}

@app.post("/signup", response_model=schemas.SignupResponse, status_code=status.HTTP_201_CREATED, tags=["Authentication"])
def signup(payload: schemas.SignupRequest, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    # Created without assigning any role by default
    new_user = models.User(
        name=payload.name,
        email=payload.email,
        password=hash_password(payload.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token_payload = {
        "sub": str(new_user.id),
        "email": new_user.email,
        "role": "Unassigned"
    }
    access_token = create_access_token(data=token_payload)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": new_user.id,
        "user_name": new_user.name,
        "email": new_user.email,
        "role": "Unassigned"
    }

@app.post("/login", response_model=schemas.LoginResponse, tags=["Authentication"])
def login(credentials: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    
    if not user or not verify_password(credentials.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials: incorrect email or password"
        )

    primary_role = user.roles[0].name if user.roles else "Unassigned"
    token_payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": primary_role
    }
    access_token = create_access_token(data=token_payload)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_name": user.name,
        "role": primary_role
    }


# =============================================================
# PROTECTED API ROUTER (LOCKED 🔒 - /api/v1)
# =============================================================

api_router = APIRouter(
    prefix="/api/v1",
    dependencies=[Depends(security)]
)

# ----------------- CURRENT USER -----------------
@api_router.get("/users/me", response_model=schemas.UserOut, tags=["Current User"])
def get_me(
    db: Session = Depends(get_db),
    token_user: TokenData = Depends(get_current_user_claims)
):
    user = db.query(models.User).filter(models.User.id == token_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ----------------- USERS CRUD -----------------
@api_router.get("/users", response_model=List[schemas.UserOut], tags=["Users"])
def get_all_users(
    db: Session = Depends(get_db),
    _: TokenData = Depends(get_current_user_claims)
):
    return db.query(models.User).all()

@api_router.post("/users", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED, tags=["Users"])
def create_user(
    user_in: schemas.UserCreate, 
    db: Session = Depends(get_db),
    _: TokenData = Depends(get_current_user_claims)
):
    existing = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = models.User(
        name=user_in.name,
        email=user_in.email,
        password=hash_password(user_in.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@api_router.get("/users/{user_id}", response_model=schemas.UserOut, tags=["Users"])
def get_user_by_id(
    user_id: int, 
    db: Session = Depends(get_db),
    _: TokenData = Depends(get_current_user_claims)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@api_router.put("/users/{user_id}", response_model=schemas.UserOut, tags=["Users"])
def update_user_full(
    user_id: int, 
    user_in: schemas.UserUpdate, 
    db: Session = Depends(get_db),
    _: TokenData = Depends(get_current_user_claims)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_in.email and user_in.email != user.email:
        email_taken = db.query(models.User).filter(models.User.email == user_in.email).first()
        if email_taken:
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = user_in.email

    if user_in.name is not None:
        user.name = user_in.name
    if user_in.password is not None:
        user.password = hash_password(user_in.password)

    db.commit()
    db.refresh(user)
    return user

@api_router.patch("/users/{user_id}", response_model=schemas.UserOut, tags=["Users"])
def update_user_partial(
    user_id: int, 
    user_in: schemas.UserUpdate, 
    db: Session = Depends(get_db),
    _: TokenData = Depends(get_current_user_claims)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = user_in.model_dump(exclude_unset=True) if hasattr(user_in, "model_dump") else user_in.dict(exclude_unset=True)
    
    if "email" in update_data and update_data["email"] != user.email:
        email_taken = db.query(models.User).filter(models.User.email == update_data["email"]).first()
        if email_taken:
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = update_data["email"]

    if "name" in update_data:
        user.name = update_data["name"]
    if "password" in update_data:
        user.password = hash_password(update_data["password"])

    db.commit()
    db.refresh(user)
    return user

@api_router.delete("/users/{user_id}", status_code=status.HTTP_200_OK, tags=["Users"])
def delete_user(
    user_id: int, 
    db: Session = Depends(get_db),
    _: TokenData = Depends(get_current_user_claims)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_data = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "roles": [{"id": r.id, "name": r.name} for r in user.roles]
    }
    
    db.delete(user)
    db.commit()
    return {
        "status": "success",
        "message": f"User '{user_data['name']}' (ID: {user_id}) deleted successfully",
        "deleted_user": user_data
    }

# ----------------- ROLES CRUD -----------------
@api_router.get("/roles", response_model=List[schemas.RoleOut], tags=["Roles"])
def get_roles(
    db: Session = Depends(get_db),
    _: TokenData = Depends(get_current_user_claims)
):
    return db.query(models.Role).all()

@api_router.post("/roles", response_model=schemas.RoleOut, status_code=status.HTTP_201_CREATED, tags=["Roles"], dependencies=[Depends(require_admin)])
def create_role(
    role_in: schemas.RoleCreate, 
    db: Session = Depends(get_db),
    _: TokenData = Depends(get_current_user_claims)
):
    existing = db.query(models.Role).filter(models.Role.name == role_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Role already exists")
    
    role = models.Role(name=role_in.name)
    db.add(role)
    db.commit()
    db.refresh(role)
    return role

@api_router.delete("/roles/{role_id}", status_code=status.HTTP_200_OK, tags=["Roles"], dependencies=[Depends(require_admin)])
def delete_role(
    role_id: int, 
    db: Session = Depends(get_db),
    _: TokenData = Depends(get_current_user_claims)
):
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    role_name = role.name
    db.delete(role)
    db.commit()
    return {
        "status": "success",
        "message": f"Role '{role_name}' (ID: {role_id}) deleted successfully",
        "deleted_role": {"id": role_id, "name": role_name}
    }

# ----------------- USER ROLES MAPPING (ADMIN ONLY) -----------------
@api_router.get("/users/{user_id}/roles", response_model=List[schemas.RoleOut], tags=["User Roles"])
def get_user_roles(
    user_id: int,
    db: Session = Depends(get_db),
    _: TokenData = Depends(get_current_user_claims)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user.roles

@api_router.post(
    "/users/{user_id}/roles", 
    response_model=schemas.UserOut, 
    status_code=status.HTTP_201_CREATED, 
    tags=["User Roles"],
    dependencies=[Depends(require_admin)]
)
def assign_role_to_user(
    user_id: int, 
    payload: schemas.AssignRole, 
    db: Session = Depends(get_db),
    _: TokenData = Depends(get_current_user_claims)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    role = db.query(models.Role).filter(models.Role.id == payload.role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    if role in user.roles:
        raise HTTPException(status_code=400, detail="Role already assigned to user")

    user.roles.append(role)
    db.commit()
    db.refresh(user)
    return user

@api_router.delete(
    "/users/{user_id}/roles/{role_id}", 
    status_code=status.HTTP_200_OK, 
    tags=["User Roles"],
    dependencies=[Depends(require_admin)]
)
def remove_role_from_user(
    user_id: int, 
    role_id: int, 
    db: Session = Depends(get_db),
    _: TokenData = Depends(get_current_user_claims)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    if role not in user.roles:
        raise HTTPException(status_code=400, detail="User does not have this role")

    role_name = role.name
    user.roles.remove(role)
    db.commit()
    db.refresh(user)
    return {
        "status": "success",
        "message": f"Role '{role_name}' removed from user '{user.name}' successfully",
        "user_id": user.id,
        "user_name": user.name,
        "removed_role": {"id": role_id, "name": role_name},
        "remaining_roles": [{"id": r.id, "name": r.name} for r in user.roles]
    }

app.include_router(api_router)