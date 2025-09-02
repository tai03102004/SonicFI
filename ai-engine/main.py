import asyncio
import os
import sys
import logging
from datetime import datetime
from dotenv import load_dotenv
from typing import Dict, Any

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from advanced_nlp_processor import AdvancedNLPProcessor
    from research_engine import AIResearchEngine
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("🔧 Please make sure all dependencies are installed:")
    print("   pip install -r requirements.txt")
    sys.exit(1)

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('ai_engine.log')
    ]
)
logger = logging.getLogger(__name__)

class SocialFiAIEngine:
    def __init__(self):
        self.config = self._load_config()
        self.nlp_processor = None
        self.research_engine = None
        
    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from environment variables"""
        # Load configuration
        config = {
            'openai_api_key': os.getenv('OPENAI_API_KEY'),
            'openai_base_url': os.getenv('OPENAI_BASE_URL', 'https://openrouter.ai/api/v1'),
            'openai_model': os.getenv('OPENAI_MODEL', 'google/gemini-2.0-flash-exp:free'),
            'newsapi_key': os.getenv('NEWSAPI_KEY'),
            'twitter_bearer_token': os.getenv('TWITTER_BEARER_TOKEN'),
            'twitter_api_key': os.getenv('TWITTER_API_KEY'),
            'twitter_api_secret': os.getenv('TWITTER_API_SECRET'),
            'twitter_access_token': os.getenv('TWITTER_ACCESS_TOKEN'),
            'twitter_access_secret': os.getenv('TWITTER_ACCESS_SECRET'),
            'reddit_client_id': os.getenv('REDDIT_CLIENT_ID'),
            'reddit_client_secret': os.getenv('REDDIT_CLIENT_SECRET'),
            'sonic_rpc_url': os.getenv('SONIC_RPC_URL', 'https://rpc.sonic.network'),
            'log_level': os.getenv('LOG_LEVEL', 'INFO')
        }
        
        return config
    
    def _validate_config(self) -> bool:
        """Validate required configuration"""
        required_keys = ['openai_api_key']
        optional_keys = ['newsapi_key', 'twitter_bearer_token', 'reddit_client_id']
        
        missing_required = [key for key in required_keys if not self.config.get(key)]
        missing_optional = [key for key in optional_keys if not self.config.get(key)]
        
        if missing_required:
            logger.error(f"❌ Missing required configuration: {missing_required}")
            return False
        
        if missing_optional:
            logger.warning(f"⚠️  Missing optional configuration: {missing_optional}")
            logger.warning("   Some features may be limited")
        
        return True
    
    async def initialize(self):
        """Initialize AI engines"""
        logger.info("🚀 Initializing SocialFi AI Engine...")
        
        if not self._validate_config():
            raise ValueError("Invalid configuration")
        
        try:
            # Initialize NLP Processor
            logger.info("🧠 Initializing NLP Processor...")
            self.nlp_processor = AdvancedNLPProcessor(self.config)
            
            # Initialize Research Engine
            logger.info("🔬 Initializing Research Engine...")
            self.research_engine = AIResearchEngine(self.config)
            
            logger.info("✅ AI Engine initialized successfully!")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize AI Engine: {str(e)}")
            raise
    
    async def run_comprehensive_analysis(self, tokens: list = None):
        """Run comprehensive market analysis"""
        if tokens is None:
            tokens = ['BTC', 'ETH', 'SONIC']
        
        # Ensure tokens is a list
        if isinstance(tokens, str):
            tokens = [tokens]
        elif not isinstance(tokens, list):
            tokens = list(tokens)
        
        logger.info(f"📊 Starting comprehensive analysis for: {', '.join(tokens)}")
        
        try:
            # Run NLP analysis with timeout
            logger.info("🧠 Running NLP analysis...")
            
            try:
                nlp_result = await asyncio.wait_for(
                    self.nlp_processor.comprehensive_market_analysis(tokens),
                    timeout=60.0  # 1 minute timeout
                )
            except asyncio.TimeoutError:
                logger.warning("⏰ NLP analysis timed out - using fallback data")
                nlp_result = {
                    'social_sentiment': {token: {'overall': 0, 'volume': 0} for token in tokens},
                    'news_sentiment': {token: {'sentiment': 0, 'confidence': 0} for token in tokens},
                    'technical_analysis': {token: {'rsi': 50, 'current_price': 0} for token in tokens},
                    'confidence_score': 0.3,
                    'status': 'timeout'
                }
            
            if 'error' in nlp_result:
                logger.error(f"NLP Analysis failed: {nlp_result['error']}")
            else:
                logger.info(f"✅ NLP Analysis completed with confidence: {nlp_result.get('confidence_score', 'N/A')}")
            
            # Generate research report
            logger.info("📝 Generating research report...")
            
            try:
                # Pass tokens correctly to research engine
                research_result = await self.research_engine.generate_daily_research(tokens)
                
                if 'error' in research_result.get('analysis', {}):
                    logger.warning(f"Research generation had issues: {research_result['analysis']['error']}")
                else:
                    logger.info(f"✅ Research report generated with confidence: {research_result.get('confidence_score', 'N/A')}")
                
            except Exception as e:
                logger.error(f"Research generation failed: {str(e)}")
                research_result = {
                    'analysis': {
                        'executive_summary': 'Technical analysis completed with limited data.',
                        'confidence_score': 0.2,
                        'error': str(e)
                    },
                    'research_hash': 'fallback_hash'
                }
            
            # Combine results
            final_result = {
                'nlp_analysis': nlp_result,
                'research_report': research_result,
                'tokens_analyzed': tokens,
                'timestamp': datetime.now().isoformat(),
                'overall_confidence': (
                    nlp_result.get('confidence_score', 0.3) + 
                    research_result.get('confidence_score', 0.3)
                ) / 2
            }
            
            return final_result
            
        except Exception as e:
            logger.error(f"❌ Error in comprehensive analysis: {str(e)}")
            return {
                'error': str(e),
                'tokens_analyzed': tokens,
                'timestamp': datetime.now().isoformat()
            }
        
    async def run_continuous_monitoring(self, tokens: list = None, interval: int = 3600):
        """Run continuous monitoring (every hour by default)"""
        if tokens is None:
            tokens = ['BTC', 'ETH', 'SONIC']
        
        logger.info(f"🔄 Starting continuous monitoring for: {', '.join(tokens)}")
        logger.info(f"⏰ Update interval: {interval} seconds")
        
        while True:
            try:
                logger.info("🔄 Running scheduled analysis...")
                result = await self.run_comprehensive_analysis(tokens)
                
                if 'error' not in result:
                    logger.info("✅ Scheduled analysis completed successfully")
                else:
                    logger.error(f"❌ Scheduled analysis failed: {result['error']}")
                
                # Wait for next cycle
                logger.info(f"😴 Sleeping for {interval} seconds...")
                await asyncio.sleep(interval)
                
            except KeyboardInterrupt:
                logger.info("🛑 Monitoring stopped by user")
                break
            except Exception as e:
                logger.error(f"❌ Error in monitoring cycle: {str(e)}")
                await asyncio.sleep(60)  # Wait 1 minute before retrying
    
    def print_startup_info(self):
        """Print startup information"""
        print("🤖 SocialFi AI Engine")
        print("=" * 50)
        print(f"📅 Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"🐍 Python: {sys.version.split()[0]}")
        print(f"📁 Working Directory: {os.getcwd()}")
        print(f"🔧 Debug Mode: {'ON' if self.config.get('debug') else 'OFF'}")
        print(f"📝 Log Level: {self.config.get('log_level')}")
        
        # API Status
        print("\n🔌 API Configuration:")
        apis = [
            ('OpenAI', bool(self.config.get('openai_api_key'))),
            ('NewsAPI', bool(self.config.get('newsapi_key'))),
            ('Twitter', bool(self.config.get('twitter_bearer_token'))),
            ('Reddit', bool(self.config.get('reddit_client_id'))),
        ]
        
        for api_name, configured in apis:
            status = "✅ Configured" if configured else "❌ Not configured"
            print(f"  {api_name}: {status}")
        
        print("=" * 50)

async def main():
    """Main entry point"""
    engine = SocialFiAIEngine()
    
    try:
        # Print startup info
        engine.print_startup_info()
        
        # Initialize engine
        await engine.initialize()
        
        # Check command line arguments
        if len(sys.argv) > 1:
            command = sys.argv[1].lower()
            
            if command == 'analyze':
                # Single analysis run
                tokens = sys.argv[2:] if len(sys.argv) > 2 else ['BTC', 'ETH', 'SONIC']
                logger.info(f"🎯 Running single analysis for: {', '.join(tokens)}")
                result = await engine.run_comprehensive_analysis(tokens)
                
                if 'error' not in result:
                    print("\n✅ Analysis completed successfully!")
                    print(f"📊 Confidence Score: {result['nlp_analysis'].get('confidence_score', 'N/A')}")
                    if result.get('research_report'):
                        print(f"📄 Research Hash: {result['research_report']['content_hash']}")
                else:
                    print(f"\n❌ Analysis failed: {result['error']}")
            
            elif command == 'monitor':
                # Continuous monitoring
                tokens = sys.argv[2:] if len(sys.argv) > 2 else ['BTC', 'ETH', 'SONIC']
                await engine.run_continuous_monitoring(tokens)
            
            elif command == 'test':
                # Test mode
                logger.info("🧪 Running in test mode...")
                print("🧪 Test mode - checking basic functionality...")
                
                # Test basic imports
                print("✅ All imports successful")
                
                # Test configuration
                if engine._validate_config():
                    print("✅ Configuration valid")
                else:
                    print("❌ Configuration invalid")
                
                print("🎉 Test completed!")
            
            else:
                print(f"❌ Unknown command: {command}")
                print("Available commands: analyze, monitor, test")
                sys.exit(1)
        
        else:
            # Default: single analysis
            logger.info("🎯 Running default single analysis...")
            result = await engine.run_comprehensive_analysis()
            
            if 'error' not in result:
                print("\n🎉 AI Engine completed successfully!")
                print("📊 Results:")
                print(f"  Confidence Score: {result['nlp_analysis'].get('confidence_score', 'N/A')}")
                if result.get('research_report'):
                    print(f"  Research Hash: {result['research_report']['content_hash']}")
                print(f"  Tokens Analyzed: {', '.join(result['tokens_analyzed'])}")
            else:
                print(f"\n❌ AI Engine failed: {result['error']}")
                sys.exit(1)
    
    except KeyboardInterrupt:
        logger.info("🛑 AI Engine stopped by user")
    except Exception as e:
        logger.error(f"❌ Fatal error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    print("🚀 Starting SocialFi AI Engine...")
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ required")
        sys.exit(1)
    
    # Run main
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
    except Exception as e:
        print(f"\n💥 Fatal error: {str(e)}")
        sys.exit(1)