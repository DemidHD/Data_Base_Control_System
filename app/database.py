import os
from dotenv import load_dotenv

load_dotenv()

# По умолчанию SQLite — файл хранится в app/library.db (открывается любой программой для БД).
# Для PostgreSQL задайте DATABASE_URL в файле .env:
#   DATABASE_URL=postgres://user:password@localhost:5432/library_db
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite://app/library.db")

TORTOISE_ORM = {
    "connections": {"default": DATABASE_URL},
    "apps": {
        "models": {
            "models": ["app.models.models"],
            "default_connection": "default",
        }
    },
}
