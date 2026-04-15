from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from tortoise.contrib.fastapi import register_tortoise

from app.database import TORTOISE_ORM
from app.routers import filial, users, books, loans, user_loans, catalogs, transactions, user_filial, sql_query

app = FastAPI(
    title="Система учёта книжного фонда библиотеки",
    description="FastAPI + Tortoise ORM + PostgreSQL",
    version="1.0.0",
)

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Подключение роутеров
app.include_router(filial.router)
app.include_router(users.router)
app.include_router(books.router)
app.include_router(loans.router)
app.include_router(user_loans.router)
app.include_router(catalogs.router)
app.include_router(transactions.router)
app.include_router(user_filial.router)
app.include_router(sql_query.router)

# Регистрация Tortoise ORM
register_tortoise(
    app,
    config=TORTOISE_ORM,
    generate_schemas=True,
    add_exception_handlers=True,
)


@app.get("/", include_in_schema=False)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})
