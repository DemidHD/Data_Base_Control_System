from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.models import Loan
from app.schemas.schemas import LoanCreate, LoanUpdate, LoanOut

router = APIRouter(prefix="/api/loans", tags=["Экземпляры книг"])


@router.get("/", response_model=List[LoanOut])
async def list_loans(
    filial_id: Optional[int] = Query(None),
    book_id: Optional[int] = Query(None),
    status_free: Optional[str] = Query(None),
):
    qs = Loan.all()
    if filial_id:
        qs = qs.filter(id_filial_id=filial_id)
    if book_id:
        qs = qs.filter(id_book_id=book_id)
    if status_free:
        qs = qs.filter(status_free=status_free)
    return await qs


@router.get("/{loan_id}", response_model=LoanOut)
async def get_loan(loan_id: int):
    obj = await Loan.get_or_none(id=loan_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Экземпляр не найден")
    return obj


@router.post("/", response_model=LoanOut, status_code=201)
async def create_loan(data: LoanCreate):
    obj = await Loan.create(**data.model_dump())
    return obj


@router.put("/{loan_id}", response_model=LoanOut)
async def update_loan(loan_id: int, data: LoanUpdate):
    obj = await Loan.get_or_none(id=loan_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Экземпляр не найден")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    await obj.update_from_dict(update_data).save()
    return obj


@router.delete("/{loan_id}", status_code=204)
async def delete_loan(loan_id: int):
    obj = await Loan.get_or_none(id=loan_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Экземпляр не найден")
    await obj.delete()
