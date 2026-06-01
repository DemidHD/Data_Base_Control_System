from datetime import date, timedelta
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.models import Loan, Copy, Reader
from app.schemas.schemas import LoanCreate, LoanUpdate, LoanOut

router = APIRouter(prefix="/api/loans", tags=["Формуляр"])


@router.get("/", response_model=List[LoanOut])
async def list_loans(
    reader_id: Optional[int] = Query(None),
    copy_id: Optional[int] = Query(None),
    active_only: bool = Query(False, description="Только активные (не возвращённые)"),
):
    qs = Loan.all()
    if reader_id:
        qs = qs.filter(reader_id=reader_id)
    if copy_id:
        qs = qs.filter(copy_id=copy_id)
    if active_only:
        qs = qs.filter(actual_return_date__isnull=True)
    return await qs


@router.get("/overdue", response_model=List[LoanOut])
async def list_overdue():
    """Просроченные выдачи: не возвращены, плановая дата возврата уже прошла."""
    return await Loan.filter(actual_return_date__isnull=True, planned_return_date__lt=date.today())


@router.get("/{record_id}", response_model=LoanOut)
async def get_loan(record_id: int):
    obj = await Loan.get_or_none(id=record_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Формуляр не найден")
    return obj


@router.post("/", response_model=LoanOut, status_code=201)
async def issue_book(data: LoanCreate):
    """Выдача: создаёт формуляр и переводит экземпляр в статус «на руках»."""
    if not await Reader.exists(id=data.reader_id):
        raise HTTPException(status_code=400, detail="Указанный читатель не существует")
    copy = await Copy.get_or_none(id=data.copy_id)
    if not copy:
        raise HTTPException(status_code=400, detail="Указанный экземпляр не существует")
    if copy.status == "на руках":
        raise HTTPException(status_code=400, detail="Экземпляр уже выдан")
    if copy.status == "списан":
        raise HTTPException(status_code=400, detail="Экземпляр списан и не может быть выдан")
    obj = await Loan.create(**data.model_dump())
    copy.status = "на руках"
    await copy.save()
    return obj


@router.put("/{record_id}", response_model=LoanOut)
async def update_loan(record_id: int, data: LoanUpdate):
    obj = await Loan.get_or_none(id=record_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Формуляр не найден")
    await obj.update_from_dict({k: v for k, v in data.model_dump().items() if v is not None}).save()
    return obj


@router.post("/{record_id}/return", response_model=LoanOut)
async def return_book(record_id: int):
    """Возврат: проставляет фактическую дату и возвращает экземпляр в статус «в наличии»."""
    obj = await Loan.get_or_none(id=record_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Формуляр не найден")
    if obj.actual_return_date:
        raise HTTPException(status_code=400, detail="Книга уже возвращена")
    obj.actual_return_date = date.today()
    await obj.save()
    copy = await Copy.get_or_none(id=obj.copy_id)
    if copy:
        copy.status = "в наличии"
        await copy.save()
    return obj


@router.delete("/{record_id}", status_code=204)
async def delete_loan(record_id: int):
    obj = await Loan.get_or_none(id=record_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Формуляр не найден")
    await obj.delete()
