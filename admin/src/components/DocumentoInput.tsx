export type TipoDocumento = 'CPF' | 'CNPJ'

/** Aplica a máscara de CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00) enquanto digita. */
export function mascararDocumento(valor: string, tipo: TipoDocumento): string {
  const d = valor.replace(/\D/g, '').slice(0, tipo === 'CPF' ? 11 : 14)
  if (tipo === 'CPF') {
    return d
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4')
  }
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5')
}

interface DocumentoInputProps {
  tipo: TipoDocumento
  valor: string
  onTipoChange: (tipo: TipoDocumento) => void
  onValorChange: (valor: string) => void
  label?: string
}

/** Seletor CPF/CNPJ + campo com máscara. */
export function DocumentoInput({ tipo, valor, onTipoChange, onValorChange, label }: DocumentoInputProps) {
  return (
    <div>
      <label className="block text-sm text-slate-600 mb-1">{label ?? `${tipo} (opcional)`}</label>
      <div className="flex gap-2">
        <select
          value={tipo}
          onChange={(e) => {
            const novo = e.target.value as TipoDocumento
            onTipoChange(novo)
            onValorChange(mascararDocumento(valor, novo))
          }}
          className="border border-slate-300 rounded-md px-2 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          <option value="CPF">CPF</option>
          <option value="CNPJ">CNPJ</option>
        </select>
        <input
          type="text"
          inputMode="numeric"
          value={valor}
          onChange={(e) => onValorChange(mascararDocumento(e.target.value, tipo))}
          placeholder={tipo === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'}
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>
    </div>
  )
}
