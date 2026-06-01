from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.models import Rack, Filial
from app.schemas.schemas import RackCreate, RackUpdate, RackOut

router = APIRouter(prefix="/api/racks", tags=["Стеллажи"])


@router.get("/", response_model=List[RackOut])
async def list_racks(filial_id: Optional[int] = Query(None)):
    qs = Rack.all()
    if filial_id:
        qs = qs.filter(filial_id=filial_id)
    return await qs


@router.get("/{rack_id}", response_model=RackOut)
async def get_rack(rack_id: int):
    obj = await Rack.get_or_none(id=rack_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Стеллаж не найден")
    return obj


@router.post("/", response_model=RackOut, status_code=201)
async def create_rack(data: RackCreate):
    if not await Filial.exists(id=data.filial_id):
        raise HTTPException(status_code=400, detail="Указанный филиал не существует")
    return await Rack.create(**data.model_dump())


@router.put("/{rack_id}", response_model=RackOut)
async def update_rack(rack_id: int, data: RackUpdate):
    obj = await Rack.get_or_none(id=rack_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Стеллаж не найден")
    await obj.update_from_dict({k: v for k, v in data.model_dump().items() if v is not None}).save()
    return obj


@router.delete("/{rack_id}", status_code=204)
async def delete_rack(rack_id: int):
    obj = await Rack.get_or_none(id=rack_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Стеллаж не найден")
    # У связанных экземпляров ID_стеллажа обнуляется (ON DELETE SET NULL).
    await obj.delete()
