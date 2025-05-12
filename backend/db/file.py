import os
import re
import uuid
import asyncio
from datetime import datetime
from typing import Optional, Tuple

import boto3
import botocore
import env_variables
from db.core import NotFoundError
from db.models import DBAdvice, DBFeedBack, DBProcessedAssessment, DBTask
from dir_config import SAVE_DIR
from fastapi import HTTPException, UploadFile
from process_pdf import AssessmentProcessor
from pydantic import BaseModel
from sqlalchemy import desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import Session
from utils.loggers.db_logger import logger as dbLogger
from utils.loggers.endPoint_logger import logger as ApiLogger

from .models import DBSnapshot, DBTask


class Task(BaseModel):
    id: int
    created_at: datetime
    user_id: str
    name: str
    file_id: str
    file_name: str
    storage_type: Optional[str]
    s3_key: Optional[str] = None
    current_snapshot_id: Optional[int]

class TaskCreate(BaseModel):
    user_id: str
    name: str
    file_id: str
    file_name: str
    storage_type: Optional[str] = "local"
    s3_key: Optional[str] = None

UPLOAD_DIR = "../data/uploads"
assessment_processor = AssessmentProcessor(env_variables.ANTHROPIC_API_KEY)

# Initialize S3 client if S3 is enabled
s3_client = None
if env_variables.USE_S3:
    try:
        s3_params = {
            'region_name': env_variables.S3_REGION,
            'aws_access_key_id': env_variables.AWS_ACCESS_KEY_ID,
            'aws_secret_access_key': env_variables.AWS_SECRET_ACCESS_KEY,
        }
        
        # Add endpoint URL if specified (for custom S3-compatible storage)
        if env_variables.S3_ENDPOINT_URL:
            s3_params['endpoint_url'] = env_variables.S3_ENDPOINT_URL
            
        s3_client = boto3.client('s3', **s3_params)
        dbLogger.info("S3 client initialized successfully")
    except Exception as e:
        dbLogger.error(f"Failed to initialize S3 client: {str(e)}")
        # Fall back to local storage if S3 initialization fails
        env_variables.USE_S3 = False

def get_upload_file_path(file_id: str):
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}.pdf")
    dbLogger.debug(f"Generated upload file path: {file_path} for file_id: {file_id}")
    return file_path

def get_s3_key(file_id: str) -> str:
    """Generate S3 key for a file"""
    return f"uploads/{file_id}.pdf"

def upload_to_s3(file_content: bytes, file_id: str) -> str:
    """Upload file to S3 bucket and return the S3 key"""
    if not env_variables.USE_S3 or not s3_client:
        raise ValueError("S3 storage is not configured")
    
    s3_key = get_s3_key(file_id)
    try:
        s3_client.put_object(
            Bucket=env_variables.S3_BUCKET_NAME,
            Key=s3_key,
            Body=file_content,
            ContentType='application/pdf'
        )
        dbLogger.info(f"File uploaded to S3: bucket={env_variables.S3_BUCKET_NAME}, key={s3_key}")
        return s3_key
    except Exception as e:
        dbLogger.error(f"Error uploading to S3: {str(e)}")
        raise

def download_from_s3(s3_key: str) -> bytes:
    """Download file from S3 bucket"""
    if not env_variables.USE_S3 or not s3_client:
        raise ValueError("S3 storage is not configured")
    
    try:
        response = s3_client.get_object(
            Bucket=env_variables.S3_BUCKET_NAME,
            Key=s3_key
        )
        dbLogger.info(f"File downloaded from S3: bucket={env_variables.S3_BUCKET_NAME}, key={s3_key}")
        return response['Body'].read()
    except Exception as e:
        dbLogger.error(f"Error downloading from S3: {str(e)}")
        raise

def delete_from_s3(s3_key: str) -> bool:
    """Delete file from S3 bucket"""
    if not env_variables.USE_S3 or not s3_client:
        raise ValueError("S3 storage is not configured")
    
    try:
        s3_client.delete_object(
            Bucket=env_variables.S3_BUCKET_NAME,
            Key=s3_key
        )
        dbLogger.info(f"File deleted from S3: bucket={env_variables.S3_BUCKET_NAME}, key={s3_key}")
        return True
    except Exception as e:
        dbLogger.error(f"Error deleting from S3: {str(e)}")
        return False

