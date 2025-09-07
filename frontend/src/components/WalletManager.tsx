import React, { useState } from 'react';
import { useWallet } from '../hooks/useWallet';

const WalletManager: React.FC = () => {
  const { isConnected, address, connect, disconnect } = useWallet();
  const [transferAmount, setTransferAmount] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferring, setTransferring] = useState(false);

  const mockBalance = "59.97";
  const mockTransactions = [
    {
      hash: '0xabc123...',
      type: 'Received',
      amount: '+100.00',
      from: '0x789...456',
      timestamp: '2 hours ago',
      status: 'Confirmed'
    },
    {
      hash: '0xdef456...',
      type: 'Sent', 
      amount: '-25.50',
      to: '0x123...789',
      timestamp: '1 day ago',
      status: 'Confirmed'
    },
    {
      hash: '0xghi789...',
      type: 'AI Reward',
      amount: '+15.25',
      from: 'AIModelRegistry',
      timestamp: '3 days ago', 
      status: 'Confirmed'
    }
  ];

  const handleTransfer = async () => {
    if (!isConnected || !transferAmount || !transferTo) return;
    
    setTransferring(true);
    
    // Simulate transfer
    setTimeout(() => {
      alert(`🎉 Successfully sent ${transferAmount} S tokens to ${transferTo.slice(0,6)}...${transferTo.slice(-4)}`);
      setTransferAmount('');
      setTransferTo('');
      setTransferring(false);
    }, 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="card">
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#f9fafb' }}>
          💳 Wallet Manager
        </h2>
        <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
          Manage your S tokens and transaction history
        </p>
      </div>

      <div className="grid-2" style={{ gap: '20px' }}>
        {/* Balance & Actions */}
        <div className="card">
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: '#f9fafb' }}>
            Account Overview
          </h3>
          
          {isConnected ? (
            <div>
              {/* Balance Display */}
              <div style={{ 
                textAlign: 'center',
                padding: '20px',
                backgroundColor: '#065f46',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981', marginBottom: '5px' }}>
                  {mockBalance} S
                </div>
                <div style={{ fontSize: '14px', color: '#6ee7b7' }}>
                  ≈ ${(parseFloat(mockBalance) * 2.5).toFixed(2)} USD
                </div>
              </div>

              {/* Account Info */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '5px' }}>Wallet Address:</div>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#e5e7eb',
                  fontFamily: 'monospace',
                  padding: '8px',
                  backgroundColor: '#374151',
                  borderRadius: '4px'
                }}>
                  {address}
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-primary" style={{ flex: 1 }}>
                  📤 Send
                </button>
                <button className="btn btn-secondary" style={{ flex: 1 }}>
                  📥 Receive
                </button>
                <button 
                  onClick={disconnect}
                  className="btn"
                  style={{ 
                    flex: 1,
                    backgroundColor: '#7f1d1d',
                    color: '#fca5a5'
                  }}
                >
                  🔌 Disconnect
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>💳</div>
              <p style={{ color: '#9ca3af', marginBottom: '20px' }}>
                Connect your wallet to view balance and manage tokens
              </p>
              <button
                onClick={connect}
                className="btn btn-primary"
                style={{ padding: '12px 24px' }}
              >
                🔗 Connect Wallet
              </button>
            </div>
          )}
        </div>

        {/* Transfer Form */}
        <div className="card">
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: '#f9fafb' }}>
            Send S Tokens
          </h3>
          
          {isConnected ? (
            <div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#d1d5db' }}>
                  Recipient Address:
                </label>
                <input
                  type="text"
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  placeholder="0x..."
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
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#d1d5db' }}>
                  Amount (S):
                </label>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
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
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '5px' }}>
                  Balance: {mockBalance} S
                </div>
              </div>
              
              <button
                onClick={handleTransfer}
                disabled={!transferAmount || !transferTo || transferring}
                className="btn btn-success"
                style={{
                  width: '100%',
                  padding: '12px',
                  opacity: (!transferAmount || !transferTo || transferring) ? 0.5 : 1
                }}
              >
                {transferring ? '⏳ Sending...' : '🚀 Send Tokens'}
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔒</div>
              <p>Connect wallet to send tokens</p>
            </div>
          )}
        </div>
      </div>

      {/* Transaction History */}
      <div className="card">
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: '#f9fafb' }}>
          📜 Recent Transactions
        </h3>
        
        {mockTransactions.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {mockTransactions.map((tx, index) => (
              <div key={index} style={{
                padding: '15px',
                border: '1px solid #374151',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                    <span style={{ 
                      fontSize: '12px',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      backgroundColor: tx.type === 'Received' || tx.type === 'AI Reward' ? '#065f46' : '#7f1d1d',
                      color: tx.type === 'Received' || tx.type === 'AI Reward' ? '#34d399' : '#fca5a5'
                    }}>
                      {tx.type}
                    </span>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                      {tx.timestamp}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                    {tx.from ? `From: ${tx.from}` : `To: ${tx.to}`}
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: 'bold',
                    color: tx.amount.startsWith('+') ? '#10b981' : '#ef4444'
                  }}>
                    {tx.amount} S
                  </div>
                  <div style={{ fontSize: '10px', color: '#9ca3af' }}>
                    {tx.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <p>No transactions yet</p>
          </div>
        )}
      </div>

      {/* RPC Status Notice */}
      <div style={{
        padding: '12px',
        backgroundColor: '#92400e',
        borderRadius: '6px',
        border: '1px solid #d97706',
        fontSize: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>⚠️</span>
          <div>
            <div style={{ color: '#fbbf24', fontWeight: 'bold' }}>Notice: Demo Mode Active</div>
            <div style={{ color: '#fcd34d', marginTop: '2px' }}>
              Real-time contract calls temporarily unavailable due to Sonic RPC issues. Displaying demo data.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletManager;