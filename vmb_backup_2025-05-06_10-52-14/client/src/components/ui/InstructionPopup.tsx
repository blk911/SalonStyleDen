import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface InstructionPopupProps {
  title: string;
  description: string;
  isOpen: boolean;
  onClose: () => void;
  steps?: string[];
  icon?: React.ReactNode;
  className?: string;
  actionText?: string;
  onAction?: () => void;
}

export function InstructionPopup({
  title,
  description,
  isOpen,
  onClose,
  steps,
  icon,
  className,
  actionText = "Got it",
  onAction,
}: InstructionPopupProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn("max-w-md", className)}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            {icon && <div className="text-pink-500">{icon}</div>}
            <DialogTitle className="text-lg font-serif text-pink-800">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-gray-600 mt-1">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        {steps && steps.length > 0 && (
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-pink-100 text-pink-600 font-medium text-sm">
                  {index + 1}
                </div>
                <p className="text-sm text-gray-700">{step}</p>
              </div>
            ))}
          </div>
        )}
        
        <DialogFooter className="mt-4">
          <Button 
            onClick={() => {
              if (onAction) onAction();
              onClose();
            }}
            className="bg-pink-500 hover:bg-pink-600 text-white"
          >
            {actionText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}