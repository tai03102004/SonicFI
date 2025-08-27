import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/analytics', label: 'Analytics', icon: '📈' },
    { path: '/ai-models', label: 'AI Models', icon: '🤖' },
    { path: '/reputation', label: 'Reputation', icon: '🏆' }
  ];

  return (
    <nav style={{
      backgroundColor: '#111827',
      padding: '0 20px',
      borderBottom: '1px solid #374151',
      backdropFilter: 'blur(8px)'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px'
      }}>
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
          <span style={{ fontSize: '24px' }}>⚡</span>
          AI SocialFi
        </Link>

        <div style={{ display: 'flex', gap: '4px' }}>
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                textDecoration: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                color: location.pathname === item.path ? '#3b82f6' : '#9ca3af',
                backgroundColor: location.pathname === item.path ? '#1e3a8a20' : 'transparent',
                fontSize: '14px',
                fontWeight: '500',
                border: location.pathname === item.path ? '1px solid #1e3a8a40' : '1px solid transparent'
              }}
            >
              <span style={{ marginRight: '6px' }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>

        <button style={{
          padding: '8px 16px',
          backgroundColor: '#3b82f6',
          color: '#ffffff',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 'bold',
          border: '1px solid #2563eb'
        }}>
          Connect Wallet
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
