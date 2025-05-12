import os
from typing import List

import env_variables
from auth.user import User, get_current_user
from cache_manager import add_to_filename_map
from db.core import NotFoundError, get_async_db, get_db
from db.file import (DBTask, Task, TaskCreate, async_create_db_task, async_get_db_task,
                     async_get_task_by_user_and_fileId, async_process_initial_transcripts,
                     create_db_task, delete_db_task, generate_presigned_url, get_cached_file_id,
                     get_db_task, get_file_download_url, get_task_by_user_and_fileId,
                     get_upload_file_path, get_user_tasks_db, is_file_exist,
                     process_initial_transcripts, save_uploaded_file, update_db_task)
from dir_config import SAVE_DIR
from fastapi import (APIRouter, HTTPException, Query, Request, UploadFile,
                     status)
from fastapi.params import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from state import files_store
from utils.loggers.db_logger import logger as dbLogger
from utils.loggers.endPoint_logger import logger as apiLogger

router = APIRouter(
    prefix="",
    tags=["file task"]
)

# here tasks will be created
@router.post("/api/upload_file")
async def upload_file(
    request: Request, 
    file: UploadFile,
    use_cache: bool = Query(
        True, description="Whether to use cached results if available"
    ),
    current_user:User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
) :
    user_id = current_user.user_id
    apiLogger.info(f"Upload file request received: filename={file.filename}, user_id={user_id}")
    try:
        file_id, file_path, storage_type, s3_key = await save_uploaded_file(file)
        apiLogger.info(f"File saved: file_id={file_id}, path={file_path}, storage_type={storage_type}")
        
        task_item = {
            "user_id": user_id,
            "name": file_id,
            "file_id": file_id,
            "file_name": file.filename,
            "storage_type": storage_type,
            "s3_key": s3_key
        }
        task = await async_create_db_task(TaskCreate(**task_item), db)
        dbLogger.info(f"Task created in database: task_id={task.id}, file_id={file_id}")
        
        files_store[file_id] = {"file_path": file_path, "original_name": file.filename, "storage_type": storage_type, "s3_key": s3_key}
        add_to_filename_map(file.filename, file_id)
        apiLogger.info(f"File added to store and filename map: file_id={file_id}")

        # Process the file asynchronously - this now returns a task that will run in the background
        # We don't need to await it since we want to return to the client immediately
        process_task = process_initial_transcripts(file_path=file_path, db=db, taskId=task.id, save_to_files=True)
        apiLogger.info(f"Initial transcript processing started asynchronously for file_id={file_id}, task_id={task.id}")
        
        # Return without waiting for the processing to complete
        return {"file_id": task.file_id}
    except Exception as e:
        apiLogger.error(f"Error uploading file: {str(e)}", exc_info=True)
        dbLogger.error(f"Database error during file upload: {str(e)}", exc_info=True)
        print(str(e))
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/api/tasks/{task_id}", response_model=Task)
async def get_task(
    task_id: int,
    user:User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get a specific task by ID"""
    user_id=user.user_id
    apiLogger.info(f"Get task request: task_id={task_id}, user_id={user_id}")
    try:
        task = await async_get_db_task(task_id, user_id, db)
        apiLogger.info(f"Task retrieved successfully: task_id={task_id}")
        return task
    except NotFoundError as e:
        apiLogger.warning(f"Task not found: task_id={task_id}, user_id={user_id}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        apiLogger.error(f"Error retrieving task: task_id={task_id}, error={str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/tasks/file/{file_id}", response_model=Task)
async def get_task_by_file_id(
    file_id: str,
    user:User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get a task by file ID"""
    user_id=user.user_id
    apiLogger.info(f"Get task by file_id request: file_id={file_id}, user_id={user_id}")
    try:
        task = await async_get_task_by_user_and_fileId(user_id, file_id, db)
        apiLogger.info(f"Task retrieved by file_id successfully: file_id={file_id}")
        return task
    except NotFoundError as e:
        apiLogger.warning(f"Task not found for file_id: file_id={file_id}, user_id={user_id}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        apiLogger.error(f"Error retrieving task by file_id: file_id={file_id}, error={str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/tasks", response_model=List[Task])
async def get_user_tasks(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get all tasks for the current user"""
    user_id = user.user_id
    apiLogger.info(f"Get all user tasks request: user_id={user_id}")
    try:
        # We need to implement async_get_user_tasks_db
        from sqlalchemy.future import select
        from sqlalchemy import desc
        
        stmt = select(DBTask).filter(DBTask.user_id == user_id).order_by(desc(DBTask.created_at))
        result = await db.execute(stmt)
        tasks = result.scalars().all()
        
        apiLogger.info(f"Retrieved {len(list(tasks))} tasks for user_id={user_id}")
        return tasks
    except Exception as e:
        apiLogger.error(f"Error retrieving user tasks: user_id={user_id}, error={str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/api/tasks/{task_id}", response_model=Task)
async def update_task(
    task_id: int,
    task_data: dict,
    user:User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Update a task"""
    user_id=user.user_id
    apiLogger.info(f"Update task request: task_id={task_id}, user_id={user_id}")
    try:
        # Implement async version inline since we don't have async_update_db_task yet
        task = await async_get_db_task(task_id, user_id, db)
        
        # Update only allowed fields
        allowed_fields = ["name", "file_name"]
        updated_fields = []
        for field in allowed_fields:
            if field in task_data:
                old_value = getattr(task, field)
                new_value = task_data[field]
                if old_value != new_value:
                    setattr(task, field, new_value)
                    updated_fields.append(field)
        
        if updated_fields:
            dbLogger.debug(f"Updated fields for task {task_id}: {', '.join(updated_fields)}")
            await db.commit()
            await db.refresh(task)
            dbLogger.info(f"Successfully updated task with id: {task_id}")
        else:
            dbLogger.debug(f"No changes made to task with id: {task_id}")
        
        apiLogger.info(f"Task updated successfully: task_id={task_id}")
        dbLogger.info(f"Database task updated: task_id={task_id}, user_id={user_id}")
        return task
    except NotFoundError as e:
        apiLogger.warning(f"Task not found for update: task_id={task_id}, user_id={user_id}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        apiLogger.error(f"Error updating task: task_id={task_id}, error={str(e)}", exc_info=True)
        dbLogger.error(f"Database error during task update: task_id={task_id}, error={str(e)}", exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/api/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    user:User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Delete a task"""
    user_id=user.user_id
    apiLogger.info(f"Delete task request: task_id={task_id}, user_id={user_id}")
    try:
        # Implement async version inline since we don't have async_delete_db_task yet
        task = await async_get_db_task(task_id, user_id, db)
        
        # Delete the file from appropriate storage
        if task.file_id:
            # Always try to delete from local storage for backward compatibility
            file_path = os.path.join(UPLOAD_DIR, f"{task.file_id}.pdf")
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                    dbLogger.info(f"Deleted associated local file: {file_path}")
                except Exception as e:
                    # Log the error but continue with task deletion
                    dbLogger.warning(f"Error deleting local file {file_path}: {str(e)}")
            
            # If using S3, also delete from S3
            if task.storage_type == "s3" and task.s3_key and env_variables.USE_S3:
                try:
                    from db.file import delete_from_s3
                    delete_from_s3(task.s3_key)
                    dbLogger.info(f"Deleted associated S3 file: {task.s3_key}")
                except Exception as e:
                    # Log the error but continue with task deletion
                    dbLogger.warning(f"Error deleting S3 file {task.s3_key}: {str(e)}")

        # Delete related data
        from sqlalchemy.future import select
        from db.models import DBAdvice, DBFeedBack, DBProcessedAssessment, DBSnapshot
        
        # Delete related advice data
        stmt = select(DBAdvice).filter(DBAdvice.task_id == task.id)
        result = await db.execute(stmt)
        advice_records = result.scalars().all()
        for advice in advice_records:
            await db.delete(advice)
        dbLogger.info(f"Deleted advice data associated with task {task_id}")
        
        # Delete related feedback data
        stmt = select(DBFeedBack).filter(DBFeedBack.task_id == task.id)
        result = await db.execute(stmt)
        feedback_records = result.scalars().all()
        for feedback in feedback_records:
            await db.delete(feedback)
        dbLogger.info(f"Deleted feedback data associated with task {task_id}")
        
        # Delete related processed assessment data
        stmt = select(DBProcessedAssessment).filter(DBProcessedAssessment.task_id == task.id)
        result = await db.execute(stmt)
        assessment_records = result.scalars().all()
        for assessment in assessment_records:
            await db.delete(assessment)
        dbLogger.info(f"Deleted processed assessment data associated with task {task_id}")

        # Delete related snapshots
        stmt = select(DBSnapshot).filter(DBSnapshot.task_id == task.id)
        result = await db.execute(stmt)
        snapshot_records = result.scalars().all()
        snapshot_count = len(snapshot_records)
        for snapshot in snapshot_records:
            await db.delete(snapshot)
        dbLogger.info(f"Deleted {snapshot_count} snapshots associated with task {task_id}")
        
        # Delete the task itself
        await db.delete(task)
        await db.commit()
        
        apiLogger.info(f"Task deleted successfully: task_id={task_id}")
        dbLogger.info(f"Database task deleted: task_id={task_id}, user_id={user_id}")
        return {"success": True}
    except NotFoundError as e:
        apiLogger.warning(f"Task not found for deletion: task_id={task_id}, user_id={user_id}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        apiLogger.error(f"Error deleting task: task_id={task_id}, error={str(e)}", exc_info=True)
        dbLogger.error(f"Database error during task deletion: task_id={task_id}, error={str(e)}", exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/files/{file_id}")
async def get_file(
    file_id: str,
    user:User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get a file by ID, either from local storage or S3"""
    user_id=user.user_id
    apiLogger.info(f"Get file request: file_id={file_id}, user_id={user_id}")
    
    try:
        # Get the task associated with this file using async query
        from sqlalchemy.future import select
        
        stmt = select(DBTask).filter(DBTask.file_id == file_id, DBTask.user_id == user_id)
        result = await db.execute(stmt)
        task = result.scalars().first()
        
        if not task:
            apiLogger.warning(f"Task not found for file_id: {file_id}, user_id={user_id}")
            raise HTTPException(status_code=404, detail=f"File with id {file_id} not found")
        
        # If using S3, redirect to presigned URL
        if task.storage_type == "s3" and task.s3_key and env_variables.USE_S3:
            try:
                from db.file import s3_client
                if s3_client:
                    presigned_url = generate_presigned_url(task.s3_key)
                    apiLogger.info(f"Redirecting to S3 presigned URL for file_id={file_id}")
                    from fastapi.responses import RedirectResponse
                    return RedirectResponse(url=presigned_url)
            except Exception as e:
                apiLogger.error(f"Error generating S3 presigned URL, falling back to local: {str(e)}")
                # Fall back to local file if S3 fails
        
        # Serve from local storage
        file_path = get_upload_file_path(file_id)
        if not os.path.exists(file_path):
            apiLogger.warning(f"Local file not found: {file_path}")
            raise HTTPException(status_code=404, detail=f"File with id {file_id} not found")
        
        from fastapi.responses import FileResponse
        return FileResponse(
            path=file_path,
            filename=task.file_name,
            media_type="application/pdf"
        )
    except HTTPException:
        raise
    except Exception as e:
        apiLogger.error(f"Error retrieving file: file_id={file_id}, error={str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/file_url/{task_id}")
async def get_file_url(
    task_id: int,
    user:User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get a URL for downloading a file"""
    user_id=user.user_id
    apiLogger.info(f"Get file URL request: task_id={task_id}, user_id={user_id}")
    
    try:
        task = await async_get_db_task(task_id, user_id, db)
        download_url = get_file_download_url(task)
        apiLogger.info(f"Generated download URL for task_id={task_id}")
        return {"url": download_url}
    except NotFoundError as e:
        apiLogger.warning(f"Task not found: task_id={task_id}, user_id={user_id}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        apiLogger.error(f"Error generating file URL: task_id={task_id}, error={str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
