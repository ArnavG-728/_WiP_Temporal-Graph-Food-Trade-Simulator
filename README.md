# Temporal Graph Food Trade Simulator

A research-grade digital twin of the global food trade system using temporal graph neural networks (TGNN).

## 🎯 Project Overview

This system models countries as nodes and food trade relationships as time-evolving edges, enabling:
- Risk analysis and vulnerability assessment
- Trade dependency modeling
- Controlled what-if scenario simulations
- Uncertainty-aware predictions

**MVP Scope**: 5 countries (India, USA, Brazil, Egypt, China) | 2018-2021 temporal data

## 🏗️ Architecture

```
├── backend/          # Python + FastAPI + Neo4j + PyTorch Geometric
├── frontend/         # Next.js + React + Cytoscape.js
├── docs/             # Project documentation
└── data/             # Raw and processed datasets
```

## 🚀 Quick Start

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
cp .env.example .env   # Configure your credentials
python -m app.main
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📊 Tech Stack

- **Backend**: FastAPI, Neo4j Aura, PyTorch Geometric, Google Gemini
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Cytoscape.js
- **Database**: Neo4j Aura (cloud-hosted graph database)
- **ML**: Temporal Graph Neural Network (TGNN)

## 📖 Documentation

See `/docs` for detailed documentation:
- `overview.md` - Project goals and architecture
- `phase-breakdown.md` - 8-phase implementation plan
- `mvp.md` - MVP specifications
- `prd.md` - Product requirements

## 🎓 Research Context

This is a final-year major project demonstrating:
- Temporal graph learning for complex systems
- Digital twin methodology
- Responsible AI with uncertainty quantification
- Decision-support (not automation)

## 📝 License

Academic/Research Project - SRM Institute of Science and Technology

## 👥 Authors

Arnav - 4th Year Major Project
