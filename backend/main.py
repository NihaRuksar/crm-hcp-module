from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import json

from database import get_db, engine
from models import Base, Interaction
from agent import run_agent

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AIVOA CRM API")

# CORS — allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    tool: str = "log_interaction"
    interaction_id: Optional[int] = None
    current_data: Optional[dict] = None

class SaveRequest(BaseModel):
    hcp: Optional[str] = ""
    type: Optional[str] = ""
    date: Optional[str] = ""
    time: Optional[str] = ""
    location: Optional[str] = ""
    topics: Optional[str] = ""
    products: Optional[str] = ""
    sentiment: Optional[str] = ""
    outcomes: Optional[str] = ""
    followup: Optional[str] = ""
    materials: Optional[list] = []
    samples: Optional[list] = []
    summary: Optional[str] = ""

@app.get("/")
def root():
    return {"message": "AIVOA CRM API is running"}

@app.get("/health")
def health():
    return {"status": "ok", "agent": "LangGraph + Groq gemma2-9b-it"}

@app.post("/chat")
def chat(req: ChatRequest):
    try:
        result = run_agent(
            user_message=req.message,
            tool_hint=req.tool,
            interaction_id=req.interaction_id,
            current_data=req.current_data
        )
        return result
    except Exception as e:
        return {"error": str(e), "tool_used": req.tool, "result": {}}

@app.post("/interactions")
def save_interaction(data: SaveRequest, db: Session = Depends(get_db)):
    interaction = Interaction(
        hcp_name=data.hcp,
        interaction_type=data.type,
        date=data.date,
        time=data.time,
        location=data.location,
        topics=data.topics,
        products=data.products,
        sentiment=data.sentiment,
        outcomes=data.outcomes,
        followup=data.followup,
        materials=data.materials,
        samples=data.samples,
        summary=data.summary,
    )
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    return {"id": interaction.id, "message": "Interaction logged successfully"}

@app.get("/interactions")
def get_interactions(db: Session = Depends(get_db)):
    interactions = db.query(Interaction).all()
    return interactions

@app.put("/interactions/{id}")
def update_interaction(id: int, data: dict, db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(Interaction.id == id).first()
    if not interaction:
        return {"error": "Not found"}
    for key, value in data.items():
        if value is not None and hasattr(interaction, key):
            setattr(interaction, key, value)
    db.commit()
    return {"message": "Updated successfully"}