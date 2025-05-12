"""
Asynchronous versions of snapshot database functions.
This file contains async versions of all functions in snapshot.py.
"""

from typing import Any, Dict, List, Optional, Tuple

from fastapi import HTTPException
from pydantic import BaseModel
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from utils.loggers.db_logger import logger as dbLogger

from .models import DBSnapshot, DBTask
from .snapshot import SnapshotCreate, SnapshotReport, SnapshotReportWithMisc

async def async_create_snapshot(
    db: AsyncSession,
    data: SnapshotCreate,
    trigger_type: str = "manual",
    parent_id: Optional[int] = None,
) -> DBSnapshot:
    """Async version of create_snapshot"""
    snapshot = DBSnapshot(
        task_id=data.task_id,
        snapshot_name=data.snapshot_name,
        manual_report=data.manual_report.model_dump(),
        full_report=data.full_report.model_dump(),
        ai_Competencies=data.ai_Competencies.model_dump(),
        trigger_type=trigger_type,
        parent_id=parent_id,
    )
    db.add(snapshot)
    await db.commit()
    await db.refresh(snapshot)
    dbLogger.info(f"[ASYNC] Created snapshot for task id: {data.task_id}")
    return snapshot

async def async_get_latest_snapshot(db: AsyncSession, task_id: int) -> Optional[DBSnapshot]:
    """Async version of get_latest_snapshot"""
    stmt = (
        select(DBSnapshot)
        .filter(DBSnapshot.task_id == task_id)
        .order_by(desc(DBSnapshot.created_at))
    )
    result = await db.execute(stmt)
    snapshot = result.scalars().first()
    dbLogger.info(f"[ASYNC] Retrieved latest snapshot for task id: {task_id}")
    return snapshot

async def async_get_snapshot_by_id(db: AsyncSession, snapshot_id: int) -> Optional[DBSnapshot]:
    """Async version of get_snapshot_by_id"""
    snapshot = await db.get(DBSnapshot, snapshot_id)
    if snapshot:
        dbLogger.info(f"[ASYNC] Retrieved snapshot by id: {snapshot_id}")
    else:
        dbLogger.warning(f"[ASYNC] Snapshot with id {snapshot_id} not found")
    return snapshot

async def async_get_snapshot_history(
    db: AsyncSession, 
    task_id: int, 
    limit: Optional[int] = None,
    offset: Optional[int] = None
) -> List[DBSnapshot]:
    """Async version of get_snapshot_history"""
    stmt = (
        select(DBSnapshot)
        .filter(DBSnapshot.task_id == task_id)
        .order_by(desc(DBSnapshot.created_at))
    )
    
    if limit is not None:
        stmt = stmt.limit(limit)
    if offset is not None:
        stmt = stmt.offset(offset)
    
    result = await db.execute(stmt)
    snapshots = result.scalars().all()
    dbLogger.info(f"[ASYNC] Retrieved {len(list(snapshots))} snapshots from history for task id: {task_id} (limit: {limit}, offset: {offset})")
    return snapshots

async def async_restore_snapshot(db: AsyncSession, task_id: int, snapshot_id: int) -> DBSnapshot:
    """Async version of restore_snapshot"""
    task = await db.get(DBTask, task_id)
    if not task:
        dbLogger.error(f"[ASYNC] Failed to restore snapshot: Task with id {task_id} not found")
        raise HTTPException(status_code=404, detail="Task not found")

    snapshot = await db.get(DBSnapshot, snapshot_id)
    if not snapshot:
        dbLogger.error(f"[ASYNC] Failed to restore snapshot: Snapshot with id {snapshot_id} not found")
        raise HTTPException(status_code=404, detail="Snapshot not found")
    
    if snapshot.task_id != task_id:
        dbLogger.error(f"[ASYNC] Failed to restore snapshot: Snapshot {snapshot_id} doesn't belong to task {task_id}")
        raise HTTPException(status_code=400, detail="Snapshot doesn't belong to task")

    task.current_snapshot_id = snapshot.id
    await db.commit()
    dbLogger.info(f"[ASYNC] Restored snapshot id: {snapshot_id} for task id: {task_id}")
    return snapshot

async def async_get_current_snapshot(db: AsyncSession, task_id: int) -> Optional[DBSnapshot]:
    """Async version of get_current_snapshot"""
    task = await db.get(DBTask, task_id)
    if task and task.current_snapshot_id:
        snapshot = await db.get(DBSnapshot, task.current_snapshot_id)
        dbLogger.info(f"[ASYNC] Retrieved current snapshot id: {task.current_snapshot_id} for task id: {task_id}")
        return snapshot
    dbLogger.info(f"[ASYNC] No current snapshot found for task id: {task_id}")
    return None

async def async_undo_snapshot(db: AsyncSession, task_id: int) -> Optional[DBSnapshot]:
    """Async version of undo_snapshot"""
    current = await async_get_current_snapshot(db, task_id)
    if current and current.parent_id:
        dbLogger.info(f"[ASYNC] Attempting to undo to parent snapshot id: {current.parent_id} for task id: {task_id}")
        try:
            await async_restore_snapshot(db, task_id, current.parent_id)
            result = await async_get_current_snapshot(db, task_id)
            dbLogger.info(f"[ASYNC] Successfully undid to snapshot id: {current.parent_id} for task id: {task_id}")
            return result
        except HTTPException as e:
            dbLogger.error(f"[ASYNC] Failed to undo snapshot for task id: {task_id}: {str(e)}")
            # If parent snapshot was deleted or has issues
            return None
    dbLogger.warning(f"[ASYNC] Cannot undo snapshot for task id: {task_id}: No current snapshot or no parent snapshot")
    return None

