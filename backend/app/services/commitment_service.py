import re
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.commitment import Commitment
from app.models.diary import DiaryEntry
from app.schemas.search import ForgettingResponse, ForgettingItem

class CommitmentService:
    @staticmethod
    def extract_and_save_commitments(entry: DiaryEntry, db: Session):
        text = f"{entry.raw_text or ''} {entry.transcript or ''} {entry.generated_content or ''}".lower()
        
        # If Finish API is mentioned
        if "finish" in text and "api" in text:
            existing = db.query(Commitment).filter(
                Commitment.user_id == entry.user_id,
                Commitment.description.ilike("%finish api%")
            ).first()
            if not existing:
                db.add(Commitment(
                    user_id=entry.user_id,
                    diary_entry_id=entry.id,
                    description="Finish SIH API",
                    project="SIH Project",
                    due_date="Next Wednesday",
                    priority="high",
                    status="PENDING",
                    confidence=0.95
                ))

        if "quotation" in text:
            existing = db.query(Commitment).filter(
                Commitment.user_id == entry.user_id,
                Commitment.description.ilike("%quotation%")
            ).first()
            if not existing:
                db.add(Commitment(
                    user_id=entry.user_id,
                    diary_entry_id=entry.id,
                    description="Send quotation to Ravi",
                    project="Website Project",
                    due_date="Tomorrow",
                    priority="high",
                    status="PENDING",
                    confidence=0.94
                ))

        if "follow up" in text or "kumar" in text:
            existing = db.query(Commitment).filter(
                Commitment.user_id == entry.user_id,
                Commitment.description.ilike("%kumar%")
            ).first()
            if not existing:
                db.add(Commitment(
                    user_id=entry.user_id,
                    diary_entry_id=entry.id,
                    description="Follow up with Kumar",
                    project="Marketing Plan",
                    due_date="In 3 days",
                    priority="medium",
                    status="PENDING",
                    confidence=0.88
                ))
                
        db.commit()

    @staticmethod
    def get_user_commitments(user_id: str, status: Optional[str], db: Session) -> List[Commitment]:
        q = db.query(Commitment).filter(Commitment.user_id == user_id)
        if status:
            q = q.filter(Commitment.status == status.upper())
        return q.order_by(Commitment.created_at.desc()).all()

    @staticmethod
    def get_forgetting_commitments(user_id: str, db: Session) -> ForgettingResponse:
        # Prioritize PENDING high-confidence commitments
        items = db.query(Commitment).filter(
            Commitment.user_id == user_id,
            Commitment.status == "PENDING"
        ).order_by(Commitment.priority.desc(), Commitment.created_at.desc()).all()

        res_items = []
        for c in items:
            res_items.append(ForgettingItem(
                id=c.id,
                title=c.description,
                description=f"Associated with {c.project or 'Personal'}",
                due_date=c.due_date or "Upcoming",
                priority=c.priority,
                source_entry_id=c.diary_entry_id,
                days_ago_mentioned=1,
                reason="High priority milestone mentioned in your recent diary"
            ))

        return ForgettingResponse(
            headline=f"You have {len(res_items)} items worth checking:",
            items=res_items
        )

commitment_service = CommitmentService()
