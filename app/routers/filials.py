from fastapi import APIRouter, HTTPException
from typing import List
from app.models.models import Filial
from app.schemas.schemas import FilialCreate, FilialUpdate, FilialOut

router = APIRouter(prefix="/api/filials", tags=["Филиалы"])


@router.get("/", response_model=List[FilialOut])
async def list_filials():
    return await Filial.all()


@router.get("/{filial_id}", response_model=FilialOut)
async def get_filial(filial_id: int):
    obj = await Filial.get_or_none(id=filial_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Филиал не найден")
    return obj


@router.post("/", response_model=FilialOut, status_code=201)
async def create_filial(data: FilialCreate):
    return await Filial.create(**data.model_dump())


@router.put("/{filial_id}", response_model=FilialOut)
async def update_filial(filial_id: int, data: FilialUpdate):
    obj = await Filial.get_or_none(id=filial_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Филиал не найден")
    await obj.update_from_dict({k: v for k, v in data.model_dump().items() if v is not None}).save()
    return obj


@router.delete("/{filial_id}", status_code=204)
async def delete_filial(filial_id: int):
    obj = await Filial.get_or_none(id=filial_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Филиал не найден")
    try:
        await obj.delete()
    except Exception:
        raise HTTPException(status_code=400, detail="Нельзя удалить филиал: есть связанные стеллажи или регистрации")
