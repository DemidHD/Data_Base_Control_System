from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.models import Copy, Book, Rack
from app.schemas.schemas import CopyCreate, CopyUpdate, CopyOut

router = APIRouter(prefix="/api/copies", tags=["Экземпляры"])


@router.get("/", response_model=List[CopyOut])
async def list_copies(
    book_id: Optional[int] = Query(None),
    rack_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
):
    qs = Copy.all()
    if book_id:
        qs = qs.filter(book_id=book_id)
    if rack_id:
        qs = qs.filter(rack_id=rack_id)
    if status:
        qs = qs.filter(status=status)
    return await qs


@router.get("/{copy_id}", response_model=CopyOut)
async def get_copy(copy_id: int):
    obj = await Copy.get_or_none(id=copy_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Экземпляр не найден")
    return obj


@router.post("/", response_model=CopyOut, status_code=201)
async def create_copy(data: CopyCreate):
    if not await Book.exists(id=data.book_id):
        raise HTTPException(status_code=400, detail="Указанная книга не существует")
    if data.rack_id is not None and not await Rack.exists(id=data.rack_id):
        raise HTTPException(status_code=400, detail="Указанный стеллаж не существует")
    return await Copy.create(**data.model_dump())


@router.put("/{copy_id}", response_model=CopyOut)
async def update_copy(copy_id: int, data: CopyUpdate):
    obj = await Copy.get_or_none(id=copy_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Экземпляр не найден")
    await obj.update_from_dict({k: v for k, v in data.model_dump().items() if v is not None}).save()
    return obj


@router.delete("/{copy_id}", status_code=204)
async def delete_copy(copy_id: int):
    obj = await Copy.get_or_none(id=copy_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Экземпляр не найден")
    try:
        await obj.delete()
    except Exception:
        raise HTTPException(status_code=400, detail="Нельзя удалить экземпляр: есть связанные формуляры")
