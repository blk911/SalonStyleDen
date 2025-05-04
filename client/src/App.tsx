import React, { ErrorInfo, useEffect, useState } from 'react';
import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { logError, initMonitoring } from "@/lib/monitoring";
import { MonitoringProvider } from "@/contexts/MonitoringContext";
import { StatusProvider } from "@/contexts/StatusContext";
import MonitoringDashboard from "@/components/monitoring/MonitoringDashboard";
import { shouldShowMonitoringDashboard } from "@/lib/debug-config";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import SalonDashboard from "@/pages/SalonDashboard";
import SalonPublicPage from "@/pages/SalonPublicPage";
import ClientDashboard from "@/pages/ClientDashboard";
import ClientsPage from "@/pages/ClientsPage";
import SalonsPage from "@/pages/SalonsPage";
import PromosPage from "@/pages/PromosPage";
import Sitemap from "@/pages/Sitemap";
import AdminDashboard from "@/pages/AdminDashboard";
import TestImagePage from "@/pages/TestImagePage";
import NetworkVisualization from "@/pages/NetworkVisualization";
import MadgeVisualizationPage from "@/pages/MadgeVisualizationPage";
import InvitationPage from "@/pages/InvitationPage";
import InvitationPreview from "@/pages/InvitationPreview";
import ClientRegistrationPage from "@/pages/ClientRegistrationPage";
import SalonRegistrationPage from "@/pages/SalonRegistrationPage";
import CompleteInvitationPage from "@/pages/CompleteInvitationPage";
import TestFinalStep3 from "@/pages/TestFinalStep3";

function Router() {
  return (
    <Switch>
      {/* Redirect homepage to Clients page for marketing test */}
      <Route path="/" component={ClientsPage} />
      <Route path="/home" component={Home} /> {/* Keep old Home available at /home */}
      <Route path="/salon/:id" component={SalonPublicPage} />
      <Route path="/dashboard/salon/:id" component={SalonDashboard} />
      <Route path="/client/register" component={ClientRegistrationPage} />
      <Route path="/client-registration" component={ClientRegistrationPage} />
      <Route path="/register-client" component={ClientRegistrationPage} />
      <Route path="/salon-registration" component={SalonRegistrationPage} />
      <Route path="/register-salon" component={SalonRegistrationPage} />
      <Route path="/client/:id" component={ClientDashboard} />
      {/* Ensure the registration route doesn't collide with the ClientDashboard's :id param */}
      {/* Clients route kept for direct linking */}
      <Route path="/clients" component={ClientsPage} />
      <Route path="/salons" component={SalonsPage} />
      <Route path="/invitation/:hash" component={InvitationPage} />
      <Route path="/invitation-preview/:hash" component={InvitationPreview} />
      <Route path="/invitations/by-hash/:hash" component={InvitationPage} />
      <Route path="/invitations/:id" component={InvitationPreview} />
      <Route path="/complete-invitation/:id" component={CompleteInvitationPage} />
      {/* Unhiding all routes as requested */}
      <Route path="/promos" component={PromosPage} />
      <Route path="/sitemap" component={Sitemap} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/test-image/:id" component={TestImagePage} />
      <Route path="/network-visualization" component={NetworkVisualization} />
      <Route path="/madge-visualization" component={MadgeVisualizationPage} />
      <Route path="/testfinalstep3" component={TestFinalStep3} />
      <Route component={NotFound} />
    </Switch>
  );
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logError('frontend', error);
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red' }}>
          <h2>Something went wrong! 🚨</h2>
          <pre>{this.state.error?.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  // State to track visibility of monitoring dashboard
  const [showMonitoring, setShowMonitoring] = useState(shouldShowMonitoringDashboard());
  
  // Initialize error monitoring on app startup
  useEffect(() => {
    initMonitoring();
    
    // Update monitoring visibility when debug config changes
    const intervalId = setInterval(() => {
      setShowMonitoring(shouldShowMonitoringDashboard());
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <StatusProvider>
          <MonitoringProvider>
            <Router />
            {/* Only render MonitoringDashboard when debug config enables it */}
            {showMonitoring && <MonitoringDashboard />}
            <Toaster />
          </MonitoringProvider>
        </StatusProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
