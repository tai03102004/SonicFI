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
    
    required_datasets = [
        ('tokenizers/punkt', 'Punkt Tokenizer'),
        ('vader_lexicon', 'VADER Lexicon'),
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
            all_good = False
    
    return all_good

if __name__ == "__main__":
    print("🚀 NLTK Data Downloader for SocialFi AI Engine")
    print("=" * 50)
    
    # Download datasets
    success, failed = download_nltk_data()
    
    # Verify downloads
    verified = verify_downloads()
    
    print("\n" + "=" * 50)
    
    if verified and failed == 0:
        print("🎉 All NLTK data downloaded and verified successfully!")
        sys.exit(0)
    elif failed > 0:
        print(f"⚠️  {failed} datasets failed to download. Retrying might help.")
        sys.exit(1)
    else:
        print("❌ Some critical datasets are missing. Please check your internet connection.")
        sys.exit(1)