import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ children, className = '', style = {} }) => {
  const defaultStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    ...style
  };

  return (
    <div className={`card ${className}`} style={defaultStyle}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '', style = {} }) => {
  const defaultStyle: React.CSSProperties = {
    padding: '16px 20px',
    borderBottom: '1px solid #f3f4f6',
    ...style
  };

  return (
    <div className={`card-header ${className}`} style={defaultStyle}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<CardTitleProps> = ({ children, className = '', style = {} }) => {
  const defaultStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    margin: 0,
    ...style
  };

  return (
    <h3 className={`card-title ${className}`} style={defaultStyle}>
      {children}
    </h3>
  );
};

export const CardContent: React.FC<CardContentProps> = ({ children, className = '', style = {} }) => {
  const defaultStyle: React.CSSProperties = {
    padding: '20px',
    ...style
  };

  return (
    <div className={`card-content ${className}`} style={defaultStyle}>
      {children}
    </div>
  );
};