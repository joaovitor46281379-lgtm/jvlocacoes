/**
 * Gera um PDF em A4 a partir de um elemento do DOM e baixa o arquivo,
 * sem passar pela janela de impressão do navegador.
 *
 * Como funciona:
 *  1. O elemento é CLONADO para fora da tela com largura fixa de 170 mm
 *     (A4 de 210 mm menos 20 mm de margem de cada lado). Assim o PDF sai igual
 *     em qualquer tamanho de tela (celular, notebook, monitor).
 *  2. O clone é capturado como imagem.
 *  3. A imagem é fatiada em páginas A4 com margens, cortando SEMPRE entre dois
 *     blocos de texto (nunca no meio de uma linha ou de uma assinatura).
 *
 * As bibliotecas são carregadas sob demanda para não pesar o bundle inicial.
 */

// Medidas da página A4, em milímetros
const A4_LARGURA = 210
const A4_ALTURA = 297
const MARGEM_LATERAL = 20
const MARGEM_SUPERIOR = 15
const MARGEM_INFERIOR = 15

const LARGURA_CONTEUDO_MM = A4_LARGURA - MARGEM_LATERAL * 2 // 170 mm
const ALTURA_CONTEUDO_MM = A4_ALTURA - MARGEM_SUPERIOR - MARGEM_INFERIOR // 267 mm
const PX_POR_MM = 96 / 25.4

const TAGS_TITULO = new Set(['H1', 'H2', 'H3', 'H4'])
const TAGS_BLOCO_INLINE = new Set(['SPAN', 'STRONG', 'B', 'EM', 'I', 'A', 'BR', 'IMG', 'SVG', 'SMALL', 'U'])

/** Blocos "folha": elementos que não contêm outros blocos dentro (parágrafos, linhas, títulos...). */
function coletarBlocosFolha(raiz: HTMLElement): HTMLElement[] {
  const folhas: HTMLElement[] = []
  const visitar = (el: HTMLElement) => {
    const filhosBloco = Array.from(el.children).filter(
      (c): c is HTMLElement =>
        c instanceof HTMLElement && !TAGS_BLOCO_INLINE.has(c.tagName) && c.tagName !== 'STYLE'
    )
    if (filhosBloco.length === 0) {
      folhas.push(el)
      return
    }
    filhosBloco.forEach(visitar)
  }
  Array.from(raiz.children).forEach((c) => {
    if (c instanceof HTMLElement && c.tagName !== 'STYLE') visitar(c)
  })
  return folhas
}

/**
 * Posições (em px do clone) onde é seguro cortar a página:
 * o topo de cada bloco, exceto logo depois de um título (para não deixar
 * "IV — Itens Locados" sozinho no fim de uma página).
 */
function calcularPontosDeQuebra(raiz: HTMLElement): number[] {
  const topoRaiz = raiz.getBoundingClientRect().top
  const folhas = coletarBlocosFolha(raiz)
  const pontos: number[] = []
  folhas.forEach((el, i) => {
    const anterior = folhas[i - 1]
    if (anterior && TAGS_TITULO.has(anterior.tagName)) return
    const topo = el.getBoundingClientRect().top - topoRaiz
    if (topo > 1) pontos.push(topo)
  })
  return pontos
}

async function aguardarImagens(raiz: HTMLElement) {
  if (document.fonts?.ready) await document.fonts.ready
  await Promise.all(
    Array.from(raiz.querySelectorAll('img')).map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.onload = () => resolve()
            img.onerror = () => resolve()
          })
    )
  )
}

export async function baixarPdfDeElemento(elemento: HTMLElement, nomeArquivo: string): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas-pro'),
    import('jspdf'),
  ])

  // 1) Clone fora da tela, com largura fixa da área útil do A4 e sem "enfeites" de tela
  const larguraPx = Math.round(LARGURA_CONTEUDO_MM * PX_POR_MM)
  const palco = document.createElement('div')
  palco.setAttribute('aria-hidden', 'true')
  palco.style.cssText = `position:fixed;left:-10000px;top:0;width:${larguraPx}px;background:#fff;z-index:-1;`

  const clone = elemento.cloneNode(true) as HTMLElement
  clone.removeAttribute('id')
  Object.assign(clone.style, {
    position: 'static',
    width: `${larguraPx}px`,
    maxWidth: 'none',
    minWidth: '0',
    margin: '0',
    padding: '0',
    boxShadow: 'none',
    borderRadius: '0',
    border: 'none',
    background: '#fff',
    boxSizing: 'border-box',
  })
  palco.appendChild(clone)
  document.body.appendChild(palco)

  try {
    await aguardarImagens(clone)

    // 2) Captura
    const escala = 2
    const alturaCloneCss = clone.scrollHeight
    const pontosCss = calcularPontosDeQuebra(clone)
    const canvas = await html2canvas(clone, {
      scale: escala,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      width: larguraPx,
      height: alturaCloneCss,
      windowWidth: larguraPx,
    })

    // 3) Fatiamento em páginas A4 com margens
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pxPorMmCanvas = canvas.width / LARGURA_CONTEUDO_MM
    const alturaPaginaPx = Math.floor(ALTURA_CONTEUDO_MM * pxPorMmCanvas)
    const pontosCanvas = pontosCss.map((p) => Math.round(p * escala))

    let posicao = 0
    let primeira = true
    while (posicao < canvas.height) {
      const limite = posicao + alturaPaginaPx
      let fim: number
      if (limite >= canvas.height) {
        fim = canvas.height
      } else {
        // Maior ponto de quebra que ainda cabe na página; se não houver, corta no limite
        const candidatos = pontosCanvas.filter((p) => p > posicao + alturaPaginaPx * 0.25 && p <= limite)
        fim = candidatos.length ? candidatos[candidatos.length - 1] : limite
      }

      const alturaFatia = fim - posicao
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
        MARGEM_LATERAL,
        MARGEM_SUPERIOR,
        LARGURA_CONTEUDO_MM,
        alturaFatia / pxPorMmCanvas
      )
      primeira = false
      posicao = fim
    }

    pdf.save(nomeArquivo)
  } finally {
    document.body.removeChild(palco)
  }
}
