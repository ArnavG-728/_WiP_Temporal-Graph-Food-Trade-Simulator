from typing import List, Dict, Any
from app.graph.neo4j_manager import Neo4jManager
import logging

logger = logging.getLogger(__name__)

class SimulationEngine:
    def __init__(self):
        self.neo4j = Neo4jManager()

    def run_simulation(
        self, 
        area: str, 
        year: int, 
        prod_change_pct: float, 
        commodity: str = "Total",
        import_change_pct: float = 0,
        climate_stress: float = 0
    ) -> Dict[str, Any]:
        """
        Runs a simulation by perturbing the graph state and propagating changes.
        
        Args:
            area: The country name to apply the perturbation to.
            year: The year of the snapshot to use.
            prod_change_pct: Percentage change in production (-100 to +100).
            import_change_pct: Percentage change in import dependency.
            climate_stress: 0 to 1 value representing climate impact.
            
        Returns:
            A dictionary containing updated 'nodes' and 'edges'.
        """
        if not self.neo4j.driver:
            self.neo4j.connect()

        try:
            with self.neo4j.driver.session() as session:
                # 1. Fetch the current state of the global graph for that year
                # We need all nodes and edges to perform propagation
                query = """
                MATCH (n:NodeState {year: $year})
                OPTIONAL MATCH (n)-[r:TRADE_FLOW]->(target:NodeState {year: $year})
                RETURN n, r, target
                """
                result = session.run(query, year=year)
                
                nodes = {}
                edges = []
                
                for record in result:
                    node_data = dict(record["n"])
                    country = node_data["country"]
                    
                    if country not in nodes:
                        nodes[country] = {
                            "id": country,
                            "label": country,
                            "production": node_data.get("production", 0),
                            "food_supply": node_data.get("food_supply", 0),
                            "net_trade": node_data.get("net_trade", 0),
                            "import_dependency": node_data.get("import_dependency", 0),
                            "original_production": node_data.get("production", 0),
                            "is_affected": False
                        }
                    
                    if record["r"] and record["target"]:
                        target_data = dict(record["target"])
                        edge_data = dict(record["r"])
                        edges.append({
                            "id": f"{country}-{target_data['country']}-{edge_data['commodity']}",
                            "source": country,
                            "target": target_data["country"],
                            "commodity": edge_data["commodity"],
                            "quantity": edge_data.get("quantity", 0),
                            "original_quantity": edge_data.get("quantity", 0)
                        })

                # 2. Apply Perturbation to Target Area
                if area in nodes:
                    target_node = nodes[area]
                    old_prod = target_node["production"]
                    prod_factor = (1 + prod_change_pct / 100.0)
                    new_prod = old_prod * prod_factor
                    
                    target_node["production"] = new_prod
                    target_node["is_affected"] = True
                    prod_delta = new_prod - old_prod
                    
                    # 3. Propagate to Edges (Trade Flows)
                    # If production decreases, exports from this country might decrease
                    if prod_delta < 0:
                        # Find outgoing edges from this country, optionally filtered by commodity
                        outgoing_edges = [
                            e for e in edges 
                            if e["source"] == area 
                            and (commodity == "Total" or e["commodity"] == commodity)
                        ]
                        total_exports = sum(e["quantity"] for e in outgoing_edges)
                        
                        if total_exports > 0:
                            # We'll reduce exports proportionally or up to a maximum (cannot export more than produced - local need)
                            # For simplicity, we reduce exports by a ratio related to production loss
                            # If production drops 20%, let's say exports drop by 20% too
                            reduction_ratio = prod_factor 
                            
                            for edge in outgoing_edges:
                                old_qty = edge["quantity"]
                                new_qty = old_qty * reduction_ratio
                                edge["quantity"] = new_qty
                                
                                # 4. Propagate to Partners (Second Level)
                                partner_name = edge["target"]
                                if partner_name in nodes:
                                    partner_node = nodes[partner_name]
                                    supply_loss = old_qty - new_qty
                                    partner_node["food_supply"] -= (supply_loss * 0.5) # Arbitrary factor: how much trade loss affects supply
                                    partner_node["is_affected"] = True
                                    partner_node["impact_severity"] = "high" if (supply_loss / max(1, partner_node["food_supply"])) > 0.05 else "medium"

                    elif prod_delta > 0:
                        # Increase exports?
                        outgoing_edges = [
                            e for e in edges 
                            if e["source"] == area 
                            and (commodity == "Total" or e["commodity"] == commodity)
                        ]
                        for edge in outgoing_edges:
                            edge["quantity"] *= prod_factor
                            partner_node = nodes.get(edge["target"])
                            if partner_node:
                                partner_node["food_supply"] += (edge["quantity"] * (prod_factor - 1) * 0.3)
                                partner_node["is_affected"] = True

                return {
                    "nodes": list(nodes.values()),
                    "edges": edges
                }

        except Exception as e:
            logger.error(f"Simulation error: {e}")
            raise e
