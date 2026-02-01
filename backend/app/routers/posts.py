from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.db import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.post import Post
from app.models.post_like import PostLike
from app.schemas.post import PostCreateIn, PostOut

router = APIRouter(prefix="/api/posts", tags=["posts"])


def _likes_count(db: Session, post_id: int) -> int:
    return db.execute(
        select(func.count(PostLike.id)).where(PostLike.post_id == post_id)
    ).scalar_one()


def _liked_by_user(db: Session, post_id: int, user_id: int) -> bool:
    row = db.execute(
        select(PostLike.id).where(
            PostLike.post_id == post_id,
            PostLike.user_id == user_id,
        )
    ).first()
    return row is not None


def _to_post_out_dict(db: Session, post: Post) -> dict:
    """
    Post(SQLAlchemy) -> PostOut相当のdictへ変換
    likes_count は post_likes から集計
    """
    return {
        "id": post.id,
        "author_id": post.author_id,
        "author_nickname": post.author_nickname,
        "country_region": post.country_region,
        "industry_job": post.industry_job,
        "knowledge_type": post.knowledge_type,
        "title": post.title,
        "content": post.content,
        "likes_count": _likes_count(db, post.id),
        "created_at": post.created_at,
    }


@router.post("", response_model=PostOut)
def create_post(
    payload: PostCreateIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    
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

    return _to_post_out_dict(db, post)


@router.get("", response_model=list[PostOut])
def list_posts(db: Session = Depends(get_db)):
   
    rows = db.execute(select(Post).order_by(Post.id.desc())).scalars().all()
    return [_to_post_out_dict(db, p) for p in rows]


@router.get("/{post_id}", response_model=PostOut)
def get_post(post_id: int, db: Session = Depends(get_db)):
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return _to_post_out_dict(db, post)


@router.delete("/{post_id}")
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.author_id != user.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    db.delete(post)
    db.commit()
    return {"status": "deleted"}



@router.get("/{post_id}/like")
def get_like_status(
    post_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    return {
        "liked": _liked_by_user(db, post_id, user.id),
        "likes_count": _likes_count(db, post_id),
    }


@router.post("/{post_id}/like")
def like_post(
    post_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if _liked_by_user(db, post_id, user.id):
        return {"liked": True, "likes_count": _likes_count(db, post_id)}

    db.add(PostLike(post_id=post_id, user_id=user.id))
    db.commit()

    return {"liked": True, "likes_count": _likes_count(db, post_id)}


@router.delete("/{post_id}/like")
def unlike_post(
    post_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    like = db.execute(
        select(PostLike).where(
            PostLike.post_id == post_id,
            PostLike.user_id == user.id,
        )
    ).scalar_one_or_none()

    if like:
        db.delete(like)
        db.commit()

    return {"liked": False, "likes_count": _likes_count(db, post_id)}