import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Star } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useCreateAvaliacao } from '@shared/hooks'

const avaliacaoSchema = z.object({
  estrelas: z.number().min(1, 'Selecione uma nota').max(5),
  comentario: z.string().max(500, 'Máximo 500 caracteres').optional(),
})

type AvaliacaoFormData = z.infer<typeof avaliacaoSchema>

interface AvaliacaoDialogProps {
  pedidoId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AvaliacaoDialog({
  pedidoId,
  open,
  onOpenChange,
}: AvaliacaoDialogProps) {
  const [hoveredStar, setHoveredStar] = useState(0)
  const createAvaliacaoMutation = useCreateAvaliacao()

  const form = useForm<AvaliacaoFormData>({
    resolver: zodResolver(avaliacaoSchema),
    defaultValues: {
      estrelas: 0,
      comentario: '',
    },
  })

  const estrelasSelecionadas = form.watch('estrelas')

  const onSubmit = async (data: AvaliacaoFormData) => {
    if (data.estrelas < 1) {
      form.setError('estrelas', { message: 'Selecione uma nota' })
      return
    }
    try {
      await createAvaliacaoMutation.mutateAsync({
        pedidoId,
        estrelas: data.estrelas,
        comentario: data.comentario,
      })
      form.reset()
      onOpenChange(false)
    } catch (error: any) {
      form.setError('estrelas', { message: error?.message || 'Erro ao enviar avaliação' })
    }
  }

  const handleOpenChange = (val: boolean) => {
    if (!val) form.reset()
    onOpenChange(val)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Avaliar Pedido</DialogTitle>
          <DialogDescription>
            Conte-nos como foi sua experiência com nosso serviço
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="estrelas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sua avaliação</FormLabel>
                  <FormControl>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, index) => {
                        const starValue = index + 1
                        const isFilled =
                          starValue <= (hoveredStar || estrelasSelecionadas)

                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => field.onChange(starValue)}
                            onMouseEnter={() => setHoveredStar(starValue)}
                            onMouseLeave={() => setHoveredStar(0)}
                            className="transition-transform hover:scale-110"
                          >
                            <Star
                              className={`h-8 w-8 ${
                                isFilled
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        )
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comentario"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comentário (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Conte-nos mais sobre sua experiência..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createAvaliacaoMutation.isPending}
              >
                {createAvaliacaoMutation.isPending ? 'Enviando...' : 'Enviar Avaliação'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
