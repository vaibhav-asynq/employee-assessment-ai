from typing import Any, Dict, List, Optional

from db.core import NotFoundError
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .file import get_cached_task
from .models import DBAdvice


class Advice(BaseModel):
    id: int
    task_id: int
    advice: Dict[str, Any]

class AdviceCreate(BaseModel):
    task_id: int
    advice: Dict[str, Any]


def create_advice(advice: AdviceCreate, session: Session) -> DBAdvice:
    db_feedback = DBAdvice(
        task_id=advice.task_id,
        advice=advice.advice
    )
    session.add(db_feedback)
    session.commit()
    session.refresh(db_feedback)
    return db_feedback

def get_advice(advice_id: int, session: Session) -> DBAdvice:
    db_feedback = session.query(DBAdvice).filter(DBAdvice.id == advice_id).first()
    if db_feedback is None:
        raise NotFoundError(f"Advice with id {advice_id} not found.")
    return db_feedback

def get_advice_by_task(task_id: int, session: Session) -> List[DBAdvice]:
    return session.query(DBAdvice).filter(DBAdvice.task_id == task_id).all()

def update_advice(advice_id: int, advice_data: Dict[str, Any], session: Session) -> DBAdvice:
    db_advice = get_advice(advice_id, session)
    db_advice.advice = advice_data
    session.commit()
    session.refresh(db_advice)
    return db_advice

def delete_advice(advice_id: int, session: Session) -> None:
    db_feedback = get_advice(advice_id, session)
    session.delete(db_feedback)
    session.commit()

def get_cached_advice(user_id: str, file_id: str, session: Session) -> Optional[Dict[str, Any]]:
    cached_task = get_cached_task(user_id, file_id, session)
    
    if not cached_task:
        return None
    db_advice = (
        session.query(DBAdvice)
        .filter(DBAdvice.task_id == cached_task.id)
        .first()
    )
    if not db_advice:
        return None
    return db_advice.advice
