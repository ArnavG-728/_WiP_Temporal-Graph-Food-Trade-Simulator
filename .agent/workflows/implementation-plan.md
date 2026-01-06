---
description: Complete implementation plan for Temporal Graph Food Trade Simulator
---

# Implementation Plan: Temporal Graph Food Trade Simulator

## Project Overview
Building a research-grade digital twin of global food trade using temporal graph neural networks (TGNN) with 5 MVP countries: India, USA, Brazil, Egypt, China.

## Technology Stack Confirmed
- **Backend**: Python 3.12 + FastAPI + Neo4j Aura + PyTorch Geometric
- **Frontend**: Next.js (v15+) + React + D3.js/Cytoscape.js
- **Database**: Neo4j Aura (cloud-hosted graph database)
- **ML**: TGNN (Temporal Graph Neural Network) with GPU support
- **LLM**: Google Gemini API for explanations
- **Environment**: Python venv for backend isolation

## Execution Strategy
**Priority**: Real data → UI/Visualization → ML Training → Simulation → Cloud Deployment

---

## PHASE 1: Project Skeleton & Repository Setup ✅

### 1.1 Create Directory Structure
```
Temporal_Graph-v1/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── data/
│   │   │   ├── __init__.py
│   │   │   ├── raw/
│   │   │   ├── processed/
│   │   │   ├── fetcher.py
│   │   │   ├── preprocessor.py
│   │   ├── graph/
│   │   │   ├── __init__.py
│   │   │   ├── schema.py
│   │   │   ├── builder.py
│   │   │   ├── metrics.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── tgnn.py
│   │   │   ├── training.py
│   │   │   ├── evaluation.py
│   │   ├── simulation/
│   │   │   ├── __init__.py
│   │   │   ├── engine.py
│   │   │   ├── constraints.py
│   │   │   ├── validator.py
│   │   ├── explainability/
│   │   │   ├── __init__.py
│   │   │   ├── summarizer.py
│   │   │   ├── prompts.py
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── routes.py
│   │   │   ├── schemas.py
│   │   ├── utils/
│   │   │   ├── __init__.py
│   │   │   ├── logger.py
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── overview/
│   │   ├── explorer/
│   │   ├── simulator/
│   │   ├── insights/
│   ├── components/
│   │   ├── GraphVisualization.tsx
│   │   ├── CountrySelector.tsx
│   │   ├── SimulationControls.tsx
│   ├── lib/
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   └── README.md
├── data/
├── docs/
└── .gitignore
```

### 1.2 Initialize Backend (Python venv)
- Create virtual environment
- Install core dependencies: FastAPI, uvicorn, pandas, numpy
- Create basic FastAPI app with health check endpoint

### 1.3 Initialize Frontend (Next.js)
- Initialize Next.js with TypeScript and App Router
- Install core dependencies: React, D3.js/Cytoscape.js
- Create basic navigation structure

### 1.4 Version Control
- Initialize git repository
- Create .gitignore for Python, Node, and environment files
- Initial commit

**Output**: ✅ Repo exists, backend and frontend can start independently

---

## PHASE 2: Data Collection, Cleaning & Preprocessing

### 2.1 Data Source Integration
**Primary Sources**:
- FAOSTAT API (Food production, trade, supply)
- UN Comtrade API (Bilateral trade flows)

**MVP Countries**: IND, USA, BRA, EGY, CHN
**Time Range**: 2018-2021 (4 years for temporal learning)

### 2.2 Data Fetcher Module (`backend/app/data/fetcher.py`)
- Implement FAOSTAT API client
- Implement UN Comtrade API client
- Fetch production data per country
- Fetch import/export volumes
- Fetch food supply per capita
- Fetch commodity-wise trade flows
- Handle API rate limits and retries

### 2.3 Data Preprocessing (`backend/app/data/preprocessor.py`)
**Cleaning Steps**:
- Handle missing values (interpolation/forward-fill)
- Align units (tons, USD, kcal)
- Align temporal resolution (yearly)
- Normalize country codes (ISO3)
- Calculate derived metrics:
  - `import_dependency_ratio = imports / (production + imports)`
  - `export_dependency_ratio = exports / production`
  - `net_trade_balance = exports - imports`
  - `stock_to_use_ratio` (if available)

### 2.4 Node Attributes Calculation
For each country-year:
- `production_total` (million tons)
- `food_supply_per_capita` (kcal/day)
- `import_dependency_ratio`
- `export_dependency_ratio`
- `net_trade_balance`
- `climate_stress_index` (proxy: temperature anomaly data)
- `node_confidence_weight` (data completeness score)

