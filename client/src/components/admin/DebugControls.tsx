/**
 * Debug Controls Component
 * 
 * Provides UI controls for toggling debug features like console logging
 */
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bug, Terminal, RotateCcw, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  shouldLog, 
  toggleConsoleMessages,
  shouldShowMonitoringDashboard,
  toggleMonitoringDashboard,
  getDebugConfig
} from '@/lib/debug-config';

export function DebugControls() {
  const [consoleMessagesEnabled, setConsoleMessagesEnabled] = useState(false);
  const [monitoringEnabled, setMonitoringEnabled] = useState(false);
  
  // Load initial state
  useEffect(() => {
    setConsoleMessagesEnabled(shouldLog());
    setMonitoringEnabled(shouldShowMonitoringDashboard());
  }, []);
  
  // Handle toggle for console messages
  const handleToggleConsole = () => {
    const newState = toggleConsoleMessages();
    setConsoleMessagesEnabled(newState);
  };
  
  // Handle toggle for monitoring dashboard
  const handleToggleMonitoring = () => {
    const newState = toggleMonitoringDashboard();
    setMonitoringEnabled(newState);
  };

  // Handle backup
  const [isBackingUp, setIsBackingUp] = useState(false);
  const { toast } = useToast();
  
  const handleBackup = () => {
    const timestamp = new Date().toISOString()
      .replace(/:/g, '-')
      .replace(/\..+/, '')
      .replace('T', '_');
    
    setIsBackingUp(true);
    fetch(`/api/admin/backup?timestamp=${timestamp}`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          toast({
            title: "Backup Created",
            description: `Backup created: ${timestamp}`,
            variant: "default"
          });
          console.log(`Backup created with timestamp: ${timestamp}`);
        } else {
          toast({
            title: "Backup Failed",
            description: data.message || "Failed to create backup",
            variant: "destructive"
          });
          console.error('Failed to create backup:', data.message);
        }
      })
      .catch(error => {
        toast({
          title: "Backup Error",
          description: error.message || "An error occurred creating backup",
          variant: "destructive"
        });
        console.error('Error creating backup:', error);
      })
      .finally(() => {
        setIsBackingUp(false);
      });
  };
  
  return (
    <Card className="border border-stone-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Bug className="h-5 w-5 text-pink-500" />
          Development Controls
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal className="h-4 w-4 text-stone-500" />
              <Label htmlFor="console-toggle" className="font-medium">
                VMB Testing Console
              </Label>
            </div>
            <Switch
              id="console-toggle"
              checked={consoleMessagesEnabled}
              onCheckedChange={handleToggleConsole}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-stone-500" />
              <Label htmlFor="monitoring-toggle" className="font-medium">
                VMB Testing Monitor
              </Label>
            </div>
            <Switch
              id="monitoring-toggle"
              checked={monitoringEnabled}
              onCheckedChange={handleToggleMonitoring}
            />
          </div>
          
          <div className="pt-2">
            <Button 
              variant="outline" 
              size="sm"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleBackup}
              disabled={isBackingUp}
            >
              <RotateCcw className={`h-4 w-4 ${isBackingUp ? 'animate-spin' : ''}`} />
              {isBackingUp ? 'Creating Backup...' : 'Create Timestamped Backup'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default DebugControls;