import React from 'react';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '400px',
      padding: '20px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
      <h2 style={{ color: '#dc2626', marginBottom: '8px' }}>Something went wrong</h2>
      <p style={{ color: '#666', marginBottom: '16px', maxWidth: '500px' }}>
        {error.message || 'An unexpected error occurred'}
      </p>
      <button
        onClick={resetErrorBoundary}
        style={{
          padding: '10px 20px',
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold'
        }}
      >
        Try Again
      </button>
    </div>
  );
};

export default ErrorFallback;
