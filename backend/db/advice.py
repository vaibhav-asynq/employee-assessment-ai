from typing import Any, Dict, List, Optional

from db.core import NotFoundError
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import Session
from utils.loggers.db_logger import logger as dbLogger
from utils.loggers.endPoint_logger import logger as ApiLogger

from .file import get_cached_task, async_get_task_by_user_and_fileId
from .models import DBAdvice


class Advice(BaseModel):
    id: int
    task_id: int
    advice: Dict[str, Any]

class AdviceCreate(BaseModel):
    task_id: int
    advice: Dict[str, Any]


def create_advice(advice: AdviceCreate, session: Session) -> DBAdvice:
    dbLogger.info(f"Creating new advice for task_id: {advice.task_id}")
    try:
        db_feedback = DBAdvice(
            task_id=advice.task_id,
            advice=advice.advice
        )
        session.add(db_feedback)
        session.commit()
        session.refresh(db_feedback)
        dbLogger.info(f"Successfully created advice with id: {db_feedback.id}")
        return db_feedback
    except Exception as e:
        dbLogger.error(f"Error creating advice: {str(e)}")
        session.rollback()
        raise

async def async_create_advice(advice: AdviceCreate, session: AsyncSession) -> DBAdvice:
    dbLogger.info(f"[ASYNC] Creating new advice for task_id: {advice.task_id}")
    try:
        db_feedback = DBAdvice(
            task_id=advice.task_id,
            advice=advice.advice
        )
        session.add(db_feedback)
        await session.commit()
        await session.refresh(db_feedback)
        dbLogger.info(f"[ASYNC] Successfully created advice with id: {db_feedback.id}")
        return db_feedback
    except Exception as e:
        dbLogger.error(f"[ASYNC] Error creating advice: {str(e)}")
        await session.rollback()
        raise

def get_advice(advice_id: int, session: Session) -> DBAdvice:
    dbLogger.debug(f"Retrieving advice with id: {advice_id}")
    db_feedback = session.query(DBAdvice).filter(DBAdvice.id == advice_id).first()
    if db_feedback is None:
        dbLogger.warning(f"Advice with id {advice_id} not found")
        raise NotFoundError(f"Advice with id {advice_id} not found.")
    dbLogger.debug(f"Successfully retrieved advice with id: {advice_id}")
    return db_feedback

async def async_get_advice(advice_id: int, session: AsyncSession) -> DBAdvice:
    dbLogger.debug(f"[ASYNC] Retrieving advice with id: {advice_id}")
    result = await session.execute(
        select(DBAdvice).filter(DBAdvice.id == advice_id)
    )
    db_feedback = result.scalars().first()
    if db_feedback is None:
        dbLogger.warning(f"[ASYNC] Advice with id {advice_id} not found")
        raise NotFoundError(f"Advice with id {advice_id} not found.")
    dbLogger.debug(f"[ASYNC] Successfully retrieved advice with id: {advice_id}")
    return db_feedback

def get_advice_by_task(task_id: int, session: Session) -> List[DBAdvice]:
    dbLogger.debug(f"Retrieving all advice for task_id: {task_id}")
    advice_list = session.query(DBAdvice).filter(DBAdvice.task_id == task_id).all()
    dbLogger.debug(f"Found {len(advice_list)} advice entries for task_id: {task_id}")
    return advice_list

async def async_get_advice_by_task(task_id: int, session: AsyncSession) -> List[DBAdvice]:
    dbLogger.debug(f"[ASYNC] Retrieving all advice for task_id: {task_id}")
    result = await session.execute(
        select(DBAdvice).filter(DBAdvice.task_id == task_id)
    )
    advice_list = result.scalars().all()
    dbLogger.debug(f"[ASYNC] Found {len(advice_list)} advice entries for task_id: {task_id}")
    return advice_list

