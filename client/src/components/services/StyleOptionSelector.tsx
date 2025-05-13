import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface StyleOption {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number;
  imageUrl?: string;
}

interface StyleOptionSelectorProps {
  onSelectStyle: (style: StyleOption) => void;
  selectedStyleId?: number;
  className?: string;
}

export const StyleOptionSelector: React.FC<StyleOptionSelectorProps> = ({
  onSelectStyle,
  selectedStyleId,
  className,
}) => {
  const [styles, setStyles] = useState<StyleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStyles = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/styles');
        if (!response.ok) {
          throw new Error(`Failed to fetch styles: ${response.status}`);
        }
        const data = await response.json();
        setStyles(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load style options');
        console.error('Error fetching styles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStyles();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse bg-gray-100 rounded-md h-20"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4 bg-red-50 rounded-md">{error}</div>;
  }

  // Fallback to some sample styles if none are returned from the API
  const displayStyles = styles.length > 0 ? styles : [
    {
      id: 1,
      name: 'Glam Me! Custom Design',
      description: 'Fully custom art, gems, 3D extras',
      price: 125,
      duration: 90
    },
    {
      id: 2,
      name: 'French Tips / Touch-Up',
      description: 'Classic french style with subtle design',
      price: 75,
      duration: 60
    },
    {
      id: 3,
      name: 'Full Set',
      description: 'New complete set with basic design',
      price: 85,
      duration: 75
    },
    {
      id: 4,
      name: 'Nail Art Special',
      description: 'Intricate designs and patterns',
      price: 95,
      duration: 80
    }
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      {displayStyles.map((style) => (
        <Card 
          key={style.id}
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedStyleId === style.id 
              ? 'ring-2 ring-pink-500 bg-pink-50' 
              : 'hover:bg-gray-50'
          }`}
          onClick={() => onSelectStyle(style)}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">{style.name}</h3>
              <p className="text-sm text-gray-500">{style.description}</p>
              <div className="mt-2 flex items-center gap-3">
                <span className="font-semibold text-gray-900">${style.price}</span>
                <span className="text-xs text-gray-500">{style.duration} min</span>
              </div>
            </div>
            {style.imageUrl && (
              <div className="h-16 w-16 rounded-md overflow-hidden">
                <img 
                  src={style.imageUrl} 
                  alt={style.name} 
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            {!style.imageUrl && selectedStyleId === style.id && (
              <div className="h-6 w-6 rounded-full bg-pink-500 text-white flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Usage example
export const StyleOptionSelectorExample: React.FC = () => {
  const [selectedStyle, setSelectedStyle] = useState<StyleOption | null>(null);
  
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Select a Style</h2>
      
      <StyleOptionSelector 
        onSelectStyle={(style) => setSelectedStyle(style)}
        selectedStyleId={selectedStyle?.id}
      />
      
      {selectedStyle && (
        <div className="mt-6 p-4 bg-pink-50 rounded-md">
          <h3 className="font-semibold">Selected Style:</h3>
          <p>{selectedStyle.name} - ${selectedStyle.price}</p>
        </div>
      )}
    </div>
  );
};