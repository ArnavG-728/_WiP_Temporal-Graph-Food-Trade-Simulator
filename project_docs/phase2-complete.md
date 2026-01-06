# Phase 2: Data Collection & Preprocessing - Complete! ✅

## Overview
Phase 2 implements a complete data pipeline for fetching, cleaning, and preprocessing food trade data for the 5 MVP countries (India, USA, Brazil, Egypt, China) across 2018-2021.

## Files Created

### 1. `app/data/fetcher.py` (350+ lines)
**Purpose**: Fetch real data from FAOSTAT and UN Comtrade APIs

**Features**:
- `FAOSTATFetcher`: Production, trade, and food supply data
- `ComtradeFetcher`: Bilateral trade flows
- Rate limiting and error handling
- CSV export to `raw/` directory

**Data Sources**:
- FAOSTAT API: https://fenixservices.fao.org/faostat/api/v1/en/data
- UN Comtrade API: https://comtradeapi.un.org/

**Usage**:
```python
from app.data.fetcher import DataFetcher
fetcher = DataFetcher()
data = fetcher.fetch_all_mvp_data()
```

### 2. `app/data/preprocessor.py` (400+ lines)
**Purpose**: Clean raw data and calculate node/edge attributes

**Features**:
- Data cleaning (missing values, outliers, normalization)
- Node attribute calculation (13 attributes per country-year)
- Edge attribute calculation (bilateral trade relationships)
- CSV export to `processed/` directory by year

**Node Attributes Calculated**:
1. `iso_code` - Country code (IND, USA, BRA, EGY, CHN)
2. `name` - Country name
3. `year` - Year (2018-2021)
4. `production_total` - Total production (million tons)
5. `food_supply_per_capita` - Food supply (kcal/day)
6. `import_dependency_ratio` - Imports / (Production + Imports)
7. `export_dependency_ratio` - Exports / Production
8. `net_trade_balance` - Exports - Imports (million tons)
9. `stock_to_use_ratio` - Stock levels
10. `yield_index` - Normalized yield (0-1)
11. `climate_stress_index` - Climate stress proxy (0-1)
12. `policy_restriction_flag` - Export restrictions (0/1)
13. `price_volatility_index` - Price volatility (0-1)
14. `node_confidence_weight` - Data quality score (0-1)

**Edge Attributes Calculated**:
1. `exporter` - Exporting country ISO3
2. `importer` - Importing country ISO3
3. `commodity` - Commodity type (wheat, rice, soy, maize, etc.)
4. `year` - Year
5. `trade_quantity` - Trade volume (million tons)
6. `trade_share` - % of importer's total imports
7. `historical_stability` - Variance over time
8. `edge_confidence_weight` - Data reliability (0-1)

**Usage**:
```python
from app.data.preprocessor import DataPreprocessor
preprocessor = DataPreprocessor()
nodes_df, edges_df = preprocessor.process_all()
```

### 3. `app/data/synthetic.py` (250+ lines)
**Purpose**: Generate realistic synthetic data when APIs are unavailable

**Features**:
- Realistic base values for each country
- Year-to-year variation
- Major trade relationships based on real-world patterns
- Fallback for testing and development

**Trade Patterns Included**:
- USA → Egypt (wheat)
- USA → China (soybeans)
- Brazil → China (soybeans)
- India → Egypt (rice)
- And 8 more bilateral relationships

**Usage**:
```python
from app.data.synthetic import SyntheticDataGenerator
generator = SyntheticDataGenerator()
data = generator.generate_all()
```

### 4. `run_data_pipeline.py` (200+ lines)
**Purpose**: Main orchestrator for the complete data pipeline

**Features**:
- Automatic fallback to synthetic data if APIs fail
- Data validation with 7 checks
- Progress logging
- Command-line interface

**Usage**:
```bash
# Use synthetic data (recommended for testing)
python run_data_pipeline.py --synthetic

# Fetch real data from APIs
python run_data_pipeline.py

# Use existing raw data (skip fetch)
python run_data_pipeline.py --skip-fetch
```

## Data Pipeline Flow

