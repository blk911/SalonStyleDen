import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  Tooltip,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define interfaces for network data
interface Node {
  name: string;
  id: string;
  group?: string;
  size?: number;
  type?: string;
  value?: number;
}

interface Link {
  source: string;
  target: string;
  value: number;
  type?: string;
}

interface NetworkData {
  nodes: Node[];
  links: Link[];
}

export default function NetworkVisualization() {
  // Define schema data interface to match expected API response
  interface SchemaData {
    tables: Record<string, {
      name: string;
      columns: Record<string, { name: string; type: string }>;
      relations?: Record<string, { references: string }>;
    }>;
  }
  
  const [schemaData, setSchemaData] = useState<SchemaData>({ tables: {} });
  const [networkData, setNetworkData] = useState<NetworkData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('database');

  // Fetch data from the API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch schema data
        const schemaResponse = await fetch('/api/schema');
        if (!schemaResponse.ok) {
          throw new Error(`Failed to fetch schema data: ${schemaResponse.statusText}`);
        }
        const schemaJson = await schemaResponse.json();
        setSchemaData(schemaJson);

        // Fetch network data
        const networkResponse = await fetch('/api/endpoints');
        if (!networkResponse.ok) {
          throw new Error(`Failed to fetch network data: ${networkResponse.statusText}`);
        }
        const networkJson = await networkResponse.json();
        setNetworkData(networkJson);

        setLoading(false);
      } catch (err) {
        setError((err as Error).message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Function to render the database schema visualization
  const renderDatabaseSchema = () => {
    if (!schemaData.tables || Object.keys(schemaData.tables).length === 0) {
      return <div className="text-center p-8">No schema data available</div>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(schemaData.tables).map(([tableName, tableInfo]: [string, any]) => (
          <Card key={tableName} className="shadow-sm">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="text-lg text-blue-700">{tableInfo.name}</CardTitle>
              <CardDescription>Database Table</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="overflow-auto max-h-64">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Column</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tableInfo.columns && Object.entries(tableInfo.columns).map(([columnName, columnInfo]: [string, any]) => (
                      <tr key={columnName} className="text-sm">
                        <td className="px-3 py-2 whitespace-nowrap font-medium">{columnInfo.name}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-500">{columnInfo.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {tableInfo.relations && (
                <div className="mt-4 p-2 bg-blue-50 rounded">
                  <h4 className="text-sm font-medium text-blue-700 mb-1">Relations:</h4>
                  <ul className="text-sm">
                    {Object.entries(tableInfo.relations).map(([field, relation]: [string, any]) => (
                      <li key={field} className="text-blue-600">
                        <span className="font-medium">{field}</span> → {relation.references}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Function to render the network diagram
  const renderNetworkGraph = (data: NetworkData) => {
    if (!data.nodes || !data.links || data.nodes.length === 0) {
      return <div className="text-center p-8">No network data available</div>;
    }

    // Prepare connection data for visualization
    // We'll focus on displaying the component distributions instead of the complex network diagram

    // Group nodes by type for radar chart
    const groupCounts: { [key: string]: number } = {};
    data.nodes.forEach((node) => {
      const group = node.group || 'unknown';
      groupCounts[group] = (groupCounts[group] || 0) + 1;
    });

    const radarData = Object.entries(groupCounts).map(([name, value]) => ({
      subject: name,
      A: value,
      fullMark: Math.max(...Object.values(groupCounts))
    }));

    // Color map for different node types
    const nodeColors: { [key: string]: string } = {
      table: '#8884d8',
      endpoint: '#82ca9d',
      page: '#ffc658',
      unknown: '#ff7300'
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 shadow-sm">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle>Component Frequency Analysis</CardTitle>
            <CardDescription>
              Distribution of component types in the application
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-[600px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={Object.entries(groupCounts).map(([name, value]) => ({
                    name,
                    count: value
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="count" 
                    name="Component Count" 
                    fill="#8884d8" 
                    background={{ fill: '#eee' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle>Component Distribution</CardTitle>
            <CardDescription>
              Distribution of different component types
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={150} width={500} height={500} data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis />
                  <Radar
                    name="Components"
                    dataKey="A"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-3 shadow-sm">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle>Network Statistics</CardTitle>
            <CardDescription>
              Summary of system components and connections
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-700">{data.nodes.filter(n => n.group === 'table').length}</div>
                <div className="text-sm text-blue-600">Database Tables</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-700">{data.nodes.filter(n => n.group === 'endpoint').length}</div>
                <div className="text-sm text-green-600">API Endpoints</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-yellow-700">{data.nodes.filter(n => n.group === 'page').length}</div>
                <div className="text-sm text-yellow-600">Frontend Pages</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-purple-700">{data.links.length}</div>
                <div className="text-sm text-purple-600">Connections</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center p-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-gray-600">Loading network visualization...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Ven Me, Baby! Network Visualization
      </h1>
      
      <Tabs defaultValue="database" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="database">Database Schema</TabsTrigger>
          <TabsTrigger value="network">Network Diagram</TabsTrigger>
        </TabsList>
        <TabsContent value="database" className="mt-6">
          {renderDatabaseSchema()}
        </TabsContent>
        <TabsContent value="network" className="mt-6">
          {renderNetworkGraph(networkData)}
        </TabsContent>
      </Tabs>
    </div>
  );
}