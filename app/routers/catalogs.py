from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.models import Catalog
from app.schemas.schemas import CatalogCreate, CatalogUpdate, CatalogOut

router = APIRouter(prefix="/api/catalogs", tags=["Каталог"])


@router.get("/", response_model=List[CatalogOut])
async def list_catalogs(
    catalog_type: Optional[str] = Query(None),
    catalog_value: Optional[str] = Query(None),
    book_id: Optional[int] = Query(None),
):
    qs = Catalog.all()
    if catalog_type:
        qs = qs.filter(catalog_type=catalog_type)
    if catalog_value:
        qs = qs.filter(catalog_value__icontains=catalog_value)
    if book_id:
        qs = qs.filter(id_book_id=book_id)
    return await qs


@router.get("/{catalog_id}", response_model=CatalogOut)
async def get_catalog(catalog_id: int):
    obj = await Catalog.get_or_none(id=catalog_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Запись каталога не найдена")
    return obj


@router.post("/", response_model=CatalogOut, status_code=201)
async def create_catalog(data: CatalogCreate):
    obj = await Catalog.create(**data.model_dump())
    return obj


@router.put("/{catalog_id}", response_model=CatalogOut)
async def update_catalog(catalog_id: int, data: CatalogUpdate):
    obj = await Catalog.get_or_none(id=catalog_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Запись каталога не найдена")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    await obj.update_from_dict(update_data).save()
    return obj


@router.delete("/{catalog_id}", status_code=204)
async def delete_catalog(catalog_id: int):
    obj = await Catalog.get_or_none(id=catalog_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Запись каталога не найдена")
    await obj.delete()
