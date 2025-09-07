import React, { useState, useEffect } from 'react';

const RPCStatus: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'error' | 'ok'>('checking');
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  const checkRPCStatus = async () => {
    try {
      const response = await fetch('https://rpc.testnet.soniclabs.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.result) {
          setStatus('ok');
        } else {
          setStatus('error');
        }
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
    
    setLastCheck(new Date());
  };

  useEffect(() => {
    checkRPCStatus();
    const interval = setInterval(checkRPCStatus, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  if (status === 'ok') return null; // Only show when there's an issue

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1001,
      maxWidth: '600px',
      width: '90%'
    }}>
      <div style={{
        padding: '12px 16px',
        backgroundColor: status === 'error' ? '#7f1d1d' : '#92400e',
        borderRadius: '8px',
        border: `1px solid ${status === 'error' ? '#dc2626' : '#d97706'}`,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '14px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
      }}>
        <span style={{ fontSize: '18px' }}>
          {status === 'checking' ? '⏳' : '⚠️'}
        </span>
        
        <div style={{ flex: 1 }}>
          <div style={{ 
            color: status === 'error' ? '#fca5a5' : '#fbbf24', 
            fontWeight: 'bold' 
          }}>
            {status === 'checking' && 'Checking Sonic RPC Status...'}
            {status === 'error' && 'Sonic Testnet RPC Issues Detected'}
          </div>
          
          {status === 'error' && (
            <div style={{ color: '#fcd34d', fontSize: '12px', marginTop: '2px' }}>
              Platform running in demo mode. Contract interactions will resume when RPC stabilizes.
              Last check: {lastCheck.toLocaleTimeString()}
            </div>
          )}
        </div>
        
        <button
          onClick={checkRPCStatus}
          style={{
            padding: '4px 8px',
            fontSize: '11px',
            backgroundColor: 'transparent',
            border: '1px solid currentColor',
            borderRadius: '4px',
            color: 'inherit',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    </div>
  );
};

export default RPCStatus;
