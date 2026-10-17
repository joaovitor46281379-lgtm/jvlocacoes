import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { NeighborhoodList } from '@/components/NeighborhoodList'
import { NeighborhoodForm } from '@/components/NeighborhoodForm'
import { Plus } from 'lucide-react'

export function NeighborhoodsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const handleEdit = (id: string) => {
    setEditId(id)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditId(null)
  }

  const handleNew = () => {
    setEditId(null)
    setIsFormOpen(true)
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold">Gerenciar Bairros</h1>
        <Button onClick={handleNew} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Novo Bairro
        </Button>
      </div>

      <NeighborhoodList onEdit={handleEdit} />

      <NeighborhoodForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        editId={editId}
      />
    </div>
  )
}
