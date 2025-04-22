import env_variables
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# INFO: Import the models. Needed to create db tables
from .models import Base, DBFeedBack, DBTask

DATABASE_URL =f"postgresql://{env_variables.DB_USER}:{env_variables.DB_PASSWORD}@{env_variables.DB_HOST}:{env_variables.DB_PORT}/{env_variables.DB_NAME}"

class NotFoundError(Exception):
    pass


engine = create_engine(DATABASE_URL)
session_local = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)


# Dependency to get the database session
def get_db():
    database = session_local()
    try:
        yield database
    finally:
        database.close()
