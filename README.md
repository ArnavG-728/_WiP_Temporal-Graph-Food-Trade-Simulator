# Temporal Graph Food Trade Simulator

A research-grade digital twin of the global food trade system using temporal graph neural networks (TGNN).

## 🎯 Project Overview

This system models countries as nodes and food trade relationships as time-evolving edges, enabling:
- Risk analysis and vulnerability assessment
- Trade dependency modeling
- Controlled what-if scenario simulations
- Uncertainty-aware predictions

**MVP Scope**: 5 countries (India, USA, Brazil, Egypt, China) | 2018-2021 temporal data

---

## 📁 Project Structure

```
Temporal_Graph-v1/
├── backend/                    # Python + FastAPI + Neo4j
│   ├── app/
│   │   ├── data/
│   │   │   ├── raw/bulk/      # ✅ Raw FAOSTAT data (4 large CSV files)
│   │   │   └── processed/     # ✅ Preprocessed nodes & edges by year
│   │   ├── graph/             # Neo4j graph operations
│   │   ├── api/               # FastAPI routes
│   │   └── main.py            # FastAPI application
│   ├── requirements.txt
│   └── .env                   # Neo4j credentials (configure this!)
├── frontend/                   # Next.js + React
│   ├── app/                   # Next.js pages
│   ├── components/            # React components
│   └── package.json
├── import_to_neo4j_standalone.py  # 🔑 Neo4j data ingestion script
├── run_pipeline.py            # Data preprocessing pipeline
└── docs/                      # Project documentation
```

---

## 🚀 Quick Start Guide

### ✅ Current Status Check

You have:
- ✅ Raw bulk data in `backend/app/data/raw/bulk/` (4 CSV files, ~11GB)
- ✅ Processed data in `backend/app/data/processed/` (nodes & edges by year)
- ✅ Frontend running on port 3000

### 🔄 Next Steps: Complete Setup

---

## Step 1: Configure Neo4j Database

### Option A: Use Neo4j Aura (Recommended - Cloud)

1. **Create Neo4j Aura Account**
   - Go to: https://neo4j.com/cloud/aura/
   - Sign up for free tier
   - Create a new database instance

2. **Save Credentials**
   - Copy the connection URI (e.g., `neo4j+s://xxxxx.databases.neo4j.io`)
   - Copy the password (save it securely!)

3. **Update `.env` file**
   ```bash
   cd backend
   # Edit .env file with your credentials
   ```
   
   Add these lines:
   ```env
   NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=your-password-here
   ```

### Option B: Use Local Neo4j Desktop

1. Download Neo4j Desktop: https://neo4j.com/download/
2. Create a new database
3. Start the database
4. Update `.env`:
   ```env
   NEO4J_URI=bolt://localhost:7687
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=your-password
   ```

---

## Step 2: Verify Data Preprocessing (Already Done ✅)

Your data is already preprocessed! Check:

```bash
cd backend/app/data/processed

# You should see:
# nodes_2018.csv, nodes_2019.csv, nodes_2020.csv, nodes_2021.csv
# edges_2018.csv, edges_2019.csv, edges_2020.csv, edges_2021.csv
```

**If you need to re-preprocess** (only if data is missing):
```bash
cd Temporal_Graph-v1
python run_pipeline.py
```

---

## Step 3: Import Data to Neo4j 🔑

**This is the critical step to populate your graph database!**

### Check Neo4j Connection First

```bash
cd backend
venv\Scripts\activate  # Activate virtual environment

# Test connection
python -c "from neo4j import GraphDatabase; driver = GraphDatabase.driver('YOUR_URI', auth=('neo4j', 'YOUR_PASSWORD')); driver.verify_connectivity(); print('✅ Connected!')"
```

### Run Data Import

```bash
# From project root directory
python import_to_neo4j_standalone.py
```

**Expected Output**:
```
✅ Connected to Neo4j
✅ Created schema (constraints and indexes)
✅ Imported 200 nodes (5 countries × 4 years × 10 commodities)
✅ Imported 3,360 edges (trade relationships)
✅ Graph database ready!
```

**Troubleshooting**:
- **Connection Error**: Check `.env` credentials
- **Authentication Failed**: Verify password
- **Timeout**: Check internet connection (for Aura) or local database status

---

## Step 4: Start Backend API

```bash
cd backend
venv\Scripts\activate

# Start FastAPI server
python -m uvicorn app.main:app --reload --port 8000
```

**Expected Output**:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

**Test API**:
- Open browser: http://localhost:8000/docs
- You should see Swagger API documentation
- Try endpoint: `GET /api/graph/snapshot/2021`

---

## Step 5: Start Frontend (Already Running ✅)

Your frontend is already running! If you need to restart:

```bash
cd frontend
npm run dev
```

**Access Application**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 🎯 Verify Everything Works

### Test 1: Check Neo4j Data

Open Neo4j Browser (Aura console or Desktop) and run:

```cypher
// Count nodes
MATCH (c:Country) RETURN count(c) AS total_nodes

// Should return: 200 (5 countries × 4 years × 10 commodities)

// Count edges
MATCH ()-[r:EXPORTS_TO]->() RETURN count(r) AS total_edges

// Should return: ~3,360

// View sample data
MATCH (c:Country {year: 2021}) RETURN c LIMIT 5
```

