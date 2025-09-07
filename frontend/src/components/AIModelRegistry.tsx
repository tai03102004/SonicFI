import React, { useState } from 'react';
import { useWallet } from '../hooks/useWallet';

const AIModelRegistry: React.FC = () => {
  const { isConnected,  } = useWallet();
  const [models] = useState([
    {
      id: 1,
      owner: '0x123...456',
      name: 'Sentiment Analysis Model v2.1',
      description: 'Advanced NLP model for crypto sentiment analysis with 94% accuracy rate. Trained on 500K+ tweets and news articles.',
      ipfsHash: 'QmX1Y2Z3...',
      price: '150',
      active: true,
      performance: '94.2%',
      downloads: 1247,
      rating: 4.8
    },
    {
      id: 2,
      owner: '0x789...012', 
      name: 'Price Prediction Neural Network',
      description: 'Deep learning model for short-term price predictions using technical indicators and market sentiment.',
      ipfsHash: 'QmA4B5C6...',
      price: '320',
      active: true,
      performance: '87.5%',
      downloads: 892,
      rating: 4.6
    },
    {
      id: 3,
      owner: '0x345...678',
      name: 'Technical Analysis Automator',
      description: 'Automated technical indicator analysis with real-time signal generation for 20+ indicators.',
      ipfsHash: 'QmD7E8F9...',
      price: '200',
      active: true,
      performance: '91.3%',
      downloads: 623,
      rating: 4.7
    },
    {
      id: 4,
      owner: '0xABC...DEF',
      name: 'Whale Movement Detector',
      description: 'AI model that tracks large wallet movements and predicts their market impact with high accuracy.',
      ipfsHash: 'QmG1H2I3...',
      price: '450',
      active: true,
      performance: '89.8%',
      downloads: 445,
      rating: 4.9
    }
  ]);
  
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [purchasing, setPurchasing] = useState<number | null>(null);

  const handlePurchase = async (modelId: number) => {
    if (!isConnected) {
      alert('Please connect your wallet first!');
      return;
    }

    setPurchasing(modelId);
    
    // Simulate purchase process
    setTimeout(() => {
      alert(`🎉 Successfully purchased model #${modelId}! You can now access this AI model in your dashboard.`);
      setPurchasing(null);
    }, 2000);
  };

  const handlePreview = (model: any) => {
    setSelectedModel(model);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#f9fafb' }}>
              🤖 AI Model Marketplace
            </h2>
            <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
              Discover and purchase cutting-edge AI models for crypto trading
            </p>
          </div>
          
          {isConnected && (
            <button className="btn btn-primary" style={{ padding: '12px 20px' }}>
              📤 Upload Model
            </button>
          )}
        </div>

        {/* RPC Status Warning */}
        <div style={{
          marginTop: '15px',
          padding: '12px',
          backgroundColor: '#92400e',
          borderRadius: '6px',
          border: '1px solid #d97706'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>⚠️</span>
            <div>
              <div style={{ color: '#fbbf24', fontSize: '14px', fontWeight: 'bold' }}>
                Sonic RPC Temporary Issue
              </div>
              <div style={{ color: '#fcd34d', fontSize: '12px', marginTop: '2px' }}>
                Currently showing demo data. Smart contract integration will resume when RPC is stable.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Marketplace Stats */}
      <div className="grid-4">
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏪</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b82f6' }}>24</div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>Active Models</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>👥</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>1,247</div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>Total Users</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>💰</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b' }}>45.2K</div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>S Tokens Earned</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⭐</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#8b5cf6' }}>4.7</div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>Avg Rating</div>
        </div>
      </div>

      {/* Model Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
        {models.map(model => (
          <div key={model.id} className="card" style={{ 
            border: selectedModel?.id === model.id ? '2px solid #3b82f6' : '1px solid #374151',
            cursor: 'pointer'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#f9fafb' }}>
                  {model.name}
                </h3>
                <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: 1.5, margin: '0 0 12px 0' }}>
                  {model.description}
                </p>
                
                {/* Model Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981' }}>
                      {model.performance}
                    </div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>Accuracy</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#3b82f6' }}>
                      {model.downloads}
                    </div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>Downloads</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f59e0b' }}>
                      {model.rating}⭐
                    </div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>Rating</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Price and Actions */}
            <div style={{ 
              borderTop: '1px solid #374151',
              paddingTop: '15px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
                  {model.price} S
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  by {model.owner}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handlePreview(model)}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  👁️ Preview
                </button>
                
                <button
                  onClick={() => handlePurchase(model.id)}
                  disabled={purchasing === model.id}
                  className="btn btn-success"
                  style={{ 
                    padding: '6px 12px', 
                    fontSize: '12px',
                    opacity: purchasing === model.id ? 0.7 : 1
                  }}
                >
                  {purchasing === model.id ? '⏳ Buying...' : '🛒 Buy'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Model Preview Modal */}
      {selectedModel && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ 
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#f9fafb' }}>
                {selectedModel.name}
              </h3>
              <button
                onClick={() => setSelectedModel(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  color: '#9ca3af',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <p style={{ color: '#d1d5db', lineHeight: 1.6 }}>
                {selectedModel.description}
              </p>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '15px',
                marginTop: '20px'
              }}>
                <div>
                  <h4 style={{ color: '#f9fafb', marginBottom: '10px' }}>📊 Performance Metrics</h4>
                  <ul style={{ color: '#9ca3af', fontSize: '14px', paddingLeft: '20px' }}>
                    <li>Accuracy: {selectedModel.performance}</li>
                    <li>Downloads: {selectedModel.downloads.toLocaleString()}</li>
                    <li>User Rating: {selectedModel.rating}/5.0</li>
                    <li>Last Updated: 2 days ago</li>
                  </ul>
                </div>
                
                <div>
                  <h4 style={{ color: '#f9fafb', marginBottom: '10px' }}>🔧 Technical Details</h4>
                  <ul style={{ color: '#9ca3af', fontSize: '14px', paddingLeft: '20px' }}>
                    <li>Model Type: Neural Network</li>
                    <li>Input: Market Data + Sentiment</li>
                    <li>Output: Prediction Confidence</li>
                    <li>Response Time: ~50ms</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              paddingTop: '20px',
              borderTop: '1px solid #374151'
            }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                  {selectedModel.price} S Tokens
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  One-time purchase • Lifetime access
                </div>
              </div>
              
              <button
                onClick={() => handlePurchase(selectedModel.id)}
                className="btn btn-success"
                style={{ padding: '12px 24px' }}
              >
                💳 Purchase Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIModelRegistry;
