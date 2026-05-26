from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,        # checks connection before using it
    pool_recycle=280,          # recycles connection every 280 seconds
    pool_size=5,               # number of connections in pool
    max_overflow=10,           # extra connections allowed
    connect_args={
        "connect_timeout": 30  # wait 30 seconds before timeout
    }
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
