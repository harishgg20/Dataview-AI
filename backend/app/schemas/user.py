from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    first_name: str
    last_name: Optional[str] = None
    password: str

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    password: Optional[str] = None
    email: Optional[EmailStr] = None
    avatar_data: Optional[str] = None

class UserLogin(UserBase):
    password: str
    remember_me: Optional[bool] = False

class UserOut(UserBase):
    id: int
    first_name: str
    last_name: Optional[str] = None
    email: EmailStr
    role: str
    avatar_data: Optional[str] = None
    phone_number: Optional[str] = None
    job_title: Optional[str] = None
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
