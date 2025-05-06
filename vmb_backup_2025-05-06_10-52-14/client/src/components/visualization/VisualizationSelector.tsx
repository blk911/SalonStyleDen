import { useState } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';

interface VisualizationSelectorProps {
  isGenerating: boolean;
  onGenerate: (target: string, layout: string) => void;
}

export function VisualizationSelector({ isGenerating, onGenerate }: VisualizationSelectorProps) {
  const [selectedTarget, setSelectedTarget] = useState<string>('client_dashboard');
  const [selectedLayout, setSelectedLayout] = useState<string>('dot');
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Focus Area</label>
        <Select 
          value={selectedTarget} 
          onValueChange={setSelectedTarget}
          disabled={isGenerating}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select target" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="client_dashboard">Client Dashboard</SelectItem>
            <SelectItem value="salon_dashboard">Salon Dashboard</SelectItem>
            <SelectItem value="invitation_flow">Invitation Flow</SelectItem>
            <SelectItem value="vmb_style_options">VMB Style Options</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Layout Algorithm</label>
        <Select 
          value={selectedLayout} 
          onValueChange={setSelectedLayout}
          disabled={isGenerating}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select layout" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dot">DOT (Hierarchical)</SelectItem>
            <SelectItem value="fdp">FDP (Force-Directed)</SelectItem>
            <SelectItem value="twopi">TWOPI (Radial)</SelectItem>
            <SelectItem value="circo">CIRCO (Circular)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Button 
        className="w-full mt-4 bg-pink-600 hover:bg-pink-700"
        onClick={() => onGenerate(selectedTarget, selectedLayout)}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          'Generate Visualization'
        )}
      </Button>
    </div>
  );
}