import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ExternalLink, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const visualizations = [
  { 
    id: "server", 
    name: "Server Dependencies", 
    path: "/server-dependencies.svg",
    textPath: "/visualizations/server-dependencies.txt" 
  },
  { 
    id: "client", 
    name: "Client Dependencies", 
    path: "/client-dependencies.svg",
    textPath: "/visualizations/client-dependencies.txt"
  },
  { 
    id: "shared", 
    name: "Shared Schema Dependencies", 
    path: "/shared-dependencies.svg",
    textPath: "/visualizations/shared-dependencies.txt"
  },
  { 
    id: "salon-id", 
    name: "Salon ID Dependencies", 
    path: "/salon-id-dependencies.svg",
    textPath: "/visualizations/salon-id-dependencies.txt"
  }
];

export default function DependencyVisualizer() {
  const [activeTab, setActiveTab] = useState<string>("server");
  const [loadStates, setLoadStates] = useState<Record<string, { isLoading: boolean; error: string | null }>>({
    server: { isLoading: true, error: null },
    client: { isLoading: true, error: null },
    shared: { isLoading: true, error: null },
    "salon-id": { isLoading: true, error: null }
  });
  const [textReports, setTextReports] = useState<Record<string, { content: string; isLoading: boolean; error: string | null }>>({
    server: { content: "", isLoading: true, error: null },
    client: { content: "", isLoading: true, error: null },
    shared: { content: "", isLoading: true, error: null },
    "salon-id": { content: "", isLoading: true, error: null }
  });
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Load text reports on component mount
  useEffect(() => {
    visualizations.forEach(vis => {
      fetch(vis.textPath)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to load text report (${response.status})`);
          }
          return response.text();
        })
        .then(text => {
          setTextReports(prev => ({
            ...prev,
            [vis.id]: { content: text, isLoading: false, error: null }
          }));
        })
        .catch(error => {
          setTextReports(prev => ({
            ...prev,
            [vis.id]: { content: "", isLoading: false, error: error.message }
          }));
        });
    });
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleImageLoad = (id: string) => {
    setLoadStates(prev => ({
      ...prev,
      [id]: { isLoading: false, error: null }
    }));
  };

  const handleImageError = (id: string) => {
    setLoadStates(prev => ({
      ...prev,
      [id]: { isLoading: false, error: "Failed to load the visualization. The file might not exist or there could be a server issue." }
    }));
  };

  // Format markdown-like text for display
  const formatTextReport = (text: string) => {
    return text
      .split("\n")
      .map((line, index) => {
        if (line.startsWith("# ")) {
          return <h1 key={index} className="text-2xl font-bold mt-6 mb-3">{line.replace("# ", "")}</h1>;
        } else if (line.startsWith("## ")) {
          return <h2 key={index} className="text-xl font-semibold mt-4 mb-2">{line.replace("## ", "")}</h2>;
        } else if (line.startsWith("- ")) {
          return <li key={index} className="ml-4 mb-1">{line.replace("- ", "")}</li>;
        } else if (line.startsWith("1. ") || line.match(/^\d+\.\s/)) {
          return <li key={index} className="ml-4 mb-1 list-decimal">{line.replace(/^\d+\.\s/, "")}</li>;
        } else if (line.trim() === "") {
          return <br key={index} />;
        } else {
          return <p key={index} className="mb-2">{line}</p>;
        }
      });
  };

  // Directly embed SVG as an image with error handling
  const renderVisualization = (vis: typeof visualizations[0]) => {
    const { isLoading, error } = loadStates[vis.id];
    const textReport = textReports[vis.id];

    if (error) {
      return (
        <div className="space-y-4">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error loading visualization</AlertTitle>
            <AlertDescription>
              {error}
              <div className="mt-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    // Reset loading state and try again
                    setLoadStates(prev => ({
                      ...prev,
                      [vis.id]: { isLoading: true, error: null }
                    }));
                    
                    // Force reload by changing the img src with a timestamp
                    const timestamp = new Date().getTime();
                    const img = document.getElementById(`img-${vis.id}`) as HTMLImageElement;
                    if (img) {
                      img.src = `${vis.path}?t=${timestamp}`;
                    }
                  }}
                >
                  Try Again
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="ml-2"
                  onClick={() => window.open(vis.path, '_blank')}
                >
                  Open Directly <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
          
          {/* Show text report as fallback */}
          {!textReport.isLoading && !textReport.error && (
            <div className="p-4 border rounded-md bg-gray-50">
              <div className="flex items-center mb-3">
                <FileText className="h-5 w-5 mr-2 text-blue-500" />
                <h3 className="font-medium">Text Report</h3>
              </div>
              <div className="text-sm">
                {formatTextReport(textReport.content)}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="relative w-full h-full">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        )}
        <img
          id={`img-${vis.id}`}
          src={vis.path}
          alt={`${vis.id} Visualization`}
          className="w-full h-full object-contain"
          style={{ display: isLoading ? "none" : "block" }}
          onLoad={() => handleImageLoad(vis.id)}
          onError={() => handleImageError(vis.id)}
        />
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Dependency Visualizations</CardTitle>
          <CardDescription>
            Visual representations of code dependencies to help identify and fix relationships between components
          </CardDescription>
        </CardHeader>

        <Tabs defaultValue="server" value={activeTab} onValueChange={setActiveTab}>
          <div className="px-6">
            <TabsList className="w-full">
              {visualizations.map((vis) => (
                <TabsTrigger key={vis.id} value={vis.id} className="flex-1">
                  {vis.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <Separator className="my-4" />

          <CardContent>
            {visualizations.map((vis) => (
              <TabsContent key={vis.id} value={vis.id} className="relative">
                <div 
                  style={{ 
                    width: "100%", 
                    height: windowSize.height - 300,
                    overflow: "auto", 
                    border: "1px solid #e2e8f0", 
                    borderRadius: "0.5rem"
                  }}
                >
                  {activeTab === vis.id && renderVisualization(vis)}
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>Path: <code>{vis.path}</code></p>
                </div>
              </TabsContent>
            ))}
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}