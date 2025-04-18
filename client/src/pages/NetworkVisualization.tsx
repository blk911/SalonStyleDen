import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  Treemap,
  Tooltip,
  Sankey,
  Scatter,
  ScatterChart,
  ZAxis,
  XAxis,
  YAxis,
  Cell
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/queryClient';

// Type definitions for the visualization data
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

// Colors for different groups/types
const COLORS = {
  client: '#8884d8',
  salon: '#82ca9d',
  service: '#ffc658',
  invitation: '#ff8042',
  endpoint: '#0088fe',
  component: '#00C49F',
  database: '#FFBB28'
};

// Network visualization component
export default function NetworkVisualization() {
  const [activeTab, setActiveTab] = useState('database');
  const [dbData, setDbData] = useState<NetworkData>({ nodes: [], links: [] });
  const [apiData, setApiData] = useState<NetworkData>({ nodes: [], links: [] });
  const [componentData, setComponentData] = useState<NetworkData>({ nodes: [], links: [] });
  const [forceUpdate, setForceUpdate] = useState<number>(0);

  // Fetch schema data for database visualization
  const { data: schemaData, isLoading: schemaLoading } = useQuery({
    queryKey: ['/api/schema'],
    retry: false,
    enabled: activeTab === 'database',
  });

  // Fetch API endpoints data
  const { data: endpointsData, isLoading: endpointsLoading } = useQuery({
    queryKey: ['/api/endpoints'],
    retry: false,
    enabled: activeTab === 'api',
  });

  // Generate database schema visualization
  useEffect(() => {
    if (schemaData) {
      const nodes: Node[] = [];
      const links: Link[] = [];

      // If we have real schema data, use it
      if (schemaData.tables) {
        Object.entries(schemaData.tables).forEach(([tableName, table]: [string, any]) => {
          // Add table node
          nodes.push({
            name: tableName,
            id: tableName,
            group: 'table',
            size: 400,
            type: 'database'
          });

          // Add column nodes
          Object.entries(table.columns || {}).forEach(([columnName, column]: [string, any]) => {
            const nodeId = `${tableName}.${columnName}`;
            nodes.push({
              name: columnName,
              id: nodeId,
              group: 'column',
              size: 100,
              type: 'database'
            });

            // Link column to table
            links.push({
              source: tableName,
              target: nodeId,
              value: 1,
              type: 'has'
            });
          });

          // Add relations if available
          if (table.relations) {
            Object.entries(table.relations).forEach(([relationName, relation]: [string, any]) => {
              const targetTable = relation.references;
              
              links.push({
                source: tableName,
                target: targetTable,
                value: 2,
                type: 'references'
              });
            });
          }
        });
      } else {
        // Fallback: Generate a visualization of our known schema
        const tables = [
          { name: 'clients', id: 'clients', fields: ['id', 'name', 'phone', 'email', 'salonId'] },
          { name: 'salons', id: 'salons', fields: ['id', 'name', 'address', 'phone', 'email'] },
          { name: 'services', id: 'services', fields: ['id', 'name', 'price', 'salonId'] },
          { name: 'invitations', id: 'invitations', fields: ['id', 'salonId', 'clientId', 'code'] },
          { name: 'style_selections', id: 'style_selections', fields: ['id', 'clientId', 'serviceId'] },
          { name: 'activity_logs', id: 'activity_logs', fields: ['id', 'type', 'description'] }
        ];

        const relationships = [
          { source: 'clients', target: 'salons', type: 'belongs_to' },
          { source: 'services', target: 'salons', type: 'belongs_to' },
          { source: 'invitations', target: 'salons', type: 'belongs_to' },
          { source: 'invitations', target: 'clients', type: 'belongs_to' },
          { source: 'style_selections', target: 'clients', type: 'belongs_to' },
          { source: 'style_selections', target: 'services', type: 'belongs_to' }
        ];

        // Add all tables
        tables.forEach(table => {
          nodes.push({
            name: table.name,
            id: table.id,
            group: 'table',
            size: 400,
            type: 'database'
          });

          // Add fields for each table
          table.fields.forEach(field => {
            const fieldId = `${table.id}.${field}`;
            nodes.push({
              name: field,
              id: fieldId,
              group: 'field',
              size: 100,
              type: 'database'
            });

            links.push({
              source: table.id,
              target: fieldId,
              value: 1,
              type: 'has_field'
            });
          });
        });

        // Add relationships
        relationships.forEach(rel => {
          links.push({
            source: rel.source,
            target: rel.target,
            value: 2,
            type: rel.type
          });
        });
      }

      setDbData({ nodes, links });
    }
  }, [schemaData, forceUpdate]);

  // Generate API endpoint visualization
  useEffect(() => {
    if (activeTab === 'api') {
      // If we have real endpoint data, use it
      if (endpointsData) {
        setApiData({
          nodes: endpointsData.nodes || [],
          links: endpointsData.links || []
        });
      } else {
        // Otherwise generate from known API structure
        const nodes: Node[] = [];
        const links: Link[] = [];

        // API endpoints
        const endpoints = [
          { path: '/api/health', method: 'GET', connects: [] },
          { path: '/api/status', method: 'GET', connects: [] },
          { path: '/api/salons', method: 'GET', connects: ['salons'] },
          { path: '/api/salons', method: 'POST', connects: ['salons'] },
          { path: '/api/salons/:id', method: 'GET', connects: ['salons'] },
          { path: '/api/salons/:id', method: 'PUT', connects: ['salons'] },
          { path: '/api/salons/:id/services', method: 'POST', connects: ['salons', 'services'] },
          { path: '/api/salons/:id/promos', method: 'POST', connects: ['salons'] },
          { path: '/api/clients', method: 'GET', connects: ['clients'] },
          { path: '/api/clients', method: 'POST', connects: ['clients'] },
          { path: '/api/clients/:id', method: 'GET', connects: ['clients'] },
          { path: '/api/clients/:id', method: 'PUT', connects: ['clients'] },
          { path: '/api/invitations', method: 'POST', connects: ['invitations', 'clients', 'salons'] },
          { path: '/api/invitations', method: 'GET', connects: ['invitations'] },
          { path: '/api/invitations/:id', method: 'GET', connects: ['invitations'] },
          { path: '/api/clients/:clientId/style-selections', method: 'POST', connects: ['clients', 'style_selections'] },
          { path: '/api/clients/:clientId/style-selections', method: 'GET', connects: ['clients', 'style_selections'] },
          { path: '/api/activity-logs', method: 'POST', connects: ['activity_logs'] },
          { path: '/api/activity-logs', method: 'GET', connects: ['activity_logs'] }
        ];

        // Add API endpoints as nodes
        endpoints.forEach(endpoint => {
          const id = `${endpoint.method}-${endpoint.path}`;
          nodes.push({
            name: `${endpoint.method} ${endpoint.path}`,
            id,
            group: 'endpoint',
            size: 200,
            type: 'endpoint'
          });

          // Connect endpoints to database tables they use
          endpoint.connects.forEach(table => {
            links.push({
              source: id,
              target: table,
              value: 1,
              type: 'uses'
            });
          });
        });

        // Add database tables as nodes
        ['clients', 'salons', 'services', 'invitations', 'style_selections', 'activity_logs'].forEach(table => {
          nodes.push({
            name: table,
            id: table,
            group: 'table',
            size: 300,
            type: 'database'
          });
        });

        setApiData({ nodes, links });
      }
    }
  }, [endpointsData, activeTab, forceUpdate]);

  // Generate component dependency visualization
  useEffect(() => {
    if (activeTab === 'component') {
      // Generate visualization of React component dependencies
      const nodes: Node[] = [];
      const links: Link[] = [];

      // Pages
      const pages = [
        'Home', 'ClientForm', 'SalonForm', 'ClientDashboard', 'SalonDashboard', 
        'AdminDashboard', 'SalonPublicPage', 'NetworkVisualization'
      ];

      // Components
      const components = [
        'Navbar', 'Footer', 'BrandName', 'ContactValidationDialog', 'PromoCodeDialog',
        'ClientInvitation', 'VmbStyleOptions', 'EditableClientInfo', 'EditableSalonInfo',
        'EditablePromo', 'WeeklySchedule', 'RecentVmbInvitations', 'ServiceCard'
      ];

      // Add all pages as nodes
      pages.forEach(page => {
        nodes.push({
          name: page,
          id: page,
          group: 'page',
          size: 300,
          type: 'component'
        });
      });

      // Add all components as nodes
      components.forEach(component => {
        nodes.push({
          name: component,
          id: component,
          group: 'component',
          size: 200,
          type: 'component'
        });
      });

      // Component dependencies
      const dependencies = [
        { source: 'Home', target: 'Navbar' },
        { source: 'Home', target: 'Footer' },
        { source: 'ClientForm', target: 'Navbar' },
        { source: 'ClientForm', target: 'Footer' },
        { source: 'ClientForm', target: 'ContactValidationDialog' },
        { source: 'SalonForm', target: 'Navbar' },
        { source: 'SalonForm', target: 'Footer' },
        { source: 'ClientDashboard', target: 'Navbar' },
        { source: 'ClientDashboard', target: 'EditableClientInfo' },
        { source: 'ClientDashboard', target: 'VmbStyleOptions' },
        { source: 'SalonDashboard', target: 'Navbar' },
        { source: 'SalonDashboard', target: 'EditableSalonInfo' },
        { source: 'SalonDashboard', target: 'EditablePromo' },
        { source: 'SalonDashboard', target: 'WeeklySchedule' },
        { source: 'SalonDashboard', target: 'ClientInvitation' },
        { source: 'AdminDashboard', target: 'Navbar' },
        { source: 'AdminDashboard', target: 'RecentVmbInvitations' },
        { source: 'SalonPublicPage', target: 'ServiceCard' },
        { source: 'SalonPublicPage', target: 'BrandName' },
        { source: 'Navbar', target: 'BrandName' },
        { source: 'Footer', target: 'BrandName' },
        { source: 'ContactValidationDialog', target: 'BrandName' },
        { source: 'ContactValidationDialog', target: 'PromoCodeDialog' }
      ];

      // Add all dependencies
      dependencies.forEach(dep => {
        links.push({
          source: dep.source,
          target: dep.target,
          value: 1,
          type: 'uses'
        });
      });

      setComponentData({ nodes, links });
    }
  }, [activeTab, forceUpdate]);

  // Function to generate network graph visualization
  const renderNetworkGraph = (data: NetworkData) => {
    if (data.nodes.length === 0) {
      return (
        <div className="flex items-center justify-center h-96">
          <p className="text-lg text-gray-500">Loading data or no data available...</p>
        </div>
      );
    }
    
    // Format data for Sankey diagram
    const sankeyData = {
      nodes: data.nodes.map((node) => ({
        name: node.name,
        color: COLORS[node.type as keyof typeof COLORS] || '#8884d8'
      })),
      links: data.links.map((link) => {
        // Find index of source and target in nodes array
        const sourceIndex = data.nodes.findIndex(node => node.id === link.source);
        const targetIndex = data.nodes.findIndex(node => node.id === link.target);
        
        return {
          source: sourceIndex,
          target: targetIndex,
          value: link.value
        };
      })
    };

    // Filter out invalid links (where source or target index is -1)
    sankeyData.links = sankeyData.links.filter(
      link => link.source !== -1 && link.target !== -1
    );

    return (
      <div className="w-full h-[600px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <Sankey
            data={sankeyData}
            nodePadding={50}
            nodeWidth={10}
            link={{ stroke: '#999' }}
            node={({ payload, index }) => ({
              fill: payload.color,
            })}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <Tooltip 
              formatter={(value, name) => [value, name]} 
              labelFormatter={(value) => value}
            />
          </Sankey>
        </ResponsiveContainer>
      </div>
    );
  };

  // Helper function to refresh visualizations
  const refreshData = () => {
    setForceUpdate(prev => prev + 1);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Ven Me, Baby! Network Visualization</h1>
      
      <div className="flex justify-end mb-4">
        <Button onClick={refreshData} variant="outline">
          Refresh Data
        </Button>
      </div>
      
      <Tabs
        defaultValue="database"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 w-full mb-4">
          <TabsTrigger value="database">Database Schema</TabsTrigger>
          <TabsTrigger value="api">API Endpoints</TabsTrigger>
          <TabsTrigger value="component">Component Dependencies</TabsTrigger>
        </TabsList>
        
        <Card>
          <CardHeader>
            <CardTitle>
              {activeTab === 'database' && 'Database Schema Relationships'}
              {activeTab === 'api' && 'API Endpoint Dependencies'}
              {activeTab === 'component' && 'React Component Dependencies'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TabsContent value="database" className="mt-0">
              {schemaLoading ? (
                <div className="h-96 flex items-center justify-center">
                  <p>Loading database schema...</p>
                </div>
              ) : (
                renderNetworkGraph(dbData)
              )}
            </TabsContent>
            
            <TabsContent value="api" className="mt-0">
              {endpointsLoading ? (
                <div className="h-96 flex items-center justify-center">
                  <p>Loading API endpoints...</p>
                </div>
              ) : (
                renderNetworkGraph(apiData)
              )}
            </TabsContent>
            
            <TabsContent value="component" className="mt-0">
              {renderNetworkGraph(componentData)}
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
      
      <div className="mt-8 bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(COLORS).map(([key, color]) => (
            <div key={key} className="flex items-center">
              <div className="w-4 h-4 mr-2" style={{ backgroundColor: color }} />
              <span className="text-sm capitalize">{key}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}