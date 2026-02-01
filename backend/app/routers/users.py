from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.deps import get_current_user
from app.db import get_db
from app.models.user import User
from app.schemas.user import UserOut, UserUpdateMe

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.patch("/me", response_model=UserOut)
def update_me(
    payload: UserUpdateMe,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    data = payload.model_dump(exclude_unset=True)

    for k, v in data.items():
        setattr(user, k, v)

    db.add(user)
    db.commit()
    db.refresh(user)
    return user