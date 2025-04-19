import React, { ErrorInfo, useEffect } from 'react';
import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { logError, initMonitoring } from "@/lib/monitoring";
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
import InvitationPage from "@/pages/InvitationPage";
import ClientRegistrationPage from "@/pages/ClientRegistrationPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/salon/:id" component={SalonPublicPage} />
      <Route path="/dashboard/salon/:id" component={SalonDashboard} />
      <Route path="/client/register" component={ClientRegistrationPage} />
      <Route path="/client/:id" component={ClientDashboard} />
      <Route path="/clients" component={ClientsPage} />
      <Route path="/salons" component={SalonsPage} />
      <Route path="/invitation/:hash" component={InvitationPage} />
      {/* Temporarily hiding the Promos page */}
      {/* <Route path="/promos" component={PromosPage} /> */}
      <Route path="/sitemap" component={Sitemap} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/test-image/:id" component={TestImagePage} />
      <Route path="/network-visualization" component={NetworkVisualization} />
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
  // Initialize error monitoring on app startup
  useEffect(() => {
    initMonitoring();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router />
        <Toaster />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
