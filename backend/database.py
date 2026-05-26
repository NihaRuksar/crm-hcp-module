from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Railway MySQL individual variables
MYSQL_USER = os.getenv("MYSQLUSER") or os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQLPASSWORD") or os.getenv("MYSQL_PASSWORD", "")
MYSQL_HOST = os.getenv("MYSQLHOST") or os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = os.getenv("MYSQLPORT") or os.getenv("MYSQL_PORT", "3306")
MYSQL_DB = os.getenv("MYSQLDATABASE") or os.getenv("MYSQL_DATABASE", "railway")

DATABASE_URL = (
    f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}"
    f"@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"
    f"?charset=utf8mb4"
)

print(f"DB Host: {MYSQL_HOST}")
print(f"DB Port: {MYSQL_PORT}")
print(f"DB Name: {MYSQL_DB}")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=200,
    pool_size=2,
    max_overflow=3,
    connect_args={
        "connect_timeout": 60,
        "read_timeout": 60,
        "write_timeout": 60,
        "charset": "utf8mb4",
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
