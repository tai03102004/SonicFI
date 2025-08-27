import asyncio
import aiohttp
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple, Optional
import json
import re
from datetime import datetime, timedelta
import logging
from dataclasses import dataclass, asdict
import pickle
import hashlib
from collections import defaultdict, Counter
import spacy
import nltk
from textblob import TextBlob
import torch
from transformers import (
    AutoTokenizer, AutoModelForSequenceClassification,
    pipeline, AutoModel
)
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from sklearn.metrics.pairwise import cosine_similarity
import yfinance as yf
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import openai
from sentence_transformers import SentenceTransformer
import tweepy
import praw

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class MarketSignal:
    signal_type: str
    strength: float  # -1 to 1
    confidence: float  # 0 to 1
    source: str
    timestamp: datetime
    metadata: Dict[str, Any]

@dataclass
class SentimentAnalysis:
    overall_sentiment: float
    sentiment_distribution: Dict[str, float]
    emotion_scores: Dict[str, float]
    key_topics: List[str]
    influencer_sentiment: Dict[str, float]
    volume_weighted_sentiment: float

@dataclass
class TechnicalIndicators:
    rsi: float
    macd: Dict[str, float]
    bollinger_bands: Dict[str, float]
    support_resistance: Dict[str, List[float]]
    volume_profile: Dict[str, float]
    momentum_indicators: Dict[str, float]

