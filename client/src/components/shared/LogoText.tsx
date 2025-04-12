
import React from 'react';

interface LogoTextProps {
  children: string;
  size?: string | number;
  className?: string;
}

const LogoText: React.FC<LogoTextProps> = ({ children, size = 'inherit', className = '' }) => {
  return (
    <span className={`logo-text ${className}`}>
      <span className="font-serif text-black">{children.split('Baby!')[0]}</span>
      <span className="font-serif text-[#FF92A5] italic">Baby!</span>
    </span>
  );
};

export default LogoText;
