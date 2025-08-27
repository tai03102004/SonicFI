import React from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  customSize?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'error' | 'success';
}

export const Input: React.FC<InputProps> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled = false,
  customSize = 'md',
  variant = 'default',
  className = '',
  style,
  ...rest
}) => {
  const [isFocused, setIsFocused] = React.useState(false);

  const sizeStyles = {
    sm: { fontSize: '12px', padding: '6px 8px', height: '32px' },
    md: { fontSize: '14px', padding: '8px 12px', height: '40px' },
    lg: { fontSize: '16px', padding: '12px 16px', height: '48px' }
  }[customSize];

  const variantStyles = {
    default: { borderColor: '#d1d5db', focusBorderColor: '#2563eb' },
    error: { borderColor: '#ef4444', focusBorderColor: '#ef4444' },
    success: { borderColor: '#10b981', focusBorderColor: '#10b981' }
  }[variant] || { borderColor: '#d1d5db', focusBorderColor: '#2563eb' };

  const defaultStyle: React.CSSProperties = {
    width: '100%',
    borderRadius: '6px',
    backgroundColor: disabled ? '#f9fafb' : '#ffffff',
    color: disabled ? '#6b7280' : '#111827',
    cursor: disabled ? 'not-allowed' : 'text',
    outline: 'none',
    transition: 'border-color 0.2s ease-in-out',
    border: `1px solid ${isFocused ? variantStyles.focusBorderColor : variantStyles.borderColor}`,
    ...sizeStyles,
    ...style
  };

  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`input input-${customSize} input-${variant} ${className}`}
      style={defaultStyle}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      {...rest}
    />
  );
};
