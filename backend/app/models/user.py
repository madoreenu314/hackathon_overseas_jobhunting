from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.db import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    nickname: Mapped[str | None] = mapped_column(String(50), nullable=True)   # ✅ 新增

    country_region: Mapped[str | None] = mapped_column(String(100), nullable=True)  # 国・地域
    industry_job: Mapped[str | None] = mapped_column(String(50), nullable=True)    # 業界・職種
    
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())