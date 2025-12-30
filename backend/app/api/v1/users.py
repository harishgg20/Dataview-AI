from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core import security, database
from app.models.user import User
from app.api.deps import get_current_active_user, get_current_admin_user
from app.schemas.user import UserOut, UserUpdate

router = APIRouter()

@router.get("/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_active_user)):
    """
    Get current user.
    """
    return current_user

@router.get("/", response_model=list[UserOut])
def read_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(database.get_db)
):
    """
    Retrieve users.
    """
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.put("/me", response_model=UserOut)
def update_user_me(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(database.get_db)
):
    """
    Update current user.
    """
    if user_in.email and user_in.email != current_user.email:
        user = db.query(User).filter(User.email == user_in.email).first()
        if user:
            raise HTTPException(
                status_code=400,
                detail="Email already registered",
            )
        current_user.email = user_in.email

    if user_in.first_name:
        current_user.first_name = user_in.first_name
    if user_in.last_name:
        current_user.last_name = user_in.last_name
    if user_in.avatar_data:
        current_user.avatar_data = user_in.avatar_data
        
    if user_in.password:
        if len(user_in.password) < 8:
             raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
        current_user.password_hash = security.get_password_hash(user_in.password)

    if user_in.api_key is not None:
        # Allow clearing logic if key is empty string?
        current_user.api_key = user_in.api_key

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_me(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(database.get_db)
):
    """
    Delete current user.
    """
    db.delete(current_user)
    db.commit()
