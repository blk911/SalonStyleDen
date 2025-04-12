
import React from 'react';

interface LogoTextProps {
  children: string;
  size?: 'sm' | 'md' | 'lg' | 'inherit';
  split?: boolean;
}

export default function LogoText({ children, size = 'inherit', split = true }: LogoTextProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-5xl md:text-[42px]',
    inherit: ''
  };

  if (!split) {
    return <span className={`font-serif text-[#FF92A5] ${sizeClasses[size]}`}>{children}</span>;
  }

  const [first, second] = children.split('Baby!');
  return (
    <span className={sizeClasses[size]}>
      <span className="font-serif">{first}</span>
      <span className="font-serif text-[#FF92A5]">Baby!</span>
    </span>
  );
}
