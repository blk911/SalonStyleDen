import React from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

export interface InvitationStep {
  step: string;
  status: 'pending' | 'success' | 'error' | 'waiting';
  description: string;
  timestamp?: string;
}

interface InvitationStatusTrackerProps {
  steps: InvitationStep[];
  currentStep: number;
  invitationId?: number;
  hideCompleted?: boolean;
  waitForInput?: boolean;
  onContinue?: () => void;
}

export default function InvitationStatusTracker({
  steps,
  currentStep,
  invitationId,
  hideCompleted = false,
  waitForInput = false,
  onContinue
}: InvitationStatusTrackerProps) {
  // Filter steps based on the hideCompleted prop
  const visibleSteps = hideCompleted 
    ? steps.filter(step => step.status !== 'success' || steps.indexOf(step) >= currentStep - 1)
    : steps;
    
  return (
    <div className="w-full bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">Invitation Progress</h3>
        {invitationId && (
          <span className="text-xs text-gray-500">ID: {invitationId}</span>
        )}
      </div>
      
      <div className="space-y-3">
        {visibleSteps.map((step, index) => (
          <div 
            key={step.step} 
            className={`flex items-start gap-3 ${
              index < currentStep ? 'opacity-100' : 'opacity-70'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {step.status === 'success' && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              {step.status === 'error' && (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              {step.status === 'pending' && (
                <Clock className="h-5 w-5 text-amber-500" />
              )}
              {step.status === 'waiting' && (
                <AlertCircle className="h-5 w-5 text-blue-500" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between">
                <p className={`text-sm font-medium ${
                  step.status === 'success' ? 'text-green-700' :
                  step.status === 'error' ? 'text-red-700' :
                  step.status === 'waiting' ? 'text-blue-700' :
                  'text-amber-700'
                }`}>
                  {step.step}
                </p>
                {step.timestamp && (
                  <span className="text-xs text-gray-500">{step.timestamp}</span>
                )}
              </div>
              <p className="text-xs text-gray-600">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
      
      {waitForInput && currentStep < steps.length && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-xs text-blue-700 font-medium">
              Waiting for confirmation to continue
            </p>
            <button
              onClick={onContinue}
              className="text-xs px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-full"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}