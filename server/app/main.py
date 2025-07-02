from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.auth import router as auth_router
from app.routes.image import router as image_router
from app.routes.user import router as user_router

app = FastAPI(swagger_ui_parameters={"defaultModelsExpandDepth": -1})
app.include_router(auth_router, prefix="/auth")
app.include_router(image_router, prefix="/image")
app.include_router(user_router, prefix="/user")

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