```
┌─────────────────────────────────────────────────────────┐
│ Step 1: Data Fetching/Generation                        │
├─────────────────────────────────────────────────────────┤
│ Option A: Real Data                                     │
│   - FAOSTAT API → Production, Trade, Food Supply        │
│   - UN Comtrade API → Bilateral Trade Flows             │
│                                                          │
│ Option B: Synthetic Data (Fallback)                     │
│   - Generate realistic data for 5 countries, 4 years    │
│                                                          │
│ Output: CSV files in app/data/raw/                      │
│   - production.csv                                       │
│   - trade.csv                                            │
│   - food_supply.csv                                      │
│   - bilateral_trade.csv                                  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Step 2: Data Preprocessing                              │
├─────────────────────────────────────────────────────────┤
│ 1. Load raw CSV files                                   │
│ 2. Clean data:                                          │
│    - Standardize column names                           │
│    - Normalize country codes                            │
│    - Handle missing values (forward-fill)               │
│    - Remove outliers (3σ rule)                          │
│ 3. Calculate node attributes (14 per country-year)      │
│ 4. Calculate edge attributes (8 per trade relationship) │
│ 5. Compute derived metrics:                             │
│    - Import/export dependency ratios                    │
│    - Net trade balance                                  │
│    - Trade shares                                       │
│    - Confidence weights                                 │
│                                                          │
│ Output: CSV files in app/data/processed/                │
│   - nodes_2018.csv, nodes_2019.csv, ...                 │
│   - edges_2018.csv, edges_2019.csv, ...                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Step 3: Data Validation                                 │
├─────────────────────────────────────────────────────────┤
│ ✅ Check 1: Node count (expected: 20 = 5×4)             │
│ ✅ Check 2: Required node attributes present            │
│ ✅ Check 3: No null values in critical fields           │
│ ✅ Check 4: Edge count > 0                              │
│ ✅ Check 5: Required edge attributes present            │
│ ✅ Check 6: Production values ≥ 0                       │
│ ✅ Check 7: Dependency ratios in [0,1]                  │
│                                                          │
│ Output: Validation report                               │
└─────────────────────────────────────────────────────────┘
```

## Expected Output

### Nodes (20 total)
```csv
iso_code,name,year,production_total,food_supply_per_capita,import_dependency_ratio,...
IND,India,2018,310.5,2400,0.15,...
IND,India,2019,315.2,2410,0.14,...
IND,India,2020,308.7,2395,0.16,...
IND,India,2021,320.1,2420,0.15,...
USA,United States,2018,420.3,3500,0.05,...
...
```

### Edges (~48 per year = 192 total)
```csv
exporter,importer,commodity,year,trade_quantity,trade_share,...
USA,EGY,wheat,2018,6.2,0.28,...
BRA,CHN,soybeans,2018,14.5,0.42,...
IND,EGY,rice,2018,2.1,0.15,...
...
```

## Running Phase 2

### Quick Start (Recommended)
```bash
cd backend

# Activate virtual environment
venv\Scripts\activate

# Run with synthetic data (fastest, no API keys needed)
python run_data_pipeline.py --synthetic
```

### With Real Data
```bash
# 1. Add API keys to .env file
NEO4J_URI=...
FAOSTAT_API_KEY=...  # Optional
COMTRADE_API_KEY=... # Optional
GEMINI_API_KEY=...

# 2. Run pipeline
python run_data_pipeline.py
```

