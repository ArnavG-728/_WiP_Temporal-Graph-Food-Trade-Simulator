PHASE 1: Project Skeleton & Repository Setup
What You Do

Create separate directories for backend and frontend

Set up basic tooling and environment

Structure
project-root/
│
├── backend/
│   ├── app/
│   ├── requirements.txt
│   └── README.md
│
├── frontend/
│   ├── app/        # Next.js App Router
│   ├── package.json
│   └── README.md
│
└── docs/
│
└── project_docs/
│
└── data/

Tech Used

Backend: Python + FastAPI

Frontend: Next.js

Version control: GitHub

Output of Phase 1

✅ Repo exists
✅ Backend and frontend can start independently
✅ No ML, no graphs yet

Purpose: Clean foundation, no complexity.

PHASE 2: Data Collection, Cleaning & Preprocessing
What You Do

Collect food trade and production data from multiple sources

Normalize everything into clean tables

Example Sources

Food production per country

Import/export volumes

Food supply per capita

Commodity-wise trade

Key Actions

Handle missing values

Align units (tons, USD, kcal)

Align time (yearly)

Output Format (Example)
country, year, production_total, food_supply_pc
IND, 2020, 310, 2400
USA, 2020, 420, 3500

Output of Phase 2

✅ Clean CSV / DataFrames
✅ Time-aligned datasets
✅ Ready for graph insertion

Purpose: ML and graphs are useless without clean data.

PHASE 3: Graph Storage in Neo4j Aura
What You Do

Convert cleaned data into graph format

Store everything in Neo4j Aura (cloud-hosted)

Graph Design

Nodes → Countries

Edges → Trade relationships

Example
(IND)-[:EXPORTS {commodity:"wheat", volume:2.1}]->(EGY)

Node Attributes

production_total

food_supply_per_capita

import_dependency_ratio

climate_stress_index

year

Edge Attributes

commodity

trade_quantity

trade_share

Output of Phase 3

✅ Neo4j graph populated
✅ Queryable graph
✅ Cloud-based persistence

Purpose: Graph becomes the single source of truth.

PHASE 4: Frontend (Next.js) – Live Graph + Sliders (NO ML YET)
What You Do

You now build a fully working frontend before any TGNN.

Frontend Features

Country selector

Sliders for attributes:

Production total

Food supply per capita

Import dependency

Live graph visualization

Example Interaction

Slider: India production −20%

Slider: USA food supply +10%

Graph updates immediately:

Node sizes change

Edge thickness updates

Backend Role

Receives slider changes

Updates graph attributes in Neo4j

Re-queries graph

Sends updated state to frontend

Output of Phase 4

✅ Interactive UI
✅ Sliders affect graph live
✅ No simulation yet, only visualization

Purpose: Prove end-to-end system works before ML.

PHASE 5: Temporal Graph Model Training (TGNN / TGCN)
What You Do

Now you freeze the UI and focus on intelligence.

Input to Model

Graph snapshots over time

Node attributes over years

Edge attributes over years

Model Choice

TGCN (simpler to start)

Upgrade to TGNN if time permits

What the Model Learns

How changes propagate

Which countries are sensitive

Which edges are critical

Output of Phase 5

✅ Trained temporal graph model
✅ Learned weights
✅ Saved model checkpoint

Purpose: Teach the system how the graph evolves.

PHASE 6: Simulation Engine (Before vs After)
What You Do

You now connect Phase 4 UI + Phase 5 model.

Example Simulation

User sets:

India wheat production = −50%

System:

Takes current graph

Applies change

Runs TGNN inference

Predicts new graph state

Outputs

Before graph

After graph

Changed trade routes

Updated node risks

Output of Phase 6

✅ True simulation
✅ Predictive behavior
✅ Graph evolution shown

This is where your project truly becomes a “digital twin”.

PHASE 7: Impact Classification + LLM Summarization (Lightweight)
What You Do

You do NOT send raw graph to LLM.

Instead:

Backend computes impact scores

Classifies countries into:

High impact

Medium impact

Low / no impact

Only summary stats go to LLM

LLM Usage (LangChain)

Very short prompts

Structured output

Low token usage

Example Output
High Impact: Egypt, Bangladesh
Medium Impact: China
Low Impact: USA, Brazil

Output of Phase 7

✅ Human-readable explanation
✅ Low API cost
✅ Safe, interpretable output

Purpose: Insight, not hallucination.

PHASE 8: Full Cloud Migration
What You Do

Move everything to cloud.

Recommended Stack

Backend: FastAPI on GCP Cloud Run / AWS ECS

Frontend: Next.js on Vercel

Database: Neo4j Aura

Model storage: Cloud Storage / S3

Output of Phase 8

✅ Fully cloud-hosted system
✅ Public demo URL
✅ Scalable architecture

Purpose: Production-style deployment (future-ready).