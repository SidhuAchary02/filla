from supabase import create_client, Client
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from config import settings

# ============ SUPABASE CLIENT ============
supabase_client: Client = create_client(
    settings.supabase_url,
    settings.supabase_service_role_key
)

# ============ POSTGRESQL CONNECTION ============
# Using SQLAlchemy for direct database queries
engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Dependency for database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def execute_query(query: str, params: dict = None):
    """Execute raw SQL query"""
    with engine.connect() as connection:
        result = connection.execute(text(query), params or {})
        connection.commit()
        return result

def fetch_query(query: str, params: dict = None):
    """Fetch data from raw SQL query"""
    with engine.connect() as connection:
        result = connection.execute(text(query), params or {})
        return result.fetchall()

def fetch_one(query: str, params: dict = None):
    """Fetch single row from query"""
    with engine.connect() as connection:
        result = connection.execute(text(query), params or {})
        return result.fetchone()
