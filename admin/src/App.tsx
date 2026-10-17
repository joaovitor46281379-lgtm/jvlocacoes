import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AdminLayout } from './components/AdminLayout'
import { DashboardPage } from './pages/DashboardPage'
import { NeighborhoodsPage } from './pages/NeighborhoodsPage'
import { PedidosPage } from './pages/PedidosPage'
import { AvaliacoesPage } from './pages/AvaliacoesPage'
import { PerdasPage } from './pages/PerdasPage'
import { ContratosPage } from './pages/ContratosPage'
import { InventarioPage } from './pages/InventarioPage'
import { CustosPage } from './pages/CustosPage'
import { HistoricoPage } from './pages/HistoricoPage'
import { EntregasPage } from './pages/EntregasPage'
import { ClientesPage } from './pages/ClientesPage'
import { RecibosPage } from './pages/RecibosPage'
import { LoginPage } from './pages/LoginPage'
import { AuthProvider, useAuth } from './contexts/AuthContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter basename="/admin">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="bairros" element={<NeighborhoodsPage />} />
              <Route path="pedidos" element={<PedidosPage />} />
              <Route path="avaliacoes" element={<AvaliacoesPage />} />
              <Route path="perdas" element={<PerdasPage />} />
              <Route path="contratos" element={<ContratosPage />} />
              <Route path="inventario" element={<InventarioPage />} />
              <Route path="custos" element={<CustosPage />} />
              <Route path="historico" element={<HistoricoPage />} />
              <Route path="entregas" element={<EntregasPage />} />
              <Route path="clientes" element={<ClientesPage />} />
              <Route path="recibos" element={<RecibosPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App
