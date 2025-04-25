import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VmbStyleOptions } from "@/components/promos/VmbStyleOptions";
import { useToast } from "@/hooks/use-toast";

// Mock data for testing
const mockSalonServices = [
  {
    id: 1,
    name: "French Tips / Touch-Up",
    price: 62,
    gifUrl: "/assets/french-tips.png",
    duration: 30,
    featured: true,
    description: "Classic white tips or quick polish refresh."
  },
  {
    id: 2,
    name: "Luxe Gel Manicure",
    price: 55,
    gifUrl: "/assets/gel-manicure.png",
    duration: 45,
    featured: true,
    description: "Glossy, chip-free color with lasting shine."
  },
  {
    id: 3,
    name: "Sculpted Acrylics",
    price: 70,
    gifUrl: "/assets/sculpted-acrylics.png",
    duration: 60,
    featured: true,
    description: "Custom-shaped acrylics for bold length."
  }
];

const mockRecipientData = {
  name: "Test Client",
  phone: "555-123-4567",
  sponsor: "Test Salon"
};

export default function TestFinalStep3() {
  const [testMode, setTestMode] = useState("normal");
  const [forceStep3, setForceStep3] = useState(false);
  const { toast } = useToast();

  // Force a confirmed style value for Step 3 testing
  const preSelectedStyle = testMode === "preview" || forceStep3 
    ? mockSalonServices[0] 
    : undefined;
    
  // Debug styling function
  const debugLog = (message: string) => {
    console.log(`[TEST PAGE] ${message}`);
    toast({
      title: "Debug Info",
      description: message,
      variant: "default"
    });
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Testing Step 3 Visibility</CardTitle>
          <div className="flex space-x-4 mt-4">
            <Button 
              onClick={() => {
                setTestMode("normal");
                debugLog("Normal Mode Active");
              }}
              variant={testMode === "normal" ? "default" : "outline"}
            >
              Normal Mode
            </Button>
            <Button 
              onClick={() => {
                setTestMode("preview");
                debugLog("Preview Mode Active");
              }}
              variant={testMode === "preview" ? "default" : "outline"}
            >
              Preview Mode
            </Button>
            <Button 
              onClick={() => {
                setForceStep3(!forceStep3);
                debugLog(forceStep3 ? "Force Step 3 Disabled" : "Force Step 3 Enabled");
              }}
              variant={forceStep3 ? "default" : "destructive"}
            >
              {forceStep3 ? "Disable Force Step 3" : "Force Step 3"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-gray-100 rounded-md mb-4">
            <h2 className="text-lg font-semibold mb-2">
              Current Test Mode: {testMode} {forceStep3 ? "(Step 3 Forced)" : ""}
            </h2>
            <p className="text-sm text-gray-600">
              {testMode === "preview" 
                ? "Preview Mode: Step 3 should be visible and expanded with a default style selected" 
                : "Normal Mode: All steps visible, but Step 3 only shows after selecting a style"}
            </p>
            {forceStep3 && (
              <p className="text-sm text-red-600 mt-2">
                Force Step 3 is enabled - this sets a pre-selected style to ensure Step 3 displays
              </p>
            )}
            {preSelectedStyle && (
              <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                <p className="text-xs font-medium">
                  Pre-selected style: {preSelectedStyle.name} (ID: {preSelectedStyle.id})
                </p>
              </div>
            )}
          </div>

          <div className="border p-4 rounded-md">
            <VmbStyleOptions 
              services={mockSalonServices}
              salonId={42}
              recipientData={mockRecipientData}
              salonInitiated={true}
              isPreviewMode={testMode === "preview"}
              shouldPrefill={testMode === "preview"}
              initialStyleId={testMode === "preview" || forceStep3 ? 1 : undefined}
              onSelectionComplete={(selection) => {
                debugLog(`Style selected: ${JSON.stringify(selection)}`);
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}