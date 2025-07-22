import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import PerformanceDashboard from '../components/dashboard/PerformanceDashboard';
import PageHeader from '../components/layout/PageHeader';
import { IoSpeedometer } from 'react-icons/io5';
import { useQuery } from '@tanstack/react-query';

const PerformancePage: React.FC = () => {
  // Get user permissions to check if user can access this page
  const { data: currentUser } = useQuery({
    queryKey: ['/api/me'],
  });
  
  const isAdmin = (currentUser as any)?.role === 'admin' || process.env.NODE_ENV === 'development';
  
  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-300">
          <CardHeader>
            <CardTitle className="text-xl text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You do not have permission to access the system performance dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 md:p-6">
      <PageHeader 
        title="System Performance" 
        description="Monitor the health and performance of all platform components"
        icon={<IoSpeedometer className="h-8 w-8 text-primary" />}
      />
      
      <Tabs defaultValue="dashboard" className="w-full mt-6">
        <TabsList className="grid w-full md:w-auto grid-cols-1 md:grid-cols-3">
          <TabsTrigger value="dashboard">Live Dashboard</TabsTrigger>
          <TabsTrigger value="history">Performance History</TabsTrigger>
          <TabsTrigger value="alerts">System Alerts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="mt-6">
          <PerformanceDashboard />
        </TabsContent>
        
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Historical performance data will be available in future updates.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="alerts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                System alerts and notifications will be available in future updates.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformancePage;
