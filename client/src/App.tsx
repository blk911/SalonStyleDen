import React, { ErrorInfo } from 'react';
import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { logError } from "@/lib/monitoring";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import SalonDashboard from "@/pages/SalonDashboard";
import SalonPublicPage from "@/pages/SalonPublicPage";
import ClientDashboard from "@/pages/ClientDashboard";
import SalonsPage from "@/pages/SalonsPage";
import PromosPage from "@/pages/PromosPage";
import Sitemap from "@/pages/Sitemap";
import AdminDashboard from "@/pages/AdminDashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/salon/:id" component={SalonPublicPage} />
      <Route path="/dashboard/salon/:id" component={SalonDashboard} />
      <Route path="/client/:id" component={ClientDashboard} />
      <Route path="/salons" component={SalonsPage} />
      <Route path="/promos" component={PromosPage} />
      <Route path="/sitemap" component={Sitemap} />
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
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
