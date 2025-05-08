from typing import Any, Dict, List, Optional, Tuple

from fastapi import HTTPException
from pydantic import BaseModel
from sqlalchemy import desc
from sqlalchemy.orm import Session
from utils.loggers.db_logger import logger as dbLogger

from .models import DBSnapshot, DBTask


class SortedBy(BaseModel):
    stakeholders: Dict[str, Any] = {}
    competency: Dict[str, Any] = {}

class SnapshotReport(BaseModel):
    editable: Dict[str, Any] = {}
    sorted_by: SortedBy = SortedBy()

class SnapshotReportWithMisc(BaseModel):
    selectedPath: Optional[str] = None
    editable: Dict[str, Any] = {}
    sorted_by: SortedBy = SortedBy()

class SnapshotCreate(BaseModel):
    task_id: int
    snapshot_name: Optional[str]
    manual_report: SnapshotReportWithMisc
    full_report: SnapshotReport
    ai_Competencies: SnapshotReport

def create_snapshot(
    session: Session,
    data: SnapshotCreate,
    trigger_type: str = "manual",
    parent_id: Optional[int] = None,
) -> DBSnapshot:
    snapshot = DBSnapshot(
        task_id=data.task_id,
        snapshot_name= data.snapshot_name,
        manual_report=data.manual_report.model_dump(),
        full_report=data.full_report.model_dump(),
        ai_Competencies=data.ai_Competencies.model_dump(),
        trigger_type=trigger_type,
        parent_id=parent_id,
    )
    session.add(snapshot)
    session.commit()
    session.refresh(snapshot)
    dbLogger.info(f"created snapshot for task id: {data.task_id}")
    return snapshot

def get_latest_snapshot(session: Session, task_id: int) -> Optional[DBSnapshot]:
    snapshot = (
        session.query(DBSnapshot)
        .filter(DBSnapshot.task_id == task_id)
        .order_by(desc(DBSnapshot.created_at))
        .first()
    )
    dbLogger.info(f"Retrieved latest snapshot for task id: {task_id}")
    return snapshot

def get_snapshot_by_id(session: Session, snapshot_id: int) -> Optional[DBSnapshot]:
    snapshot = session.get(DBSnapshot, snapshot_id)
    if snapshot:
        dbLogger.info(f"Retrieved snapshot by id: {snapshot_id}")
    else:
        dbLogger.warning(f"Snapshot with id {snapshot_id} not found")
    return snapshot

def get_snapshot_history(
    session: Session, 
    task_id: int, 
    limit: Optional[int] = None,
    offset: Optional[int] = None
) -> List[DBSnapshot]:
    query = (
        session.query(DBSnapshot)
        .filter(DBSnapshot.task_id == task_id)
        .order_by(desc(DBSnapshot.created_at))
    )
    
    if limit is not None:
        query = query.limit(limit)
    if offset is not None:
        query = query.offset(offset)
    
    snapshots = query.all()
    dbLogger.info(f"Retrieved {len(snapshots)} snapshots from history for task id: {task_id} (limit: {limit}, offset: {offset})")
    return snapshots

def restore_snapshot(session: Session, task_id: int, snapshot_id: int) -> DBSnapshot:
    task = session.get(DBTask, task_id)
    if not task:
        dbLogger.error(f"Failed to restore snapshot: Task with id {task_id} not found")
        raise HTTPException(status_code=404, detail="Task not found")

    snapshot = session.get(DBSnapshot, snapshot_id)
    if not snapshot:
        dbLogger.error(f"Failed to restore snapshot: Snapshot with id {snapshot_id} not found")
        raise HTTPException(status_code=404, detail="Snapshot not found")
    
    if snapshot.task_id != task_id:
        dbLogger.error(f"Failed to restore snapshot: Snapshot {snapshot_id} doesn't belong to task {task_id}")
        raise HTTPException(status_code=400, detail="Snapshot doesn't belong to task")

    task.current_snapshot_id = snapshot.id
    session.commit()
    dbLogger.info(f"Restored snapshot id: {snapshot_id} for task id: {task_id}")
    return snapshot

def get_current_snapshot(session: Session, task_id: int) -> Optional[DBSnapshot]:
    task = session.get(DBTask, task_id)
    if task and task.current_snapshot_id:
        snapshot = session.get(DBSnapshot, task.current_snapshot_id)
        dbLogger.info(f"Retrieved current snapshot id: {task.current_snapshot_id} for task id: {task_id}")
        return snapshot
    dbLogger.info(f"No current snapshot found for task id: {task_id}")
    return None

def undo_snapshot(session: Session, task_id: int) -> Optional[DBSnapshot]:
    current = get_current_snapshot(session, task_id)
    if current and current.parent_id:
        dbLogger.info(f"Attempting to undo to parent snapshot id: {current.parent_id} for task id: {task_id}")
        try:
            restore_snapshot(session, task_id, current.parent_id)
            result = get_current_snapshot(session, task_id)
            dbLogger.info(f"Successfully undid to snapshot id: {current.parent_id} for task id: {task_id}")
            return result
        except HTTPException as e:
            dbLogger.error(f"Failed to undo snapshot for task id: {task_id}: {str(e)}")
            # If parent snapshot was deleted or has issues
            return None
    dbLogger.warning(f"Cannot undo snapshot for task id: {task_id}: No current snapshot or no parent snapshot")
    return None