async def async_redo_snapshot(db: AsyncSession, task_id: int) -> Optional[DBSnapshot]:
    """Async version of redo_snapshot"""
    current = await async_get_current_snapshot(db, task_id)
    if current:
        stmt = (
            select(DBSnapshot)
            .filter(DBSnapshot.parent_id == current.id)
            .order_by(DBSnapshot.created_at)
        )
        result = await db.execute(stmt)
        next_snapshot = result.scalars().first()
        
        if next_snapshot:
            dbLogger.info(f"[ASYNC] Attempting to redo to child snapshot id: {next_snapshot.id} for task id: {task_id}")
            try:
                await async_restore_snapshot(db, task_id, next_snapshot.id)
                dbLogger.info(f"[ASYNC] Successfully redid to snapshot id: {next_snapshot.id} for task id: {task_id}")
                return next_snapshot
            except HTTPException as e:
                dbLogger.error(f"[ASYNC] Failed to redo snapshot for task id: {task_id}: {str(e)}")
                return None
        else:
            dbLogger.warning(f"[ASYNC] Cannot redo snapshot for task id: {task_id}: No child snapshot found")
    else:
        dbLogger.warning(f"[ASYNC] Cannot redo snapshot for task id: {task_id}: No current snapshot")
    return None

async def async_get_manual_snapshots(
    db: AsyncSession, 
    task_id: int,
    limit: Optional[int] = None,
    offset: Optional[int] = None
) -> List[DBSnapshot]:
    """Async version of get_manual_snapshots"""
    stmt = (
        select(DBSnapshot)
        .filter(DBSnapshot.task_id == task_id, DBSnapshot.trigger_type == "manual")
        .order_by(desc(DBSnapshot.created_at))
    )
    
    if limit is not None:
        stmt = stmt.limit(limit)
    if offset is not None:
        stmt = stmt.offset(offset)
    
    result = await db.execute(stmt)
    snapshots = result.scalars().all()
    dbLogger.info(f"[ASYNC] Retrieved {len(list(snapshots))} manual snapshots for task id: {task_id} (limit: {limit}, offset: {offset})")
    return snapshots

async def async_get_snapshots_by_type(
    db: AsyncSession, 
    task_id: int,
    trigger_type: str,
    limit: Optional[int] = None,
    offset: Optional[int] = None
) -> List[DBSnapshot]:
    """Async version of get_snapshots_by_type"""
    stmt = (
        select(DBSnapshot)
        .filter(DBSnapshot.task_id == task_id, DBSnapshot.trigger_type == trigger_type)
        .order_by(desc(DBSnapshot.created_at))
    )
    
    if limit is not None:
        stmt = stmt.limit(limit)
    if offset is not None:
        stmt = stmt.offset(offset)
    
    result = await db.execute(stmt)
    snapshots = result.scalars().all()
    dbLogger.info(f"[ASYNC] Retrieved {len(list(snapshots))} snapshots of type '{trigger_type}' for task id: {task_id} (limit: {limit}, offset: {offset})")
    return snapshots

async def async_count_snapshots(db: AsyncSession, task_id: int, trigger_type: Optional[str] = None) -> int:
    """Async version of count_snapshots"""
    stmt = select(DBSnapshot).filter(DBSnapshot.task_id == task_id)
    
    if trigger_type:
        stmt = stmt.where(DBSnapshot.trigger_type == trigger_type)
    
    result = await db.execute(stmt)
    count = len(result.scalars().all())
    
    if trigger_type:
        dbLogger.info(f"[ASYNC] Counted {count} snapshots of type '{trigger_type}' for task id: {task_id}")
    else:
        dbLogger.info(f"[ASYNC] Counted {count} total snapshots for task id: {task_id}")
    return count

async def async_delete_snapshot(db: AsyncSession, snapshot_id: int) -> bool:
    """Async version of delete_snapshot"""
    snapshot = await db.get(DBSnapshot, snapshot_id)
    if not snapshot:
        dbLogger.warning(f"[ASYNC] Attempted to delete non-existent snapshot with id: {snapshot_id}")
        return False
    
    task_id = snapshot.task_id
    
    # Check if this is the current snapshot for its task
    task = await db.get(DBTask, task_id)
    if task and task.current_snapshot_id == snapshot_id:
        # Reset current_snapshot_id to None or to parent
        task.current_snapshot_id = snapshot.parent_id
        dbLogger.info(f"[ASYNC] Updated current snapshot for task id: {task_id} to parent id: {snapshot.parent_id}")
    
    await db.delete(snapshot)
    await db.commit()
    dbLogger.info(f"[ASYNC] Deleted snapshot id: {snapshot_id} for task id: {task_id}")
    return True

async def async_get_snapshot_with_children(
    db: AsyncSession, snapshot_id: int
) -> Tuple[Optional[DBSnapshot], List[DBSnapshot]]:
    """Async version of get_snapshot_with_children"""
    snapshot = await db.get(DBSnapshot, snapshot_id)
    if not snapshot:
        return None, []
    
    stmt = (
        select(DBSnapshot)
        .filter(DBSnapshot.parent_id == snapshot_id)
        .order_by(DBSnapshot.created_at)
    )
    result = await db.execute(stmt)
    children = result.scalars().all()
    
    return snapshot, children

async def async_get_last_auto_snapshot(db: AsyncSession, task_id: int) -> Optional[DBSnapshot]:
    """Async version of get_last_auto_snapshot"""
    stmt = (
        select(DBSnapshot)
        .filter(
            DBSnapshot.task_id == task_id,
            DBSnapshot.trigger_type == "auto"
        )
        .order_by(desc(DBSnapshot.created_at))
    )
    result = await db.execute(stmt)
    return result.scalars().first()
