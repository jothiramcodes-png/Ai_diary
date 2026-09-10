from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
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
