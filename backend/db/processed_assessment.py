from typing import Optional

from sqlalchemy.orm import Session

from .models import DBProcessedAssessment, DBTask


def create_processed_assessment(
    db: Session,
    task_id: int,
    filtered_data: str,
    executive_data: str
) -> DBProcessedAssessment:
    db_processed_assessment = DBProcessedAssessment(
        task_id=task_id,
        filtered_data=filtered_data,
        executive_data=executive_data
    )
    
    db.add(db_processed_assessment)
    db.commit()
    db.refresh(db_processed_assessment)
    
    return db_processed_assessment


def get_processed_assessment_by_id(
    db: Session,
    assessment_id: int
) -> Optional[DBProcessedAssessment]:
    return db.query(DBProcessedAssessment).filter(DBProcessedAssessment.id == assessment_id).first()


def get_processed_assessment_by_task_id(
    db: Session,
    task_id: int
) -> Optional[DBProcessedAssessment]:
    return db.query(DBProcessedAssessment).filter(DBProcessedAssessment.task_id == task_id).first()


def update_processed_assessment(
    db: Session,
    assessment_id: int,
    filtered_data: Optional[str] = None,
    executive_data: Optional[str] = None
) -> Optional[DBProcessedAssessment]:
    db_assessment = get_processed_assessment_by_id(db, assessment_id)
    
    if not db_assessment:
        return None
    
    if filtered_data is not None:
        db_assessment.filtered_data = filtered_data
    
    if executive_data is not None:
        db_assessment.executive_data = executive_data
    
    db.commit()
    db.refresh(db_assessment)
    
    return db_assessment


def delete_processed_assessment(
    db: Session,
    assessment_id: int
) -> bool:
    db_assessment = get_processed_assessment_by_id(db, assessment_id)
    
    if not db_assessment:
        return False
    
    db.delete(db_assessment)
    db.commit()
    
    return True
