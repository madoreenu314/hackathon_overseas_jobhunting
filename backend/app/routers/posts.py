from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.post import Post
from app.schemas.post import PostCreateIn, PostOut

router = APIRouter(prefix="/api/posts", tags=["posts"])


@router.post("", response_model=PostOut)
def create_post(
    payload: PostCreateIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # ✅ 投稿時はユーザーの country_region / industry_job を強制利用
    if not user.country_region or not user.industry_job:
        raise HTTPException(
            status_code=400,
            detail="プロフィールの「国・地域」と「業界・職種」を先に設定してください。",
        )

    post = Post(
        author_id=user.id,
        country_region=user.country_region,
        industry_job=user.industry_job,
        knowledge_type=payload.knowledge_type,
        title=payload.title,
        content=payload.content,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


@router.get("", response_model=list[PostOut])
def list_posts(db: Session = Depends(get_db)):
    # 新しい順
    rows = db.execute(select(Post).order_by(Post.id.desc())).scalars().all()
    return rows


@router.get("/{post_id}", response_model=PostOut)
def get_post(post_id: int, db: Session = Depends(get_db)):
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post