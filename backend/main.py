from fastapi import FastAPI, UploadFile, File, HTTPException, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
import os
import shutil
from typing import List, Optional

from services import process_document, ask_question, generate_summary, generate_quiz, load_note_context
from database import engine, Base, get_db
import models
import schemas
import auth

# Create DB tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Smart AI Study Assistant API")

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploaded_docs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class QuestionRequest(BaseModel):
    question: str
    note_id: Optional[int] = None

class QuizRequest(BaseModel):
    num_questions: int = 5

@app.post("/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    db_username = db.query(models.User).filter(models.User.username == user.username).first()
    if db_username:
        raise HTTPException(status_code=400, detail="Username already registered")
        
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(username=user.username, email=user.email, password_hash=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/notes", response_model=List[schemas.NoteResponse])
def get_notes(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    notes = db.query(models.Note).filter(models.Note.user_id == current_user.id).order_by(models.Note.created_at.desc()).all()
    return notes

@app.get("/dashboard-stats")
def get_dashboard_stats(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    notes_count = db.query(models.Note).filter(models.Note.user_id == current_user.id).count()
    queries_count = db.query(models.QueryHistory).filter(models.QueryHistory.user_id == current_user.id).count()
    bookmarked_notes = db.query(models.Note).filter(models.Note.user_id == current_user.id, models.Note.is_bookmarked == 1).count()
    
    # get a small summary of categories
    from sqlalchemy import func
    categories = db.query(models.Note.category, func.count(models.Note.id)).filter(models.Note.user_id == current_user.id).group_by(models.Note.category).all()
    
    return {
        "total_notes": notes_count,
        "total_queries": queries_count,
        "bookmarked_notes": bookmarked_notes,
        "categories": [{"name": c[0], "count": c[1]} for c in categories]
    }

@app.delete("/notes/{note_id}")
def delete_note(note_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    note = db.query(models.Note).filter(models.Note.id == note_id, models.Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(note)
    db.commit()
    return {"message": "Note deleted successfully"}

@app.post("/load-note/{note_id}")
async def load_note(note_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    note = db.query(models.Note).filter(models.Note.id == note_id, models.Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    try:
        load_note_context(note.content, note.id)
        return {"message": "Note loaded into AI context successfully", "title": note.title}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=traceback.format_exc())

@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...), 
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(('.pdf', '.txt')):
        raise HTTPException(status_code=400, detail="Only PDF and TXT files are supported")
    
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        # Create note entry first to get the ID
        new_note = models.Note(
            title=file.filename,
            content="", # Will update after extraction
            user_id=current_user.id
        )
        db.add(new_note)
        db.commit()
        db.refresh(new_note)

        # Process the document for RAG with the note_id
        extracted_text = process_document(file_path, file.filename, new_note.id)
        
        # Extract keywords using spaCy and TF-IDF
        from services import extract_keywords
        keywords = extract_keywords(extracted_text)
        
        # Update the content
        new_note.content = extracted_text[:100000]
        new_note.keywords = keywords
        db.commit()
        
        return {"message": "Document uploaded and processed successfully", "note_id": new_note.id, "filename": file.filename}
    except Exception as e:
        import traceback
        error_msg = traceback.format_exc()
        raise HTTPException(status_code=500, detail=error_msg)

@app.post("/ask")
async def ask(
    request: QuestionRequest, 
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if not request.question:
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    
    try:
        answer = ask_question(request.question)
        
        if request.note_id:
            history_entry = models.QueryHistory(
                user_id=current_user.id,
                note_id=request.note_id,
                question=request.question,
                answer=answer
            )
            db.add(history_entry)
            db.commit()
            
        return {"answer": answer}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history/{note_id}", response_model=List[schemas.QueryHistoryResponse])
def get_query_history(note_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    history = db.query(models.QueryHistory).filter(
        models.QueryHistory.note_id == note_id,
        models.QueryHistory.user_id == current_user.id
    ).order_by(models.QueryHistory.created_at.asc()).all()
    return history

@app.post("/bookmark-note/{note_id}")
def bookmark_note(note_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    note = db.query(models.Note).filter(models.Note.id == note_id, models.Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    note.is_bookmarked = 1 if note.is_bookmarked == 0 else 0
    db.commit()
    return {"message": "Bookmark toggled", "is_bookmarked": note.is_bookmarked}

@app.post("/bookmark-query/{query_id}")
def bookmark_query(query_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    query = db.query(models.QueryHistory).filter(models.QueryHistory.id == query_id, models.QueryHistory.user_id == current_user.id).first()
    if not query:
        raise HTTPException(status_code=404, detail="Query not found")
    query.is_bookmarked = 1 if query.is_bookmarked == 0 else 0
    db.commit()
    return {"message": "Bookmark toggled", "is_bookmarked": query.is_bookmarked}

@app.post("/summarize")
async def summarize():
    try:
        summary = generate_summary()
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/quiz")
async def create_quiz(request: QuizRequest):
    try:
        quiz = generate_quiz(request.num_questions)
        return {"quiz": quiz}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/reset")
async def reset_app():
    from services import reset_context
    try:
        reset_context()
        # Clean up uploaded docs
        for filename in os.listdir(UPLOAD_DIR):
            file_path = os.path.join(UPLOAD_DIR, filename)
            try:
                if os.path.isfile(file_path):
                    os.unlink(file_path)
            except Exception as e:
                pass
        return {"message": "Context reset successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
