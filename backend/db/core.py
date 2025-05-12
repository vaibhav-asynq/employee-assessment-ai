import env_variables
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

# INFO: Import the models. Needed to create db tables
from .models import Base, DBFeedBack, DBTask

# Synchronous database URL
DATABASE_URL = f"postgresql://{env_variables.DB_USER}:{env_variables.DB_PASSWORD}@{env_variables.DB_HOST}:{env_variables.DB_PORT}/{env_variables.DB_NAME}"
# Asynchronous database URL
ASYNC_DATABASE_URL = f"postgresql+asyncpg://{env_variables.DB_USER}:{env_variables.DB_PASSWORD}@{env_variables.DB_HOST}:{env_variables.DB_PORT}/{env_variables.DB_NAME}"

class NotFoundError(Exception):
    pass

# Synchronous engine and session
engine = create_engine(DATABASE_URL)
session_local = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

# Asynchronous engine and session
async_engine = create_async_engine(
    ASYNC_DATABASE_URL,
    connect_args={
        "statement_cache_size": 0,  # Disable statement cache
        "prepared_statement_cache_size": 0,  # Explicitly disable prepared statement cache
        "server_settings": {
            "statement_timeout": "60000",  # 60 seconds timeout
        }
    },
    pool_pre_ping=True,  # Verify connections before use
    pool_size=5,  # Limit pool size
    max_overflow=10,  # Allow some overflow
    pool_recycle=3600,  # Recycle connections after an hour
)
async_session_local = sessionmaker(
    class_=AsyncSession, 
    expire_on_commit=False, 
    autocommit=False, 
    autoflush=False, 
    bind=async_engine
)

# Dependency to get the synchronous database session
def get_db():
    database = session_local()
    try:
        yield database
    finally:
        database.close()

# Dependency to get the asynchronous database session
async def get_async_db():
    async with async_session_local() as database:
        try:
            yield database
        finally:
            await database.close()
