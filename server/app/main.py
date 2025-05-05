from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.auth import router as auth_router
from app.routes.images import router as images_router
from app.routes.users import router as users_router

app = FastAPI()
app.include_router(auth_router, prefix="/auth")
app.include_router(images_router, prefix="/image")
app.include_router(users_router, prefix="/user")

origins = [
    "http://localhost:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
