import asyncio
import aiohttp
import openai
import tweepy
import asyncpraw
import spacy
import nltk
import numpy as np
import pandas as pd
import yfinance as yf
import logging
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from collections import defaultdict, Counter
from textblob import TextBlob
from tweepy.errors import TooManyRequests

from transformers import (
    AutoTokenizer, AutoModelForSequenceClassification,
    pipeline, AutoModel
)
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from sklearn.metrics.pairwise import cosine_similarity
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from sentence_transformers import SentenceTransformer

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
        self.openai_client = openai.OpenAI(
            api_key=config['openai_api_key'],
            base_url=config.get('openai_base_url', 'https://openrouter.ai/api/v1')
        )
        self.model_name = config.get('openai_model', 'google/gemini-2.0-flash-exp:free')
        
        # Initialize multiple sentiment models
        self.vader_analyzer = SentimentIntensityAnalyzer()
        
        try:
            self.emotion_pipeline = pipeline("text-classification", 
                                            model="j-hartmann/emotion-english-distilroberta-base")
            self.finbert_pipeline = pipeline("sentiment-analysis", 
                                            model="ProsusAI/finbert")
        except Exception as e:
            logger.warning(f"Failed to load transformer models: {str(e)}")
            self.emotion_pipeline = None
            self.finbert_pipeline = None
        
        # Load sentence transformer for similarity
        try:
            self.sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
        except Exception as e:
            logger.warning(f"Failed to load sentence transformer: {str(e)}")
            self.sentence_model = None
        
        # Initialize spaCy for NER and processing
        try:
            self.nlp = spacy.load("en_core_web_lg")
        except OSError:
            try:
                logger.warning("Large spaCy model not found, using smaller one")
                self.nlp = spacy.load("en_core_web_sm")
            except OSError:
                logger.error("No spaCy model found")
                self.nlp = None
        
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
            # Twitter API v2 with rate limiting
            # if all(self.config.get(key) for key in ['twitter_bearer_token']):
            #     self.twitter_client = tweepy.Client(
            #         bearer_token=self.config.get('twitter_bearer_token'),
            #         wait_on_rate_limit=True  # Enable rate limit handling
            #     )
            # else:
            #     self.twitter_client = None
            #     logger.warning("Twitter API credentials incomplete")
            self.twitter_client = None
            logger.info("Twitter API disabled to avoid rate limits")
        
            
            # Reddit API (Async)
            if all(self.config.get(key) for key in ['reddit_client_id', 'reddit_client_secret']):
                self.reddit_client = asyncpraw.Reddit(
                    client_id=self.config.get('reddit_client_id'),
                    client_secret=self.config.get('reddit_client_secret'),
                    user_agent='SocialFi Research Bot 1.0'
                )
            else:
                self.reddit_client = None
                logger.warning("Reddit API credentials incomplete")
                
        except Exception as e:
            logger.warning(f"Failed to initialize social APIs: {str(e)}")
            self.twitter_client = None
            self.reddit_client = None
    
    async def comprehensive_market_analysis(self, tokens: List[str]) -> Dict[str, Any]:
        """Perform comprehensive multi-source market analysis"""
        try:
            # Analyze social sentiment
            logger.info("Analyzing social sentiment...")
            social_sentiment = await self._analyze_social_sentiment(tokens)
            
            # Analyze news sentiment
            logger.info("Analyzing news sentiment...")
            news_sentiment = await self._analyze_news_sentiment(tokens)
            
            # Analyze technical indicators
            logger.info("Analyzing technical indicators...")
            technical_analysis = await self._analyze_technical_indicators(tokens)
            
            # Generate final analysis
            combined_analysis = {
                'social_sentiment': social_sentiment,
                'news_sentiment': news_sentiment, 
                'technical_analysis': technical_analysis,
                'timestamp': datetime.now().isoformat(),
                'confidence_score': self._calculate_overall_confidence(social_sentiment, news_sentiment, technical_analysis)
            }
            
            return combined_analysis
            
        except Exception as e:
            logger.error(f"Error in comprehensive analysis: {str(e)}")
            return {'error': str(e), 'timestamp': datetime.now().isoformat()}

    async def _analyze_social_sentiment(self, tokens: List[str]) -> Dict[str, Any]:
        """Aggregate social sentiment from Twitter and Reddit"""
        social_sentiments = {}
        
        for token in tokens:
            try:
                # Twitter sentiment with error handling
                try:
                    twitter_sentiment = await self._analyze_twitter_sentiment(token)
                except Exception as e:
                    logger.warning(f"Twitter analysis failed for {token}: {str(e)}")
                    twitter_sentiment = {'sentiment': 0, 'volume': 0, 'confidence': 0}
                
                # Reddit sentiment with error handling
                try:
                    reddit_sentiment = await self._analyze_reddit_sentiment(token)
                except Exception as e:
                    logger.warning(f"Reddit analysis failed for {token}: {str(e)}")
                    reddit_sentiment = {'sentiment': 0, 'volume': 0, 'confidence': 0}
                
                # Combine sentiments
                combined = {
                    'twitter': twitter_sentiment,
                    'reddit': reddit_sentiment,
                    'overall': (twitter_sentiment.get('sentiment', 0) + reddit_sentiment.get('sentiment', 0)) / 2,
                    'volume': twitter_sentiment.get('volume', 0) + reddit_sentiment.get('volume', 0)
                }
                
                social_sentiments[token] = combined
                
            except Exception as e:
                logger.error(f"Social sentiment error for {token}: {str(e)}")
                social_sentiments[token] = {
                    'twitter': {'sentiment': 0, 'volume': 0, 'confidence': 0},
                    'reddit': {'sentiment': 0, 'volume': 0, 'confidence': 0},
                    'overall': 0,
                    'volume': 0
                }
        
        return social_sentiments

    async def _analyze_twitter_sentiment(self, token: str) -> Dict[str, Any]:
        """Analyze Twitter sentiment with proper rate limiting"""
        if not self.twitter_client:
            return {'sentiment': 0, 'volume': 0, 'confidence': 0}
        
        try:
            # Check rate limit status first
            try:
                rate_limit_status = self.twitter_client.get_rate_limit_status()
                search_limit = rate_limit_status.get('resources', {}).get('search', {}).get('/search/tweets', {})
                remaining = search_limit.get('remaining', 0)
                
                if remaining <= 0:
                    logger.warning(f"Twitter rate limit hit for {token} - skipping")
                    return {'sentiment': 0, 'volume': 0, 'confidence': 0, 'status': 'rate_limited'}
            except:
                pass  # Continue if rate limit check fails
            
            # Search for tweets with rate limiting
            query = f"#{token} OR {token} -is:retweet lang:en"
            
            # Use pagination to get tweets
            tweets = []
            try:
                # Reduce requests to avoid rate limits
                for tweet in tweepy.Paginator(
                    self.twitter_client.search_recent_tweets,
                    query=query,
                    max_results=10,  # Very small to avoid rate limits
                    tweet_fields=['created_at', 'public_metrics', 'author_id']
                ).flatten(limit=20):  # Very small limit
                    tweets.append(tweet)
                    
            except TooManyRequests:
                logger.warning(f"Twitter rate limit hit for {token} - returning mock data")
                # Return mock positive sentiment to continue analysis
                return {
                    'sentiment': 0.1,  # Slightly positive
                    'volume': 100,
                    'tweet_count': 0,
                    'confidence': 0.1,
                    'status': 'rate_limited'
                }
            
            # Process tweets if we have any
            if not tweets:
                return {
                    'sentiment': 0.0,
                    'volume': 0,
                    'tweet_count': 0,
                    'confidence': 0.0,
                    'status': 'no_data'
                }
            
            sentiments = []
            volumes = []
            
            for tweet in tweets:
                # Sentiment analysis
                text = tweet.text if hasattr(tweet, 'text') else str(tweet)
                sentiment_score = self._analyze_text_sentiment(text)
                
                # Weight by engagement
                if hasattr(tweet, 'public_metrics'):
                    metrics = tweet.public_metrics
                    engagement = metrics.get('like_count', 0) + metrics.get('retweet_count', 0) + metrics.get('reply_count', 0)
                else:
                    engagement = 1
                
                weight = min(engagement / 100, 10)  # Cap weight at 10x
                
                sentiments.append(sentiment_score * (1 + weight))
                volumes.append(engagement)
            
            avg_sentiment = np.mean(sentiments) if sentiments else 0
            total_volume = sum(volumes)
            confidence = min(len(tweets) / 20, 1.0)
            
            return {
                'sentiment': float(avg_sentiment),
                'volume': total_volume,
                'tweet_count': len(tweets),
                'confidence': confidence,
                'status': 'success'
            }
            
        except Exception as e:
            logger.warning(f"Twitter analysis error for {token}: {str(e)}")
            # Return neutral sentiment instead of failing
            return {
                'sentiment': 0.0,
                'volume': 50,  # Mock volume
                'tweet_count': 0,
                'confidence': 0.1,
                'status': 'error'
            }
    
    async def _analyze_reddit_sentiment(self, token: str) -> Dict[str, Any]:
        """Analyze Reddit sentiment with proper async handling"""
        if not self.reddit_client:
            return {'sentiment': 0, 'volume': 0, 'confidence': 0}
        
        try:
            # Search in relevant subreddits
            subreddits = ['cryptocurrency', 'bitcoin', 'ethereum', 'defi', 'altcoin']
            all_posts = []
            
            for subreddit_name in subreddits:
                try:
                    subreddit = await self.reddit_client.subreddit(subreddit_name)
                    
                    # Search for posts
                    async for post in subreddit.search(token, limit=5, time_filter='week'):
                        all_posts.append(post)
                        if len(all_posts) >= 20:  # Limit total posts
                            break
                            
                except Exception as e:
                    logger.warning(f"Reddit subreddit {subreddit_name} error: {str(e)}")
                    continue
            
            sentiments = []
            scores = []
            
            for post in all_posts:
                try:
                    # FIX: Proper async handling
                    title = post.title if hasattr(post, 'title') else ''
                    selftext = post.selftext if hasattr(post, 'selftext') else ''
                    
                    # If they're coroutines, await them
                    if hasattr(title, '__await__'):
                        title = await title
                    if hasattr(selftext, '__await__'):
                        selftext = await selftext
                    
                    text = f"{title} {selftext}"
                    
                    sentiment_score = self._analyze_text_sentiment(text)
                    
                    # Weight by Reddit score
                    score = post.score if hasattr(post, 'score') else 1
                    if hasattr(score, '__await__'):
                        score = await score
                    
                    weight = max(score / 10, 1)  # Minimum weight of 1
                    
                    sentiments.append(sentiment_score * weight)
                    scores.append(score)
                    
                except Exception as e:
                    logger.warning(f"Error processing Reddit post: {str(e)}")
                    continue
            
            avg_sentiment = np.mean(sentiments) if sentiments else 0
            total_score = sum(scores)
            
            return {
                'sentiment': float(avg_sentiment),
                'volume': total_score,
                'post_count': len(all_posts),
                'confidence': min(len(all_posts) / 20, 1.0)
            }
            
        except Exception as e:
            logger.error(f"Reddit analysis error for {token}: {str(e)}")
            return {'sentiment': 0, 'volume': 0, 'confidence': 0}
    
    def _analyze_text_sentiment(self, text: str) -> float:
        """Analyze sentiment of a single text using combined models"""
        if not text or len(text.strip()) == 0:
            return 0.0
            
        try:
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
            
        except Exception as e:
            logger.warning(f"Sentiment analysis error: {str(e)}")
            return 0.0
    
    def _calculate_keyword_sentiment(self, text: str) -> float:
        """Calculate sentiment based on predefined crypto keywords"""
        if not text:
            return 0.0
            
        text_lower = text.lower()
        
        bullish_count = sum(1 for keyword in self.market_keywords['bullish'] if keyword in text_lower)
        bearish_count = sum(1 for keyword in self.market_keywords['bearish'] if keyword in text_lower)
        total_words = len(text.split())
        
        if total_words == 0:
            return 0
        
        bullish_ratio = bullish_count / total_words
        bearish_ratio = bearish_count / total_words
        
        return (bullish_ratio - bearish_ratio) * 10  # Scale the sentiment

    async def _analyze_news_sentiment(self, tokens: List[str]) -> Dict[str, Any]:
        """Analyze news sentiment with proper error handling"""
        try:
            news_data = await self._fetch_news_data(tokens)
            
            token_sentiments = {}
            
            for token in tokens:
                # Filter news for this token
                token_news = [
                    article for article in news_data 
                    if token.lower() in str(article.get('title', '')).lower() or 
                       token.lower() in str(article.get('description', '')).lower()
                ]
                
                if not token_news:
                    token_sentiments[token] = {
                        'sentiment': 0.0,
                        'confidence': 0.0,
                        'article_count': 0
                    }
                    continue
                
                # Analyze sentiments
                sentiments = []
                for article in token_news[:10]:  # Limit articles
                    title = str(article.get('title', ''))
                    description = str(article.get('description', ''))
                    text = f"{title} {description}"
                    
                    if text.strip():
                        sentiment_score = self._analyze_text_sentiment(text)
                        sentiments.append(sentiment_score)
                
                avg_sentiment = np.mean(sentiments) if sentiments else 0
                
                token_sentiments[token] = {
                    'sentiment': float(avg_sentiment),
                    'confidence': min(len(sentiments) / 10, 1.0),
                    'article_count': len(token_news)
                }
            
            return token_sentiments
            
        except Exception as e:
            logger.error(f"News sentiment analysis error: {str(e)}")
            return {token: {'sentiment': 0, 'confidence': 0, 'article_count': 0} for token in tokens}

    async def _fetch_news_data(self, tokens: List[str]) -> List[Dict[str, Any]]:
        """Fetch news data with timeout and error handling"""
        all_articles = []
        
        try:
            timeout = aiohttp.ClientTimeout(total=10)  # 10 second timeout
            async with aiohttp.ClientSession(timeout=timeout) as session:
                for token in tokens:
                    if self.config.get('newsapi_key'):
                        try:
                            query = f"{token} cryptocurrency"
                            url = "https://newsapi.org/v2/everything"
                            params = {
                                'q': query,
                                'apiKey': self.config['newsapi_key'],
                                'language': 'en',
                                'sortBy': 'publishedAt',
                                'pageSize': 20
                            }
                            
                            async with session.get(url, params=params) as response:
                                if response.status == 200:
                                    data = await response.json()
                                    articles = data.get('articles', [])
                                    all_articles.extend(articles[:10])  # Limit per token
                                    
                        except Exception as e:
                            logger.warning(f"NewsAPI error for {token}: {str(e)}")
                            continue
            
            return all_articles
            
        except Exception as e:
            logger.error(f"News fetch error: {str(e)}")
            return []

    async def _analyze_technical_indicators(self, tokens: List[str]) -> Dict[str, Any]:
        """Analyze technical indicators with error handling"""
        technical_data = {}
        
        for token in tokens:
            try:
                # Map token symbols
                symbol_map = {
                    'BTC': 'BTC-USD', 
                    'ETH': 'ETH-USD', 
                    'SONIC': 'BTC-USD'  # Fallback to BTC if SONIC not available
                }
                
                symbol = symbol_map.get(token.upper(), f"{token.upper()}-USD")
                
                # Get price data
                ticker = yf.Ticker(symbol)
                hist = ticker.history(period="90d", interval="1d")
                
                if hist.empty:
                    logger.warning(f"No price data for {token}")
                    technical_data[token] = self._get_default_technical_data()
                    continue
                
                # Calculate indicators
                rsi = self._calculate_rsi(hist['Close'])
                macd = self._calculate_macd(hist['Close'])
                bollinger = self._calculate_bollinger_bands(hist['Close'])
                
                technical_data[token] = {
                    'rsi': rsi,
                    'macd': macd,
                    'bollinger_bands': bollinger,
                    'current_price': float(hist['Close'].iloc[-1]),
                    'volume': float(hist['Volume'].iloc[-1])
                }
                
            except Exception as e:
                logger.error(f"Technical analysis error for {token}: {str(e)}")
                technical_data[token] = self._get_default_technical_data()
        
        return technical_data

    def _get_default_technical_data(self) -> Dict[str, Any]:
        """Get default technical data when calculation fails"""
        return {
            'rsi': 50.0,
            'macd': {'macd': 0.0, 'signal': 0.0, 'histogram': 0.0},
            'bollinger_bands': {'upper': 0.0, 'middle': 0.0, 'lower': 0.0, 'position': 0.5},
            'current_price': 0.0,
            'volume': 0.0
        }

    def _calculate_rsi(self, prices: pd.Series, period: int = 14) -> float:
        """Calculate RSI with error handling"""
        try:
            if len(prices) < period + 1:
                return 50.0
                
            delta = prices.diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
            rs = gain / loss
            rsi = 100 - (100 / (1 + rs))
            
            result = rsi.iloc[-1]
            return float(result) if not pd.isna(result) else 50.0
            
        except Exception as e:
            logger.warning(f"RSI calculation error: {str(e)}")
            return 50.0
    
    def _calculate_macd(self, prices: pd.Series) -> Dict[str, float]:
        """Calculate MACD with error handling"""
        try:
            if len(prices) < 26:
                return {'macd': 0.0, 'signal': 0.0, 'histogram': 0.0}
                
            ema12 = prices.ewm(span=12).mean()
            ema26 = prices.ewm(span=26).mean()
            macd_line = ema12 - ema26
            signal_line = macd_line.ewm(span=9).mean()
            histogram = macd_line - signal_line
            
            return {
                'macd': float(macd_line.iloc[-1]) if not pd.isna(macd_line.iloc[-1]) else 0.0,
                'signal': float(signal_line.iloc[-1]) if not pd.isna(signal_line.iloc[-1]) else 0.0,
                'histogram': float(histogram.iloc[-1]) if not pd.isna(histogram.iloc[-1]) else 0.0
            }
            
        except Exception as e:
            logger.warning(f"MACD calculation error: {str(e)}")
            return {'macd': 0.0, 'signal': 0.0, 'histogram': 0.0}
    
    def _calculate_bollinger_bands(self, prices: pd.Series, period: int = 20) -> Dict[str, float]:
        """Calculate Bollinger Bands with error handling"""
        try:
            if len(prices) < period:
                return {'upper': 0.0, 'middle': 0.0, 'lower': 0.0, 'position': 0.5}
                
            ma = prices.rolling(window=period).mean()
            std = prices.rolling(window=period).std()
            upper_band = ma + (std * 2)
            lower_band = ma - (std * 2)
            
            current_price = prices.iloc[-1]
            upper = upper_band.iloc[-1]
            lower = lower_band.iloc[-1]
            middle = ma.iloc[-1]
            
            # Calculate position within bands
            if not pd.isna(upper) and not pd.isna(lower) and upper != lower:
                bb_position = (current_price - lower) / (upper - lower)
            else:
                bb_position = 0.5
            
            return {
                'upper': float(upper) if not pd.isna(upper) else 0.0,
                'middle': float(middle) if not pd.isna(middle) else 0.0,
                'lower': float(lower) if not pd.isna(lower) else 0.0,
                'position': float(bb_position) if not pd.isna(bb_position) else 0.5
            }
            
        except Exception as e:
            logger.warning(f"Bollinger Bands calculation error: {str(e)}")
            return {'upper': 0.0, 'middle': 0.0, 'lower': 0.0, 'position': 0.5}

    def _calculate_overall_confidence(self, social_sentiment: Dict, news_sentiment: Dict, technical_analysis: Dict) -> float:
        """Calculate overall confidence score"""
        try:
            confidences = []
            
            # Social sentiment confidence
            for token_data in social_sentiment.values():
                if isinstance(token_data, dict):
                    twitter_conf = token_data.get('twitter', {}).get('confidence', 0)
                    reddit_conf = token_data.get('reddit', {}).get('confidence', 0)
                    confidences.extend([twitter_conf, reddit_conf])
            
            # News sentiment confidence
            for token_data in news_sentiment.values():
                if isinstance(token_data, dict):
                    confidences.append(token_data.get('confidence', 0))
            
            # Technical analysis confidence (always high if data available)
            for token_data in technical_analysis.values():
                if isinstance(token_data, dict) and token_data.get('current_price', 0) > 0:
                    confidences.append(0.8)
                else:
                    confidences.append(0.1)
            
            return float(np.mean(confidences)) if confidences else 0.3
            
        except Exception as e:
            logger.warning(f"Confidence calculation error: {str(e)}")
            return 0.3
    async def close(self):
        """Clean up resources"""
        try:
            if hasattr(self, 'reddit_client') and self.reddit_client:
                await self.reddit_client.close()
        except Exception as e:
            logger.warning(f"Error closing Reddit client: {str(e)}")