class AdvancedNLPProcessor:
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.openai_client = openai.OpenAI(api_key=config['openai_api_key'])
        
        # Initialize multiple sentiment models
        self.vader_analyzer = SentimentIntensityAnalyzer()
        self.emotion_pipeline = pipeline("text-classification", 
                                        model="j-hartmann/emotion-english-distilroberta-base")
        self.finbert_pipeline = pipeline("sentiment-analysis", 
                                        model="ProsusAI/finbert")
        
        # Load sentence transformer for similarity
        self.sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Initialize spaCy for NER and processing
        try:
            self.nlp = spacy.load("en_core_web_lg")
        except OSError:
            logger.warning("Large spaCy model not found, using smaller one")
            self.nlp = spacy.load("en_core_web_sm")
        
        # Initialize clustering model
        self.tfidf_vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        self.kmeans_model = KMeans(n_clusters=5, random_state=42)
        
        # Social media APIs
        self._init_social_apis()
        
        # Cache for processed data
        self.cache = {}
        self.cache_ttl = 3600  # 1 hour
        
        # Influencer tracking
        self.crypto_influencers = [
            "elonmusk", "VitalikButerin", "satoshi_nakamoto", "CoinDesk",
            "cz_binance", "brian_armstrong", "APompliano", "CryptoWendyO"
        ]
        
        # Market keywords and weights
        self.market_keywords = {
            'bullish': ['moon', 'pump', 'bull', 'up', 'rise', 'growth', 'positive', 'strong'],
            'bearish': ['dump', 'bear', 'down', 'fall', 'crash', 'negative', 'weak', 'drop'],
            'neutral': ['stable', 'sideways', 'consolidation', 'range', 'flat'],
            'uncertainty': ['volatile', 'uncertain', 'confusion', 'mixed', 'unclear']
        }
        
    def _init_social_apis(self):
        """Initialize social media API clients"""
        try:
            # Twitter API v2
            self.twitter_client = tweepy.Client(
                bearer_token=self.config.get('twitter_bearer_token'),
                consumer_key=self.config.get('twitter_api_key'),
                consumer_secret=self.config.get('twitter_api_secret'),
                access_token=self.config.get('twitter_access_token'),
                access_token_secret=self.config.get('twitter_access_secret')
            )
            
            # Reddit API
            self.reddit_client = praw.Reddit(
                client_id=self.config.get('reddit_client_id'),
                client_secret=self.config.get('reddit_client_secret'),
                user_agent='SocialFi Research Bot 1.0'
            )
        except Exception as e:
            logger.warning(f"Failed to initialize social APIs: {str(e)}")
            self.twitter_client = None
            self.reddit_client = None
    
    async def comprehensive_market_analysis(self, tokens: List[str]) -> Dict[str, Any]:
        """Perform comprehensive multi-source market analysis"""
        try:
            # Gather data from multiple sources concurrently
            tasks = [
                self._analyze_news_sentiment(tokens),
                self._analyze_social_sentiment(tokens),
                self._analyze_technical_indicators(tokens),
                self._analyze_on_chain_metrics(tokens),
                self._detect_market_signals(tokens),
                self._analyze_influencer_sentiment(tokens),
                self._generate_ai_insights(tokens)
            ]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Combine all analyses
            combined_analysis = {
                'news_sentiment': results[0] if not isinstance(results[0], Exception) else {},
                'social_sentiment': results[1] if not isinstance(results[1], Exception) else {},
                'technical_analysis': results[2] if not isinstance(results[2], Exception) else {},
                'onchain_metrics': results[3] if not isinstance(results[3], Exception) else {},
                'market_signals': results[4] if not isinstance(results[4], Exception) else [],
                'influencer_sentiment': results[5] if not isinstance(results[5], Exception) else {},
                'ai_insights': results[6] if not isinstance(results[6], Exception) else {},
                'timestamp': datetime.now().isoformat(),
                'confidence_score': self._calculate_overall_confidence(results)
            }
            
            # Generate final recommendation
            combined_analysis['recommendation'] = await self._generate_final_recommendation(combined_analysis, tokens)
            
            return combined_analysis
            
        except Exception as e:
            logger.error(f"Error in comprehensive analysis: {str(e)}")
            return {'error': str(e), 'timestamp': datetime.now().isoformat()}
    
    async def _analyze_news_sentiment(self, tokens: List[str]) -> Dict[str, Any]:
        """Advanced news sentiment analysis with multiple models"""
        news_data = await self._fetch_news_data(tokens)
        
        token_sentiments = {}
        
        for token in tokens:
            token_news = [article for article in news_data if token.lower() in article.get('title', '').lower() or 
                         token.lower() in article.get('description', '').lower()]
            
            if not token_news:
                token_sentiments[token] = {
                    'sentiment': 0.0,
                    'confidence': 0.0,
                    'article_count': 0
                }
                continue
            
            # Analyze each article with multiple models
            sentiments = []
            confidences = []
            emotions = []
            
            for article in token_news[:20]:  # Limit to 20 most recent
                text = f"{article.get('title', '')} {article.get('description', '')}"
                
                # VADER sentiment
                vader_scores = self.vader_analyzer.polarity_scores(text)
                
                # FinBERT sentiment
                try:
                    finbert_result = self.finbert_pipeline(text[:512])  # Limit text length
                    finbert_score = finbert_result[0]['score'] if finbert_result[0]['label'] == 'positive' else -finbert_result[0]['score']
                except:
                    finbert_score = 0
                
                # TextBlob sentiment
                blob = TextBlob(text)
                textblob_score = blob.sentiment.polarity
                
                # Emotion analysis
                try:
                    emotion_result = self.emotion_pipeline(text[:512])
                    emotions.append(emotion_result[0])
                except:
                    emotions.append({'label': 'neutral', 'score': 0.5})
                
                # Combine sentiments with weights
                combined_sentiment = (
                    vader_scores['compound'] * 0.3 +
                    finbert_score * 0.4 +
                    textblob_score * 0.3
                )
                
                sentiments.append(combined_sentiment)
                confidences.append(abs(combined_sentiment))  # Use absolute value as confidence proxy
            
            # Calculate token-level metrics
            avg_sentiment = np.mean(sentiments) if sentiments else 0
            avg_confidence = np.mean(confidences) if confidences else 0
            
            # Emotion distribution
            emotion_counts = Counter([e['label'] for e in emotions])
            emotion_distribution = {emotion: count/len(emotions) for emotion, count in emotion_counts.items()}
            
            token_sentiments[token] = {
                'sentiment': float(avg_sentiment),
                'confidence': float(avg_confidence),
                'article_count': len(token_news),
                'emotion_distribution': emotion_distribution,
                'trend': self._calculate_sentiment_trend(sentiments),
                'key_topics': self._extract_key_topics([article.get('title', '') for article in token_news])
            }
        
        return token_sentiments
    
    async def _analyze_social_sentiment(self, tokens: List[str]) -> Dict[str, Any]:
        """Analyze sentiment from Twitter and Reddit"""
        social_sentiments = {}
        
        for token in tokens:
            # Twitter analysis
            twitter_sentiment = await self._analyze_twitter_sentiment(token)
            
            # Reddit analysis
            reddit_sentiment = await self._analyze_reddit_sentiment(token)
            
            # Combine social sentiments
            combined_sentiment = {
                'twitter': twitter_sentiment,
                'reddit': reddit_sentiment,
                'overall': (twitter_sentiment.get('sentiment', 0) + reddit_sentiment.get('sentiment', 0)) / 2,
                'volume': twitter_sentiment.get('volume', 0) + reddit_sentiment.get('volume', 0)
            }
            
            social_sentiments[token] = combined_sentiment
        
        return social_sentiments
    
    async def _analyze_twitter_sentiment(self, token: str) -> Dict[str, Any]:
        """Analyze Twitter sentiment for a specific token"""
        if not self.twitter_client:
            return {'sentiment': 0, 'volume': 0, 'confidence': 0}
        
        try:
            # Search for tweets
            query = f"#{token} OR ${token} OR {token} -is:retweet lang:en"
            tweets = tweepy.Paginator(
                self.twitter_client.search_recent_tweets,
                query=query,
                max_results=100,
                tweet_fields=['created_at', 'public_metrics', 'author_id']
            ).flatten(limit=500)
            
            sentiments = []
            volumes = []
            
            for tweet in tweets:
                # Sentiment analysis
                text = tweet.text
                sentiment_score = self._analyze_text_sentiment(text)
                
                # Weight by engagement
                metrics = tweet.public_metrics
                engagement = metrics['like_count'] + metrics['retweet_count'] + metrics['reply_count']
                weight = min(engagement / 100, 10)  # Cap weight at 10x
                
                sentiments.append(sentiment_score * (1 + weight))
                volumes.append(engagement)
            
            avg_sentiment = np.mean(sentiments) if sentiments else 0
            total_volume = sum(volumes)
            
            return {
                'sentiment': float(avg_sentiment),
                'volume': total_volume,
                'tweet_count': len(list(tweets)),
                'confidence': min(len(list(tweets)) / 100, 1.0)  # Confidence based on sample size
            }
            
        except Exception as e:
            logger.error(f"Twitter analysis error for {token}: {str(e)}")
            return {'sentiment': 0, 'volume': 0, 'confidence': 0}
    
    async def _analyze_reddit_sentiment(self, token: str) -> Dict[str, Any]:
        """Analyze Reddit sentiment for a specific token"""
        if not self.reddit_client:
            return {'sentiment': 0, 'volume': 0, 'confidence': 0}
        
        try:
            # Search in relevant subreddits
            subreddits = ['cryptocurrency', 'bitcoin', 'ethereum', 'defi', 'altcoin']
            all_posts = []
            
            for subreddit_name in subreddits:
                subreddit = self.reddit_client.subreddit(subreddit_name)
                posts = subreddit.search(token, limit=50, time_filter='week')
                all_posts.extend(posts)
            
            sentiments = []
            scores = []
            
            for post in all_posts:
                # Analyze post title and content
                text = f"{post.title} {post.selftext}"
                sentiment_score = self._analyze_text_sentiment(text)
                
                # Weight by Reddit score
                weight = max(post.score / 10, 1)  # Minimum weight of 1
                
                sentiments.append(sentiment_score * weight)
                scores.append(post.score)
            
            avg_sentiment = np.mean(sentiments) if sentiments else 0
            total_score = sum(scores)
            
            return {
                'sentiment': float(avg_sentiment),
                'volume': total_score,
                'post_count': len(all_posts),
                'confidence': min(len(all_posts) / 50, 1.0)
            }
            
        except Exception as e:
            logger.error(f"Reddit analysis error for {token}: {str(e)}")
            return {'sentiment': 0, 'volume': 0, 'confidence': 0}
    
    def _analyze_text_sentiment(self, text: str) -> float:
        """Analyze sentiment of a single text using combined models"""
        # VADER
        vader_score = self.vader_analyzer.polarity_scores(text)['compound']
        
        # TextBlob
        blob_score = TextBlob(text).sentiment.polarity
        
        # Keyword-based sentiment
        keyword_score = self._calculate_keyword_sentiment(text)
        
        # Combine with weights
        combined_score = (
            vader_score * 0.4 +
            blob_score * 0.3 +
            keyword_score * 0.3
        )
        
        return combined_score
    
    def _calculate_keyword_sentiment(self, text: str) -> float:
        """Calculate sentiment based on predefined crypto keywords"""
        text_lower = text.lower()
        
        bullish_count = sum(1 for keyword in self.market_keywords['bullish'] if keyword in text_lower)
        bearish_count = sum(1 for keyword in self.market_keywords['bearish'] if keyword in text_lower)
        total_words = len(text.split())
        
        if total_words == 0:
            return 0
        
        bullish_ratio = bullish_count / total_words
        bearish_ratio = bearish_count / total_words
        
        return (bullish_ratio - bearish_ratio) * 10  # Scale the sentiment
    
    async def _analyze_technical_indicators(self, tokens: List[str]) -> Dict[str, TechnicalIndicators]:
        """Advanced technical analysis with multiple indicators"""
        technical_data = {}
        
        for token in tokens:
            try:
                # Fetch price data
                symbol_map = {'BTC': 'BTC-USD', 'ETH': 'ETH-USD', 'SONIC': 'SONIC-USD'}
                symbol = symbol_map.get(token.upper(), f"{token.upper()}-USD")
                
                ticker = yf.Ticker(symbol)
                hist = ticker.history(period="90d", interval="1d")
                
                if hist.empty:
                    continue
                
                # Calculate RSI
                rsi = self._calculate_rsi(hist['Close'])
                
                # Calculate MACD
                macd = self._calculate_macd(hist['Close'])
                
                # Calculate Bollinger Bands
                bollinger = self._calculate_bollinger_bands(hist['Close'])
                
                # Calculate Support/Resistance
                support_resistance = self._calculate_support_resistance(hist)
                
                # Calculate volume indicators
                volume_profile = self._calculate_volume_profile(hist)
                
                # Calculate momentum indicators
                momentum = self._calculate_momentum_indicators(hist)
                
                technical_data[token] = TechnicalIndicators(
                    rsi=rsi,
                    macd=macd,
                    bollinger_bands=bollinger,
                    support_resistance=support_resistance,
                    volume_profile=volume_profile,
                    momentum_indicators=momentum
                )
                
            except Exception as e:
                logger.error(f"Technical analysis error for {token}: {str(e)}")
        
        return technical_data
    
    def _calculate_rsi(self, prices: pd.Series, period: int = 14) -> float:
        """Calculate Relative Strength Index"""
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return float(rsi.iloc[-1]) if not rsi.empty else 50.0
    
    def _calculate_macd(self, prices: pd.Series) -> Dict[str, float]:
        """Calculate MACD indicator"""
        ema12 = prices.ewm(span=12).mean()
        ema26 = prices.ewm(span=26).mean()
        macd_line = ema12 - ema26
        signal_line = macd_line.ewm(span=9).mean()
        histogram = macd_line - signal_line
        
        return {
            'macd': float(macd_line.iloc[-1]) if not macd_line.empty else 0.0,
            'signal': float(signal_line.iloc[-1]) if not signal_line.empty else 0.0,
            'histogram': float(histogram.iloc[-1]) if not histogram.empty else 0.0
        }
    
    def _calculate_bollinger_bands(self, prices: pd.Series, period: int = 20) -> Dict[str, float]:
        """Calculate Bollinger Bands"""
        ma = prices.rolling(window=period).mean()
        std = prices.rolling(window=period).std()
        upper_band = ma + (std * 2)
        lower_band = ma - (std * 2)
        
        current_price = prices.iloc[-1]
        bb_position = (current_price - lower_band.iloc[-1]) / (upper_band.iloc[-1] - lower_band.iloc[-1])
        
        return {
            'upper': float(upper_band.iloc[-1]) if not upper_band.empty else 0.0,
            'middle': float(ma.iloc[-1]) if not ma.empty else 0.0,
            'lower': float(lower_band.iloc[-1]) if not lower_band.empty else 0.0,
            'position': float(bb_position) if not pd.isna(bb_position) else 0.5
        }
    
    # ...existing code...
    
    async def _generate_final_recommendation(self, analysis: Dict[str, Any], tokens: List[str]) -> Dict[str, Any]:
        """Generate final AI-powered recommendation"""
        try:
            # Prepare comprehensive context
            context = self._prepare_recommendation_context(analysis, tokens)
            
            prompt = f"""
            Based on the comprehensive analysis below, provide detailed trading recommendations:
            
            {context}
            
            Provide a structured JSON response with:
            1. overall_market_sentiment (bullish/bearish/neutral)
            2. confidence_level (0-100)
            3. time_horizon (short/medium/long term outlook)
            4. risk_level (low/medium/high)
            5. key_catalysts (list of important factors)
            6. price_targets (for each token)
            7. stop_losses (risk management levels)
            8. position_sizing (recommended allocation %)
            9. execution_strategy (when and how to enter)
            10. risk_warnings (potential downsides)
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "You are a senior cryptocurrency analyst with 10+ years experience in traditional and digital asset markets. Provide detailed, actionable investment advice."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                max_tokens=3000
            )
            
            recommendation_text = response.choices[0].message.content
            
            try:
                recommendation = json.loads(recommendation_text)
            except json.JSONDecodeError:
                recommendation = {
                    'analysis': recommendation_text,
                    'confidence_level': 70,
                    'overall_market_sentiment': 'neutral'
                }
            
            return recommendation
            
        except Exception as e:
            logger.error(f"Error generating recommendation: {str(e)}")
            return {
                'error': 'Failed to generate recommendation',
                'fallback_advice': 'Consider current market conditions and your risk tolerance'
            }
    
    def _prepare_recommendation_context(self, analysis: Dict[str, Any], tokens: List[str]) -> str:
        """Prepare detailed context for AI recommendation"""
        context_parts = []
        
        # News sentiment summary
        news_data = analysis.get('news_sentiment', {})
        for token in tokens:
            if token in news_data:
                data = news_data[token]
                context_parts.append(f"{token} News: Sentiment {data['sentiment']:.2f}, {data['article_count']} articles")
        
        # Social sentiment summary
        social_data = analysis.get('social_sentiment', {})
        for token in tokens:
            if token in social_data:
                data = social_data[token]
                context_parts.append(f"{token} Social: Overall {data['overall']:.2f}, Volume {data['volume']}")
        
        # Technical indicators
        tech_data = analysis.get('technical_analysis', {})
        for token in tokens:
            if token in tech_data:
                data = tech_data[token]
                if isinstance(data, TechnicalIndicators):
                    context_parts.append(f"{token} Technical: RSI {data.rsi:.1f}, MACD {data.macd['macd']:.4f}")
        
        # Market signals
        signals = analysis.get('market_signals', [])
        if signals:
            signal_summary = Counter([s.signal_type for s in signals])
            context_parts.append(f"Market Signals: {dict(signal_summary)}")
        
        return '\n'.join(context_parts)
    
    # Additional helper methods would continue...
    
    def _extract_key_topics(self, texts: List[str]) -> List[str]:
        """Extract key topics from text using TF-IDF and clustering"""
        if not texts:
            return []
        
        try:
            # Combine all texts
            combined_text = ' '.join(texts)
            
            # Process with spaCy
            doc = self.nlp(combined_text)
            
            # Extract key entities and noun phrases
            entities = [ent.text for ent in doc.ents if ent.label_ in ['ORG', 'PRODUCT', 'EVENT']]
            noun_phrases = [chunk.text for chunk in doc.noun_chunks if len(chunk.text.split()) <= 3]
            
            # Combine and filter
            topics = entities + noun_phrases
            topic_counts = Counter(topics)
            
            # Return top 5 topics
            return [topic for topic, count in topic_counts.most_common(5)]
            
        except Exception as e:
            logger.error(f"Topic extraction error: {str(e)}")
            return []
    
    def _calculate_overall_confidence(self, results: List[Any]) -> float:
        """Calculate overall confidence score based on data quality"""
        valid_results = [r for r in results if not isinstance(r, Exception)]
        total_results = len(results)
        
        if total_results == 0:
            return 0.0
        
        base_confidence = len(valid_results) / total_results
        
        # Adjust based on data richness
        data_quality_factors = []
        
        # Check news data quality
        news_data = valid_results[0] if len(valid_results) > 0 else {}
        if isinstance(news_data, dict):
            avg_articles = np.mean([data.get('article_count', 0) for data in news_data.values()])
            data_quality_factors.append(min(avg_articles / 10, 1.0))
        
        # Check social data quality
        social_data = valid_results[1] if len(valid_results) > 1 else {}
        if isinstance(social_data, dict):
            avg_volume = np.mean([data.get('volume', 0) for data in social_data.values()])
            data_quality_factors.append(min(avg_volume / 1000, 1.0))
        
        # Combine factors
        if data_quality_factors:
            quality_factor = np.mean(data_quality_factors)
            return float(base_confidence * 0.7 + quality_factor * 0.3)
        
        return float(base_confidence)

    # Additional methods for completeness...
    async def _analyze_on_chain_metrics(self, tokens: List[str]) -> Dict[str, Any]:
        """Analyze on-chain metrics"""
        # Placeholder for on-chain analysis
        return {token: {'active_addresses': 0, 'transaction_volume': 0} for token in tokens}
    
    async def _detect_market_signals(self, tokens: List[str]) -> List[MarketSignal]:
        """Detect various market signals"""
        # Placeholder for signal detection
        return []
    
    async def _analyze_influencer_sentiment(self, tokens: List[str]) -> Dict[str, Any]:
        """Analyze sentiment from crypto influencers"""
        # Placeholder for influencer analysis
        return {token: {'influencer_sentiment': 0.0} for token in tokens}
    
    async def _generate_ai_insights(self, tokens: List[str]) -> Dict[str, Any]:
        """Generate additional AI insights"""
        # Placeholder for additional insights
        return {'insights': 'Additional AI-generated insights would go here'}
