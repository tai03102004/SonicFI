import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
}

type Variant = NonNullable<BadgeProps['variant']>;
type Size = NonNullable<BadgeProps['size']>;

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default', 
  size = 'md',
  className = '', 
  style = {} 
}) => {
  const getVariantStyles = (variant: Variant): React.CSSProperties => {
    const variants: Record<Variant, React.CSSProperties> = {
      default: {
        backgroundColor: '#f3f4f6',
        color: '#374151',
        border: '1px solid #d1d5db'
      },
      secondary: {
        backgroundColor: '#f1f5f9',
        color: '#475569',
        border: '1px solid #cbd5e1'
      },
      success: {
        backgroundColor: '#dcfce7',
        color: '#166534',
        border: '1px solid #bbf7d0'
      },
      warning: {
        backgroundColor: '#fef3c7',
        color: '#d97706',
        border: '1px solid #fde68a'
      },
      danger: {
        backgroundColor: '#fee2e2',
        color: '#dc2626',
        border: '1px solid #fecaca'
      },
      info: {
        backgroundColor: '#dbeafe',
        color: '#1d4ed8',
        border: '1px solid #bfdbfe'
      }
    };
    return variants[variant];
  };

  const getSizeStyles = (size: Size): React.CSSProperties => {
    const sizes: Record<Size, React.CSSProperties> = {
      sm: {
        fontSize: '10px',
        padding: '2px 6px',
        borderRadius: '4px'
      },
      md: {
        fontSize: '12px',
        padding: '4px 8px',
        borderRadius: '6px'
      },
      lg: {
        fontSize: '14px',
        padding: '6px 12px',
        borderRadius: '8px'
      }
    };
    return sizes[size];
  };

  const defaultStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    cursor: 'default',
    ...getSizeStyles(size),
    ...getVariantStyles(variant),
    ...style
  };

  return (
    <span 
      className={`badge badge-${variant} badge-${size} ${className}`} 
      style={defaultStyle}
    >
      {children}
    </span>
  );
};
