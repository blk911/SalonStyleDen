import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VmbStyleOptions } from "@/components/promos/VmbStyleOptions";

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

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Testing Step 3 Visibility</CardTitle>
          <div className="flex space-x-4 mt-4">
            <Button 
              onClick={() => setTestMode("normal")}
              variant={testMode === "normal" ? "default" : "outline"}
            >
              Normal Mode
            </Button>
            <Button 
              onClick={() => setTestMode("preview")}
              variant={testMode === "preview" ? "default" : "outline"}
            >
              Preview Mode
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-gray-100 rounded-md mb-4">
            <h2 className="text-lg font-semibold mb-2">Current Test Mode: {testMode}</h2>
            <p className="text-sm text-gray-600">
              {testMode === "preview" 
                ? "Preview Mode: Step 3 should be visible and expanded with a default style selected" 
                : "Normal Mode: All steps visible, but Step 3 only shows after selecting a style"}
            </p>
          </div>

          <div className="border p-4 rounded-md">
            <VmbStyleOptions 
              services={mockSalonServices}
              salonId={42}
              recipientData={mockRecipientData}
              salonInitiated={true}
              isPreviewMode={testMode === "preview"}
              shouldPrefill={testMode === "preview"}
              initialStyleId={testMode === "preview" ? 1 : undefined}
              onSelectionComplete={(selection) => {
                console.log("Style selected in test page:", selection);
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}