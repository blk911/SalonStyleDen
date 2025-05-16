import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

// Component types
interface ComponentStatus {
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  responseTime: number;
  uptime: number;
  lastChecked: string;
}

interface SystemMetrics {
  cpu: number;
  memory: number;
  storage: number;
  requests: number;
  errors: number;
  componentStatuses: ComponentStatus[];
}

const PerformanceDashboard: React.FC = () => {
  const { toast } = useToast();
  const [animatedMetrics, setAnimatedMetrics] = useState<SystemMetrics | null>(null);
  
  // Fetch system performance metrics
  const { data: metrics, isLoading, error } = useQuery<SystemMetrics>({
    queryKey: ['/api/system/metrics'],
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });
  
  // Animation effect for metrics changes
  useEffect(() => {
    if (metrics) {
      setAnimatedMetrics(metrics);
    }
  }, [metrics]);
  
  // Show error toast if metrics fetch fails
  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading performance metrics",
        description: "Please try again or contact support if the issue persists.",
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
  // Helper function to determine status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'warning':
        return 'bg-amber-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  // Helper function to determine response time quality
  const getResponseQuality = (time: number) => {
    if (time < 300) return 'Excellent';
    if (time < 1000) return 'Good';
    if (time < 3000) return 'Fair';
    return 'Poor';
  };
  
  // Placeholder data for development/testing
  const placeholderMetrics: SystemMetrics = {
    cpu: 45,
    memory: 62,
    storage: 38,
    requests: 128,
    errors: 3,
    componentStatuses: [
      {
        name: 'API Service',
        status: 'healthy',
        responseTime: 215,
        uptime: 99.98,
        lastChecked: new Date().toISOString()
      },
      {
        name: 'Database',
        status: 'healthy',
        responseTime: 175,
        uptime: 99.95,
        lastChecked: new Date().toISOString()
      },
      {
        name: 'Authentication',
        status: 'healthy',
        responseTime: 312,
        uptime: 99.9,
        lastChecked: new Date().toISOString()
      },
      {
        name: 'Gift System',
        status: 'healthy',
        responseTime: 280,
        uptime: 99.8,
        lastChecked: new Date().toISOString()
      },
      {
        name: 'Invitation System',
        status: 'warning',
        responseTime: 1250,
        uptime: 98.5,
        lastChecked: new Date().toISOString()
      }
    ]
  };
  
  // Use real data or placeholder during development
  const displayMetrics = metrics || animatedMetrics || placeholderMetrics;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">System Performance</h2>
        <Badge variant="outline" className="px-3 py-1">
          <span className="mr-2 h-2 w-2 rounded-full bg-green-500 inline-block"></span>
          Live Monitoring
        </Badge>
      </div>
      
      {/* System Resource Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ResourceCard 
          title="CPU Usage" 
          value={displayMetrics.cpu} 
          isLoading={isLoading} 
          icon="cpu"
          colorClass={displayMetrics.cpu > 80 ? "text-red-500" : displayMetrics.cpu > 60 ? "text-amber-500" : "text-green-500"}
        />
        
        <ResourceCard 
          title="Memory Usage" 
          value={displayMetrics.memory} 
          isLoading={isLoading} 
          icon="database"
          colorClass={displayMetrics.memory > 80 ? "text-red-500" : displayMetrics.memory > 60 ? "text-amber-500" : "text-green-500"}
        />
        
        <ResourceCard 
          title="Storage Usage" 
          value={displayMetrics.storage} 
          isLoading={isLoading} 
          icon="hard-drive"
          colorClass={displayMetrics.storage > 80 ? "text-red-500" : displayMetrics.storage > 60 ? "text-amber-500" : "text-green-500"}
        />
        
        <RequestsCard 
          requests={displayMetrics.requests} 
          errors={displayMetrics.errors} 
          isLoading={isLoading}
        />
      </div>
      
      {/* Component Health Status */}
      <Card>
        <CardHeader>
          <CardTitle>Component Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            <AnimatePresence>
              {isLoading ? (
                <Skeleton className="w-full h-[300px] rounded-md" />
              ) : (
                displayMetrics.componentStatuses.map((component) => (
                  <motion.div 
                    key={component.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <div className={`h-3 w-3 rounded-full ${getStatusColor(component.status)}`}></div>
                        <span className="font-medium">{component.name}</span>
                      </div>
                      <Badge variant={component.status === 'healthy' ? 'default' : component.status === 'warning' ? 'outline' : 'destructive'}>
                        {component.status.charAt(0).toUpperCase() + component.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>Response: {component.responseTime}ms ({getResponseQuality(component.responseTime)})</span>
                      <span>•</span>
                      <span>Uptime: {component.uptime}%</span>
                    </div>
                    
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(component.responseTime > 2000 ? 100 : component.responseTime / 20)}%` }}
                      className={`h-1.5 rounded-full ${
                        component.responseTime < 300 ? 'bg-green-500' : 
                        component.responseTime < 1000 ? 'bg-blue-500' : 
                        component.responseTime < 2000 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                    />
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Resource Card Sub-component
interface ResourceCardProps {
  title: string;
  value: number;
  isLoading: boolean;
  icon: string;
  colorClass: string;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ title, value, isLoading, icon, colorClass }) => {
  return (
    <Card>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-16" />
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-500">{title}</span>
              <span className={`text-sm font-medium ${colorClass}`}>{value}%</span>
            </div>
            <div className="relative">
              <Progress value={value} className="h-2" />
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="mt-3"
              >
                <span className={colorClass + " text-2xl font-bold"}>{value}%</span>
              </motion.div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

// Requests Card Sub-component
interface RequestsCardProps {
  requests: number;
  errors: number;
  isLoading: boolean;
}

const RequestsCard: React.FC<RequestsCardProps> = ({ requests, errors, isLoading }) => {
  const errorRate = (errors / requests) * 100;
  
  return (
    <Card>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-16" />
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-500">API Requests</span>
              <Badge variant={errorRate > 5 ? "destructive" : errorRate > 1 ? "outline" : "default"} className="px-2 py-1">
                {errorRate.toFixed(1)}% Error Rate
              </Badge>
            </div>
            <div className="flex items-end gap-2">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="text-2xl font-bold">{requests}</span>
                <span className="text-gray-500 ml-1">requests</span>
              </motion.div>
              <span className="text-gray-400 mx-1">|</span>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <span className={errorRate > 5 ? "text-red-500 font-bold" : "text-gray-700"}>{errors}</span>
                <span className="text-gray-500 ml-1">errors</span>
              </motion.div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PerformanceDashboard;