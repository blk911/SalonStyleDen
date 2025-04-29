import { useState } from "react";
import { NetworkIcon, Users, RefreshCw, Eye, Download } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { SvgVisualizer } from "@/components/visualization/SvgVisualizer";
import { VisualizationSelector } from "@/components/visualization/VisualizationSelector";
import { SponsorHierarchyVisualizer } from "@/components/visualization/SponsorHierarchyVisualizer";
import { useSponsorHierarchy } from "@/components/visualization/SponsorHierarchyData";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function NetworkVisualization() {
  const { toast } = useToast();
  const [selectedVisualization, setSelectedVisualization] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'code-dependencies' | 'sponsor-hierarchy'>('code-dependencies');
  
  // Fetch sponsor hierarchy data
  const { hierarchyData, loading: loadingSponsorData } = useSponsorHierarchy();
  
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
        setActiveTab('code-dependencies');
        
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
                Explore component dependencies and sponsorship relationships
              </p>
            </div>
            <div>
              <Link href="/admin-dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </div>
          
          {/* Tabs for switching between visualization types */}
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'code-dependencies' | 'sponsor-hierarchy')}
            className="mb-6"
          >
            <TabsList className="grid grid-cols-2 w-[400px]">
              <TabsTrigger value="code-dependencies" className="flex items-center">
                <NetworkIcon className="h-4 w-4 mr-2" />
                Code Dependencies
              </TabsTrigger>
              <TabsTrigger value="sponsor-hierarchy" className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Sponsor Hierarchy
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="code-dependencies">
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
            </TabsContent>
            
            <TabsContent value="sponsor-hierarchy">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Side - Sponsors Controls */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="border rounded-lg p-4 shadow-sm">
                    <h3 className="font-medium text-lg mb-4">Sponsors</h3>
                    <Select
                      onValueChange={(value) => {
                        // This would filter or highlight specific sponsors in a full implementation
                        toast({
                          title: "Sponsor Filter",
                          description: `Filtering for ${value} (Demo Only)`,
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Sponsors" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sponsors</SelectItem>
                        <SelectItem value="vmbltd">VMB, LTD</SelectItem>
                        <SelectItem value="tiffany">Tiffany 5280 Nails Studio</SelectItem>
                        <SelectItem value="level2">Level 2 Members</SelectItem>
                        <SelectItem value="level3">Level 3 Members</SelectItem>
                        <SelectItem value="level4">Level 4 Members</SelectItem>
                        <SelectItem value="level5">Level 5 Members</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="border rounded-lg p-4 shadow-sm">
                    <h3 className="font-medium text-lg mb-4">Legend</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Building2Icon className="h-5 w-5 text-blue-600 mr-2" />
                        <span>Salon</span>
                      </div>
                      <div className="flex items-center">
                        <UserIcon className="h-5 w-5 text-blue-500 mr-2" />
                        <span>Male Client</span>
                      </div>
                      <div className="flex items-center">
                        <UserIcon className="h-5 w-5 text-pink-500 mr-2" />
                        <span>Female Client</span>
                      </div>
                      <div className="flex items-center">
                        <div className="h-5 flex items-center">
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            Pending
                          </span>
                        </div>
                        <span className="ml-2">Pending Invitation</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right Side - Sponsor Hierarchy Display */}
                <div className="lg:col-span-3 border rounded-lg p-4 shadow-sm min-h-[600px] overflow-auto">
                  <SponsorHierarchyVisualizer 
                    data={hierarchyData} 
                    loading={loadingSponsorData} 
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-8 p-4 border rounded-lg shadow-sm bg-gray-50">
            <h3 className="font-medium text-lg mb-2">About Network Visualization</h3>
            <p className="text-gray-600 mb-4">
              This tool visualizes both code dependencies using Madge+Graphviz and sponsor relationships in the VMB application.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-white rounded border">
                <h4 className="font-medium">Code Dependencies</h4>
                <p className="text-sm text-gray-500">Shows how different code components are connected</p>
              </div>
              <div className="p-3 bg-white rounded border">
                <h4 className="font-medium">Sponsor Hierarchy</h4>
                <p className="text-sm text-gray-500">Visualizes multi-level sponsor relationships in VMB</p>
              </div>
              <div className="p-3 bg-white rounded border">
                <h4 className="font-medium">Invitations</h4>
                <p className="text-sm text-gray-500">Shows both completed and pending invitation relationships</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// Simple icon components for the legend
function Building2Icon(props: React.SVGAttributes<SVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="M6 22V4c0-.55.22-1.05.59-1.41C7.05 2.22 7.55 2 8 2h8c.55 0 1.05.22 1.41.59.37.36.59.86.59 1.41v18" />
      <path d="M2 22h20" />
      <path d="M3 10h7" />
      <path d="M3 6h7" />
      <path d="M3 14h7" />
      <path d="M3 18h7" />
      <path d="M14 6h3" />
      <path d="M14 10h3" />
      <path d="M14 14h3" />
      <path d="M14 18h3" />
    </svg>
  );
}

function UserIcon(props: React.SVGAttributes<SVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}