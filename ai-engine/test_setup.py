"""Test script to verify all dependencies are installed correctly"""

import sys
import os
import importlib
from typing import Tuple, List

def test_python_version() -> bool:
    """Test Python version"""
    print("🐍 Testing Python version...")
    
    version = sys.version_info
    required = (3, 8)
    
    if version >= required:
        print(f"  ✅ Python {version.major}.{version.minor}.{version.micro} (required: {required[0]}.{required[1]}+)")
        return True
    else:
        print(f"  ❌ Python {version.major}.{version.minor}.{version.micro} (required: {required[0]}.{required[1]}+)")
        return False

def test_imports() -> Tuple[int, int]:
    """Test all critical imports"""
    print("\n📦 Testing package imports...")
    
    # Core packages with version checks
    core_tests = [
        ("numpy", "np", "import numpy as np; print(f'  NumPy: {np.__version__}')"),
        ("pandas", "pd", "import pandas as pd; print(f'  Pandas: {pd.__version__}')"),
        ("scipy", "scipy", "import scipy; print(f'  SciPy: {scipy.__version__}')"),
    ]
    
    # ML/AI packages
    ml_tests = [
        ("torch", "torch", "import torch; print(f'  PyTorch: {torch.__version__}')"),
        ("transformers", "transformers", "import transformers; print(f'  Transformers: {transformers.__version__}')"),
        ("sklearn", "sklearn", "import sklearn; print(f'  Scikit-learn: {sklearn.__version__}')"),
        ("sentence_transformers", "sentence_transformers", "from sentence_transformers import SentenceTransformer; print('  SentenceTransformers: OK')"),
    ]
    
    # NLP packages
    nlp_tests = [
        ("spacy", "spacy", "import spacy; print(f'  spaCy: {spacy.__version__}')"),
        ("nltk", "nltk", "import nltk; print(f'  NLTK: {nltk.__version__}')"),
        ("textblob", "textblob", "from textblob import TextBlob; print('  TextBlob: OK')"),
        ("vaderSentiment", "vader", "from nltk.sentiment.vader import SentimentIntensityAnalyzer; print('  VADER: OK')"),
    ]
    
    # API and utility packages
    util_tests = [
        ("openai", "openai", "import openai; print(f'  OpenAI: {openai.__version__}')"),
        ("yfinance", "yf", "import yfinance as yf; print('  yfinance: OK')"),
        ("web3", "web3", "from web3 import Web3; print('  Web3: OK')"),
        ("tweepy", "tweepy", "import tweepy; print(f'  Tweepy: {tweepy.__version__}')"),
        ("praw", "praw", "import praw; print(f'  PRAW: {praw.__version__}')"),
        ("aiohttp", "aiohttp", "import aiohttp; print(f'  aiohttp: {aiohttp.__version__}')"),
        ("redis", "redis", "import redis; print(f'  Redis: {redis.__version__}')"),
    ]
    
    all_tests = core_tests + ml_tests + nlp_tests + util_tests
    passed = 0
    failed = 0
    
    for name, alias, test_code in all_tests:
        try:
            exec(test_code)
            passed += 1
        except ImportError:
            print(f"  ❌ {name}: Not installed")
            failed += 1
        except Exception as e:
            print(f"  ⚠️  {name}: {str(e)}")
            failed += 1
    
    return passed, failed

def test_spacy_models() -> bool:
    """Test spaCy models"""
    print("\n🧠 Testing spaCy models...")
    
    try:
        import spacy
        
        models_to_test = [
            ("en_core_web_sm", "English small model"),
            ("en_core_web_lg", "English large model")
        ]
        
        all_loaded = True
        
        for model_name, description in models_to_test:
            try:
                nlp = spacy.load(model_name)
                print(f"  ✅ {model_name} ({description})")
            except OSError:
                print(f"  ❌ {model_name} ({description}) - Not found")
                all_loaded = False
        
        return all_loaded
        
    except ImportError:
        print("  ❌ spaCy not installed")
        return False

def test_nltk_data() -> bool:
    """Test NLTK data"""
    print("\n📖 Testing NLTK data...") 
    
    try:
        import nltk
        
        nltk_datasets = [
            ('tokenizers/punkt', 'Punkt Tokenizer'),
            ('sentiment/vader_lexicon.txt', 'VADER Lexicon'),
            ('corpora/stopwords', 'Stopwords'),
            ('taggers/averaged_perceptron_tagger', 'POS Tagger'),
            ('corpora/wordnet', 'WordNet'),
        ]
        
        all_found = True
        
        for dataset_path, name in nltk_datasets:
            try:
                nltk.data.find(dataset_path)
                print(f"  ✅ {name}")
            except LookupError:
                print(f"  ❌ {name} - Not found")
                all_found = False
        
        return all_found
        
    except ImportError:
        print("  ❌ NLTK not installed")
        return False

def test_transformer_models() -> bool:
    """Test transformer models"""
    print("\n🤖 Testing Transformer models...")
    
    try:
        from transformers import pipeline
        
        models_to_test = [
            ("ProsusAI/finbert", "FinBERT"),
            ("j-hartmann/emotion-english-distilroberta-base", "Emotion Model")
        ]
        
        all_loaded = True
        
        for model_name, description in models_to_test:
            try:
                # Test loading (this might download the model if not cached)
                if "finbert" in model_name.lower():
                    pipe = pipeline("sentiment-analysis", model=model_name)
                    result = pipe("The market looks good today.")
                    print(f"  ✅ {description} - {result[0]['label']}")
                elif "emotion" in model_name.lower():
                    pipe = pipeline("text-classification", model=model_name)
                    result = pipe("I'm excited about this investment!")
                    print(f"  ✅ {description} - {result[0]['label']}")
                
            except Exception as e:
                print(f"  ❌ {description} - Error: {str(e)}")
                all_loaded = False
        
        return all_loaded
        
    except ImportError:
        print("  ❌ Transformers not installed")
        return False

