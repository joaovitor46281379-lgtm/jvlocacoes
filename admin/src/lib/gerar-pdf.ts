/**
 * Gera um PDF (A4) diretamente a partir de um elemento do DOM e baixa o arquivo,
 * sem passar pela janela de impressão do navegador.
 * As bibliotecas são carregadas sob demanda para não pesar o bundle inicial.
 */
export async function baixarPdfDeElemento(elemento: HTMLElement, nomeArquivo: string): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas-pro'),
    import('jspdf'),
  ])

  // Garante que fontes e imagens (logo) já foram carregadas antes de capturar
  if (document.fonts?.ready) await document.fonts.ready
  await Promise.all(
    Array.from(elemento.querySelectorAll('img')).map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.onload = () => resolve()
            img.onerror = () => resolve()
          })
    )
  )

  const canvas = await html2canvas(elemento, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
  })

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const larguraPagina = pdf.internal.pageSize.getWidth()
  const alturaPagina = pdf.internal.pageSize.getHeight()

  // Altura (em px do canvas) que cabe em uma página A4 mantendo a proporção
  const alturaPaginaPx = Math.floor((canvas.width * alturaPagina) / larguraPagina)

  let posicao = 0
  let primeira = true
  while (posicao < canvas.height) {
    const alturaFatia = Math.min(alturaPaginaPx, canvas.height - posicao)
    const fatia = document.createElement('canvas')
    fatia.width = canvas.width
    fatia.height = alturaFatia
    const ctx = fatia.getContext('2d')
    if (!ctx) throw new Error('Não foi possível criar o canvas do PDF')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, fatia.width, fatia.height)
    ctx.drawImage(canvas, 0, posicao, canvas.width, alturaFatia, 0, 0, canvas.width, alturaFatia)

    if (!primeira) pdf.addPage()
    pdf.addImage(
      fatia.toDataURL('image/jpeg', 0.95),
      'JPEG',
      0,
      0,
      larguraPagina,
      (alturaFatia * larguraPagina) / canvas.width
    )
    primeira = false
    posicao += alturaFatia
  }

  pdf.save(nomeArquivo)
}
