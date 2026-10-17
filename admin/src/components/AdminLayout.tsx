import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Home, MapPin, ClipboardList, Star, AlertTriangle, FileText, Menu, X, Database, DollarSign, LogOut, History, Truck, Users, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { Logo } from './Logo'

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/bairros', icon: MapPin, label: 'Bairros/Vilas' },
  { to: '/pedidos', icon: ClipboardList, label: 'Pedidos' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/entregas', icon: Truck, label: 'Entregas & Retiradas' },
  { to: '/avaliacoes', icon: Star, label: 'Avaliações' },
  { to: '/inventario', icon: Database, label: 'Inventário' },
  { to: '/custos', icon: DollarSign, label: 'Custos' },
  { to: '/historico', icon: History, label: 'Histórico' },
  { to: '/perdas', icon: AlertTriangle, label: 'Perdas/Quebras' },
  { to: '/contratos', icon: FileText, label: 'Contratos' },
  { to: '/recibos', icon: Receipt, label: 'Recibos' },
]

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { signOut } = useAuth()

  // Fecha sidebar ao navegar em mobile
  const handleNavClick = () => {
    setSidebarOpen(false)
  }

  // Pega o título da página atual
  const currentPage = navItems.find(item =>
    item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
  )

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <header className="lg:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Logo size="sm" />
          <div>
            <h1 className="text-lg font-bold">JV Locações</h1>
            <p className="text-xs text-slate-400">{currentPage?.label || 'Admin'}</p>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Menu"
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transform transition-transform duration-300 ease-in-out lg:transform-none',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="p-4 border-b border-slate-700 hidden lg:block">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <div>
              <h1 className="text-xl font-bold">JV Locações</h1>
              <p className="text-xs text-slate-400">Painel Admin</p>
            </div>
          </div>
        </div>

        {/* Espaço para o header mobile */}
        <div className="h-16 lg:hidden" />

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-3 lg:py-2 rounded-lg transition-colors',
                      isActive
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    )
                  }
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-700 flex items-center justify-between">
          <span className="text-xs text-slate-400">v1.0.0</span>
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-slate-50 overflow-auto min-h-[calc(100vh-64px)] lg:min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
