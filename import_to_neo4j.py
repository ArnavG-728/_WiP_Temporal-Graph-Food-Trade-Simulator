"""
Neo4j Data Import Orchestrator
Reads processed global data and populates the Neo4j Graph Database.
"""
import pandas as pd
from pathlib import Path
import sys
import os

# Set up paths
backend_path = Path(__file__).parent / "backend"
sys.path.append(str(backend_path))

from backend.app.graph.neo4j_manager import Neo4jManager
from backend.app.config import settings

def run_import():
    print("="*70)
    print("🚀 NEO4J GRAPH DATA IMPORT")
    print("="*70)

    # 1. Initialize Neo4j
    manager = Neo4jManager()
    try:
        manager.connect()
    except Exception:
        print("\n❌ Could not connect to Neo4j. Please check your credentials in .env")
        return

    manager.initialize_schema()

    # 2. Path to processed data
    processed_dir = Path("backend/app/data/processed")
    nodes_file = processed_dir / "nodes_all.csv"
    edges_file = processed_dir / "edges_all.csv"

    if not nodes_file.exists() or not edges_file.exists():
        print(f"\n❌ Processed data not found in {processed_dir}")
        print("Please run 'python run_pipeline.py' first.")
        return

    # 3. Import Nodes
    print("\n📦 Importing Country Nodes...")
    nodes_df = pd.read_csv(nodes_file)
    # UNWIND works best with chunks
    batch_size = 500
    for i in range(0, len(nodes_df), batch_size):
        batch = nodes_df.iloc[i : i + batch_size].to_dict('records')
        manager.batch_insert_nodes(batch)
        print(f"   Processed {i + len(batch)} nodes...")

    # 4. Import Edges
    print("\n🔗 Importing Trade Edges (This may take a while)...")
    edges_df = pd.read_csv(edges_file)
    edge_batch_size = 1000
    for i in range(0, len(edges_df), edge_batch_size):
        batch = edges_df.iloc[i : i + edge_batch_size].to_dict('records')
        manager.batch_insert_edges(batch)
        if (i + len(batch)) % 5000 == 0 or (i + len(batch)) == len(edges_df):
            print(f"   Processed {i + len(batch)} edges...")

    manager.close()
    print("\n" + "="*70)
    print("✅ NEO4J IMPORT COMPLETE")
    print(f"Final Count: {len(nodes_df)} node-state points, {len(edges_df)} trade edges.")
    print("="*70 + "\n")

if __name__ == "__main__":
    run_import()
