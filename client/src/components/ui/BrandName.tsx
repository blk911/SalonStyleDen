import React from 'react';

interface BrandNameProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  withExclamation?: boolean;
  inline?: boolean;
  textAlign?: 'left' | 'center' | 'right';
}

/**
 * A consistent component for displaying the "Ven Me, Baby!" brand name
 * with proper styling across the entire application.
 */
export default function BrandName({
  className = '',
  size = 'lg',
  withExclamation = true,
  inline = false,
  textAlign = 'center'
}: BrandNameProps) {
  const fontSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
  };
  
  const fontSize = fontSizes[size] || 'text-lg';
  const containerClass = inline ? 'inline' : 'block';
  const alignment = `text-${textAlign}`;
  
  return (
    <span className={`${containerClass} ${alignment} ${className} logo`}>
      <span className="ven-me">Ven Me, </span>
      <span className="baby">
        Baby{withExclamation ? '!' : ''}
      </span>
    </span>
  );
}