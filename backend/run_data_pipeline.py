"""
Main data pipeline script
Orchestrates data fetching, preprocessing, and validation
"""
import argparse
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.data.fetcher import DataFetcher
from app.data.synthetic import SyntheticDataGenerator
from app.data.preprocessor import DataPreprocessor
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


def run_pipeline(use_synthetic: bool = False, skip_fetch: bool = False):
    """
    Run the complete data pipeline
    
    Args:
        use_synthetic: If True, generate synthetic data instead of fetching
        skip_fetch: If True, skip fetching and use existing raw data
    """
    logger.info("="*60)
    logger.info("PHASE 2: DATA COLLECTION & PREPROCESSING PIPELINE")
    logger.info("="*60)
    
    # Step 1: Data Fetching/Generation
    if not skip_fetch:
        if use_synthetic:
            logger.info("\n[Step 1/3] Generating synthetic data...")
            generator = SyntheticDataGenerator()
            raw_data = generator.generate_all()
        else:
            logger.info("\n[Step 1/3] Fetching real data from APIs...")
            try:
                fetcher = DataFetcher()
                raw_data = fetcher.fetch_all_mvp_data()
                
                # Check if we got any data
                if all(df.empty for df in raw_data.values()):
                    logger.warning("No data fetched from APIs, falling back to synthetic data...")
                    generator = SyntheticDataGenerator()
                    raw_data = generator.generate_all()
            except Exception as e:
                logger.error(f"Error fetching data: {e}")
                logger.info("Falling back to synthetic data...")
                generator = SyntheticDataGenerator()
                raw_data = generator.generate_all()
    else:
        logger.info("\n[Step 1/3] Skipping data fetch (using existing raw data)...")
    
    # Step 2: Data Preprocessing
    logger.info("\n[Step 2/3] Preprocessing data...")
    try:
        preprocessor = DataPreprocessor()
        nodes_df, edges_df = preprocessor.process_all()
        
        logger.info(f"✅ Processed {len(nodes_df)} nodes and {len(edges_df)} edges")
    except Exception as e:
        logger.error(f"Error during preprocessing: {e}")
        raise
    
    # Step 3: Data Validation
    logger.info("\n[Step 3/3] Validating processed data...")
    validation_passed = validate_data(nodes_df, edges_df)
    
    if validation_passed:
        logger.info("\n" + "="*60)
        logger.info("✅ PHASE 2 COMPLETE!")
        logger.info("="*60)
        logger.info(f"\nData Summary:")
        logger.info(f"  - Countries: 5 (IND, USA, BRA, EGY, CHN)")
        logger.info(f"  - Years: 4 (2018-2021)")
        logger.info(f"  - Total Nodes: {len(nodes_df)}")
        logger.info(f"  - Total Edges: {len(edges_df)}")
        logger.info(f"\nNode Attributes ({len(nodes_df.columns)}):")
        for col in nodes_df.columns:
            logger.info(f"  - {col}")
        logger.info(f"\nEdge Attributes ({len(edges_df.columns)}):")
        for col in edges_df.columns:
            logger.info(f"  - {col}")
        logger.info(f"\nProcessed data saved to:")
        logger.info(f"  {preprocessor.processed_data_dir}")
        logger.info("\nNext: Phase 3 - Neo4j Graph Storage")
        return True
    else:
        logger.error("❌ Data validation failed!")
        return False


def validate_data(nodes_df, edges_df) -> bool:
    """
    Validate processed data
    
    Returns:
        True if validation passes, False otherwise
    """
    logger.info("Running validation checks...")
    
    checks_passed = 0
    checks_failed = 0
    
    # Check 1: Node count
    expected_nodes = 5 * 4  # 5 countries * 4 years
    if len(nodes_df) == expected_nodes:
        logger.info(f"✅ Node count: {len(nodes_df)} (expected {expected_nodes})")
        checks_passed += 1
    else:
        logger.error(f"❌ Node count: {len(nodes_df)} (expected {expected_nodes})")
        checks_failed += 1
    
    # Check 2: Required node attributes
    required_node_attrs = [
        'iso_code', 'name', 'year', 'production_total',
        'food_supply_per_capita', 'import_dependency_ratio',
        'export_dependency_ratio', 'node_confidence_weight'
    ]
    missing_attrs = set(required_node_attrs) - set(nodes_df.columns)
    if not missing_attrs:
        logger.info(f"✅ All required node attributes present")
        checks_passed += 1
    else:
        logger.error(f"❌ Missing node attributes: {missing_attrs}")
        checks_failed += 1
    
    # Check 3: No null values in critical fields
    critical_fields = ['iso_code', 'year', 'production_total']
    null_counts = nodes_df[critical_fields].isnull().sum()
    if null_counts.sum() == 0:
        logger.info(f"✅ No null values in critical fields")
        checks_passed += 1
    else:
        logger.error(f"❌ Null values found: {null_counts[null_counts > 0]}")
        checks_failed += 1
    
    # Check 4: Edge count (should have trade relationships)
    if len(edges_df) > 0:
        logger.info(f"✅ Edge count: {len(edges_df)}")
        checks_passed += 1
    else:
        logger.warning(f"⚠️  No edges found (graph will be disconnected)")
        checks_failed += 1
    
    # Check 5: Required edge attributes
    if not edges_df.empty:
        required_edge_attrs = [
            'exporter', 'importer', 'commodity', 'year',
            'trade_quantity', 'trade_share'
        ]
        missing_edge_attrs = set(required_edge_attrs) - set(edges_df.columns)
        if not missing_edge_attrs:
            logger.info(f"✅ All required edge attributes present")
            checks_passed += 1
        else:
            logger.error(f"❌ Missing edge attributes: {missing_edge_attrs}")
            checks_failed += 1
    
    # Check 6: Value ranges
    if nodes_df['production_total'].min() >= 0:
        logger.info(f"✅ Production values are non-negative")
        checks_passed += 1
    else:
        logger.error(f"❌ Negative production values found")
        checks_failed += 1
    
    if nodes_df['import_dependency_ratio'].between(0, 1).all():
        logger.info(f"✅ Import dependency ratios in valid range [0,1]")
        checks_passed += 1
    else:
        logger.error(f"❌ Import dependency ratios out of range")
        checks_failed += 1
    
    # Summary
    logger.info(f"\nValidation Summary:")
    logger.info(f"  Checks Passed: {checks_passed}")
    logger.info(f"  Checks Failed: {checks_failed}")
    
    return checks_failed == 0


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Phase 2: Data Collection & Preprocessing Pipeline"
    )
    parser.add_argument(
        '--synthetic',
        action='store_true',
        help='Use synthetic data instead of fetching from APIs'
    )
    parser.add_argument(
        '--skip-fetch',
        action='store_true',
        help='Skip data fetching and use existing raw data'
    )
    
    args = parser.parse_args()
    
    try:
        success = run_pipeline(
            use_synthetic=args.synthetic,
            skip_fetch=args.skip_fetch
        )
        sys.exit(0 if success else 1)
    except Exception as e:
        logger.error(f"Pipeline failed: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
