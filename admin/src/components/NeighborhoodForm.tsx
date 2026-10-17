import { useState, useEffect } from 'react'
import { useCreateVila, useUpdateVila, useVila } from '@shared/hooks/use-vilas'
import { vilaSchema } from '@shared/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'

interface NeighborhoodFormProps {
  isOpen: boolean
  onClose: () => void
  editId?: string | null
}

export function NeighborhoodForm({ isOpen, onClose, editId }: NeighborhoodFormProps) {
  const [nome, setNome] = useState('')
  const [valorFrete, setValorFrete] = useState('')
  const [ativo, setAtivo] = useState(true)
  const [errors, setErrors] = useState<any>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { data: neighborhood } = useVila(editId || '')
  const createVila = useCreateVila()
  const updateVila = useUpdateVila()

  useEffect(() => {
    if (neighborhood && editId) {
      setNome(neighborhood.nome)
      setValorFrete(String(neighborhood.valorFrete))
      setAtivo(neighborhood.ativo)
    } else {
      resetForm()
    }
  }, [neighborhood, editId, isOpen])

  const resetForm = () => {
    setNome('')
    setValorFrete('')
    setAtivo(true)
    setErrors({})
    setSubmitError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    const data = {
      nome,
      valorFrete: parseFloat(valorFrete),
      ativo
    }

    try {
      vilaSchema.parse(data)

      if (editId) {
        await updateVila.mutateAsync({ id: editId, data })
      } else {
        await createVila.mutateAsync(data)
      }

      resetForm()
      onClose()
    } catch (error: any) {
      if (error.errors) {
        const formattedErrors: any = {}
        error.errors.forEach((err: any) => {
          formattedErrors[err.path[0]] = err.message
        })
        setErrors(formattedErrors)
      } else {
        setSubmitError(error.message || 'Erro ao salvar bairro. Tente novamente.')
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editId ? 'Editar Bairro' : 'Novo Bairro'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {submitError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}
          <div>
            <Label htmlFor="nome">Nome do Bairro *</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Centro"
            />
            {errors.nome && <p className="text-sm text-red-600 mt-1">{errors.nome}</p>}
          </div>

          <div>
            <Label htmlFor="valorFrete">Valor do Frete (R$) *</Label>
            <Input
              id="valorFrete"
              type="number"
              step="0.01"
              value={valorFrete}
              onChange={(e) => setValorFrete(e.target.value)}
              placeholder="0.00"
            />
            {errors.valorFrete && <p className="text-sm text-red-600 mt-1">{errors.valorFrete}</p>}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="ativo"
              checked={ativo}
              onCheckedChange={setAtivo}
            />
            <Label htmlFor="ativo">Bairro ativo</Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {editId ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
