from sqlalchemy import String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    country_region: Mapped[str] = mapped_column(String(100), nullable=False)
    industry_job: Mapped[str] = mapped_column(String(50), nullable=False)

    knowledge_type: Mapped[str] = mapped_column(String(50), nullable=False)

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    author = relationship("User")

    @property
    def author_nickname(self) -> str | None:
        return self.author.nickname if self.author else None
