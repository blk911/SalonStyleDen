import React from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CardSectionProps {
  title: string;
  description?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode; // Added to support action buttons in the card header
}

export function CollapsibleCard({
  title,
  description,
  isOpen,
  onToggle,
  children,
  className = "mb-[3px]", // Set margin to exactly 3px
  action,
}: CardSectionProps) {
  return (
    <Collapsible open={isOpen} className={className}>
      <Card className="shadow-sm">
        <CardHeader className="p-3 pb-0"> {/* Reduced padding from p-4 to p-3 */}
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg font-semibold">{title}</CardTitle> {/* Reduced font size from text-xl to text-lg */}
              {description && <CardDescription className="text-sm">{description}</CardDescription>}
            </div>
            <div className="flex items-center gap-2"> {/* Reduced gap from gap-3 to gap-2 */}
              {action && (
                <div className="mr-1">{action}</div>
              )}
              <CollapsibleTrigger asChild>
                <button onClick={onToggle} className="p-1 rounded-md hover:bg-gray-100">
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />} {/* Reduced icon size from h-5 to h-4 */}
                </button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="p-3 pt-2"> {/* Reduced padding and top padding */}
            {children}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}