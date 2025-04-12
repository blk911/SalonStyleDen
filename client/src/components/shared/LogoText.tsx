
import React from 'react';

interface LogoTextProps {
  children: string;
  size?: string | number;
  className?: string;
}

const LogoText: React.FC<LogoTextProps> = ({ children, size = 'inherit', className = '' }) => {
  return (
    <span className={`logo-text ${className} px-2 py-1 rounded bg-gradient-to-r from-[#FF92A5]/5 via-black/5 to-[#FF92A5]/5`}>
      <span className="font-serif bg-gradient-to-r from-black via-[#FF92A5] to-black bg-clip-text text-transparent">{children.split('Baby!')[0]}</span>
      <span className="font-serif bg-gradient-to-r from-[#FF92A5] via-black to-[#FF92A5] bg-clip-text text-transparent italic">Baby!</span>
    </span>
  );
};

export default LogoText;
