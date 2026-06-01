from datetime import date
from typing import Optional
from pydantic import BaseModel


# ─── Filial (Филиал) ──────────────────────────────────────────────────────────

class FilialCreate(BaseModel):
    name: str
    address: str

class FilialUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None

class FilialOut(BaseModel):
    id: int
    name: str
    address: str

    model_config = {"from_attributes": True}


# ─── Rack (Стеллаж) ───────────────────────────────────────────────────────────

class RackCreate(BaseModel):
    coordinates: str
    room_number: str
    filial_id: int

class RackUpdate(BaseModel):
    coordinates: Optional[str] = None
    room_number: Optional[str] = None
    filial_id: Optional[int] = None

class RackOut(BaseModel):
    id: int
    coordinates: str
    room_number: str
    filial_id: int

    model_config = {"from_attributes": True}


# ─── Book (Книга) ─────────────────────────────────────────────────────────────

class BookCreate(BaseModel):
    name: str
    author: str
    year_of_publication: int
    genre: Optional[str] = None

class BookUpdate(BaseModel):
    name: Optional[str] = None
    author: Optional[str] = None
    year_of_publication: Optional[int] = None
    genre: Optional[str] = None

class BookOut(BaseModel):
    id: int
    name: str
    author: str
    year_of_publication: int
    genre: Optional[str]

    model_config = {"from_attributes": True}


# ─── Copy (Экземпляр) ─────────────────────────────────────────────────────────

class CopyCreate(BaseModel):
    book_id: int
    status: str
    condition: str
    rack_id: Optional[int] = None

class CopyUpdate(BaseModel):
    book_id: Optional[int] = None
    status: Optional[str] = None
    condition: Optional[str] = None
    rack_id: Optional[int] = None

class CopyOut(BaseModel):
    id: int
    book_id: int
    status: str
    condition: str
    rack_id: Optional[int]

    model_config = {"from_attributes": True}


# ─── Reader (Читатель) ────────────────────────────────────────────────────────

class ReaderCreate(BaseModel):
    full_name: str
    birth_date: date
    passport_data: str
    discharge_date: Optional[date] = None
    profession: Optional[str] = None
    status: str = "активный"

class ReaderUpdate(BaseModel):
    full_name: Optional[str] = None
    birth_date: Optional[date] = None
    passport_data: Optional[str] = None
    discharge_date: Optional[date] = None
    profession: Optional[str] = None
    status: Optional[str] = None

class ReaderOut(BaseModel):
    id: int
    full_name: str
    birth_date: date
    passport_data: str
    discharge_date: Optional[date]
    profession: Optional[str]
    status: str

    model_config = {"from_attributes": True}


# ─── Registration (Регистрация) ───────────────────────────────────────────────

class RegistrationCreate(BaseModel):
    reader_id: int
    ticket_number: str
    filial_id: int
    registration_date: date

class RegistrationUpdate(BaseModel):
    reader_id: Optional[int] = None
    ticket_number: Optional[str] = None
    filial_id: Optional[int] = None
    registration_date: Optional[date] = None

class RegistrationOut(BaseModel):
    id: int
    reader_id: int
    ticket_number: str
    filial_id: int
    registration_date: date

    model_config = {"from_attributes": True}


# ─── Loan (Формуляр) ──────────────────────────────────────────────────────────

class LoanCreate(BaseModel):
    reader_id: int
    copy_id: int
    issue_date: date
    planned_return_date: date
    actual_return_date: Optional[date] = None

class LoanUpdate(BaseModel):
    reader_id: Optional[int] = None
    copy_id: Optional[int] = None
    issue_date: Optional[date] = None
    planned_return_date: Optional[date] = None
    actual_return_date: Optional[date] = None

class LoanOut(BaseModel):
    id: int
    reader_id: int
    copy_id: int
    issue_date: date
    planned_return_date: date
    actual_return_date: Optional[date]

    model_config = {"from_attributes": True}


# ─── SQL Query ────────────────────────────────────────────────────────────────

class SQLQueryRequest(BaseModel):
    query: str
