from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class GraphNode(BaseModel):
    id: str
    label: str
    type: str  # "User", "Person", "Place", "Project", "Commitment", "Activity"
    attributes: Dict[str, Any] = {}

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str  # "met", "visited", "worked_on", "requires", "scheduled_for"
    confidence: float = 0.95

class LifeGraphOut(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
