from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.models.diary import DiaryEntry
from app.models.entity import Entity
from app.models.commitment import Commitment
from app.schemas.routine import RoutineOut, RoutineDeviationAction
from app.services.routine_service import RoutineService

router = APIRouter(prefix="/routines", tags=["routines"])

@router.get("", response_model=List[RoutineOut])
def get_routines(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    items = RoutineService.get_user_routines(current_user.id, db)
    return [RoutineOut.model_validate(r) for r in items]

@router.get("/insights")
def get_insights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. User routines
    routines = RoutineService.get_user_routines(current_user.id, db)
    routines_out = [RoutineOut.model_validate(r).model_dump() for r in routines]

    # 2. Entries & Mood stats
    entries = db.query(DiaryEntry).filter(DiaryEntry.user_id == current_user.id).order_by(DiaryEntry.entry_date.desc()).all()
    mood_counts = {}
    category_counts = {}
    for e in entries:
        if e.mood:
            mood_counts[e.mood] = mood_counts.get(e.mood, 0) + 1
        if e.category:
            category_counts[e.category] = category_counts.get(e.category, 0) + 1

    # 3. People & Places frequency
    entities = db.query(Entity).filter(Entity.user_id == current_user.id).all()
    people_map = {}
    places_map = {}
    for ent in entities:
        if ent.type == "person":
            people_map[ent.name] = people_map.get(ent.name, 0) + 1
        elif ent.type == "place":
            places_map[ent.name] = places_map.get(ent.name, 0) + 1

    top_people = sorted([{"name": k, "count": v} for k, v in people_map.items()], key=lambda x: x["count"], reverse=True)[:5]
    top_places = sorted([{"name": k, "count": v} for k, v in places_map.items()], key=lambda x: x["count"], reverse=True)[:5]

    # 4. Commitments overview
    commitments = db.query(Commitment).filter(Commitment.user_id == current_user.id).all()
    pending_comm = sum(1 for c in commitments if c.status == "PENDING")
    completed_comm = sum(1 for c in commitments if c.status == "COMPLETED")

    # 5. Smart AI life observations
    observations = []
    if routines:
        devs = [r for r in routines if r.deviation_active]
        if devs:
            observations.append(f"Noticed {len(devs)} routine deviation: '{devs[0].title}'. Travelling or unexpected schedule shifts detected.")
        else:
            observations.append("You have kept a 100% steady routine cadence across your tracked habits.")
    
    if top_people:
        observations.append(f"Most frequent collaborator this month: {top_people[0]['name']} ({top_people[0]['count']} shared memories).")
    
    if top_places:
        observations.append(f"Top frequented location: {top_places[0]['name']} ({top_places[0]['count']} visits logged).")

    if pending_comm > 0:
        observations.append(f"You have {pending_comm} pending commitments currently awaiting completion.")
    else:
        observations.append("All commitments are fulfilled. Great focus on execution!")

    return {
        "routines": routines_out,
        "total_memories": len(entries),
        "mood_distribution": mood_counts,
        "category_distribution": category_counts,
        "top_people": top_people,
        "top_places": top_places,
        "commitments_summary": {
            "pending": pending_comm,
            "completed": completed_comm,
            "total": len(commitments)
        },
        "ai_observations": observations
    }

@router.post("/{routine_id}/action", response_model=RoutineOut)
def handle_deviation(
    routine_id: str,
    payload: RoutineDeviationAction,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        updated = RoutineService.handle_deviation_action(routine_id, current_user.id, payload.action, payload.note, db)
        return RoutineOut.model_validate(updated)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