def test_sentence_transformers() -> bool:
    """Test sentence transformers"""
    print("\n🔗 Testing Sentence Transformers...")
    
    try:
        from sentence_transformers import SentenceTransformer
        
        model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Test encoding
        sentences = ["Bitcoin is rising", "Market sentiment is positive"]
        embeddings = model.encode(sentences)
        
        print(f"  ✅ SentenceTransformer model loaded")
        print(f"  📊 Embedding shape: {embeddings.shape}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ SentenceTransformer error: {str(e)}")
        return False

def test_environment_file() -> bool:
    """Test environment file"""
    print("\n🔧 Testing environment configuration...")
    
    env_file = ".env"
    
    if os.path.exists(env_file):
        print(f"  ✅ {env_file} file found")
        
        # Check for required variables
        from dotenv import load_dotenv
        load_dotenv()
        
        required_vars = ['OPENAI_API_KEY']
        optional_vars = ['NEWSAPI_KEY', 'TWITTER_BEARER_TOKEN', 'REDDIT_CLIENT_ID']
        
        missing_required = []
        missing_optional = []
        
        for var in required_vars:
            if not os.getenv(var):
                missing_required.append(var)
            else:
                print(f"  ✅ {var} configured")
        
        for var in optional_vars:
            if not os.getenv(var):
                missing_optional.append(var)
            else:
                print(f"  ✅ {var} configured")
        
        if missing_required:
            print(f"  ❌ Missing required variables: {missing_required}")
            return False
        
        if missing_optional:
            print(f"  ⚠️  Missing optional variables: {missing_optional}")
        
        return True
        
    else:
        print(f"  ❌ {env_file} file not found")
        print("  💡 Create a .env file with your API keys")
        return False

def test_project_structure() -> bool:
    """Test project structure"""
    print("\n📁 Testing project structure...")
    
    required_files = [
        "requirements.txt",
        "advanced_nlp_processor.py",
        "research_engine.py",
        "main.py"
    ]
    
    all_found = True
    
    for file_name in required_files:
        if os.path.exists(file_name):
            print(f"  ✅ {file_name}")
        else:
            print(f"  ❌ {file_name} - Not found")
            all_found = False
    
    return all_found

def run_integration_test() -> bool:
    """Run basic integration test"""
    print("\n🔄 Running integration test...")
    
    try:
        # Test basic NLP functionality
        from textblob import TextBlob
        
        text = "Bitcoin is showing strong bullish momentum today."
        blob = TextBlob(text)
        sentiment = blob.sentiment.polarity
        
        print(f"  ✅ TextBlob sentiment: {sentiment:.2f}")
        
        # Test VADER
        from nltk.sentiment.vader import SentimentIntensityAnalyzer
        analyzer = SentimentIntensityAnalyzer()
        vader_scores = analyzer.polarity_scores(text)
        
        print(f"  ✅ VADER sentiment: {vader_scores['compound']:.2f}")
        
        # Test basic ML
        import numpy as np
        import pandas as pd
        
        data = pd.DataFrame({'price': [100, 102, 98, 105, 103]})
        returns = data['price'].pct_change().dropna()
        volatility = returns.std()
        
        print(f"  ✅ Price volatility calculation: {volatility:.4f}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Integration test failed: {str(e)}")
        return False

def main():
    """Main test function"""
    print("🧪 SocialFi AI Engine Setup Test")
    print("=" * 60)
    
    tests = [
        ("Python Version", test_python_version),
        ("Package Imports", lambda: test_imports()[1] == 0),  # No failures
        ("spaCy Models", test_spacy_models),
        ("NLTK Data", test_nltk_data),
        ("Transformer Models", test_transformer_models),
        ("Sentence Transformers", test_sentence_transformers),
        ("Environment Config", test_environment_file),
        ("Project Structure", test_project_structure),
        ("Integration Test", run_integration_test),
    ]
    
    passed_tests = 0
    total_tests = len(tests)
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed_tests += 1
            print()  # Add spacing between tests
        except Exception as e:
            print(f"  💥 {test_name} crashed: {str(e)}\n")
    
    # Final summary
    print("=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    print(f"✅ Passed: {passed_tests}/{total_tests}")
    print(f"❌ Failed: {total_tests - passed_tests}/{total_tests}")
    
    if passed_tests == total_tests:
        print("\n🎉 ALL TESTS PASSED!")
        print("🚀 Your SocialFi AI Engine is ready to run!")
        print("\n🏃 To start the engine:")
        print("   python main.py")
        print("   python main.py analyze BTC ETH")
        print("   python main.py monitor")
        return True
    else:
        print(f"\n⚠️  {total_tests - passed_tests} test(s) failed.")
        print("🔧 Please fix the issues above before running the AI Engine.")
        
        if passed_tests >= total_tests * 0.7:  # 70% passed
            print("\n💡 Most tests passed. You might be able to run with limited functionality:")
            print("   python main.py test")
        
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)