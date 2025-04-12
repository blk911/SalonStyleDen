import React from 'react';

interface LogoTextProps {
  children: string;
  size?: string | number;
  className?: string;
}

const LogoText: React.FC<LogoTextProps> = ({ children, size = 'inherit', className = '' }) => {
  return (
    <span className={`logo-text ${className} px-2 py-1 rounded`}>
      <span className="font-serif bg-gradient-to-r from-[#FF92A5]/30 via-transparent to-transparent px-2">{children.split('Baby!')[0]}</span>
      <span className="font-serif text-[#FF92A5] italic bg-gradient-to-l from-[#FF92A5]/40 via-transparent to-transparent px-2">Baby!</span>
    </span>
  );
};

export default LogoText;