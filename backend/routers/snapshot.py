from typing import List, Optional

from auth.user import User, get_current_user
from db.core import get_db
from db.file import get_db_task, get_task_by_user_and_fileId
from db.snapshot import (SnapshotCreate, SnapshotReport,
                         SnapshotReportWithMisc, count_snapshots,
                         create_snapshot, delete_snapshot,
                         get_current_snapshot, get_last_auto_snapshot,
                         get_latest_snapshot, get_manual_snapshots,
                         get_snapshot_by_id, get_snapshot_history,
                         get_snapshot_with_children, get_snapshots_by_type,
                         redo_snapshot, restore_snapshot, undo_snapshot)
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from utils.loggers.endPoint_logger import logger as apiLogger

router = APIRouter(
    prefix="/api/snapshots",
    tags=["snapshots"],
)

class SnapshotCreateRequest(BaseModel):
    file_id: str
    snapshot_name: Optional[str] = None
    manual_report: dict
    full_report: dict
    ai_Competencies: dict
    trigger_type: str = "manual"
    parent_id: Optional[int] = None

class SnapshotResponse(BaseModel):
    id: int
    task_id: int
    snapshot_name: Optional[str] = None
    created_at: str
    parent_id: Optional[int] = None
    trigger_type: str
    manual_report: dict
    full_report: dict
    ai_Competencies: dict

@router.post("/create", response_model=SnapshotResponse)
async def create_snapshot_endpoint(
    request: SnapshotCreateRequest,
    make_current: bool = False,
    user:User = Depends(get_current_user),  
    db: Session = Depends(get_db)
):
    user_id = user.user_id
    apiLogger.info(f"User {user_id} creating snapshot for file {request.file_id} with trigger_type {request.trigger_type}")
    # Verify task belongs to user
    task = get_task_by_user_and_fileId(user_id, request.file_id, db)
    
    # Create snapshot data
    snapshot_data = SnapshotCreate(
        task_id=task.id,
        snapshot_name= request.snapshot_name,
        manual_report=SnapshotReportWithMisc(**request.manual_report),
        full_report=SnapshotReport(**request.full_report),
        ai_Competencies=SnapshotReport(**request.ai_Competencies)
    )
    
    # If this is an auto snapshot, replace the last auto snapshot if it exists
    if request.trigger_type == "auto":
        last_auto_snapshot = get_last_auto_snapshot(db, task.id)
        if last_auto_snapshot:
            delete_snapshot(db, last_auto_snapshot.id)
    
    # Create snapshot
    snapshot = create_snapshot(
        db, 
        snapshot_data, 
        trigger_type=request.trigger_type,
        parent_id=request.parent_id
    )

    if make_current:
        restore_snapshot(db, task.id, snapshot.id)
    
    # Convert datetime to string for JSON response
    res =  SnapshotResponse(
        id=snapshot.id,
        snapshot_name=snapshot.snapshot_name,
        task_id=snapshot.task_id,
        created_at=snapshot.created_at.isoformat(),
        parent_id=snapshot.parent_id,
        trigger_type=snapshot.trigger_type,
        manual_report=snapshot.manual_report,
        full_report=snapshot.full_report,
        ai_Competencies=snapshot.ai_Competencies
    )
    apiLogger.info(f"Snapshot created successfully: id={snapshot.id}, task_id={snapshot.task_id}, trigger_type={snapshot.trigger_type}")
    return res

