from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.models import Registration, Reader, Filial
from app.schemas.schemas import RegistrationCreate, RegistrationUpdate, RegistrationOut

router = APIRouter(prefix="/api/registrations", tags=["Регистрации"])


@router.get("/", response_model=List[RegistrationOut])
async def list_registrations(
    reader_id: Optional[int] = Query(None),
    filial_id: Optional[int] = Query(None),
):
    qs = Registration.all()
    if reader_id:
        qs = qs.filter(reader_id=reader_id)
    if filial_id:
        qs = qs.filter(filial_id=filial_id)
    return await qs


@router.get("/{record_id}", response_model=RegistrationOut)
async def get_registration(record_id: int):
    obj = await Registration.get_or_none(id=record_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Регистрация не найдена")
    return obj


@router.post("/", response_model=RegistrationOut, status_code=201)
async def create_registration(data: RegistrationCreate):
    if not await Reader.exists(id=data.reader_id):
        raise HTTPException(status_code=400, detail="Указанный читатель не существует")
    if not await Filial.exists(id=data.filial_id):
        raise HTTPException(status_code=400, detail="Указанный филиал не существует")
    if await Registration.exists(ticket_number=data.ticket_number):
        raise HTTPException(status_code=400, detail="Номер билета уже существует")
    return await Registration.create(**data.model_dump())


@router.put("/{record_id}", response_model=RegistrationOut)
async def update_registration(record_id: int, data: RegistrationUpdate):
    obj = await Registration.get_or_none(id=record_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Регистрация не найдена")
    await obj.update_from_dict({k: v for k, v in data.model_dump().items() if v is not None}).save()
    return obj


@router.delete("/{record_id}", status_code=204)
async def delete_registration(record_id: int):
    obj = await Registration.get_or_none(id=record_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Регистрация не найдена")
    await obj.delete()
