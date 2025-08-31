import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
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
import DetalhesVisitante from "./pages/DetalhesVisitante";
import EditarVisitante from "./pages/EditarVisitante";
import GerenciarQRCodes from "./pages/GerenciarQRCodes";
import RegistroVisitante from "./pages/RegistroVisitante";
import RegistroSucesso from "./pages/RegistroSucesso";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import NotFound, { Pagamento } from "./pages/NotFound";

// Lazy loading para componentes hierárquicos
const DenominationDashboardPage = lazy(() => 
  import("./pages/DenominationDashboardPage")
);

const ChurchManagementPage = lazy(() => 
  import("./pages/ChurchManagementPage")
);

const CreateChurchPage = lazy(() => 
  import("./pages/CreateChurchPage")
);

const EditChurchPage = lazy(() => 
  import("./pages/EditChurchPage")
);

const ChurchDetailsPage = lazy(() => 
  import("./pages/ChurchDetailsPage")
);

const HierarchyViewPage = lazy(() => 
  import("./pages/HierarchyViewPage")
);

const queryClient = new QueryClient();

const AppContent = () => {
  // Hook para logout por inatividade
  useInactivityLogout();

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    }>
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
          <ProtectedRoute level="public">
            <CadastroEtapa2 />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/cadastro/etapa-3" 
        element={
          <ProtectedRoute level="public">
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
        path="/visitantes/:id" 
        element={
          <ProtectedRoute level="auth_complete">
            <DetalhesVisitante />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/visitantes/:id/editar" 
        element={
          <ProtectedRoute level="auth_complete">
            <EditarVisitante />
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
      <Route 
        path="/politica-privacidade" 
        element={
          <ProtectedRoute level="public">
            <PoliticaPrivacidade />
          </ProtectedRoute>
        } 
      />
      
      {/* Rotas do módulo hierárquico */}
      <Route 
        path="/denominacao/dashboard" 
        element={
          <ProtectedRoute level="auth_complete">
            <DenominationDashboardPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/denominacao/:denominationId/dashboard" 
        element={
          <ProtectedRoute level="auth_complete">
            <DenominationDashboardPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Rotas específicas de gestão hierárquica */}
      <Route 
        path="/denominacao/churches" 
        element={
          <ProtectedRoute level="auth_complete">
            <ChurchManagementPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/denominacao/churches/create" 
        element={
          <ProtectedRoute level="auth_complete">
            <CreateChurchPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/denominacao/churches/:id" 
        element={
          <ProtectedRoute level="auth_complete">
            <ChurchDetailsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/denominacao/churches/:id/edit" 
        element={
          <ProtectedRoute level="auth_complete">
            <EditChurchPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/denominacao/hierarchy" 
        element={
          <ProtectedRoute level="auth_complete">
            <HierarchyViewPage />
          </ProtectedRoute>
        } 
      />
      
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
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
