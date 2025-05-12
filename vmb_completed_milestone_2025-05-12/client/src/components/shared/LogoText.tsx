
import React from 'react';

interface LogoTextProps {
  children: string;
  size?: 'sm' | 'md' | 'lg' | 'inherit';
  className?: string;
}

const LogoText: React.FC<LogoTextProps> = ({ children, size = 'inherit', className = '' }) => {
  // Map size prop to logo size classes
  let sizeClass = '';
  if (size === 'sm') sizeClass = 'logo-sm';
  else if (size === 'md') sizeClass = 'logo-md';
  else if (size === 'lg') sizeClass = 'logo-lg';
  
  return (
    <span className={`logo-text ${className} px-2 py-1 rounded bg-gradient-to-r from-pink-50 via-white to-pink-50 logo ${sizeClass}`}>
      <span className="ven-me">{children.split('Baby!')[0]}</span>
      <span className="baby">Baby!</span>
    </span>
  );
};

export default LogoText;
