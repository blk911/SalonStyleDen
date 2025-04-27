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
  // Map our text size props to the logo size classes
  const logoSizes = {
    xs: 'logo-sm',
    sm: 'logo-sm',
    md: 'logo-md',
    lg: 'logo-md',
    xl: 'logo-lg',
    '2xl': 'logo-lg',
    '3xl': 'logo-lg',
    '4xl': 'logo-lg',
  };
  
  const logoSizeClass = logoSizes[size] || 'logo-md';
  const containerClass = inline ? 'inline' : 'block';
  const alignment = `text-${textAlign}`;
  
  return (
    <span className={`${containerClass} ${alignment} ${className} logo ${logoSizeClass}`}>
      <span className="ven-me">Ven Me, </span>
      <span className="baby">
        Baby{withExclamation ? '!' : ''}
      </span>
    </span>
  );
}