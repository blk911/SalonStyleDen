import React from 'react';
import { Button, ButtonProps } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

interface AdminActionButtonProps extends Omit<ButtonProps, 'children'> {
  icon?: LucideIcon;
  text: string;
  compact?: boolean;
  iconSize?: number;
}

export function AdminActionButton({
  icon: Icon,
  text,
  compact = false,
  iconSize = 4,
  className,
  ...props
}: AdminActionButtonProps) {
  return (
    <Button
      {...props}
      className={`${className || ''} ${
        compact ? 'px-2 py-1 h-8' : ''
      }`}
    >
      {Icon && <Icon className={`h-${iconSize} w-${iconSize} ${text ? 'mr-2' : ''}`} />}
      {text}
    </Button>
  );
}

export function ActionGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center space-x-2 justify-end">
      {children}
    </div>
  );
}