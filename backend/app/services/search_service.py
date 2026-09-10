from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.diary import DiaryEntry
from app.models.entity import Entity
from app.models.commitment import Commitment
from app.models.routine import Routine
from app.ai.stt_service import get_ai_provider
from app.schemas.search import ConversationalAnswer, SearchResultItem

class SearchService:
    @staticmethod
    async def ask_question(user_id: str, query: str, db: Session) -> ConversationalAnswer:
        # 1. Load user profile & preferences
        user = db.query(User).filter(User.id == user_id).first()
        user_name = user.full_name if user else "User"
        user_prefs = user.preferences if user and user.preferences else {}

        # 2. Load commitments
        commitments = db.query(Commitment).filter(
            Commitment.user_id == user_id,
            Commitment.status == "PENDING"
        ).order_by(Commitment.created_at.desc()).all()

        # 3. Load routines
        routines = db.query(Routine).filter(Routine.user_id == user_id).all()

        # 4. Load entities
        entities = db.query(Entity).filter(Entity.user_id == user_id).all()

        # 5. Load user diary entries
        entries = db.query(DiaryEntry).filter(
            DiaryEntry.user_id == user_id,
            DiaryEntry.status.in_(["CONFIRMED", "COMPLETED", "INDEXED", "USER_REVIEW", "DRAFTED"])
        ).order_by(DiaryEntry.entry_date.desc()).all()

        entry_dicts = [
            {
                "id": e.id,
                "title": e.title,
                "raw_text": e.raw_text,
                "generated_content": e.generated_content,
                "category": e.category,
                "entry_date": e.entry_date.strftime("%B %d, %Y") if e.entry_date else ""
            }
            for e in entries
        ]

        user_profile_payload = {
            "full_name": user_name,
            "email": user.email if user else "",
            "preferences": user_prefs,
            "commitments": [
                {
                    "description": c.description,
                    "project": c.project,
                    "due_date": c.due_date,
                    "priority": c.priority
                }
                for c in commitments
            ],
            "routines": [
                {
                    "title": r.title,
                    "activity": r.activity,
                    "location": r.location,
                    "frequency": r.frequency,
                    "confidence": r.confidence,
                    "details": r.details,
                    "deviation": r.deviation_prompt
                }
                for r in routines
            ],
            "entities": [
                {
                    "type": ent.type,
                    "name": ent.name
                }
                for ent in entities
            ]
        }

        ai_provider = get_ai_provider()
        try:
            # Try passing user_profile to modern provider (OpenRouterProvider)
            res = await ai_provider.answer_question(query, entry_dicts, user_profile=user_profile_payload)
        except TypeError:
            # Fallback if provider signature only accepts (query, context_entries)
            res = await ai_provider.answer_question(query, entry_dicts)

        matched_results = []
        for e in entries[:4]:
            matched_results.append(SearchResultItem(
                entry_id=e.id,
                title=e.title or "Untitled",
                snippet=(e.generated_content or e.raw_text or "")[:150] + "...",
                category=e.category or "General",
                date=e.entry_date or e.created_at,
                score=0.92
            ))

        unique_entities = list(dict.fromkeys([ent.name for ent in entities if ent.name]))[:6]
        if not unique_entities:
            unique_entities = ["Memory", "Journal", "Personal"]

        return ConversationalAnswer(
            query=query,
            answer=res.get("answer", "No memory found for this query."),
            source_entry_id=res.get("source_entry_id"),
            related_entries=matched_results,
            related_entities=unique_entities
        )

search_service = SearchService()
