import { useState } from 'react'
import {
  useCategoriasCustos,
  useCreateCategoriaCusto,
  useDeleteCategoriaCusto,
  useCustos,
  useCreateCusto,
  useDeleteCusto,
} from '@shared/hooks/use-custos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatarValor } from '@shared/lib/validations'
import { Plus, Trash2 } from 'lucide-react'

const mesesNomes = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Mai', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export function CustosPage() {
  const now = new Date()
  const [selectedMes, setSelectedMes] = useState(now.getMonth() + 1) // 1-indexed
  const [selectedAno, setSelectedAno] = useState(String(now.getFullYear()))

  // Categorias
  const { data: categorias, isLoading: loadingCategorias } = useCategoriasCustos()
  const createCategoria = useCreateCategoriaCusto()
  const deleteCategoria = useDeleteCategoriaCusto()
  const [novaCategoria, setNovaCategoria] = useState('')

  // Custos
  const selectedAnoNum = Number(selectedAno) || now.getFullYear()
  const { data: custos, isLoading: loadingCustos } = useCustos(selectedMes, selectedAnoNum)
  const createCusto = useCreateCusto()
  const deleteCusto = useDeleteCusto()

  // Form de novo custo
  const [categoriaId, setCategoriaId] = useState('')
  const [valor, setValor] = useState('')
  const [descricao, setDescricao] = useState('')
  const [dataCusto, setDataCusto] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })

  const categoriasArray = Array.isArray(categorias) ? categorias : []
  const custosArray = Array.isArray(custos) ? custos : []

  const totalMes = custosArray.reduce((acc: number, c: any) => acc + Number(c.valor), 0)

  // Resumo por categoria
  const resumoPorCategoria = custosArray.reduce((acc: Record<string, number>, c: any) => {
    const nome = c.categoria?.nome || 'Sem categoria'
    acc[nome] = (acc[nome] || 0) + Number(c.valor)
    return acc
  }, {})

  const handleAdicionarCategoria = async () => {
    if (!novaCategoria.trim()) return
    try {
      await createCategoria.mutateAsync(novaCategoria.trim())
      setNovaCategoria('')
    } catch (error) {
      console.error('Erro ao criar categoria:', error)
      alert('Erro ao criar categoria. Nome pode já existir.')
    }
  }

  const handleRemoverCategoria = async (id: string) => {
    if (!confirm('Desativar esta categoria? Os custos existentes serão mantidos.')) return
    try {
      await deleteCategoria.mutateAsync(id)
    } catch (error) {
      console.error('Erro ao remover categoria:', error)
    }
  }

  const handleAdicionarCusto = async () => {
    if (!categoriaId || !valor) return
    // Derivar mês e ano da data escolhida
    const [anoStr, mesStr] = dataCusto.split('-')
    const mesDoForm = Number(mesStr)
    const anoDoForm = Number(anoStr)
    try {
      await createCusto.mutateAsync({
        categoriaId,
        valor: Number(valor),
        descricao: descricao || undefined,
        mes: mesDoForm,
        ano: anoDoForm,
      })
      setCategoriaId('')
      setValor('')
      setDescricao('')
    } catch (error) {
      console.error('Erro ao criar custo:', error)
      alert('Erro ao criar custo')
    }
  }

  const handleRemoverCusto = async (id: string) => {
    try {
      await deleteCusto.mutateAsync({ id, mes: selectedMes, ano: selectedAnoNum })
    } catch (error) {
      console.error('Erro ao remover custo:', error)
    }
  }

  return (
    <div className="p-4 lg:p-8">
      <h1 className="text-2xl lg:text-3xl font-bold mb-6">Custos</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar: Categorias */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-3">Categorias</h2>

            {/* Adicionar categoria */}
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Nova categoria..."
                value={novaCategoria}
                onChange={(e) => setNovaCategoria(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdicionarCategoria()}
                className="flex-1"
              />
              <Button size="icon" onClick={handleAdicionarCategoria} disabled={!novaCategoria.trim() || createCategoria.isPending}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Lista de categorias */}
            {loadingCategorias ? (
              <div className="text-sm text-slate-500">Carregando...</div>
            ) : (
              <div className="space-y-1">
                {categoriasArray.map((cat: any) => (
                  <div key={cat.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-50">
                    <span className="text-sm">{cat.nome}</span>
                    <button
                      onClick={() => handleRemoverCategoria(cat.id)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {categoriasArray.length === 0 && (
                  <p className="text-sm text-slate-400">Nenhuma categoria ainda</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main: Custos do mês */}
        <div className="lg:col-span-2 space-y-4">
          {/* Seletor de mês/ano */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex-1">
                <Label>Mês</Label>
                <Select value={String(selectedMes)} onValueChange={(v: string) => setSelectedMes(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mesesNomes.map((nome, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-32">
                <Label>Ano</Label>
                <Input
                  type="number"
                  placeholder="Ex: 2025"
                  value={selectedAno}
                  onChange={(e) => setSelectedAno(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Formulário: adicionar custo */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold mb-3">Adicionar Custo</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Categoria</Label>
                <Select value={categoriaId} onValueChange={setCategoriaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriasArray.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-3">
              <Label>Data do custo</Label>
              <Input
                type="date"
                value={dataCusto}
                onChange={(e) => setDataCusto(e.target.value)}
              />
            </div>
            <div className="mt-3">
              <Label>Descrição (opcional)</Label>
              <Input
                placeholder="Ex: Ajudante - 2 dias"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>
            <Button
              className="mt-3 w-full sm:w-auto"
              onClick={handleAdicionarCusto}
              disabled={!categoriaId || !valor || createCusto.isPending}
            >
              <Plus className="h-4 w-4 mr-2" />
              {createCusto.isPending ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </div>

          {/* Resumo por categoria */}
          {Object.keys(resumoPorCategoria).length > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-3">Resumo do mês</h3>
              <div className="space-y-2">
                {Object.entries(resumoPorCategoria).map(([nome, valor]) => (
                  <div key={nome} className="flex justify-between text-sm">
                    <span className="text-slate-600">{nome}</span>
                    <span className="font-medium">{formatarValor(valor)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-red-600">{formatarValor(totalMes)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Lista de custos */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loadingCustos ? (
              <div className="p-4 text-center text-slate-500">Carregando...</div>
            ) : custosArray.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                Nenhum custo registrado para {mesesNomes[selectedMes - 1]} de {selectedAnoNum}
              </div>
            ) : (
              <div className="divide-y">
                {custosArray.map((custo: any) => (
                  <div key={custo.id} className="p-3 lg:p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">
                        <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs mr-2">
                          {custo.categoria?.nome || 'Sem categoria'}
                        </span>
                        {custo.descricao && <span className="text-slate-500">{custo.descricao}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-red-600">{formatarValor(Number(custo.valor))}</span>
                      <button
                        onClick={() => handleRemoverCusto(custo.id)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
