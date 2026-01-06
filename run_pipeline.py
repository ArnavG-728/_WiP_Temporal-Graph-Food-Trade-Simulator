"""
Main Data Pipeline Runner
Orchestrates loading, cleaning, and preprocessing of real FAOSTAT data
"""
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.append(str(backend_path))

from backend.app.data.preprocessor import DataPreprocessor

def main():
    print("\n🚀 Starting Global Food Trade Data Pipeline...")
    
    # Initialize preprocessor
    # It will look for raw CSVs in backend/app/data/raw/
    prep = DataPreprocessor(years=[2018, 2019, 2020, 2021])
    
    try:
        prep.run_pipeline()
        print("\n✅ Pipeline Finished Successfully!")
        print("Processed files are in: backend/app/data/processed/")
    except Exception as e:
        print(f"\n❌ Pipeline Failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
