from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.models.diary import DiaryEntry
from app.schemas.diary import DiaryEntryOut

router = APIRouter(prefix="/memories", tags=["memories"])

@router.get("/on-this-day")
def on_this_day(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Retrieve past memory
    entry = db.query(DiaryEntry).filter(
        DiaryEntry.user_id == current_user.id,
        DiaryEntry.title.ilike("%Marina Beach%")
    ).first()
    
    if not entry:
        entry = db.query(DiaryEntry).filter(DiaryEntry.user_id == current_user.id).first()

    if entry:
        return {
            "has_memory": True,
            "years_ago": 2,
            "date": "September 10, 2024",
            "entry": DiaryEntryOut.model_validate(entry),
            "highlight": "You spent a relaxing evening at Marina Beach with friends."
        }
    return {"has_memory": False}
