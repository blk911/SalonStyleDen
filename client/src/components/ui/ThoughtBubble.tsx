import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThoughtBubbleProps {
  message?: string;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "middle-center";
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  delay?: number; // Delay in ms before showing
}

export function ThoughtBubble({
  message,
  position = "top-right",
  isOpen,
  onClose,
  className,
  delay = 500
}: ThoughtBubbleProps) {
  const [show, setShow] = useState(false);
  
  // Position classes
  const positionClasses: Record<string, string> = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "middle-center": "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
  };

  // Show with delay
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen) {
      timer = setTimeout(() => {
        setShow(true);
      }, delay);
    } else {
      setShow(false);
    }
    
    return () => {
      clearTimeout(timer);
    };
  }, [isOpen, delay]);
  
  if (!show) return null;
  
  return (
    <div 
      className={cn(
        "fixed z-50 max-w-xs bg-white rounded-xl shadow-sm border border-pink-200 p-3 text-xs animate-in fade-in",
        positionClasses[position],
        className
      )}
    >
      {/* Close button */}
      <button 
        onClick={onClose}
        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center hover:bg-pink-600"
        aria-label="Close"
      >
        <X className="h-3 w-3" />
      </button>
      
      {/* Thought bubble connectors - small circles */}
      <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white border border-pink-200"></div>
      <div className="absolute -top-3 -right-2 w-1.5 h-1.5 rounded-full bg-white border border-pink-200"></div>
      <div className="absolute -top-4 -right-4 w-1 h-1 rounded-full bg-white border border-pink-200"></div>
      
      {/* Bubble content */}
      <p className="text-gray-700 text-xs leading-relaxed">
        {message || "See how Ven Me Baby makes gifting personal work...for real! For salons, 'How easy!' and for personal care clients, create your gift invitation."}
      </p>
    </div>
  );
}