# Temporal Graph Food Trade Simulator - Backend

## Overview
Backend API for the Temporal Graph Food Trade Simulator, built with FastAPI, Neo4j, and PyTorch Geometric.

## Setup

### 1. Create Virtual Environment
```bash
python -m venv venv
```

### 2. Activate Virtual Environment
**Windows:**
```bash
venv\Scripts\activate
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
```bash
copy .env.example .env
# Edit .env with your actual credentials
```

### 5. Run the Application
```bash
python -m app.main
```

Or with uvicorn:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Documentation
Once running, visit:
- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

## Project Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration management
│   ├── data/                # Data fetching & preprocessing
│   ├── graph/               # Neo4j graph operations
│   ├── models/              # TGNN models
│   ├── simulation/          # Simulation engine
│   ├── explainability/      # LLM explanations
│   ├── api/                 # API routes
│   └── utils/               # Utilities
├── requirements.txt
├── .env.example
└── README.md
```

## Development
- Python 3.12+
- FastAPI for REST API
- Neo4j Aura for graph storage
- PyTorch Geometric for TGNN
