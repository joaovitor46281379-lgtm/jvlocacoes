import { Link, useLocation } from 'react-router-dom'
import { Home, Package } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Header() {
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <span className="text-lg font-bold">JV Locações</span>
          </Link>
        </div>

        <nav className="flex flex-1 items-center justify-end space-x-2">
          <Link
            to="/"
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
              isActive('/') && 'bg-accent text-accent-foreground'
            )}
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Início</span>
          </Link>

          <Link
            to="/pedidos"
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
              isActive('/pedidos') && 'bg-accent text-accent-foreground'
            )}
          >
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Meus Pedidos</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}
