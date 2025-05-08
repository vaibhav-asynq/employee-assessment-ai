import os
import uuid
from datetime import datetime
from typing import Optional

import env_variables
from db.core import NotFoundError
from db.models import DBTask
from dir_config import SAVE_DIR
from fastapi import HTTPException, UploadFile
from process_pdf import AssessmentProcessor
from pydantic import BaseModel
from sqlalchemy import desc
from sqlalchemy.orm import Session

from .models import DBSnapshot, DBTask


class Task(BaseModel):
    id: int
    created_at: datetime
    user_id: str
    name: str
    file_id: str
    file_name: str
    current_snapshot_id: Optional[int]

class TaskCreate(BaseModel):
    user_id: str
    name: str
    file_id: str
    file_name: str

UPLOAD_DIR = "../data/uploads"
assessment_processor = AssessmentProcessor(env_variables.ANTHROPIC_API_KEY)

def get_upload_file_path(file_id: str):
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}.pdf")
    return file_path

def process_initial_transcripts(file_path:str=None, file_id:str=None, taskId:int=None, db: Session=None, save_to_files: bool = False):
    if file_id:
        file_path = get_upload_file_path(file_id)
    (
    filtered_feedback,
    executive_interview,
    ) = assessment_processor.process_assessment_with_executive(file_path, taskId, db, save_to_files, SAVE_DIR)
    return filtered_feedback, executive_interview


def scan_file_content(content: bytes) -> tuple[bool, str]:
    """
    Scan file content for unwanted text or characters.
    Returns a tuple of (is_safe, error_message).
    """
    # Check for file size (prevent extremely large files)
    if len(content) > 10 * 1024 * 1024:  # 10MB limit
        return False, "File size exceeds maximum allowed size"
    
    # Check for potentially malicious content or patterns
    # This is a basic implementation - expand based on specific requirements
    suspicious_patterns = [
        b"<script>", b"javascript:", b"eval(", b"exec(", 
        b"system(", b"<?php", b"function()", 
        b"DROP TABLE", b"DELETE FROM", b"rm -rf"
    ]
    
    for pattern in suspicious_patterns:
        if pattern in content.lower():
            return False, f"Potentially unsafe content detected: {pattern.decode('utf-8', errors='ignore')}"
    
    # Check for non-printable characters that might interfere with AI processing
    try:
        decoded = content.decode('utf-8', errors='strict')
        for i, char in enumerate(decoded):
            if ord(char) < 32 and char not in '\n\r\t':  # Allow newlines, tabs
                return False, f"Non-printable character detected at position {i}: {ord(char)}"
    except UnicodeDecodeError:
        # If the file is not valid UTF-8, it might be a binary file
        # For PDFs this shouldn't trigger, but we should check file type separately
        pass
    
    return True, ""


async def save_uploaded_file(file: UploadFile ):
    try:
        file_id = str(uuid.uuid4())
        file_path = get_upload_file_path(file_id)

        # Read and scan content
        content = await file.read()
        is_safe, error_message = scan_file_content(content)
        if not is_safe:
            raise HTTPException(status_code=400, detail=f"File validation failed: {error_message}")

        # Save file to disk
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        return (file_id, file_path)
    except HTTPException as e:
        raise
    except Exception as e:
        err= str(e)
        raise HTTPException(status_code=500, detail="Can not upload file.")


def is_file_exist(file_id: str):
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}.pdf")
    if os.path.exists(file_path):
        return file_path
    return False

def get_cached_file_id(user_id: str, filename:str, session: Session) -> Optional[str]:
    db_task = session.query(DBTask).filter(DBTask.file_name == filename, DBTask.user_id == user_id).first()
    if db_task is None:
        return None
    return db_task.file_id

def create_db_task( task: TaskCreate, session: Session) -> DBTask:
    db_item = DBTask(**task.model_dump(exclude_none=True))
    session.add(db_item)
    session.commit()
    session.refresh(db_item)

    return db_item

def get_db_task(task_id: int, user_id:str, session: Session) -> DBTask:
    db_task = session.query(DBTask).filter(DBTask.id == task_id, DBTask.user_id == user_id).first()
    if db_task is None:
        raise NotFoundError(f"Task with id {task_id} not found.")
    return db_task

def get_task_by_user_and_fileId(user_id: str, file_id:str, session: Session) -> Optional[DBTask]:
    db_task = session.query(DBTask).filter(DBTask.file_id == file_id, DBTask.user_id == user_id).first()
    if db_task is None:
        raise NotFoundError(f"Task with file id:{file_id} not found.")
    return db_task

def get_cached_task(user_id: str, file_id:str, session: Session) -> Optional[DBTask]:
    db_task = session.query(DBTask).filter(DBTask.file_id == file_id, DBTask.user_id == user_id).first()
    if db_task is None:
        return None
    return db_task


def get_user_tasks_db(user_id: str, session: Session) -> list[DBTask]:
    """Get all tasks for a specific user, sorted by creation date (newest first)"""
    db_tasks = session.query(DBTask).filter(DBTask.user_id == user_id).order_by(desc(DBTask.created_at))
    return db_tasks


def update_db_task(task_id: int, user_id: str, task_data: dict, session: Session) -> DBTask:
    """Update a task with the given data"""
    db_task = get_db_task(task_id, user_id, session)
    
    # Update only allowed fields
    allowed_fields = ["name", "file_name"]
    for field in allowed_fields:
        if field in task_data:
            setattr(db_task, field, task_data[field])
    
    session.commit()
    session.refresh(db_task)
    return db_task


def delete_db_task(task_id: int, user_id: str, session: Session) -> None:
    """Delete a task"""
    db_task = get_db_task(task_id, user_id, session)
    
    # If the task has a file, we might want to delete the file too
    if db_task.file_id and is_file_exist(db_task.file_id):
        file_path = os.path.join(UPLOAD_DIR, f"{db_task.file_id}.pdf")
        try:
            os.remove(file_path)
        except Exception as e:
            # Log the error but continue with task deletion
            print(f"Error deleting file {file_path}: {str(e)}")
    
    # TODO: delete other task file related data
    session.query(DBSnapshot).filter(DBSnapshot.task_id == db_task.id).delete()
    session.delete(db_task)
    session.commit()
