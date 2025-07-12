import React, { createContext, useState, useContext, ReactNode } from 'react';

interface StatusContextType {
  isProcessing: boolean;
  startProcessing: () => void;
  completeProcessing: () => void;
}

const StatusContext = createContext<StatusContextType | undefined>(undefined);

export function StatusProvider({ children }: { children: ReactNode }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  
  // Start a processing task
  const startProcessing = () => {
    setIsProcessing(true);
    setShowCompletion(false);
  };
  
  // Complete a processing task and show completion message
  const completeProcessing = () => {
    setIsProcessing(false);
    setShowCompletion(true);
    
    // Hide the completion message after 3 seconds
    setTimeout(() => {
      setShowCompletion(false);
    }, 3000);
  };
  
  return (
    <StatusContext.Provider 
      value={{ 
        isProcessing, 
        startProcessing, 
        completeProcessing 
      }}
    >
      {children}
    </StatusContext.Provider>
  );
}

// Hook to use the status context
export function useStatus() {
  const context = useContext(StatusContext);
  if (context === undefined) {
    throw new Error('useStatus must be used within a StatusProvider');
  }
  return context;
}