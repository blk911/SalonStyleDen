import React, { useState, useEffect } from "react";
import { InstructionPopup } from "./InstructionPopup";
import { Button } from "./button";
import { HelpCircle } from "lucide-react";

interface ContextualHelpProps {
  id: string; // Unique ID for this help tip (used for persistence)
  title: string;
  description: string;
  steps?: string[];
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  autoShow?: boolean; // If true, will show automatically once
  persistent?: boolean; // If true, will show every time
}

// Helper to store dismissed help IDs
const localStorageKey = "vmb-help-dismissed";
const isDismissed = (id: string): boolean => {
  try {
    const stored = localStorage.getItem(localStorageKey);
    if (!stored) return false;
    const dismissed = JSON.parse(stored) as string[];
    return dismissed.includes(id);
  } catch (e) {
    console.error("Error checking dismissed help:", e);
    return false;
  }
};

const markDismissed = (id: string): void => {
  try {
    const stored = localStorage.getItem(localStorageKey);
    const dismissed = stored ? JSON.parse(stored) as string[] : [];
    if (!dismissed.includes(id)) {
      dismissed.push(id);
      localStorage.setItem(localStorageKey, JSON.stringify(dismissed));
    }
  } catch (e) {
    console.error("Error marking help dismissed:", e);
  }
};

export function ContextualHelp({
  id,
  title,
  description,
  steps = [],
  position = "top-right",
  autoShow = true,
  persistent = false,
}: ContextualHelpProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Position classes for the help button
  const positionClasses = {
    "top-right": "top-2 right-2",
    "top-left": "top-2 left-2",
    "bottom-right": "bottom-2 right-2",
    "bottom-left": "bottom-2 left-2",
  };

  // Check if we should auto-show when component mounts
  useEffect(() => {
    if (autoShow && !persistent && !isDismissed(id)) {
      setIsOpen(true);
    } else if (persistent) {
      setIsOpen(true);
    }
  }, [autoShow, persistent, id]);

  const handleClose = () => {
    setIsOpen(false);
    if (!persistent) {
      markDismissed(id);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className={`absolute ${positionClasses[position]} h-8 w-8 rounded-full bg-white/80 hover:bg-white text-pink-500 border border-pink-200 shadow-sm`}
        aria-label="Help"
      >
        <HelpCircle className="h-5 w-5" />
      </Button>

      <InstructionPopup
        title={title}
        description={description}
        isOpen={isOpen}
        onClose={handleClose}
        steps={steps}
        icon={<HelpCircle className="h-5 w-5" />}
        actionText={persistent ? "Close" : "Got it"}
      />
    </>
  );
}