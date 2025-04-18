import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatabaseSchemaTab } from '../components/visualization/DatabaseSchemaTab';
import { NetworkDiagramTab } from '../components/visualization/NetworkDiagramTab';
import { ComponentMapTab } from '../components/visualization/ComponentMapTab';

export default function NetworkVisualizationPage() {
  const [activeTab, setActiveTab] = useState<string>('database');
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Ven Me, Baby! Network Visualization
      </h1>
      
      <Tabs defaultValue="database" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="database">Database Schema</TabsTrigger>
          <TabsTrigger value="network">Network Diagram</TabsTrigger>
          <TabsTrigger value="components">Component Map</TabsTrigger>
        </TabsList>
        
        <TabsContent value="database" className="mt-6">
          <DatabaseSchemaTab />
        </TabsContent>
        
        <TabsContent value="network" className="mt-6">
          <NetworkDiagramTab />
        </TabsContent>
        
        <TabsContent value="components" className="mt-6">
          <ComponentMapTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}