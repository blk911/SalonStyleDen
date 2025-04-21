
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface LoadingIndicatorProps {
  className?: string
  size?: number
}

export function LoadingIndicator({ className, size = 24 }: LoadingIndicatorProps) {
  return (
    <Loader2 
      className={cn("animate-spin text-primary", className)} 
      size={size}
    />
  )
}
