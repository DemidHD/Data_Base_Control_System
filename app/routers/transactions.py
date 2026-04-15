from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.models import BookTransaction, Loan
from app.schemas.schemas import BookTransactionCreate, BookTransactionUpdate, BookTransactionOut

router = APIRouter(prefix="/api/transactions", tags=["Поступление и списание"])


@router.get("/", response_model=List[BookTransactionOut])
async def list_transactions(
    operation_type: Optional[str] = Query(None),
    loan_id: Optional[int] = Query(None),
):
    qs = BookTransaction.all()
    if operation_type:
        qs = qs.filter(operation_type=operation_type)
    if loan_id:
        qs = qs.filter(id_loan_id=loan_id)
    return await qs


@router.get("/{transaction_id}", response_model=BookTransactionOut)
async def get_transaction(transaction_id: int):
    obj = await BookTransaction.get_or_none(id=transaction_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Операция не найдена")
    return obj


@router.post("/", response_model=BookTransactionOut, status_code=201)
async def create_transaction(data: BookTransactionCreate):
    """
    Создание операции поступления или списания.
    При списании автоматически обновляется статус экземпляра.
    """
    obj = await BookTransaction.create(**data.model_dump())
    if data.operation_type == "списание":
        copy = await Loan.get_or_none(id=data.id_loan_id)
        if copy:
            copy.status_condition = "списано"
            copy.status_free = "списано"
            await copy.save()
    return obj


@router.put("/{transaction_id}", response_model=BookTransactionOut)
async def update_transaction(transaction_id: int, data: BookTransactionUpdate):
    obj = await BookTransaction.get_or_none(id=transaction_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Операция не найдена")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    await obj.update_from_dict(update_data).save()
    return obj


@router.delete("/{transaction_id}", status_code=204)
async def delete_transaction(transaction_id: int):
    obj = await BookTransaction.get_or_none(id=transaction_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Операция не найдена")
    await obj.delete()
