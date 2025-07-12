import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { InstructionPopup } from "@/components/ui/InstructionPopup";
import { InfoIcon, CheckCircleIcon } from "lucide-react";

export function InstructionPopupExample() {
  const [isInstructionOpen, setIsInstructionOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  
  // Example instruction steps
  const steps = [
    "Select your preferred nail style from the options provided.",
    "Enter the recipient's name and contact information.",
    "Personalize your message to make it special.",
    "Click 'Send Invitation' to complete the process."
  ];
  
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold">Instruction Popup Examples</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-md font-medium mb-2">Basic Instructions Popup</h3>
          <Button 
            onClick={() => setIsInstructionOpen(true)}
            className="bg-pink-500 hover:bg-pink-600"
          >
            <InfoIcon className="h-4 w-4 mr-2" />
            Show Instructions
          </Button>
          
          <InstructionPopup
            title="How to Send an Invitation"
            description="Follow these simple steps to send a VMB invitation to your friend."
            isOpen={isInstructionOpen}
            onClose={() => setIsInstructionOpen(false)}
            steps={steps}
            icon={<InfoIcon className="h-5 w-5" />}
          />
        </div>
        
        <div>
          <h3 className="text-md font-medium mb-2">Success Confirmation Popup</h3>
          <Button 
            onClick={() => setIsSuccessOpen(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircleIcon className="h-4 w-4 mr-2" />
            Show Success
          </Button>
          
          <InstructionPopup
            title="Invitation Sent Successfully!"
            description="Your invitation has been sent. Here's what happens next:"
            isOpen={isSuccessOpen}
            onClose={() => setIsSuccessOpen(false)}
            steps={[
              "Your friend will receive your invitation shortly.",
              "Once they accept, you'll get a notification.",
              "You can check the status in your dashboard anytime."
            ]}
            icon={<CheckCircleIcon className="h-5 w-5 text-green-500" />}
            className="border-t-4 border-green-500"
            actionText="Back to Dashboard"
          />
        </div>
      </div>
    </div>
  );
}