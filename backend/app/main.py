from fastapi import FastAPI
from app.routers.health import router as health_router
from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.posts import router as posts_router
from app.db import Base, engine
from app.models import user, post

from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="Hackathon API")

# Ensure all tables are created after models are imported
Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 开发中可以全放开
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(posts_router)
