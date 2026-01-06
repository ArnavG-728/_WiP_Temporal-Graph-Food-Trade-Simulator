#MVP DOCUMENT
Temporal Graph Learning–Based Food Trade Simulator (5-Country Prototype)
1. Purpose of This MVP

The goal of this MVP is to demonstrate a fully functional, reduced-scale version of the proposed system using only 5 countries, while preserving:

Graph-based modeling

Temporal learning (TGNN/TGCN)

A simulation engine

A frontend with sliders for attribute manipulation

Observable trade-route changes and vulnerability shifts

This MVP proves that:

the architecture, learning approach, and simulation logic are valid and extensible to global scale.

2. Countries Included in the MVP

We deliberately select structurally different countries to show meaningful dynamics.

Country	ISO	Role in Graph
India	IND	Large producer, mixed importer/exporter
USA	USA	Major exporter, global hub
Brazil	BRA	Agricultural exporter
Egypt	EGY	Import-dependent
China	CHN	High demand, mixed trade

Total nodes: 5
Total edges (initial): 10–12 directed trade links

3. Graph Representation (MVP Scale)

At each year 
𝑡
t:

𝐺
𝑡
=
(
𝑉
,
𝐸
,
𝑋
𝑡
,
𝐴
𝑡
)
G
t
	​

=(V,E,X
t
	​

,A
t
	​

)

V = 5 nodes (countries)

E = directed food trade links

Xₜ = node attributes

Aₜ = edge attributes

We store yearly snapshots:

Graph_2018 → Graph_2019 → Graph_2020 → Graph_2021

4. Node Attributes Used in MVP (Reduced but Meaningful)

For MVP, we intentionally limit attributes while covering all categories.

4.1 Core Food System Attributes (Used)
Attribute	Example (IND)
production_total	310 (million tons)
food_supply_per_capita	2400 kcal
stock_to_use_ratio	0.28
yield_index	0.72
4.2 Trade Dependency Attributes (Used)
Attribute	Example (EGY)
import_dependency_ratio	0.62
export_dependency_ratio	0.04
net_trade_balance	−18
top_partner_dependency	0.41
4.3 Risk & Stress Indicators (Used)
Attribute	Example
climate_stress_index	0.6
policy_restriction_flag	0 / 1
price_volatility_index	0.3–0.7
4.4 Confidence Attribute (Critical)
Attribute	Meaning
node_confidence_weight	Data reliability (0–1)
5. Edge Representation (Trade Routes in MVP)

Each edge:

Exporter → Importer

5.1 Example Trade Edges
Exporter	Importer	Commodity	Quantity
USA	EGY	Wheat	6.2
BRA	CHN	Soy	14.5
IND	EGY	Rice	2.1
USA	IND	Maize	3.4
CHN	IND	Processed food	1.8
5.2 Edge Attributes Used
Attribute	Meaning
trade_quantity	Volume
trade_share	% of importer imports
historical_stability	Variance over time
edge_confidence_weight	Reliability
6. Temporal Learning Model (TGNN / TGCN)
6.1 Model Choice (MVP)

For MVP:

TGCN or TGNN-lite

Historical window: last 3 years

6.2 Model Input

At time 
𝑡
t:

Node feature matrix Xₜ → shape: (5 × F)

Edge feature matrix Aₜ

Adjacency matrix E

Time window: 
[
𝑡
−
2
,
𝑡
−
1
,
𝑡
]
[t−2,t−1,t]

6.3 Learning Targets (MVP)

We do not predict exact trade numbers.

Node-Level Targets
Target	Meaning
vulnerability_score	Risk of shortage
food_supply_change	↑ / ↓ trend
Edge-Level Targets
Target	Meaning
trade_volume_shift	+ / −
disruption_probability	Risk
7. Simulation Engine (Core MVP Feature)
7.1 What the Simulator Does

The simulator:

Takes user-modified node attributes

Applies bounded changes

Re-runs TGNN inference

Updates:

trade routes

vulnerability scores

global metrics

8. Frontend – Simulator Tab (IMPORTANT)
8.1 Simulator UI Controls (Sliders)

For each simulation run, frontend provides sliders:

Node Attribute Sliders

Production change (%): −30% → +20%

Import dependency (%): +0 → +15%

Climate stress index: 0 → 1

Policy restriction: ON / OFF

Example:

[ Country: India ]
Production ↓ 15%
Climate Stress ↑ 0.3
Export Restriction: ON

8.2 Simulator Flow (Frontend)

User selects country

Adjusts sliders

Clicks Run Simulation

System shows:

Before vs After graph

Route changes

Vulnerability shifts

Explanation text

9. Example Simulation Scenario (MVP Walkthrough)
Scenario

India production drops by 20% + export restriction applied

Step 1: Before State

India exports rice to Egypt

Egypt dependency on India: 28%

Vulnerability (EGY): Medium

Step 2: Simulation Engine Actions

Reduce IND production_total

Disable IND → EGY rice export

TGNN re-evaluates trade redistribution

Step 3: After State (Predicted)
Change	Result
EGY rice imports	Shift to USA & BRA
Trade cost	↑
EGY vulnerability	Medium → High
Global stability	Slight decline
Step 4: Explanation Output (LLM)

Observed Impact

Trade rerouting from India to USA

Increased dependency concentration

Risk Interpretation

Egypt becomes more vulnerable due to reduced diversification

Uncertainty

Medium confidence due to limited historical analogs

10. What This MVP Technically Proves

This MVP proves that:

✔ A temporal graph can model food trade
✔ TGNN/TGCN captures dependency evolution
✔ Local shocks propagate globally
✔ Trade routes adapt dynamically
✔ Sliders → graph → model → simulation works end-to-end

11. What This MVP Is NOT

Not global-scale

Not real-time

Not causal inference

Not policy automation

This is exactly acceptable for a final-year MVP.

12. How This Scales to Full Project
MVP Component	Full System
5 countries	200+ countries
Yearly data	Higher resolution
TGCN-lite	Full TGNN
Basic UI	Advanced dashboard
13. One-Line MVP Description (Use This)

“This MVP demonstrates a temporal graph-based food trade simulator using five countries, where user-controlled shocks dynamically alter trade routes and vulnerability outcomes through learned graph dependencies.”