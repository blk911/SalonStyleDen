import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingIndicatorProps {
  isLoading?: boolean;
  showCompletion?: boolean;
}

export function LoadingIndicator({ 
  isLoading = true, 
  showCompletion = false 
}: LoadingIndicatorProps) {
  const [showComplete, setShowComplete] = useState(false);
  const [isActive, setIsActive] = useState(isLoading);

  // When isLoading changes from true to false, show completion message
  useEffect(() => {
    if (!isLoading && showCompletion) {
      setIsActive(false);
      setShowComplete(true);
      
      // Hide the completion message after 3 seconds
      const timer = setTimeout(() => {
        setShowComplete(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    } else {
      setIsActive(isLoading);
      setShowComplete(false);
    }
  }, [isLoading, showCompletion]);

  if (!isActive && !showComplete) return null;

  return (
    <div className="flex items-center gap-2">
      {isActive ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-pink-600" />
          <span className="text-xs text-pink-600 font-medium">Processing...</span>
        </>
      ) : showComplete ? (
        <span className="text-xs text-red-600 font-bold">
          TASK COMPLETE
        </span>
      ) : null}
    </div>
  );
}