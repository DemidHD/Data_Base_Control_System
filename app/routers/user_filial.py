from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.models import UserFilial
from app.schemas.schemas import UserFilialCreate, UserFilialUpdate, UserFilialOut

router = APIRouter(prefix="/api/user-filials", tags=["Регистрация в филиале"])


@router.get("/", response_model=List[UserFilialOut])
async def list_user_filials(
    user_id: Optional[int] = Query(None),
    filial_id: Optional[int] = Query(None),
):
    qs = UserFilial.all()
    if user_id:
        qs = qs.filter(id_user_id=user_id)
    if filial_id:
        qs = qs.filter(id_filial_id=filial_id)
    return await qs


@router.get("/{record_id}", response_model=UserFilialOut)
async def get_user_filial(record_id: int):
    obj = await UserFilial.get_or_none(id=record_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    return obj


@router.post("/", response_model=UserFilialOut, status_code=201)
async def create_user_filial(data: UserFilialCreate):
    obj = await UserFilial.create(**data.model_dump())
    return obj


@router.put("/{record_id}", response_model=UserFilialOut)
async def update_user_filial(record_id: int, data: UserFilialUpdate):
    obj = await UserFilial.get_or_none(id=record_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    await obj.update_from_dict(update_data).save()
    return obj


@router.delete("/{record_id}", status_code=204)
async def delete_user_filial(record_id: int):
    obj = await UserFilial.get_or_none(id=record_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    await obj.delete()
