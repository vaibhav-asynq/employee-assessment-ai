from typing import Any, Dict, List, Optional, Tuple

from fastapi import HTTPException
from pydantic import BaseModel
from sqlalchemy import desc
from sqlalchemy.orm import Session

from .models import DBSnapshot, DBTask


class SortedBy(BaseModel):
    stakeholders: Dict[str, Any] = {}
    competency: Dict[str, Any] = {}

class SnapshotReport(BaseModel):
    editable: Dict[str, Any] = {}
    sorted_by: SortedBy = SortedBy()

class SnapshotCreate(BaseModel):
    task_id: int
    manual_report: SnapshotReport
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
        manual_report=data.manual_report.model_dump(),
        full_report=data.full_report.model_dump(),
        ai_Competencies=data.ai_Competencies.model_dump(),
        trigger_type=trigger_type,
        parent_id=parent_id,
    )
    session.add(snapshot)
    session.commit()
    session.refresh(snapshot)
    return snapshot

def get_latest_snapshot(session: Session, task_id: int) -> Optional[DBSnapshot]:
    return (
        session.query(DBSnapshot)
        .filter(DBSnapshot.task_id == task_id)
        .order_by(desc(DBSnapshot.created_at))
        .first()
    )

def get_snapshot_by_id(session: Session, snapshot_id: int) -> Optional[DBSnapshot]:
    return session.get(DBSnapshot, snapshot_id)

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
        
    return query.all()

def restore_snapshot(session: Session, task_id: int, snapshot_id: int) -> DBSnapshot:
    task = session.get(DBTask, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    snapshot = session.get(DBSnapshot, snapshot_id)
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    
    if snapshot.task_id != task_id:
        raise HTTPException(status_code=400, detail="Snapshot doesn't belong to task")

    task.current_snapshot_id = snapshot.id
    session.commit()
    return snapshot

def get_current_snapshot(session: Session, task_id: int) -> Optional[DBSnapshot]:
    task = session.get(DBTask, task_id)
    if task and task.current_snapshot_id:
        return session.get(DBSnapshot, task.current_snapshot_id)
    return None

def undo_snapshot(session: Session, task_id: int) -> Optional[DBSnapshot]:
    current = get_current_snapshot(session, task_id)
    if current and current.parent_id:
        try:
            restore_snapshot(session, task_id, current.parent_id)
            return get_current_snapshot(session, task_id)
        except HTTPException:
            # If parent snapshot was deleted or has issues
            return None
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
            try:
                restore_snapshot(session, task_id, next_snapshot.id)
                return next_snapshot
            except HTTPException:
                return None
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
        
    return query.all()

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
        
    return query.all()

def count_snapshots(session: Session, task_id: int, trigger_type: Optional[str] = None) -> int:
    query = session.query(DBSnapshot).filter(DBSnapshot.task_id == task_id)
    
    if trigger_type:
        query = query.filter(DBSnapshot.trigger_type == trigger_type)
        
    return query.count()

def delete_snapshot(session: Session, snapshot_id: int) -> bool:
    snapshot = session.get(DBSnapshot, snapshot_id)
    if not snapshot:
        return False
    
    # Check if this is the current snapshot for its task
    task = session.get(DBTask, snapshot.task_id)
    if task and task.current_snapshot_id == snapshot_id:
        # Reset current_snapshot_id to None or to parent
        task.current_snapshot_id = snapshot.parent_id
    
    session.delete(snapshot)
    session.commit()
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
