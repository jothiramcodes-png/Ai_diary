from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.schemas.graph import LifeGraphOut
from app.services.life_graph_service import LifeGraphService

router = APIRouter(prefix="/life-graph", tags=["life-graph"])

@router.get("", response_model=LifeGraphOut)
def get_life_graph(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return LifeGraphService.get_user_graph(current_user.id, db)

@router.get("/entities")
def get_life_graph_entities(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return LifeGraphService.get_user_entities(current_user.id, db)

