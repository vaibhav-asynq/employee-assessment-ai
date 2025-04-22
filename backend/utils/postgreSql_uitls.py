import env_variables
import psycopg2
from psycopg2.extras import RealDictCursor


def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=env_variables.DB_HOST, 
            port=env_variables.DB_PORT  , 
            dbname=env_variables.DB_NAME  , 
            user=env_variables.DB_USER  , 
            password=env_variables.DB_PASSWORD  , 
            cursor_factory= RealDictCursor, 
        )
        return conn
    except Exception as e:
        print("Database connection error:", e)
        raise
