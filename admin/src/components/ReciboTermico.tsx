import { createPortal } from 'react-dom'

interface ReciboTermicoProps {
  numero: string
  texto: string
  dataEntrega: string
  dataDevolucao: string
  endereco: string
  formaPagamento: string
  dataExtenso: string
  dataEmissao: string
  nomeLocador: string
  cpfLocador?: string
  tipoDocPagador?: 'CPF' | 'CNPJ'
  docPagador?: string
}

/**
 * Recibo no formato de bobina térmica (80mm).
 *
 * É renderizado num portal direto no <body> e, na hora de imprimir, todo o resto da
 * tela é escondido com display:none. Assim o recibo ocupa só o próprio tamanho e a
 * impressora térmica não solta páginas em branco depois dele.
 */
export function ReciboTermico({
  numero,
  texto,
  dataEntrega,
  dataDevolucao,
  endereco,
  formaPagamento,
  dataExtenso,
  dataEmissao,
  nomeLocador,
  cpfLocador,
  tipoDocPagador = 'CPF',
  docPagador,
}: ReciboTermicoProps) {
  return createPortal(
    <div className="recibo-termico-print">
      <style>{`
        .recibo-termico-print { display: none; }
        @media print {
          body > *:not(.recibo-termico-print) { display: none !important; }
          .recibo-termico-print { display: block !important; }
        }
        @page { size: 80mm auto; margin: 3mm 2mm; }
        .recibo-termico {
          font-family: 'Courier New', Courier, monospace;
          font-size: 9pt;
          line-height: 1.4;
          color: #000;
          font-weight: 700;
          -webkit-text-stroke: 0.3pt #000;
          width: 100%;
          background: white;
        }
        .recibo-termico .centro { text-align: center; }
        .recibo-termico .negrito { font-weight: bold; }
        .recibo-termico .sep { border-top: 1.5px dashed #000; margin: 4pt 0; }
        .recibo-termico .linha { margin-bottom: 2pt; word-break: break-word; }
        .recibo-termico .titulo { font-size: 10pt; font-weight: bold; text-align: center; text-transform: uppercase; }
        .recibo-termico .texto { font-size: 9pt; text-align: justify; margin: 4pt 0; word-break: break-word; }
        .recibo-termico .assinatura { margin-top: 8pt; }
        .recibo-termico .linha, .recibo-termico .sep, .recibo-termico .texto,
        .recibo-termico .assinatura, .recibo-termico .centro, .recibo-termico .titulo { break-inside: avoid; }
        .recibo-termico .linha-ass { border-top: 2px solid #000; margin-bottom: 2pt; margin-top: 16pt; }
      `}</style>

      <div className="recibo-termico">
        <div className="centro" style={{ marginBottom: 4 }}>
          <img src="/admin/logo.jpeg" alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} />
        </div>
        <div className="titulo">{nomeLocador || 'JV Locações'}</div>
        <div className="centro" style={{ fontSize: '8pt' }}>Piraquara – PR</div>

        <div className="sep" />

        <div className="centro negrito">RECIBO DE PAGAMENTO</div>
        <div className="centro" style={{ fontSize: '8pt' }}>Nº {numero}</div>

        <div className="sep" />

        <div className="texto">{texto}</div>

        <div className="sep" />

        {docPagador && <div className="linha">{tipoDocPagador}: {docPagador}</div>}
        <div className="linha">Entrega: {dataEntrega}</div>
        <div className="linha">Devolução: {dataDevolucao}</div>
        <div className="linha" style={{ fontSize: '8pt' }}>Endereço: {endereco}</div>
        <div className="linha">Pagamento: {formaPagamento}</div>

        <div className="sep" />

        <div className="centro" style={{ fontSize: '8pt' }}>{dataExtenso}</div>

        <div className="assinatura">
          <div className="linha-ass" />
          <div className="centro" style={{ fontSize: '8pt' }}>{nomeLocador || 'JV Locações'} (Locador)</div>
          {cpfLocador && <div className="centro" style={{ fontSize: '8pt' }}>CPF: {cpfLocador}</div>}
        </div>

        <div className="sep" style={{ marginTop: 8 }} />
        <div className="centro" style={{ fontSize: '7pt', color: '#000' }}>
          Doc gerado em {dataEmissao}
        </div>
      </div>
    </div>,
    document.body
  )
}
