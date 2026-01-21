from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.graph.neo4j_manager import Neo4jManager
from app.simulation.engine import SimulationEngine
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
neo4j = Neo4jManager()
simulation = SimulationEngine()

class AttributeUpdate(BaseModel):
    area: str
    year: int
    commodity: str = "Total"
    production_change: float = 0
    import_change: float = 0
    climate_stress: float = 0
    policy_restriction: bool = False

@router.on_event("startup")
def startup():
    neo4j.connect()

@router.on_event("shutdown")
def shutdown():
    neo4j.close()

def get_session():
    if not neo4j.driver:
        neo4j.connect()
    try:
        neo4j.driver.verify_connectivity()
    except Exception:
        logger.warning("Neo4j connection lost. Attempting to reconnect...")
        neo4j.connect()
    return neo4j.driver.session()

@router.get("/graph/snapshot/{year}")
async def get_snapshot(year: int):
    query = """
    MATCH (n:NodeState {year: $year})
    OPTIONAL MATCH (n)-[r:TRADE_FLOW]->(target:NodeState {year: $year})
    RETURN n, r, target
    """
    try:
        with get_session() as session:
            result = session.run(query, year=year)
            nodes = {}
            edges = []
            for record in result:
                node_data = record["n"]
                if node_data["country"] not in nodes:
                    nodes[node_data["country"]] = {
                        "id": node_data["country"],
                        "label": node_data["country"],
                        "production": node_data.get("production", 0),
                        "food_supply": node_data.get("food_supply", 0),
                        "net_trade": node_data.get("net_trade", 0),
                        "import_dependency": node_data.get("import_dependency", 0)
                    }
                if record["r"] and record["target"]:
                    target_data = record["target"]
                    edge_data = record["r"]
                    edges.append({
                        "id": f"{node_data['country']}-{target_data['country']}-{edge_data['commodity']}",
                        "source": node_data["country"],
                        "target": target_data["country"],
                        "commodity": edge_data["commodity"],
                        "quantity": edge_data.get("quantity", 0)
                    })
            return {"nodes": list(nodes.values()), "edges": edges}
    except Exception as e:
        logger.error(f"Error fetching snapshot: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/graph/countries")
async def get_countries():
    query = "MATCH (c:Country) RETURN c.name as name ORDER BY name"
    try:
        with get_session() as session:
            result = session.run(query)
            return [record["name"] for record in result]
    except Exception as e:
        logger.error(f"Error fetching countries: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/graph/stats")
async def get_stats():
    query = """
    MATCH (n:NodeState)
    RETURN 
        count(DISTINCT n.country) as country_count,
        sum(n.production) as total_production,
        avg(n.food_supply) as avg_food_supply,
        max(n.year) as latest_year
    """
    try:
        with get_session() as session:
            record = session.run(query).single()
            if not record:
                return {"area_count": 0, "total_production": 0, "avg_food_supply": 0, "latest_year": 0}
            return {
                "area_count": record["country_count"],
                "total_production": record["total_production"],
                "avg_food_supply": record["avg_food_supply"],
                "latest_year": record["latest_year"]
            }
    except Exception as e:
        logger.error(f"Error fetching stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/graph/country/{name}/history")
async def get_country_history(name: str):
    query = """
    MATCH (n:NodeState {country: $name})
    RETURN n.year as year, n.production as production, n.food_supply as food_supply, 
           n.net_trade as net_trade, n.import_dependency as import_dependency
    ORDER BY n.year ASC
    """
    try:
        with get_session() as session:
            result = session.run(query, name=name)
            history = [dict(record) for record in result]
            if not history:
                raise HTTPException(status_code=404, detail="Country not found")
            return history
    except Exception as e:
        logger.error(f"Error fetching country history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/graph/country/{name}/partners")
async def get_country_partners(name: str, year: int = 2021):
    """Get aggregated trade partners with detailed commodity breakdowns"""
    query = """
    MATCH (n:NodeState {country: $name, year: $year})
    MATCH (n)-[r:TRADE_FLOW]-(p:NodeState {year: $year})
    WHERE p.country <> $name
    WITH p.country as partner, 
         r.quantity as qty, 
         r.commodity as comm,
         CASE WHEN startNode(r) = n THEN 'Export' ELSE 'Import' END as flow_dir
    WITH partner,
         comm,
         sum(CASE WHEN flow_dir = 'Export' THEN qty ELSE 0 END) as export_qty,
         sum(CASE WHEN flow_dir = 'Import' THEN qty ELSE 0 END) as import_qty
    WITH partner,
         collect({
             commodity: comm,
             export_quantity: export_qty,
             import_quantity: import_qty,
             total_quantity: export_qty + import_qty
         }) as commodity_details
    WITH partner,
         commodity_details,
         reduce(total = 0, cd IN commodity_details | total + cd.total_quantity) as total_volume,
         reduce(exp = 0, cd IN commodity_details | exp + cd.export_quantity) as total_exports,
         reduce(imp = 0, cd IN commodity_details | imp + cd.import_quantity) as total_imports
    UNWIND commodity_details as cd
    WITH partner, total_volume, total_exports, total_imports, commodity_details, cd
    ORDER BY cd.total_quantity DESC
    WITH partner, total_volume, total_exports, total_imports, collect(cd)[0] as primary_comm_detail, commodity_details
    RETURN partner,
           total_volume as quantity,
           primary_comm_detail.commodity as primary_commodity,
           CASE WHEN total_exports > total_imports THEN 'Export' ELSE 'Import' END as type,
           commodity_details as commodities,
           total_exports,
           total_imports
    ORDER BY quantity DESC
    LIMIT 10
    """
    try:
        with get_session() as session:
            result = session.run(query, name=name, year=year)
            partners = [dict(record) for record in result]
            return partners
    except Exception as e:
        logger.error(f"Error fetching country partners: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/simulation/run")
async def run_simulation(update: AttributeUpdate):
    try:
        results = simulation.run_simulation(
            area=update.area,
            year=update.year,
            commodity=update.commodity,
            prod_change_pct=update.production_change,
            import_change_pct=update.import_change,
            climate_stress=update.climate_stress
        )
        return results
    except Exception as e:
        logger.error(f"Simulation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
