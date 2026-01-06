"""
Synthetic data generator for MVP testing
Creates realistic food trade data when API data is unavailable
"""
import pandas as pd
import numpy as np
from pathlib import Path
from app.config import settings
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


class SyntheticDataGenerator:
    """Generate synthetic but realistic food trade data"""
    
    # Base production values (million tons) - realistic estimates
    BASE_PRODUCTION = {
        'IND': 310.5,  # India - major producer
        'USA': 420.3,  # USA - largest producer
        'BRA': 245.8,  # Brazil - major agricultural exporter
        'EGY': 25.4,   # Egypt - import-dependent
        'CHN': 615.2   # China - largest producer and consumer
    }
    
    # Base food supply (kcal/capita/day)
    BASE_FOOD_SUPPLY = {
        'IND': 2400,
        'USA': 3500,
        'BRA': 3100,
        'EGY': 3200,
        'CHN': 3000
    }
    
    # Import dependency ratios
    IMPORT_DEPENDENCY = {
        'IND': 0.15,
        'USA': 0.05,
        'BRA': 0.08,
        'EGY': 0.62,  # Highly import-dependent
        'CHN': 0.25
    }
    
    def __init__(self):
        self.countries = settings.MVP_COUNTRIES
        self.years = settings.MVP_YEARS
        self.raw_data_dir = settings.RAW_DATA_DIR
    
    def generate_production_data(self) -> pd.DataFrame:
        """Generate synthetic production data"""
        logger.info("Generating synthetic production data...")
        
        records = []
        
        for country in self.countries:
            base_prod = self.BASE_PRODUCTION[country]
            
            for year in self.years:
                # Add year-to-year variation (-5% to +10%)
                year_factor = 1 + np.random.uniform(-0.05, 0.10)
                production = base_prod * year_factor
                
                record = {
                    'area': country,
                    'area_code': self._get_country_code(country),
                    'year': year,
                    'item': 'Cereals, Total',
                    'element': 'Production',
                    'value': production * 1_000_000,  # Convert to tons
                    'unit': 'tonnes'
                }
                records.append(record)
        
        df = pd.DataFrame(records)
        logger.info(f"Generated {len(df)} production records")
        return df
    
    def generate_trade_data(self) -> pd.DataFrame:
        """Generate synthetic import/export data"""
        logger.info("Generating synthetic trade data...")
        
        records = []
        
        for country in self.countries:
            base_prod = self.BASE_PRODUCTION[country]
            import_ratio = self.IMPORT_DEPENDENCY[country]
            
            for year in self.years:
                year_factor = 1 + np.random.uniform(-0.05, 0.10)
                production = base_prod * year_factor
                
                # Imports
                imports = production * import_ratio * (1 + np.random.uniform(-0.1, 0.1))
                records.append({
                    'area': country,
                    'area_code': self._get_country_code(country),
                    'year': year,
                    'item': 'Cereals, Total',
                    'element': 'Import Quantity',
                    'value': imports * 1_000_000,
                    'unit': 'tonnes',
                    'trade_type': 'import'
                })
                
                # Exports (inverse of import dependency)
                export_ratio = max(0, 0.5 - import_ratio)
                exports = production * export_ratio * (1 + np.random.uniform(-0.1, 0.1))
                records.append({
                    'area': country,
                    'area_code': self._get_country_code(country),
                    'year': year,
                    'item': 'Cereals, Total',
                    'element': 'Export Quantity',
                    'value': exports * 1_000_000,
                    'unit': 'tonnes',
                    'trade_type': 'export'
                })
        
        df = pd.DataFrame(records)
        logger.info(f"Generated {len(df)} trade records")
        return df
    
    def generate_food_supply_data(self) -> pd.DataFrame:
        """Generate synthetic food supply data"""
        logger.info("Generating synthetic food supply data...")
        
        records = []
        
        for country in self.countries:
            base_supply = self.BASE_FOOD_SUPPLY[country]
            
            for year in self.years:
                # Small year-to-year variation
                supply = base_supply * (1 + np.random.uniform(-0.02, 0.03))
                
                record = {
                    'area': country,
                    'area_code': self._get_country_code(country),
                    'year': year,
                    'item': 'Grand Total + (Total)',
                    'element': 'Food supply (kcal/capita/day)',
                    'value': supply,
                    'unit': 'kcal/capita/day'
                }
                records.append(record)
        
        df = pd.DataFrame(records)
        logger.info(f"Generated {len(df)} food supply records")
        return df
    
    def generate_bilateral_trade_data(self) -> pd.DataFrame:
        """Generate synthetic bilateral trade flows"""
        logger.info("Generating synthetic bilateral trade data...")
        
        # Major trade relationships (exporter, importer, base_quantity in million tons)
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
            ('IND', 'USA', 'rice', 1.5),
            ('CHN', 'BRA', 'wheat', 2.0),
            ('EGY', 'IND', 'cotton', 0.5)
        ]
        
        records = []
        
        for year in self.years:
            for exporter, importer, commodity, base_qty in trade_patterns:
                # Add variation
                quantity = base_qty * (1 + np.random.uniform(-0.15, 0.15))
                
                record = {
                    'reporterISO': exporter,
                    'partnerISO': importer,
                    'period': year,
                    'cmdCode': commodity,
                    'flowCode': 'X',  # Export
                    'primaryValue': quantity * 1_000_000,  # Convert to tons
                    'netWgt': quantity * 1_000_000
                }
                records.append(record)
        
        df = pd.DataFrame(records)
        logger.info(f"Generated {len(df)} bilateral trade records")
        return df
    
    def _get_country_code(self, iso3: str) -> int:
        """Get numeric country code"""
        codes = {
            'IND': 100,
            'USA': 231,
            'BRA': 21,
            'EGY': 59,
            'CHN': 41
        }
        return codes.get(iso3, 0)
    
    def generate_all(self) -> dict:
        """Generate all synthetic data"""
        logger.info("Generating all synthetic data...")
        
        data = {
            'production': self.generate_production_data(),
            'trade': self.generate_trade_data(),
            'food_supply': self.generate_food_supply_data(),
            'bilateral_trade': self.generate_bilateral_trade_data()
        }
        
        # Save to raw data directory
        for key, df in data.items():
            filepath = self.raw_data_dir / f"{key}.csv"
            df.to_csv(filepath, index=False)
            logger.info(f"Saved {key} to {filepath}")
        
        logger.info("Synthetic data generation complete!")
        return data


if __name__ == "__main__":
    generator = SyntheticDataGenerator()
    data = generator.generate_all()
    
    print("\n=== Synthetic Data Summary ===")
    for key, df in data.items():
        print(f"{key}: {len(df)} records")
