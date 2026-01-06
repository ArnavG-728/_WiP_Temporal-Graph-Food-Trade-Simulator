"""
Complete Data Pipeline: Bulk Filter -> Clean -> Preprocess
Handles the entire lifecycle from large FAOSTAT bulk files to processed graph data.
"""
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import os

# Define relative paths from this file
DATA_DIR = Path(__file__).parent
RAW_DATA_DIR = DATA_DIR / "raw"
BULK_DATA_DIR = RAW_DATA_DIR / "bulk"
PROCESSED_DATA_DIR = DATA_DIR / "processed"

# Ensure directories exist
RAW_DATA_DIR.mkdir(exist_ok=True)
PROCESSED_DATA_DIR.mkdir(exist_ok=True)

class DataPreprocessor:
    """The complete pipeline for Global Food Trade Data"""
    
    # FAOSTAT FCL (FAO Commodity List) codes for filtering
    # CPC equivalents documented in comments
    KEY_ITEMS = {
        'Wheat': '15',              # FCL 15 (CPC 0111)
        'Rice, paddy': '27',        # FCL 27 (CPC 0112)
        'Maize (corn)': '56',       # FCL 56 (CPC 0114)
        'Barley': '44',             # FCL 44 (CPC 0113)
        'Soybeans': '236',          # FCL 236 (CPC 0116)
        'Sunflower seed': '267',    # FCL 267 (CPC 0119)
        'Potatoes': '116',          # FCL 116 (CPC 0131)
        'Bananas': '486',           # FCL 486 (CPC 0134)
        'Cattle': '866',            # FCL 866 (CPC 0211)
        'Chickens': '1057',         # FCL 1057 (CPC 0213)
        'Cereals, Total': '2905',
        'Vegetables, Total': '2918',
    }

    def __init__(self, years: List[int] = [2018, 2019, 2020, 2021]):
        self.years = years

    # ==========================================
    # STAGE 1: BULK FILTERING
    # ==========================================
    
    def run_bulk_filter(self):
        """Processes massive .csv files from bulk/ and saves filtered versions to raw/"""
        print("\n📥 Stage 1: Initial Bulk Filtering...")
        
        # Define files and their corresponding specific filter logic
        file_configs = [
            {
                'bulk_name': "Production_Crops_Livestock_E_All_Data_(Normalized).csv",
                'out_name': "faostat_production.csv",
                'elements': ['Production']
            },
            {
                'bulk_name': "Trade_CropsLivestock_E_All_Data_(Normalized).csv",
                'out_name': "faostat_trade.csv",
                'elements': ['Import quantity', 'Export quantity', 'Import Value', 'Export Value']
            },
            {
                'bulk_name': "FoodBalanceSheets_E_All_Data_(Normalized).csv",
                'out_name': "faostat_food_balance.csv",
                'elements': ['Food supply (kcal/capita/day)']
            },
            {
                'bulk_name': "Trade_DetailedTradeMatrix_E_All_Data_(Normalized).csv",
                'out_name': "faostat_bilateral_trade.csv",
                'elements': None  # Matrix usually contains value/quantity by default
            }
        ]

        for config in file_configs:
            bulk_path = BULK_DATA_DIR / config['bulk_name']
            out_path = RAW_DATA_DIR / config['out_name']
            
            if not bulk_path.exists():
                print(f"   ℹ️ Skipping {config['bulk_name']} (Not found in bulk/)")
                continue

            print(f"   Filtering {config['bulk_name']} → {config['out_name']}...")
            
            chunks = []
            # Large files require chunked reading
            for chunk in pd.read_csv(bulk_path, chunksize=100000, encoding='latin-1', low_memory=False):
                # Apply filters
                # 1. Year Filter
                mask = chunk['Year'].isin(self.years)
                
                # 2. Item Filter (if applicable)
                if 'Item Code' in chunk.columns:
                    mask &= chunk['Item Code'].astype(str).isin(self.KEY_ITEMS.values())
                
                # 3. Element Filter
                if config['elements']:
                    mask &= chunk['Element'].isin(config['elements'])
                
                filtered_chunk = chunk[mask]
                if not filtered_chunk.empty:
                    chunks.append(filtered_chunk)
            
            if chunks:
                combined = pd.concat(chunks)
                combined.to_csv(out_path, index=False)
                print(f"   ✅ Saved {len(combined):,} records to raw/")
            else:
                print(f"   ⚠️ No matching records found for {config['bulk_name']}")

    # ==========================================
    # STAGE 2: CLEANING & NORMALIZATION
    # ==========================================

    def load_and_clean(self) -> Dict[str, pd.DataFrame]:
        """Loads filtered data from raw/ and cleans it"""
        print("\n✨ Stage 2: Cleaning and Normalization...")
        
        raw_files = {
            'production': 'faostat_production.csv',
            'trade': 'faostat_trade.csv',
            'food_balance': 'faostat_food_balance.csv',
            'bilateral': 'faostat_bilateral_trade.csv'
        }
        
        data = {}
        for key, filename in raw_files.items():
            path = RAW_DATA_DIR / filename
            if not path.exists():
                data[key] = pd.DataFrame()
                continue
                
            df = pd.read_csv(path, low_memory=False)
            # Standardize columns to snake_case
            df.columns = df.columns.str.lower().str.replace(' ', '_').str.replace('(', '').str.replace(')', '')
            
            # Fill small numeric gaps
            if 'value' in df.columns:
                df['value'] = df['value'].fillna(0)
                
            data[key] = df
            print(f"   Cleaned {key}: {len(df):,} records")
            
        return data

    # ==========================================
    # STAGE 3: NODE & EDGE PREPROCESSING
    # ==========================================

    def calculate_attributes(self, data: Dict[str, pd.DataFrame]) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """Calculates global node and edge attributes"""
        print("\n🧠 Stage 3: Feature Engineering...")
        
        # --- NODE ATTRIBUTES ---
        prod = data.get('production', pd.DataFrame())
        fb = data.get('food_balance', pd.DataFrame())
        tr = data.get('trade', pd.DataFrame())
        
        # Country name normalization mapping
        NAME_MAP = {
            'China, mainland': 'China',
            'China, Taiwan Province of': 'Taiwan',
            'China, Hong Kong SAR': 'Hong Kong',
            'China, Macao SAR': 'Macao',
            'Russian Federation': 'Russia',
            'Viet Nam': 'Vietnam'
        }

        def normalize_name(name):
            return NAME_MAP.get(name, name)

        if not prod.empty: prod['area'] = prod['area'].apply(normalize_name)
        if not fb.empty: fb['area'] = fb['area'].apply(normalize_name)
        if not tr.empty: tr['area'] = tr['area'].apply(normalize_name)
        
        # Use Area as the primary key
        prod_areas = set(prod['area'].unique()) if not prod.empty else set()
        fb_areas = set(fb['area'].unique()) if not fb.empty else set()
        areas = sorted(list(prod_areas | fb_areas))
        
        nodes = []
        for area in areas:
            # Filter out obvious non-country aggregates
            if any(x in area.lower() for x in ['total', 'world', 'africa', 'asia', 'europe', 'americas', 'oceania']):
                if area not in ['India', 'China', 'Brazil', 'Egypt', 'Russia']:
                    continue

            for year in self.years:
                node = {'area': area, 'year': year}
                
                # Production
                a_prod = prod[(prod['area'] == area) & (prod['year'] == year)]
                node['production_total'] = a_prod['value'].sum() if not a_prod.empty else 0
                
                # Food Supply
                a_fb = fb[(fb['area'] == area) & (fb['year'] == year)]
                node['food_supply'] = a_fb['value'].mean() if not a_fb.empty else 2500
                
                # Trade Metrics
                if not tr.empty:
                    a_tr = tr[(tr['area'] == area) & (tr['year'] == year)]
                    imp = a_tr[a_tr['element'].str.contains('Import', case=False, na=False)]['value'].sum()
                    exp = a_tr[a_tr['element'].str.contains('Export', case=False, na=False)]['value'].sum()
                    node['net_trade'] = exp - imp
                    node['import_dependency'] = imp / (node['production_total'] + imp) if (node['production_total'] + imp) > 0 else 0
                else:
                    node['net_trade'] = 0
                    node['import_dependency'] = 0
                
                nodes.append(node)
        
        nodes_df = pd.DataFrame(nodes)

        # --- EDGE ATTRIBUTES ---
        bi = data.get('bilateral', pd.DataFrame())
        if bi.empty:
            edges_df = pd.DataFrame()
        else:
            # Normalize names and handle bilateral logic
            bi['reporter_countries'] = bi['reporter_countries'].apply(normalize_name)
            bi['partner_countries'] = bi['partner_countries'].apply(normalize_name)

            # Separate Imports and Exports
            # FAOSTAT: Reporter=Armenia, Partner=Costa Rica, Element=Import Quantity means Costa Rica -> Armenia
            imports = bi[bi['element'].str.contains('Import quantity', case=False, na=False)].copy()
            imports['exporter'] = imports['partner_countries']
            imports['importer'] = imports['reporter_countries']

            exports = bi[bi['element'].str.contains('Export quantity', case=False, na=False)].copy()
            exports['exporter'] = exports['reporter_countries']
            exports['importer'] = exports['partner_countries']

            edges_df = pd.concat([imports, exports])
            edges_df = edges_df.rename(columns={'item': 'commodity', 'value': 'trade_quantity'})
            
            # Select relevant columns and aggregate
            # We group by source, target, year, commodity to handle cases where both reported the trade
            edges_df = edges_df.groupby(['exporter', 'importer', 'year', 'commodity'])['trade_quantity'].mean().reset_index()
            
            # Remove self-loops
            edges_df = edges_df[edges_df['exporter'] != edges_df['importer']]

        return nodes_df, edges_df

    # ==========================================
    # STAGE 4: OUTPUT SAVING
    # ==========================================

    def save_final(self, nodes: pd.DataFrame, edges: pd.DataFrame):
        """Saves final state to processed/ directory"""
        print("\n💾 Stage 4: Writing Final Graph Data...")
        
        nodes.to_csv(PROCESSED_DATA_DIR / "nodes_all.csv", index=False)
        if not edges.empty:
            edges.to_csv(PROCESSED_DATA_DIR / "edges_all.csv", index=False)

        for year in self.years:
            yr_nodes = nodes[nodes['year'] == year]
            yr_nodes.to_csv(PROCESSED_DATA_DIR / f"nodes_{year}.csv", index=False)
            
            if not edges.empty:
                yr_edges = edges[edges['year'] == year]
                yr_edges.to_csv(PROCESSED_DATA_DIR / f"edges_{year}.csv", index=False)
                print(f"   ✅ Year {year}: {len(yr_nodes)} nodes, {len(yr_edges):,} edges")
            else:
                print(f"   ✅ Year {year}: {len(yr_nodes)} nodes")

    def run_pipeline(self):
        """The Master Execution Method"""
        print("="*70)
        print("TEMPORAL GRAPH FOOD TRADE - FULL END-TO-END PIPELINE")
        print("="*70)
        
        self.run_bulk_filter()            # Bulk -> Raw
        data = self.load_and_clean()       # Raw -> Cleaned Data Frames
        nodes, edges = self.calculate_attributes(data) # Cleaned -> Features
        self.save_final(nodes, edges)     # Features -> Processed Files
        
        print("\n" + "="*70)
        print("PIPELINE COMPLETE - REAL DATA READY")
        print("="*70 + "\n")

if __name__ == "__main__":
    prep = DataPreprocessor()
    prep.run_pipeline()
