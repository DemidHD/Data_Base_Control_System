from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


# ─── Filial ──────────────────────────────────────────────────────────────────

class FilialCreate(BaseModel):
    address: str
    name_library: str

class FilialUpdate(BaseModel):
    address: Optional[str] = None
    name_library: Optional[str] = None

class FilialOut(BaseModel):
    id: int
    address: str
    name_library: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── User ────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    number_reading_ticket: str
    passport_data: str
    professions: Optional[str] = None
    gender: str
    years: int
    sing_in: date
    sing_out: Optional[date] = None

class UserUpdate(BaseModel):
    number_reading_ticket: Optional[str] = None
    passport_data: Optional[str] = None
    professions: Optional[str] = None
    gender: Optional[str] = None
    years: Optional[int] = None
    sing_in: Optional[date] = None
    sing_out: Optional[date] = None

class UserOut(BaseModel):
    id: int
    number_reading_ticket: str
    passport_data: str
    professions: Optional[str]
    gender: str
    years: int
    sing_in: date
    sing_out: Optional[date]
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Book ────────────────────────────────────────────────────────────────────

class BookCreate(BaseModel):
    name: str
    author: str
    year_of_publication: int
    topic: Optional[str] = None

class BookUpdate(BaseModel):
    name: Optional[str] = None
    author: Optional[str] = None
    year_of_publication: Optional[int] = None
    topic: Optional[str] = None

class BookOut(BaseModel):
    id: int
    name: str
    author: str
    year_of_publication: int
    topic: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Loan (Экземпляр книги) ──────────────────────────────────────────────────

class LoanCreate(BaseModel):
    id_book_id: int
    id_filial_id: int
    status_condition: str
    status_free: str
    address: Optional[str] = None
    nomer_room: Optional[str] = None
    rack_coordination: Optional[str] = None

class LoanUpdate(BaseModel):
    id_book_id: Optional[int] = None
    id_filial_id: Optional[int] = None
    status_condition: Optional[str] = None
    status_free: Optional[str] = None
    address: Optional[str] = None
    nomer_room: Optional[str] = None
    rack_coordination: Optional[str] = None

class LoanOut(BaseModel):
    id: int
    id_book_id: int
    id_filial_id: int
    status_condition: str
    status_free: str
    address: Optional[str]
    nomer_room: Optional[str]
    rack_coordination: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── UserLoan (Формуляр) ─────────────────────────────────────────────────────

class UserLoanCreate(BaseModel):
    id_user_id: int
    id_loan_id: int
    id_filial_id: int
    date_issue: date
    date_return: Optional[date] = None

class UserLoanUpdate(BaseModel):
    id_user_id: Optional[int] = None
    id_loan_id: Optional[int] = None
    id_filial_id: Optional[int] = None
    date_issue: Optional[date] = None
    date_return: Optional[date] = None

class UserLoanOut(BaseModel):
    id: int
    id_user_id: int
    id_loan_id: int
    id_filial_id: int
    date_issue: date
    date_return: Optional[date]
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Catalog ─────────────────────────────────────────────────────────────────

class CatalogCreate(BaseModel):
    id_book_id: int
    catalog_type: str
    catalog_value: str

class CatalogUpdate(BaseModel):
    id_book_id: Optional[int] = None
    catalog_type: Optional[str] = None
    catalog_value: Optional[str] = None

class CatalogOut(BaseModel):
    id: int
    id_book_id: int
    catalog_type: str
    catalog_value: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── BookTransaction (Поступление и списание) ────────────────────────────────

class BookTransactionCreate(BaseModel):
    id_loan_id: int
    operation_type: str
    operation_date: date
    reason: Optional[str] = None

class BookTransactionUpdate(BaseModel):
    id_loan_id: Optional[int] = None
    operation_type: Optional[str] = None
    operation_date: Optional[date] = None
    reason: Optional[str] = None

class BookTransactionOut(BaseModel):
    id: int
    id_loan_id: int
    operation_type: str
    operation_date: date
    reason: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── UserFilial (Регистрация в филиале) ──────────────────────────────────────

class UserFilialCreate(BaseModel):
    id_user_id: int
    id_filial_id: int
    registration_date: date

class UserFilialUpdate(BaseModel):
    id_user_id: Optional[int] = None
    id_filial_id: Optional[int] = None
    registration_date: Optional[date] = None

class UserFilialOut(BaseModel):
    id: int
    id_user_id: int
    id_filial_id: int
    registration_date: date
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── SQL Query ───────────────────────────────────────────────────────────────

class SQLQueryRequest(BaseModel):
    query: str
