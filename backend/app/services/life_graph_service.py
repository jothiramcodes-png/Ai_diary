from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.diary import DiaryEntry
from app.models.entity import Entity
from app.models.life_graph import LifeGraphRelationship
from app.schemas.graph import LifeGraphOut, GraphNode, GraphEdge

class LifeGraphService:
    @staticmethod
    def sync_entry_to_graph(entry: DiaryEntry, db: Session):
        user_id = entry.user_id
        entities = db.query(Entity).filter(Entity.diary_entry_id == entry.id).all()
        
        people = [e for e in entities if e.type == "person"]
        places = [e for e in entities if e.type == "place"]
        projects = [e for e in entities if e.type == "project"]
        commitments = db.query(DiaryEntry).filter(DiaryEntry.id == entry.id).first().commitments

        # Link: User -> met -> Person
        for p in people:
            db.add(LifeGraphRelationship(
                user_id=user_id,
                diary_entry_id=entry.id,
                source_type="User",
                source_name="You",
                target_type="Person",
                target_name=p.name,
                relationship_type="met",
                confidence=p.confidence
            ))
            
            # Link: Person -> worked_on -> Project
            for proj in projects:
                db.add(LifeGraphRelationship(
                    user_id=user_id,
                    diary_entry_id=entry.id,
                    source_type="Person",
                    source_name=p.name,
                    target_type="Project",
                    target_name=proj.name,
                    relationship_type="worked_on",
                    confidence=0.92
                ))

        # Link: User -> visited -> Place
        for pl in places:
            db.add(LifeGraphRelationship(
                user_id=user_id,
                diary_entry_id=entry.id,
                source_type="User",
                source_name="You",
                target_type="Place",
                target_name=pl.name,
                relationship_type="visited",
                confidence=pl.confidence
            ))

        # Link: Project -> requires -> Commitment
        for comm in commitments:
            proj_name = comm.project or (projects[0].name if projects else "Project")
            db.add(LifeGraphRelationship(
                user_id=user_id,
                diary_entry_id=entry.id,
                source_type="Project",
                source_name=proj_name,
                target_type="Commitment",
                target_name=comm.description,
                relationship_type="requires",
                confidence=comm.confidence
            ))
            
        db.commit()

    @staticmethod
    def get_user_graph(user_id: str, db: Session) -> LifeGraphOut:
        rels = db.query(LifeGraphRelationship).filter(LifeGraphRelationship.user_id == user_id).all()
        
        nodes_map = {}
        edges = []
        
        # Add root user node
        nodes_map["You"] = GraphNode(id="You", label="You", type="User")

        for r in rels:
            if r.source_name not in nodes_map:
                nodes_map[r.source_name] = GraphNode(id=r.source_name, label=r.source_name, type=r.source_type)
            if r.target_name not in nodes_map:
                nodes_map[r.target_name] = GraphNode(id=r.target_name, label=r.target_name, type=r.target_type)

            edges.append(GraphEdge(
                id=r.id,
                source=r.source_name,
                target=r.target_name,
                label=r.relationship_type,
                confidence=r.confidence
            ))

        # If empty graph, return default demo nodes
        if not edges:
            nodes_map["Ravi"] = GraphNode(id="Ravi", label="Ravi", type="Person")
            nodes_map["College"] = GraphNode(id="College", label="College", type="Place")
            nodes_map["SIH Project"] = GraphNode(id="SIH Project", label="SIH Project", type="Project")
            nodes_map["Finish API"] = GraphNode(id="Finish API", label="Finish API", type="Commitment")
            
            edges.extend([
                GraphEdge(id="e1", source="You", target="Ravi", label="met"),
                GraphEdge(id="e2", source="You", target="College", label="visited"),
                GraphEdge(id="e3", source="Ravi", target="SIH Project", label="worked_on"),
                GraphEdge(id="e4", source="SIH Project", target="Finish API", label="requires")
            ])

        return LifeGraphOut(nodes=list(nodes_map.values()), edges=edges)

    @staticmethod
    def get_user_entities(user_id: str, db: Session) -> Dict[str, Any]:
        entities = db.query(Entity).filter(Entity.user_id == user_id).all()
        
        people_dict = {}
        places_dict = {}
        
        for e in entities:
            entry = e.entry
            entry_info = None
            if entry:
                entry_info = {
                    "id": entry.id,
                    "title": entry.title or "Memory",
                    "date": entry.entry_date.strftime("%B %d, %Y") if entry.entry_date else "",
                    "photos": entry.photo_urls or []
                }
                
            if e.type == "person":
                if e.name not in people_dict:
                    people_dict[e.name] = {
                        "name": e.name,
                        "type": "person",
                        "count": 0,
                        "last_seen": entry_info["date"] if entry_info else "Recently",
                        "memories": [],
                        "relationships": ["Friend", "Collaborator"]
                    }
                people_dict[e.name]["count"] += 1
                if entry_info and not any(m["id"] == entry_info["id"] for m in people_dict[e.name]["memories"]):
                    people_dict[e.name]["memories"].append(entry_info)
                    
            elif e.type == "place":
                if e.name not in places_dict:
                    places_dict[e.name] = {
                        "name": e.name,
                        "type": "place",
                        "count": 0,
                        "last_visited": entry_info["date"] if entry_info else "Recently",
                        "memories": [],
                        "photos": []
                    }
                places_dict[e.name]["count"] += 1
                if entry_info and not any(m["id"] == entry_info["id"] for m in places_dict[e.name]["memories"]):
                    places_dict[e.name]["memories"].append(entry_info)
                    if entry_info["photos"]:
                        places_dict[e.name]["photos"].extend(entry_info["photos"])

        # If user has seeded or default entities
        if not people_dict and not places_dict:
            people_dict["Ravi"] = {
                "name": "Ravi",
                "type": "person",
                "count": 2,
                "last_seen": "Sep 10, 2026",
                "memories": [{"id": "m1", "title": "SIH Collaboration", "date": "Sep 10, 2026", "photos": []}],
                "relationships": ["Friend", "SIH Teammate"]
            }
            places_dict["Madurai"] = {
                "name": "Madurai",
                "type": "place",
                "count": 1,
                "last_visited": "Sep 10, 2026",
                "memories": [{"id": "m2", "title": "A Productive Day in Madurai", "date": "Sep 10, 2026", "photos": []}],
                "photos": ["https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400&auto=format&fit=crop&q=80"]
            }

        return {
            "people": list(people_dict.values()),
            "places": list(places_dict.values())
        }

life_graph_service = LifeGraphService()

