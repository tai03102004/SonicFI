import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface AIContent {
  id: number;
  contentHash: string;
  aiAgent: string;
  timestamp: number;
  totalStaked: number;
  positiveVotes: number;
  negativeVotes: number;
  finalized: boolean;
  rewardPool: number;
}

interface ResearchReport {
  executive_summary: string;
  key_findings: Record<string, any>;
  market_sentiment: any;
  price_predictions: Record<string, any>;
  risk_assessment: string;
  trading_recommendations: string[];
  confidence: number;
  detailed_analysis: {
    news_sentiment: any;
    social_sentiment: any;
    technical_analysis: any;
    onchain_metrics: any;
    market_signals: any[];
  };
}

const SimpleResearchDashboard: React.FC = () => {
  const [contents, setContents] = useState<AIContent[]>([]);
  const [selectedContent, setSelectedContent] = useState<AIContent | null>(null);
  const [researchReport, setResearchReport] = useState<ResearchReport | null>(null);
  const [userStats, setUserStats] = useState({
    totalStaked: 0,
    accuracyScore: 0,
    totalRewards: 0,
    votingPower: 0
  });
  const [loading, setLoading] = useState(false);
  const [stakeAmount, setStakeAmount] = useState('');
  const [connectedAccount, setConnectedAccount] = useState<string>('');

  useEffect(() => {
    fetchContents();
    fetchUserStats();
    connectWallet();
  }, []);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setConnectedAccount(accounts[0]);
      } catch (error) {
        console.error('Error connecting wallet:', error);
      }
    }
  };

  const fetchContents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/contents');
      const data = await response.json();
      setContents(data);
    } catch (error) {
      console.error('Error fetching contents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await fetch(`/api/user-stats?address=${connectedAccount}`);
      const data = await response.json();
      setUserStats(data);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchResearchReport = async (contentHash: string) => {
    try {
      const response = await fetch(`/api/research/${contentHash}`);
      const data = await response.json();
      setResearchReport(data);
    } catch (error) {
      console.error('Error fetching research report:', error);
    }
  };

  const handleVote = async (contentId: number, positive: boolean) => {
    if (!stakeAmount || parseFloat(stakeAmount) < 100) {
      alert('Minimum stake amount is 100 S tokens');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentId,
          amount: stakeAmount,
          positive,
          userAddress: connectedAccount
        }),
      });
      
      if (response.ok) {
        alert('Vote submitted successfully!');
        fetchContents();
        fetchUserStats();
        setStakeAmount('');
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert('Error submitting vote');
    } finally {
      setLoading(false);
    }
  };

  const formatTokenAmount = (amount: number) => {
    return (amount / 1e18).toFixed(2);
  };

  const getVotingProgress = (content: AIContent) => {
    const total = content.positiveVotes + content.negativeVotes;
    return total > 0 ? (content.positiveVotes / total) * 100 : 50;
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px', borderBottom: '2px solid #e5e5e5', paddingBottom: '20px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 10px 0', color: '#1a1a1a' }}>
          AI SocialFi Research Platform
        </h1>
        <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
          Decentralized knowledge curation powered by community and AI
        </p>
        {connectedAccount && (
          <p style={{ fontSize: '14px', color: '#888', marginTop: '10px' }}>
            Connected: {connectedAccount.slice(0, 6)}...{connectedAccount.slice(-4)}
          </p>
        )}
      </div>

      {/* User Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: '#f9f9f9' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666', textTransform: 'uppercase' }}>Total Staked</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>
            {formatTokenAmount(userStats.totalStaked)} S
          </p>
        </div>
        
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: '#f9f9f9' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666', textTransform: 'uppercase' }}>Accuracy Score</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>
            {userStats.accuracyScore}
          </p>
        </div>
        
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: '#f9f9f9' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666', textTransform: 'uppercase' }}>Total Rewards</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>
            {formatTokenAmount(userStats.totalRewards)} S
          </p>
        </div>
        
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: '#f9f9f9' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666', textTransform: 'uppercase' }}>Voting Power</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#7c3aed' }}>
            {formatTokenAmount(userStats.votingPower)}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
        {/* Content List */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Latest AI Research Reports</h2>
          
          {loading && <p>Loading...</p>}
          
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
                onClick={() => {
                  setSelectedContent(content);
                  fetchResearchReport(content.contentHash);
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
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

                {/* Voting Progress */}
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
                      backgroundColor: getVotingProgress(content) > 50 ? '#10b981' : '#ef4444'
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

        {/* Research Details */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Research Details</h2>
          
          {selectedContent && researchReport ? (
            <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: '#fff' }}>
              {/* Executive Summary */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>Executive Summary</h4>
                <p style={{ fontSize: '14px', lineHeight: 1.5, color: '#333' }}>
                  {researchReport.executive_summary}
                </p>
              </div>

              {/* Confidence Score */}
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
                      width: `${researchReport.confidence * 100}%`,
                      height: '100%',
                      backgroundColor: researchReport.confidence >= 0.8 ? '#10b981' : 
                                     researchReport.confidence >= 0.6 ? '#f59e0b' : '#ef4444'
                    }} />
                  </div>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: researchReport.confidence >= 0.8 ? '#10b981' : 
                           researchReport.confidence >= 0.6 ? '#f59e0b' : '#ef4444'
                  }}>
                    {(researchReport.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Price Predictions */}
              {researchReport.price_predictions && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>Price Predictions</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {Object.entries(researchReport.price_predictions).map(([token, prediction]: [string, any]) => (
                      <div key={token} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{token}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ fontSize: '20px' }}>
                            {prediction.trend === 'up' ? '📈' : '📉'}
                          </span>
                          <span style={{
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: prediction.change_7d > 0 ? '#10b981' : '#ef4444'
                          }}>
                            {prediction.change_7d > 0 ? '+' : ''}{prediction.change_7d}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Findings */}
              {researchReport.key_findings && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>Key Findings</h4>
                  {Object.entries(researchReport.key_findings).map(([token, findings]: [string, any]) => (
                    <div key={token} style={{ marginBottom: '10px' }}>
                      <h5 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>{token}</h5>
                      <p style={{ fontSize: '13px', color: '#666', lineHeight: 1.4 }}>
                        {typeof findings === 'string' ? findings : JSON.stringify(findings)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Risk Assessment */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>Risk Assessment</h4>
                <p style={{ fontSize: '14px', lineHeight: 1.5, color: '#333' }}>
                  {researchReport.risk_assessment}
                </p>
              </div>

              {/* Trading Recommendations */}
              {researchReport.trading_recommendations && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>Trading Recommendations</h4>
                  <ul style={{ fontSize: '14px', lineHeight: 1.5, color: '#333', paddingLeft: '20px' }}>
                    {researchReport.trading_recommendations.map((rec, index) => (
                      <li key={index} style={{ marginBottom: '5px' }}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Detailed Analysis Preview */}
              {researchReport.detailed_analysis && (
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>Analysis Summary</h4>
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    <p>• News Articles Analyzed: {researchReport.detailed_analysis.news_sentiment?.article_count || 0}</p>
                    <p>• Social Media Posts: {researchReport.detailed_analysis.social_sentiment?.total_volume || 0}</p>
                    <p>• Market Signals: {researchReport.detailed_analysis.market_signals?.length || 0}</p>
                    <p>• Technical Indicators: {Object.keys(researchReport.detailed_analysis.technical_analysis || {}).length}</p>
                  </div>
                </div>
              )}
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
