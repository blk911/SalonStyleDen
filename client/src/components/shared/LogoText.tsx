
import React from 'react';

interface LogoTextProps {
  children: string;
  size?: string | number;
  className?: string;
}

const LogoText: React.FC<LogoTextProps> = ({ children, size = 'inherit', className = '' }) => {
  return (
    <span className={`logo-text ${className} px-2 py-1 rounded bg-gradient-to-r from-pink-50 via-white to-pink-50 logo`}>
      <span className="ven-me">{children.split('Baby!')[0]}</span>
      <span className="baby">Baby!</span>
    </span>
  );
};

export default LogoText;
