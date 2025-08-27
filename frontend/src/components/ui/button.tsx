import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  style?: React.CSSProperties;
}

type Variant = NonNullable<ButtonProps['variant']>;
type Size = NonNullable<ButtonProps['size']>;

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'default',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
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
      primary: {
        backgroundColor: '#2563eb',
        color: '#ffffff',
        border: '1px solid #2563eb'
      },
      secondary: {
        backgroundColor: '#6b7280',
        color: '#ffffff',
        border: '1px solid #6b7280'
      },
      success: {
        backgroundColor: '#10b981',
        color: '#ffffff',
        border: '1px solid #10b981'
      },
      warning: {
        backgroundColor: '#f59e0b',
        color: '#ffffff',
        border: '1px solid #f59e0b'
      },
      danger: {
        backgroundColor: '#ef4444',
        color: '#ffffff',
        border: '1px solid #ef4444'
      },
      ghost: {
        backgroundColor: 'transparent',
        color: '#374151',
        border: 'none'
      },
      outline: {
        backgroundColor: 'transparent',
        color: '#2563eb',
        border: '1px solid #2563eb'
      }
    };
    return variants[variant];
  };

  const getSizeStyles = (size: Size): React.CSSProperties => {
    const sizes: Record<Size, React.CSSProperties> = {
      sm: {
        fontSize: '12px',
        padding: '6px 12px',
        borderRadius: '4px',
        minHeight: '32px'
      },
      md: {
        fontSize: '14px',
        padding: '8px 16px',
        borderRadius: '6px',
        minHeight: '40px'
      },
      lg: {
        fontSize: '16px',
        padding: '12px 24px',
        borderRadius: '8px',
        minHeight: '48px'
      }
    };
    return sizes[size];
  };

  const getDisabledStyles = (): React.CSSProperties => ({
    opacity: 0.5,
    cursor: 'not-allowed',
    pointerEvents: 'none'
  });

  const getHoverStyles = (variant: Variant): React.CSSProperties => {
    if (disabled || loading) return {};
    
    const hoverStyles: Record<Variant, React.CSSProperties> = {
      default: { backgroundColor: '#e5e7eb' },
      primary: { backgroundColor: '#1d4ed8' },
      secondary: { backgroundColor: '#4b5563' },
      success: { backgroundColor: '#059669' },
      warning: { backgroundColor: '#d97706' },
      danger: { backgroundColor: '#dc2626' },
      ghost: { backgroundColor: '#f3f4f6' },
      outline: { backgroundColor: '#eff6ff' }
    };
    
    return hoverStyles[variant];
  };

  const defaultStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '500',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease-in-out',
    outline: 'none',
    ...getSizeStyles(size),
    ...getVariantStyles(variant),
    ...(disabled || loading ? getDisabledStyles() : {}),
    ...style
  };

  const [isHovered, setIsHovered] = React.useState(false);

  const finalStyle = {
    ...defaultStyle,
    ...(isHovered ? getHoverStyles(variant) : {})
  };

  return (
    <button
      type={type}
      className={`button button-${variant} button-${size} ${className}`}
      style={finalStyle}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {loading && (
        <span style={{ marginRight: '8px' }}>
          <LoadingSpinner size={size === 'sm' ? 12 : size === 'lg' ? 20 : 16} />
        </span>
      )}
      {children}
    </button>
  );
};

// Simple loading spinner component
const LoadingSpinner: React.FC<{ size: number }> = ({ size }) => {
  const spinnerStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    border: '2px solid transparent',
    borderTop: '2px solid currentColor',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  };

  return <div style={spinnerStyle} />;
};

// Add CSS animation for spinner
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}
