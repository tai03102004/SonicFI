import React, { useState, useCallback } from 'react';

interface AIContent {
  id: number;
  contentHash: string;
  timestamp: number;
  totalStaked: number;
  positiveVotes: number;
  negativeVotes: number;
  finalized: boolean;
}

const mockContents: AIContent[] = [
  {
    id: 1,
    contentHash: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
    timestamp: Math.floor(Date.now() / 1000) - 3600,
    totalStaked: 250,
    positiveVotes: 180,
    negativeVotes: 70,
    finalized: false
  },
  {
    id: 2,
    contentHash: 'QmAbCdEfGhIjKlMnOpQrStUvWxYz1234567890AbCdEf',
    timestamp: Math.floor(Date.now() / 1000) - 7200,
    totalStaked: 150,
    positiveVotes: 90,
    negativeVotes: 60,
    finalized: true
  }
];

const SimpleResearchDashboard: React.FC = () => {
  const [contents] = useState<AIContent[]>(mockContents);
  const [selectedContent, setSelectedContent] = useState<AIContent | null>(contents[0]);
  const [stakeAmount, setStakeAmount] = useState('');

  const formatTokenAmount = useCallback((amount: number) => {
    return amount.toFixed(2);
  }, []);

  const getVotingProgress = useCallback((content: AIContent) => {
    const total = content.positiveVotes + content.negativeVotes;
    return total > 0 ? (content.positiveVotes / total) * 100 : 50;
  }, []);

  const handleVote = useCallback((_contentId: number, positive: boolean) => {
    if (!stakeAmount || parseFloat(stakeAmount) < 100) {
      alert('Minimum stake amount is 100 S tokens');
      return;
    }
    alert(`Vote ${positive ? 'approved' : 'rejected'} with ${stakeAmount} S tokens!`);
    setStakeAmount('');
  }, [stakeAmount]);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 10px 0', color: '#1a1a1a' }}>
          AI Research Platform
        </h1>
        <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
          Decentralized knowledge curation powered by community and AI
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        {[
          { label: 'Total Staked', value: '500.00 S', color: '#2563eb' },
          { label: 'Accuracy Score', value: '85', color: '#dc2626' },
          { label: 'Total Rewards', value: '120.00 S', color: '#059669' },
          { label: 'Voting Power', value: '1500', color: '#7c3aed' }
        ].map((stat, index) => (
          <div key={index} style={{ 
            border: '1px solid #ddd', 
            borderRadius: '8px', 
            padding: '20px', 
            backgroundColor: '#fff',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666', textTransform: 'uppercase' }}>
              {stat.label}
            </h3>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: stat.color }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
            Latest AI Research Reports
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {contents.map((content) => (
              <div
                key={content.id}
                style={{
                  border: selectedContent?.id === content.id ? '2px solid #2563eb' : '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '20px',
                  cursor: 'pointer',
                  backgroundColor: selectedContent?.id === content.id ? '#eff6ff' : '#fff'
                }}
                onClick={() => setSelectedContent(content)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 'bold' }}>
                      Research Report #{content.id}
                    </h3>
                    <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                      {new Date(content.timestamp * 1000).toLocaleDateString()}
                    </p>
                  </div>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: content.finalized ? '#dcfce7' : '#fef3c7',
                    color: content.finalized ? '#166534' : '#a16207'
                  }}>
                    {content.finalized ? 'Finalized' : 'Active'}
                  </span>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                    <span>Community Sentiment</span>
                    <span>{formatTokenAmount(content.totalStaked)} S staked</span>
                  </div>
                  <div style={{ 
                    width: '100%', 
                    height: '8px', 
                    backgroundColor: '#e5e5e5', 
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${getVotingProgress(content)}%`,
                      height: '100%',
                      backgroundColor: getVotingProgress(content) > 50 ? '#10b981' : '#ef4444',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#888', marginTop: '2px' }}>
                    <span>👍 {formatTokenAmount(content.positiveVotes)} S</span>
                    <span>👎 {formatTokenAmount(content.negativeVotes)} S</span>
                  </div>
                </div>

                {!content.finalized && (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="number"
                      placeholder="Stake amount"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVote(content.id, true);
                      }}
                      style={{
                        padding: '8px 16px',
                        border: '1px solid #10b981',
                        borderRadius: '4px',
                        backgroundColor: '#fff',
                        color: '#10b981',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      👍 Approve
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVote(content.id, false);
                      }}
                      style={{
                        padding: '8px 16px',
                        border: '1px solid #ef4444',
                        borderRadius: '4px',
                        backgroundColor: '#fff',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      👎 Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
            Research Details
          </h2>
          
          {selectedContent ? (
            <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: '#fff' }}>
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>Executive Summary</h4>
                <p style={{ fontSize: '14px', lineHeight: 1.5, color: '#333' }}>
                  Current market analysis shows mixed signals with Bitcoin showing consolidation patterns while Ethereum demonstrates stronger momentum. Sonic blockchain integration provides positive outlook for DeFi adoption.
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>Confidence Score</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    flex: 1,
                    height: '20px',
                    backgroundColor: '#e5e5e5',
                    borderRadius: '10px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: '78%',
                      height: '100%',
                      backgroundColor: '#f59e0b',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#f59e0b'
                  }}>
                    78%
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>Price Predictions</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { token: 'BTC', trend: 'up', change: 5.2 },
                    { token: 'ETH', trend: 'up', change: 8.1 },
                    { token: 'SONIC', trend: 'up', change: 12.4 }
                  ].map((prediction) => (
                    <div key={prediction.token} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{prediction.token}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '20px' }}>
                          {prediction.trend === 'up' ? '📈' : '📉'}
                        </span>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: 'bold',
                          color: prediction.change > 0 ? '#10b981' : '#ef4444'
                        }}>
                          +{prediction.change}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>Trading Recommendations</h4>
                <ul style={{ fontSize: '14px', lineHeight: 1.5, color: '#333', paddingLeft: '20px', margin: 0 }}>
                  <li style={{ marginBottom: '5px' }}>Consider DCA strategy for BTC accumulation</li>
                  <li style={{ marginBottom: '5px' }}>ETH showing strength for swing trading</li>
                  <li style={{ marginBottom: '5px' }}>SONIC early adoption opportunity</li>
                </ul>
              </div>
            </div>
          ) : (
            <div style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '40px',
              textAlign: 'center',
              backgroundColor: '#f9f9f9'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>📊</div>
              <p style={{ fontSize: '16px', color: '#666' }}>
                Select a research report to view detailed analysis
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleResearchDashboard;
