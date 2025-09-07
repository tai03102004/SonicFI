import React, { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { aiService } from '../services/api';
import { AIAnalysisResult } from '@/types/api';


interface PredictionResult {
  predictions: Array<{
    token: string;
    current_price: number;
    predictions: { '24h': number; '7d': number };
    confidence: number;
  }>;
  user_address: string;
  stake_amount: string;
}

const SimpleResearchDashboard: React.FC = () => {
  const { isConnected, address } = useWallet();
  const [selectedTokens, setSelectedTokens] = useState<string[]>(['BTC']);
  const [stakeAmount, setStakeAmount] = useState('100');
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [, setError] = useState<string | null>(null);

  const availableTokens = ['BTC', 'ETH', 'SONIC'];

  // Enhanced API calls with better error handling
  const getAnalysis = async () => {
    if (!selectedTokens.length) return;

    setLoading(true);
    setError(null);

    try { 
      console.log('🔄 Calling AI Analysis API...');
      
      const response = await aiService.getAnalysis(selectedTokens);
      
      if (response.success) {
        if (response.data) {
          setAnalysisResult(response.data);
        } else {
          throw new Error('Invalid analysis result');
        }
        console.log('✅ Analysis completed:', response.data);
      } else {
        throw new Error(response.error || 'Analysis failed');
      }
    } catch (err: any) {
      console.error('❌ Analysis error:', err);
      let errorMessage = err.message || 'Failed to get analysis';
      
      // Handle specific deployment errors
      if (errorMessage.includes('fetch')) {
        errorMessage = 'Cannot connect to AI service. Check deployment status.';
      } else if (errorMessage.includes('CORS')) {
        errorMessage = 'Cross-origin error. Check API configuration.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const submitPrediction = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    if (!selectedTokens.length || !stakeAmount || parseFloat(stakeAmount) < 100) {
      setError('Please select tokens and minimum 100 S stake');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Submitting prediction...');
      
      const response = await aiService.submitPrediction(selectedTokens, address, stakeAmount);
      
      if (response.success) {
        if (response.data) {
          setPredictionResult({
            ...response.data,
            predictions: response.data.predictions.map((pred: any) => ({
              token: pred.token,
              current_price: pred.current_price || 0,
              predictions: pred.predictions || { '24h': 0, '7d': 0 },
              confidence: pred.confidence || 0,
            })),
          });
        } else {
          throw new Error('Invalid prediction result');
        }
        console.log('✅ Prediction submitted:', response.data);
      } else {
        throw new Error(response.error || 'Prediction failed');
      }
    } catch (err: any) {
      console.error('❌ Prediction error:', err);
      let errorMessage = err.message || 'Failed to submit prediction';
      
      // Handle deployment-specific errors
      if (errorMessage.includes('timeout')) {
        errorMessage = 'Request timeout. The AI service might be processing...';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleToken = (token: string) => {
    setSelectedTokens(prev => 
      prev.includes(token) 
        ? prev.filter(t => t !== token)
        : [...prev, token]
    );
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1200px', 
      margin: '0 auto', 
      backgroundColor: '#0f0f0f', 
      minHeight: '100vh' 
    }}>      
      {/* Header with connection status */}
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 10px 0', color: '#f9fafb' }}>
          🧠 AI Research Platform
        </h1>
        <p style={{ fontSize: '16px', color: '#9ca3af', margin: 0 }}>
          AI-powered market analysis and predictions with blockchain verification
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid-auto" style={{ marginBottom: '30px' }}>
        {[
          { label: 'AI Models Active', value: '5', color: '#3b82f6', icon: '🤖' },
          { label: 'Accuracy Score', value: '87%', color: '#10b981', icon: '🎯' },
          { label: 'Total Predictions', value: '1,247', color: '#8b5cf6', icon: '📊' },
          { label: 'Community Staked', value: '45.2K S', color: '#f59e0b', icon: '💰' }
        ].map((stat, index) => (
          <div key={index} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>{stat.icon}</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#9ca3af', textTransform: 'uppercase' }}>
              {stat.label}
            </h3>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: stat.color }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gap: '30px' }}>
        {/* Control Panel */}
        <div className="card">
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#f9fafb' }}>
            🎮 Analysis Control
          </h2>
          
          {/* Token Selection */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#d1d5db', fontWeight: '500' }}>
              Select Tokens:
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {availableTokens.map(token => (
                <button
                  key={token}
                  onClick={() => toggleToken(token)}
                  style={{
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
          </div>

          {/* Stake Amount */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#d1d5db', fontWeight: '500' }}>
              Stake Amount (S tokens):
            </label>
            <input
              type="number"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder="Minimum 100 S"
              min="100"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #374151',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: '#111827',
                color: '#e5e7eb'
              }}
            />
          </div>

          {/* Enhanced action buttons with deployment considerations */}
          <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
            <button
              onClick={getAnalysis}
              disabled={loading || !selectedTokens.length}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                fontWeight: '600',
                opacity:  1
              }}
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
                <>🔍 Get AI Analysis</>
              )}
            </button>

            <button
              onClick={submitPrediction}
              disabled={loading || !isConnected || !analysisResult}
              className={!isConnected ? "btn btn-secondary" : "btn btn-success"}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                fontWeight: '600',
                opacity: loading || !analysisResult  ? 0.7 : 1
              }}
            >
              {!isConnected ? (
                <>🔗 Connect Wallet First</>
              ) : (
                <>🚀 Submit Prediction</>
              )}
            </button>
          </div>

          {/* Connection Status */}
          <div style={{ 
            marginTop: '15px', 
            padding: '8px 12px', 
            borderRadius: '6px',
            fontSize: '12px',
            backgroundColor: isConnected ? '#065f46' : '#92400e',
            color: isConnected ? '#34d399' : '#fbbf24'
          }}>
            {isConnected ? (
              <>✅ Wallet Connected - Ready to predict</>
            ) : (
              <>💡 Connect wallet to submit predictions</>
            )}
          </div>
        </div>

        {/* Results Panel */}
        <div className="card">
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#f9fafb' }}>
            📊 Analysis Results
          </h2>
          
          {analysisResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Overall Confidence Score */}
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', color: '#f9fafb' }}>
                  AI Confidence Score
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    flex: 1,
                    height: '16px',
                    backgroundColor: '#374151',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${((analysisResult.overall_confidence || 0) * 100).toFixed(1)}%`,
                      height: '100%',
                      backgroundColor: '#10b981',
                      borderRadius: '8px'
                    }} />
                  </div>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#10b981'
                  }}>
                    {((analysisResult.overall_confidence || 0) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Executive Summary */}
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', color: '#f9fafb' }}>
                  Executive Summary
                </h4>
                <p style={{ fontSize: '14px', lineHeight: 1.5, color: '#d1d5db', margin: 0 }}>
                  {analysisResult.research_report?.analysis?.executive_summary || 'Analysis completed. Check detailed insights below.'}
                </p>
              </div>

              {/* Key Findings */}
              {analysisResult.research_report?.analysis?.key_findings && (
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', color: '#f9fafb' }}>
                    Key Findings
                  </h4>
                  <div style={{ fontSize: '14px', lineHeight: 1.5, color: '#d1d5db' }}>
                    {Object.entries(analysisResult.research_report.analysis.key_findings).map(([token, finding]) => (
                      <div key={token} style={{ marginBottom: '8px' }}>
                        <strong style={{ color: '#3b82f6' }}>{token}:</strong> {String(finding)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Market Sentiment & Risk Assessment */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#f9fafb' }}>
                    Market Sentiment
                  </h4>
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    backgroundColor: '#374151',
                    color: '#e5e7eb',
                    fontSize: '12px'
                  }}>
                    {analysisResult.research_report?.analysis?.market_sentiment || 'N/A'}
                  </div>
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#f9fafb' }}>
                    Risk Assessment
                  </h4>
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    backgroundColor: '#374151',
                    color: '#e5e7eb',
                    fontSize: '12px'
                  }}>
                    {analysisResult.research_report?.analysis?.risk_assessment || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Market Signals */}
              {analysisResult.market_signals && analysisResult.market_signals.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', color: '#f9fafb' }}>
                    Market Signals
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {analysisResult.market_signals.map((signal: { signal: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; token: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; strength: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; timeframe: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; risk_reward: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; }, index: React.Key | null | undefined) => (
                      <div key={index} style={{
                        padding: '12px',
                        borderRadius: '6px',
                        backgroundColor: signal.signal === 'BUY' ? '#065f46' : '#7f1d1d',
                        border: `1px solid ${signal.signal === 'BUY' ? '#10b981' : '#ef4444'}`
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb' }}>
                            {signal.token} - {signal.signal}
                          </span>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: signal.signal === 'BUY' ? '#34d399' : '#fca5a5'
                          }}>
                            {signal.strength}% Strength
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                          Timeframe: {signal.timeframe} | Risk/Reward: {signal.risk_reward}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Analysis Summary */}
              {analysisResult.nlp_analysis?.technical_analysis && (
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', color: '#f9fafb' }}>
                    Technical Analysis
                  </h4>
                  {Object.entries(analysisResult.nlp_analysis.technical_analysis).map(([token, data]: [string, any]) => (
                    <div key={token} style={{
                      padding: '12px',
                      borderRadius: '6px',
                      backgroundColor: '#111827',
                      border: '1px solid #374151',
                      marginBottom: '8px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#3b82f6' }}>{token}</span>
                        <span style={{ fontSize: '12px', color: '#10b981' }}>
                          ${data.current_price?.toFixed(2)}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', color: '#9ca3af' }}>
                        <div>RSI: {data.rsi?.toFixed(1)}</div>
                        <div>Trend: {data.trend}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Prediction Results */}
              {predictionResult && (
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', color: '#f9fafb' }}>
                    🎯 Prediction Submitted
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {predictionResult.predictions.map((pred, index) => (
                      <div key={index} style={{
                        padding: '10px',
                        borderRadius: '6px',
                        backgroundColor: '#111827',
                        border: '1px solid #374151'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb' }}>
                            {pred.token}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '12px', color: '#9ca3af' }}>24h:</span>
                            <span style={{
                              fontSize: '14px',
                              fontWeight: 'bold',
                              color: pred.predictions['24h'] > pred.current_price ? '#10b981' : '#ef4444'
                            }}>
                              ${pred.predictions['24h'].toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                          Confidence: {(pred.confidence * 100).toFixed(1)}% | 
                          Staked: {predictionResult.stake_amount} S
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#9ca3af'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
              <p style={{ fontSize: '16px', margin: 0 }}>
                Select tokens and run AI analysis to see results
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleResearchDashboard;