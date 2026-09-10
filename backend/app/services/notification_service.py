from typing import List
from sqlalchemy.orm import Session
from app.models.notification import Notification

class NotificationService:
    @staticmethod
    def get_user_notifications(user_id: str, db: Session) -> List[Notification]:
        return db.query(Notification).filter(Notification.user_id == user_id).order_by(Notification.created_at.desc()).all()

    @staticmethod
    def create_notification(user_id: str, title: str, message: str, category: str, db: Session) -> Notification:
        notif = Notification(user_id=user_id, title=title, message=message, category=category)
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif

notification_service = NotificationService()
