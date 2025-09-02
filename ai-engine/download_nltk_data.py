import nltk
import ssl
import sys
import os

# Fix SSL certificate issue on macOS
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

def download_nltk_data():
    """Download required NLTK data"""
    print("🔗 Downloading NLTK datasets...")
    
    datasets = [
        'punkt',           # Sentence tokenizer
        'vader_lexicon',   # VADER sentiment lexicon
        'stopwords',       # Stop words
        'averaged_perceptron_tagger',  # POS tagger
        'wordnet',         # WordNet
        'omw-1.4',         # Open Multilingual Wordnet
        'brown',           # Brown corpus
        'movie_reviews',   # Movie reviews corpus
        'subjectivity',    # Subjectivity corpus
        'reuters',         # Reuters corpus
        'names',           # Names corpus
        'words',           # Word list
        'maxent_ne_chunker', # Named entity chunker
        'conll2000'        # CoNLL-2000 chunking corpus
    ]
    
    success_count = 0
    failure_count = 0
    
    for dataset in datasets:
        try:
            print(f"  📦 Downloading {dataset}...", end=' ')
            nltk.download(dataset, quiet=True)
            print("✅")
            success_count += 1
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            failure_count += 1
    
    print(f"\n📊 Download Summary:")
    print(f"  ✅ Successful: {success_count}")
    print(f"  ❌ Failed: {failure_count}")
    print(f"  📁 NLTK Data Path: {nltk.data.path}")
    
    return success_count, failure_count

def verify_downloads():
    """Verify that critical NLTK data is available"""
    print("\n🔍 Verifying NLTK downloads...")
    
    # CẬP NHẬT: Paths chính xác cho VADER lexicon
    required_datasets = [
        ('tokenizers/punkt', 'Punkt Tokenizer'),
        ('vader_lexicon/vader_lexicon.txt', 'VADER Lexicon'),  # Đường dẫn chính xác
        ('corpora/stopwords', 'Stopwords'),
        ('taggers/averaged_perceptron_tagger', 'POS Tagger')
    ]
    
    all_good = True
    
    for dataset_path, name in required_datasets:
        try:
            nltk.data.find(dataset_path)
            print(f"  ✅ {name}")
        except LookupError:
            print(f"  ❌ {name} - NOT FOUND")
            # THÊM: Thử path alternatives cho VADER
            if 'vader' in dataset_path.lower():
                alternative_paths = [
                    'vader_lexicon',
                    'corpora/vader_lexicon',
                    'sentiment/vader_lexicon'
                ]
                found_alternative = False
                for alt_path in alternative_paths:
                    try:
                        nltk.data.find(alt_path)
                        print(f"    ✅ Found at alternative path: {alt_path}")
                        found_alternative = True
                        break
                    except LookupError:
                        continue
                
                if not found_alternative:
                    all_good = False
            else:
                all_good = False
    
    return all_good

def test_nltk_functionality():
    """Test NLTK functionality to make sure everything works"""
    print("\n🧪 Testing NLTK functionality...")
    
    try:
        # Test tokenization
        from nltk.tokenize import word_tokenize, sent_tokenize
        text = "Hello world! This is a test."
        tokens = word_tokenize(text)
        sentences = sent_tokenize(text)
        print(f"  ✅ Tokenization works: {len(tokens)} tokens, {len(sentences)} sentences")
        
        # Test VADER sentiment
        from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
        analyzer = SentimentIntensityAnalyzer()
        sentiment = analyzer.polarity_scores("This is a great day!")
        print(f"  ✅ VADER sentiment works: {sentiment['compound']:.2f}")
        
        # Test stopwords
        from nltk.corpus import stopwords
        stop_words = set(stopwords.words('english'))
        print(f"  ✅ Stopwords loaded: {len(stop_words)} words")
        
        # Test POS tagging
        from nltk import pos_tag
        pos_tags = pos_tag(tokens)
        print(f"  ✅ POS tagging works: {len(pos_tags)} tagged tokens")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Functionality test failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 NLTK Data Downloader for SocialFi AI Engine")
    print("=" * 50)
    
    # Download datasets
    success, failed = download_nltk_data()
    
    # Verify downloads
    verified = verify_downloads()
    
    # Test functionality
    functionality_ok = test_nltk_functionality()
    
    print("\n" + "=" * 50)
    
    if functionality_ok and failed == 0:
        print("🎉 All NLTK data downloaded and verified successfully!")
        print("✅ All functionality tests passed!")
        sys.exit(0)
    elif failed > 0:
        print(f"⚠️  {failed} datasets failed to download. Retrying might help.")
        if functionality_ok:
            print("💡 But basic functionality works, you can continue!")
        sys.exit(1)
    else:
        print("❌ Some critical datasets are missing. Please check your internet connection.")
        if functionality_ok:
            print("💡 But basic functionality works, you can continue!")
            sys.exit(0)
        sys.exit(1)