"""
Quick verification script to test backend setup
Run this after pip install completes
"""
import sys

def test_imports():
    """Test all critical imports"""
    print("🧪 Testing Backend Dependencies\n")
    
    tests_passed = 0
    tests_failed = 0
    
    # Test 1: FastAPI
    try:
        import fastapi
        print(f"✅ FastAPI {fastapi.__version__}")
        tests_passed += 1
    except ImportError as e:
        print(f"❌ FastAPI: {e}")
        tests_failed += 1
    
    # Test 2: Uvicorn
    try:
        import uvicorn
        print(f"✅ Uvicorn {uvicorn.__version__}")
        tests_passed += 1
    except ImportError as e:
        print(f"❌ Uvicorn: {e}")
        tests_failed += 1
    
    # Test 3: Pydantic
    try:
        import pydantic
        print(f"✅ Pydantic {pydantic.__version__}")
        tests_passed += 1
    except ImportError as e:
        print(f"❌ Pydantic: {e}")
        tests_failed += 1
    
    # Test 4: Neo4j
    try:
        import neo4j
        print(f"✅ Neo4j Driver {neo4j.__version__}")
        tests_passed += 1
    except ImportError as e:
        print(f"❌ Neo4j: {e}")
        tests_failed += 1
    
    # Test 5: PyTorch
    try:
        import torch
        print(f"✅ PyTorch {torch.__version__}")
        print(f"   CUDA Available: {torch.cuda.is_available()}")
        if torch.cuda.is_available():
            print(f"   CUDA Version: {torch.version.cuda}")
            print(f"   GPU: {torch.cuda.get_device_name(0)}")
        tests_passed += 1
    except ImportError as e:
        print(f"❌ PyTorch: {e}")
        tests_failed += 1
    
    # Test 6: PyTorch Geometric
    try:
        import torch_geometric
        print(f"✅ PyTorch Geometric {torch_geometric.__version__}")
        tests_passed += 1
    except ImportError as e:
        print(f"❌ PyTorch Geometric: {e}")
        tests_failed += 1
    
    # Test 7: Pandas
    try:
        import pandas
        print(f"✅ Pandas {pandas.__version__}")
        tests_passed += 1
    except ImportError as e:
        print(f"❌ Pandas: {e}")
        tests_failed += 1
    
    # Test 8: NumPy
    try:
        import numpy
        print(f"✅ NumPy {numpy.__version__}")
        tests_passed += 1
    except ImportError as e:
        print(f"❌ NumPy: {e}")
        tests_failed += 1
    
    # Test 9: Google Generative AI
    try:
        import google.generativeai as genai
        print(f"✅ Google Generative AI (Gemini)")
        tests_passed += 1
    except ImportError as e:
        print(f"❌ Google Generative AI: {e}")
        tests_failed += 1
    
    # Test 10: App modules
    try:
        from app.config import settings
        print(f"✅ App Config: {settings.APP_NAME}")
        tests_passed += 1
    except ImportError as e:
        print(f"❌ App Config: {e}")
        tests_failed += 1
    
    try:
        from app.utils.logger import setup_logger
        print(f"✅ App Logger")
        tests_passed += 1
    except ImportError as e:
        print(f"❌ App Logger: {e}")
        tests_failed += 1
    
    # Summary
    print(f"\n{'='*50}")
    print(f"Tests Passed: {tests_passed}")
    print(f"Tests Failed: {tests_failed}")
    print(f"{'='*50}\n")
    
    if tests_failed == 0:
        print("🎉 All tests passed! Backend is ready.")
        print("\nNext steps:")
        print("1. Configure .env file with your credentials")
        print("2. Run: python -m app.main")
        print("3. Visit: http://localhost:8000/health")
        return 0
    else:
        print("⚠️  Some tests failed. Please install missing dependencies.")
        return 1

if __name__ == "__main__":
    sys.exit(test_imports())
