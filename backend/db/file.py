import os
import uuid
from typing import Optional

from db.core import NotFoundError
from db.models import DBTask
from fastapi import HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .models import DBTask


class Task(BaseModel):
    id: int
    user_id: str
    name: str
    file_id: str
    file_name: str

class TaskCreate(BaseModel):
    user_id: str
    name: str
    file_id: str
    file_name: str

UPLOAD_DIR = "../data/uploads"

async def save_uploaded_file(file: UploadFile ):
    try:
        file_id = str(uuid.uuid4())
        file_path = os.path.join(UPLOAD_DIR, f"{file_id}.pdf")

        # Save file to disk
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        return file_id
    except Exception as e:
        err= str(e)
        raise HTTPException(status_code=500, detail="Can not save file.")


def is_file_exist(file_id: str):
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}.pdf")
    if os.path.exists(file_path):
        return True
    return False

def get_cached_file_id(user_id: str, filename:str, session: Session) -> Optional[str]:
    db_task = session.query(DBTask).filter([DBTask.file_name == filename, DBTask.user_id == user_id]).first()
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
    db_task = session.query(DBTask).filter([DBTask.id == task_id, DBTask.user_id == user_id]).first()
    if db_task is None:
        raise NotFoundError(f"Task with id {task_id} not found.")
    return db_task

def get_task_by_user_and_fileId(user_id: str, file_id:str, session: Session) -> Optional[DBTask]:
    db_task = session.query(DBTask).filter([DBTask.file_id == file_id, DBTask.user_id == user_id]).first()
    if db_task is None:
        raise NotFoundError(f"Task with file id:{file_id} not found.")
    return db_task

def get_cached_task(user_id: str, file_id:str, session: Session) -> Optional[DBTask]:
    db_task = session.query(DBTask).filter([DBTask.file_id == file_id, DBTask.user_id == user_id]).first()
    if db_task is None:
        return None
    return db_task
