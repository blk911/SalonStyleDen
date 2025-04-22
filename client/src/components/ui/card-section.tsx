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
}

export function CollapsibleCard({
  title,
  description,
  isOpen,
  onToggle,
  children,
  className = "mb-6",
}: CardSectionProps) {
  return (
    <Collapsible open={isOpen} className={className}>
      <Card>
        <CardHeader className="p-4 pb-0">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl font-semibold">{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            <CollapsibleTrigger asChild>
              <button onClick={onToggle} className="p-1 rounded-md hover:bg-gray-100">
                {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="p-4">
            {children}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}