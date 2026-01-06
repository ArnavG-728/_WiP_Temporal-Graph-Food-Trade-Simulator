"""
Data fetcher for FAOSTAT and UN Comtrade APIs
Fetches food production, trade, and supply data for MVP countries
"""
import os
import time
import requests
import pandas as pd
from pathlib import Path
from typing import Dict, List, Optional
from app.config import settings
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


class FAOSTATFetcher:
    """Fetcher for FAOSTAT data"""
    
    BASE_URL = "https://fenixservices.fao.org/faostat/api/v1/en/data"
    
    # FAOSTAT domain codes
    DOMAINS = {
        'production': 'QCL',  # Crops and livestock products
        'trade': 'TM',        # Trade: Crops and Livestock Products
        'food_balance': 'FBS' # Food Balance Sheets
    }
    
    # Element codes for different metrics
    ELEMENTS = {
        'production': '5510',      # Production
        'yield': '5421',           # Yield
        'area_harvested': '5312',  # Area harvested
        'import_quantity': '5610', # Import Quantity
        'export_quantity': '5910', # Export Quantity
        'food_supply': '664',      # Food supply quantity (kg/capita/yr)
        'food_supply_kcal': '664'  # Food supply (kcal/capita/day)
    }
    
    # Item codes for major commodities
    ITEMS = {
        'wheat': '15',
        'rice': '27',
        'maize': '56',
        'soybeans': '236',
        'cereals_total': '2905',
        'food_total': '2901'
    }
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.FAOSTAT_API_KEY
        self.session = requests.Session()
        
    def fetch_production_data(
        self, 
        countries: List[str], 
        years: List[int],
        items: Optional[List[str]] = None
    ) -> pd.DataFrame:
        """
        Fetch production data for specified countries and years
        
        Args:
            countries: List of ISO3 country codes (e.g., ['IND', 'USA'])
            years: List of years (e.g., [2018, 2019, 2020, 2021])
            items: List of item codes (default: cereals_total)
            
        Returns:
            DataFrame with production data
        """
        logger.info(f"Fetching production data for {countries} ({min(years)}-{max(years)})")
        
        if items is None:
            items = [self.ITEMS['cereals_total']]
        
        params = {
            'area': ','.join(countries),
            'element': self.ELEMENTS['production'],
            'item': ','.join(items),
            'year': ','.join(map(str, years)),
            'show_codes': 'true',
            'show_unit': 'true',
            'show_flags': 'true',
            'null_values': 'false',
            'output_type': 'csv'
        }
        
        try:
            response = self.session.get(
                f"{self.BASE_URL}/{self.DOMAINS['production']}",
                params=params,
                timeout=60
            )
            response.raise_for_status()
            
            # Parse CSV response
            from io import StringIO
            df = pd.read_csv(StringIO(response.text))
            
            logger.info(f"Fetched {len(df)} production records")
            return df
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching production data: {e}")
            return pd.DataFrame()
    
    def fetch_trade_data(
        self,
        countries: List[str],
        years: List[int],
        items: Optional[List[str]] = None
    ) -> pd.DataFrame:
        """
        Fetch import/export data for specified countries and years
        
        Args:
            countries: List of ISO3 country codes
            years: List of years
            items: List of item codes
            
        Returns:
            DataFrame with trade data (imports and exports)
        """
        logger.info(f"Fetching trade data for {countries} ({min(years)}-{max(years)})")
        
        if items is None:
            items = [self.ITEMS['cereals_total']]
        
        # Fetch imports
        import_params = {
            'area': ','.join(countries),
            'element': self.ELEMENTS['import_quantity'],
            'item': ','.join(items),
            'year': ','.join(map(str, years)),
            'show_codes': 'true',
            'output_type': 'csv'
        }
        
        # Fetch exports
        export_params = {
            'area': ','.join(countries),
            'element': self.ELEMENTS['export_quantity'],
            'item': ','.join(items),
            'year': ','.join(map(str, years)),
            'show_codes': 'true',
            'output_type': 'csv'
        }
        
        try:
            # Get imports
            import_response = self.session.get(
                f"{self.BASE_URL}/{self.DOMAINS['trade']}",
                params=import_params,
                timeout=60
            )
            import_response.raise_for_status()
            
            time.sleep(1)  # Rate limiting
            
            # Get exports
            export_response = self.session.get(
                f"{self.BASE_URL}/{self.DOMAINS['trade']}",
                params=export_params,
                timeout=60
            )
            export_response.raise_for_status()
            
            from io import StringIO
            imports_df = pd.read_csv(StringIO(import_response.text))
            exports_df = pd.read_csv(StringIO(export_response.text))
            
            # Combine
            imports_df['trade_type'] = 'import'
            exports_df['trade_type'] = 'export'
            df = pd.concat([imports_df, exports_df], ignore_index=True)
            
            logger.info(f"Fetched {len(df)} trade records")
            return df
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching trade data: {e}")
            return pd.DataFrame()
    
    def fetch_food_supply_data(
        self,
        countries: List[str],
        years: List[int]
    ) -> pd.DataFrame:
        """
        Fetch food supply data (kcal/capita/day)
        
        Args:
            countries: List of ISO3 country codes
            years: List of years
            
        Returns:
            DataFrame with food supply data
        """
        logger.info(f"Fetching food supply data for {countries} ({min(years)}-{max(years)})")
        
        params = {
            'area': ','.join(countries),
            'element': self.ELEMENTS['food_supply_kcal'],
            'item': self.ITEMS['food_total'],
            'year': ','.join(map(str, years)),
            'show_codes': 'true',
            'output_type': 'csv'
        }
        
        try:
            response = self.session.get(
                f"{self.BASE_URL}/{self.DOMAINS['food_balance']}",
                params=params,
                timeout=60
            )
            response.raise_for_status()
            
            from io import StringIO
            df = pd.read_csv(StringIO(response.text))
            
            logger.info(f"Fetched {len(df)} food supply records")
            return df
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching food supply data: {e}")
            return pd.DataFrame()


