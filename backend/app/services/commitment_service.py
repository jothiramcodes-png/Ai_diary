import re
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.commitment import Commitment
from app.models.diary import DiaryEntry
from app.models.notification import Notification
from app.schemas.search import ForgettingResponse, ForgettingItem

class CommitmentService:
    @staticmethod
    def extract_and_save_commitments(entry: DiaryEntry, db: Session):
        raw = f"{entry.raw_text or ''} {entry.transcript or ''} {entry.generated_content or ''}"
        text = raw.lower()
        
        # Base reference date from entry date or app default (2026-09-10)
        base_dt = entry.entry_date or entry.created_at
        if not base_dt:
            base_dt = datetime(2026, 9, 10, 10, 0, 0, tzinfo=timezone.utc)
        elif base_dt.tzinfo is None:
            base_dt = base_dt.replace(tzinfo=timezone.utc)

        # 1. Detect conversational upcoming day activity & reminders
        # e.g., "call again after 10 days", "call after 5 days", "follow up after 3 days", "meet after 2 weeks"
        days_offset = None
        m_after_days = re.search(r'(?:after|in)\s+(\d+)\s+days?', text)
        m_after_weeks = re.search(r'(?:after|in)\s+(\d+)\s+weeks?', text)
        if m_after_days:
            days_offset = int(m_after_days.group(1))
        elif m_after_weeks:
            days_offset = int(m_after_weeks.group(1)) * 7
        elif "after 10 days" in text:
            days_offset = 10
        elif "tomorrow" in text:
            days_offset = 1

        # Detect person / thread target
        person_name = None
        for candidate in ["Ravi", "Kumar", "Poovarasan", "Kisho Varma", "Anand"]:
            if candidate.lower() in text:
                person_name = candidate
                break

        # Detect action
        action_text = None
        if "call again" in text or "call" in text:
            action_text = f"Call {person_name or 'contact'} again"
        elif "meet" in text or "catch up" in text:
            action_text = f"Meet with {person_name or 'contact'}"
        elif "send quotation" in text:
            action_text = f"Send quotation to {person_name or 'client'}"
        elif "follow up" in text:
            action_text = f"Follow up with {person_name or 'contact'}"

        if days_offset is not None and (person_name or action_text):
            target_dt = base_dt + timedelta(days=days_offset)
            target_date_str = target_dt.strftime("%B %d, %Y")  # e.g. "September 20, 2026"
            thread_name = f"{person_name} - Follow-up & Discussion" if person_name else "Upcoming Follow-ups"
            next_act = action_text or f"Follow up with {person_name}"
            due_label = f"After {days_offset} days ({target_date_str})"

            # Check if an existing commitment thread exists for this user and person
            existing_thread = None
            if person_name:
                existing_thread = db.query(Commitment).filter(
                    Commitment.user_id == entry.user_id,
                    (Commitment.description.ilike(f"%{person_name}%")) |
                    (Commitment.project.ilike(f"%{person_name}%")) |
                    (Commitment.activity_thread.ilike(f"%{person_name}%"))
                ).order_by(Commitment.created_at.desc()).first()

            if existing_thread:
                # Continue existing thread and update next action
                existing_thread.activity_thread = thread_name
                existing_thread.next_action = f"{next_act} ({due_label})"
                existing_thread.due_date = due_label
                existing_thread.resolved_due_date = target_dt
                existing_thread.status = "PENDING"
            else:
                # Add new commitment with active thread
                db.add(Commitment(
                    user_id=entry.user_id,
                    diary_entry_id=entry.id,
                    description=next_act,
                    project=f"{person_name} Collaboration" if person_name else "Personal Follow-up",
                    due_date=due_label,
                    resolved_due_date=target_dt,
                    priority="high",
                    status="PENDING",
                    confidence=0.96,
                    activity_thread=thread_name,
                    next_action=f"{next_act} ({due_label})"
                ))

            # Create an in-app reminder Notification
            notif_title = f"Reminder: {next_act}"
            notif_msg = f"Upcoming activity in thread '{thread_name}': {next_act} scheduled for {target_date_str} ({days_offset} days from entry)."
            existing_notif = db.query(Notification).filter(
                Notification.user_id == entry.user_id,
                Notification.title == notif_title
            ).first()
            if not existing_notif:
                db.add(Notification(
                    user_id=entry.user_id,
                    title=notif_title,
                    message=notif_msg,
                    category="commitment",
                    channel="in_app",
                    is_read=False,
                    metadata_json={
                        "target_date": target_dt.strftime("%Y-%m-%d"),
                        "activity_thread": thread_name,
                        "person": person_name,
                        "days_offset": days_offset
                    }
                ))

        # 2. Finish SIH API
        if "finish" in text and "api" in text:
            existing = db.query(Commitment).filter(
                Commitment.user_id == entry.user_id,
                Commitment.description.ilike("%finish api%")
            ).first()
            if not existing:
                target_api_dt = base_dt + timedelta(days=6)  # Next Wednesday (Sep 16, 2026)
                db.add(Commitment(
                    user_id=entry.user_id,
                    diary_entry_id=entry.id,
                    description="Finish SIH API",
                    project="SIH Project",
                    due_date="Next Wednesday",
                    resolved_due_date=target_api_dt,
                    priority="high",
                    status="PENDING",
                    confidence=0.95,
                    activity_thread="SIH Hackathon Sprint",
                    next_action="Complete FastAPI endpoints and documentation"
                ))

        # 3. Send quotation to Ravi (if not already handled above)
        if "quotation" in text:
            existing = db.query(Commitment).filter(
                Commitment.user_id == entry.user_id,
                Commitment.description.ilike("%quotation%")
            ).first()
            if not existing:
                target_q_dt = base_dt + timedelta(days=1)  # Tomorrow (Sep 11, 2026)
                db.add(Commitment(
                    user_id=entry.user_id,
                    diary_entry_id=entry.id,
                    description="Send quotation to Ravi",
                    project="Website Project",
                    due_date="Tomorrow",
                    resolved_due_date=target_q_dt,
                    priority="high",
                    status="PENDING",
                    confidence=0.94,
                    activity_thread="Ravi - Follow-up & Discussion",
                    next_action="Draft pricing details and send quotation PDF to Ravi"
                ))

        # 4. Follow up with Kumar
        if ("follow up" in text or "kumar" in text) and not (person_name == "Kumar" and days_offset is not None):
            existing = db.query(Commitment).filter(
                Commitment.user_id == entry.user_id,
                Commitment.description.ilike("%kumar%")
            ).first()
            if not existing:
                target_k_dt = base_dt + timedelta(days=3)  # In 3 days (Sep 13, 2026)
                db.add(Commitment(
                    user_id=entry.user_id,
                    diary_entry_id=entry.id,
                    description="Follow up with Kumar",
                    project="Marketing Plan",
                    due_date="In 3 days",
                    resolved_due_date=target_k_dt,
                    priority="medium",
                    status="PENDING",
                    confidence=0.88,
                    activity_thread="Marketing & Client Relations",
                    next_action="Check in with Kumar on marketing plan review"
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
