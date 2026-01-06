"""
Neo4j Database Manager
Handles connection, schema initialization, and data import logic.
"""
from neo4j import GraphDatabase
from typing import List, Dict, Any
from app.config import settings
from app.utils.logger import setup_logger

logger = setup_logger(__name__)

class Neo4jManager:
    def __init__(self):
        self.uri = settings.NEO4J_URI
        self.user = settings.NEO4J_USER
        self.password = settings.NEO4J_PASSWORD
        self.driver = None
        
    def connect(self):
        """Establish connection to Neo4j Aura/Instance"""
        if self.driver:
            self.close()
            
        try:
            # Aura specific: max_connection_lifetime of 5-10 mins is recommended
            # as Aura's load balancer terminates idle connections every 5 minutes.
            self.driver = GraphDatabase.driver(
                self.uri, 
                auth=(self.user, self.password),
                max_connection_lifetime=200, # 200 seconds
                keep_alive=True
            )
            self.driver.verify_connectivity()
            logger.info("✅ Successfully connected to Neo4j")
        except Exception as e:
            logger.error(f"❌ Failed to connect to Neo4j: {e}")
            raise

    def close(self):
        if self.driver:
            self.driver.close()

    def initialize_schema(self):
        """Set up constraints and indexes for high-performance temporal queries"""
        queries = [
            # Unique constraints for nodes
            "CREATE CONSTRAINT country_iso IF NOT EXISTS FOR (c:Country) REQUIRE c.iso_code IS UNIQUE",
            "CREATE CONSTRAINT country_name IF NOT EXISTS FOR (c:Country) REQUIRE c.name IS UNIQUE",
            
            # Indexes for temporal lookups
            "CREATE INDEX node_year_idx IF NOT EXISTS FOR (n:NodeState) ON (n.year)",
            "CREATE INDEX country_state_idx IF NOT EXISTS FOR (n:NodeState) ON (n.country_iso, n.year)"
        ]
        
        with self.driver.session() as session:
            for query in queries:
                try:
                    session.run(query)
                except Exception as e:
                    logger.warning(f"Note on schema init: {e}")
        logger.info("✅ Neo4j constraints and indexes initialized")

    def import_nodes(self, nodes_csv_path: str):
        """Import country node states for a specific year"""
        query = """
        LOAD CSV WITH HEADERS FROM 'file:///' + $filename AS row
        MERGE (c:Country {iso_code: row.iso_code})
        ON CREATE SET c.name = row.name
        
        MERGE (n:NodeState {country_iso: row.iso_code, year: toInteger(row.year)})
        SET n.production = toFloat(row.production_total),
            n.food_supply = toFloat(row.food_supply),
            n.net_trade = toFloat(row.net_trade),
            n.import_dependency = toFloat(row.import_dependency)
            
        MERGE (c)-[:HAS_STATE]->(n)
        """
        # Note: In Neo4j Aura, we usually upload to a cloud bucket or use batch inserts via Python
        # For local development with file access, we use LOAD CSV. 
        # For Aura, we will use driver-based batch insertion.
        pass

    def batch_insert_nodes(self, nodes: List[Dict[str, Any]]):
        """Batch insert node data into Neo4j (Works with Aura)"""
        query = """
        UNWIND $batch AS row
        MERGE (c:Country {name: row.area})
        
        MERGE (n:NodeState {country: row.area, year: toInteger(row.year)})
        SET n.production = toFloat(row.production_total),
            n.food_supply = toFloat(row.food_supply),
            n.net_trade = toFloat(row.net_trade),
            n.import_dependency = toFloat(row.import_dependency)
            
        MERGE (c)-[:HAS_STATE]->(n)
        """
        with self.driver.session() as session:
            session.run(query, batch=nodes)

    def batch_insert_edges(self, edges: List[Dict[str, Any]]):
        """Batch insert trade relationship data into Neo4j"""
        query = """
        UNWIND $batch AS row
        MATCH (exp:Country {name: row.exporter})
        MATCH (imp:Country {name: row.importer})
        MATCH (exp_state:NodeState {country: row.exporter, year: toInteger(row.year)})
        MATCH (imp_state:NodeState {country: row.importer, year: toInteger(row.year)})
        
        // Connect the countries directly for aggregate view
        MERGE (exp)-[r:TRADES_WITH {commodity: row.commodity}]->(imp)
        
        // Connect year-specific states for temporal analysis
        MERGE (exp_state)-[tr:TRADE_FLOW {commodity: row.commodity}]->(imp_state)
        SET tr.quantity = toFloat(row.trade_quantity)
        """
        with self.driver.session() as session:
            session.run(query, batch=edges)
