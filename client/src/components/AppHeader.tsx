import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { ClipboardList, CalendarDays, LogOut } from 'lucide-react'

export function AppHeader() {
  const { signOut } = useAuth()
  const location = useLocation()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Erro ao sair:', error)
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/">
            <img src="/cliente/logo.jpeg" alt="JV Locações" className="h-9 w-auto object-contain rounded-xl" />
          </Link>

          {/* Navegação */}
          <nav className="flex items-center gap-2">
            <Link to="/">
              <Button
                variant={location.pathname === '/' ? 'default' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <CalendarDays className="h-4 w-4" />
                Novo pedido
              </Button>
            </Link>

            <Link to="/pedidos">
              <Button
                variant={location.pathname === '/pedidos' ? 'default' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <ClipboardList className="h-4 w-4" />
                Agendados
              </Button>
            </Link>

            <div className="ml-1 pl-2 border-l">
              <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sair">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}
