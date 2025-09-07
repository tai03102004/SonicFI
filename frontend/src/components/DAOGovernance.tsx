import React, { useState } from 'react';
import { useWallet } from '../hooks/useWallet';

const DAOGovernance: React.FC = () => {
  const { isConnected,  } = useWallet();
  const [activeTab, setActiveTab] = useState<'proposals' | 'create'>('proposals');
  const [voting, setVoting] = useState<number | null>(null);
  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    duration: 72
  });

  // Mock proposals data
  const [proposals] = useState([
    {
      id: 1,
      title: 'Increase AI Model Reward Pool',
      description: 'Proposal to increase the reward pool for AI model creators from 10% to 15% of platform fees.',
      proposer: '0x123...456',
      votesFor: 15420,
      votesAgainst: 3280,
      endTime: Date.now() + 86400000 * 2, // 2 days from now
      status: 'Active',
      executed: false
    },
    {
      id: 2,
      title: 'Implement Cross-Chain Bridge',
      description: 'Add support for Ethereum and Polygon networks to expand platform accessibility.',
      proposer: '0x789...012',
      votesFor: 8930,
      votesAgainst: 12560,
      endTime: Date.now() + 86400000 * 5, // 5 days from now
      status: 'Active',
      executed: false
    },
    {
      id: 3,
      title: 'Platform Fee Reduction',
      description: 'Reduce trading fees from 0.3% to 0.25% to increase user adoption.',
      proposer: '0xABC...DEF',
      votesFor: 22150,
      votesAgainst: 5890,
      endTime: Date.now() - 86400000, // Ended 1 day ago
      status: 'Passed',
      executed: true
    }
  ]);

  const handleVote = async (proposalId: number, support: boolean) => {
    if (!isConnected) {
      alert('Please connect your wallet first!');
      return;
    }

    setVoting(proposalId);
    
    setTimeout(() => {
      alert(`🗳️ Vote ${support ? 'FOR' : 'AGAINST'} proposal #${proposalId} submitted successfully!`);
      setVoting(null);
    }, 2000);
  };

  const handleCreateProposal = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first!');
      return;
    }

    if (!newProposal.title || !newProposal.description) {
      alert('Please fill in all fields');
      return;
    }

    setTimeout(() => {
      alert(`🎉 Proposal "${newProposal.title}" created successfully!`);
      setNewProposal({ title: '', description: '', duration: 72 });
      setActiveTab('proposals');
    }, 2000);
  };

  const getProposalStatus = (proposal: any) => {
    const now = Date.now();
    const totalVotes = proposal.votesFor + proposal.votesAgainst;
    const supportPercentage = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;

    if (proposal.executed) return { text: 'Executed', color: '#10b981', bg: '#065f46' };
    if (now > proposal.endTime) {
      if (supportPercentage >= 50) return { text: 'Passed', color: '#10b981', bg: '#065f46' };
      return { text: 'Failed', color: '#ef4444', bg: '#7f1d1d' };
    }
    return { text: 'Active', color: '#3b82f6', bg: '#1e3a8a' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="card">
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#f9fafb' }}>
          🏛️ DAO Governance
        </h2>
        <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
          Participate in platform governance and shape the future of SocialFI
        </p>

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
                Demo Mode: DAO Governance
              </div>
              <div style={{ color: '#fcd34d', fontSize: '12px', marginTop: '2px' }}>
                Showing demo proposals. Real voting will be enabled when RPC stabilizes.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4">
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🗳️</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b82f6' }}>12</div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>Total Proposals</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>✅</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>8</div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>Passed</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>👥</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b' }}>1,850</div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>Active Voters</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>💫</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#8b5cf6' }}>45.2K</div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>Total Votes Cast</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div style={{ display: 'flex', borderBottom: '1px solid #374151', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('proposals')}
            style={{
              padding: '12px 20px',
              border: 'none',
              backgroundColor: 'transparent',
              color: activeTab === 'proposals' ? '#3b82f6' : '#9ca3af',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              borderBottom: activeTab === 'proposals' ? '2px solid #3b82f6' : 'none'
            }}
          >
            📋 All Proposals
          </button>
          <button
            onClick={() => setActiveTab('create')}
            style={{
              padding: '12px 20px',
              border: 'none',
              backgroundColor: 'transparent',
              color: activeTab === 'create' ? '#3b82f6' : '#9ca3af',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              borderBottom: activeTab === 'create' ? '2px solid #3b82f6' : 'none'
            }}
          >
            ✍️ Create Proposal
          </button>
        </div>

        {activeTab === 'proposals' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {proposals.map((proposal) => {
              const status = getProposalStatus(proposal);
              const totalVotes = proposal.votesFor + proposal.votesAgainst;
              const supportPercentage = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
              const timeLeft = Math.max(0, proposal.endTime - Date.now());
              const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));

              return (
                <div key={proposal.id} className="card" style={{ border: '1px solid #374151' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#f9fafb' }}>
                          #{proposal.id}: {proposal.title}
                        </h3>
                        <span style={{
                          fontSize: '12px',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          backgroundColor: status.bg,
                          color: status.color
                        }}>
                          {status.text}
                        </span>
                      </div>
                      
                      <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '10px', lineHeight: 1.5 }}>
                        {proposal.description}
                      </p>
                      
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        Proposed by: {proposal.proposer} • {daysLeft > 0 ? `${daysLeft} days left` : 'Voting ended'}
                      </div>
                    </div>
                  </div>

                  {/* Voting Stats */}
                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', color: '#d1d5db' }}>
                        For: {proposal.votesFor.toLocaleString()} ({supportPercentage.toFixed(1)}%)
                      </span>
                      <span style={{ fontSize: '14px', color: '#d1d5db' }}>
                        Against: {proposal.votesAgainst.toLocaleString()} ({(100 - supportPercentage).toFixed(1)}%)
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: '#374151',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${supportPercentage}%`,
                        height: '100%',
                        backgroundColor: supportPercentage >= 50 ? '#10b981' : '#3b82f6',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>

                  {/* Voting Buttons */}
                  {timeLeft > 0 && !proposal.executed && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleVote(proposal.id, true)}
                        disabled={voting === proposal.id}
                        className="btn btn-success"
                        style={{ 
                          flex: 1,
                          opacity: voting === proposal.id ? 0.7 : 1
                        }}
                      >
                        {voting === proposal.id ? '⏳ Voting...' : '✅ Vote For'}
                      </button>
                      <button
                        onClick={() => handleVote(proposal.id, false)}
                        disabled={voting === proposal.id}
                        style={{
                          flex: 1,
                          padding: '8px 16px',
                          border: '1px solid #dc2626',
                          borderRadius: '6px',
                          backgroundColor: 'transparent',
                          color: '#fca5a5',
                          cursor: 'pointer',
                          opacity: voting === proposal.id ? 0.7 : 1
                        }}
                      >
                        {voting === proposal.id ? '⏳ Voting...' : '❌ Vote Against'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: '#f9fafb' }}>
              Create New Proposal
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#d1d5db' }}>
                  Proposal Title:
                </label>
                <input
                  type="text"
                  value={newProposal.title}
                  onChange={(e) => setNewProposal({...newProposal, title: e.target.value})}
                  placeholder="Enter proposal title..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    backgroundColor: '#111827',
                    color: '#e5e7eb',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#d1d5db' }}>
                  Description:
                </label>
                <textarea
                  value={newProposal.description}
                  onChange={(e) => setNewProposal({...newProposal, description: e.target.value})}
                  placeholder="Describe your proposal in detail..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    backgroundColor: '#111827',
                    color: '#e5e7eb',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#d1d5db' }}>
                  Voting Duration (hours):
                </label>
                <select
                  value={newProposal.duration}
                  onChange={(e) => setNewProposal({...newProposal, duration: parseInt(e.target.value)})}
                  style={{
                    width: '200px',
                    padding: '10px',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    backgroundColor: '#111827',
                    color: '#e5e7eb',
                    fontSize: '14px'
                  }}
                >
                  <option value={24}>24 hours</option>
                  <option value={48}>48 hours</option>
                  <option value={72}>72 hours</option>
                  <option value={168}>1 week</option>
                </select>
              </div>
              
              <button
                onClick={handleCreateProposal}
                disabled={!newProposal.title || !newProposal.description}
                className="btn btn-primary"
                style={{
                  width: 'fit-content',
                  padding: '12px 24px',
                  opacity: (!newProposal.title || !newProposal.description) ? 0.5 : 1
                }}
              >
                🚀 Submit Proposal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DAOGovernance;