### Expected Output
```
============================================================
PHASE 2: DATA COLLECTION & PREPROCESSING PIPELINE
============================================================

[Step 1/3] Generating synthetic data...
INFO - Generating synthetic production data...
INFO - Generated 20 production records
INFO - Generating synthetic trade data...
INFO - Generated 40 trade records
INFO - Generating synthetic food supply data...
INFO - Generated 20 food supply records
INFO - Generating synthetic bilateral trade data...
INFO - Generated 48 bilateral trade records

[Step 2/3] Preprocessing data...
INFO - Loading raw data files...
INFO - Cleaning production data...
INFO - Calculating node attributes...
INFO - Calculated attributes for 20 nodes
INFO - Calculating edge attributes...
INFO - Calculated attributes for 192 edges
INFO - Saved 5 nodes to .../processed/nodes_2018.csv
...

[Step 3/3] Validating processed data...
✅ Node count: 20 (expected 20)
✅ All required node attributes present
✅ No null values in critical fields
✅ Edge count: 192
✅ All required edge attributes present
✅ Production values are non-negative
✅ Import dependency ratios in valid range [0,1]

Validation Summary:
  Checks Passed: 7
  Checks Failed: 0

============================================================
✅ PHASE 2 COMPLETE!
============================================================

Data Summary:
  - Countries: 5 (IND, USA, BRA, EGY, CHN)
  - Years: 4 (2018-2021)
  - Total Nodes: 20
  - Total Edges: 192

Processed data saved to:
  C:\...\backend\app\data\processed

Next: Phase 3 - Neo4j Graph Storage
```

## Data Quality & Confidence

### Node Confidence Weight
Calculated based on data completeness:
- 1.0 = All data available (production, trade, food supply)
- 0.67 = 2 out of 3 data sources available
- 0.33 = Only 1 data source available
- Synthetic data: 0.85 (high confidence in estimates)

### Edge Confidence Weight
- Real bilateral trade data: 0.95
- Synthetic trade data: 0.85
- Estimated from aggregates: 0.70

## Key Design Decisions

### 1. Synthetic Data as Fallback
- **Why**: API access may be limited, rate-limited, or require keys
- **Benefit**: Development can proceed without API dependencies
- **Quality**: Based on real-world statistics and patterns

### 2. Year-by-Year CSV Files
- **Why**: Easier to load temporal snapshots for TGNN
- **Benefit**: Can load specific years without processing all data
- **Format**: `nodes_YYYY.csv` and `edges_YYYY.csv`

### 3. Confidence Weights
- **Why**: Not all data sources are equally reliable
- **Benefit**: Can weight graph operations by data quality
- **Usage**: Will be used in TGNN training and simulation validation

### 4. Simplified Climate Stress Index
- **Current**: Random values (0.3-0.7)
- **Future**: Can integrate real climate data APIs
- **Rationale**: Placeholder for MVP, can be enhanced later

## Validation Results

All 7 validation checks should pass:
1. ✅ Correct number of nodes (20)
2. ✅ All required node attributes present
3. ✅ No null values in critical fields
4. ✅ Edges exist (graph is connected)
5. ✅ All required edge attributes present
6. ✅ Values in valid ranges
7. ✅ Dependency ratios normalized [0,1]

## Next Steps: Phase 3

With processed data ready, we can now:
1. Set up Neo4j Aura instance
2. Design graph schema
3. Bulk import nodes and edges
4. Create indexes for fast queries
5. Build API endpoints for graph access

## Troubleshooting

### Issue: API rate limits
**Solution**: Use `--synthetic` flag or add delays in fetcher.py

### Issue: Missing data for some countries
**Solution**: Preprocessor fills missing values with forward-fill and defaults

### Issue: No bilateral trade data
**Solution**: Synthetic edges are generated based on aggregate trade patterns

### Issue: Validation fails
**Solution**: Check logs for specific failed checks, verify raw data exists

## Files Generated

```
backend/app/data/
├── raw/                          # Raw data from APIs/synthetic
│   ├── production.csv           # ~20 records
│   ├── trade.csv                # ~40 records
│   ├── food_supply.csv          # ~20 records
│   └── bilateral_trade.csv      # ~48 records
│
└── processed/                    # Cleaned & processed data
    ├── nodes_2018.csv           # 5 nodes
    ├── nodes_2019.csv           # 5 nodes
    ├── nodes_2020.csv           # 5 nodes
    ├── nodes_2021.csv           # 5 nodes
    ├── edges_2018.csv           # ~48 edges
    ├── edges_2019.csv           # ~48 edges
    ├── edges_2020.csv           # ~48 edges
    └── edges_2021.csv           # ~48 edges
```

---

**Phase 2 Status**: ✅ Complete and Ready for Phase 3!
