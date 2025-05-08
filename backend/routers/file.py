from typing import List

import env_variables
from auth.user import User, get_current_user
from cache_manager import add_to_filename_map
from db.core import NotFoundError, get_db
from db.file import (Task, TaskCreate, create_db_task, delete_db_task,
                     get_cached_file_id, get_db_task,
                     get_task_by_user_and_fileId, get_user_tasks_db,
                     is_file_exist, process_initial_transcripts,
                     save_uploaded_file, update_db_task)
from dir_config import SAVE_DIR
from fastapi import (APIRouter, HTTPException, Query, Request, UploadFile,
                     status)
from fastapi.params import Depends
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
    db: Session = Depends(get_db)
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
        task = create_db_task(TaskCreate(**task_item) ,db)
        dbLogger.info(f"Task created in database: task_id={task.id}, file_id={file_id}")
        
        files_store[file_id] = {"file_path": file_path, "original_name": file.filename, "storage_type": storage_type, "s3_key": s3_key}
        add_to_filename_map(file.filename, file_id)
        apiLogger.info(f"File added to store and filename map: file_id={file_id}")

        # TODO: fix: if transcripts generation fail other data  generating will also fails make it a retry/background task
        # Process the file
        process_initial_transcripts(file_path=file_path, db=db, taskId=task.id, save_to_files=True)
        apiLogger.info(f"Initial transcripts processed for file_id={file_id}, task_id={task.id}")
        
        # TODO: return the task
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
    db: Session = Depends(get_db)
):
    """Get a specific task by ID"""
    user_id=user.user_id
    apiLogger.info(f"Get task request: task_id={task_id}, user_id={user_id}")
    try:
        task = get_db_task(task_id, user_id, db)
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
    db: Session = Depends(get_db)
):
    """Get a task by file ID"""
    user_id=user.user_id
    apiLogger.info(f"Get task by file_id request: file_id={file_id}, user_id={user_id}")
    try:
        task = get_task_by_user_and_fileId(user_id, file_id, db)
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
    db: Session = Depends(get_db)
):
    """Get all tasks for the current user"""
    user_id = user.user_id
    apiLogger.info(f"Get all user tasks request: user_id={user_id}")
    try:
        tasks = get_user_tasks_db(user_id, db)
        apiLogger.info(f"Retrieved {tasks.count()} tasks for user_id={user_id}")
        return tasks
    except Exception as e:
        apiLogger.error(f"Error retrieving user tasks: user_id={user_id}, error={str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/api/tasks/{task_id}", response_model=Task)
async def update_task(
    task_id: int,
    task_data: dict,
    user:User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a task"""
    user_id=user.user_id
    apiLogger.info(f"Update task request: task_id={task_id}, user_id={user_id}")
    try:
        # We need to add this function to db/file.py
        updated_task = update_db_task(task_id, user_id, task_data, db)
        apiLogger.info(f"Task updated successfully: task_id={task_id}")
        dbLogger.info(f"Database task updated: task_id={task_id}, user_id={user_id}")
        return updated_task
    except NotFoundError as e:
        apiLogger.warning(f"Task not found for update: task_id={task_id}, user_id={user_id}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        apiLogger.error(f"Error updating task: task_id={task_id}, error={str(e)}", exc_info=True)
        dbLogger.error(f"Database error during task update: task_id={task_id}, error={str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/api/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    user:User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a task"""
    user_id=user.user_id
    apiLogger.info(f"Delete task request: task_id={task_id}, user_id={user_id}")
    try:
        # We need to add this function to db/file.py
        delete_db_task(task_id, user_id, db)
        apiLogger.info(f"Task deleted successfully: task_id={task_id}")
        dbLogger.info(f"Database task deleted: task_id={task_id}, user_id={user_id}")
        return {"success": True}
    except NotFoundError as e:
        apiLogger.warning(f"Task not found for deletion: task_id={task_id}, user_id={user_id}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        apiLogger.error(f"Error deleting task: task_id={task_id}, error={str(e)}", exc_info=True)
        dbLogger.error(f"Database error during task deletion: task_id={task_id}, error={str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/files/{file_id}")
async def get_file(
    file_id: str,
    user:User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a file by ID, either from local storage or S3"""
    user_id=user.user_id
    apiLogger.info(f"Get file request: file_id={file_id}, user_id={user_id}")
    
    try:
        # Get the task associated with this file
        task = db.query(DBTask).filter(DBTask.file_id == file_id, DBTask.user_id == user_id).first()
        if not task:
            apiLogger.warning(f"Task not found for file_id: {file_id}, user_id={user_id}")
            raise HTTPException(status_code=404, detail=f"File with id {file_id} not found")
        
        # If using S3, redirect to presigned URL
        if task.storage_type == "s3" and task.s3_key and env_variables.USE_S3 and s3_client:
            try:
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
    db: Session = Depends(get_db)
):
    """Get a URL for downloading a file"""
    user_id=user.user_id
    apiLogger.info(f"Get file URL request: task_id={task_id}, user_id={user_id}")
    
    try:
        task = get_db_task(task_id, user_id, db)
        download_url = get_file_download_url(task)
        apiLogger.info(f"Generated download URL for task_id={task_id}")
        return {"url": download_url}
    except NotFoundError as e:
        apiLogger.warning(f"Task not found: task_id={task_id}, user_id={user_id}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        apiLogger.error(f"Error generating file URL: task_id={task_id}, error={str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
