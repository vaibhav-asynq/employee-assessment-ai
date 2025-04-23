from typing import List

import env_variables
from auth.user import User, get_current_user
from db.core import NotFoundError, get_db
from db.file import (Task, TaskCreate, create_db_task, delete_db_task,
                     get_cached_file_id, get_db_task,
                     get_task_by_user_and_fileId, get_user_tasks_db,
                     is_file_exist, save_uploaded_file, update_db_task)
from dir_config import SAVE_DIR
from fastapi import (APIRouter, HTTPException, Query, Request, UploadFile,
                     status)
from fastapi.params import Depends
from process_pdf import AssessmentProcessor
from sqlalchemy.orm import Session
from state import files_store

assessment_processor = AssessmentProcessor(env_variables.ANTHROPIC_API_KEY)

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
    try:
        if use_cache:
            cached_file_id =  get_cached_file_id(user_id, file.filename,db )
            if cached_file_id:
                print(f"Using cached file ID {cached_file_id} for {file.filename}")
                file_path = is_file_exist(cached_file_id)
                if file_path:
                    if cached_file_id not in files_store:
                        files_store[cached_file_id] = {
                            "file_path": file_path,
                            "original_name": file.filename,
                        }
                    return {"file_id": cached_file_id}
        file_id, file_path = await save_uploaded_file(file)
        # Process the file
        (
            stakeholder_feedback,
            executive_interview,
        ) = assessment_processor.process_assessment_with_executive(file_path, SAVE_DIR)

        task_item = {
            "user_id": user_id,
            "name": file_id,
            "file_id": file_id,
            "file_name": file.filename
        }
        task = create_db_task(TaskCreate(**task_item) ,db)
        files_store[file_id] = {"file_path": file_path, "original_name": file.filename}
        # TODO: return the task
        return {"file_id": task.file_id}
    except Exception as e:
        print(str(e))
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/api/tasks/{task_id}", response_model=Task)
async def get_task(
    task_id: int,
    user_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific task by ID"""
    try:
        task = get_db_task(task_id, user_id, db)
        return task
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/tasks/file/{file_id}", response_model=Task)
async def get_task_by_file_id(
    file_id: str,
    user_id: str,
    db: Session = Depends(get_db)
):
    """Get a task by file ID"""
    try:
        task = get_task_by_user_and_fileId(user_id, file_id, db)
        return task
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/tasks", response_model=List[Task])
async def get_user_tasks(
    user_id: str,
    db: Session = Depends(get_db)
):
    """Get all tasks for the current user"""
    try:
        # We need to add this function to db/file.py
        tasks = get_user_tasks_db(user_id, db)
        return tasks
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/api/tasks/{task_id}", response_model=Task)
async def update_task(
    task_id: int,
    task_data: dict,
    user_id: str,
    db: Session = Depends(get_db)
):
    """Update a task"""
    try:
        # We need to add this function to db/file.py
        updated_task = update_db_task(task_id, user_id, task_data, db)
        return updated_task
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/api/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    user_id: str,
    db: Session = Depends(get_db)
):
    """Delete a task"""
    try:
        # We need to add this function to db/file.py
        delete_db_task(task_id, user_id, db)
        return {}
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
