import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Claim from "./pages/Claim";
import Convert from "./pages/Convert";
import Dashboard from "./pages/Dashboard";
import Deposit from "./pages/Deposit";
import History from "./pages/History";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import QRPay from "./pages/QRPay";
import Register from "./pages/Register";
import Send from "./pages/Send";
import Withdraw from "./pages/Withdraw";
import KYC from "./pages/profile/KYC";
import Notifications from "./pages/profile/Notifications";
import PaymentMethods from "./pages/profile/PaymentMethods";
import PersonalInformation from "./pages/profile/PersonalInformation";
import Security from "./pages/profile/Security";
import Support from "./pages/profile/Support";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/send" element={<Send />} />
          <Route path="/deposit" element={<Deposit />} />
          <Route path="/history" element={<History />} />
          <Route path="/claim/:id?" element={<Claim />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/kyc" element={<KYC />} />
          <Route path="/profile/personal" element={<PersonalInformation />} />
          <Route path="/profile/security" element={<Security />} />
          <Route path="/profile/payments" element={<PaymentMethods />} />
          <Route path="/profile/notifications" element={<Notifications />} />
          <Route path="/profile/support" element={<Support />} />
          <Route path="/convert" element={<Convert />} />
          <Route path="/qr" element={<QRPay />} />
          <Route path="/withdraw" element={<Withdraw />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
