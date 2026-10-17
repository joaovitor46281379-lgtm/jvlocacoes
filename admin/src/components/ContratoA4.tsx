import { formatarData, formatarValor, VALOR_REPOSICAO_MESA, VALOR_REPOSICAO_CADEIRA } from '@shared/lib/validations'
import type { Pedido, PerdaQuebra } from '@shared/types'

interface ContratoA4Props {
  pedido: Pedido
  perdas: PerdaQuebra[]
  cpfLocatario?: string
  tipoDocLocatario?: 'CPF' | 'CNPJ'
  cpfLocador?: string
  nomeLocador?: string
}

export function ContratoA4({ pedido, perdas, cpfLocatario, tipoDocLocatario = 'CPF', cpfLocador, nomeLocador }: ContratoA4Props) {
  const totalPrejuizo = perdas.reduce((acc, p) => acc + (p.valorPrejuizo || 0), 0)

  const dataAtual = new Date()
  const meses = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ]
  const dataExtenso = `Piraquara, ${dataAtual.getDate()} de ${meses[dataAtual.getMonth()]} de ${dataAtual.getFullYear()}`

  return (
    <div className="contrato-a4">
      {/* Estilos (usado só para gerar o PDF) */}
      <style>{`
        .contrato-a4 {
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          line-height: 1.6;
          color: #000;
          width: 100%;
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          background: white;
        }
        .contrato-a4 h1 { font-size: 14pt; text-align: center; text-transform: uppercase; margin-bottom: 4pt; }
        .contrato-a4 h2 { font-size: 13pt; text-align: center; margin-bottom: 16pt; }
        .contrato-a4 h3 { font-size: 12pt; text-transform: uppercase; margin: 16pt 0 8pt; border-bottom: 1px solid #000; padding-bottom: 4pt; }
        .contrato-a4 .linha { margin-bottom: 6pt; }
        .contrato-a4 .clausula { margin-bottom: 10pt; text-align: justify; }
        .contrato-a4 .assinaturas { margin-top: 32pt; display: flex; justify-content: space-between; gap: 20mm; }
        .contrato-a4 .assinatura-bloco { flex: 1; text-align: center; }
        .contrato-a4 .linha-assinatura { border-top: 1px solid #000; margin-bottom: 4pt; }
        .contrato-a4 .danos-item { border: 1px solid #ccc; padding: 6pt; margin-bottom: 4pt; box-sizing: border-box; }
        .contrato-a4 .divider { border-top: 1px solid #000; margin: 12pt 0; }
        .contrato-a4 .logo-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8pt; }
        .contrato-a4 .data-local { text-align: right; margin: 24pt 0 8pt; font-style: italic; }
      `}</style>

      {/* Cabeçalho */}
      <div className="logo-header">
        <img src="/admin/logo.jpeg" alt="JV Locações" style={{ width: 60, height: 60, objectFit: 'contain', borderRadius: 8 }} />
        <div style={{ textAlign: 'right', fontSize: '10pt', color: '#555' }}>
          <div style={{ fontWeight: 'bold', fontSize: '11pt', color: '#000' }}>JV Locações</div>
          <div>Piraquara – PR</div>
        </div>
      </div>

      <div className="divider" />

      <h1>Contrato de Locação de Mesas e Cadeiras</h1>
      <h2>Nº {pedido.id.substring(0, 8).toUpperCase()}</h2>

      {/* Locador */}
      <h3>I — Dados do Locador</h3>
      <div className="linha"><strong>Nome/Razão Social:</strong> {nomeLocador || 'JV Locações'}</div>
      {cpfLocador && <div className="linha"><strong>CPF:</strong> {cpfLocador}</div>}
      <div className="linha"><strong>Cidade:</strong> Piraquara – PR</div>

      {/* Locatário */}
      <h3>II — Dados do Locatário</h3>
      <div className="linha"><strong>Nome:</strong> {pedido.nomeSolicitante}</div>
      <div className="linha"><strong>WhatsApp:</strong> {pedido.whatsapp}</div>
      <div className="linha"><strong>Endereço de Entrega:</strong> {pedido.endereco}</div>
      {cpfLocatario && <div className="linha"><strong>{tipoDocLocatario}:</strong> {cpfLocatario}</div>}

      {/* Período */}
      <h3>III — Período da Locação</h3>
      <div className="linha"><strong>Data de Entrega:</strong> {formatarData(new Date(pedido.dataInicio))}</div>
      <div className="linha"><strong>Data de Devolução:</strong> {formatarData(new Date(pedido.dataFim))}</div>

      {/* Itens */}
      <h3>IV — Itens Locados</h3>
      <div className="linha"><strong>Kit:</strong> {pedido.kit?.descricao || 'N/A'}</div>
      <div className="linha"><strong>Quantidade:</strong> {pedido.quantidade} kit(s)</div>
      {pedido.mesasAvulsas > 0 && <div className="linha"><strong>Mesas Avulsas:</strong> {pedido.mesasAvulsas}</div>}
      {pedido.cadeirasAvulsas > 0 && <div className="linha"><strong>Cadeiras Avulsas:</strong> {pedido.cadeirasAvulsas}</div>}
      <div className="linha"><strong>Valor do Kit:</strong> {formatarValor(pedido.valorKit)} × {pedido.quantidade}</div>
      <div className="linha"><strong>Frete:</strong> {formatarValor(pedido.valorFrete)}</div>
      {pedido.valorAvulsos > 0 && <div className="linha"><strong>Itens Avulsos:</strong> {formatarValor(pedido.valorAvulsos)}</div>}
      <div className="linha"><strong>Valor Total:</strong> {formatarValor(pedido.total)}</div>
      <div className="linha"><strong>Forma de Pagamento:</strong> {pedido.formaPagamento}</div>

      {/* Danos/Perdas */}
      {perdas.length > 0 && (
        <>
          <h3>V — Registro de Danos e Perdas</h3>
          {perdas.map((p) => (
            <div key={p.id} className="danos-item">
              <strong>{p.tipo}:</strong> {p.quantidade} {p.item}(s)
              {p.descricao && <> — {p.descricao}</>}
              {p.valorPrejuizo && <> — <strong>{formatarValor(p.valorPrejuizo)}</strong></>}
            </div>
          ))}
          <div className="linha"><strong>Total de Prejuízo:</strong> {formatarValor(totalPrejuizo)}</div>
        </>
      )}

      {/* Cláusulas */}
      <h3>{perdas.length > 0 ? 'VI' : 'V'} — Termos e Condições</h3>
      <div className="clausula">
        <strong>1.</strong> O LOCATÁRIO se compromete a devolver os itens nas mesmas condições em que foram entregues,
        limpos e sem danos.
      </div>
      <div className="clausula">
        <strong>2.</strong> Em caso de perda, quebra ou dano aos itens locados, o LOCATÁRIO se responsabiliza
        pelo pagamento do valor de reposição correspondente.
      </div>
      <div className="clausula">
        <strong>3.</strong> Valores de reposição: Mesa — {formatarValor(VALOR_REPOSICAO_MESA)} | Cadeira — {formatarValor(VALOR_REPOSICAO_CADEIRA)}.
      </div>
      <div className="clausula">
        <strong>4.</strong> O não cumprimento das obrigações previstas neste contrato poderá resultar nas
        medidas legais cabíveis.
      </div>

      {/* Data e local */}
      <div className="data-local">{dataExtenso}</div>

      {/* Assinaturas */}
      <div className="assinaturas">
        <div className="assinatura-bloco">
          <div style={{ height: 40 }} />
          <div className="linha-assinatura" />
          <div><strong>{nomeLocador || 'JV Locações'}</strong></div>
          <div style={{ fontSize: '10pt' }}>Locador</div>
          {cpfLocador && <div style={{ fontSize: '10pt' }}>CPF: {cpfLocador}</div>}
        </div>
        <div className="assinatura-bloco">
          <div style={{ height: 40 }} />
          <div className="linha-assinatura" />
          <div><strong>{pedido.nomeSolicitante}</strong></div>
          <div style={{ fontSize: '10pt' }}>Locatário</div>
          {cpfLocatario && <div style={{ fontSize: '10pt' }}>{tipoDocLocatario}: {cpfLocatario}</div>}
        </div>
      </div>

      <div className="divider" style={{ marginTop: 24 }} />
      <div style={{ fontSize: '9pt', color: '#666', textAlign: 'center' }}>
        Documento gerado em {formatarData(new Date())} — JV Locações
      </div>
    </div>
  )
}
