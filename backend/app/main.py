from fastapi import FastAPI
from app.routers.health import router as health_router
from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.posts import router as posts_router


app = FastAPI(title="Hackathon API")

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(posts_router)