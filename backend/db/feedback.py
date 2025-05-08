from typing import Any, Dict, List, Optional

from db.core import NotFoundError
from pydantic import BaseModel
from sqlalchemy.orm import Session
from utils.loggers.db_logger import logger as dbLogger
from utils.loggers.endPoint_logger import logger as ApiLogger

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
    dbLogger.info(f"Creating feedback for task_id: {feedback.task_id}")
    db_feedback = DBFeedBack(
        task_id=feedback.task_id,
        feedback=feedback.feedback
    )
    session.add(db_feedback)
    session.commit()
    session.refresh(db_feedback)
    dbLogger.info(f"Feedback created with id: {db_feedback.id}")
    return db_feedback

def get_feedback(feedback_id: int, session: Session) -> DBFeedBack:
    dbLogger.info(f"Retrieving feedback with id: {feedback_id}")
    db_feedback = session.query(DBFeedBack).filter(DBFeedBack.id == feedback_id).first()
    if db_feedback is None:
        dbLogger.error(f"Feedback with id {feedback_id} not found")
        raise NotFoundError(f"Feedback with id {feedback_id} not found.")
    dbLogger.info(f"Successfully retrieved feedback with id: {feedback_id}")
    return db_feedback

def get_feedback_by_task(task_id: int, session: Session) -> List[DBFeedBack]:
    dbLogger.info(f"Retrieving all feedback for task_id: {task_id}")
    feedbacks = session.query(DBFeedBack).filter(DBFeedBack.task_id == task_id).all()
    dbLogger.info(f"Found {len(feedbacks)} feedback entries for task_id: {task_id}")
    return feedbacks

def update_feedback(feedback_id: int, feedback_data: Dict[str, Any], session: Session) -> DBFeedBack:
    dbLogger.info(f"Updating feedback with id: {feedback_id}")
    db_feedback = get_feedback(feedback_id, session)
    db_feedback.feedback = feedback_data
    session.commit()
    session.refresh(db_feedback)
    dbLogger.info(f"Successfully updated feedback with id: {feedback_id}")
    return db_feedback

def delete_feedback(feedback_id: int, session: Session) -> None:
    dbLogger.info(f"Deleting feedback with id: {feedback_id}")
    db_feedback = get_feedback(feedback_id, session)
    session.delete(db_feedback)
    session.commit()
    dbLogger.info(f"Successfully deleted feedback with id: {feedback_id}")

def get_cached_feedback(user_id: str, file_id: str, session: Session ) -> Optional[Dict[str, Any]]:
    ApiLogger.info(f"Retrieving cached feedback for user_id: {user_id}, file_id: {file_id}")
    cached_task = get_cached_task(user_id, file_id, session)
    
    if not cached_task:
        ApiLogger.info(f"No cached task found for user_id: {user_id}, file_id: {file_id}")
        return None
    
    dbLogger.info(f"Looking for feedback with task_id: {cached_task.id}")
    db_feedback = (
        session.query(DBFeedBack)
        .filter(DBFeedBack.task_id == cached_task.id)
        .first()
    )
    
    if not db_feedback:
        dbLogger.info(f"No feedback found for task_id: {cached_task.id}")
        return None
    
    ApiLogger.info(f"Successfully retrieved cached feedback for user_id: {user_id}, file_id: {file_id}")
    return db_feedback.feedback
