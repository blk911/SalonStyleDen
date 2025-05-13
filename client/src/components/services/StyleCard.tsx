import React from 'react';

interface StyleCardProps {
  title: string;
  description: string;
  price: number;
  duration: number;
  imageUrl?: string;
  className?: string;
}

export const StyleCard: React.FC<StyleCardProps> = ({
  title,
  description,
  price,
  duration,
  imageUrl,
  className,
}) => {
  return (
    <div className={`flex items-center p-4 bg-white rounded-md shadow-sm border border-gray-100 ${className}`}>
      <div className="flex-1">
        <h3 className="text-base font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
        <div className="flex items-center mt-2">
          <span className="text-lg font-semibold">${price}</span>
          <span className="ml-3 text-sm text-gray-500">{duration} min</span>
        </div>
      </div>
      
      {imageUrl && (
        <div className="ml-4 h-16 w-16 lg:h-20 lg:w-20 flex-shrink-0">
          <img 
            src={imageUrl} 
            alt={title}
            className="h-full w-full object-cover rounded-md"
          />
        </div>
      )}
    </div>
  );
};

// Export a pre-configured Glam Me style card
export const GlamMeStyleCard: React.FC<{
  className?: string;
  imageUrl?: string;
}> = ({ className, imageUrl }) => {
  return (
    <StyleCard
      title="Glam Me! Custom Design"
      description="Fully custom art, gems, 3D extras"
      price={125}
      duration={90}
      imageUrl={imageUrl || "/assets/yours_truly.jpg"}
      className={className}
    />
  );
};