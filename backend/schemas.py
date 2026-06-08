from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class NoteBase(BaseModel):
    title: str
    content: str
    category: Optional[str] = "General"
    keywords: Optional[str] = ""
    is_bookmarked: int = 0

class NoteCreate(NoteBase):
    pass

class NoteResponse(NoteBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class QueryHistoryResponse(BaseModel):
    id: int
    note_id: int
    question: str
    answer: str
    is_bookmarked: int = 0
    created_at: datetime

    class Config:
        from_attributes = True
