from auth.user import User, get_current_user
from db.core import get_db
from db.file import (TaskCreate, create_db_task, get_cached_file_id,
                     is_file_exist, save_uploaded_file)
from fastapi import APIRouter, HTTPException, Query, Request, UploadFile
from fastapi.params import Depends
from sqlalchemy.orm import Session

router = APIRouter(
    prefix="",
)


# here tasks will be created
@router.post("/api/db/upload_file")
async def upload_file(
    request: Request, 
    file: UploadFile,
    use_cache: bool = Query(
        True, description="Whether to use cached results if available"
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) :
    user_id = current_user.user_id
    try:
        if use_cache:
            cached_file_id =  get_cached_file_id(user_id, file.filename )
            if cached_file_id:
                print(f"Using cached file ID {cached_file_id} for {file.filename}")
                if is_file_exist(file_id):
                    return {"file_id": cached_file_id}
        file_id = await save_uploaded_file(file)
        task_item = {
            "user_id": user_id,
            "name": file_id,
            "file_id": file_id,
            "file_name": file.filename
        }
        task = create_db_task(TaskCreate(**task_item) ,db)
        # TODO: return the task
        return {"file_id": task.file_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