def generate_presigned_url(s3_key: str, expiration: int = 3600) -> str:
    """Generate a presigned URL for accessing a file in S3"""
    if not env_variables.USE_S3 or not s3_client:
        raise ValueError("S3 storage is not configured")
    
    try:
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': env_variables.S3_BUCKET_NAME,
                'Key': s3_key
            },
            ExpiresIn=expiration
        )
        dbLogger.debug(f"Generated presigned URL for S3 key: {s3_key}, expires in {expiration} seconds")
        return url
    except Exception as e:
        dbLogger.error(f"Error generating presigned URL: {str(e)}")
        raise

async def process_initial_transcripts_async(file_path:str=None, file_id:str=None, taskId:int=None, db: Session=None, save_to_files: bool = False):
    """
    Async version of process_initial_transcripts that uses parallel processing.
    """
    dbLogger.info(f"Processing initial transcripts asynchronously for task_id: {taskId}, file_id: {file_id}")
    
    # If taskId is provided, try to get the task to determine storage type
    task = None
    if taskId and db:
        task = db.query(DBTask).filter(DBTask.id == taskId).first()
    
    # Get file path or content based on storage type
    if task and task.storage_type == "s3" and task.s3_key and env_variables.USE_S3 and s3_client:
        try:
            # For S3 storage, download to a temporary file
            dbLogger.debug(f"Getting file from S3: {task.s3_key}")
            file_content = download_from_s3(task.s3_key)
            
            # Write to a temporary file for processing
            if not file_path:
                file_path = get_upload_file_path(task.file_id)
                with open(file_path, "wb") as f:
                    f.write(file_content)
                dbLogger.debug(f"Downloaded S3 file to temporary path: {file_path}")
        except Exception as e:
            dbLogger.error(f"Error getting file from S3, trying local: {str(e)}")
            # Fall back to local file path
            if file_id:
                file_path = get_upload_file_path(file_id)
                dbLogger.debug(f"Falling back to local file path: {file_path}")
    elif file_id:
        file_path = get_upload_file_path(file_id)
        dbLogger.debug(f"Using file path from file_id: {file_path}")
    else:
        dbLogger.debug(f"Using provided file path: {file_path}")
    
    try:
        # Process the assessment using the parallel implementation
        result = assessment_processor.process_assessment_with_executive(file_path, taskId, db, save_to_files, SAVE_DIR)
        
        # Check if the result is a coroutine (async task) or a tuple
        if asyncio.iscoroutine(result):
            # If it's a coroutine, we need to await it
            dbLogger.info(f"Awaiting async processing task for task_id: {taskId}")
            stakeholder_chunks, executive_chunks = await result
            
            # Combine processed chunks and remove any duplicate whitespace
            filtered_feedback = "\n\n".join(stakeholder_chunks)
            executive_interview = "\n\n".join(filter(None, executive_chunks))  # Filter out empty chunks
            
            # Clean up final output
            executive_interview = re.sub(r'\n{3,}', '\n\n', executive_interview)  # Replace multiple newlines with double newline
            executive_interview = executive_interview.strip()
            
            # Save to database if task_id and db are provided
            if taskId is not None and db is not None:
                await assessment_processor.save_to_database(db, taskId, filtered_feedback, executive_interview)
                dbLogger.info(f"Saved to database for task ID: {taskId}")
            
            # Optionally save to files
            if save_to_files and SAVE_DIR:
                # Create output directory if it doesn't exist
                os.makedirs(SAVE_DIR, exist_ok=True)
                
                document_name = os.path.splitext(os.path.basename(file_path))[0]
                stakeholder_path = os.path.join(
                    SAVE_DIR, 
                    f"filtered_{document_name}.txt"
                )
                executive_path = os.path.join(
                    SAVE_DIR, 
                    f"executive_{document_name}.txt"
                )
                
                # Only write executive file if there's actual content
                with open(stakeholder_path, 'w', encoding='utf-8') as f:
                    f.write(filtered_feedback)
                
                if executive_interview.strip():
                    with open(executive_path, 'w', encoding='utf-8') as f:
                        f.write(executive_interview)
                        dbLogger.info(f"Executive interview saved to: {executive_path}")
                else:
                    dbLogger.info(f"No executive content found for task_id: {taskId}")
                
                dbLogger.info(f"Stakeholder feedback saved to: {stakeholder_path}")
        else:
            # If it's a tuple, unpack it directly
            filtered_feedback, executive_interview = result
            
        dbLogger.info(f"Successfully processed assessment for task_id: {taskId}")
        return filtered_feedback, executive_interview
    except Exception as e:
        dbLogger.error(f"Error processing assessment for task_id: {taskId}, error: {str(e)}")
        raise

