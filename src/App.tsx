
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import CatalogPage from "./pages/CatalogPage";
import ContentGeneratorPage from "./pages/ContentGeneratorPage";
import PricerPage from "./pages/PricerPage";
import SalesPage from "./pages/SalesPage";
import SettingsPage from "./pages/SettingsPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import AdminPage from "./pages/AdminPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/content-generator" element={<ContentGeneratorPage />} />
            <Route path="/pricer" element={<PricerPage />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/integrations" element={<IntegrationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/admin" element={<AdminPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
