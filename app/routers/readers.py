from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.models import Reader
from app.schemas.schemas import ReaderCreate, ReaderUpdate, ReaderOut

router = APIRouter(prefix="/api/readers", tags=["Читатели"])


@router.get("/", response_model=List[ReaderOut])
async def list_readers(
    full_name: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
):
    qs = Reader.all()
    if full_name:
        qs = qs.filter(full_name__icontains=full_name)
    if status:
        qs = qs.filter(status=status)
    return await qs


@router.get("/{reader_id}", response_model=ReaderOut)
async def get_reader(reader_id: int):
    obj = await Reader.get_or_none(id=reader_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Читатель не найден")
    return obj


@router.post("/", response_model=ReaderOut, status_code=201)
async def create_reader(data: ReaderCreate):
    if await Reader.exists(passport_data=data.passport_data):
        raise HTTPException(status_code=400, detail="Читатель с такими паспортными данными уже существует")
    return await Reader.create(**data.model_dump())


@router.put("/{reader_id}", response_model=ReaderOut)
async def update_reader(reader_id: int, data: ReaderUpdate):
    obj = await Reader.get_or_none(id=reader_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Читатель не найден")
    await obj.update_from_dict({k: v for k, v in data.model_dump().items() if v is not None}).save()
    return obj


@router.delete("/{reader_id}", status_code=204)
async def delete_reader(reader_id: int):
    obj = await Reader.get_or_none(id=reader_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Читатель не найден")
    try:
        await obj.delete()
    except Exception:
        raise HTTPException(status_code=400, detail="Нельзя удалить читателя: есть связанные регистрации или формуляры")