def process_initial_transcripts(file_path:str=None, file_id:str=None, taskId:int=None, db: Session=None, save_to_files: bool = False):
    """
    Process initial transcripts from a PDF file.
    This function is a wrapper around the async version that handles the event loop.
    """
    dbLogger.info(f"Processing initial transcripts for task_id: {taskId}, file_id: {file_id}")
    
    # Use asyncio to run the async version
    import asyncio
    
    try:
        # Check if we're already in an event loop
        if asyncio.get_event_loop().is_running():
            # We're already in an async context, create a task instead of run_until_complete
            dbLogger.info("Using existing event loop for transcript processing - creating task")
            # Create a task in the existing event loop
            task = asyncio.create_task(
                process_initial_transcripts_async(file_path, file_id, taskId, db, save_to_files)
            )
            # Return the task - the caller can await it if needed
            return task
        else:
            # We're not in an async context, use asyncio.run
            dbLogger.info("Creating new event loop for transcript processing")
            return asyncio.run(
                process_initial_transcripts_async(file_path, file_id, taskId, db, save_to_files)
            )
    except Exception as e:
        dbLogger.error(f"Error in process_initial_transcripts: {str(e)}")
        raise


def scan_file_content(content: bytes) -> tuple[bool, str]:
    """
    Scan file content for unwanted text or characters.
    Returns a tuple of (is_safe, error_message).
    """
    dbLogger.debug(f"Scanning file content, size: {len(content)} bytes")
    
    # Check for file size (prevent extremely large files)
    if len(content) > 10 * 1024 * 1024:  # 10MB limit
        dbLogger.warning(f"File size exceeds maximum allowed size: {len(content)} bytes")
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
            error_msg = f"Potentially unsafe content detected: {pattern.decode('utf-8', errors='ignore')}"
            dbLogger.warning(f"Security scan failed: {error_msg}")
            return False, error_msg
    
    # Check for non-printable characters that might interfere with AI processing
    try:
        decoded = content.decode('utf-8', errors='strict')
        for i, char in enumerate(decoded):
            if ord(char) < 32 and char not in '\n\r\t':  # Allow newlines, tabs
                error_msg = f"Non-printable character detected at position {i}: {ord(char)}"
                dbLogger.warning(f"Security scan failed: {error_msg}")
                return False, error_msg
    except UnicodeDecodeError:
        # If the file is not valid UTF-8, it might be a binary file
        # For PDFs this shouldn't trigger, but we should check file type separately
        dbLogger.debug("File is not valid UTF-8, likely a binary file (expected for PDFs)")
        pass
    
    dbLogger.debug("File content scan completed successfully")
    return True, ""


