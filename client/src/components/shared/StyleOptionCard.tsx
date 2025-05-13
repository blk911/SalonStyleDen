/**
 * StyleOptionCard Component
 * 
 * A shared component for consistent display of style options across the site.
 * Used for style cards in style selection, gift displays, and salon dashboards.
 */

import React from 'react';

interface StyleOptionCardProps {
  title: string;
  description: string;
  price: number;
  duration: number; // in minutes
  imageUrl: string;
  width?: number; // optional custom width (defaults to 400px)
}

export function StyleOptionCard({ 
  title, 
  description, 
  price, 
  duration, 
  imageUrl,
  width = 400
}: StyleOptionCardProps) {
  return (
    <div className="border border-pink-500 rounded-md overflow-hidden flex items-stretch" style={{ width: `${width}px` }}>
      <div className="p-3 flex-grow" style={{ width: '70%' }}>
        <div className="text-xs">{title}</div>
        <div className="text-xs text-gray-600">{description}</div>
        <div className="flex items-baseline mt-2">
          <span className="text-xs">${price}</span>
          <span className="ml-1 text-xs text-gray-600">{duration} min</span>
        </div>
      </div>
      <div className="w-[30%] bg-cover bg-center" style={{ backgroundImage: `url('${imageUrl}')` }}></div>
    </div>
  );
}