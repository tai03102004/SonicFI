import React, { useState, useEffect } from 'react';

interface UserReputation {
  totalScore: number;
  votingAccuracy: number;
  stakingHistory: number;
  communityContribution: number;
  aiValidationScore: number;
  isInfluencer: boolean;
  followerCount: number;
  expertiseAreas: Record<string, number>;
  recentActivities: ReputationActivity[];
  achievements: Achievement[];
  rankingPosition: number;
  nextLevelRequirement: number;
}

interface ReputationActivity {
  actionType: string;
  scoreChange: number;
  timestamp: string;
  evidenceHash: string;
  aiValidated: boolean;
  confidenceScore: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress?: number;
  maxProgress?: number;
}

interface LeaderboardEntry {
  address: string;
  ensName?: string;
  totalScore: number;
  rank: number;
  change: number;
  avatar?: string;
  badges: string[];
}

const ReputationDashboard: React.FC = () => {
  const [userReputation, setUserReputation] = useState<UserReputation | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [connectedAccount, setConnectedAccount] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const expertiseAreas = [
    'DeFi Analysis', 'Technical Analysis', 'Sentiment Analysis', 
    'Risk Assessment', 'Market Making', 'Governance', 'On-Chain Analysis'
  ];

  const reputationLevels = [
    { name: 'Novice', min: 0, max: 999, color: '#9CA3AF', icon: '🌱' },
    { name: 'Apprentice', min: 1000, max: 2499, color: '#10B981', icon: '📚' },
    { name: 'Analyst', min: 2500, max: 4999, color: '#3B82F6', icon: '📊' },
    { name: 'Expert', min: 5000, max: 7499, color: '#8B5CF6', icon: '🎯' },
    { name: 'Master', min: 7500, max: 9499, color: '#F59E0B', icon: '👑' },
    { name: 'Legend', min: 9500, max: 10000, color: '#EF4444', icon: '⭐' }
  ];

  useEffect(() => {
    connectWallet();
  }, []);

  useEffect(() => {
    if (connectedAccount) {
      fetchUserReputation();
      fetchLeaderboard();
    }
  }, [connectedAccount, selectedTimeframe]);

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

  const fetchUserReputation = async () => {
    if (!connectedAccount) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/reputation/${connectedAccount}?timeframe=${selectedTimeframe}`);
      const data = await response.json();
      setUserReputation(data);
    } catch (error) {
      console.error('Error fetching reputation:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`/api/reputation/leaderboard?timeframe=${selectedTimeframe}&limit=50`);
      const data = await response.json();
      setLeaderboard(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const getCurrentLevel = (score: number) => {
    return reputationLevels.find(level => score >= level.min && score <= level.max) || reputationLevels[0];
  };

  const getNextLevel = (score: number) => {
    const currentLevel = getCurrentLevel(score);
    const currentIndex = reputationLevels.findIndex(level => level.name === currentLevel.name);
    return currentIndex < reputationLevels.length - 1 ? reputationLevels[currentIndex + 1] : null;
  };

  const getLevelProgress = (score: number) => {
    const currentLevel = getCurrentLevel(score);
    const progress = (score - currentLevel.min) / (currentLevel.max - currentLevel.min);
    return Math.max(0, Math.min(1, progress)) * 100;
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#9CA3AF';
      case 'rare': return '#3B82F6';
      case 'epic': return '#8B5CF6';
      case 'legendary': return '#F59E0B';
      default: return '#9CA3AF';
    }
  };

  const formatScoreChange = (change: number) => {
    const prefix = change > 0 ? '+' : '';
    return `${prefix}${change}`;
  };

  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case 'accurate_vote': return '✅';
      case 'inaccurate_vote': return '❌';
      case 'content_creation': return '📝';
      case 'early_adoption': return '🚀';
      case 'liquidity_provision': return '💧';
      case 'community_moderation': return '🛡️';
      case 'expert_analysis': return '🔍';
      case 'ai_model_contribution': return '🤖';
      default: return '📊';
    }
  };

  if (!connectedAccount) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Connect Your Wallet</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>Connect your wallet to view your reputation dashboard</p>
          <button
            onClick={connectWallet}
            style={{
              padding: '12px 24px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (loading || !userReputation) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div>Loading reputation data...</div>
      </div>
    );
  }

  const currentLevel = getCurrentLevel(userReputation.totalScore);
  const nextLevel = getNextLevel(userReputation.totalScore);
  const levelProgress = getLevelProgress(userReputation.totalScore);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 10px 0' }}>
          Reputation Dashboard
        </h1>
        <p style={{ color: '#666', margin: 0 }}>
          Track your community contributions and expertise recognition
        </p>
      </div>

      {/* Level and Progress Card */}
      <div style={{ 
        background: `linear-gradient(135deg, ${currentLevel.color}20, ${currentLevel.color}10)`,
        border: `2px solid ${currentLevel.color}`,
        borderRadius: '16px',
        padding: '30px',
        marginBottom: '30px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ fontSize: '48px' }}>{currentLevel.icon}</div>
            <div>
              <h2 style={{ margin: 0, fontSize: '28px', color: currentLevel.color }}>
                {currentLevel.name}
              </h2>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                {userReputation.totalScore.toLocaleString()} Reputation Points
              </p>
            </div>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: currentLevel.color }}>
              #{userReputation.rankingPosition}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Global Rank</div>
          </div>
        </div>

        {nextLevel && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                Progress to {nextLevel.name}
              </span>
              <span style={{ fontSize: '14px' }}>
                {userReputation.totalScore} / {nextLevel.min}
              </span>
            </div>
            <div style={{ 
              width: '100%', 
              height: '12px', 
              backgroundColor: 'rgba(255,255,255,0.3)', 
              borderRadius: '6px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${levelProgress}%`,
                height: '100%',
                backgroundColor: currentLevel.color,
                borderRadius: '6px',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}

        {userReputation.isInfluencer && (
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            padding: '8px 16px',
            backgroundColor: '#F59E0B',
            color: 'white',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            🌟 Influencer
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10B981' }}>
            {userReputation.votingAccuracy.toLocaleString()}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>Voting Accuracy</div>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3B82F6' }}>
            {userReputation.communityContribution.toLocaleString()}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>Community Points</div>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8B5CF6' }}>
            {userReputation.aiValidationScore.toLocaleString()}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>AI Validation Score</div>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#F59E0B' }}>
            {userReputation.followerCount.toLocaleString()}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>Followers</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', gap: '5px', borderBottom: '1px solid #ddd' }}>
          {['overview', 'expertise', 'activities', 'achievements'].map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              style={{
                padding: '12px 24px',
                border: 'none',
                backgroundColor: selectedTab === tab ? '#2563eb' : 'transparent',
                color: selectedTab === tab ? 'white' : '#666',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                textTransform: 'capitalize'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '30px' }}>
          {/* Recent Activities */}
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
              Recent Activities
            </h3>
            <div style={{ space: '10px' }}>
              {userReputation.recentActivities.slice(0, 10).map((activity, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '15px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  marginBottom: '10px'
                }}>
                  <div style={{ fontSize: '24px', marginRight: '15px' }}>
                    {getActivityIcon(activity.actionType)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {activity.actionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {new Date(activity.timestamp).toLocaleDateString()}
                      {activity.aiValidated && (
                        <span style={{ marginLeft: '10px', color: '#10B981' }}>
                          ✓ AI Validated ({activity.confidenceScore}%)
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: activity.scoreChange > 0 ? '#10B981' : '#EF4444'
                  }}>
                    {formatScoreChange(activity.scoreChange)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
              Leaderboard
            </h3>
            <div>
              {leaderboard.slice(0, 10).map((entry, index) => (
                <div key={entry.address} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  backgroundColor: entry.address.toLowerCase() === connectedAccount.toLowerCase() ? '#eff6ff' : '#fff'
                }}>
                  <div style={{ 
                    width: '30px', 
                    textAlign: 'center', 
                    fontWeight: 'bold',
                    color: index < 3 ? '#F59E0B' : '#666'
                  }}>
                    {entry.rank}
                  </div>
                  <div style={{ flex: 1, marginLeft: '10px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                      {entry.ensName || `${entry.address.slice(0, 6)}...${entry.address.slice(-4)}`}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {entry.totalScore.toLocaleString()} points
                    </div>
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: entry.change > 0 ? '#10B981' : entry.change < 0 ? '#EF4444' : '#666'
                  }}>
                    {entry.change > 0 ? '↗' : entry.change < 0 ? '↘' : '→'} {Math.abs(entry.change)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'expertise' && (
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
            Expertise Areas
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {expertiseAreas.map(area => {
              const score = userReputation.expertiseAreas[area] || 0;
              const isExpert = score >= 70;
              
              return (
                <div key={area} style={{
                  border: `2px solid ${isExpert ? '#10B981' : '#ddd'}`,
                  borderRadius: '12px',
                  padding: '20px',
                  backgroundColor: isExpert ? '#f0fdf4' : '#fff'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
                      {area}
                    </h4>
                    {isExpert && (
                      <span style={{ 
                        padding: '4px 8px',
                        backgroundColor: '#10B981',
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        Expert
                      </span>
                    )}
                  </div>
                  
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '14px' }}>Expertise Level</span>
                      <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{score}/100</span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${score}%`,
                        height: '100%',
                        backgroundColor: isExpert ? '#10B981' : '#3B82F6',
                        borderRadius: '4px'
                      }} />
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {score < 30 && 'Beginner level - Keep learning!'}
                    {score >= 30 && score < 70 && 'Intermediate level - You\'re making progress!'}
                    {score >= 70 && 'Expert level - Outstanding expertise!'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedTab === 'activities' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
              Activity History
            </h3>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
          
          <div>
            {userReputation.recentActivities.map((activity, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                marginBottom: '10px'
              }}>
                <div style={{ fontSize: '24px', marginRight: '15px' }}>
                  {getActivityIcon(activity.actionType)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {activity.actionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    {new Date(activity.timestamp).toLocaleString()}
                  </div>
                  {activity.evidenceHash && (
                    <div style={{ fontSize: '10px', color: '#888' }}>
                      Evidence: {activity.evidenceHash.slice(0, 10)}...
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: activity.scoreChange > 0 ? '#10B981' : '#EF4444'
                  }}>
                    {formatScoreChange(activity.scoreChange)}
                  </div>
                  {activity.aiValidated && (
                    <div style={{ fontSize: '10px', color: '#10B981' }}>
                      AI Validated ({activity.confidenceScore}%)
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedTab === 'achievements' && (
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
            Achievements & Badges
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            {userReputation.achievements.map(achievement => (
              <div key={achievement.id} style={{
                border: `2px solid ${getRarityColor(achievement.rarity)}`,
                borderRadius: '12px',
                padding: '20px',
                backgroundColor: '#fff',
                textAlign: 'center',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  padding: '4px 8px',
                  backgroundColor: getRarityColor(achievement.rarity),
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  textTransform: 'capitalize'
                }}>
                  {achievement.rarity}
                </div>
                
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>
                  {achievement.icon}
                </div>
                
                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>
                  {achievement.name}
                </h4>
                
                <p style={{ margin: '0 0 15px 0', fontSize: '12px', color: '#666', lineHeight: 1.4 }}>
                  {achievement.description}
                </p>
                
                {achievement.progress !== undefined && achievement.maxProgress && (
                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '12px' }}>Progress</span>
                      <span style={{ fontSize: '12px' }}>
                        {achievement.progress}/{achievement.maxProgress}
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '6px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${(achievement.progress / achievement.maxProgress) * 100}%`,
                        height: '100%',
                        backgroundColor: getRarityColor(achievement.rarity),
                        borderRadius: '3px'
                      }} />
                    </div>
                  </div>
                )}
                
                <div style={{ fontSize: '10px', color: '#888' }}>
                  Earned: {new Date(achievement.earnedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReputationDashboard;
