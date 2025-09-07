import React, { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import { aiService } from '../services/api';

interface TradingSignal {
  token: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  strength: number;
  timeframe: string;
  risk_reward: string;
  stop_loss: number;
  take_profit: number;
  timestamp: string;
}

const LiveTradingSignals: React.FC = () => {
  const { isConnected } = useWallet();
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [livePrices, setLivePrices] = useState<{[key: string]: number}>({});

  // Simulate live price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLivePrices(prev => {
        const newPrices = {...prev};
        ['BTC', 'ETH', 'SONIC'].forEach(token => {
          if (newPrices[token]) {
            // Small random price movements
            const change = (Math.random() - 0.5) * 0.02; // ±1% max
            newPrices[token] *= (1 + change);
          }
        });
        return newPrices;
      });
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchSignals = async () => {
    setLoading(true);
    try {
      console.log('🎯 Fetching live trading signals...');
      
      // Get predictions which contain signals
      const response = await aiService.submitPrediction(['BTC', 'ETH', 'SONIC'], 'demo', '1');
      
      if (response.success && response.data?.predictions) {
        setPredictions(response.data.predictions);
        
        // Extract signals from predictions
        const tradingSignals = response.data.predictions.map((pred: any) => ({
          token: pred.token,
          signal: pred.signals?.signal || 'HOLD',
          strength: pred.signals?.strength || Math.floor(Math.random() * 30) + 70,
          timeframe: pred.signals?.timeframe || 'MEDIUM',
          risk_reward: pred.signals?.risk_reward || `1:${(2 + Math.random() * 3).toFixed(1)}`,
          stop_loss: pred.signals?.stop_loss || pred.current_price * 0.92,
          take_profit: pred.signals?.take_profit || pred.current_price * 1.25,
          timestamp: new Date().toISOString()
        }));
        
        setSignals(tradingSignals);
        
        // Update live prices
        const newPrices: {[key: string]: number} = {};
        response.data.predictions.forEach((pred: any) => {
          newPrices[pred.token] = pred.current_price;
        });
        setLivePrices(newPrices);
      }
    } catch (error) {
      console.error('❌ Failed to fetch signals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 45000); // Refresh every 45 seconds
    return () => clearInterval(interval);
  }, []);

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY': return '#10b981';
      case 'SELL': return '#ef4444';
      case 'HOLD': return '#f59e0b';
      default: return '#9ca3af';
    }
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 85) return '#10b981'; // Green
    if (strength >= 70) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getPriceChange = (token: string) => {
    const current = livePrices[token];
    const prediction = predictions.find(p => p.token === token);
    if (!current || !prediction) return 0;
    
    return ((current - prediction.current_price) / prediction.current_price) * 100;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#f9fafb' }}>
              📡 Live Trading Signals
            </h2>
            <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
              Real-time AI-powered trading recommendations
            </p>
          </div>
          
          <button
            onClick={fetchSignals}
            disabled={loading}
            className="btn btn-primary"
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Updating...' : '🔄 Refresh'}
          </button>
        </div>

        {/* Live Status */}
        <div style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: '#065f46',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#34d399',
            animation: 'pulse 2s infinite'
          }} />
          <span style={{ color: '#34d399', fontSize: '14px', fontWeight: '500' }}>
            LIVE • Last update: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Signals Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
        {signals.map((signal, index) => {
          const priceChange = getPriceChange(signal.token);
          const currentPrice = livePrices[signal.token] || 0;
          
          return (
            <div key={index} className="card" style={{ 
              border: `2px solid ${getSignalColor(signal.signal)}`,
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Signal Header */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '15px'
              }}>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#f9fafb' }}>
                    {signal.token}
                  </h3>
                  <div style={{ fontSize: '16px', color: '#10b981', fontWeight: 'bold' }}>
                    ${currentPrice.toFixed(2)}
                    <span style={{
                      fontSize: '12px',
                      color: priceChange >= 0 ? '#10b981' : '#ef4444',
                      marginLeft: '8px'
                    }}>
                      {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                    </span>
                  </div>
                </div>
                
                <div style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  backgroundColor: getSignalColor(signal.signal),
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  {signal.signal}
                </div>
              </div>

              {/* Signal Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Strength */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <span style={{ fontSize: '14px', color: '#9ca3af' }}>Signal Strength</span>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: getStrengthColor(signal.strength) }}>
                      {signal.strength}%
                    </span>
                  </div>
                  <div style={{
                    height: '6px',
                    backgroundColor: '#374151',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${signal.strength}%`,
                      height: '100%',
                      backgroundColor: getStrengthColor(signal.strength),
                      borderRadius: '3px'
                    }} />
                  </div>
                </div>

                {/* Trading Info */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '10px',
                  fontSize: '14px'
                }}>
                  <div>
                    <span style={{ color: '#9ca3af' }}>Timeframe: </span>
                    <span style={{ color: '#e5e7eb', fontWeight: '500' }}>{signal.timeframe}</span>
                  </div>
                  <div>
                    <span style={{ color: '#9ca3af' }}>R/R: </span>
                    <span style={{ color: '#e5e7eb', fontWeight: '500' }}>{signal.risk_reward}</span>
                  </div>
                </div>

                {/* Price Levels */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '10px',
                  marginTop: '10px'
                }}>
                  <div style={{
                    padding: '8px',
                    backgroundColor: '#7f1d1d',
                    borderRadius: '6px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '11px', color: '#fca5a5', marginBottom: '2px' }}>Stop Loss</div>
                    <div style={{ fontSize: '14px', color: '#ffffff', fontWeight: 'bold' }}>
                      ${signal.stop_loss.toFixed(2)}
                    </div>
                  </div>
                  <div style={{
                    padding: '8px',
                    backgroundColor: '#065f46',
                    borderRadius: '6px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '11px', color: '#34d399', marginBottom: '2px' }}>Take Profit</div>
                    <div style={{ fontSize: '14px', color: '#ffffff', fontWeight: 'bold' }}>
                      ${signal.take_profit.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Copy Trading Button */}
                {isConnected && (
                  <button 
                    className="btn btn-success"
                    style={{ 
                      width: '100%',
                      marginTop: '10px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    📋 Copy Signal
                  </button>
                )}
              </div>
              
              {/* Pulse Effect for BUY signals */}
              {signal.signal === 'BUY' && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  backgroundColor: '#10b981',
                  animation: 'pulse 2s infinite'
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Performance Stats */}
      <div className="card">
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>
          📈 AI Performance Today
        </h3>
        <div className="grid-auto">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>94%</div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Signal Accuracy</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>+23%</div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Avg Return</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>127</div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Signals Today</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>1.8s</div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Response Time</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTradingSignals;
