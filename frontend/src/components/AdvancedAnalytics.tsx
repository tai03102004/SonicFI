import React, { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import { aiService, blockchainService, healthService } from '../services/api';

const AdvancedAnalytics: React.FC = () => {
  const { isConnected, address } = useWallet();
  
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [, setNetworkStatus] = useState<any>(null);
  const [healthData, setHealthData] = useState<any>(null);
  const [, setUserBalance] = useState<any>(null);
  const [predictions, setPredictions] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);
  const [selectedTokens, setSelectedTokens] = useState(['BTC', 'ETH']);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);

  const availableTokens = ['BTC', 'ETH', 'SONIC'];

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log(`📊 Fetching comprehensive analytics for ${selectedTokens.join(', ')}...`);

      // Parallel fetch for better performance
      const [analysisResult, networkResult, healthResult, predictionResult] = await Promise.allSettled([
        aiService.getAnalysis(selectedTokens),
        blockchainService.getNetworkStatus(),
        healthService.checkHealth(),
        isConnected && address ? aiService.submitPrediction(selectedTokens, address, "1") : null
      ]);

      // Process AI Analysis
      if (analysisResult.status === 'fulfilled' && analysisResult.value.success) {
        setAnalysisData(analysisResult.value.data);
        console.log('✅ AI Analysis received');
      }

      // Process Network Status
      if (networkResult.status === 'fulfilled' && networkResult.value.success) {
        setNetworkStatus(networkResult.value.data);
      }

      // Process Health Check
      if (healthResult.status === 'fulfilled') {
        setHealthData(healthResult.value);
      }

      // Process Predictions
      if (predictionResult.status === 'fulfilled' && predictionResult.value?.success) {
        setPredictions(predictionResult.value.data);
      }

      // User balance if connected
      if (isConnected && address) {
        const balanceResult = await blockchainService.getUserBalance(address);
        if (balanceResult.success) {
          setUserBalance(balanceResult.data);
        }
      }

      setLastUpdate(new Date());

    } catch (err: any) {
      console.error('❌ Failed to fetch analytics:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedTokens, address]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchAnalyticsData, 30000); // 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, selectedTokens]);

  const toggleToken = (token: string) => {
    setSelectedTokens(prev => 
      prev.includes(token) 
        ? prev.filter(t => t !== token)
        : [...prev, token]
    );
  };

  const renderMarketOverview = () => (
    <div className="card" style={{ marginBottom: '30px' }}>
      <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
        📈 Market Overview
      </h3>
      <div className="grid-auto">
        {selectedTokens.map(token => {
          const tokenData = analysisData?.nlp_analysis?.technical_analysis?.[token];
          const sentiment = analysisData?.nlp_analysis?.social_sentiment?.[token];
          
          return (
            <div key={token} style={{
              padding: '15px',
              backgroundColor: '#111827',
              borderRadius: '8px',
              border: '1px solid #374151'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{token}</span>
                <span style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold', 
                  color: '#10b981' 
                }}>
                  ${tokenData?.current_price?.toFixed(2) || 'N/A'}
                </span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                <div>
                  <span style={{ color: '#9ca3af' }}>RSI: </span>
                  <span style={{ color: '#e5e7eb' }}>{tokenData?.rsi?.toFixed(1) || 'N/A'}</span>
                </div>
                <div>
                  <span style={{ color: '#9ca3af' }}>Sentiment: </span>
                  <span style={{ 
                    color: sentiment?.overall > 0 ? '#10b981' : sentiment?.overall < 0 ? '#ef4444' : '#9ca3af' 
                  }}>
                    {sentiment?.overall?.toFixed(2) || 'N/A'}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#9ca3af' }}>Volume: </span>
                  <span style={{ color: '#e5e7eb' }}>
                    {sentiment?.volume ? (sentiment.volume / 1000).toFixed(1) + 'K' : 'N/A'}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#9ca3af' }}>News: </span>
                  <span style={{ color: '#3b82f6' }}>
                    {analysisData?.nlp_analysis?.news_sentiment?.[token]?.article_count || 0} articles
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderSentimentAnalysis = () => (
    <div className="card" style={{ marginBottom: '30px' }}>
      <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
        🧠 AI Sentiment Analysis
      </h3>
      
      {selectedTokens.map(token => {
        const social = analysisData?.nlp_analysis?.social_sentiment?.[token];
        const news = analysisData?.nlp_analysis?.news_sentiment?.[token];
        
        return (
          <div key={token} style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#111827', borderRadius: '8px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>{token}</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
              {/* Twitter Sentiment */}
              <div>
                <h5 style={{ fontSize: '14px', color: '#3b82f6', marginBottom: '8px' }}>Twitter Sentiment</h5>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    flex: 1,
                    height: '8px',
                    backgroundColor: '#374151',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${Math.abs(social?.twitter?.sentiment || 0) * 50}%`,
                      height: '100%',
                      backgroundColor: (social?.twitter?.sentiment || 0) >= 0 ? '#10b981' : '#ef4444',
                      borderRadius: '4px'
                    }} />
                  </div>
                  <span style={{ fontSize: '12px', color: '#e5e7eb', minWidth: '60px' }}>
                    {social?.twitter?.sentiment?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                  Volume: {social?.twitter?.volume || 0} | Confidence: {((social?.twitter?.confidence || 0) * 100).toFixed(0)}%
                </div>
              </div>

              {/* News Sentiment */}
              <div>
                <h5 style={{ fontSize: '14px', color: '#f59e0b', marginBottom: '8px' }}>News Sentiment</h5>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    flex: 1,
                    height: '8px',
                    backgroundColor: '#374151',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${Math.abs(news?.sentiment || 0) * 50}%`,
                      height: '100%',
                      backgroundColor: (news?.sentiment || 0) >= 0 ? '#10b981' : '#ef4444',
                      borderRadius: '4px'
                    }} />
                  </div>
                  <span style={{ fontSize: '12px', color: '#e5e7eb', minWidth: '60px' }}>
                    {news?.sentiment?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                  Articles: {news?.article_count || 0} | Confidence: {((news?.confidence || 0) * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderPredictions = () => predictions && (
    <div className="card" style={{ marginBottom: '30px' }}>
      <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
        🎯 AI Price Predictions
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
        {predictions.predictions?.map((pred: any, index: number) => (
          <div key={index} style={{
            padding: '15px',
            backgroundColor: '#111827',
            borderRadius: '8px',
            border: '1px solid #374151'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{pred.token}</span>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                Confidence: {(pred.confidence * 100).toFixed(1)}%
              </span>
            </div>
            
            <div style={{ fontSize: '14px', color: '#d1d5db' }}>
              <div>Current: ${pred.current_price.toFixed(2)}</div>
              <div style={{ marginTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <span style={{ color: '#9ca3af' }}>1h: </span>
                  <span style={{ color: pred.predictions['1h'] > pred.current_price ? '#10b981' : '#ef4444' }}>
                    ${pred.predictions['1h'].toFixed(2)}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#9ca3af' }}>24h: </span>
                  <span style={{ color: pred.predictions['24h'] > pred.current_price ? '#10b981' : '#ef4444' }}>
                    ${pred.predictions['24h'].toFixed(2)}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#9ca3af' }}>7d: </span>
                  <span style={{ color: pred.predictions['7d'] > pred.current_price ? '#10b981' : '#ef4444' }}>
                    ${pred.predictions['7d'].toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1400px', 
      margin: '0 auto', 
      backgroundColor: '#0f0f0f', 
      minHeight: '100vh',
      color: '#f9fafb'
    }}>
      {/* Enhanced Header */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 10px 0' }}>
              📊 Advanced Analytics Dashboard
            </h1>
            <p style={{ fontSize: '16px', color: '#9ca3af', margin: 0 }}>
              Real-time AI-powered market analysis with Python integration
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#9ca3af' }}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh (30s)
            </label>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div>
            <span style={{ fontSize: '14px', color: '#9ca3af', marginRight: '10px' }}>Select Tokens:</span>
            {availableTokens.map(token => (
              <button
                key={token}
                onClick={() => toggleToken(token)}
                style={{
                  margin: '0 5px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  border: '1px solid',
                  backgroundColor: selectedTokens.includes(token) ? '#3b82f6' : '#374151',
                  borderColor: selectedTokens.includes(token) ? '#3b82f6' : '#4b5563',
                  color: selectedTokens.includes(token) ? '#ffffff' : '#d1d5db',
                  cursor: 'pointer'
                }}
              >
                {token}
              </button>
            ))}
          </div>

          <button
            onClick={fetchAnalyticsData}
            disabled={loading}
            className="btn btn-primary"
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <>
                <div className="loading-spin" style={{ 
                  width: '16px', 
                  height: '16px', 
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%'
                }} />
                Analyzing...
              </>
            ) : (
              <>🔄 Refresh Analysis</>
            )}
          </button>

          <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#9ca3af' }}>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>

        {/* Overall Confidence */}
        {analysisData && (
          <div style={{
            padding: '15px',
            backgroundColor: '#065f46',
            borderRadius: '8px',
            border: '1px solid #10b981'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Overall AI Confidence</span>
              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                {((analysisData.overall_confidence || 0) * 100).toFixed(1)}%
              </span>
            </div>
            <div style={{ marginTop: '8px', height: '6px', backgroundColor: '#047857', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                width: `${(analysisData.overall_confidence || 0) * 100}%`,
                height: '100%',
                backgroundColor: '#34d399',
                borderRadius: '3px'
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          backgroundColor: '#7f1d1d',
          border: '1px solid #dc2626',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          color: '#fca5a5'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Market Overview */}
      {analysisData && renderMarketOverview()}

      {/* Sentiment Analysis */}
      {analysisData && renderSentimentAnalysis()}

      {/* Predictions */}
      {renderPredictions()}

      {/* Research Report */}
      {analysisData?.research_report && (
        <div className="card" style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
            📄 AI Research Report
          </h3>
          <div style={{
            padding: '15px',
            backgroundColor: '#111827',
            borderRadius: '8px',
            border: '1px solid #374151'
          }}>
            <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>Executive Summary</h4>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#d1d5db', marginBottom: '15px' }}>
              {analysisData.research_report.analysis?.executive_summary}
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#9ca3af' }}>
              <span>Research Hash: {analysisData.research_report.content_hash?.slice(0, 16)}...</span>
              <span>Generated: {new Date(analysisData.timestamp).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* System Health - Compact */}
      {healthData && (
        <div className="card">
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>🏥 System Status</h3>
          <div style={{ display: 'flex', gap: '20px', fontSize: '14px' }}>
            <div>Backend: <span style={{ color: '#10b981' }}>Healthy</span></div>
            <div>AI Engine: <span style={{ color: '#10b981' }}>Active</span></div>
            <div>Python Bridge: <span style={{ color: '#10b981' }}>Connected</span></div>
            {isConnected && <div>Wallet: <span style={{ color: '#10b981' }}>Connected</span></div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedAnalytics;