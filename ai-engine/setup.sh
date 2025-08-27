#!/bin/bash

echo "🚀 Setting up SocialFi AI Engine..."

# Create virtual environment

echo "📦 Creating virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Upgrade pip

echo "⬆️ Upgrading pip..."
pip install --upgrade pip setuptools wheel

# Install PyTorch first (for better compatibility)

echo "🔥 Installing PyTorch..."
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# Install main requirements

echo "📚 Installing main requirements..."
pip install -r requirements.txt

# Download spaCy models

echo "🧠 Downloading spaCy models..."
python -m spacy download en_core_web_sm
python -m spacy download en_core_web_lg

# Download NLTK data

echo "📖 Downloading NLTK data..."
python -c "
import nltk
nltk.download('punkt')
nltk.download('vader_lexicon')
nltk.download('stopwords')
nltk.download('averaged_perceptron_tagger')
nltk.download('wordnet')
nltk.download('omw-1.4')
"

# Install additional transformers models

echo "🤖 Installing transformer models..."
python -c "
from transformers import pipeline
print('Downloading FinBERT...')
pipeline('sentiment-analysis', model='ProsusAI/finbert')
print('Downloading emotion model...')
pipeline('text-classification', model='j-hartmann/emotion-english-distilroberta-base')
"

# Download sentence transformer model

echo "🔗 Downloading sentence transformer..."
python -c "
from sentence_transformers import SentenceTransformer
model = SentenceTransformer('all-MiniLM-L6-v2')
print('Sentence transformer downloaded successfully!')
"

echo "✅ Setup completed successfully!"
echo "🎯 To activate the environment: source venv/bin/activate"
echo "🎯 To run the AI engine: python main.py"
