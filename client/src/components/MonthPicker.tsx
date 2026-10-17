import { useState, useRef, useEffect } from 'react'

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

interface Month {
  id: string
  index: number
  label: string
}

export function MonthPicker() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [months, setMonths] = useState<Month[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const scrollTimeoutRef = useRef<number | undefined>(undefined)

  // Função para criar um mês baseado em um índice
  const createMonth = (index: number): Month => {
    const monthIndex = ((index % 12) + 12) % 12 // Garantir que seja 0-11
    return {
      id: `month-${index}`,
      index,
      label: MESES[monthIndex],
    }
  }

  // Inicializar com lista de meses (começando no mês atual)
  useEffect(() => {
    const now = new Date()
    const currentMonthIndex = now.getMonth()

    // Criar lista inicial centrada no mês atual
    const initialMonths: Month[] = []
    for (let i = -50; i <= 50; i++) {
      initialMonths.push(createMonth(currentMonthIndex + i))
    }

    setMonths(initialMonths)
    setSelectedIndex(currentMonthIndex)

    // Scroll para o centro após renderizar
    setTimeout(() => {
      if (containerRef.current) {
        const container = containerRef.current
        const itemHeight = 91 // 90px + 1px border
        container.scrollTop = 50 * itemHeight // índice 50 é o centro
      }
    }, 0)
  }, [])

  // Handler de scroll com snap
  const handleScroll = () => {
    if (!containerRef.current) return

    // Limpar timeout anterior
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    // Após parar de scrollar, fazer snap e determinar o mês selecionado
    scrollTimeoutRef.current = setTimeout(() => {
      if (!containerRef.current) return

      const container = containerRef.current
      const scrollTop = container.scrollTop
      const itemHeight = 91 // 90px + 1px border

      // Calcular qual item está mais próximo do centro
      const arrayIndex = Math.round(scrollTop / itemHeight)

      // Fazer snap suave
      container.scrollTo({
        top: arrayIndex * itemHeight,
        behavior: 'smooth',
      })

      // Atualizar mês selecionado
      if (months[arrayIndex]) {
        const monthData = months[arrayIndex]
        const monthIndex = ((monthData.index % 12) + 12) % 12
        setSelectedIndex(monthIndex)
      }

      // Adicionar mais meses se necessário (scroll infinito)
      const totalItems = months.length

      // Se scrollou muito pra cima, adicionar meses anteriores
      if (arrayIndex <= 20) {
        const firstMonth = months[0]
        const newMonths: Month[] = []

        for (let i = 30; i >= 1; i--) {
          newMonths.push(createMonth(firstMonth.index - i))
        }

        setMonths((prev) => [...newMonths, ...prev])

        // Ajustar scroll para manter posição visual
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = (arrayIndex + 30) * itemHeight
          }
        }, 0)
      }

      // Se scrollou muito pra baixo, adicionar meses futuros
      if (arrayIndex >= totalItems - 20) {
        const lastMonth = months[totalItems - 1]
        const newMonths: Month[] = []

        for (let i = 1; i <= 30; i++) {
          newMonths.push(createMonth(lastMonth.index + i))
        }

        setMonths((prev) => [...prev, ...newMonths])
      }
    }, 100)
  }

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '400px',
        margin: '0 auto',
      }}
    >
      {/* Card */}
      <div
        style={{
          background: '#e8e8e8',
          borderRadius: '24px',
          padding: '0',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '273px',
            position: 'relative',
            overflow: 'hidden',
            background: '#e8e8e8',
            clipPath: 'inset(0 0 0 0)',
          }}
        >
          {/* Container de scroll */}
          <div
            ref={containerRef}
            onScroll={handleScroll}
            onWheel={(e) => {
              e.preventDefault()
              if (!containerRef.current) return

              const itemHeight = 91
              const currentScroll = containerRef.current.scrollTop
              const currentIndex = Math.round(currentScroll / itemHeight)

              // Scroll de 1 item por vez
              const direction = e.deltaY > 0 ? 1 : -1
              const newIndex = currentIndex + direction

              containerRef.current.scrollTo({
                top: newIndex * itemHeight,
                behavior: 'smooth',
              })
            }}
            style={{
              height: '100%',
              overflowY: 'scroll',
              scrollSnapType: 'y mandatory',
              scrollBehavior: 'smooth',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              paddingTop: '91px',
              paddingBottom: '91px',
              marginTop: '-91px',
              marginBottom: '-91px',
            }}
          >
            {months.map((month, index) => {
              const monthIndex = ((month.index % 12) + 12) % 12
              const isSelected = monthIndex === selectedIndex

              return (
                <div key={month.id}>
                  <div
                    style={{
                      height: '90px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      scrollSnapAlign: 'center',
                      scrollSnapStop: 'always',
                      fontSize: isSelected ? '48px' : '32px',
                      fontWeight: isSelected ? '500' : '300',
                      color: '#000',
                      transition: 'all 0.3s ease',
                      userSelect: 'none',
                      background: '#e8e8e8',
                    }}
                  >
                    {month.label}
                  </div>
                  {/* Linha separadora entre os meses */}
                  {index < months.length - 1 && (
                    <div
                      style={{
                        height: '1px',
                        background: '#000',
                        margin: '0',
                      }}
                    />
                  )}
                </div>
              )
            })}
          </div>

          {/* Estilo para esconder scrollbar */}
          <style>{`
            div[style*="scroll-snap-type"]::-webkit-scrollbar {
              display: none;
            }
          `}</style>
        </div>
      </div>
    </div>
  )
}
