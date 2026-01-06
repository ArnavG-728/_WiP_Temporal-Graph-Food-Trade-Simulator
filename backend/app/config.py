"""
Configuration management for the application
"""
import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Application
    APP_NAME: str = "Temporal Graph Food Trade Simulator"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True
    
    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_PREFIX: str = "/api"
    
    # Neo4j Database
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = ""
    NEO4J_DATABASE: str = "neo4j"
    
    # Data paths
    BASE_DIR: Path = Path(__file__).parent.parent
    DATA_DIR: Path = BASE_DIR / "app" / "data"
    RAW_DATA_DIR: Path = DATA_DIR / "raw"
    PROCESSED_DATA_DIR: Path = DATA_DIR / "processed"
    
    # Model paths
    MODEL_DIR: Path = BASE_DIR / "app" / "models" / "checkpoints"
    
    # External APIs
    FAOSTAT_API_KEY: Optional[str] = None
    COMTRADE_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    
    # MVP Configuration
    MVP_COUNTRIES: list[str] = ["IND", "USA", "BRA", "EGY", "CHN"]
    MVP_YEARS: list[int] = [2018, 2019, 2020, 2021]
    
    # TGNN Configuration
    TGNN_HIDDEN_DIM: int = 64
    TGNN_NUM_LAYERS: int = 3
    TGNN_LEARNING_RATE: float = 0.001
    TGNN_EPOCHS: int = 200
    TGNN_BATCH_SIZE: int = 32
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Global settings instance
settings = Settings()

# Create directories if they don't exist
settings.RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.MODEL_DIR.mkdir(parents=True, exist_ok=True)
