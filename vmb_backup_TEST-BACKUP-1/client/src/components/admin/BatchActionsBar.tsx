import React from 'react';
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { TrashIcon, RefreshCwIcon } from "lucide-react";

interface BatchActionsBarProps {
  entityName: string;
  count: number;
  onClearAll: () => void;
  onRefresh?: () => void;
  customActions?: React.ReactNode;
}

export function BatchActionsBar({
  entityName,
  count,
  onClearAll,
  onRefresh,
  customActions
}: BatchActionsBarProps) {
  return (
    <div className="bg-gray-50 p-2 border-b flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <h3 className="text-sm font-medium">{entityName}</h3>
        <Badge className="bg-gray-200 text-gray-700 hover:bg-gray-300">
          {count} total
        </Badge>
      </div>
      
      <div className="flex items-center space-x-2">
        {customActions}
        
        {onRefresh && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onRefresh}
            className="text-xs"
          >
            <RefreshCwIcon className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        )}
        
        {count > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-xs"
              >
                <TrashIcon className="h-3 w-3 mr-1" />
                Clear All {entityName}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear All {entityName}</AlertDialogTitle>
                <AlertDialogDescription className="text-red-500 font-medium">
                  Warning: This action will delete ALL {count} {entityName.toLowerCase()} from the system.
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                    This action cannot be undone. Please be certain.
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={onClearAll}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Yes, Delete All {entityName}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}