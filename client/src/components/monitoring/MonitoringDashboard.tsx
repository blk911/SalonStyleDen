/**
 * Monitoring Dashboard
 * 
 * Displays real-time monitoring information for testing and debugging,
 * including keystrokes, API requests, and general activity.
 */
import React, { useState } from 'react';
import { useMonitoring } from '@/contexts/MonitoringContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Play as PlayIcon,
  Square as StopIcon,
  Trash as TrashIcon,
  Download as DownloadIcon,
  X as XIcon
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function MonitoringDashboard() {
  const {
    isMonitoringEnabled,
    enableMonitoring,
    disableMonitoring,
    keystrokeHistory,
    apiHistory,
    activityHistory,
    clearHistory
  } = useMonitoring();

  const [isExpanded, setIsExpanded] = useState(false);

  // Format timestamp for display
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  // Generate a downloadable JSON report
  const downloadReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      keystrokes: keystrokeHistory,
      apiCalls: apiHistory,
      activity: activityHistory
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vmb-monitoring-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-auto shadow-lg border-2 border-pink-200">
          <CardHeader className="p-2 pb-0 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">VMB Testing Monitor</CardTitle>
            <div className="flex gap-1">
              {isMonitoringEnabled ? (
                <Button variant="destructive" size="icon" className="h-6 w-6" onClick={disableMonitoring}>
                  <StopIcon className="h-3 w-3" />
                </Button>
              ) : (
                <Button variant="default" size="icon" className="h-6 w-6 bg-pink-500 hover:bg-pink-700" onClick={enableMonitoring}>
                  <PlayIcon className="h-3 w-3" />
                </Button>
              )}
              <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => setIsExpanded(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-maximize-2"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-2 pt-0">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Status: {isMonitoringEnabled ? (
                  <Badge variant="default" className="bg-green-500 text-[10px]">Active</Badge>
                ) : (
                  <Badge variant="destructive" className="bg-gray-400 text-[10px]">Inactive</Badge>
                )}
              </span>
              <span className="text-xs text-gray-500">
                Events: {activityHistory.length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={(e) => {
      if (e.target === e.currentTarget) setIsExpanded(false);
    }}>
      <div className="fixed inset-4 bg-white rounded-lg shadow-xl border flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">VMB Testing Monitor</h2>
          <div className="flex items-center space-x-2">
            <div className="flex items-center gap-2">
              <Switch
                id="monitoring-switch"
                checked={isMonitoringEnabled}
                onCheckedChange={(checked) => checked ? enableMonitoring() : disableMonitoring()}
              />
              <Label htmlFor="monitoring-switch">
                {isMonitoringEnabled ? 'Monitoring Active' : 'Monitoring Inactive'}
              </Label>
            </div>
            <Button variant="outline" size="sm" onClick={clearHistory}>
              <TrashIcon className="h-4 w-4 mr-1" /> Clear
            </Button>
            <Button variant="outline" size="sm" onClick={downloadReport}>
              <DownloadIcon className="h-4 w-4 mr-1" /> Export
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsExpanded(false)}>
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="activity" className="flex-1 flex flex-col">
          <div className="px-4 border-b">
            <TabsList>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="keystrokes">Keystrokes</TabsTrigger>
              <TabsTrigger value="api">API Requests</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="activity" className="flex-1 p-4 overflow-hidden">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle>Activity Events</CardTitle>
                <CardDescription>User interactions and system events</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Time</TableHead>
                        <TableHead className="w-[100px]">Type</TableHead>
                        <TableHead className="w-[180px]">Component</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activityHistory.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                            No activity recorded yet. Enable monitoring and interact with the application.
                          </TableCell>
                        </TableRow>
                      ) : (
                        activityHistory.slice().reverse().map((event, i) => (
                          <TableRow key={`activity-${i}`}>
                            <TableCell className="text-xs py-1">{formatTimestamp(event.timestamp)}</TableCell>
                            <TableCell className="py-1">
                              <Badge 
                                className={`
                                  ${event.type === 'error' ? 'bg-red-500' : ''}
                                  ${event.type === 'api' ? 'bg-blue-500' : ''}
                                  ${event.type === 'navigation' ? 'bg-purple-500' : ''}
                                  ${event.type === 'click' ? 'bg-green-500' : ''}
                                  ${event.type === 'submit' ? 'bg-amber-500' : ''}
                                  ${event.type === 'render' ? 'bg-slate-500' : ''}
                                  ${event.type === 'keystroke' ? 'bg-emerald-500' : ''}
                                  text-[10px]
                                `}
                              >
                                {event.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs py-1 font-mono">{event.component}</TableCell>
                            <TableCell className="text-xs py-1 font-mono overflow-hidden text-ellipsis">
                              {JSON.stringify(event.details).substring(0, 80)}
                              {JSON.stringify(event.details).length > 80 ? '...' : ''}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="keystrokes" className="flex-1 p-4 overflow-hidden">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle>Keystroke Monitor</CardTitle>
                <CardDescription>Input field keystrokes and changes</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Time</TableHead>
                        <TableHead className="w-[180px]">Component</TableHead>
                        <TableHead className="w-[120px]">Field</TableHead>
                        <TableHead className="w-[80px]">Key</TableHead>
                        <TableHead>Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {keystrokeHistory.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                            No keystrokes recorded yet. Type in any input field.
                          </TableCell>
                        </TableRow>
                      ) : (
                        keystrokeHistory.slice().reverse().map((event, i) => (
                          <TableRow key={`keystroke-${i}`}>
                            <TableCell className="text-xs py-1">{formatTimestamp(event.timestamp)}</TableCell>
                            <TableCell className="text-xs py-1 font-mono">{event.component}</TableCell>
                            <TableCell className="text-xs py-1">{event.fieldName}</TableCell>
                            <TableCell className="text-xs py-1 font-mono">{event.keyCode}</TableCell>
                            <TableCell className="text-xs py-1 overflow-hidden text-ellipsis">
                              {event.value.substring(0, 30)}
                              {event.value.length > 30 ? '...' : ''}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="flex-1 p-4 overflow-hidden">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle>API Request Monitor</CardTitle>
                <CardDescription>Backend requests and responses</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Time</TableHead>
                        <TableHead className="w-[80px]">Method</TableHead>
                        <TableHead className="w-[180px]">Endpoint</TableHead>
                        <TableHead className="w-[80px]">Status</TableHead>
                        <TableHead className="w-[80px]">Duration</TableHead>
                        <TableHead>Request/Response</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiHistory.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                            No API requests recorded yet. Interact with the application.
                          </TableCell>
                        </TableRow>
                      ) : (
                        apiHistory.slice().reverse().map((event, i) => (
                          <TableRow key={`api-${i}`}>
                            <TableCell className="text-xs py-1">{formatTimestamp(event.timestamp)}</TableCell>
                            <TableCell className="text-xs py-1">
                              <Badge 
                                className={`
                                  ${event.method === 'GET' ? 'bg-blue-500' : ''}
                                  ${event.method === 'POST' ? 'bg-green-500' : ''}
                                  ${event.method === 'PUT' ? 'bg-amber-500' : ''}
                                  ${event.method === 'PATCH' ? 'bg-amber-500' : ''}
                                  ${event.method === 'DELETE' ? 'bg-red-500' : ''}
                                  text-[10px]
                                `}
                              >
                                {event.method}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs py-1 font-mono">{event.endpoint}</TableCell>
                            <TableCell className="text-xs py-1">
                              {event.status ? (
                                <Badge 
                                  className={`
                                    ${event.status >= 200 && event.status < 300 ? 'bg-green-500' : ''}
                                    ${event.status >= 300 && event.status < 400 ? 'bg-blue-500' : ''}
                                    ${event.status >= 400 ? 'bg-red-500' : ''}
                                    text-[10px]
                                  `}
                                >
                                  {event.status}
                                </Badge>
                              ) : (
                                event.error ? (
                                  <Badge variant="destructive" className="text-[10px]">
                                    Error
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px]">
                                    Pending
                                  </Badge>
                                )
                              )}
                            </TableCell>
                            <TableCell className="text-xs py-1">
                              {event.duration ? `${event.duration}ms` : '-'}
                            </TableCell>
                            <TableCell className="text-xs py-1 font-mono overflow-hidden text-ellipsis">
                              <div className="flex flex-col space-y-1">
                                <div>
                                  {JSON.stringify(event.requestData).substring(0, 40)}
                                  {JSON.stringify(event.requestData).length > 40 ? '...' : ''}
                                </div>
                                {event.responseData && (
                                  <div className="text-gray-500">
                                    {JSON.stringify(event.responseData).substring(0, 40)}
                                    {JSON.stringify(event.responseData).length > 40 ? '...' : ''}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}