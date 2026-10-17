import { Package } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useKits } from '@/hooks/useKits'

interface KitSelectorProps {
  selectedKitId: string | null
  onKitChange: (kitId: string) => void
  quantity: number
}

export function KitSelector({
  selectedKitId,
  onKitChange,
  quantity,
}: KitSelectorProps) {
  const { data: kits, isLoading, error } = useKits()

  if (isLoading) {
    return (
      <div className="bg-muted rounded-lg p-4">
        <div className="text-sm text-muted-foreground">
          Carregando kits disponíveis...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-muted rounded-lg p-4">
        <div className="text-sm text-destructive">
          Erro ao carregar kits. Tente novamente.
        </div>
      </div>
    )
  }

  if (!kits || kits.length === 0) {
    return (
      <div className="bg-muted rounded-lg p-4">
        <div className="text-sm text-muted-foreground">
          Nenhum kit disponível no momento.
        </div>
      </div>
    )
  }

  const selectedKit = kits.find((kit) => kit.id === selectedKitId)
  const precoTotal = selectedKit ? selectedKit.valor * quantity : 0

  return (
    <div className="bg-muted rounded-2xl p-4 h-full flex flex-col justify-between min-h-[140px]">
      {/* Nome do kit - Acima do dropdown - Espaço reservado sempre */}
      <div className="mb-2 min-h-[28px]">
        {selectedKit && (
          <div className="font-semibold text-base truncate">
            {selectedKit.descricao}
          </div>
        )}
      </div>

      {/* Dropdown */}
      <Select value={selectedKitId || ''} onValueChange={onKitChange}>
        <SelectTrigger>
          <div className="flex items-center gap-2 w-full min-w-0">
            <Package className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1 truncate text-left">
              <SelectValue placeholder="Selecione o kit" />
            </span>
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-[240px]">
          {kits.map((kit) => (
            <SelectItem key={kit.id} value={kit.id}>
              <span className="text-sm whitespace-nowrap">
                {kit.mesas} {kit.mesas === 1 ? 'mesa' : 'mesas'} +{' '}
                {kit.cadeiras} {kit.cadeiras === 1 ? 'cadeira' : 'cadeiras'}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Total com "sem frete" */}
      {selectedKit && (
        <div className="text-sm mt-3">
          <div className="text-muted-foreground">Total (sem frete)</div>
          <div className="text-2xl font-bold text-primary">
            R$ {precoTotal.toFixed(2)}
          </div>
        </div>
      )}
    </div>
  )
}
