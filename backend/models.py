from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.dialects.mysql import LONGTEXT
from database import Base
from datetime import datetime

class HCP(Base):
    __tablename__ = "hcps"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200))
    specialty = Column(String(200))
    hospital = Column(String(200))
    city = Column(String(200))

class Interaction(Base):
    __tablename__ = "interactions"
    id = Column(Integer, primary_key=True, index=True)
    hcp_name = Column(String(200))
    interaction_type = Column(String(100))
    date = Column(String(20))
    time = Column(String(10))
    location = Column(String(300))
    topics = Column(Text)
    products = Column(String(300))
    sentiment = Column(String(50))
    outcomes = Column(Text)
    followup = Column(Text)
    materials = Column(JSON)
    samples = Column(JSON)
    summary = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class Followup(Base):
    __tablename__ = "followups"
    id = Column(Integer, primary_key=True, index=True)
    interaction_id = Column(Integer)
    hcp_name = Column(String(200))
    followup_date = Column(String(20))
    followup_type = Column(String(100))
    priority = Column(String(50))
    action_items = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)