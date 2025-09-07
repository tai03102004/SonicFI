import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';

const Navigation: React.FC = () => {
  const location = useLocation();
  const { address, isConnected, isConnecting, connect, formatAddress, error, switchToSonicTestnet } = useWallet();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/analytics', label: 'Analytics', icon: '📈' },
  ];

  return (
    <nav style={{
      backgroundColor: '#111827',
      padding: '0 20px',
      borderBottom: '1px solid #374151',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px'
      }}>
        {/* Logo */}
        <Link 
          to="/dashboard" 
          style={{
            textDecoration: 'none',
            color: '#f9fafb',
            fontSize: '20px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span style={{ fontSize: '24px' }}>🧠</span>
          AI SocialFi
        </Link>

        {/* Navigation Items */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                textDecoration: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                color: location.pathname === item.path ? '#3b82f6' : '#9ca3af',
                backgroundColor: location.pathname === item.path ? '#1e3a8a20' : 'transparent',
                fontSize: '14px',
                fontWeight: '500',
                border: location.pathname === item.path ? '1px solid #1e3a8a40' : '1px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>

        {/* Wallet Connection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {isConnected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Network Switch Button */}
              {error && error.includes('switch') && (
                <button
                  onClick={switchToSonicTestnet}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#dc2626',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  ⚠️ Switch Network
                </button>
              )}             
              
              {/* Address Display */}
              <div style={{
                padding: '8px 12px',
                backgroundColor: '#1f2937',
                border: '1px solid #10b981',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#10b981',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ 
                  width: '8px', 
                  height: '8px', 
                  backgroundColor: '#10b981', 
                  borderRadius: '50%' 
                }} />
                {formatAddress(address!)}
              </div>
            </div>
          ) : (
            <button 
              onClick={connect}
              disabled={isConnecting}
              className="btn btn-primary"
              style={{
                opacity: isConnecting ? 0.7 : 1,
                cursor: isConnecting ? 'not-allowed' : 'pointer'
              }}
            >
              {isConnecting ? (
                <>
                  <div className="loading-spin" style={{ 
                    width: '16px', 
                    height: '16px', 
                    border: '2px solid transparent',
                    borderTop: '2px solid white',
                    borderRadius: '50%'
                  }} />
                  Connecting...
                </>
              ) : (
                <>
                  <span>🔗</span>
                  Connect Wallet
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;