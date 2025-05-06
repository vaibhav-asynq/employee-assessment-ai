from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import DBProcessedAssessment, DBTask


async def create_processed_assessment(
    db: AsyncSession,
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
    await db.commit()
    await db.refresh(db_processed_assessment)
    
    return db_processed_assessment


async def get_processed_assessment_by_id(
    db: AsyncSession,
    assessment_id: int
) -> Optional[DBProcessedAssessment]:
    result = await db.execute(
        select(DBProcessedAssessment).where(DBProcessedAssessment.id == assessment_id)
    )
    return result.scalars().first()


async def get_processed_assessment_by_task_id(
    db: AsyncSession,
    task_id: int
) -> Optional[DBProcessedAssessment]:
    result = await db.execute(
        select(DBProcessedAssessment).where(DBProcessedAssessment.task_id == task_id)
    )
    return result.scalars().first()


async def update_processed_assessment(
    db: AsyncSession,
    assessment_id: int,
    filtered_data: Optional[str] = None,
    executive_data: Optional[str] = None
) -> Optional[DBProcessedAssessment]:
    db_assessment = await get_processed_assessment_by_id(db, assessment_id)
    
    if not db_assessment:
        return None
    
    if filtered_data is not None:
        db_assessment.filtered_data = filtered_data
    
    if executive_data is not None:
        db_assessment.executive_data = executive_data
    
    await db.commit()
    await db.refresh(db_assessment)
    
    return db_assessment


async def delete_processed_assessment(
    db: AsyncSession,
    assessment_id: int
) -> bool:
    db_assessment = await get_processed_assessment_by_id(db, assessment_id)
    
    if not db_assessment:
        return False
    
    await db.delete(db_assessment)
    await db.commit()
    
    return True
