
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { useState, useEffect } from "react"

interface LoadingIndicatorProps {
  className?: string
  size?: number
  isComplete?: boolean
}

export function LoadingIndicator({ className, size = 24, isComplete = false }: LoadingIndicatorProps) {
  const [showComplete, setShowComplete] = useState(false);

  useEffect(() => {
    if (isComplete) {
      setShowComplete(true);
    }
  }, [isComplete]);

  return (
    <div className="flex items-center gap-2">
      {!isComplete && (
        <Loader2 
          className={cn("animate-spin text-primary", className)} 
          size={size}
        />
      )}
      {showComplete && (
        <span className="text-red-500 font-semibold">
          TASK COMPLETE
        </span>
      )}
    </div>
  )
}