def update_advice(advice_id: int, advice_data: Dict[str, Any], session: Session) -> DBAdvice:
    dbLogger.info(f"Updating advice with id: {advice_id}")
    try:
        db_advice = get_advice(advice_id, session)
        db_advice.advice = advice_data
        session.commit()
        session.refresh(db_advice)
        dbLogger.info(f"Successfully updated advice with id: {advice_id}")
        return db_advice
    except Exception as e:
        dbLogger.error(f"Error updating advice with id {advice_id}: {str(e)}")
        session.rollback()
        raise

async def async_update_advice(advice_id: int, advice_data: Dict[str, Any], session: AsyncSession) -> DBAdvice:
    dbLogger.info(f"[ASYNC] Updating advice with id: {advice_id}")
    try:
        db_advice = await async_get_advice(advice_id, session)
        db_advice.advice = advice_data
        await session.commit()
        await session.refresh(db_advice)
        dbLogger.info(f"[ASYNC] Successfully updated advice with id: {advice_id}")
        return db_advice
    except Exception as e:
        dbLogger.error(f"[ASYNC] Error updating advice with id {advice_id}: {str(e)}")
        await session.rollback()
        raise

def delete_advice(advice_id: int, session: Session) -> None:
    dbLogger.info(f"Deleting advice with id: {advice_id}")
    try:
        db_feedback = get_advice(advice_id, session)
        session.delete(db_feedback)
        session.commit()
        dbLogger.info(f"Successfully deleted advice with id: {advice_id}")
    except Exception as e:
        dbLogger.error(f"Error deleting advice with id {advice_id}: {str(e)}")
        session.rollback()
        raise

async def async_delete_advice(advice_id: int, session: AsyncSession) -> None:
    dbLogger.info(f"[ASYNC] Deleting advice with id: {advice_id}")
    try:
        db_feedback = await async_get_advice(advice_id, session)
        await session.delete(db_feedback)
        await session.commit()
        dbLogger.info(f"[ASYNC] Successfully deleted advice with id: {advice_id}")
    except Exception as e:
        dbLogger.error(f"[ASYNC] Error deleting advice with id {advice_id}: {str(e)}")
        await session.rollback()
        raise

def get_cached_advice(user_id: str, file_id: str, session: Session) -> Optional[Dict[str, Any]]:
    dbLogger.debug(f"Looking for cached advice for user: {user_id}, file_id: {file_id}")
    cached_task = get_cached_task(user_id, file_id, session)
    
    if not cached_task:
        dbLogger.debug(f"No cached task found for user: {user_id}, file_id: {file_id}")
        return None
    
    dbLogger.debug(f"Found cached task with id: {cached_task.id}, looking for associated advice")
    db_advice = (
        session.query(DBAdvice)
        .filter(DBAdvice.task_id == cached_task.id)
        .first()
    )
    
    if not db_advice:
        dbLogger.debug(f"No advice found for task_id: {cached_task.id}")
        return None
    
    dbLogger.debug(f"Found cached advice with id: {db_advice.id}")
    return db_advice.advice

async def async_get_cached_advice(user_id: str, file_id: str, session: AsyncSession) -> Optional[Dict[str, Any]]:
    dbLogger.debug(f"[ASYNC] Looking for cached advice for user: {user_id}, file_id: {file_id}")
    cached_task = await async_get_task_by_user_and_fileId(user_id, file_id, session)
    
    if not cached_task:
        dbLogger.debug(f"[ASYNC] No cached task found for user: {user_id}, file_id: {file_id}")
        return None
    
    dbLogger.debug(f"[ASYNC] Found cached task with id: {cached_task.id}, looking for associated advice")
    result = await session.execute(
        select(DBAdvice)
        .filter(DBAdvice.task_id == cached_task.id)
    )
    db_advice = result.scalars().first()
    
    if not db_advice:
        dbLogger.debug(f"[ASYNC] No advice found for task_id: {cached_task.id}")
        return None
    
    dbLogger.debug(f"[ASYNC] Found cached advice with id: {db_advice.id}")
    return db_advice.advice
