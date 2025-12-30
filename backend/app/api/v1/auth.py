from fastapi import APIRouter, Depends, HTTPException, status
import logging
import traceback
from sqlalchemy.orm import Session
from datetime import timedelta
from app.core import security, database
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, Token

router = APIRouter()

@router.post("/signup", response_model=dict)
def signup(user: UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if len(user.password) > 50:
         raise HTTPException(status_code=400, detail="Password too long (max 50 characters)")
    
    hashed_password = security.get_password_hash(user.password)
    new_user = User(
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        password_hash=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully"}

@router.post("/login", response_model=Token)
def login(user_credentials: UserLogin, db: Session = Depends(database.get_db)):
    try:
        user = db.query(User).filter(User.email == user_credentials.email).first()
        if not user or not security.verify_password(user_credentials.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
        if user_credentials.remember_me:
            access_token_expires = timedelta(days=7)
            
        access_token = security.create_access_token(
            data={"sub": user.email, "id": user.id, "role": user.role},
            expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        # Log the error for debugging
        logging.error(f"Login failed: {str(e)}")
        logging.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )
