"""
Standalone Neo4j Data Import Orchestrator
Avoids Pydantic/Langchain dependency issues by loading .env manually.
"""
import pandas as pd
from pathlib import Path
import sys
import os
from neo4j import GraphDatabase

def load_env():
    env_path = Path("backend/.env")
    env_vars = {}
    if env_path.exists():
        with open(env_path, "r") as f:
            for line in f:
                if "=" in line and not line.startswith("#"):
                    key, value = line.strip().split("=", 1)
                    env_vars[key] = value.strip("'").strip('"')
    return env_vars

def run_import():
    print("="*70)
    print("🚀 STANDALONE NEO4J GRAPH DATA IMPORT")
    print("="*70)

    env = load_env()
    uri = env.get("NEO4J_URI")
    user = env.get("NEO4J_USER", "neo4j")
    password = env.get("NEO4J_PASSWORD")

    if not uri or not password:
        print("\n❌ Missing Neo4j credentials in backend/.env")
        return

    try:
        driver = GraphDatabase.driver(uri, auth=(user, password))
        driver.verify_connectivity()
        print("✅ Successfully connected to Neo4j")
    except Exception as e:
        print(f"❌ Failed to connect to Neo4j: {e}")
        return

    # 1. Initialize Schema
    print("\n🛠️  Initializing Schema (Constraints & Indexes)...")
    queries = [
        "CREATE CONSTRAINT country_name IF NOT EXISTS FOR (c:Country) REQUIRE c.name IS UNIQUE",
        "CREATE INDEX node_year_idx IF NOT EXISTS FOR (n:NodeState) ON (n.year)",
        "CREATE INDEX country_state_idx IF NOT EXISTS FOR (n:NodeState) ON (n.country, n.year)"
    ]
    
    with driver.session() as session:
        for q in queries:
            session.run(q)

    # 2. Path to processed data
    processed_dir = Path("backend/app/data/processed")
    nodes_file = processed_dir / "nodes_all.csv"
    edges_file = processed_dir / "edges_all.csv"

    if not nodes_file.exists() or not edges_file.exists():
        print(f"\n❌ Processed data not found in {processed_dir}")
        return

    # 3. Import Nodes
    print("\n📦 Importing Country Node States...")
    nodes_df = pd.read_csv(nodes_file)
    
    node_query = """
    UNWIND $batch AS row
    MERGE (c:Country {name: row.area})
    
    MERGE (n:NodeState {country: row.area, year: toInteger(row.year)})
    SET n.production = toFloat(row.production_total),
        n.food_supply = toFloat(row.food_supply),
        n.net_trade = toFloat(row.net_trade),
        n.import_dependency = toFloat(row.import_dependency)
        
    MERGE (c)-[:HAS_STATE]->(n)
    """
    
    batch_size = 500
    with driver.session() as session:
        for i in range(0, len(nodes_df), batch_size):
            batch = nodes_df.iloc[i : i + batch_size].to_dict('records')
            session.run(node_query, batch=batch)
            print(f"   Processed {i + len(batch)} nodes...")

    # 4. Import Edges
    print("\n🔗 Importing Trade Edges (This may take a while)...")
    edges_df = pd.read_csv(edges_file)
    
    edge_query = """
    UNWIND $batch AS row
    MATCH (exp:Country {name: row.exporter})
    MATCH (imp:Country {name: row.importer})
    
    // Connect year-specific states for temporal analysis
    MATCH (exp_state:NodeState {country: row.exporter, year: toInteger(row.year)})
    MATCH (imp_state:NodeState {country: row.importer, year: toInteger(row.year)})
    
    MERGE (exp_state)-[tr:TRADE_FLOW {commodity: row.commodity}]->(imp_state)
    SET tr.quantity = toFloat(row.trade_quantity)
    """
    
    edge_batch_size = 1000
    with driver.session() as session:
        for i in range(0, len(edges_df), edge_batch_size):
            batch = edges_df.iloc[i : i + edge_batch_size].to_dict('records')
            session.run(edge_query, batch=batch)
            if (i + len(batch)) % 5000 == 0 or (i + len(batch)) == len(edges_df):
                print(f"   Processed {i + len(batch)} edges...")

    driver.close()
    print("\n" + "="*70)
    print("✅ NEO4J IMPORT COMPLETE")
    print(f"Final Count: {len(nodes_df)} node-state points, {len(edges_df)} trade edges.")
    print("="*70 + "\n")

if __name__ == "__main__":
    run_import()
