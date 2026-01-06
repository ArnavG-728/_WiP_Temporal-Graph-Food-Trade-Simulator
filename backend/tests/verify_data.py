"""
Data Verification Suite
Verifies that processed nodes and edges match the source data logic.
"""
import pandas as pd
from pathlib import Path

# Paths
PROCESS_DIR = Path("backend/app/data/processed")
RAW_DIR = Path("backend/app/data/raw")

def verify_production_sums():
    print("🔍 Verifying Production Aggregations...")
    # Load raw production
    raw_prod = pd.read_csv(RAW_DIR / "faostat_production.csv")
    processed_nodes = pd.read_csv(PROCESS_DIR / "nodes_all.csv")
    
    # Test for India 2021
    country = "India"
    year = 2021
    
    raw_val = raw_prod[(raw_prod['Area'] == country) & (raw_prod['Year'] == year)]['Value'].sum()
    proc_val = processed_nodes[(processed_nodes['area'] == country) & (processed_nodes['year'] == year)]['production_total'].iloc[0]
    
    print(f"   [{country} {year}] Raw Sum: {raw_val:,.0f} | Processed: {proc_val:,.0f}")
    assert abs(raw_val - proc_val) < 1, "❌ Production sum mismatch!"
    print("   ✅ Production Match Verified.")

def verify_trade_balance():
    print("\n🔍 Verifying Trade Logic (Net Trade & IDR)...")
    raw_trade = pd.read_csv(RAW_DIR / "faostat_trade.csv")
    processed_nodes = pd.read_csv(PROCESS_DIR / "nodes_all.csv")
    
    country = "Egypt"
    year = 2021
    
    country_tr = raw_trade[(raw_trade['Area'] == country) & (raw_trade['Year'] == year)]
    imports = country_tr[country_tr['Element'].str.contains('Import', case=False)]['Value'].sum()
    exports = country_tr[country_tr['Element'].str.contains('Export', case=False)]['Value'].sum()
    
    expected_net = exports - imports
    actual_net = processed_nodes[(processed_nodes['area'] == country) & (processed_nodes['year'] == year)]['net_trade'].iloc[0]
    
    print(f"   [{country} {year}] Calculated Net: {expected_net:,.0f} | Processed: {actual_net:,.0f}")
    assert abs(expected_net - actual_net) < 1, "❌ Net trade mismatch!"
    print("   ✅ Trade Balance Verified.")

def verify_edge_integrity():
    print("\n🔍 Verifying Edge Counts...")
    edges = pd.read_csv(PROCESS_DIR / "edges_all.csv")
    raw_bi = pd.read_csv(RAW_DIR / "faostat_bilateral_trade.csv")
    
    print(f"   Raw Bilateral Records: {len(raw_bi):,}")
    print(f"   Processed Edges: {len(edges):,}")
    
    # Check if edges are within 5% (small filter variations like self-trade removal are expected)
    diff = abs(len(raw_bi) - len(edges)) / len(raw_bi)
    assert diff < 0.05, f"❌ Edge count discrepancy too high ({diff:.2%})"
    print(f"   ✅ Edge Integrity Verified (Diff: {diff:.2%}).")

if __name__ == "__main__":
    try:
        verify_production_sums()
        verify_trade_balance()
        verify_edge_integrity()
        print("\n🏆 ALL VERIFICATION TESTS PASSED!")
    except Exception as e:
        print(f"\n🔥 TEST FAILED: {e}")
