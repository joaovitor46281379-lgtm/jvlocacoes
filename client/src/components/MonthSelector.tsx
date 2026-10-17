import { Calendar } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

interface MonthSelectorProps {
  selectedMonth: number
  selectedYear: number
  onMonthChange: (month: number) => void
}

export function MonthSelector({
  selectedMonth,
  selectedYear,
  onMonthChange,
}: MonthSelectorProps) {
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  // Determinar quais meses devem aparecer
  const availableMonths = MESES.map((mes, index) => {
    // Se o ano selecionado é o ano atual, mostrar apenas do mês atual em diante
    if (selectedYear === currentYear) {
      return index >= currentMonth ? { label: mes, value: index } : null
    }
    // Se for ano seguinte, mostrar todos os meses
    return { label: mes, value: index }
  }).filter((month) => month !== null) as { label: string; value: number }[]

  return (
    <Select
      value={selectedMonth.toString()}
      onValueChange={(value) => onMonthChange(parseInt(value))}
    >
      <SelectTrigger className="w-full">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <SelectValue placeholder="Selecione o mês" />
        </div>
      </SelectTrigger>
      <SelectContent className="max-h-[240px]">
        {availableMonths.map((month) => (
          <SelectItem key={month.value} value={month.value.toString()}>
            {month.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