### Test 2: Check Backend API

```bash
# Test graph snapshot endpoint
curl http://localhost:8000/api/graph/snapshot/2021

# Should return JSON with nodes and edges
```

### Test 3: Check Frontend

1. Open http://localhost:3000
2. You should see:
   - Overview page with graph visualization
   - Explorer tab with country selector
   - Simulator tab with sliders
   - Insights tab with rankings

---

## 🔧 Common Issues & Solutions

### Issue 1: "No module named 'app'"
**Solution**: Make sure you're in the `backend` directory and virtual environment is activated
```bash
cd backend
venv\Scripts\activate
python -m uvicorn app.main:app --reload --port 8000
```

### Issue 2: "Neo4j connection failed"
**Solution**: 
1. Check `.env` file has correct credentials
2. For Aura: Ensure URI starts with `neo4j+s://`
3. For local: Ensure database is running

### Issue 3: "Port 8000 already in use"
**Solution**: 
```bash
# Find and kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID_NUMBER> /F

# Or use different port
python -m uvicorn app.main:app --reload --port 8001
```

### Issue 4: "Frontend shows no data"
**Solution**:
1. Check backend is running on port 8000
2. Check Neo4j has data (run Cypher queries above)
3. Check browser console for errors (F12)
4. Verify API endpoint: http://localhost:8000/api/graph/snapshot/2021

### Issue 5: "Import script fails"
**Solution**:
1. Check processed data exists: `backend/app/data/processed/`
2. Verify Neo4j connection
3. Check Neo4j has enough memory (free tier: 1GB limit)
4. Try importing one year at a time (modify script)

---

## 📊 Tech Stack

- **Backend**: FastAPI, Neo4j Aura, PyTorch Geometric, Google Gemini
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Cytoscape.js
- **Database**: Neo4j Aura (cloud-hosted graph database)
- **ML**: Temporal Graph Neural Network (TGNN)

---

## 📖 Documentation

### Quick Reference
- **Project Docs**: `project_docs/research_project_requirements/README.md`
- **Architecture**: `project_docs/research_project_requirements/07_architecture_document.md`
- **API Docs**: http://localhost:8000/docs (when backend is running)

### Detailed Documentation
See `docs/` and `project_docs/` for:
- `overview.md` - Project goals and architecture
- `phase-breakdown.md` - 8-phase implementation plan
- `mvp.md` - MVP specifications
- Research project requirements (10 comprehensive documents)

---

## 🎓 Research Context

This is a final-year major project demonstrating:
- Temporal graph learning for complex systems
- Digital twin methodology
- Responsible AI with uncertainty quantification
- Decision-support (not automation)

---

## 🚦 Current Project Status

| Component | Status | Notes |
|-----------|--------|-------|
| Raw Data | ✅ Complete | 4 CSV files in `backend/app/data/raw/bulk/` |
| Preprocessed Data | ✅ Complete | Nodes & edges by year in `processed/` |
| Neo4j Database | ⚠️ **Action Required** | Run `import_to_neo4j_standalone.py` |
| Backend API | ⏳ Ready to Start | Run `uvicorn app.main:app --reload` |
| Frontend | ✅ Running | Already on port 3000 |
| TGNN Model | 🔄 In Progress | Training in Sprint 3 |

---

## 🎯 Next Actions (Priority Order)

1. **Configure Neo4j** (15 minutes)
   - Create Aura account or install Desktop
   - Update `.env` with credentials

2. **Import Data to Neo4j** (5 minutes)
   - Run: `python import_to_neo4j_standalone.py`
   - Verify with Cypher queries

3. **Start Backend** (2 minutes)
   - Run: `python -m uvicorn app.main:app --reload --port 8000`
   - Test: http://localhost:8000/docs

4. **Test Full Stack** (5 minutes)
   - Frontend: http://localhost:3000
   - Check graph visualization loads
   - Try Explorer and Simulator tabs

5. **Continue Development**
   - Implement TGNN model (Sprint 3)
   - Add simulation engine (Sprint 3)
   - Integrate LLM explanations (Sprint 4)

---

## 📝 Development Workflow

### Daily Development
```bash
# Terminal 1: Backend
cd backend
venv\Scripts\activate
python -m uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend (already running)
cd frontend
npm run dev
```

### Making Changes
1. **Backend changes**: Auto-reload with `--reload` flag
2. **Frontend changes**: Auto-refresh in browser
3. **Database changes**: Re-run import script if schema changes

---

## 📞 Need Help?

- **API Issues**: Check http://localhost:8000/docs for endpoint documentation
- **Neo4j Issues**: Check Neo4j Browser for data verification
- **Frontend Issues**: Check browser console (F12) for errors
- **Documentation**: See `project_docs/research_project_requirements/`

---

## 📝 License

Academic/Research Project - SRM Institute of Science and Technology

## 👥 Authors

Arnav - 4th Year Major Project

---

**Last Updated**: January 2026  
**Current Phase**: Sprint 3 (TGNN Development)  
**Next Milestone**: Complete Neo4j import and start backend API
