/**
 * Madge Network Visualization Page
 * 
 * This page displays network visualizations generated with Madge and Graphviz
 * for visualizing the relationships between different components.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, RefreshCw, Code, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type VisualizationFile = {
  id: string;
  name: string;
  path: string;
  layout: string;
  date: string;
  size: number;
};

export default function MadgeVisualizationPage() {
  const [files, setFiles] = useState<VisualizationFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState('dot');
  const [selectedFile, setSelectedFile] = useState<VisualizationFile | null>(null);
  const [focusPath, setFocusPath] = useState('');
  const { toast } = useToast();

  // Fetch visualization files on component mount
  useEffect(() => {
    fetchVisualizationFiles();
  }, []);

  // Fetch list of available visualization files
  const fetchVisualizationFiles = async () => {
    setLoading(true);
    try {
      // For demo purposes, let's simulate files - in reality, this would call an API
      // to get the actual generated visualizations
      const demoFiles: VisualizationFile[] = [
        {
          id: '1',
          name: 'Full Network (DOT)',
          path: '/visualizations/vmb-network-dot.svg',
          layout: 'dot',
          date: new Date().toLocaleDateString(),
          size: 250
        },
        {
          id: '2',
          name: 'Full Network (FDP)',
          path: '/visualizations/vmb-network-fdp.svg',
          layout: 'fdp',
          date: new Date().toLocaleDateString(),
          size: 245
        },
        {
          id: '3',
          name: 'Components Only',
          path: '/visualizations/vmb-components.svg',
          layout: 'dot',
          date: new Date().toLocaleDateString(),
          size: 180
        }
      ];
      
      setFiles(demoFiles);
      if (demoFiles.length > 0) {
        setSelectedFile(demoFiles[0]);
      }
    } catch (error) {
      console.error('Error fetching visualization files:', error);
      toast({
        title: 'Error',
        description: 'Failed to load visualization files.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate a new visualization
  const generateVisualization = async () => {
    setGenerating(true);
    try {
      // In a real implementation, this would call a server endpoint to generate the visualization
      toast({
        title: 'Generating Visualization',
        description: `Running Madge with ${selectedLayout} layout...`,
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'Visualization Complete',
        description: 'Network visualization has been generated successfully.',
      });
      
      // Refresh the file list
      await fetchVisualizationFiles();
    } catch (error) {
      console.error('Error generating visualization:', error);
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate visualization. See console for details.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">VMB Network Visualization</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel - Configuration */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Visualization Config</CardTitle>
              <CardDescription>Generate new network visualizations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Layout Algorithm</label>
                  <Select 
                    value={selectedLayout} 
                    onValueChange={setSelectedLayout}
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
                
                <div>
                  <label className="block text-sm font-medium mb-1">Focus Path (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., client/src/components"
                    className="w-full px-3 py-2 border rounded-md"
                    value={focusPath}
                    onChange={(e) => setFocusPath(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to analyze the entire project
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={generateVisualization} 
                disabled={generating}
                className="w-full"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Generate Network Map
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Available Visualizations</CardTitle>
              <CardDescription>Previously generated network maps</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No visualizations found
                </div>
              ) : (
                <div className="space-y-2">
                  {files.map(file => (
                    <div 
                      key={file.id}
                      className={`p-3 border rounded-md cursor-pointer transition-colors ${
                        selectedFile?.id === file.id 
                          ? 'bg-primary/10 border-primary/30' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedFile(file)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{file.name}</div>
                          <div className="text-xs text-gray-500">{file.date}</div>
                        </div>
                        <Badge variant="outline">{file.layout}</Badge>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {file.size} KB
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Right panel - Visualization View */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{selectedFile?.name || 'No Visualization Selected'}</CardTitle>
                  <CardDescription>
                    {selectedFile 
                      ? `Generated using ${selectedFile.layout.toUpperCase()} layout (${selectedFile.date})` 
                      : 'Select or generate a visualization to view'
                    }
                  </CardDescription>
                </div>
                
                {selectedFile && (
                  <div className="flex space-x-2">
                    <Button variant="outline" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Code className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="flex-grow overflow-auto bg-gray-50 rounded-md p-0">
              {selectedFile ? (
                <div className="p-4 flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-gray-500 mb-2">Visualization would be displayed here</p>
                    <p className="text-sm text-gray-400">
                      In a production environment, this would display the SVG from {selectedFile.path}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-6">
                    <RefreshCw className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-700">No Visualization Selected</h3>
                    <p className="text-gray-500 mt-1">
                      Select a visualization from the list or generate a new one
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}