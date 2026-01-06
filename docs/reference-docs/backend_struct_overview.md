# Backend Architecture & Technical Documentation

## 4.1 Backend Overview

The backend is a modular analytical pipeline responsible for:

Data ingestion

Graph construction

Temporal learning

Simulation execution

Result explanation

## 4.2 Tech Stack
### Core Language

Python

### Data Processing

Pandas

NumPy

### Graph Storage

Neo4j (Graph Database)

### Graph Analytics

NetworkX

### Machine Learning

PyTorch

PyTorch Geometric

### Simulation Engine

Custom Python modules

### LLM Integration

Transformer-based API (explanation only)

### Backend API

FastAPI

## 4.3 Backend Folder Structure
backend/
│
├── data/
│   ├── raw/
│   ├── processed/
│
├── graph/
│   ├── schema.py
│   ├── builder.py
│   ├── metrics.py
│
├── models/
│   ├── tgnn.py
│   ├── training.py
│   ├── evaluation.py
│
├── simulation/
│   ├── engine.py
│   ├── constraints.py
│   ├── validator.py
│
├── explainability/
│   ├── summarizer.py
│   ├── prompts.py
│
├── api/
│   ├── routes.py
│   ├── schemas.py
│
├── utils/
│   ├── config.py
│   ├── logging.py
│
└── main.py

## 4.4 Backend Responsibilities
### Graph Layer

Build temporal graphs

Attach node & edge attributes

Maintain confidence weights

### ML Layer

Train TGNN models

Generate probabilistic outputs

Compute sensitivity metrics

### Simulation Layer

Apply bounded perturbations

Re-run inference

Track before/after states

### Explainability Layer

Convert numerical outputs to text

Enforce uncertainty disclosure

Prevent hallucinated conclusions

## 4.5 Security & Ethics

No automated decision-making

Human-in-the-loop design

Clear limitation disclosures