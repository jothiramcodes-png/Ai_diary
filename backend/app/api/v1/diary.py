import os
import json
import asyncio
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse
from sse_starlette.sse import EventSourceResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.models.diary import DiaryEntry
from app.schemas.diary import DiaryEntryCreate, DiaryEntryOut, DiaryConfirmRequest, DiaryEntryUpdate, DiaryRegenerateRequest
from app.services.diary_service import DiaryService

router = APIRouter(prefix="/diary", tags=["diary"])

@router.post("/text", response_model=DiaryEntryOut)
async def create_text_entry(
    payload: DiaryEntryCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = await DiaryService.create_text_entry(
        user_id=current_user.id,
        raw_text=payload.raw_text,
        title=payload.title,
        category=payload.category,
        mood=payload.mood,
        db=db
    )
    background_tasks.add_task(DiaryService.process_entry_ai, entry.id)
    return DiaryEntryOut.model_validate(entry)

@router.post("/voice", response_model=DiaryEntryOut)
async def create_voice_entry(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    audio_bytes = await file.read()
    entry = await DiaryService.create_voice_entry(
        user_id=current_user.id,
        audio_bytes=audio_bytes,
        filename=file.filename or "voice.webm",
        db=db
    )
    background_tasks.add_task(DiaryService.process_entry_ai, entry.id)
    return DiaryEntryOut.model_validate(entry)

@router.post("/photo", response_model=DiaryEntryOut)
async def create_photo_entry(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    caption: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    image_bytes = await file.read()
    entry = await DiaryService.create_photo_entry(
        user_id=current_user.id,
        image_bytes=image_bytes,
        filename=file.filename or "photo.jpg",
        caption=caption,
        db=db
    )
    background_tasks.add_task(DiaryService.process_entry_ai, entry.id)
    return DiaryEntryOut.model_validate(entry)

@router.get("", response_model=List[DiaryEntryOut])
def list_entries(
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(DiaryEntry).filter(DiaryEntry.user_id == current_user.id)
    if category:
        q = q.filter(DiaryEntry.category.ilike(f"%{category}%"))
    return [DiaryEntryOut.model_validate(e) for e in q.order_by(DiaryEntry.entry_date.desc()).all()]

@router.get("/photos")
def list_photos(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entries = db.query(DiaryEntry).filter(
        DiaryEntry.user_id == current_user.id
    ).order_by(DiaryEntry.entry_date.desc()).all()
    
    photos = []
    for e in entries:
        urls = list(e.photo_urls or [])
        if e.media_path and e.input_type == "photo" and os.path.exists(e.media_path):
            media_url = f"/api/v1/diary/{e.id}/media"
            if media_url not in urls:
                urls = [media_url] + urls
                
        for idx, u in enumerate(urls):
            photos.append({
                "id": f"{e.id}-p{idx}",
                "entry_id": e.id,
                "url": u,
                "title": e.title or "Photo Memory",
                "date": e.entry_date.strftime("%B %d, %Y") if e.entry_date else "Recent",
                "category": e.category or "Personal",
                "mood": e.mood or "happy",
                "caption": (e.generated_content or e.raw_text or e.title or "")[:120]
            })
            
    if not photos:
        photos = [
            {
                "id": "demo-p1",
                "entry_id": "entry-madurai-today",
                "url": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80",
                "title": "Biryani Lunch with Kumar",
                "date": "September 10, 2026",
                "category": "Food",
                "mood": "happy",
                "caption": "Enjoyed delicious aromatic biryani at ABC Restaurant after our meeting."
            },
            {
                "id": "demo-p2",
                "entry_id": "entry-madurai-today",
                "url": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&auto=format&fit=crop&q=80",
                "title": "Client Meeting in Madurai",
                "date": "September 10, 2026",
                "category": "Business / Travel",
                "mood": "productive",
                "caption": "Meeting with Ravi discussing milestones for the website project."
            },
            {
                "id": "demo-p3",
                "entry_id": "entry-madurai-today",
                "url": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=500&auto=format&fit=crop&q=80",
                "title": "Madurai Temple View",
                "date": "September 10, 2026",
                "category": "Travel",
                "mood": "peaceful",
                "caption": "Stopped by the historic temple before heading back home."
            },
            {
                "id": "demo-p4",
                "entry_id": "entry-marina-beach",
                "url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80",
                "title": "Marina Beach Sunset",
                "date": "September 10, 2024",
                "category": "Personal",
                "mood": "nostalgic",
                "caption": "A memorable evening by the waves watching the sunset with friends."
            }
        ]
        
    return photos

@router.get("/{entry_id}", response_model=DiaryEntryOut)
def get_entry(
    entry_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = db.query(DiaryEntry).filter(DiaryEntry.id == entry_id, DiaryEntry.user_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    return DiaryEntryOut.model_validate(entry)

@router.get("/{entry_id}/status")
def get_entry_status(
    entry_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = db.query(DiaryEntry).filter(DiaryEntry.id == entry_id, DiaryEntry.user_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {
        "id": entry.id,
        "status": entry.status,
        "history": entry.status_history or [],
        "disambiguation": entry.disambiguation,
        "generated_content": entry.generated_content,
        "title": entry.title
    }

@router.post("/{entry_id}/retry", response_model=DiaryEntryOut)
async def retry_entry_processing(
    entry_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = db.query(DiaryEntry).filter(DiaryEntry.id == entry_id, DiaryEntry.user_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    background_tasks.add_task(DiaryService.process_entry_ai, entry.id)
    return DiaryEntryOut.model_validate(entry)

@router.post("/{entry_id}/regenerate", response_model=DiaryEntryOut)
async def regenerate_entry(
    entry_id: str,
    payload: Optional[DiaryRegenerateRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tone = payload.tone if payload else "reflective"
    instructions = payload.instructions if payload else None
    try:
        updated = await DiaryService.regenerate_entry(
            user_id=current_user.id,
            entry_id=entry_id,
            tone=tone,
            instructions=instructions,
            db=db
        )
        return DiaryEntryOut.model_validate(updated)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to regenerate diary entry: {str(e)}")

@router.get("/{entry_id}/media")
def get_entry_media(
    entry_id: str,
    db: Session = Depends(get_db)
):
    entry = db.query(DiaryEntry).filter(DiaryEntry.id == entry_id).first()
    if not entry or not entry.media_path or not os.path.exists(entry.media_path):
        raise HTTPException(status_code=404, detail="Media not found")
    media_type = "audio/webm" if entry.input_type == "voice" else "image/jpeg"
    return FileResponse(entry.media_path, media_type=media_type)

@router.get("/{entry_id}/events")
async def stream_entry_events(
    entry_id: str,
    db: Session = Depends(get_db)
):
    async def event_generator():
        last_status = None
        for _ in range(60):  # Stream for up to 60 seconds
            entry = db.query(DiaryEntry).filter(DiaryEntry.id == entry_id).first()
            if entry and entry.status != last_status:
                last_status = entry.status
                data = {
                    "entry_id": entry.id,
                    "status": entry.status,
                    "history": entry.status_history or [],
                    "title": entry.title,
                    "generated_content": entry.generated_content
                }
                yield {"event": "status", "data": json.dumps(data)}
                if entry.status in ["USER_REVIEW", "COMPLETED", "FAILED", "ENRICHMENT_PENDING"]:
                    break
            await asyncio.sleep(1)

    return EventSourceResponse(event_generator())

@router.post("/{entry_id}/confirm", response_model=DiaryEntryOut)
async def confirm_entry(
    entry_id: str,
    payload: DiaryConfirmRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = await DiaryService.confirm_entry(
        user_id=current_user.id,
        entry_id=entry_id,
        confirmed_title=payload.confirmed_title,
        confirmed_content=payload.confirmed_content,
        disambiguation_resolution=payload.disambiguation_resolution,
        db=db
    )
    return DiaryEntryOut.model_validate(entry)

@router.patch("/{entry_id}", response_model=DiaryEntryOut)
def update_entry(
    entry_id: str,
    payload: DiaryEntryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = db.query(DiaryEntry).filter(DiaryEntry.id == entry_id, DiaryEntry.user_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    if payload.title:
        entry.title = payload.title
    if payload.generated_content:
        entry.generated_content = payload.generated_content
    if payload.category:
        entry.category = payload.category
    if payload.mood:
        entry.mood = payload.mood
    db.commit()
    db.refresh(entry)
    return DiaryEntryOut.model_validate(entry)

@router.delete("/{entry_id}")
def delete_entry(
    entry_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = db.query(DiaryEntry).filter(DiaryEntry.id == entry_id, DiaryEntry.user_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(entry)
    db.commit()
    return {"message": "Entry deleted successfully"}
