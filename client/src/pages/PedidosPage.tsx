import { useState } from "react";
import { usePedidos, useCancelarPedido } from "@shared/hooks";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatarData, formatarValor } from "@shared/lib/validations";
import {
  Package,
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  X,
  Star,
} from "lucide-react";
import type { StatusPedido } from "@shared/types";
import AvaliacaoDialog from "@/components/AvaliacaoDialog";

const STATUS_COLORS: Record<StatusPedido, string> = {
  PENDENTE: "bg-yellow-100 text-yellow-800 border-yellow-300",
  AGUARDANDO_ENTREGA: "bg-blue-100 text-blue-800 border-blue-300",
  AGUARDANDO_RETIRADA: "bg-purple-100 text-purple-800 border-purple-300",
  CONCLUIDO: "bg-green-100 text-green-800 border-green-300",
  CANCELADO: "bg-red-100 text-red-800 border-red-300",
};

const STATUS_DOT: Record<StatusPedido, string> = {
  PENDENTE: "bg-yellow-400",
  AGUARDANDO_ENTREGA: "bg-blue-500",
  AGUARDANDO_RETIRADA: "bg-purple-500",
  CONCLUIDO: "bg-green-500",
  CANCELADO: "bg-red-500",
};

const STATUS_LABELS: Record<StatusPedido, string> = {
  PENDENTE: "Pendente",
  AGUARDANDO_ENTREGA: "Aguardando Entrega",
  AGUARDANDO_RETIRADA: "Aguardando Retirada",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

const ALL_STATUSES: StatusPedido[] = [
  "PENDENTE",
  "AGUARDANDO_ENTREGA",
  "AGUARDANDO_RETIRADA",
  "CONCLUIDO",
  "CANCELADO",
];

type FilterStatus = "TODOS" | StatusPedido;

export default function PedidosPage() {
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("TODOS");
  const [avaliacaoDialogOpen, setAvaliacaoDialogOpen] = useState(false);
  const [pedidoParaAvaliar, setPedidoParaAvaliar] = useState<string | null>(
    null
  );

  // Filtrar pedidos pelo userId do usuário logado
  const { data: pedidosData, isLoading } = usePedidos(
    { userId: user?.id },
    { limit: 100 }
  );
  const cancelarMutation = useCancelarPedido();

  const handleAbrirAvaliacao = (pedidoId: string) => {
    setPedidoParaAvaliar(pedidoId);
    setAvaliacaoDialogOpen(true);
  };

  const pedidosArray = pedidosData?.data || [];
  const pedidosFiltrados =
    statusFilter === "TODOS"
      ? pedidosArray
      : pedidosArray.filter((p: any) => p.status === statusFilter);

  const handleCancelar = async (pedidoId: string) => {
    if (!confirm("Tem certeza que deseja cancelar este pedido?")) return;

    try {
      await cancelarMutation.mutateAsync(pedidoId);
    } catch (error) {
      alert("Erro ao cancelar pedido");
    }
  };

  const handleWhatsApp = (pedido: any) => {
    const message = `
*Pedido #${pedido.id.slice(0, 8)}*

📅 *Data:* ${formatarData(pedido.data)}
👤 *Nome:* ${pedido.nomeSolicitante}
📍 *Endereço:* ${pedido.endereco}
📦 *Kit:* ${pedido.kit?.descricao || "N/A"}
🔢 *Quantidade:* ${pedido.quantidade}
💰 *Total:* ${formatarValor(pedido.total)}
    `.trim();

    const phoneNumber = "5541992699132"; // TODO: Número real
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;
    window.open(url, "_blank");
  };

  if (isLoading) {
    return (
      <div className="mx-auto min-h-svh max-w-4xl px-4 py-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-muted-foreground">Carregando pedidos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-svh max-w-4xl px-4 py-6">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Meus Pedidos</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe o status dos seus agendamentos
        </p>
      </header>

      {/* Filtro dropdown */}
      <div className="mb-6">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as FilterStatus)}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                Todos
              </div>
            </SelectItem>
            {ALL_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT[status]}`} />
                  {STATUS_LABELS[status]}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Pedidos */}
      {pedidosFiltrados.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 font-semibold">Nenhum pedido encontrado</h3>
          <p className="text-sm text-muted-foreground">
            {statusFilter === "TODOS"
              ? "Você ainda não fez nenhum pedido."
              : `Nenhum pedido com status "${STATUS_LABELS[statusFilter]}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidosFiltrados.map((pedido: any) => {
            const isExpanded = expandedId === pedido.id;
            const podeCancelar = ["PENDENTE", "AGUARDANDO_ENTREGA"].includes(
              pedido.status
            );
            const avaliacaoFeita = Array.isArray(pedido.avaliacao)
              ? pedido.avaliacao[0]
              : pedido.avaliacao
            const podeAvaliar =
              pedido.status === "CONCLUIDO" && !avaliacaoFeita;

            return (
              <div
                key={pedido.id}
                className="rounded-lg border bg-card shadow-sm"
              >
                {/* Card Header */}
                <div className="p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <div className="mb-1 text-xs text-muted-foreground">
                        Pedido #{pedido.id.slice(0, 8)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">
                          {formatarData(new Date(pedido.data_inicio))}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${
                        STATUS_COLORS[pedido.status as StatusPedido]
                      }`}
                    >
                      {STATUS_LABELS[pedido.status as StatusPedido]}
                    </span>
                  </div>

                  <div className="mb-3 space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <Package className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <span>
                        {pedido.kit?.descricao} x{pedido.quantidade}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {pedido.endereco}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold text-primary">
                      {formatarValor(pedido.total)}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : pedido.id)
                      }
                    >
                      {isExpanded ? (
                        <>
                          Ver menos <ChevronUp className="ml-1 h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Ver mais <ChevronDown className="ml-1 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Detalhes Expandidos */}
                {isExpanded && (
                  <div className="border-t bg-muted/50 p-4">
                    <div className="mb-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Vila:</span>
                        <span className="font-medium">{pedido.vila?.nome}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Frete:</span>
                        <span className="font-medium">
                          {formatarValor(pedido.vila?.valor_frete ?? pedido.vila?.valorFrete ?? 0)}
                        </span>
                      </div>
                      {(pedido.mesas_avulsas > 0 || pedido.mesasAvulsas > 0) && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Mesas avulsas:</span>
                          <span className="font-medium">
                            {pedido.mesas_avulsas ?? pedido.mesasAvulsas} un.
                          </span>
                        </div>
                      )}
                      {(pedido.cadeiras_avulsas > 0 || pedido.cadeirasAvulsas > 0) && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cadeiras avulsas:</span>
                          <span className="font-medium">
                            {pedido.cadeiras_avulsas ?? pedido.cadeirasAvulsas} un.
                          </span>
                        </div>
                      )}
                      {(pedido.valor_avulsos > 0 || pedido.valorAvulsos > 0) && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Valor itens avulsos:</span>
                          <span className="font-medium">
                            {formatarValor(pedido.valor_avulsos ?? pedido.valorAvulsos ?? 0)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Forma de pagamento:
                        </span>
                        <span className="font-medium">
                          {pedido.forma_pagamento || pedido.formaPagamento}
                        </span>
                      </div>
                      {pedido.observacoes && (
                        <div className="mt-3">
                          <span className="text-muted-foreground">
                            Observações:
                          </span>
                          <p className="mt-1 text-foreground">
                            {pedido.observacoes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Avaliação (se existir) */}
                    {avaliacaoFeita && (
                      <div className="mb-4 rounded-lg border bg-card p-3">
                        <div className="mb-2 flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < avaliacaoFeita.estrelas
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        {avaliacaoFeita.comentario && (
                          <p className="text-sm text-muted-foreground">
                            {avaliacaoFeita.comentario}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => handleWhatsApp(pedido)}
                      >
                        <MessageCircle className="h-4 w-4" />
                        Enviar WhatsApp
                      </Button>

                      {podeAvaliar && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleAbrirAvaliacao(pedido.id)}
                        >
                          <Star className="h-4 w-4" />
                          Avaliar Pedido
                        </Button>
                      )}

                      {podeCancelar && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleCancelar(pedido.id)}
                          disabled={cancelarMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                          {cancelarMutation.isPending
                            ? "Cancelando..."
                            : "Cancelar Pedido"}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog de Avaliação */}
      {pedidoParaAvaliar && (
        <AvaliacaoDialog
          pedidoId={pedidoParaAvaliar}
          open={avaliacaoDialogOpen}
          onOpenChange={setAvaliacaoDialogOpen}
        />
      )}
    </div>
  );
}
