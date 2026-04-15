from fastapi import APIRouter, HTTPException
from tortoise import connections
from app.schemas.schemas import SQLQueryRequest

router = APIRouter(prefix="/api/sql", tags=["SQL-запросы"])

FORBIDDEN_KEYWORDS = {"drop", "truncate", "alter", "create", "grant", "revoke"}


@router.post("/")
async def execute_sql(request: SQLQueryRequest):
    """
    Выполнение произвольного SQL-запроса (только для администраторов).
    Запрещены DDL-операции: DROP, TRUNCATE, ALTER, CREATE, GRANT, REVOKE.
    """
    query_lower = request.query.strip().lower()
    for kw in FORBIDDEN_KEYWORDS:
        if kw in query_lower.split():
            raise HTTPException(
                status_code=400,
                detail=f"Запрещённая операция: {kw.upper()}"
            )

    conn = connections.get("default")
    try:
        results = await conn.execute_query_dict(request.query)
        return {"rows": results, "count": len(results)}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))
