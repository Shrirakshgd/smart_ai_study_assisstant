from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="user")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    notes = relationship("Note", back_populates="owner")

class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String, default="General")
    keywords = Column(String, default="")
    is_bookmarked = Column(Integer, default=0) # using Integer 0/1 for SQLite boolean compatibility
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    owner = relationship("User", back_populates="notes")
    history = relationship("QueryHistory", back_populates="note", cascade="all, delete-orphan")

class QueryHistory(Base):
    __tablename__ = "query_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    note_id = Column(Integer, ForeignKey("notes.id"))
    question = Column(String, nullable=False)
    answer = Column(Text, nullable=False)
    is_bookmarked = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    note = relationship("Note", back_populates="history")
    user = relationship("User")
