import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '400px',
      backgroundColor: '#0f0f0f'
    }}>
      <div style={{ 
        fontSize: '24px', 
        color: '#9ca3af',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div style={{ 
          width: '20px', 
          height: '20px', 
          border: '2px solid #374151',
          borderTop: '2px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        Loading...
      </div>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default LoadingSpinner;
