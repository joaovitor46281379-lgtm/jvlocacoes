import { createPortal } from 'react-dom'
import { formatarData, formatarValor, VALOR_REPOSICAO_MESA, VALOR_REPOSICAO_CADEIRA } from '@shared/lib/validations'
import type { Pedido, PerdaQuebra } from '@shared/types'

interface ContratoTermicoProps {
  pedido: Pedido
  perdas: PerdaQuebra[]
  cpfLocatario?: string
  tipoDocLocatario?: 'CPF' | 'CNPJ'
  cpfLocador?: string
  nomeLocador?: string
}

export function ContratoTermico({ pedido, perdas, cpfLocatario, tipoDocLocatario = 'CPF', cpfLocador, nomeLocador }: ContratoTermicoProps) {
  const totalPrejuizo = perdas.reduce((acc, p) => acc + (p.valorPrejuizo || 0), 0)

  const dataAtual = new Date()
  const meses = [
    'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
    'jul', 'ago', 'set', 'out', 'nov', 'dez'
  ]
  const dataExtenso = `${dataAtual.getDate()}/${meses[dataAtual.getMonth()]}/${dataAtual.getFullYear()}`

  return createPortal(
    <div className="contrato-termico-print">
      <style>{`
        .contrato-termico-print { display: none; }
        @media print {
          body > *:not(.contrato-termico-print) { display: none !important; }
          .contrato-termico-print { display: block !important; }
        }
        @page { size: 80mm auto; margin: 3mm 2mm; }
        .contrato-termico {
          font-family: 'Courier New', Courier, monospace;
          font-size: 9pt;
          line-height: 1.4;
          color: #000;
          font-weight: 700;
          -webkit-text-stroke: 0.3pt #000;
          width: 100%;
          background: white;
        }
        .contrato-termico .centro { text-align: center; }
        .contrato-termico .negrito { font-weight: bold; }
        .contrato-termico .sep { border-top: 1.5px dashed #000; margin: 4pt 0; }
        .contrato-termico .linha { margin-bottom: 2pt; word-break: break-word; }
        .contrato-termico .titulo { font-size: 10pt; font-weight: bold; text-align: center; text-transform: uppercase; }
        .contrato-termico .assinatura { margin-top: 8pt; }
        .contrato-termico .linha-ass { border-top: 2px solid #000; margin-bottom: 2pt; margin-top: 16pt; }
        .contrato-termico .clausula { font-size: 8pt; text-align: justify; margin-bottom: 3pt; word-break: break-word; }
        .contrato-termico .linha, .contrato-termico .sep, .contrato-termico .clausula,
        .contrato-termico .assinatura, .contrato-termico .centro, .contrato-termico .titulo { break-inside: avoid; }
      `}</style>

      <div className="contrato-termico">
      {/* Logo + cabeçalho */}
      <div className="centro" style={{ marginBottom: 4 }}>
        <img src="/admin/logo.jpeg" alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} />
      </div>
      <div className="titulo">JV Locações</div>
      <div className="centro" style={{ fontSize: '8pt' }}>Piraquara – PR</div>

      <div className="sep" />

      <div className="centro negrito">CONTRATO DE LOCAÇÃO</div>
      <div className="centro" style={{ fontSize: '8pt' }}>Nº {pedido.id.substring(0, 8).toUpperCase()}</div>

      <div className="sep" />

      {/* Locatário */}
      <div className="linha negrito">LOCATÁRIO</div>
      <div className="linha">{pedido.nomeSolicitante}</div>
      {cpfLocatario && <div className="linha">{tipoDocLocatario}: {cpfLocatario}</div>}
      <div className="linha">Tel: {pedido.whatsapp}</div>
      <div className="linha" style={{ fontSize: '8pt' }}>{pedido.endereco}</div>

      <div className="sep" />

      {/* Período */}
      <div className="linha negrito">PERÍODO</div>
      <div className="linha">Entrega: {formatarData(new Date(pedido.dataInicio))}</div>
      <div className="linha">Devolução: {formatarData(new Date(pedido.dataFim))}</div>

      <div className="sep" />

      {/* Itens */}
      <div className="linha negrito">ITENS</div>
      <div className="linha">{pedido.kit?.descricao || 'N/A'} × {pedido.quantidade}</div>
      {pedido.mesasAvulsas > 0 && <div className="linha">+ {pedido.mesasAvulsas} mesa(s) avulsa(s)</div>}
      {pedido.cadeirasAvulsas > 0 && <div className="linha">+ {pedido.cadeirasAvulsas} cadeira(s) avulsa(s)</div>}

      <div className="sep" />

      {/* Valores */}
      <div className="linha negrito">VALORES</div>
      <div className="linha">Kit: {formatarValor(pedido.valorKit)} × {pedido.quantidade}</div>
      <div className="linha">Frete: {formatarValor(pedido.valorFrete)}</div>
      {pedido.valorAvulsos > 0 && <div className="linha">Avulsos: {formatarValor(pedido.valorAvulsos)}</div>}
      <div className="linha negrito">TOTAL: {formatarValor(pedido.total)}</div>
      <div className="linha">Pagamento: {pedido.formaPagamento}</div>

      {/* Danos */}
      {perdas.length > 0 && (
        <>
          <div className="sep" />
          <div className="linha negrito">DANOS/PERDAS</div>
          {perdas.map((p) => (
            <div key={p.id} className="linha" style={{ fontSize: '8pt' }}>
              {p.tipo}: {p.quantidade} {p.item} {p.valorPrejuizo ? `- ${formatarValor(p.valorPrejuizo)}` : ''}
            </div>
          ))}
          {totalPrejuizo > 0 && <div className="linha negrito">Total danos: {formatarValor(totalPrejuizo)}</div>}
        </>
      )}

      <div className="sep" />

      {/* Cláusulas resumidas */}
      <div className="clausula">Devolver itens em boas condições. Mesa: R${VALOR_REPOSICAO_MESA} | Cadeira: R${VALOR_REPOSICAO_CADEIRA} em caso de perda ou dano.</div>

      <div className="sep" />

      <div className="centro" style={{ fontSize: '8pt' }}>{dataExtenso}</div>

      {/* Assinaturas */}
      <div className="assinatura">
        <div className="linha-ass" />
        <div className="centro" style={{ fontSize: '8pt' }}>{nomeLocador || 'JV Locações'} (Locador)</div>
        {cpfLocador && <div className="centro" style={{ fontSize: '8pt' }}>CPF: {cpfLocador}</div>}
      </div>

      <div className="assinatura">
        <div className="linha-ass" />
        <div className="centro" style={{ fontSize: '8pt' }}>{pedido.nomeSolicitante} (Locatário)</div>
        {cpfLocatario && <div className="centro" style={{ fontSize: '8pt' }}>{tipoDocLocatario}: {cpfLocatario}</div>}
      </div>

      <div className="sep" style={{ marginTop: 8 }} />
      <div className="centro" style={{ fontSize: '7pt', color: '#000' }}>
        Doc gerado em {formatarData(new Date())}
      </div>
      </div>
    </div>,
    document.body
  )
}
