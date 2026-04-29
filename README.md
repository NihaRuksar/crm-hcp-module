# 🧠CRM — AI-First HCP Interaction Logger

<div align="center">

![AIVOA Banner](https://img.shields.io/badge/AIVOA-AI--First%20CRM-4f46e5?style=for-the-badge&logo=brain&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph-Agent-7c3aed?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-Frontend-61dafb?style=for-the-badge&logo=react&logoColor=black)
![Groq](https://img.shields.io/badge/Groq-LLM-f97316?style=for-the-badge&logo=lightning&logoColor=white)

**Stop filling forms. Just talk.**

*An AI-powered CRM for life science field reps — describe your HCP interaction naturally, and the AI fills every field automatically using LangGraph agents.*

[Live Demo](#) · [Report Bug](#) · [Request Feature](#)

</div>

---

## ✨ What Makes This Different

Most CRMs make you fill forms. AIVOA makes you talk.

> *"Today I met Dr. Smith, discussed Product X efficacy, the sentiment was positive, and I shared brochures."*

That one sentence fills **every field** in the form — HCP name, interaction type, date, topics, products, sentiment, materials, and a 2-sentence AI summary. No clicking. No typing in boxes.

---

## 🎬 How It Works

```
You type a message  →  LangGraph Agent picks the right tool
                    →  LLM extracts structured data
                    →  Form fills automatically in real-time
                    →  Save to database with one click
```

---

## 🛠️ LangGraph Tools (5 Agents)

| Tool | What It Does |
|------|-------------|
| 📝 `log_interaction` | Extracts HCP name, type, date, topics, products, sentiment, outcomes from natural language and fills the entire form |
| ✏️ `edit_interaction` | Updates only specific fields — *"change sentiment to negative"* touches only that field |
| 👤 `fetch_hcp_profile` | Pulls doctor profile: specialty, hospital, city, past interactions, preferences |
| 📅 `schedule_followup` | Creates a follow-up plan with date, priority, and action items |
| 📊 `analyze_sentiment` | Deep sentiment analysis with confidence score, sales implication, and recommended action |

---

## 🖥️ Split-Screen Architecture

```
┌─────────────────────────────┬──────────────────────────┐
│                             │                          │
│   📋 INTERACTION FORM       │   🤖 AI ASSISTANT        │
│                             │                          │
│   HCP Name: Dr. Smith  ←───│── "Today I met Dr.       │
│   Type: Meeting        ←───│    Smith, discussed       │
│   Sentiment: Positive  ←───│    Product X..."          │
│   Topics: Product X    ←───│                          │
│   Summary: AI-written  ←───│   [LangGraph Active 🟢]  │
│                             │                          │
│   [ Log Interaction ]       │   📝 Log  ✏️ Edit  👤    │
└─────────────────────────────┴──────────────────────────┘
```

**Rule:** You must NOT fill the left form manually. The AI assistant on the right controls the form.

---

## ⚡ Tech Stack

### Backend
```
FastAPI          — REST API server
LangGraph        — AI agent orchestration  
LangChain Groq   — LLM integration (llama-3.3-70b-versatile)
SQLAlchemy       — ORM
SQLite / PostgreSQL — Database
Python-dotenv    — Environment config
```

### Frontend
```
React 18         — UI framework
Redux Toolkit    — Global state management
CSS3             — Custom design system (no UI library)
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Groq API Key → [console.groq.com](https://console.groq.com)

---

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/aivoa-crm.git
cd aivoa-crm
```

---

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Create `.env` file:
```env
GROQ_API_KEY=gsk_your_key_here
```

Start the server:
```bash
uvicorn main:app --reload --port 8000
```

Backend runs at → `http://127.0.0.1:8000`

---

### 3. Frontend Setup

```bash
cd frontend_CRM
npm install
npm start
```

Frontend runs at → `http://localhost:3000`

---

## 📁 Project Structure

```
aivoa-crm/
│
├── backend/
│   ├── main.py          # FastAPI routes (/chat, /interactions)
│   ├── agent.py         # LangGraph agent + 5 tools
│   ├── models.py        # SQLAlchemy DB models
│   ├── database.py      # DB connection
│   ├── schemas.py       # Pydantic schemas
│   ├── .env             # GROQ_API_KEY
│   └── requirements.txt
│
└── frontend_CRM/
    └── src/
        ├── components/
        │   ├── FormPanel.js    # Left — HCP interaction form
        │   └── ChatPanel.js    # Right — AI assistant chat
        ├── store/
        │   └── index.js        # Redux slices (interaction + chat)
        ├── services/
        │   └── api.js          # FastAPI calls
        ├── App.js
        └── App.css             # Full custom design system
```

---

## 💬 Usage Examples

### Log a new interaction
```
Select: 📝 Log tool

Type: "Met Dr. Rahul Sharma today at Apollo Hospital,
       discussed Cardivex 10mg efficacy, he was very
       positive and requested 5 samples and a brochure.
       Will follow up in 2 weeks."

Result: Entire form filled automatically ✅
```

### Edit a specific field
```
Select: ✏️ Edit tool

Type: "Change the sentiment to negative and
       update the HCP name to Dr. John"

Result: Only those 2 fields update, rest unchanged ✅
```

### Fetch doctor profile
```
Select: 👤 HCP Profile tool

Type: "Dr. Priya Nair"

Result: Specialty, hospital, city, past interactions shown ✅
```

---

## 🔌 API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/health` | GET | Agent status |
| `/chat` | POST | Send message to LangGraph agent |
| `/interactions` | GET | Fetch all interactions |
| `/interactions` | POST | Save interaction to DB |
| `/interactions/{id}` | PUT | Update specific interaction |

### POST /chat
```json
{
  "message": "Met Dr. Smith, discussed Product X",
  "tool": "log_interaction",
  "interaction_id": null,
  "current_data": null
}
```

### Response
```json
{
  "tool_used": "log_interaction",
  "result": {
    "hcp": "Dr. Smith",
    "type": "Meeting",
    "date": "2026-04-29",
    "sentiment": "positive",
    "products": "Product X",
    "summary": "Met with Dr. Smith to discuss Product X efficacy.",
    "suggestions": ["Schedule follow-up in 2 weeks"]
  }
}
```

---

## 🎯 Key Design Decisions

**Why LangGraph over plain LLM calls?**
The assignment required proper tool orchestration. LangGraph allows the AI to decide which tool to invoke based on user intent, making the system extensible — you can add new tools without touching the core agent loop.

**Why Redux for state?**
The form and chat are separate components that must stay in sync. When the AI extracts data, Redux dispatches `populateForm()` which instantly reflects across the entire left panel — no prop drilling, no callbacks.

**Why Groq + Llama?**
Speed. Groq's inference is fast enough to feel real-time for field reps who need quick logging between HCP visits.

---

## 📋 Assignment Context

This project was built as part of **AI-First CRM HCP Module** .

**Requirements met:**
- [x] Split-screen layout (form left, AI chat right)
- [x] Minimum 5 LangGraph tools implemented
- [x] AI controls the form — no manual filling required
- [x] `log_interaction` tool with entity extraction
- [x] `edit_interaction` tool with partial field updates
- [x] LLM (Groq llama-3.3-70b) used throughout
- [x] Full stack: React frontend + FastAPI backend
- [x] Database persistence (SQLAlchemy)
- [x] Clean GitHub repository with README

---

## 🙏 Acknowledgements

- [LangChain](https://langchain.com) — Agent framework
- [Groq](https://groq.com) — Ultra-fast LLM inference
- [FastAPI](https://fastapi.tiangolo.com) — Modern Python API
- [Redux Toolkit](https://redux-toolkit.js.org) — State management

---

<div align="center">
</div>