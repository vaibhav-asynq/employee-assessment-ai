from typing import Any, Dict, List, Optional

from db.core import NotFoundError
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .file import get_cached_task
from .models import DBFeedBack


class FeedBack(BaseModel):
    id: int
    task_id: int
    feedback: Dict[str, Any]

class FeedBackCreate(BaseModel):
    task_id: int
    feedback: Dict[str, Any]


def create_feedback(feedback: FeedBackCreate, session: Session) -> DBFeedBack:
    db_feedback = DBFeedBack(
        task_id=feedback.task_id,
        feedback=feedback.feedback
    )
    session.add(db_feedback)
    session.commit()
    session.refresh(db_feedback)
    return db_feedback

def get_feedback(feedback_id: int, session: Session) -> DBFeedBack:
    db_feedback = session.query(DBFeedBack).filter(DBFeedBack.id == feedback_id).first()
    if db_feedback is None:
        raise NotFoundError(f"Feedback with id {feedback_id} not found.")
    return db_feedback

def get_feedback_by_task(task_id: int, session: Session) -> List[DBFeedBack]:
    return session.query(DBFeedBack).filter(DBFeedBack.task_id == task_id).all()

def update_feedback(feedback_id: int, feedback_data: Dict[str, Any], session: Session) -> DBFeedBack:
    db_feedback = get_feedback(feedback_id, session)
    db_feedback.feedback = feedback_data
    session.commit()
    session.refresh(db_feedback)
    return db_feedback

def delete_feedback(feedback_id: int, session: Session) -> None:
    db_feedback = get_feedback(feedback_id, session)
    session.delete(db_feedback)
    session.commit()

def get_cached_feedback(user_id: str, file_id: str, session: Session ) -> Optional[Dict[str, Any]]:
    cached_task = get_cached_task(user_id, file_id , session)
    
    if not cached_task:
        return None
    db_feedback = (
        session.query(DBFeedBack)
        .filter(DBFeedBack.task_id == cached_task.id)
        .first()
    )
    if not db_feedback:
        return None
    return db_feedback.feedback
