import { CalendarDays } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface YearSelectorProps {
  selectedYear: number
  onYearChange: (year: number) => void
}

export function YearSelector({
  selectedYear,
  onYearChange,
}: YearSelectorProps) {
  const currentYear = new Date().getFullYear()
  const availableYears = [currentYear, currentYear + 1]

  return (
    <Select
      value={selectedYear.toString()}
      onValueChange={(value) => onYearChange(parseInt(value))}
    >
      <SelectTrigger className="w-full">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          <SelectValue placeholder="Selecione o ano" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {availableYears.map((year) => (
          <SelectItem key={year} value={year.toString()}>
            {year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
