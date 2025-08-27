import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/analytics', label: 'Analytics', icon: '📈' }
  ];

  return (
    <nav style={{
      backgroundColor: '#1a1a1a',
      padding: '0 20px',
      borderBottom: '1px solid #333'
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
            color: 'white',
            fontSize: '20px',
            fontWeight: 'bold'
          }}
        >
          🚀 AI SocialFi
        </Link>

        <div style={{ display: 'flex', gap: '8px' }}>
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                textDecoration: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                color: location.pathname === item.path ? '#2563eb' : '#ccc',
                backgroundColor: location.pathname === item.path ? '#2563eb20' : 'transparent',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              <span style={{ marginRight: '6px' }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>

        <button style={{
          padding: '8px 16px',
          backgroundColor: '#2563eb',
          color: 'white',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          Connect Wallet
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
