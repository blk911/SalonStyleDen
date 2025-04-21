import { Loader2 } from 'lucide-react';
import { useStatus } from '@/contexts/StatusContext';

export function LoadingIndicator() {
  const { isProcessing } = useStatus();

  return (
    <div className="flex items-center gap-2">
      {isProcessing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-pink-600" />
          <span className="text-xs text-pink-600 font-medium">Processing...</span>
        </>
      ) : (
        <span className="text-xs text-red-600 font-bold">
          TASK COMPLETE
        </span>
      )}
    </div>
  );
}