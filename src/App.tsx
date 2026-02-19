
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { FinanceProvider } from "./contexts/FinanceContext";
import { BusinessProvider } from "./contexts/BusinessContext";
import { AppModeProviderWithSubAccount } from "./contexts/AppModeContext";
import { useAuth } from "@/hooks/useAuth";

import Index from "./pages/Index";
import Incomes from "./pages/Incomes";
import Expenses from "./pages/Expenses";
import Goals from "./pages/Goals";
import Patrimony from "./pages/Patrimony";
import Profile from "./pages/Profile";
import Subscription from "./pages/Subscription";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// New intelligent features pages
import FinancialHealth from "./pages/FinancialHealth";

// Business pages
import BusinessDashboard from "./pages/business/Dashboard";
import CashFlow from "./pages/business/CashFlow";
import Investments from "./pages/business/Investments";
import DRE from "./pages/business/DRE";
import Suppliers from "./pages/business/Suppliers";
import SubAccounts from "./pages/business/SubAccounts";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminSubscriptions from "./pages/admin/Subscriptions";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminRoute from "./components/AdminRoute";

// Create a query client with mobile-friendly config
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Componente de proteção de rotas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

// Component to handle mode-based routing
const ModeRoutes = () => {
  return (
    <TooltipProvider>
      <FinanceProvider>
        <BusinessProvider>
          <Routes>
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/receitas" element={<ProtectedRoute><Incomes /></ProtectedRoute>} />
            <Route path="/despesas" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
            <Route path="/metas" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
            <Route path="/patrimonio" element={<ProtectedRoute><Patrimony /></ProtectedRoute>} />
            <Route path="/saude-financeira" element={<ProtectedRoute><FinancialHealth /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
            
            {/* Admin routes */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin/subscriptions" element={<AdminRoute><AdminSubscriptions /></AdminRoute>} />
            <Route path="/admin/coupons" element={<AdminRoute><AdminCoupons /></AdminRoute>} />
            
            {/* Business routes */}
            <Route path="/fluxo-caixa" element={<ProtectedRoute><CashFlow /></ProtectedRoute>} />
            <Route path="/investimentos" element={<ProtectedRoute><Investments /></ProtectedRoute>} />
            <Route path="/dre" element={<ProtectedRoute><DRE /></ProtectedRoute>} />
            <Route path="/fornecedores" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
            <Route path="/business/sub-accounts" element={<ProtectedRoute><SubAccounts /></ProtectedRoute>} />
          </Routes>
        </BusinessProvider>
      </FinanceProvider>
    </TooltipProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster position="bottom-center" closeButton />
      <AppModeProviderWithSubAccount>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/*" element={<ModeRoutes />} />
          </Routes>
        </BrowserRouter>
      </AppModeProviderWithSubAccount>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;