import React from 'react';

interface ProgressProps {
  value: number; // 0-100
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger';
  showValue?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

type Size = NonNullable<ProgressProps['size']>;
type Variant = NonNullable<ProgressProps['variant']>;

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showValue = false,
  className = '',
  style = {}
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const getSizeStyles = (size: Size) => {
    const sizes: Record<Size, { height: string; fontSize: string }> = {
      sm: { height: '4px', fontSize: '10px' },
      md: { height: '8px', fontSize: '12px' },
      lg: { height: '12px', fontSize: '14px' }
    };
    return sizes[size];
  };

  const getVariantColor = (variant: Variant): string => {
    const colors: Record<Variant, string> = {
      default: '#3b82f6',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444'
    };
    return colors[variant];
  };

  const containerStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: '#f3f4f6',
    borderRadius: '4px',
    overflow: 'hidden',
    position: 'relative',
    height: getSizeStyles(size).height,
    ...style
  };

  const fillStyle: React.CSSProperties = {
    height: '100%',
    backgroundColor: getVariantColor(variant),
    borderRadius: '4px',
    transition: 'width 0.3s ease-in-out',
    width: `${percentage}%`,
    minWidth: percentage > 0 ? '2px' : '0'
  };

  const labelStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: getSizeStyles(size).fontSize,
    fontWeight: '500',
    color: '#374151',
    textShadow: '1px 1px 1px rgba(255,255,255,0.8)'
  };

  return (
    <div className={`progress progress-${size} progress-${variant} ${className}`}>
      <div style={containerStyle}>
        <div style={fillStyle} />
        {showValue && (
          <div style={labelStyle}>
            {Math.round(percentage)}%
          </div>
        )}
      </div>
    </div>
  );
};
