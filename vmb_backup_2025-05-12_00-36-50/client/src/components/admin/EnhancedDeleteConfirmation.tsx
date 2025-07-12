import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface EntityDetail {
  label: string;
  value: string | number | null | undefined;
}

interface EnhancedDeleteConfirmationProps {
  title: string;
  entityName: string;
  entityId: number | string;
  entityDetails?: EntityDetail[];
  triggerButton: React.ReactNode;
  onConfirm: () => void;
  actionText?: string;
  warningText?: string;
}

export function EnhancedDeleteConfirmation({
  title,
  entityName,
  entityId,
  entityDetails = [],
  triggerButton,
  onConfirm,
  actionText = "Delete",
  warningText = "This action cannot be undone."
}: EnhancedDeleteConfirmationProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {triggerButton}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            <p className="mb-2">
              Are you sure you want to delete this {entityName}?
            </p>
            
            {entityDetails && entityDetails.length > 0 && (
              <div className="bg-gray-50 p-3 rounded border mt-2 text-sm">
                <div className="font-medium text-gray-700 mb-1">Details:</div>
                {entityDetails.map((detail, index) => (
                  <div key={index} className="grid grid-cols-[100px_1fr] gap-2 mb-1">
                    <span className="font-medium text-gray-600">{detail.label}:</span> 
                    <span>{detail.value || "—"}</span>
                  </div>
                ))}
                <div className="text-xs text-gray-500 mt-2">ID: {entityId}</div>
              </div>
            )}
            
            <p className="mt-3 text-red-500 font-medium">{warningText}</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-600"
          >
            {actionText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}