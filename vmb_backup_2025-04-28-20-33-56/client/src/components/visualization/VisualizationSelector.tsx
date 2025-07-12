import { useState } from 'react';
import { Code, RefreshCw } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface VisualizationSelectorProps {
  onGenerate: (target: string, layout: string) => void;
  isGenerating: boolean;
}

export function VisualizationSelector({ onGenerate, isGenerating }: VisualizationSelectorProps) {
  const [selectedLayout, setSelectedLayout] = useState('dot');
  const [selectedTarget, setSelectedTarget] = useState('client_dashboard');
  const { toast } = useToast();
  
  const handleGenerate = () => {
    if (!selectedTarget) {
      toast({
        title: "Missing selection",
        description: "Please select a component to analyze",
        variant: "destructive",
      });
      return;
    }
    
    onGenerate(selectedTarget, selectedLayout);
  };
  
  return (
    <div className="space-y-4 p-1">
      <div>
        <label className="text-sm font-medium mb-1 block">Select Component</label>
        <Select
          value={selectedTarget}
          onValueChange={setSelectedTarget}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select component" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="client_dashboard">Client Dashboard</SelectItem>
            <SelectItem value="salon_dashboard">Salon Dashboard</SelectItem>
            <SelectItem value="invitation_flow">Invitation Flow</SelectItem>
            <SelectItem value="vmb_style_options">Style Options Engine</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 mt-1">Choose which component to analyze</p>
      </div>
      
      <div>
        <label className="text-sm font-medium mb-1 block">Layout Algorithm</label>
        <Select
          value={selectedLayout}
          onValueChange={setSelectedLayout}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select layout" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dot">Hierarchical (dot)</SelectItem>
            <SelectItem value="fdp">Force-Directed (fdp)</SelectItem>
            <SelectItem value="twopi">Radial (twopi)</SelectItem>
            <SelectItem value="circo">Circular (circo)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 mt-1">Choose visualization layout style</p>
      </div>
      
      <Button 
        variant="default" 
        className="w-full mt-4 bg-pink-600 hover:bg-pink-700"
        disabled={isGenerating}
        onClick={handleGenerate}
      >
        {isGenerating ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Code className="h-4 w-4 mr-2" />
            Generate Visualization
          </>
        )}
      </Button>
    </div>
  );
}