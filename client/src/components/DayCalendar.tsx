interface DayCalendarProps {
  selectedMonth: number
  selectedYear: number
  selectedDays: number[]
  onDayToggle: (day: number) => void
}

export function DayCalendar({
  selectedMonth,
  selectedYear,
  selectedDays,
  onDayToggle,
}: DayCalendarProps) {
  const currentDate = new Date()
  const currentDay = currentDate.getDate()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  // Calcular o primeiro dia do mês (0 = Domingo, 1 = Segunda, ..., 6 = Sábado)
  const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay()

  // Calcular quantos dias tem no mês
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()

  // Criar array de dias vazios antes do primeiro dia
  // Como nosso cabeçalho começa em Domingo (D, S, T, Q, Q, S, S), usamos firstDayOfMonth direto
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i)

  // Criar array de dias do mês
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // Verificar se um dia está desabilitado
  const isDayDisabled = (day: number): boolean => {
    // Se for um ano futuro, nenhum dia está desabilitado
    if (selectedYear > currentYear) {
      return false
    }

    // Se for o ano atual mas mês futuro, nenhum dia está desabilitado
    if (selectedYear === currentYear && selectedMonth > currentMonth) {
      return false
    }

    // Se for o mês e ano atuais, desabilitar dias anteriores ao atual
    if (selectedYear === currentYear && selectedMonth === currentMonth) {
      return day < currentDay
    }

    return false
  }

  return (
    <div className="w-full">
      {/* Cabeçalho com dias da semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => (
          <div
            key={index}
            className="flex items-center justify-center text-sm font-medium text-muted-foreground h-8"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grid de dias */}
      <div className="grid grid-cols-7 gap-1">
        {/* Dias vazios antes do primeiro dia do mês */}
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="h-12" />
        ))}

        {/* Dias do mês */}
        {days.map((day) => {
          const isDisabled = isDayDisabled(day)
          const isSelected = selectedDays.includes(day)

          // Verificar se é final de semana (sábado = 6, domingo = 0)
          const dayOfWeek = new Date(selectedYear, selectedMonth, day).getDay()
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

          // Verificar se é o dia atual
          const isToday =
            day === currentDay &&
            selectedMonth === currentMonth &&
            selectedYear === currentYear

          return (
            <button
              key={day}
              onClick={() => !isDisabled && onDayToggle(day)}
              disabled={isDisabled}
              className={`
                h-12 rounded-md flex items-center justify-center text-sm font-medium
                transition-colors
                ${isWeekend && !isToday && !isSelected ? 'bg-red-100' : ''}
                ${isToday && !isSelected ? 'bg-primary/10' : ''}
                ${
                  isDisabled
                    ? 'text-muted-foreground/30 cursor-not-allowed'
                    : isSelected
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'hover:bg-accent hover:text-accent-foreground'
                }
              `}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
