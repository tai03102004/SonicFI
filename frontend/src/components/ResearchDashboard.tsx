import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Clock, Users, Trophy, DollarSign } from 'lucide-react';

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
}

const ResearchDashboard: React.FC = () => {
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

  useEffect(() => {
    fetchContents();
    fetchUserStats();
  }, []);

  const fetchContents = async () => {
    try {
      setLoading(true);
      // Fetch from your backend API
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
      // Fetch user statistics from blockchain
      const response = await fetch('/api/user-stats');
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
      
      // Connect to wallet and interact with smart contract
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        // Contract interaction would go here
        const response = await fetch('/api/vote', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contentId,
            amount: stakeAmount,
            positive,
            userAddress: await signer.getAddress()
          }),
        });
        
        if (response.ok) {
          alert('Vote submitted successfully!');
          fetchContents();
          fetchUserStats();
          setStakeAmount('');
        }
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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getVotingProgress = (content: AIContent) => {
    const total = content.positiveVotes + content.negativeVotes;
    return total > 0 ? (content.positiveVotes / total) * 100 : 50;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI SocialFi Research Dashboard
          </h1>
          <p className="text-gray-600">
            Decentralized knowledge curation powered by community and AI
          </p>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Staked</p>
                  <p className="text-2xl font-bold">{formatTokenAmount(userStats.totalStaked)} S</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Accuracy Score</p>
                  <p className="text-2xl font-bold">{userStats.accuracyScore}</p>
                </div>
                <Trophy className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Rewards</p>
                  <p className="text-2xl font-bold">{formatTokenAmount(userStats.totalRewards)} S</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Voting Power</p>
                  <p className="text-2xl font-bold">{formatTokenAmount(userStats.votingPower)}</p>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Content List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Latest AI Research
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contents.map((content) => (
                    <div
                      key={content.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedContent?.id === content.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        setSelectedContent(content);
                        fetchResearchReport(content.contentHash);
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Research Report #{content.id}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {new Date(content.timestamp * 1000).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {content.finalized ? (
                            <Badge variant="secondary">Finalized</Badge>
                          ) : (
                            <Badge variant="outline">Active</Badge>
                          )}
                        </div>
                      </div>

                      {/* Voting Progress */}
                      <div className="mb-3">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Community Sentiment</span>
                          <span>{formatTokenAmount(content.totalStaked)} S staked</span>
                        </div>
                        <Progress value={getVotingProgress(content)} className="h-2" />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>👍 {formatTokenAmount(content.positiveVotes)} S</span>
                          <span>👎 {formatTokenAmount(content.negativeVotes)} S</span>
                        </div>
                      </div>

                      {!content.finalized && (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Stake amount"
                            value={stakeAmount}
                            onChange={(e) => setStakeAmount(e.target.value)}
                            className="flex-1 px-3 py-1 border rounded text-sm"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVote(content.id, true);
                            }}
                            className="text-green-600 border-green-600"
                          >
                            👍 Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVote(content.id, false);
                            }}
                            className="text-red-600 border-red-600"
                          >
                            👎 Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Research Details */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Research Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedContent && researchReport ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Executive Summary</h4>
                      <p className="text-sm text-gray-700">{researchReport.executive_summary}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Confidence Score</h4>
                      <div className="flex items-center gap-2">
                        <Progress value={researchReport.confidence * 100} className="flex-1" />
                        <span className={`text-sm font-medium ${getConfidenceColor(researchReport.confidence)}`}>
                          {(researchReport.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {researchReport.price_predictions && (
                      <div>
                        <h4 className="font-semibold mb-2">Price Predictions</h4>
                        <div className="space-y-2">
                          {Object.entries(researchReport.price_predictions).map(([token, prediction]: [string, any]) => (
                            <div key={token} className="flex justify-between items-center">
                              <span className="text-sm">{token}</span>
                              <div className="flex items-center gap-1">
                                {prediction.trend === 'up' ? (
                                  <TrendingUp className="w-4 h-4 text-green-600" />
                                ) : (
                                  <TrendingDown className="w-4 h-4 text-red-600" />
                                )}
                                <span className="text-sm font-medium">
                                  {prediction.change_7d > 0 ? '+' : ''}{prediction.change_7d}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold mb-2">Risk Assessment</h4>
                      <p className="text-sm text-gray-700">{researchReport.risk_assessment}</p>
                    </div>

                    {researchReport.trading_recommendations && (
                      <div>
                        <h4 className="font-semibold mb-2">Recommendations</h4>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {researchReport.trading_recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-blue-600 mt-1">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Select a research report to view details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearchDashboard;
