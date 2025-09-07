import React, { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';

interface Trader {
  id: string;
  name: string;
  avatar: string;
  winRate: number;
  totalReturn: number;
  followers: number;
  recentTrades: number;
  reputation: number;
  speciality: string[];
}

interface Trade {
  id: string;
  trader: string;
  token: string;
  action: 'BUY' | 'SELL';
  price: number;
  amount: number;
  timestamp: string;
  pnl?: number;
  status: 'OPEN' | 'CLOSED';
}

const SocialTrading: React.FC = () => {
  const { isConnected,  } = useWallet();
  const [topTraders, setTopTraders] = useState<Trader[]>([]);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'traders' | 'trades' | 'leaderboard'>('traders');

  useEffect(() => {
    // Generate mock traders data
    const mockTraders: Trader[] = [
      {
        id: '1',
        name: 'CryptoKing👑',
        avatar: '👑',
        winRate: 87,
        totalReturn: 234,
        followers: 1247,
        recentTrades: 23,
        reputation: 95,
        speciality: ['BTC', 'ETH', 'DeFi']
      },
      {
        id: '2', 
        name: 'WhaleWatcher🐋',
        avatar: '🐋',
        winRate: 91,
        totalReturn: 189,
        followers: 892,
        recentTrades: 31,
        reputation: 88,
        speciality: ['BTC', 'Altcoins']
      },
      {
        id: '3',
        name: 'AITrader🤖',
        avatar: '🤖',
        winRate: 78,
        totalReturn: 156,
        followers: 2341,
        recentTrades: 45,
        reputation: 92,
        speciality: ['Technical Analysis', 'Scalping']
      },
      {
        id: '4',
        name: 'DeFiMaster⚡',
        avatar: '⚡',
        winRate: 85,
        totalReturn: 298,
        followers: 1876,
        recentTrades: 19,
        reputation: 89,
        speciality: ['DeFi', 'Yield Farming']
      }
    ];

    // Generate mock trades
    const mockTrades: Trade[] = [];
    for (let i = 0; i < 20; i++) {
      const trader = mockTraders[Math.floor(Math.random() * mockTraders.length)];
      const tokens = ['BTC', 'ETH', 'SONIC'];
      const token = tokens[Math.floor(Math.random() * tokens.length)];
      const action = Math.random() > 0.6 ? 'BUY' : 'SELL';
      
      mockTrades.push({
        id: `trade_${i}`,
        trader: trader.name,
        token,
        action,
        price: Math.random() * 100000,
        amount: Math.random() * 10,
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        pnl: Math.random() > 0.7 ? (Math.random() - 0.3) * 1000 : undefined,
        status: Math.random() > 0.3 ? 'OPEN' : 'CLOSED'
      });
    }

    setTopTraders(mockTraders);
    setRecentTrades(mockTrades.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  }, []);

  const toggleFollow = (traderId: string) => {
    const newFollowing = new Set(following);
    if (newFollowing.has(traderId)) {
      newFollowing.delete(traderId);
    } else {
      newFollowing.add(traderId);
    }
    setFollowing(newFollowing);
  };

  const copyTrade = (trade: Trade) => {
    if (!isConnected) return;
    
    // Simulate copy trade action
    alert(`📋 Copying ${trade.action} signal for ${trade.token} at $${trade.price.toFixed(2)}`);
  };

  const renderTraders = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
      {topTraders.map(trader => (
        <div key={trader.id} className="card" style={{
          border: following.has(trader.id) ? '2px solid #10b981' : '1px solid #374151'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '32px' }}>{trader.avatar}</div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#f9fafb' }}>
                  {trader.name}
                </h4>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  {trader.followers.toLocaleString()} followers
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              {Array.from({length: 5}).map((_, i) => (
                <span key={i} style={{
                  color: i < Math.floor(trader.reputation / 20) ? '#f59e0b' : '#374151'
                }}>⭐</span>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
                {trader.winRate}%
              </div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>Win Rate</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3b82f6' }}>
                +{trader.totalReturn}%
              </div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>Total Return</div>
            </div>
          </div>

          {/* Speciality Tags */}
          <div style={{ display: 'flex', gap: '5px', marginBottom: '15px', flexWrap: 'wrap' }}>
            {trader.speciality.map(tag => (
              <span key={tag} style={{
                padding: '2px 8px',
                backgroundColor: '#374151',
                borderRadius: '12px',
                fontSize: '10px',
                color: '#d1d5db'
              }}>
                {tag}
              </span>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => toggleFollow(trader.id)}
              className={following.has(trader.id) ? "btn btn-secondary" : "btn btn-primary"}
              style={{ flex: 1, fontSize: '12px' }}
            >
              {following.has(trader.id) ? '✅ Following' : '➕ Follow'}
            </button>
            <button 
              className="btn btn-success"
              style={{ flex: 1, fontSize: '12px' }}
              onClick={() => copyTrade(recentTrades.find(t => t.trader === trader.name) || recentTrades[0])}
            >
              📋 Copy
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTrades = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {recentTrades.slice(0, 10).map(trade => (
        <div key={trade.id} style={{
          padding: '15px',
          backgroundColor: '#1f2937',
          borderRadius: '8px',
          border: '1px solid #374151',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{
              padding: '4px 8px',
              borderRadius: '4px',
              backgroundColor: trade.action === 'BUY' ? '#065f46' : '#7f1d1d',
              color: trade.action === 'BUY' ? '#34d399' : '#fca5a5',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {trade.action}
            </div>
            
            <div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#f9fafb' }}>
                {trade.token}
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                by {trade.trader}
              </div>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', color: '#e5e7eb' }}>
                ${trade.price.toFixed(2)}
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                {trade.amount.toFixed(2)} {trade.token}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {trade.pnl !== undefined && (
              <div style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: trade.pnl >= 0 ? '#10b981' : '#ef4444'
              }}>
                {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(0)}
              </div>
            )}
            
            <div style={{
              padding: '2px 6px',
              borderRadius: '10px',
              backgroundColor: trade.status === 'OPEN' ? '#f59e0b' : '#10b981',
              fontSize: '10px',
              color: '#ffffff'
            }}>
              {trade.status}
            </div>
            
            <button 
              onClick={() => copyTrade(trade)}
              className="btn btn-primary"
              style={{ padding: '4px 8px', fontSize: '10px' }}
              disabled={!isConnected}
            >
              Copy
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="card">
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#f9fafb' }}>
            👥 Social Trading
          </h2>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
            Follow and copy the best crypto traders
          </p>
        </div>

        {!isConnected && (
          <div style={{
            marginTop: '15px',
            padding: '10px',
            backgroundColor: '#92400e',
            borderRadius: '6px',
            color: '#fbbf24',
            fontSize: '14px'
          }}>
            💡 Connect your wallet to start copy trading
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="card" style={{ padding: '10px' }}>
        <div style={{ display: 'flex', gap: '0', borderRadius: '8px', backgroundColor: '#111827', padding: '4px' }}>
          {[
            { id: 'traders', label: '👑 Top Traders', count: topTraders.length },
            { id: 'trades', label: '📊 Live Trades', count: recentTrades.length },
            { id: 'leaderboard', label: '🏆 Leaderboard', count: '24h' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: 'none',
                backgroundColor: activeTab === tab.id ? '#3b82f6' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : '#9ca3af',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'traders' && renderTraders()}
      {activeTab === 'trades' && renderTrades()}
      
      {activeTab === 'leaderboard' && (
        <div className="card">
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>
            🏆 24h Performance Leaderboard
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {topTraders.map((trader, index) => (
              <div key={trader.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                backgroundColor: index < 3 ? '#065f46' : '#1f2937',
                borderRadius: '8px',
                border: index < 3 ? '1px solid #10b981' : '1px solid #374151'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ 
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: index === 0 ? '#fbbf24' : index === 1 ? '#d1d5db' : index === 2 ? '#cd7c2f' : '#9ca3af'
                  }}>
                    #{index + 1}
                  </span>
                  <span style={{ fontSize: '20px' }}>{trader.avatar}</span>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#f9fafb' }}>{trader.name}</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                      {trader.followers.toLocaleString()} followers
                    </div>
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981' }}>
                    +{trader.totalReturn}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                    {trader.recentTrades} trades
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialTrading;
