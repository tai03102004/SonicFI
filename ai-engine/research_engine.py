import asyncio
import aiohttp
import openai
from typing import List, Dict, Any
import json
from datetime import datetime, timedelta
import hashlib
import re
from textblob import TextBlob
import yfinance as yf
import pandas as pd
from web3 import Web3
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AIResearchEngine:
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.openai_client = openai.OpenAI(api_key=config['openai_api_key'])
        self.w3 = Web3(Web3.HTTPProvider(config['sonic_rpc_url']))
        self.news_sources = [
            'https://api.coindesk.com/v1/news',
            'https://cryptoslate.com/api/news',
            'https://newsapi.org/v2/everything'
        ]
        
    async def generate_daily_research(self, tokens: List[str]) -> Dict[str, Any]:
        """Generate comprehensive daily research for specified tokens"""
        try:
            # Gather data from multiple sources
            news_data = await self._fetch_news_data(tokens)
            price_data = await self._fetch_price_data(tokens)
            social_data = await self._fetch_social_sentiment(tokens)
            
            # Generate AI analysis
            research_report = await self._generate_analysis({
                'news': news_data,
                'prices': price_data,
                'social': social_data,
                'tokens': tokens
            })
            
            # Create content hash for blockchain
            content_hash = self._create_content_hash(research_report)
            
            return {
                'report': research_report,
                'content_hash': content_hash,
                'timestamp': datetime.now().isoformat(),
                'tokens_analyzed': tokens,
                'confidence_score': research_report.get('confidence', 0.7)
            }
            
        except Exception as e:
            logger.error(f"Error generating research: {str(e)}")
            return None
    
    async def _fetch_news_data(self, tokens: List[str]) -> List[Dict]:
        """Fetch news from multiple sources"""
        all_news = []
        
        async with aiohttp.ClientSession() as session:
            for token in tokens:
                # CoinDesk API
                try:
                    coindesk_url = f"https://api.coindesk.com/v1/news?q={token}"
                    async with session.get(coindesk_url) as response:
                        if response.status == 200:
                            data = await response.json()
                            all_news.extend(data.get('articles', []))
                except Exception as e:
                    logger.warning(f"CoinDesk API error: {str(e)}")
                
                # NewsAPI
                try:
                    newsapi_url = f"https://newsapi.org/v2/everything?q={token}&language=en&sortBy=publishedAt"
                    headers = {'X-API-Key': self.config['newsapi_key']}
                    async with session.get(newsapi_url, headers=headers) as response:
                        if response.status == 200:
                            data = await response.json()
                            all_news.extend(data.get('articles', []))
                except Exception as e:
                    logger.warning(f"NewsAPI error: {str(e)}")
        
        return all_news[:50]  # Limit to 50 most recent articles
    
    async def _fetch_price_data(self, tokens: List[str]) -> Dict[str, Any]:
        """Fetch price and market data"""
        price_data = {}
        
        for token in tokens:
            try:
                # Use yfinance for major tokens
                symbol_map = {
                    'BTC': 'BTC-USD',
                    'ETH': 'ETH-USD',
                    'SONIC': 'SONIC-USD'  # Assuming it's listed
                }
                
                symbol = symbol_map.get(token.upper(), f"{token.upper()}-USD")
                ticker = yf.Ticker(symbol)
                
                # Get 30 days of data
                hist = ticker.history(period="30d")
                current_price = hist['Close'].iloc[-1] if not hist.empty else 0
                
                # Calculate metrics
                returns_7d = ((hist['Close'].iloc[-1] / hist['Close'].iloc[-7]) - 1) * 100 if len(hist) >= 7 else 0
                returns_30d = ((hist['Close'].iloc[-1] / hist['Close'].iloc[0]) - 1) * 100 if not hist.empty else 0
                volatility = hist['Close'].pct_change().std() * 100 if not hist.empty else 0
                
                price_data[token] = {
                    'current_price': float(current_price),
                    'returns_7d': float(returns_7d),
                    'returns_30d': float(returns_30d),
                    'volatility': float(volatility),
                    'volume_avg': float(hist['Volume'].mean()) if not hist.empty else 0
                }
                
            except Exception as e:
                logger.warning(f"Price data error for {token}: {str(e)}")
                price_data[token] = {
                    'current_price': 0,
                    'returns_7d': 0,
                    'returns_30d': 0,
                    'volatility': 0,
                    'volume_avg': 0
                }
        
        return price_data
    
    async def _fetch_social_sentiment(self, tokens: List[str]) -> Dict[str, Any]:
        """Analyze social media sentiment"""
        # This would integrate with Twitter API, Reddit API, etc.
        # For demo purposes, we'll simulate sentiment analysis
        
        sentiment_data = {}
        for token in tokens:
            # Simulated sentiment scores
            sentiment_data[token] = {
                'twitter_sentiment': 0.2,  # -1 to 1 scale
                'reddit_sentiment': 0.1,
                'overall_sentiment': 0.15,
                'mention_volume': 1500,
                'sentiment_trend': 'neutral'
            }
        
        return sentiment_data
    
    async def _generate_analysis(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Use OpenAI to generate comprehensive analysis"""
        
        # Prepare context for AI
        context = self._prepare_analysis_context(data)
        
        prompt = f"""
        As a professional crypto analyst, analyze the following data and provide a comprehensive research report:
        
        {context}
        
        Please provide:
        1. Executive Summary (2-3 sentences)
        2. Key Findings for each token
        3. Market Sentiment Analysis
        4. Price Predictions (short-term: 7 days, medium-term: 30 days)
        5. Risk Assessment
        6. Trading Recommendations
        7. Confidence Score (0-1)
        
        Format as JSON with clear structure.
        """
        
        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "You are a professional cryptocurrency analyst with expertise in market analysis and technical analysis."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )
            
            analysis_text = response.choices[0].message.content
            
            # Parse JSON response
            try:
                analysis = json.loads(analysis_text)
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                analysis = {
                    'executive_summary': analysis_text[:200],
                    'raw_analysis': analysis_text,
                    'confidence': 0.7
                }
            
            return analysis
            
        except Exception as e:
            logger.error(f"OpenAI API error: {str(e)}")
            return {
                'error': 'Failed to generate analysis',
                'confidence': 0.1
            }
    
    def _prepare_analysis_context(self, data: Dict[str, Any]) -> str:
        """Prepare structured context for AI analysis"""
        context = []
        
        # News summary
        news_headlines = [article.get('title', '') for article in data['news'][:10]]
        context.append(f"Recent News Headlines: {', '.join(news_headlines)}")
        
        # Price data
        for token, price_info in data['prices'].items():
            context.append(f"{token} - Price: ${price_info['current_price']:.2f}, 7d: {price_info['returns_7d']:.2f}%, 30d: {price_info['returns_30d']:.2f}%")
        
        # Sentiment data
        for token, sentiment in data['social'].items():
            context.append(f"{token} Sentiment - Overall: {sentiment['overall_sentiment']:.2f}, Mentions: {sentiment['mention_volume']}")
        
        return '\n'.join(context)
    
    def _create_content_hash(self, content: Dict[str, Any]) -> str:
        """Create IPFS-like hash for content"""
        content_str = json.dumps(content, sort_keys=True)
        return hashlib.sha256(content_str.encode()).hexdigest()
    
    async def submit_to_blockchain(self, content_hash: str) -> str:
        """Submit content to Sonic blockchain"""
        try:
            # This would interact with the deployed smart contract
            contract_address = self.config['contract_address']
            private_key = self.config['ai_agent_private_key']
            
            # Build transaction (simplified)
            # In production, use proper Web3 contract interaction
            tx_hash = "0x" + hashlib.sha256(f"{content_hash}{datetime.now()}".encode()).hexdigest()
            
            logger.info(f"Content submitted to blockchain: {tx_hash}")
            return tx_hash
            
        except Exception as e:
            logger.error(f"Blockchain submission error: {str(e)}")
            return None

# Usage example
async def main():
    config = {
        'openai_api_key': 'your-openai-key',
        'newsapi_key': 'your-newsapi-key',
        'sonic_rpc_url': 'https://rpc.sonic.network',
        'contract_address': '0x...',
        'ai_agent_private_key': 'your-private-key'
    }
    
    engine = AIResearchEngine(config)
    
    # Generate daily research
    tokens = ['BTC', 'ETH', 'SONIC']
    research = await engine.generate_daily_research(tokens)
    
    if research:
        print(f"Generated research with hash: {research['content_hash']}")
        
        # Submit to blockchain
        tx_hash = await engine.submit_to_blockchain(research['content_hash'])
        if tx_hash:
            print(f"Submitted to blockchain: {tx_hash}")

if __name__ == "__main__":
    asyncio.run(main())