### 2.5 Edge Attributes Calculation
For each trade relationship:
- `trade_quantity` (volume in tons)
- `trade_share` (% of importer's total imports)
- `commodity` (wheat, rice, soy, maize, etc.)
- `historical_stability` (variance over time)
- `edge_confidence_weight`

### 2.6 Output Format
Save to `backend/app/data/processed/`:
- `nodes_2018.csv`, `nodes_2019.csv`, `nodes_2020.csv`, `nodes_2021.csv`
- `edges_2018.csv`, `edges_2019.csv`, `edges_2020.csv`, `edges_2021.csv`

**Output**: ✅ Clean CSV files, time-aligned datasets, ready for graph insertion

---

## PHASE 3: Graph Storage in Neo4j Aura

### 3.1 Neo4j Aura Setup
- Create Neo4j Aura account (free tier)
- Create database instance
- Store credentials in `.env` file
- Install `neo4j` Python driver

### 3.2 Graph Schema Design (`backend/app/graph/schema.py`)
**Node Labels**:
- `Country` with properties:
  - `iso_code` (unique identifier)
  - `name`
  - `year`
  - `production_total`
  - `food_supply_per_capita`
  - `import_dependency_ratio`
  - `export_dependency_ratio`
  - `climate_stress_index`
  - `node_confidence_weight`

**Relationship Type**:
- `EXPORTS_TO` with properties:
  - `commodity`
  - `trade_quantity`
  - `trade_share`
  - `year`
  - `edge_confidence_weight`

### 3.3 Graph Builder (`backend/app/graph/builder.py`)
- Connect to Neo4j Aura
- Create constraints and indexes
- Bulk insert nodes from CSV
- Bulk insert relationships from CSV
- Create temporal snapshots (one graph per year)

### 3.4 Graph Metrics (`backend/app/graph/metrics.py`)
- Calculate centrality measures (degree, betweenness)
- Identify hub countries
- Calculate clustering coefficients
- Export graph statistics

### 3.5 API Endpoints
- `GET /graph/snapshot/{year}` - Get graph for specific year
- `GET /graph/country/{iso_code}` - Get country details
- `GET /graph/trade-partners/{iso_code}` - Get trade relationships

**Output**: ✅ Neo4j graph populated, queryable, cloud-based persistence

---

## PHASE 4: Frontend (Next.js) – Live Graph + Sliders (NO ML YET)

### 4.1 Graph Visualization Component
**Library Choice**: Cytoscape.js (best for graph networks, free, React-friendly)

**Features**:
- Interactive node-link diagram
- Node size based on production volume
- Edge thickness based on trade quantity
- Color coding for vulnerability levels
- Zoom, pan, and node selection

### 4.2 Page Structure
**1. Overview Page** (`/app/page.tsx`):
- Project description
- Global metrics dashboard
- Latest graph snapshot (2021)

**2. Data Explorer** (`/app/explorer/page.tsx`):
- Country selector dropdown
- Display country attributes in cards
- Historical trend charts (line graphs)
- Trade partner list with volumes

**3. Simulator** (`/app/simulator/page.tsx`):
- **Left Panel**: Simulation controls
  - Country selector
  - Attribute sliders:
    - Production change: -30% to +20%
    - Import dependency: 0% to +15%
    - Climate stress: 0 to 1
    - Policy restriction toggle
  - "Run Simulation" button
- **Main Panel**: Before vs After graph comparison
- **Bottom Panel**: Impact summary (placeholder for Phase 7)

**4. Insights** (`/app/insights/page.tsx`):
- Vulnerability rankings table
- Critical trade routes visualization
- Exportable reports (PDF/CSV)

### 4.3 Backend API Integration
- Create API client in `frontend/lib/api.ts`
- Implement state management (React Context or Zustand)
- Real-time graph updates on slider changes

### 4.4 Slider Interaction Logic
**Flow**:
1. User adjusts slider (e.g., India production -20%)
2. Frontend sends POST request to `/api/graph/update-attributes`
3. Backend updates Neo4j graph attributes
4. Backend re-queries graph
5. Frontend receives updated graph data
6. Cytoscape.js re-renders graph

**Output**: ✅ Interactive UI, sliders affect graph live, no simulation yet

---

## PHASE 5: Temporal Graph Model Training (TGNN)

### 5.1 TGNN Architecture (`backend/app/models/tgnn.py`)
**Model Choice**: Temporal Graph Convolutional Network (TGCN) with attention

**Architecture**:
- Input: Graph snapshots [t-2, t-1, t]
- Temporal encoder: GRU/LSTM for time-series
- Graph convolution: GCN layers for spatial dependencies
- Output: Node embeddings → vulnerability scores, trade predictions

**Libraries**:
- PyTorch Geometric (torch_geometric)
- PyTorch (torch)

### 5.2 Data Preparation
- Convert Neo4j graphs to PyTorch Geometric format
- Create temporal sequences (sliding window)
- Split data: Train (2018-2019), Val (2020), Test (2021)

### 5.3 Training Pipeline (`backend/app/models/training.py`)
**Loss Functions**:
- Node-level: MSE for vulnerability scores
- Edge-level: Binary cross-entropy for trade disruption probability

**Training Loop**:
- Epochs: 100-200
- Optimizer: Adam
- Learning rate: 0.001 with scheduler
- Early stopping on validation loss

### 5.4 Evaluation (`backend/app/models/evaluation.py`)
**Metrics**:
- Node prediction: MAE, RMSE
- Edge prediction: Precision, Recall, F1
- Graph-level: Structural similarity

### 5.5 Model Checkpointing
- Save best model to `backend/app/models/checkpoints/`
- Version control for model iterations

**Output**: ✅ Trained TGNN model, learned weights, saved checkpoint

---

## PHASE 6: Simulation Engine (Before vs After)

### 6.1 Simulation Engine (`backend/app/simulation/engine.py`)
**Core Logic**:
1. Load current graph state from Neo4j
2. Apply user-defined perturbations (bounded)
3. Run TGNN inference on modified graph
4. Predict new graph state (node vulnerabilities, edge changes)
5. Return before/after comparison

### 6.2 Constraint Validator (`backend/app/simulation/constraints.py`)
**Validation Rules**:
- Production change: -50% to +30% (realistic bounds)
- Import dependency: 0% to +20%
- Climate stress: 0 to 1
- Policy restrictions: binary (ON/OFF)

### 6.3 Simulation Validator (`backend/app/simulation/validator.py`)
**Checks**:
- Structural stability (graph doesn't collapse)
- Historical plausibility (compare with past patterns)
- Confidence scoring (flag low-confidence predictions)

### 6.4 API Endpoints
- `POST /simulation/run` - Execute simulation
  - Request body: country, attribute changes
  - Response: before/after graph, changed routes, vulnerability shifts

### 6.5 Frontend Integration
- Update Simulator page to call `/simulation/run`
- Display before/after graphs side-by-side
- Highlight changed edges in different color
- Show vulnerability score changes

**Output**: ✅ True simulation, predictive behavior, graph evolution shown

---

## PHASE 7: Impact Classification + LLM Summarization

### 7.1 Impact Classifier
**Logic** (`backend/app/explainability/summarizer.py`):
- Calculate impact scores per country (delta in vulnerability)
- Classify countries:
  - High impact: Δvulnerability > 0.3
  - Medium impact: 0.1 < Δvulnerability ≤ 0.3
  - Low impact: Δvulnerability ≤ 0.1

### 7.2 LLM Integration (Google Gemini)
**Prompt Engineering** (`backend/app/explainability/prompts.py`):
```
You are an expert in global food trade analysis. Given the following simulation results:

Before State:
- [Country]: vulnerability = X, production = Y
After State:
- [Country]: vulnerability = X', production = Y'

High Impact Countries: [list]
Medium Impact Countries: [list]
Low Impact Countries: [list]

Provide a concise explanation (max 150 words) covering:
1. Observed changes
2. Possible causes
3. Uncertainty and limitations

Do NOT make policy recommendations.
```

### 7.3 API Endpoint
- `POST /explanation/generate` - Generate LLM summary
  - Input: Simulation results
  - Output: Structured explanation with uncertainty disclosure

### 7.4 Frontend Display
- Add explanation panel to Simulator page
- Display impact classification with color coding
- Show LLM-generated summary with disclaimer

**Output**: ✅ Human-readable explanation, low API cost, safe output

---

## PHASE 8: Full Cloud Migration

### 8.1 Backend Deployment
**Platform**: Google Cloud Run (or AWS ECS)
- Dockerize FastAPI backend
- Set up environment variables
- Deploy to Cloud Run
- Configure auto-scaling

### 8.2 Frontend Deployment
**Platform**: Vercel (Next.js native)
- Connect GitHub repository
- Configure environment variables (API URL)
- Deploy with automatic CI/CD

### 8.3 Database
- Neo4j Aura already cloud-hosted ✅

### 8.4 Model Storage
- Upload trained TGNN to Google Cloud Storage / AWS S3
- Load model from cloud in backend

### 8.5 Domain & SSL
- Configure custom domain (optional)
- Enable HTTPS

**Output**: ✅ Fully cloud-hosted system, public demo URL, scalable architecture

---

## Development Workflow

### Phase Execution Order (Based on Your Priority)
1. **Phase 1**: Skeleton setup (1 day)
2. **Phase 2**: Real data fetching & preprocessing (2-3 days)
3. **Phase 3**: Neo4j graph storage (1-2 days)
4. **Phase 4**: Frontend UI + visualization (3-4 days)
5. **Phase 5**: TGNN training (2-3 days)
6. **Phase 6**: Simulation engine (2 days)
7. **Phase 7**: LLM explanations (1 day)
8. **Phase 8**: Cloud deployment (1-2 days)

**Total Estimated Time**: 13-18 days

---

## Next Steps
1. Start with Phase 1: Create directory structure
2. Set up Python venv and install dependencies
3. Initialize Next.js frontend
4. Verify both can run independently
5. Proceed to Phase 2: Data fetching

**Ready to begin? Let's start with Phase 1!** 🚀