@router.get("/latest/{file_id}", response_model=Optional[SnapshotResponse])
async def get_latest_snapshot_endpoint(
    file_id: str,
    user:User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = user.user_id
    apiLogger.info(f"User {user_id} requesting latest snapshot for file {file_id}")
    # Verify task belongs to user
    task = get_task_by_user_and_fileId(user_id, file_id, db)
    
    # Get latest snapshot
    snapshot = get_latest_snapshot(db, task.id)
    
    if not snapshot:
        return None
    
    # Convert datetime to string for JSON response
    res = SnapshotResponse(
        id=snapshot.id,
        snapshot_name=snapshot.snapshot_name,
        task_id=snapshot.task_id,
        created_at=snapshot.created_at.isoformat(),
        parent_id=snapshot.parent_id,
        trigger_type=snapshot.trigger_type,
        manual_report=snapshot.manual_report,
        full_report=snapshot.full_report,
        ai_Competencies=snapshot.ai_Competencies
    )
    apiLogger.info(f"Retrieved latest snapshot: id={snapshot.id}, task_id={snapshot.task_id}")
    return res

@router.get("/current/{file_id}", response_model=Optional[SnapshotResponse])
async def get_current_snapshot_endpoint(
    file_id: str,
    user:User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = user.user_id
    apiLogger.info(f"User {user_id} requesting current snapshot for file {file_id}")
    
    # Verify task belongs to user
    task = get_task_by_user_and_fileId(user_id, file_id, db)
    
    # Get current snapshot
    snapshot = get_current_snapshot(db, task.id)
    
    if not snapshot:
        return None
    
    # Convert datetime to string for JSON response
    res = SnapshotResponse(
        id=snapshot.id,
        snapshot_name=snapshot.snapshot_name,
        task_id=snapshot.task_id,
        created_at=snapshot.created_at.isoformat(),
        parent_id=snapshot.parent_id,
        trigger_type=snapshot.trigger_type,
        manual_report=snapshot.manual_report,
        full_report=snapshot.full_report,
        ai_Competencies=snapshot.ai_Competencies
    )
    apiLogger.info(f"Retrieved current snapshot: id={snapshot.id}, task_id={snapshot.task_id}")
    return res

@router.get("/history/{file_id}", response_model=List[SnapshotResponse])
async def get_snapshot_history_endpoint(
    file_id: str,
    user:User = Depends(get_current_user),
    limit: Optional[int] = None,
    offset: Optional[int] = None,
    db: Session = Depends(get_db)
):
    user_id = user.user_id
    apiLogger.info(f"User {user_id} requesting snapshot history for file {file_id} (limit={limit}, offset={offset})")
    
    # Verify task belongs to user
    task = get_task_by_user_and_fileId(user_id, file_id, db)
    
    # Get snapshot history
    snapshots = get_snapshot_history(db, task.id, limit, offset)

    apiLogger.info(f"Retrieved {len(snapshots)} snapshots from history for task_id={task.id}")

    # Convert datetime to string for JSON response
    return [
        SnapshotResponse(
            id=snapshot.id,
            snapshot_name=snapshot.snapshot_name,
            task_id=snapshot.task_id,
            created_at=snapshot.created_at.isoformat(),
            parent_id=snapshot.parent_id,
            trigger_type=snapshot.trigger_type,
            manual_report=snapshot.manual_report,
            full_report=snapshot.full_report,
            ai_Competencies=snapshot.ai_Competencies
        )
        for snapshot in snapshots
    ]

@router.get("/manual/{file_id}", response_model=List[SnapshotResponse])
async def get_manual_snapshots_endpoint(
    file_id: str,
    user:User = Depends(get_current_user),
    limit: Optional[int] = None,
    offset: Optional[int] = None,
    db: Session = Depends(get_db)
):
    user_id = user.user_id
    
    # Verify task belongs to user
    task = get_task_by_user_and_fileId(user_id, file_id, db)
    
    # Get manual snapshots
    snapshots = get_manual_snapshots(db, task.id, limit, offset)
    
    # Convert datetime to string for JSON response
    return [
        SnapshotResponse(
            id=snapshot.id,
            snapshot_name=snapshot.snapshot_name,
            task_id=snapshot.task_id,
            created_at=snapshot.created_at.isoformat(),
            parent_id=snapshot.parent_id,
            trigger_type=snapshot.trigger_type,
            manual_report=snapshot.manual_report,
            full_report=snapshot.full_report,
            ai_Competencies=snapshot.ai_Competencies
        )
        for snapshot in snapshots
    ]

@router.get("/by-type/{file_id}/{trigger_type}", response_model=List[SnapshotResponse])
async def get_snapshots_by_type_endpoint(
    file_id: str,
    trigger_type: str,
    limit: Optional[int] = None,
    offset: Optional[int] = None,
    user:User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = user.user_id
    
    # Verify task belongs to user
    task = get_task_by_user_and_fileId(user_id, file_id, db)
    
    # Get snapshots by type
    snapshots = get_snapshots_by_type(db, task.id, trigger_type, limit, offset)
    
    # Convert datetime to string for JSON response
    return [
        SnapshotResponse(
            id=snapshot.id,
            snapshot_name=snapshot.snapshot_name,
            task_id=snapshot.task_id,
            created_at=snapshot.created_at.isoformat(),
            parent_id=snapshot.parent_id,
            trigger_type=snapshot.trigger_type,
            manual_report=snapshot.manual_report,
            full_report=snapshot.full_report,
            ai_Competencies=snapshot.ai_Competencies
        )
        for snapshot in snapshots
    ]

@router.get("/count/{file_id}")
async def count_snapshots_endpoint(
    file_id: str,
    user:User = Depends(get_current_user),
    trigger_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    user_id = user.user_id
    
    # Verify task belongs to user
    task = get_task_by_user_and_fileId(user_id, file_id, db)
    
    # Count snapshots
    count = count_snapshots(db, task.id, trigger_type)
    
    return {"count": count}

@router.post("/restore/{file_id}/{snapshot_id}", response_model=SnapshotResponse)
async def restore_snapshot_endpoint(
    file_id: str,
    snapshot_id: int,
    user:User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = user.user_id
    
    # Verify task belongs to user
    task = get_task_by_user_and_fileId(user_id, file_id, db)
    
    # Restore snapshot
    snapshot = restore_snapshot(db, task.id, snapshot_id)
    
    # Convert datetime to string for JSON response
    return SnapshotResponse(
        id=snapshot.id,
        snapshot_name=snapshot.snapshot_name,
        task_id=snapshot.task_id,
        created_at=snapshot.created_at.isoformat(),
        parent_id=snapshot.parent_id,
        trigger_type=snapshot.trigger_type,
        manual_report=snapshot.manual_report,
        full_report=snapshot.full_report,
        ai_Competencies=snapshot.ai_Competencies
    )

@router.post("/undo/{file_id}", response_model=Optional[SnapshotResponse])
async def undo_snapshot_endpoint(
    file_id: str,
    user:User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = user.user_id
    
    # Verify task belongs to user
    task = get_task_by_user_and_fileId(user_id, file_id, db)
    
    # Undo snapshot
    snapshot = undo_snapshot(db, task.id)
    
    if not snapshot:
        return None
    
    # Convert datetime to string for JSON response
    return SnapshotResponse(
        id=snapshot.id,
        snapshot_name=snapshot.snapshot_name,
        task_id=snapshot.task_id,
        created_at=snapshot.created_at.isoformat(),
        parent_id=snapshot.parent_id,
        trigger_type=snapshot.trigger_type,
        manual_report=snapshot.manual_report,
        full_report=snapshot.full_report,
        ai_Competencies=snapshot.ai_Competencies
    )

@router.post("/redo/{file_id}", response_model=Optional[SnapshotResponse])
async def redo_snapshot_endpoint(
    file_id: str,
    user:User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = user.user_id
    
    # Verify task belongs to user
    task = get_task_by_user_and_fileId(user_id, file_id, db)
    
    # Redo snapshot
    snapshot = redo_snapshot(db, task.id)
    
    if not snapshot:
        return None
    
    # Convert datetime to string for JSON response
    return SnapshotResponse(
        id=snapshot.id,
        snapshot_name=snapshot.snapshot_name,
        task_id=snapshot.task_id,
        created_at=snapshot.created_at.isoformat(),
        parent_id=snapshot.parent_id,
        trigger_type=snapshot.trigger_type,
        manual_report=snapshot.manual_report,
        full_report=snapshot.full_report,
        ai_Competencies=snapshot.ai_Competencies
    )

@router.delete("/{snapshot_id}")
async def delete_snapshot_endpoint(
    snapshot_id: int,
    user:User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = user.user_id
    # Get snapshot to verify ownership
    snapshot = get_snapshot_by_id(db, snapshot_id)
    if not snapshot:
        apiLogger.warning(f"Snapshot not found: {snapshot_id}")
        raise HTTPException(status_code=404, detail="Snapshot not found")
    
    # Get task to verify ownership
    task = get_db_task(snapshot.task_id, user_id, db)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Verify task belongs to user
    if task.user_id != user_id:
        apiLogger.warning(f"Unauthorized access attempt: User {user_id} tried to access snapshot {snapshot_id} belonging to user {task.user_id}")
        raise HTTPException(status_code=403, detail="Not authorized to access this snapshot")
    
    # Delete snapshot
    success = delete_snapshot(db, snapshot_id)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete snapshot")
    
    return {"success": True}

@router.get("/{snapshot_id}", response_model=SnapshotResponse)
async def get_snapshot_by_id_endpoint(
    snapshot_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id= user.user_id
    # Get snapshot
    snapshot = get_snapshot_by_id(db, snapshot_id)
    
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    
    # Get task to verify ownership
    task = get_db_task(snapshot.task_id, user_id, db)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Verify task belongs to user
    if task.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this snapshot")
    
    # Convert datetime to string for JSON response
    return SnapshotResponse(
        id=snapshot.id,
        snapshot_name=snapshot.snapshot_name,
        task_id=snapshot.task_id,
        created_at=snapshot.created_at.isoformat(),
        parent_id=snapshot.parent_id,
        trigger_type=snapshot.trigger_type,
        manual_report=snapshot.manual_report,
        full_report=snapshot.full_report,
        ai_Competencies=snapshot.ai_Competencies
    )

@router.post("/set-current/{file_id}/{snapshot_id}", response_model=SnapshotResponse)
async def set_current_snapshot_endpoint(
    file_id: str,
    snapshot_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = user.user_id
    
    # Verify task belongs to user
    task = get_task_by_user_and_fileId(user_id, file_id, db)
    
    # Get snapshot to verify it exists
    snapshot = get_snapshot_by_id(db, snapshot_id)
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    
    # Verify snapshot belongs to the task
    if snapshot.task_id != task.id:
        raise HTTPException(status_code=400, detail="Snapshot doesn't belong to this task")
    
    # Set as current snapshot
    task.current_snapshot_id = snapshot_id
    db.commit()
    apiLogger.info(f"Successfully set snapshot {snapshot_id} as current for task {task.id}")
    
    # Return the snapshot that was set as current
    return SnapshotResponse(
        id=snapshot.id,
        snapshot_name=snapshot.snapshot_name,
        task_id=snapshot.task_id,
        created_at=snapshot.created_at.isoformat(),
        parent_id=snapshot.parent_id,
        trigger_type=snapshot.trigger_type,
        manual_report=snapshot.manual_report,
        full_report=snapshot.full_report,
        ai_Competencies=snapshot.ai_Competencies
    )

@router.get("/{snapshot_id}/children", response_model=List[SnapshotResponse])
async def get_snapshot_children_endpoint(
    snapshot_id: int,
    user:User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = user.user_id
    apiLogger.info(f"User {user_id} requesting children of snapshot {snapshot_id}")
    # Get snapshot with children
    snapshot, children = get_snapshot_with_children(db, snapshot_id)
    
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    # Get task to verify ownership
    task = db.get(task_id=snapshot.task_id)
    if not task:
        apiLogger.warning(f"Task not found for snapshot {snapshot_id}, task_id={snapshot.task_id}")
        raise HTTPException(status_code=404, detail="Task not found")
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Verify task belongs to user
    if task.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this snapshot")
    
    # Convert datetime to string for JSON response
    return [
        SnapshotResponse(
            id=child.id,
            snapshot_name=snapshot.snapshot_name,
            task_id=child.task_id,
            created_at=child.created_at.isoformat(),
            parent_id=child.parent_id,
            trigger_type=child.trigger_type,
            manual_report=child.manual_report,
            full_report=child.full_report,
            ai_Competencies=child.ai_Competencies
        )
        for child in children
    ]
