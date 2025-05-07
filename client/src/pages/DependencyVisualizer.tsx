import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const visualizations = [
  { id: "server", name: "Server Dependencies", path: "/server-dependencies.svg" },
  { id: "client", name: "Client Dependencies", path: "/client-dependencies.svg" },
  { id: "shared", name: "Shared Schema Dependencies", path: "/shared-dependencies.svg" },
  { id: "salon-id", name: "Salon ID Dependencies", path: "/salon-id-dependencies.svg" }
];

export default function DependencyVisualizer() {
  const [activeTab, setActiveTab] = useState<string>("server");
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

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
                  {activeTab === vis.id && (
                    <>
                      {!imageLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                        </div>
                      )}
                      <iframe 
                        src={vis.path}
                        style={{ 
                          width: "100%", 
                          height: "100%", 
                          border: "none",
                          display: imageLoaded ? "block" : "none"
                        }}
                        onLoad={() => setImageLoaded(true)}
                      />
                    </>
                  )}
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