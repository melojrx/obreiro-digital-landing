import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./hooks/useAuth";
import { SidebarProvider } from "./hooks/useSidebar";
import { useInactivityLogout } from "./hooks/useInactivityLogout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import CadastroEtapa2 from "./pages/CadastroEtapa2";
import CadastroEtapa3 from "./pages/CadastroEtapa3";
import Dashboard from "./pages/Dashboard";
import Perfil from "./pages/Perfil";
import Membros from "./pages/Membros";
import NovoMembro from "./pages/NovoMembro";
import DetalhesMembro from "./pages/DetalhesMembro";
import EditarMembro from "./pages/EditarMembro";
import Visitantes from "./pages/Visitantes";
import NovoVisitante from "./pages/NovoVisitante";
import GerenciarQRCodes from "./pages/GerenciarQRCodes";
import RegistroVisitante from "./pages/RegistroVisitante";
import RegistroSucesso from "./pages/RegistroSucesso";
import NotFound, { Pagamento } from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  // Hook para logout por inatividade
  useInactivityLogout();

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route 
        path="/login" 
        element={
          <ProtectedRoute level="public">
            <Login />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/cadastro" 
        element={
          <ProtectedRoute level="public">
            <Cadastro />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/cadastro/etapa-2" 
        element={
          <ProtectedRoute level="auth_incomplete">
            <CadastroEtapa2 />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/cadastro/etapa-3" 
        element={
          <ProtectedRoute level="auth_incomplete">
            <CadastroEtapa3 />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/pagamento" 
        element={
          <ProtectedRoute level="auth_incomplete">
            <Pagamento />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute level="auth_complete">
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/perfil" 
        element={
          <ProtectedRoute level="auth_complete">
            <Perfil />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/membros" 
        element={
          <ProtectedRoute level="auth_complete">
            <Membros />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/membros/novo" 
        element={
          <ProtectedRoute level="auth_complete">
            <NovoMembro />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/membros/:id" 
        element={
          <ProtectedRoute level="auth_complete">
            <DetalhesMembro />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/membros/:id/editar" 
        element={
          <ProtectedRoute level="auth_complete">
            <EditarMembro />
          </ProtectedRoute>
        } 
      />
      {/* Rota para gestão de visitantes */}
      <Route 
        path="/visitantes" 
        element={
          <ProtectedRoute level="auth_complete">
            <Visitantes />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/visitantes/novo" 
        element={
          <ProtectedRoute level="auth_complete">
            <NovoVisitante />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/configuracoes/qr-codes" 
        element={
          <ProtectedRoute level="auth_complete">
            <GerenciarQRCodes />
          </ProtectedRoute>
        } 
      />
      {/* Rotas públicas para visitantes via QR Code */}
      <Route 
        path="/visit/:uuid" 
        element={
          <ProtectedRoute level="public">
            <RegistroVisitante />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/registro-sucesso" 
        element={
          <ProtectedRoute level="public">
            <RegistroSucesso />
          </ProtectedRoute>
        } 
      />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <SidebarProvider>
          <TooltipProvider>
            <AppContent />
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </SidebarProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