async def save_uploaded_file(file: UploadFile) -> Tuple[str, str, str, Optional[str]]:
    """
    Save uploaded file either to local filesystem or S3 based on configuration.
    Returns a tuple of (file_id, file_path, storage_type, s3_key)
    """
    ApiLogger.info(f"Saving uploaded file: {file.filename}")
    try:
        file_id = str(uuid.uuid4())
        file_path = get_upload_file_path(file_id)
        ApiLogger.debug(f"Generated file_id: {file_id} for file: {file.filename}")

        # Read and scan content
        content = await file.read()
        ApiLogger.debug(f"Read {len(content)} bytes from file: {file.filename}")
        
        is_safe, error_message = scan_file_content(content)
        if not is_safe:
            ApiLogger.warning(f"File validation failed for {file.filename}: {error_message}")
            raise HTTPException(status_code=400, detail=f"File validation failed: {error_message}")

        # Determine storage type
        storage_type = "s3" if env_variables.USE_S3 else "local"
        s3_key = None
        
        # Save file based on storage type
        try:
            # Always save locally for now (will be removed later)
            with open(file_path, "wb") as f:
                f.write(content)
            ApiLogger.info(f"Successfully saved file to local path: {file_path}")
            
            # If S3 is enabled, also upload to S3
            if env_variables.USE_S3 and s3_client:
                try:
                    s3_key = upload_to_s3(content, file_id)
                    ApiLogger.info(f"Successfully uploaded file to S3: {s3_key}")
                except Exception as s3_err:
                    ApiLogger.error(f"Error uploading to S3, falling back to local storage: {str(s3_err)}")
                    storage_type = "local"  # Fall back to local storage
            
            return (file_id, file_path, storage_type, s3_key)
        except Exception as e:
            ApiLogger.error(f"Error saving file: {str(e)}")
            raise
            
    except HTTPException as e:
        # Just re-raise HTTP exceptions
        raise
    except Exception as e:
        err = str(e)
        ApiLogger.error(f"Unexpected error saving uploaded file {file.filename}: {err}")
        raise HTTPException(status_code=500, detail="Can not upload file.")


def is_file_exist(file_id: str, task: Optional[DBTask] = None):
    """
    Check if a file exists either in local storage or S3.
    If task is provided, use its storage_type to determine where to check.
    Returns the file path if found locally, True if found in S3, or False if not found.
    """
    # First check local storage (always check local for backward compatibility)
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}.pdf")
    local_exists = os.path.exists(file_path)
    
    # If task is provided and storage type is S3, also check S3
    if task and task.storage_type == "s3" and task.s3_key and env_variables.USE_S3 and s3_client:
        try:
            s3_client.head_object(
                Bucket=env_variables.S3_BUCKET_NAME,
                Key=task.s3_key
            )
            dbLogger.debug(f"File exists in S3 for file_id {file_id}: {task.s3_key}")
            return True
        except botocore.exceptions.ClientError as e:
            if e.response['Error']['Code'] == '404':
                dbLogger.debug(f"File does not exist in S3 for file_id {file_id}: {task.s3_key}")
                # If not in S3 but exists locally, return local path
                if local_exists:
                    dbLogger.debug(f"File exists locally for file_id {file_id}: {file_path}")
                    return file_path
                return False
            else:
                # Some other error occurred
                dbLogger.error(f"Error checking S3 for file_id {file_id}: {str(e)}")
                # Fall back to local check
                if local_exists:
                    return file_path
                return False
    
    # If no task or not using S3, just return local check result
    dbLogger.debug(f"Checking if file exists locally for file_id {file_id}: {local_exists}")
    if local_exists:
        return file_path
    return False

def get_file_content(task: DBTask) -> bytes:
    """Get file content either from local storage or S3 based on task's storage_type"""
    if task.storage_type == "s3" and task.s3_key and env_variables.USE_S3 and s3_client:
        try:
            return download_from_s3(task.s3_key)
        except Exception as e:
            dbLogger.error(f"Error downloading from S3, falling back to local: {str(e)}")
            # Fall back to local if S3 download fails
            pass
    
    # Get from local storage
    file_path = get_upload_file_path(task.file_id)
    if os.path.exists(file_path):
        with open(file_path, "rb") as f:
            return f.read()
    
    raise FileNotFoundError(f"File not found for task {task.id} with file_id {task.file_id}")


def get_cached_file_id(user_id: str, filename:str, session: Session) -> Optional[str]:
    dbLogger.debug(f"Looking for cached file_id for user: {user_id}, filename: {filename}")
    db_task = session.query(DBTask).filter(DBTask.file_name == filename, DBTask.user_id == user_id).first()
    if db_task is None:
        dbLogger.debug(f"No cached file found for user: {user_id}, filename: {filename}")
        return None
    dbLogger.debug(f"Found cached file_id: {db_task.file_id}")
    return db_task.file_id

