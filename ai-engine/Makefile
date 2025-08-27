.PHONY: setup install clean test run dev

# Setup everything
setup:
    @echo "🚀 Setting up AI Engine..."
    chmod +x setup.sh
    ./setup.sh

# Install dependencies only
install:
    @echo "📦 Installing dependencies..."
    pip install -r requirements.txt

# Clean environment
clean:
    @echo "🧹 Cleaning up..."
    rm -rf venv/
    rm -rf __pycache__/
    rm -rf .pytest_cache/
    find . -name "*.pyc" -delete

# Run tests
test:
    @echo "🧪 Running tests..."
    python -m pytest tests/ -v

# Run main application
run:
    @echo "🏃 Running AI Engine..."
    python main.py

# Development mode with auto-reload
dev:
    @echo "🔧 Running in development mode..."
    python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Install spaCy models
spacy-models:
    @echo "🧠 Installing spaCy models..."
    python -m spacy download en_core_web_sm
    python -m spacy download en_core_web_lg

# Download NLTK data
nltk-data:
    @echo "📖 Downloading NLTK data..."
    python download_nltk_data.py

# Check dependencies
check:
    @echo "🔍 Checking dependencies..."
    pip check
    python -c "import torch; print(f'PyTorch: {torch.__version__}')"
    python -c "import transformers; print(f'Transformers: {transformers.__version__}')"
    python -c "import spacy; print(f'spaCy: {spacy.__version__}')"