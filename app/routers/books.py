from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.models import Book
from app.schemas.schemas import BookCreate, BookUpdate, BookOut

router = APIRouter(prefix="/api/books", tags=["Книги"])


@router.get("/", response_model=List[BookOut])
async def list_books(
    name: Optional[str] = Query(None),
    author: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    topic: Optional[str] = Query(None),
):
    qs = Book.all()
    if name:
        qs = qs.filter(name__icontains=name)
    if author:
        qs = qs.filter(author__icontains=author)
    if year:
        qs = qs.filter(year_of_publication=year)
    if topic:
        qs = qs.filter(topic__icontains=topic)
    return await qs


@router.get("/{book_id}", response_model=BookOut)
async def get_book(book_id: int):
    obj = await Book.get_or_none(id=book_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Книга не найдена")
    return obj


@router.post("/", response_model=BookOut, status_code=201)
async def create_book(data: BookCreate):
    obj = await Book.create(**data.model_dump())
    return obj


@router.put("/{book_id}", response_model=BookOut)
async def update_book(book_id: int, data: BookUpdate):
    obj = await Book.get_or_none(id=book_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Книга не найдена")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    await obj.update_from_dict(update_data).save()
    return obj


@router.delete("/{book_id}", status_code=204)
async def delete_book(book_id: int):
    obj = await Book.get_or_none(id=book_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Книга не найдена")
    await obj.delete()