def redo_snapshot(session: Session, task_id: int) -> Optional[DBSnapshot]:
    current = get_current_snapshot(session, task_id)
    if current:
        next_snapshot = (
            session.query(DBSnapshot)
            .filter(DBSnapshot.parent_id == current.id)
            .order_by(DBSnapshot.created_at)
            .first()
        )
        if next_snapshot:
            dbLogger.info(f"Attempting to redo to child snapshot id: {next_snapshot.id} for task id: {task_id}")
            try:
                restore_snapshot(session, task_id, next_snapshot.id)
                dbLogger.info(f"Successfully redid to snapshot id: {next_snapshot.id} for task id: {task_id}")
                return next_snapshot
            except HTTPException as e:
                dbLogger.error(f"Failed to redo snapshot for task id: {task_id}: {str(e)}")
                return None
        else:
            dbLogger.warning(f"Cannot redo snapshot for task id: {task_id}: No child snapshot found")
    else:
        dbLogger.warning(f"Cannot redo snapshot for task id: {task_id}: No current snapshot")
    return None

def get_manual_snapshots(
    session: Session, 
    task_id: int,
    limit: Optional[int] = None,
    offset: Optional[int] = None
) -> List[DBSnapshot]:
    query = (
        session.query(DBSnapshot)
        .filter(DBSnapshot.task_id == task_id, DBSnapshot.trigger_type == "manual")
        .order_by(desc(DBSnapshot.created_at))
    )
    
    if limit is not None:
        query = query.limit(limit)
    if offset is not None:
        query = query.offset(offset)
    
    snapshots = query.all()
    dbLogger.info(f"Retrieved {len(snapshots)} manual snapshots for task id: {task_id} (limit: {limit}, offset: {offset})")
    return snapshots

def get_snapshots_by_type(
    session: Session, 
    task_id: int,
    trigger_type: str,
    limit: Optional[int] = None,
    offset: Optional[int] = None
) -> List[DBSnapshot]:
    query = (
        session.query(DBSnapshot)
        .filter(DBSnapshot.task_id == task_id, DBSnapshot.trigger_type == trigger_type)
        .order_by(desc(DBSnapshot.created_at))
    )
    
    if limit is not None:
        query = query.limit(limit)
    if offset is not None:
        query = query.offset(offset)
    
    snapshots = query.all()
    dbLogger.info(f"Retrieved {len(snapshots)} snapshots of type '{trigger_type}' for task id: {task_id} (limit: {limit}, offset: {offset})")
    return snapshots

def count_snapshots(session: Session, task_id: int, trigger_type: Optional[str] = None) -> int:
    query = session.query(DBSnapshot).filter(DBSnapshot.task_id == task_id)
    
    if trigger_type:
        query = query.filter(DBSnapshot.trigger_type == trigger_type)
    
    count = query.count()
    if trigger_type:
        dbLogger.info(f"Counted {count} snapshots of type '{trigger_type}' for task id: {task_id}")
    else:
        dbLogger.info(f"Counted {count} total snapshots for task id: {task_id}")
    return count

def delete_snapshot(session: Session, snapshot_id: int) -> bool:
    snapshot = session.get(DBSnapshot, snapshot_id)
    if not snapshot:
        dbLogger.warning(f"Attempted to delete non-existent snapshot with id: {snapshot_id}")
        return False
    
    task_id = snapshot.task_id
    
    # Check if this is the current snapshot for its task
    task = session.get(DBTask, task_id)
    if task and task.current_snapshot_id == snapshot_id:
        # Reset current_snapshot_id to None or to parent
        task.current_snapshot_id = snapshot.parent_id
        dbLogger.info(f"Updated current snapshot for task id: {task_id} to parent id: {snapshot.parent_id}")
    
    session.delete(snapshot)
    session.commit()
    dbLogger.info(f"Deleted snapshot id: {snapshot_id} for task id: {task_id}")
    return True

def get_snapshot_with_children(
    session: Session, snapshot_id: int
) -> Tuple[Optional[DBSnapshot], List[DBSnapshot]]:
    snapshot = session.get(DBSnapshot, snapshot_id)
    if not snapshot:
        return None, []
    
    children = (
        session.query(DBSnapshot)
        .filter(DBSnapshot.parent_id == snapshot_id)
        .order_by(DBSnapshot.created_at)
        .all()
    )
    
    return snapshot, children


def get_last_auto_snapshot(db: Session, task_id: int):
    """Get the last auto snapshot for a task"""
    return db.query(DBSnapshot).filter(
        DBSnapshot.task_id == task_id,
        DBSnapshot.trigger_type == "auto"
    ).order_by(desc(DBSnapshot.created_at)).first()
