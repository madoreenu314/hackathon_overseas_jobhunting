from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_exp_minutes: int = 60 * 24 * 7  # 7 days

    database_url: str = "sqlite:///./app.db"  # file-based sqlite

    class Config:
        env_file = ".env"


settings = Settings()