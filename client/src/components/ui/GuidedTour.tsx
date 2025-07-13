import React, { useState, useEffect } from "react";
import { InstructionPopup } from "./InstructionPopup";
import { InfoIcon, ArrowRightCircle, CheckCircle2 } from "lucide-react";
import { safeParse } from "@shared/utils/json";

// Define the structure of a tour step
interface TourStep {
  id: string;
  title: string;
  description: string;
  steps?: string[];
  icon?: React.ReactNode;
  buttonText?: string;
}

interface GuidedTourProps {
  steps: TourStep[];
  onComplete?: () => void;
  onStepChange?: (stepIndex: number) => void;
  initialStep?: number;
  isEnabled?: boolean;
  tourId: string; // Unique ID for this tour to track in localStorage
}

export function GuidedTour({
  steps,
  onComplete,
  onStepChange,
  initialStep = 0,
  isEnabled = true,
  tourId,
}: GuidedTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStep);
  const [isOpen, setIsOpen] = useState(false);
  const [hasCompletedTour, setHasCompletedTour] = useState(false);

  // Check if the tour has been completed before
  useEffect(() => {
    try {
      const completedTours = localStorage.getItem("vmb-completed-tours");
      if (completedTours) {
        const parsed = safeParse<string[]>(completedTours) ?? [];
        if (parsed.includes(tourId)) {
          setHasCompletedTour(true);
        }
      }
    } catch (e) {
      console.error("Error checking completed tours:", e);
    }
  }, [tourId]);

  // Open the first step automatically
  useEffect(() => {
    if (isEnabled && !hasCompletedTour && steps.length > 0) {
      setIsOpen(true);
    }
  }, [isEnabled, hasCompletedTour, steps]);

  // Mark the tour as completed in localStorage
  const markTourAsCompleted = () => {
    try {
      const completedTours = localStorage.getItem("vmb-completed-tours");
      const parsed = completedTours ? safeParse<string[]>(completedTours) ?? [] : [];
      if (!parsed.includes(tourId)) {
        parsed.push(tourId);
        localStorage.setItem("vmb-completed-tours", JSON.stringify(parsed));
      }
      setHasCompletedTour(true);
    } catch (e) {
      console.error("Error marking tour as completed:", e);
    }
  };

  const handleNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      if (onStepChange) {
        onStepChange(nextIndex);
      }
    } else {
      // This is the last step
      setIsOpen(false);
      if (onComplete) {
        onComplete();
      }
      markTourAsCompleted();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isEnabled || hasCompletedTour || steps.length === 0) {
    return null;
  }

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;

  return (
    <InstructionPopup
      title={currentStep.title}
      description={currentStep.description}
      isOpen={isOpen}
      onClose={handleClose}
      steps={currentStep.steps}
      icon={currentStep.icon || <InfoIcon className="h-5 w-5" />}
      actionText={
        isLastStep
          ? currentStep.buttonText || "Finish"
          : currentStep.buttonText || "Next"
      }
      onAction={handleNextStep}
      className={isLastStep ? "border-t-4 border-green-500" : ""}
    />
  );
}