def create_db_task(task: TaskCreate, session: Session) -> DBTask:
    dbLogger.info(f"Creating new task for user: {task.user_id}, file: {task.file_name}")
    try:
        db_item = DBTask(**task.model_dump(exclude_none=True))
        session.add(db_item)
        session.commit()
        session.refresh(db_item)
        dbLogger.info(f"Successfully created task with id: {db_item.id}")
        return db_item
    except Exception as e:
        dbLogger.error(f"Error creating task: {str(e)}")
        session.rollback()
        raise

def get_db_task(task_id: int, user_id:str, session: Session) -> DBTask:
    dbLogger.debug(f"Retrieving task with id: {task_id} for user: {user_id}")
    db_task = session.query(DBTask).filter(DBTask.id == task_id, DBTask.user_id == user_id).first()
    if db_task is None:
        dbLogger.warning(f"Task with id {task_id} not found for user: {user_id}")
        raise NotFoundError(f"Task with id {task_id} not found.")
    dbLogger.debug(f"Successfully retrieved task with id: {task_id}")
    return db_task

def get_task_by_user_and_fileId(user_id: str, file_id:str, session: Session) -> Optional[DBTask]:
    dbLogger.debug(f"Retrieving task for user: {user_id} with file_id: {file_id}")
    db_task = session.query(DBTask).filter(DBTask.file_id == file_id, DBTask.user_id == user_id).first()
    if db_task is None:
        dbLogger.warning(f"Task with file_id: {file_id} not found for user: {user_id}")
        raise NotFoundError(f"Task with file id:{file_id} not found.")
    dbLogger.debug(f"Successfully retrieved task with id: {db_task.id} for file_id: {file_id}")
    return db_task

def get_cached_task(user_id: str, file_id:str, session: Session) -> Optional[DBTask]:
    dbLogger.debug(f"Looking for cached task for user: {user_id}, file_id: {file_id}")
    db_task = session.query(DBTask).filter(DBTask.file_id == file_id, DBTask.user_id == user_id).first()
    if db_task is None:
        dbLogger.debug(f"No cached task found for user: {user_id}, file_id: {file_id}")
        return None
    dbLogger.debug(f"Found cached task with id: {db_task.id}")
    return db_task

def get_file_download_url(task: DBTask) -> str:
    """
    Get a URL for downloading the file.
    For S3 storage, returns a presigned URL.
    For local storage, returns a relative path.
    """
    if task.storage_type == "s3" and task.s3_key and env_variables.USE_S3 and s3_client:
        try:
            return generate_presigned_url(task.s3_key)
        except Exception as e:
            dbLogger.error(f"Error generating presigned URL, falling back to local path: {str(e)}")
    
    # Return local path for local storage or as fallback
    return f"/api/files/{task.file_id}"

def get_user_tasks_db(user_id: str, session: Session) -> list[DBTask]:
    """Get all tasks for a specific user, sorted by creation date (newest first)"""
    dbLogger.debug(f"Retrieving all tasks for user: {user_id}")
    db_tasks = session.query(DBTask).filter(DBTask.user_id == user_id).order_by(desc(DBTask.created_at))
    task_count = db_tasks.count()
    dbLogger.debug(f"Found {task_count} tasks for user: {user_id}")
    return db_tasks


def update_db_task(task_id: int, user_id: str, task_data: dict, session: Session) -> DBTask:
    """Update a task with the given data"""
    dbLogger.info(f"Updating task with id: {task_id} for user: {user_id}")
    try:
        db_task = get_db_task(task_id, user_id, session)
        
        # Update only allowed fields
        allowed_fields = ["name", "file_name"]
        updated_fields = []
        for field in allowed_fields:
            if field in task_data:
                old_value = getattr(db_task, field)
                new_value = task_data[field]
                if old_value != new_value:
                    setattr(db_task, field, new_value)
                    updated_fields.append(field)
        
        if updated_fields:
            dbLogger.debug(f"Updated fields for task {task_id}: {', '.join(updated_fields)}")
            session.commit()
            session.refresh(db_task)
            dbLogger.info(f"Successfully updated task with id: {task_id}")
        else:
            dbLogger.debug(f"No changes made to task with id: {task_id}")
        
        return db_task
    except Exception as e:
        dbLogger.error(f"Error updating task {task_id}: {str(e)}")
        session.rollback()
        raise


