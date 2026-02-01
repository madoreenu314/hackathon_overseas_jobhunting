from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal
from app.constants.countries import COUNTRY_REGION_CHOICES


CountryRegion = Literal[tuple(COUNTRY_REGION_CHOICES)]

IndustryJob = Literal[
    "IT・エンジニア",
    "金融",
    "コンサル",
    "マーケティング",
    "医療",
    "教育業",
    "製造業",
]

Gender = Literal["male", "female", "other", "unknown"]


class UserOut(BaseModel):
    id: int
    email: EmailStr
    nickname: str | None = None

    country_region: str | None = None
    industry_job: str | None = None

    bio: str | None = None
    gender: Gender | None = None
    age: int | None = None

    class Config:
        from_attributes = True

class UserPublicOut(BaseModel):
    id: int
    nickname: str | None = None

    country_region: str | None = None
    industry_job: str | None = None

    bio: str | None = None
    gender: Gender | None = None
    age: int | None = None

    class Config:
        from_attributes = True


class RegisterIn(BaseModel):
    email: EmailStr
    password: str


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserUpdateMe(BaseModel):
    nickname: Optional[str] = Field(default=None, min_length=1, max_length=50)
    country_region: Optional[CountryRegion] = None
    industry_job: Optional[IndustryJob] = None

    bio: Optional[str] = Field(default=None, max_length=500)
    gender: Optional[Gender] = None
    age: Optional[int] = Field(default=None, ge=0, le=120)
