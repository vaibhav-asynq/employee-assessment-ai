from typing import Optional

from sqlalchemy import ForeignKey
from sqlalchemy.dialects.postgresql import JSON
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

    feedbacks = relationship("DBFeedBack", back_populates="task")
    advices = relationship("DBAdvice", back_populates="task")


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