def delete_db_task(task_id: int, user_id: str, session: Session) -> None:
    """Delete a task and its associated files from both local storage and S3 if applicable"""
    dbLogger.info(f"Deleting task with id: {task_id} for user: {user_id}")
    try:
        db_task = get_db_task(task_id, user_id, session)
        
        # Delete the file from appropriate storage
        if db_task.file_id:
            # Always try to delete from local storage for backward compatibility
            file_path = os.path.join(UPLOAD_DIR, f"{db_task.file_id}.pdf")
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                    dbLogger.info(f"Deleted associated local file: {file_path}")
                except Exception as e:
                    # Log the error but continue with task deletion
                    dbLogger.warning(f"Error deleting local file {file_path}: {str(e)}")
            
            # If using S3, also delete from S3
            if db_task.storage_type == "s3" and db_task.s3_key and env_variables.USE_S3 and s3_client:
                try:
                    delete_from_s3(db_task.s3_key)
                    dbLogger.info(f"Deleted associated S3 file: {db_task.s3_key}")
                except Exception as e:
                    # Log the error but continue with task deletion
                    dbLogger.warning(f"Error deleting S3 file {db_task.s3_key}: {str(e)}")

        # Delete related advice data
        session.query(DBAdvice).filter(DBAdvice.task_id == db_task.id).delete()
        dbLogger.info(f"Deleted advice data associated with task {task_id}")
        
        # Delete related feedback data
        session.query(DBFeedBack).filter(DBFeedBack.task_id == db_task.id).delete()
        dbLogger.info(f"Deleted feedback data associated with task {task_id}")
        
        # Delete related processed assessment data
        session.query(DBProcessedAssessment).filter(DBProcessedAssessment.task_id == db_task.id).delete()
        dbLogger.info(f"Deleted processed assessment data associated with task {task_id}")

        # Delete related snapshots
        snapshot_count = session.query(DBSnapshot).filter(DBSnapshot.task_id == db_task.id).count()
        session.query(DBSnapshot).filter(DBSnapshot.task_id == db_task.id).delete()
        dbLogger.info(f"Deleted {snapshot_count} snapshots associated with task {task_id}")
        
        # Delete the task itself
        session.delete(db_task)
        session.commit()
        dbLogger.info(f"Successfully deleted task with id: {task_id}")
    except Exception as e:
        dbLogger.error(f"Error deleting task {task_id}: {str(e)}")
        session.rollback()
        raise

# Async versions of the functions

async def async_get_cached_file_id(user_id: str, filename: str, session: AsyncSession) -> Optional[str]:
    """Async version of get_cached_file_id"""
    dbLogger.debug(f"[ASYNC] Looking for cached file_id for user: {user_id}, filename: {filename}")
    try:
        stmt = select(DBTask).filter(DBTask.file_name == filename, DBTask.user_id == user_id)
        result = await session.execute(stmt)
        db_task = result.scalars().first()
        
        if db_task is None:
            dbLogger.debug(f"[ASYNC] No cached file found for user: {user_id}, filename: {filename}")
            return None
            
        dbLogger.debug(f"[ASYNC] Found cached file_id: {db_task.file_id}")
        return db_task.file_id
    except Exception as e:
        dbLogger.error(f"[ASYNC] Error getting cached file_id: {str(e)}")
        raise

async def async_create_db_task(task: TaskCreate, session: AsyncSession) -> DBTask:
    """Async version of create_db_task"""
    dbLogger.info(f"[ASYNC] Creating new task for user: {task.user_id}, file: {task.file_name}")
    try:
        db_item = DBTask(**task.model_dump(exclude_none=True))
        session.add(db_item)
        await session.commit()
        await session.refresh(db_item)
        dbLogger.info(f"[ASYNC] Successfully created task with id: {db_item.id}")
        return db_item
    except Exception as e:
        dbLogger.error(f"[ASYNC] Error creating task: {str(e)}")
        await session.rollback()
        raise

async def async_get_db_task(task_id: int, user_id: str, session: AsyncSession) -> DBTask:
    """Async version of get_db_task"""
    dbLogger.debug(f"[ASYNC] Retrieving task with id: {task_id} for user: {user_id}")
    try:
        stmt = select(DBTask).filter(DBTask.id == task_id, DBTask.user_id == user_id)
        result = await session.execute(stmt)
        db_task = result.scalars().first()
        
        if db_task is None:
            dbLogger.warning(f"[ASYNC] Task with id {task_id} not found for user: {user_id}")
            raise NotFoundError(f"Task with id {task_id} not found.")
            
        dbLogger.debug(f"[ASYNC] Successfully retrieved task with id: {task_id}")
        return db_task
    except NotFoundError:
        raise
    except Exception as e:
        dbLogger.error(f"[ASYNC] Error retrieving task: {str(e)}")
        raise

async def async_get_task_by_user_and_fileId(user_id: str, file_id: str, session: AsyncSession) -> Optional[DBTask]:
    """Async version of get_task_by_user_and_fileId"""
    dbLogger.debug(f"[ASYNC] Retrieving task for user: {user_id} with file_id: {file_id}")
    try:
        stmt = select(DBTask).filter(DBTask.file_id == file_id, DBTask.user_id == user_id)
        result = await session.execute(stmt)
        db_task = result.scalars().first()
        
        if db_task is None:
            dbLogger.warning(f"[ASYNC] Task with file_id: {file_id} not found for user: {user_id}")
            raise NotFoundError(f"Task with file id:{file_id} not found.")
            
        dbLogger.debug(f"[ASYNC] Successfully retrieved task with id: {db_task.id} for file_id: {file_id}")
        return db_task
    except NotFoundError:
        raise
    except Exception as e:
        dbLogger.error(f"[ASYNC] Error retrieving task by file_id: {str(e)}")
        raise

async def async_process_initial_transcripts(file_path: str = None, file_id: str = None, taskId: int = None, db: AsyncSession = None, save_to_files: bool = False):
    """Async version of process_initial_transcripts"""
    dbLogger.info(f"[ASYNC] Processing initial transcripts for task_id: {taskId}, file_id: {file_id}")
    
    # If taskId is provided, try to get the task to determine storage type
    task = None
    if taskId and db:
        stmt = select(DBTask).filter(DBTask.id == taskId)
        result = await db.execute(stmt)
        task = result.scalars().first()
    
    # Get file path or content based on storage type
    if task and task.storage_type == "s3" and task.s3_key and env_variables.USE_S3 and s3_client:
        try:
            # For S3 storage, download to a temporary file
            dbLogger.debug(f"[ASYNC] Getting file from S3: {task.s3_key}")
            file_content = download_from_s3(task.s3_key)
            
            # Write to a temporary file for processing
            if not file_path:
                file_path = get_upload_file_path(task.file_id)
                with open(file_path, "wb") as f:
                    f.write(file_content)
                dbLogger.debug(f"[ASYNC] Downloaded S3 file to temporary path: {file_path}")
        except Exception as e:
            dbLogger.error(f"[ASYNC] Error getting file from S3, trying local: {str(e)}")
            # Fall back to local file path
            if file_id:
                file_path = get_upload_file_path(file_id)
                dbLogger.debug(f"[ASYNC] Falling back to local file path: {file_path}")
    elif file_id:
        file_path = get_upload_file_path(file_id)
        dbLogger.debug(f"[ASYNC] Using file path from file_id: {file_path}")
    else:
        dbLogger.debug(f"[ASYNC] Using provided file path: {file_path}")
    
    try:
        # Use the async version of process_assessment_with_executive
        filtered_feedback, executive_interview = await assessment_processor.async_process_assessment_with_executive(
            file_path, taskId, db, save_to_files, SAVE_DIR
        )
        dbLogger.info(f"[ASYNC] Successfully processed assessment for task_id: {taskId}")
        return filtered_feedback, executive_interview
    except Exception as e:
        dbLogger.error(f"[ASYNC] Error processing assessment for task_id: {taskId}, error: {str(e)}")
        raise