class ComtradeFetcher:
    """Fetcher for UN Comtrade bilateral trade data"""
    
    BASE_URL = "https://comtradeapi.un.org/data/v1/get"
    
    # HS commodity codes for food products
    COMMODITIES = {
        'wheat': '1001',
        'rice': '1006',
        'maize': '1005',
        'soybeans': '1201',
        'all_cereals': '10'  # Chapter 10: Cereals
    }
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.COMTRADE_API_KEY
        self.session = requests.Session()
        if self.api_key:
            self.session.headers.update({'Ocp-Apim-Subscription-Key': self.api_key})
    
    def fetch_bilateral_trade(
        self,
        reporter: str,
        partners: List[str],
        years: List[int],
        commodity: str = 'all_cereals'
    ) -> pd.DataFrame:
        """
        Fetch bilateral trade flows between countries
        
        Args:
            reporter: ISO3 code of reporting country
            partners: List of ISO3 codes of partner countries
            years: List of years
            commodity: Commodity code
            
        Returns:
            DataFrame with bilateral trade flows
        """
        logger.info(f"Fetching bilateral trade: {reporter} <-> {partners}")
        
        all_data = []
        
        for year in years:
            for partner in partners:
                params = {
                    'reporterCode': reporter,
                    'partnerCode': partner,
                    'period': str(year),
                    'cmdCode': self.COMMODITIES.get(commodity, commodity),
                    'flowCode': 'M,X',  # M=Import, X=Export
                    'format': 'json'
                }
                
                try:
                    response = self.session.get(
                        f"{self.BASE_URL}/C/A/{reporter}",
                        params=params,
                        timeout=60
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        if 'data' in data and data['data']:
                            all_data.extend(data['data'])
                    
                    time.sleep(1)  # Rate limiting (1 request per second)
                    
                except requests.exceptions.RequestException as e:
                    logger.warning(f"Error fetching {reporter}-{partner} ({year}): {e}")
                    continue
        
        if all_data:
            df = pd.DataFrame(all_data)
            logger.info(f"Fetched {len(df)} bilateral trade records")
            return df
        else:
            logger.warning("No bilateral trade data fetched")
            return pd.DataFrame()


class DataFetcher:
    """Main data fetcher coordinating FAOSTAT and Comtrade"""
    
    def __init__(self):
        self.faostat = FAOSTATFetcher()
        self.comtrade = ComtradeFetcher()
        self.raw_data_dir = settings.RAW_DATA_DIR
        
    def fetch_all_mvp_data(self) -> Dict[str, pd.DataFrame]:
        """
        Fetch all data for MVP countries and years
        
        Returns:
            Dictionary of DataFrames with all fetched data
        """
        countries = settings.MVP_COUNTRIES
        years = settings.MVP_YEARS
        
        logger.info(f"Starting data fetch for MVP: {countries}, {years}")
        
        data = {}
        
        # 1. Production data
        logger.info("Fetching production data...")
        data['production'] = self.faostat.fetch_production_data(countries, years)
        self._save_raw(data['production'], 'production.csv')
        
        # 2. Trade data (aggregated)
        logger.info("Fetching trade data...")
        data['trade'] = self.faostat.fetch_trade_data(countries, years)
        self._save_raw(data['trade'], 'trade.csv')
        
        # 3. Food supply data
        logger.info("Fetching food supply data...")
        data['food_supply'] = self.faostat.fetch_food_supply_data(countries, years)
        self._save_raw(data['food_supply'], 'food_supply.csv')
        
        # 4. Bilateral trade flows (Comtrade)
        logger.info("Fetching bilateral trade flows...")
        bilateral_data = []
        for reporter in countries:
            partners = [c for c in countries if c != reporter]
            df = self.comtrade.fetch_bilateral_trade(reporter, partners, years)
            if not df.empty:
                bilateral_data.append(df)
        
        if bilateral_data:
            data['bilateral_trade'] = pd.concat(bilateral_data, ignore_index=True)
            self._save_raw(data['bilateral_trade'], 'bilateral_trade.csv')
        
        logger.info("Data fetch complete!")
        return data
    
    def _save_raw(self, df: pd.DataFrame, filename: str):
        """Save raw data to CSV"""
        if not df.empty:
            filepath = self.raw_data_dir / filename
            df.to_csv(filepath, index=False)
            logger.info(f"Saved {len(df)} records to {filepath}")


if __name__ == "__main__":
    # Test the fetcher
    fetcher = DataFetcher()
    data = fetcher.fetch_all_mvp_data()
    
    print("\n=== Data Fetch Summary ===")
    for key, df in data.items():
        print(f"{key}: {len(df)} records")
