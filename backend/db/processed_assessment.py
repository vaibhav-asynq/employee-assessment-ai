from typing import Optional

from sqlalchemy.orm import Session
from utils.loggers.db_logger import logger as dbLogger
from utils.loggers.endPoint_logger import logger as ApiLogger

from .models import DBProcessedAssessment, DBTask


def create_processed_assessment(
    db: Session,
    task_id: int,
    filtered_data: str,
    executive_data: str
) -> DBProcessedAssessment:
    dbLogger.info(f"Creating processed assessment for task_id: {task_id}")
    try:
        db_processed_assessment = DBProcessedAssessment(
            task_id=task_id,
            filtered_data=filtered_data,
            executive_data=executive_data
        )
        
        db.add(db_processed_assessment)
        db.commit()
        db.refresh(db_processed_assessment)
        
        dbLogger.info(f"Successfully created processed assessment with id: {db_processed_assessment.id}")
        return db_processed_assessment
    except Exception as e:
        dbLogger.error(f"Error creating processed assessment for task_id {task_id}: {str(e)}")
        db.rollback()
        raise


def get_processed_assessment_by_id(
    db: Session,
    assessment_id: int
) -> Optional[DBProcessedAssessment]:
    dbLogger.info(f"Fetching processed assessment by id: {assessment_id}")
    try:
        assessment = db.query(DBProcessedAssessment).filter(DBProcessedAssessment.id == assessment_id).first()
        if assessment:
            dbLogger.info(f"Found processed assessment with id: {assessment_id}")
        else:
            dbLogger.info(f"No processed assessment found with id: {assessment_id}")
        return assessment
    except Exception as e:
        dbLogger.error(f"Error fetching processed assessment with id {assessment_id}: {str(e)}")
        raise


def get_processed_assessment_by_task_id(
    db: Session,
    task_id: int
) -> Optional[DBProcessedAssessment]:
    dbLogger.info(f"Fetching processed assessment by task_id: {task_id}")
    try:
        assessment = db.query(DBProcessedAssessment).filter(DBProcessedAssessment.task_id == task_id).first()
        if assessment:
            dbLogger.info(f"Found processed assessment for task_id: {task_id}")
        else:
            dbLogger.info(f"No processed assessment found for task_id: {task_id}")
        return assessment
    except Exception as e:
        dbLogger.error(f"Error fetching processed assessment for task_id {task_id}: {str(e)}")
        raise


def update_processed_assessment(
    db: Session,
    assessment_id: int,
    filtered_data: Optional[str] = None,
    executive_data: Optional[str] = None
) -> Optional[DBProcessedAssessment]:
    dbLogger.info(f"Updating processed assessment with id: {assessment_id}")
    try:
        db_assessment = get_processed_assessment_by_id(db, assessment_id)
        
        if not db_assessment:
            dbLogger.warning(f"Cannot update: processed assessment with id {assessment_id} not found")
            return None
        
        update_fields = []
        if filtered_data is not None:
            db_assessment.filtered_data = filtered_data
            update_fields.append("filtered_data")
        
        if executive_data is not None:
            db_assessment.executive_data = executive_data
            update_fields.append("executive_data")
        
        db.commit()
        db.refresh(db_assessment)
        
        dbLogger.info(f"Successfully updated processed assessment id {assessment_id}, fields: {', '.join(update_fields)}")
        return db_assessment
    except Exception as e:
        dbLogger.error(f"Error updating processed assessment with id {assessment_id}: {str(e)}")
        db.rollback()
        raise


def delete_processed_assessment(
    db: Session,
    assessment_id: int
) -> bool:
    dbLogger.info(f"Deleting processed assessment with id: {assessment_id}")
    try:
        db_assessment = get_processed_assessment_by_id(db, assessment_id)
        
        if not db_assessment:
            dbLogger.warning(f"Cannot delete: processed assessment with id {assessment_id} not found")
            return False
        
        db.delete(db_assessment)
        db.commit()
        
        dbLogger.info(f"Successfully deleted processed assessment with id: {assessment_id}")
        return True
    except Exception as e:
        dbLogger.error(f"Error deleting processed assessment with id {assessment_id}: {str(e)}")
        db.rollback()
        raise
