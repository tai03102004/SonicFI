import React, { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import WalletManager from './WalletManager';
import SimpleResearchDashboard from './SimpleResearchDashboard';
import AIModelRegistry from './AIModelRegistry';
import DAOGovernance from './DAOGovernance';
import AdvancedAnalytics from './AdvancedAnalytics';
import LiveTradingSignals from './LiveTradingSignals';
import SocialTrading from './SocialTrading';
import RPCStatus from './RPCStatus';

const MainDashboard: React.FC = () => {
  const { isConnected, address } = useWallet();
  const [activeTab, setActiveTab] = useState('research');

  const tabs = [
    { id: 'research', label: '🧠 AI Research', component: SimpleResearchDashboard },
    { id: 'signals', label: '📡 Live Signals', component: LiveTradingSignals },
    { id: 'social', label: '👥 Social Trading', component: SocialTrading },
    { id: 'analytics', label: '📊 Analytics', component: AdvancedAnalytics },
    { id: 'wallet', label: '💳 Wallet', component: WalletManager },
    { id: 'models', label: '🤖 AI Models', component: AIModelRegistry },
    { id: 'dao', label: '🏛️ Governance', component: DAOGovernance },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || SimpleResearchDashboard;

  return (
    <div style={{ 
      backgroundColor: '#0f0f0f', 
      minHeight: '100vh',
      color: '#f9fafb'
    }}>      
      {/* Add RPC Status */}
      <RPCStatus />
      {/* Enhanced Header */}
      <div style={{ 
        borderBottom: '2px solid #374151',
        backgroundColor: '#1f2937',
        padding: '20px 0',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto', 
          padding: '0 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 5px 0' }}>
              🚀 SocialFI Platform
            </h1>
            <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
              AI-powered trading • Social copy trading • DeFi integration
            </p>
          </div>

          {/* Enhanced Status indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '12px' }}>
            <div style={{
              padding: '4px 12px',
              borderRadius: '12px',
              backgroundColor: isConnected ? '#065f46' : '#374151',
              color: isConnected ? '#34d399' : '#9ca3af'
            }}>
              {isConnected ? `🟢 ${address?.slice(0, 6)}...${address?.slice(-4)}` : '🔗 Connect Wallet'}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Tab Navigation */}
      <div style={{ 
        backgroundColor: '#1f2937',
        borderBottom: '1px solid #374151',
        position: 'sticky',
        top: '86px',
        zIndex: 99
      }}>
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto', 
          padding: '0 20px'
        }}>
          <div style={{ 
            display: 'flex', 
            gap: '0',
            overflowX: 'auto',
            scrollbarWidth: 'none'
          }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '12px 20px',
                  border: 'none',
                  backgroundColor: activeTab === tab.id ? '#374151' : 'transparent',
                  color: activeTab === tab.id ? '#f9fafb' : '#9ca3af',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.backgroundColor = '#374151';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content with fade transition */}
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: '20px',
        minHeight: 'calc(100vh - 170px)'
      }}>
        <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;
