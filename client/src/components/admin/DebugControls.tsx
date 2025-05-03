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
import { Bug, Terminal, RotateCcw } from "lucide-react";
import { 
  shouldLog, 
  toggleConsoleMessages,
  getDebugConfig
} from '@/lib/debug-config';

export function DebugControls() {
  const [consoleMessagesEnabled, setConsoleMessagesEnabled] = useState(false);
  
  // Load initial state
  useEffect(() => {
    setConsoleMessagesEnabled(shouldLog());
  }, []);
  
  // Handle toggle
  const handleToggleConsole = () => {
    const newState = toggleConsoleMessages();
    setConsoleMessagesEnabled(newState);
  };

  // Handle backup
  const handleBackup = () => {
    const timestamp = new Date().toISOString()
      .replace(/:/g, '-')
      .replace(/\..+/, '')
      .replace('T', '_');
      
    fetch(`/api/admin/backup?timestamp=${timestamp}`)
      .then(response => {
        if (response.ok) {
          console.log(`Backup created with timestamp: ${timestamp}`);
        } else {
          console.error('Failed to create backup');
        }
      })
      .catch(error => {
        console.error('Error creating backup:', error);
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
          
          <div className="pt-2">
            <Button 
              variant="outline" 
              size="sm"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleBackup}
            >
              <RotateCcw className="h-4 w-4" />
              Create Timestamped Backup
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default DebugControls;