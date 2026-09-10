from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.schemas.search import SearchQuery, ConversationalAnswer, ForgettingResponse
from app.services.search_service import SearchService
from app.services.commitment_service import CommitmentService

router = APIRouter(prefix="/search", tags=["search"])

@router.post("", response_model=ConversationalAnswer)
@router.post("/ask", response_model=ConversationalAnswer)
async def ask_diary(
    payload: SearchQuery,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return await SearchService.ask_question(current_user.id, payload.query, db)

@router.post("/forgetting", response_model=ForgettingResponse)
def what_am_i_forgetting(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return CommitmentService.get_forgetting_commitments(current_user.id, db)
