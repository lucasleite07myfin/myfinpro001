
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FinanceProvider } from "./contexts/FinanceContext";
import { BusinessProvider } from "./contexts/BusinessContext";
import { AppModeProvider, useAppMode } from "./contexts/AppModeContext";

import Welcome from "./pages/Welcome";
import Index from "./pages/Index";
import Incomes from "./pages/Incomes";
import Expenses from "./pages/Expenses";
import Goals from "./pages/Goals";
import Patrimony from "./pages/Patrimony";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Register from "./pages/Register";

// New intelligent features pages
import Alerts from "./pages/Alerts";
import FinancialHealth from "./pages/FinancialHealth";

// Business pages
import BusinessDashboard from "./pages/business/Dashboard";
import CashFlow from "./pages/business/CashFlow";
import Investments from "./pages/business/Investments";
import DRE from "./pages/business/DRE";
import Suppliers from "./pages/business/Suppliers";

// Create a query client with mobile-friendly config
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Component to handle mode-based routing
const ModeRoutes = () => {
  const { mode } = useAppMode();

  return (
    <TooltipProvider>
      {mode === 'business' ? (
        <BusinessProvider>
          <Routes>
            <Route path="/" element={<BusinessDashboard />} />
            <Route path="/receitas" element={<Incomes />} />
            <Route path="/despesas" element={<Expenses />} />
            <Route path="/metas" element={<Goals />} />
            <Route path="/patrimonio" element={<Patrimony />} />
            <Route path="/fluxo-caixa" element={<CashFlow />} />
            <Route path="/investimentos" element={<Investments />} />
            <Route path="/dre" element={<DRE />} />
            <Route path="/fornecedores" element={<Suppliers />} />
            <Route path="/alertas" element={<Alerts />} />
            <Route path="/saude-financeira" element={<FinancialHealth />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BusinessProvider>
      ) : (
        <FinanceProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/receitas" element={<Incomes />} />
            <Route path="/despesas" element={<Expenses />} />
            <Route path="/metas" element={<Goals />} />
            <Route path="/patrimonio" element={<Patrimony />} />
            <Route path="/alertas" element={<Alerts />} />
            <Route path="/saude-financeira" element={<FinancialHealth />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </FinanceProvider>
      )}
    </TooltipProvider>
  );
};

// Wrap the Welcome component with both providers
const WelcomeWithProviders = () => (
  <BusinessProvider>
    <FinanceProvider>
      <TooltipProvider>
        <Welcome />
      </TooltipProvider>
    </FinanceProvider>
  </BusinessProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="bottom-center" closeButton />
      <AppModeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/register" element={<Register />} />
            <Route path="/welcome" element={<WelcomeWithProviders />} />
            <Route path="/*" element={<ModeRoutes />} />
          </Routes>
        </BrowserRouter>
      </AppModeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
