from datetime import date
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.models import UserLoan, Loan
from app.schemas.schemas import UserLoanCreate, UserLoanUpdate, UserLoanOut

router = APIRouter(prefix="/api/user-loans", tags=["Формуляр"])


@router.get("/", response_model=List[UserLoanOut])
async def list_user_loans(
    user_id: Optional[int] = Query(None),
    filial_id: Optional[int] = Query(None),
    active_only: bool = Query(False, description="Только активные (не возвращённые)"),
):
    qs = UserLoan.all()
    if user_id:
        qs = qs.filter(id_user_id=user_id)
    if filial_id:
        qs = qs.filter(id_filial_id=filial_id)
    if active_only:
        qs = qs.filter(date_return__isnull=True)
    return await qs


@router.get("/overdue", response_model=List[UserLoanOut])
async def list_overdue(days: int = Query(14, description="Срок выдачи в днях")):
    """Список просроченных выдач (читатели, задержавшие книги)"""
    from datetime import timedelta
    deadline = date.today() - timedelta(days=days)
    return await UserLoan.filter(date_return__isnull=True, date_issue__lte=deadline)


@router.get("/{record_id}", response_model=UserLoanOut)
async def get_user_loan(record_id: int):
    obj = await UserLoan.get_or_none(id=record_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    return obj


@router.post("/", response_model=UserLoanOut, status_code=201)
async def issue_book(data: UserLoanCreate):
    """Выдача книги: создаёт формуляр и переводит экземпляр в статус 'на руках'"""
    copy = await Loan.get_or_none(id=data.id_loan_id)
    if not copy:
        raise HTTPException(status_code=404, detail="Экземпляр не найден")
    if copy.status_free != "в библиотеке":
        raise HTTPException(status_code=400, detail="Экземпляр сейчас не доступен")
    obj = await UserLoan.create(**data.model_dump())
    copy.status_free = "на руках"
    await copy.save()
    return obj


@router.put("/{record_id}", response_model=UserLoanOut)
async def update_user_loan(record_id: int, data: UserLoanUpdate):
    obj = await UserLoan.get_or_none(id=record_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    await obj.update_from_dict(update_data).save()
    return obj


@router.post("/{record_id}/return", response_model=UserLoanOut)
async def return_book(record_id: int):
    """Возврат книги: проставляет дату возврата и переводит экземпляр в статус 'в библиотеке'"""
    obj = await UserLoan.get_or_none(id=record_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    if obj.date_return:
        raise HTTPException(status_code=400, detail="Книга уже возвращена")
    obj.date_return = date.today()
    await obj.save()
    copy = await Loan.get_or_none(id=obj.id_loan_id)
    if copy:
        copy.status_free = "в библиотеке"
        await copy.save()
    return obj


@router.delete("/{record_id}", status_code=204)
async def delete_user_loan(record_id: int):
    obj = await UserLoan.get_or_none(id=record_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    await obj.delete()
