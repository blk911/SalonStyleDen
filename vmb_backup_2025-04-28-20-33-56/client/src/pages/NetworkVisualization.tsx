import { useState } from "react";
import { NetworkIcon, RefreshCw, Eye, Download } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { SvgVisualizer } from "@/components/visualization/SvgVisualizer";
import { VisualizationSelector } from "@/components/visualization/VisualizationSelector";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function NetworkVisualization() {
  const { toast } = useToast();
  const [selectedVisualization, setSelectedVisualization] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  
  const handleGenerate = async (target: string, layout: string) => {
    try {
      setGenerating(true);
      
      // IMPORTANT: Use an absolute URL to avoid client-side routing
      const baseUrl = window.location.origin;
      const apiUrl = `${baseUrl}/api/madge/generate`;
      
      console.log('[VMB-DEBUG] Using API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          layout: layout,
          format: 'svg',
          focus: target,
        }),
        cache: 'no-cache',
        credentials: 'same-origin',
      });
      
      // Check if response is ok first
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Successfully got JSON data, check for success flag
      if (data && data.success) {
        // Add a cache buster to prevent browser caching
        const cacheBuster = `?cb=${Date.now()}`;
        const fullVisualizationPath = data.path.startsWith('/') 
          ? `${baseUrl}${data.path}${cacheBuster}`
          : `${baseUrl}/${data.path}${cacheBuster}`;
          
        console.log('[VMB-DEBUG] Visualization path:', fullVisualizationPath);
        
        setSelectedVisualization(fullVisualizationPath);
        
        toast({
          title: "Visualization generated",
          description: `Created ${data.filename} (${data.size}KB)`,
        });
      } else {
        // Extract error message from data if possible
        const errorMsg = data?.error || 'Unknown error';
        throw new Error(`Generation failed: ${errorMsg}`);
      }
    } catch (error: any) {
      console.error('[VMB-DEBUG] Error generating visualization:', error);
      toast({
        title: "Generation failed",
        description: error.message || 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow p-4">
        <div className="container mx-auto py-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Network Visualization</h1>
              <p className="text-gray-500">
                Explore component dependencies and relationships using Madge + Graphviz
              </p>
            </div>
            <div>
              <Link href="/admin-dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Side - Controls */}
            <div className="lg:col-span-1 space-y-6">
              <div className="border rounded-lg p-4 shadow-sm">
                <h3 className="font-medium text-lg mb-4">Saved Visualizations</h3>
                <Select
                  value={selectedVisualization?.split('?')[0] || ''}
                  onValueChange={(value) => {
                    if (value) {
                      // Add cache buster to prevent caching
                      const cacheBuster = `?cb=${Date.now()}`;
                      setSelectedVisualization(`${value}${cacheBuster}`);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a visualization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="/vmb_tools/dependency_graph/output/client_dashboard_dependencies.svg">
                      Client Dashboard
                    </SelectItem>
                    <SelectItem value="/vmb_tools/dependency_graph/output/salon_dashboard_dependencies.svg">
                      Salon Dashboard
                    </SelectItem>
                    <SelectItem value="/vmb_tools/dependency_graph/output/invitation_flow_dependencies.svg">
                      Invitation Flow
                    </SelectItem>
                    <SelectItem value="/vmb_tools/dependency_graph/output/vmb_style_options_dependencies.svg">
                      VMB Style Options
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="border rounded-lg p-4 shadow-sm">
                <h3 className="font-medium text-lg mb-4">Generate New</h3>
                <VisualizationSelector 
                  isGenerating={generating}
                  onGenerate={handleGenerate}
                />
              </div>
            </div>
            
            {/* Right Side - Visualization Display */}
            <div className="lg:col-span-3 border rounded-lg p-4 shadow-sm min-h-[600px] relative">
              <SvgVisualizer 
                url={selectedVisualization} 
                fallbackText="Select or generate a visualization to see component relationships"
              />
              
              {/* Action buttons */}
              {selectedVisualization && (
                <div className="absolute top-4 right-4 flex gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="bg-white shadow-sm"
                          onClick={() => {
                            // Open in new tab
                            window.open(selectedVisualization, '_blank');
                          }}
                        >
                          <Eye className="h-4 w-4 text-gray-600" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Open in new tab</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="bg-white shadow-sm"
                          onClick={() => {
                            // Download SVG
                            const link = document.createElement('a');
                            link.href = selectedVisualization;
                            link.download = selectedVisualization.split('/').pop()?.split('?')[0] || 'visualization.svg';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                        >
                          <Download className="h-4 w-4 text-gray-600" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Download SVG</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="bg-white shadow-sm"
                          onClick={() => {
                            // Refresh with new cache buster
                            const cacheBuster = `?cb=${Date.now()}`;
                            const svgUrl = selectedVisualization.split('?')[0] + cacheBuster;
                            setSelectedVisualization(svgUrl);
                          }}
                        >
                          <RefreshCw className="h-4 w-4 text-gray-600" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Refresh visualization</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-8 p-4 border rounded-lg shadow-sm bg-gray-50">
            <h3 className="font-medium text-lg mb-2">About Network Visualization</h3>
            <p className="text-gray-600 mb-4">
              This tool uses Madge and Graphviz to analyze and visualize the dependencies between components in the VMB application.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-white rounded border">
                <h4 className="font-medium">Client Dependencies</h4>
                <p className="text-sm text-gray-500">Shows how client-facing components are connected</p>
              </div>
              <div className="p-3 bg-white rounded border">
                <h4 className="font-medium">Salon Dependencies</h4>
                <p className="text-sm text-gray-500">Visualizes salon dashboard component relationships</p>
              </div>
              <div className="p-3 bg-white rounded border">
                <h4 className="font-medium">Invitation Flow</h4>
                <p className="text-sm text-gray-500">Maps the components involved in the invitation process</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}