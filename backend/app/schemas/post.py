from pydantic import BaseModel, Field
from typing import Literal
from datetime import datetime

from app.constants.knowledge_types import KNOWLEDGE_TYPE_CHOICES


KnowledgeType = Literal[tuple(KNOWLEDGE_TYPE_CHOICES)]


class PostCreateIn(BaseModel):
    knowledge_type: KnowledgeType
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1, max_length=20000)


class PostOut(BaseModel):
    id: int
    author_id: int
    author_nickname: str | None = None

    country_region: str
    industry_job: str

    knowledge_type: str
    title: str
    content: str

    created_at: datetime  

    class Config:
        from_attributes = True
