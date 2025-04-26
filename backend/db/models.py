import datetime
from typing import Optional

from sqlalchemy import ForeignKey
from sqlalchemy.dialects.postgresql import JSON, JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass

class DBTask(Base):
    __tablename__ = "task"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[str]
    name: Mapped[str] 
    file_id: Mapped[str]
    file_name: Mapped[str]

    current_snapshot_id: Mapped[int] = mapped_column(nullable=True)
    feedbacks = relationship("DBFeedBack", back_populates="task")
    advices = relationship("DBAdvice", back_populates="task")
    snapshots = relationship("DBSnapshot", back_populates="task")


class DBFeedBack(Base):
    __tablename__ = "feedback"

    id: Mapped[int] = mapped_column(primary_key=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("task.id"))
    feedback: Mapped[dict] = mapped_column(JSON)

    task = relationship("DBTask", back_populates="feedbacks")

class DBAdvice(Base):
    __tablename__ = "advice"

    id: Mapped[int] = mapped_column(primary_key=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("task.id"))
    advice: Mapped[dict] = mapped_column(JSON)  

    task = relationship("DBTask", back_populates="advices")

class DBSnapshot(Base):
    __tablename__ = "snapshot"

    id: Mapped[int] = mapped_column(primary_key=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("task.id"))
    created_at: Mapped[datetime.datetime] = mapped_column(default=lambda: datetime.datetime.now(datetime.timezone.utc))

    # Either null (initial snapshot) or ID of parent snapshot
    parent_id: Mapped[Optional[int]] = mapped_column(ForeignKey("snapshot.id"), nullable=True)
    trigger_type: Mapped[str] = mapped_column(default="manual")  # "auto" | "manual" | etc.

    # Expected format for following json:
    # {
    #   "editable": {...},
    #   "sorted_by": {
    #       "stakeholders": {...},
    #       "competency": {...}
    #   }
    # }

    manual_report: Mapped[dict]=mapped_column(JSONB)
    full_report: Mapped[dict]=mapped_column(JSONB)
    ai_Competencies: Mapped[dict]=mapped_column(JSONB)

    task = relationship("DBTask", back_populates="snapshots")

    # Self-referencing relationship for undo tree
    parent = relationship("DBSnapshot", remote_side=[id], backref="children")
