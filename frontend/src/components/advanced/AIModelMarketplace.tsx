import React, { useState, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';

interface AIModel {
  id: number;
  name: string;
  version: string;
  description: string;
  creator: string;
  modelHash: string;
  isActive: boolean;
  isPublic: boolean;
  usageCount: number;
  successRate: number;
  totalStaked: number;
  categories: string[];
  rewardPool: number;
  createdAt: number;
  lastUpdated: number;
  performanceMetrics: {
    totalPredictions: number;
    correctPredictions: number;
    averageConfidence: number;
    recentPerformance: number[];
  };
}

interface PredictionRecord {
  predictor: string;
  predictionHash: string;
  timestamp: number;
  validated: boolean;
  accurate: boolean;
  confidenceScore: number;
  rewardAmount: number;
}

interface StakeInfo {
  amount: number;
  timestamp: number;
  active: boolean;
  rewards: number;
}

const AIModelMarketplace: React.FC = () => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
  const [userStakes, setUserStakes] = useState<Record<number, StakeInfo>>({});
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('performance');
  const [showMyModels, setShowMyModels] = useState(false);
  const [connectedAccount, setConnectedAccount] = useState<string>('');
  const [newModelForm, setNewModelForm] = useState({
    name: '',
    description: '',
    modelFile: null as File | null,
    categories: [] as string[],
    isPublic: true,
    stakingRequirement: '1000'
  });
  const [predictionForm, setPredictionForm] = useState({
    prediction: '',
    confidence: 80,
    reasoning: ''
  });

  const categories = ['DeFi', 'Price Prediction', 'Sentiment Analysis', 'Risk Assessment', 'Market Making', 'Governance'];

  useEffect(() => {
    connectWallet();
    fetchModels();
  }, []);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setConnectedAccount(accounts[0]);
        fetchUserStakes(accounts[0]);
      } catch (error) {
        console.error('Error connecting wallet:', error);
      }
    }
  };

  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai-models');
      const data = await response.json();
      setModels(data);
    } catch (error) {
      console.error('Error fetching models:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStakes = async (userAddress: string) => {
    try {
      const response = await fetch(`/api/ai-models/stakes/${userAddress}`);
      const data = await response.json();
      setUserStakes(data);
    } catch (error) {
      console.error('Error fetching user stakes:', error);
    }
  };

  const fetchModelPredictions = async (modelId: number) => {
    try {
      const response = await fetch(`/api/ai-models/${modelId}/predictions`);
      const data = await response.json();
      setPredictions(data);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    }
  };

  const handleCreateModel = async () => {
    if (!newModelForm.name || !newModelForm.modelFile) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      // Upload model file to IPFS
      const formData = new FormData();
      formData.append('file', newModelForm.modelFile);
      
      const uploadResponse = await fetch('/api/ipfs/upload', {
        method: 'POST',
        body: formData
      });
      const { hash: modelHash } = await uploadResponse.json();

      // Register model on blockchain
      const response = await fetch('/api/ai-models/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newModelForm.name,
          description: newModelForm.description,
          modelHash,
          categories: newModelForm.categories,
          isPublic: newModelForm.isPublic,
          stakingRequirement: ethers.utils.parseEther(newModelForm.stakingRequirement).toString(),
          userAddress: connectedAccount
        }),
      });

      if (response.ok) {
        alert('Model registered successfully!');
        setNewModelForm({
          name: '',
          description: '',
          modelFile: null,
          categories: [],
          isPublic: true,
          stakingRequirement: '1000'
        });
        fetchModels();
      }
    } catch (error) {
      console.error('Error creating model:', error);
      alert('Error creating model');
    } finally {
      setLoading(false);
    }
  };

  const handleStakeOnModel = async (modelId: number, amount: string) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/ai-models/stake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelId,
          amount: ethers.utils.parseEther(amount).toString(),
          userAddress: connectedAccount
        }),
      });

      if (response.ok) {
        alert('Staked successfully!');
        fetchModels();
        fetchUserStakes(connectedAccount);
      }
    } catch (error) {
      console.error('Error staking:', error);
      alert('Error staking on model');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPrediction = async (modelId: number) => {
    if (!predictionForm.prediction) {
      alert('Please enter your prediction');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/ai-models/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelId,
          prediction: predictionForm.prediction,
          confidence: predictionForm.confidence,
          reasoning: predictionForm.reasoning,
          userAddress: connectedAccount
        }),
      });

      if (response.ok) {
        alert('Prediction submitted successfully!');
        setPredictionForm({
          prediction: '',
          confidence: 80,
          reasoning: ''
        });
        fetchModelPredictions(modelId);
      }
    } catch (error) {
      console.error('Error submitting prediction:', error);
      alert('Error submitting prediction');
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedModels = useMemo(() => {
    let filtered = models;

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(model => model.categories.includes(filterCategory));
    }

    // Filter by ownership
    if (showMyModels) {
      filtered = filtered.filter(model => model.creator.toLowerCase() === connectedAccount.toLowerCase());
    }

    // Sort models
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'performance':
          return b.successRate - a.successRate;
        case 'usage':
          return b.usageCount - a.usageCount;
        case 'stake':
          return b.totalStaked - a.totalStaked;
        case 'recent':
          return b.lastUpdated - a.lastUpdated;
        default:
          return 0;
      }
    });

    return filtered;
  }, [models, filterCategory, sortBy, showMyModels, connectedAccount]);

  const formatTokenAmount = (amount: number) => {
    return (amount / 1e18).toFixed(2);
  };

  const getPerformanceColor = (rate: number) => {
    if (rate >= 80) return '#10b981';
    if (rate >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getStatusBadge = (model: AIModel) => {
    if (!model.isActive) return { text: 'Inactive', color: '#6b7280' };
    if (model.successRate >= 80) return { text: 'Excellent', color: '#10b981' };
    if (model.successRate >= 60) return { text: 'Good', color: '#f59e0b' };
    return { text: 'Poor', color: '#ef4444' };
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px', borderBottom: '2px solid #e5e5e5', paddingBottom: '20px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 'bold', margin: '0 0 10px 0', color: '#1a1a1a' }}>
          AI Model Marketplace
        </h1>
        <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
          Discover, stake, and profit from community-driven AI models
        </p>
        {connectedAccount && (
          <p style={{ fontSize: '14px', color: '#888', marginTop: '10px' }}>
            Connected: {connectedAccount.slice(0, 6)}...{connectedAccount.slice(-4)}
          </p>
        )}
      </div>

      {/* Filters and Controls */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          >
            <option value="performance">Sort by Performance</option>
            <option value="usage">Sort by Usage</option>
            <option value="stake">Sort by Total Stake</option>
            <option value="recent">Sort by Recent</option>
          </select>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            <input
              type="checkbox"
              checked={showMyModels}
              onChange={(e) => setShowMyModels(e.target.checked)}
            />
            My Models Only
          </label>
        </div>

        <button
          onClick={() => setSelectedModel({ id: -1 } as AIModel)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          + Create New Model
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedModel ? '1fr 400px' : '1fr', gap: '30px' }}>
        {/* Models List */}
        <div>
          {loading && <p>Loading...</p>}
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {filteredAndSortedModels.map((model) => {
              const status = getStatusBadge(model);
              const userStake = userStakes[model.id];
              
              return (
                <div
                  key={model.id}
                  style={{
                    border: selectedModel?.id === model.id ? '2px solid #2563eb' : '1px solid #ddd',
                    borderRadius: '12px',
                    padding: '20px',
                    cursor: 'pointer',
                    backgroundColor: selectedModel?.id === model.id ? '#eff6ff' : '#fff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  onClick={() => {
                    setSelectedModel(model);
                    fetchModelPredictions(model.id);
                  }}
                >
                  {/* Model Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 'bold' }}>
                        {model.name}
                      </h3>
                      <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#666' }}>
                        v{model.version} • by {model.creator.slice(0, 6)}...{model.creator.slice(-4)}
                      </p>
                    </div>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      backgroundColor: status.color + '20',
                      color: status.color
                    }}>
                      {status.text}
                    </span>
                  </div>

                  {/* Categories */}
                  <div style={{ marginBottom: '15px' }}>
                    {model.categories.map(cat => (
                      <span key={cat} style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        marginRight: '6px',
                        marginBottom: '4px',
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        borderRadius: '12px',
                        fontSize: '11px'
                      }}>
                        {cat}
                      </span>
                    ))}
                  </div>

                  {/* Description */}
                  <p style={{ 
                    fontSize: '14px', 
                    color: '#374151', 
                    lineHeight: 1.4, 
                    marginBottom: '15px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {model.description}
                  </p>

                  {/* Performance Metrics */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr 1fr', 
                    gap: '10px', 
                    marginBottom: '15px',
                    padding: '12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: getPerformanceColor(model.successRate) }}>
                        {model.successRate.toFixed(1)}%
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>Success Rate</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#374151' }}>
                        {model.usageCount}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>Uses</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#7c3aed' }}>
                        {formatTokenAmount(model.totalStaked)}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>Staked (S)</div>
                    </div>
                  </div>

                  {/* User Stake Info */}
                  {userStake && userStake.active && (
                    <div style={{ 
                      padding: '8px 12px',
                      backgroundColor: '#dbeafe',
                      borderRadius: '6px',
                      marginBottom: '10px'
                    }}>
                      <div style={{ fontSize: '12px', color: '#1e40af' }}>
                        Your Stake: {formatTokenAmount(userStake.amount)} S
                        {userStake.rewards > 0 && (
                          <span style={{ marginLeft: '10px' }}>
                            Rewards: {formatTokenAmount(userStake.rewards)} S
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const amount = prompt('Enter amount to stake (S tokens):');
                        if (amount) handleStakeOnModel(model.id, amount);
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: '1px solid #2563eb',
                        borderRadius: '4px',
                        backgroundColor: '#fff',
                        color: '#2563eb',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    >
                      💰 Stake
                    </button>
                    
                    {model.isPublic && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedModel(model);
                          fetchModelPredictions(model.id);
                        }}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          border: '1px solid #059669',
                          borderRadius: '4px',
                          backgroundColor: '#fff',
                          color: '#059669',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      >
                        🎯 Predict
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Model Details Sidebar */}
        {selectedModel && (
          <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: '12px', 
            padding: '20px', 
            backgroundColor: '#fff',
            height: 'fit-content',
            position: 'sticky',
            top: '20px'
          }}>
            {selectedModel.id === -1 ? (
              /* Create New Model Form */
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
                  Create New AI Model
                </h3>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                    Model Name *
                  </label>
                  <input
                    type="text"
                    value={newModelForm.name}
                    onChange={(e) => setNewModelForm({...newModelForm, name: e.target.value})}
                    placeholder="Enter model name"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                    Description
                  </label>
                  <textarea
                    value={newModelForm.description}
                    onChange={(e) => setNewModelForm({...newModelForm, description: e.target.value})}
                    placeholder="Describe your model"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                    Model File *
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setNewModelForm({...newModelForm, modelFile: e.target.files?.[0] || null})}
                    accept=".pkl,.joblib,.h5,.onnx,.zip"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                    Categories
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {categories.map(cat => (
                      <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                        <input
                          type="checkbox"
                          checked={newModelForm.categories.includes(cat)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewModelForm({...newModelForm, categories: [...newModelForm.categories, cat]});
                            } else {
                              setNewModelForm({...newModelForm, categories: newModelForm.categories.filter(c => c !== cat)});
                            }
                          }}
                        />
                        {cat}
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                    Initial Stake (S tokens)
                  </label>
                  <input
                    type="number"
                    value={newModelForm.stakingRequirement}
                    onChange={(e) => setNewModelForm({...newModelForm, stakingRequirement: e.target.value})}
                    min="1000"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                    <input
                      type="checkbox"
                      checked={newModelForm.isPublic}
                      onChange={(e) => setNewModelForm({...newModelForm, isPublic: e.target.checked})}
                    />
                    Make model public
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setSelectedModel(null)}
                    style={{
                      flex: 1,
                      padding: '10px 20px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      backgroundColor: '#fff',
                      color: '#374151',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateModel}
                    disabled={loading}
                    style={{
                      flex: 1,
                      padding: '10px 20px',
                      border: 'none',
                      borderRadius: '6px',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    {loading ? 'Creating...' : 'Create Model'}
                  </button>
                </div>
              </div>
            ) : (
              /* Model Details */
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 5px 0' }}>
                      {selectedModel.name}
                    </h3>
                    <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                      v{selectedModel.version} • Created by {selectedModel.creator.slice(0, 6)}...{selectedModel.creator.slice(-4)}
                    </p>
                  </div>
                  <div style={{
                    padding: '8px 16px',
                    backgroundColor: getStatusBadge(selectedModel).color + '20',
                    color: getStatusBadge(selectedModel).color,
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {getStatusBadge(selectedModel).text}
                  </div>
                </div>

                {/* Model Statistics */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '15px', 
                  marginBottom: '20px',
                  padding: '15px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px'
                }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Success Rate</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: getPerformanceColor(selectedModel.successRate) }}>
                      {selectedModel.successRate.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Total Predictions</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                      {selectedModel.performanceMetrics.totalPredictions}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Total Staked</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#7c3aed' }}>
                      {formatTokenAmount(selectedModel.totalStaked)} S
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Usage Count</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                      {selectedModel.usageCount}
                    </div>
                  </div>
                </div>

                {/* Model Description */}
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>Description</h4>
                  <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.5, margin: 0 }}>
                    {selectedModel.description}
                  </p>
                </div>

                {/* Categories */}
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>Categories</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedModel.categories.map(cat => (
                      <span key={cat} style={{
                        padding: '4px 12px',
                        backgroundColor: '#e5e7eb',
                        color: '#374151',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Performance Chart */}
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>Recent Performance</h4>
                  <div style={{ 
                    height: '100px', 
                    backgroundColor: '#f3f4f6', 
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#666'
                  }}>
                    Performance Chart Placeholder
                  </div>
                </div>

                {/* Make Prediction Section */}
                {selectedModel.isPublic && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>Make Prediction</h4>
                    
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                        Your Prediction
                      </label>
                      <textarea
                        value={predictionForm.prediction}
                        onChange={(e) => setPredictionForm({...predictionForm, prediction: e.target.value})}
                        placeholder="Enter your prediction or analysis..."
                        rows={3}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px',
                          boxSizing: 'border-box',
                          resize: 'vertical'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                        Confidence Level: {predictionForm.confidence}%
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={predictionForm.confidence}
                        onChange={(e) => setPredictionForm({...predictionForm, confidence: parseInt(e.target.value)})}
                        style={{
                          width: '100%',
                          height: '6px',
                          borderRadius: '3px',
                          background: '#ddd'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                        Reasoning (Optional)
                      </label>
                      <textarea
                        value={predictionForm.reasoning}
                        onChange={(e) => setPredictionForm({...predictionForm, reasoning: e.target.value})}
                        placeholder="Explain your reasoning..."
                        rows={2}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px',
                          boxSizing: 'border-box',
                          resize: 'vertical'
                        }}
                      />
                    </div>

                    <button
                      onClick={() => handleSubmitPrediction(selectedModel.id)}
                      disabled={loading || !predictionForm.prediction}
                      style={{
                        width: '100%',
                        padding: '12px 20px',
                        backgroundColor: '#059669',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: loading || !predictionForm.prediction ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {loading ? 'Submitting...' : '🎯 Submit Prediction'}
                    </button>
                  </div>
                )}

                {/* Staking Section */}
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>Stake on Model</h4>
                  
                  {userStakes[selectedModel.id] && userStakes[selectedModel.id].active ? (
                    <div style={{
                      padding: '15px',
                      backgroundColor: '#dbeafe',
                      borderRadius: '8px',
                      marginBottom: '15px'
                    }}>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e40af', marginBottom: '8px' }}>
                        Your Current Stake
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontSize: '12px', color: '#1e40af' }}>Amount:</span>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af' }}>
                          {formatTokenAmount(userStakes[selectedModel.id].amount)} S
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontSize: '12px', color: '#1e40af' }}>Staked Since:</span>
                        <span style={{ fontSize: '12px', color: '#1e40af' }}>
                          {new Date(userStakes[selectedModel.id].timestamp * 1000).toLocaleDateString()}
                        </span>
                      </div>
                      {userStakes[selectedModel.id].rewards > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '12px', color: '#1e40af' }}>Rewards Earned:</span>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#10b981' }}>
                            +{formatTokenAmount(userStakes[selectedModel.id].rewards)} S
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{
                      padding: '15px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '8px',
                      textAlign: 'center',
                      marginBottom: '15px'
                    }}>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        You haven't staked on this model yet
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      const amount = prompt('Enter amount to stake (S tokens):');
                      if (amount) handleStakeOnModel(selectedModel.id, amount);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 20px',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    💰 {userStakes[selectedModel.id]?.active ? 'Add More Stake' : 'Start Staking'}
                  </button>
                </div>

                {/* Recent Predictions */}
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>Recent Predictions</h4>
                  {predictions.length > 0 ? (
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {predictions.slice(0, 5).map((prediction, index) => (
                        <div key={index} style={{
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          padding: '12px',
                          marginBottom: '10px',
                          backgroundColor: '#fff'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              {prediction.predictor.slice(0, 6)}...{prediction.predictor.slice(-4)}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              {new Date(prediction.timestamp * 1000).toLocaleDateString()}
                            </div>
                          </div>
                          <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                            {prediction.predictionHash.slice(0, 50)}...
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '12px' }}>
                              Confidence: {prediction.confidenceScore}%
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {prediction.validated ? (
                                <span style={{
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                  backgroundColor: prediction.accurate ? '#dcfce7' : '#fee2e2',
                                  color: prediction.accurate ? '#166534' : '#dc2626'
                                }}>
                                  {prediction.accurate ? '✓ Accurate' : '✗ Inaccurate'}
                                </span>
                              ) : (
                                <span style={{
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                  backgroundColor: '#fef3c7',
                                  color: '#d97706'
                                }}>
                                  ⏳ Pending
                                </span>
                              )}
                              {prediction.rewardAmount > 0 && (
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#10b981' }}>
                                  +{formatTokenAmount(prediction.rewardAmount)} S
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      padding: '20px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '8px',
                      textAlign: 'center',
                      color: '#666'
                    }}>
                      No predictions yet. Be the first to make a prediction!
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIModelMarketplace;
