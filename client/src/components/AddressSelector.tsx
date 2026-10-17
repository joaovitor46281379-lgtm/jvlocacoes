import { MapPin, Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface Vila {
  id: string
  nome: string
  valorFrete: number
}

interface Address {
  id: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  vilaId?: string
  city: string
  state: string
  zipCode: string
  reference?: string
  isDefault: boolean
  vila?: Vila
}

interface AddressSelectorProps {
  selectedAddress?: Address | null
  onAddAddress: () => void
  onEditAddress?: () => void
  onDeleteAddress?: (addressId: string) => void
}

export function AddressSelector({
  selectedAddress,
  onAddAddress,
  onEditAddress,
  onDeleteAddress,
}: AddressSelectorProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!selectedAddress) {
    return (
      <div className="bg-muted rounded-2xl p-4">
        <Button
          onClick={onAddAddress}
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar endereço
        </Button>
      </div>
    )
  }

  // Se está mostrando confirmação de deletar
  if (showDeleteConfirm) {
    return (
      <div className="bg-muted rounded-2xl p-4">
        <div className="text-center mb-3">
          <p className="text-sm font-medium mb-1">Deletar endereço?</p>
          <p className="text-xs text-muted-foreground">
            Esta ação não pode ser desfeita
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowDeleteConfirm(false)}
            variant="outline"
            className="flex-1"
            size="sm"
          >
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onDeleteAddress?.(selectedAddress.id)
              setShowDeleteConfirm(false)
            }}
            variant="destructive"
            className="flex-1"
            size="sm"
          >
            Deletar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-muted rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground font-medium mb-1">
            Endereço de entrega
          </div>
          <div className="text-sm font-medium">
            {selectedAddress.street}, {selectedAddress.number}
          </div>
          {selectedAddress.complement && (
            <div className="text-xs text-muted-foreground">
              {selectedAddress.complement}
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            {selectedAddress.neighborhood} - {selectedAddress.city}/{selectedAddress.state}
          </div>
          {selectedAddress.vila && (
            <div className="text-xs font-medium text-primary mt-1">
              Frete: R$ {Number(selectedAddress.vila.valorFrete).toFixed(2)}
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            CEP: {selectedAddress.zipCode}
          </div>
          {selectedAddress.reference && (
            <div className="text-xs text-muted-foreground">
              Ref: {selectedAddress.reference}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onEditAddress?.();
            }}
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            title="Editar endereço"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(true);
            }}
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Deletar endereço"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
