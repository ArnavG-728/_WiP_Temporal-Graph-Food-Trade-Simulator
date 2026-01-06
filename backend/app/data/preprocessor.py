"""
Data preprocessing and attribute calculation
Cleans raw data and computes node/edge attributes for graph construction
"""
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Tuple, Optional
from app.config import settings
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


class DataPreprocessor:
    """Preprocessor for cleaning and transforming raw food trade data"""
    
    # Country name to ISO3 code mapping
    COUNTRY_MAPPING = {
        'India': 'IND',
        'United States of America': 'USA',
        'Brazil': 'BRA',
        'Egypt': 'EGY',
        'China': 'CHN',
        'United States': 'USA',
        'China, mainland': 'CHN'
    }
    
    # Country names for display
    COUNTRY_NAMES = {
        'IND': 'India',
        'USA': 'United States',
        'BRA': 'Brazil',
        'EGY': 'Egypt',
        'CHN': 'China'
    }
    
    def __init__(self):
        self.raw_data_dir = settings.RAW_DATA_DIR
        self.processed_data_dir = settings.PROCESSED_DATA_DIR
        self.countries = settings.MVP_COUNTRIES
        self.years = settings.MVP_YEARS
    
    def load_raw_data(self) -> Dict[str, pd.DataFrame]:
        """Load all raw data files"""
        logger.info("Loading raw data files...")
        
        data = {}
        files = {
            'production': 'production.csv',
            'trade': 'trade.csv',
            'food_supply': 'food_supply.csv',
            'bilateral_trade': 'bilateral_trade.csv'
        }
        
        for key, filename in files.items():
            filepath = self.raw_data_dir / filename
            if filepath.exists():
                data[key] = pd.read_csv(filepath)
                logger.info(f"Loaded {key}: {len(data[key])} records")
            else:
                logger.warning(f"File not found: {filepath}")
                data[key] = pd.DataFrame()
        
        return data
    
    def clean_data(self, df: pd.DataFrame, data_type: str) -> pd.DataFrame:
        """
        Clean and standardize data
        
        Args:
            df: Raw DataFrame
            data_type: Type of data (production, trade, etc.)
            
        Returns:
            Cleaned DataFrame
        """
        if df.empty:
            return df
        
        logger.info(f"Cleaning {data_type} data...")
        
        # Standardize column names
        df.columns = df.columns.str.lower().str.replace(' ', '_')
        
        # Normalize country codes
        if 'area' in df.columns:
            df['iso3'] = df['area'].map(self.COUNTRY_MAPPING)
            df = df[df['iso3'].notna()]  # Keep only MVP countries
        
        # Handle missing values
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        df[numeric_cols] = df[numeric_cols].fillna(method='ffill').fillna(0)
        
        # Remove outliers (values > 3 std deviations)
        for col in numeric_cols:
            if col not in ['year', 'area_code']:
                mean = df[col].mean()
                std = df[col].std()
                df[col] = df[col].clip(lower=mean - 3*std, upper=mean + 3*std)
        
        logger.info(f"Cleaned {data_type}: {len(df)} records remaining")
        return df
    
    def calculate_node_attributes(
        self,
        production_df: pd.DataFrame,
        trade_df: pd.DataFrame,
        food_supply_df: pd.DataFrame
    ) -> pd.DataFrame:
        """
        Calculate node attributes for each country-year
        
        Returns:
            DataFrame with node attributes
        """
        logger.info("Calculating node attributes...")
        
        nodes = []
        
        for country in self.countries:
            for year in self.years:
                node = {
                    'iso_code': country,
                    'name': self.COUNTRY_NAMES.get(country, country),
                    'year': year
                }
                
                # Production total (million tons)
                prod_data = production_df[
                    (production_df['iso3'] == country) & 
                    (production_df['year'] == year)
                ]
                if not prod_data.empty:
                    # Sum production across all items, convert to million tons
                    node['production_total'] = prod_data['value'].sum() / 1_000_000
                else:
                    node['production_total'] = 0.0
                
                # Food supply per capita (kcal/day)
                supply_data = food_supply_df[
                    (food_supply_df['iso3'] == country) & 
                    (food_supply_df['year'] == year)
                ]
                if not supply_data.empty:
                    node['food_supply_per_capita'] = supply_data['value'].mean()
                else:
                    node['food_supply_per_capita'] = 2000.0  # Default
                
                # Import/Export volumes
                imports = trade_df[
                    (trade_df['iso3'] == country) & 
                    (trade_df['year'] == year) &
                    (trade_df['trade_type'] == 'import')
                ]
                exports = trade_df[
                    (trade_df['iso3'] == country) & 
                    (trade_df['year'] == year) &
                    (trade_df['trade_type'] == 'export')
                ]
                
                import_total = imports['value'].sum() / 1_000_000 if not imports.empty else 0.0
                export_total = exports['value'].sum() / 1_000_000 if not exports.empty else 0.0
                
                # Import dependency ratio = imports / (production + imports)
                total_supply = node['production_total'] + import_total
                node['import_dependency_ratio'] = (
                    import_total / total_supply if total_supply > 0 else 0.0
                )
                
                # Export dependency ratio = exports / production
                node['export_dependency_ratio'] = (
                    export_total / node['production_total'] 
                    if node['production_total'] > 0 else 0.0
                )
                
                # Net trade balance (million tons)
                node['net_trade_balance'] = export_total - import_total
                
                # Stock-to-use ratio (simplified estimate)
                node['stock_to_use_ratio'] = 0.25  # Default estimate
                
                # Yield index (normalized, 0-1)
                node['yield_index'] = min(node['production_total'] / 500, 1.0)
                
                # Climate stress index (placeholder - will be enhanced)
                node['climate_stress_index'] = np.random.uniform(0.3, 0.7)
                
                # Policy restriction flag (0 or 1)
                node['policy_restriction_flag'] = 0
                
                # Price volatility index (placeholder)
                node['price_volatility_index'] = np.random.uniform(0.2, 0.5)
                
                # Node confidence weight (based on data completeness)
                data_completeness = sum([
                    1 if node['production_total'] > 0 else 0,
                    1 if node['food_supply_per_capita'] > 0 else 0,
                    1 if import_total > 0 or export_total > 0 else 0
                ]) / 3
                node['node_confidence_weight'] = data_completeness
                
                nodes.append(node)
        
        nodes_df = pd.DataFrame(nodes)
        logger.info(f"Calculated attributes for {len(nodes_df)} nodes")
        
        return nodes_df
    
    def calculate_edge_attributes(
        self,
        bilateral_trade_df: pd.DataFrame,
        nodes_df: pd.DataFrame
    ) -> pd.DataFrame:
        """
        Calculate edge attributes for trade relationships
        
        Returns:
            DataFrame with edge attributes
        """
        logger.info("Calculating edge attributes...")
        
        edges = []
        
        # If no bilateral trade data, create synthetic edges based on aggregate trade
        if bilateral_trade_df.empty:
            logger.warning("No bilateral trade data, creating synthetic edges...")
            edges = self._create_synthetic_edges(nodes_df)
        else:
            # Process actual bilateral trade data
            for _, row in bilateral_trade_df.iterrows():
                edge = self._process_bilateral_trade_row(row, nodes_df)
                if edge:
                    edges.append(edge)
        
        edges_df = pd.DataFrame(edges)
        
        if not edges_df.empty:
            # Calculate historical stability (variance over years)
            edges_df['historical_stability'] = edges_df.groupby(
                ['exporter', 'importer', 'commodity']
            )['trade_quantity'].transform(lambda x: x.std() / x.mean() if x.mean() > 0 else 0)
            
            logger.info(f"Calculated attributes for {len(edges_df)} edges")
        
        return edges_df
    
    def _create_synthetic_edges(self, nodes_df: pd.DataFrame) -> list:
        """Create synthetic trade edges based on node attributes"""
        edges = []
        
        # Define major trade relationships based on real-world patterns
        trade_patterns = [
            ('USA', 'EGY', 'wheat', 6.2),
            ('USA', 'CHN', 'soybeans', 12.5),
            ('BRA', 'CHN', 'soybeans', 14.5),
            ('BRA', 'EGY', 'maize', 3.1),
            ('IND', 'EGY', 'rice', 2.1),
            ('USA', 'IND', 'maize', 3.4),
            ('CHN', 'IND', 'processed', 1.8),
            ('USA', 'BRA', 'wheat', 1.2),
            ('BRA', 'USA', 'sugar', 2.3),
            ('IND', 'USA', 'rice', 1.5)
        ]
        
        for year in self.years:
            for exporter, importer, commodity, base_quantity in trade_patterns:
                # Add some year-to-year variation
                variation = np.random.uniform(0.9, 1.1)
                quantity = base_quantity * variation
                
                # Get importer's total imports for trade share calculation
                importer_node = nodes_df[
                    (nodes_df['iso_code'] == importer) & 
                    (nodes_df['year'] == year)
                ]
                
                if not importer_node.empty:
                    importer_production = importer_node.iloc[0]['production_total']
                    importer_imports = importer_production * importer_node.iloc[0]['import_dependency_ratio']
                    
                    trade_share = quantity / importer_imports if importer_imports > 0 else 0.1
                else:
                    trade_share = 0.1
                
                edge = {
                    'exporter': exporter,
                    'importer': importer,
                    'commodity': commodity,
                    'year': year,
                    'trade_quantity': quantity,
                    'trade_share': min(trade_share, 1.0),
                    'edge_confidence_weight': 0.85  # Synthetic data has lower confidence
                }
                
                edges.append(edge)
        
        return edges
    
    def _process_bilateral_trade_row(
        self,
        row: pd.Series,
        nodes_df: pd.DataFrame
    ) -> Optional[Dict]:
        """Process a single bilateral trade row"""
        # Extract relevant fields from Comtrade data
        # This will depend on the actual API response structure
        try:
            edge = {
                'exporter': row.get('reporterISO', ''),
                'importer': row.get('partnerISO', ''),
                'commodity': row.get('cmdCode', 'cereals'),
                'year': row.get('period', 2020),
                'trade_quantity': row.get('primaryValue', 0) / 1_000_000,  # Convert to million tons
                'trade_share': 0.1,  # Will be calculated later
                'edge_confidence_weight': 0.95
            }
            
            return edge if edge['exporter'] and edge['importer'] else None
        except Exception as e:
            logger.warning(f"Error processing bilateral trade row: {e}")
            return None
    
    def save_processed_data(
        self,
        nodes_df: pd.DataFrame,
        edges_df: pd.DataFrame
    ):
        """Save processed node and edge data by year"""
        logger.info("Saving processed data...")
        
        for year in self.years:
            # Save nodes for this year
            nodes_year = nodes_df[nodes_df['year'] == year]
            nodes_file = self.processed_data_dir / f"nodes_{year}.csv"
            nodes_year.to_csv(nodes_file, index=False)
            logger.info(f"Saved {len(nodes_year)} nodes to {nodes_file}")
            
            # Save edges for this year
            if not edges_df.empty:
                edges_year = edges_df[edges_df['year'] == year]
                edges_file = self.processed_data_dir / f"edges_{year}.csv"
                edges_year.to_csv(edges_file, index=False)
                logger.info(f"Saved {len(edges_year)} edges to {edges_file}")
    
    def process_all(self) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Complete preprocessing pipeline
        
        Returns:
            Tuple of (nodes_df, edges_df)
        """
        logger.info("Starting data preprocessing pipeline...")
        
        # Load raw data
        raw_data = self.load_raw_data()
        
        # Clean data
        production_clean = self.clean_data(raw_data['production'], 'production')
        trade_clean = self.clean_data(raw_data['trade'], 'trade')
        food_supply_clean = self.clean_data(raw_data['food_supply'], 'food_supply')
        bilateral_clean = self.clean_data(raw_data['bilateral_trade'], 'bilateral_trade')
        
        # Calculate attributes
        nodes_df = self.calculate_node_attributes(
            production_clean,
            trade_clean,
            food_supply_clean
        )
        
        edges_df = self.calculate_edge_attributes(
            bilateral_clean,
            nodes_df
        )
        
        # Save processed data
        self.save_processed_data(nodes_df, edges_df)
        
        logger.info("Preprocessing complete!")
        
        return nodes_df, edges_df


if __name__ == "__main__":
    # Test the preprocessor
    preprocessor = DataPreprocessor()
    nodes, edges = preprocessor.process_all()
    
    print("\n=== Preprocessing Summary ===")
    print(f"Nodes: {len(nodes)}")
    print(f"Edges: {len(edges)}")
    print(f"\nNode attributes: {list(nodes.columns)}")
    print(f"Edge attributes: {list(edges.columns)}")
