from fastapi import APIRouter, HTTPException
from typing import List
from app.models.models import User
from app.schemas.schemas import UserCreate, UserUpdate, UserOut

router = APIRouter(prefix="/api/users", tags=["Читатели"])


@router.get("/", response_model=List[UserOut])
async def list_users():
    return await User.all()


@router.get("/{user_id}", response_model=UserOut)
async def get_user(user_id: int):
    obj = await User.get_or_none(id=user_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Читатель не найден")
    return obj


@router.post("/", response_model=UserOut, status_code=201)
async def create_user(data: UserCreate):
    if await User.get_or_none(number_reading_ticket=data.number_reading_ticket):
        raise HTTPException(status_code=400, detail="Номер читательского билета уже существует")
    obj = await User.create(**data.model_dump())
    return obj


@router.put("/{user_id}", response_model=UserOut)
async def update_user(user_id: int, data: UserUpdate):
    obj = await User.get_or_none(id=user_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Читатель не найден")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    await obj.update_from_dict(update_data).save()
    return obj


@router.delete("/{user_id}", status_code=204)
async def delete_user(user_id: int):
    obj = await User.get_or_none(id=user_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Читатель не найден")
    await obj.delete()
