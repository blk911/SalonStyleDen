import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import SalonDashboard from "@/pages/SalonDashboard";
import ClientDashboard from "@/pages/ClientDashboard";
import SalonsPage from "@/pages/SalonsPage";
import PromosPage from "@/pages/PromosPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/salon/:id" component={SalonDashboard} />
      <Route path="/client/:id" component={ClientDashboard} />
      <Route path="/salons" component={SalonsPage} />
      <Route path="/promos" component={PromosPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
