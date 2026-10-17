import { useState, useEffect } from "react";
import { MonthSelector } from "@/components/MonthSelector";
import { YearSelector } from "@/components/YearSelector";
import { DayCalendar } from "@/components/DayCalendar";
import { QuantitySelector } from "@/components/QuantitySelector";
import { PriceCard } from "@/components/PriceCard";
import { AddressSelector } from "@/components/AddressSelector";
import { AddressFormDrawer } from "@/components/AddressFormDrawer";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useKits,
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  useConfirmarPedido,
  useDisponibilidadePeriodo,
} from "@shared/hooks";
import { usePerfil, useUpsertPerfil } from "@shared/hooks/use-perfil";
import { useConfiguracoes } from "@shared/hooks/use-configuracoes";
import { useAuth } from "@/contexts/AuthContext";
import { formatarData, formatarValor } from "@shared/lib/validations";
import type { Address } from "@shared/types";
import { Check, MessageCircle, Edit2 } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [quantity, setQuantity] = useState(3);
  const [showCards, setShowCards] = useState(false);
  const [isCardsVisible, setIsCardsVisible] = useState(false);
  const [isAddressDrawerOpen, setIsAddressDrawerOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");

  // Booking state
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<"PIX" | "DINHEIRO" | "CARTAO">("PIX");
  const [observacoes, setObservacoes] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdPedido, setCreatedPedido] = useState<any>(null);
  const [mesasAvulsas, setMesasAvulsas] = useState(0);
  const [cadeirasAvulsas, setCadeirasAvulsas] = useState(0);

  const userId = user?.id || "";

  const { data: kits, isLoading: kitsLoading } = useKits();
  const { data: addresses = [] } = useAddresses(userId);
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();
  const confirmarPedido = useConfirmarPedido();
  const { data: perfil } = usePerfil(userId);
  const upsertPerfil = useUpsertPerfil();
  const { data: config } = useConfiguracoes();
  const minKits = config?.qtd_minima_pedido ?? 3;

  const selectedAddress =
    addresses.find((addr) => addr.isDefault) || addresses[0] || null;

  const kitsLoaded = !kitsLoading && kits !== undefined;
  const kitFixo = kits?.[0] || null;
  const semKitsCadastrados = kitsLoaded && kits!.length === 0;

  // Disponibilidade para o período selecionado
  const periodoInicio = selectedDays.length > 0
    ? new Date(selectedYear, selectedMonth, selectedDays[0])
    : new Date();
  const periodoFim = selectedDays.length > 0
    ? new Date(selectedYear, selectedMonth, selectedDays[selectedDays.length - 1])
    : new Date();
  const { data: kitsDisponiveis } = useDisponibilidadePeriodo(periodoInicio, periodoFim);

  // Sincronizar quantidade mínima quando config carregar
  useEffect(() => {
    if (config?.qtd_minima_pedido && quantity < config.qtd_minima_pedido) {
      setQuantity(config.qtd_minima_pedido);
    }
  }, [config?.qtd_minima_pedido]);

  // Pré-preencher nome e whatsapp do perfil
  useEffect(() => {
    if (perfil) {
      setNome(perfil.nome || "");
      setWhatsapp(perfil.whatsapp || "");
    }
  }, [perfil]);

  // Animação cards
  useEffect(() => {
    if (selectedDays.length > 0 && (kitFixo || semKitsCadastrados)) {
      setShowCards(true);
      const fadeInTimer = setTimeout(() => {
        setIsCardsVisible(true);
      }, 10);
      return () => clearTimeout(fadeInTimer);
    } else {
      setIsCardsVisible(false);
      const fadeOutTimer = setTimeout(() => {
        setShowCards(false);
      }, 300);
      return () => clearTimeout(fadeOutTimer);
    }
  }, [selectedDays.length, kitFixo, semKitsCadastrados]);

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    if (year > currentYear) {
      setSelectedMonth(0);
    } else if (year === currentYear && selectedMonth < currentMonth) {
      setSelectedMonth(currentMonth);
    }
    setSelectedDays([]);
    setQuantity(minKits);
  };

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
    setSelectedDays([]);
    setQuantity(minKits);
  };

  const handleDayToggle = (day: number) => {
    setSelectedDays((prev) => {
      if (prev.length === 0) {
        return [day];
      }
      const minDay = prev[0];
      const maxDay = prev[prev.length - 1];
      if (prev.includes(day)) {
        // clique em dia já selecionado: reset para só esse dia
        return [day];
      }
      // expande o range para o novo dia
      const newMin = Math.min(minDay, day);
      const newMax = Math.max(maxDay, day);
      const range = [];
      for (let i = newMin; i <= newMax; i++) {
        range.push(i);
      }
      return range;
    });
  };

  const handleSaveAddress = async (address: {
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    vilaId: string;
    city: string;
    state: string;
    zipCode: string;
    reference: string;
  }) => {
    try {
      if (drawerMode === "edit" && editingAddress) {
        await updateAddress.mutateAsync({
          id: editingAddress.id,
          data: {
            street: address.street,
            number: address.number,
            complement: address.complement,
            neighborhood: address.neighborhood,
            vilaId: address.vilaId,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode,
            reference: address.reference,
          },
        });
      } else {
        await createAddress.mutateAsync({
          userId,
          data: {
            street: address.street,
            number: address.number,
            complement: address.complement,
            neighborhood: address.neighborhood,
            vilaId: address.vilaId,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode,
            reference: address.reference,
            isDefault: addresses.length === 0,
          },
        });
      }
      setIsAddressDrawerOpen(false);
      setEditingAddress(null);
      setDrawerMode("create");
    } catch (error) {
      console.error("Erro ao salvar endereço:", error);
      alert("Erro ao salvar endereço. Tente novamente.");
    }
  };

  const handleEditAddress = () => {
    if (selectedAddress) {
      setEditingAddress(selectedAddress);
      setDrawerMode("edit");
      setIsAddressDrawerOpen(true);
    }
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setDrawerMode("create");
    setIsAddressDrawerOpen(true);
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      await deleteAddress.mutateAsync({ id: addressId, userId });
    } catch (error) {
      console.error("Erro ao deletar endereço:", error);
      alert("Erro ao deletar endereço. Tente novamente.");
    }
  };

  const formatWhatsApp = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4,5})(\d{4})$/, "$1-$2");
    }
    return value;
  };

  // Cálculos de valor
  const valorFrete = selectedAddress?.vila
    ? Number((selectedAddress.vila as any).valor_frete ?? selectedAddress.vila.valorFrete ?? 0)
    : 0;
  const numDias = selectedDays.length || 1;
  const valorKit = Number(config?.preco_kit ?? 0) * quantity * numDias;
  const precoMesaAvulsa = Number(config?.preco_mesa_avulsa ?? 0);
  const precoCadeiraAvulsa = Number(config?.preco_cadeira_avulsa ?? 0);
  const valorAvulsos = (mesasAvulsas * precoMesaAvulsa + cadeirasAvulsas * precoCadeiraAvulsa) * numDias;
  const valorTotal = valorKit + valorFrete + valorAvulsos;

  const endereco = selectedAddress
    ? `${selectedAddress.street}, ${selectedAddress.number}${selectedAddress.complement ? ` - ${selectedAddress.complement}` : ""}, ${selectedAddress.neighborhood}, ${selectedAddress.city}/${selectedAddress.state} - CEP: ${selectedAddress.zipCode}${selectedAddress.reference ? ` (Ref: ${selectedAddress.reference})` : ""}`
    : "";

  const dataInicio = selectedDays.length > 0
    ? new Date(selectedYear, selectedMonth, selectedDays[0])
    : null;
  const dataFim = selectedDays.length > 0
    ? new Date(selectedYear, selectedMonth, selectedDays[selectedDays.length - 1])
    : null;

  const handleConfirmar = async () => {
    if (!dataInicio || !dataFim || !kitFixo || !selectedAddress) return;

    try {
      const result = await confirmarPedido.mutateAsync({
        nomeSolicitante: nome,
        whatsapp,
        endereco,
        vilaId: selectedAddress.vilaId || "",
        kitId: kitFixo.id,
        quantidade: quantity,
        mesasAvulsas,
        cadeirasAvulsas,
        valorAvulsos,
        dataInicio,
        dataFim,
        formaPagamento,
        observacoes: observacoes || undefined,
        userId: user?.id || "",
        valorKit,
        valorFrete,
        total: valorTotal,
      });

      // Salvar perfil
      if (user?.id) {
        upsertPerfil.mutateAsync({ userId: user.id, nome, whatsapp });
      }

      setCreatedPedido({
        ...result,
        nomeSolicitante: nome,
        whatsapp,
        endereco,
        kit: kitFixo,
        vila: selectedAddress.vila,
        quantidade: quantity,
        formaPagamento,
        observacoes,
        total: valorTotal,
        dataInicio,
        dataFim,
      });
      setShowPreview(false);
      setShowSuccess(true);
    } catch (error: any) {
      alert(error?.message || "Erro ao confirmar pedido");
    }
  };

  const handleWhatsAppShare = () => {
    if (!createdPedido) return;
    const message = `
*Novo Pedido - JV Locações*

📅 *Entrega:* ${formatarData(new Date(createdPedido.dataInicio))}
📅 *Devolução:* ${formatarData(new Date(createdPedido.dataFim))}
👤 *Nome:* ${createdPedido.nomeSolicitante}
📍 *Endereço:* ${createdPedido.endereco}
🏘️ *Vila:* ${createdPedido.vila?.nome || "N/A"}
📦 *Kit:* ${createdPedido.kit?.descricao || "N/A"}
🔢 *Quantidade:* ${createdPedido.quantidade}
💳 *Forma de pagamento:* ${createdPedido.formaPagamento}
💰 *Valor total:* ${formatarValor(createdPedido.total)}
${createdPedido.observacoes ? `📝 *Observações:* ${createdPedido.observacoes}` : ""}
    `.trim();

    const phoneNumber = "5541992699132";
    window.open(
      `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  const handleVoltar = () => {
    setShowSuccess(false);
    setShowPreview(false);
    setSelectedDays([]);
    setQuantity(minKits);
    setNome(perfil?.nome || "");
    setWhatsapp(perfil?.whatsapp || "");
    setFormaPagamento("PIX");
    setObservacoes("");
    setCreatedPedido(null);
    setMesasAvulsas(0);
    setCadeirasAvulsas(0);
  };

  // ============ SUCCESS SCREEN ============
  if (showSuccess) {
    return (
      <div className="flex min-h-svh items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="mb-2 text-xl font-bold">Agendamento confirmado!</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Seu agendamento foi confirmado com sucesso.
          </p>
          <div className="space-y-3">
            <Button
              onClick={handleWhatsAppShare}
              className="w-full gap-2 bg-green-600 hover:bg-green-700"
            >
              <MessageCircle className="h-5 w-5" />
              Enviar pelo WhatsApp
            </Button>
            <Button onClick={handleVoltar} variant="outline" className="w-full">
              Voltar para o início
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ============ PREVIEW SCREEN ============
  if (showPreview && dataInicio && dataFim && kitFixo) {
    return (
      <div className="mx-auto min-h-svh max-w-md px-4 py-6">
        <h1 className="text-xl font-bold mb-4">Revisar Pedido</h1>

        <div className="space-y-3">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="mb-2 font-semibold text-sm text-slate-500">Período</h3>
            <div className="text-sm">
              <span className="font-medium">{formatarData(dataInicio)}</span>
              {dataInicio.getTime() !== dataFim.getTime() && (
                <> até <span className="font-medium">{formatarData(dataFim)}</span></>
              )}
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="mb-2 font-semibold text-sm text-slate-500">Dados pessoais</h3>
            <div className="text-sm space-y-1">
              <div><span className="text-muted-foreground">Nome: </span><span className="font-medium">{nome}</span></div>
              <div><span className="text-muted-foreground">WhatsApp: </span><span className="font-medium">{whatsapp}</span></div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="mb-2 font-semibold text-sm text-slate-500">Local</h3>
            <div className="text-sm">
              <span className="font-medium">{endereco}</span>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="mb-2 font-semibold text-sm text-slate-500">Pedido</h3>
            <div className="text-sm space-y-1">
              <div><span className="text-muted-foreground">Kit: </span><span className="font-medium">{kitFixo.descricao}</span></div>
              <div><span className="text-muted-foreground">Quantidade: </span><span className="font-bold">{quantity} kits</span></div>
              <div><span className="text-muted-foreground">Pagamento: </span><span className="font-medium">{formaPagamento}</span></div>
              {observacoes && <div><span className="text-muted-foreground">Observações: </span><span className="font-medium">{observacoes}</span></div>}
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="mb-2 font-semibold text-sm text-slate-500">Resumo financeiro</h3>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kit ({quantity}x)</span>
                <span>{formatarValor(valorKit)}</span>
              </div>
              {valorAvulsos > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Avulsos ({mesasAvulsas > 0 ? `${mesasAvulsas} mesa${mesasAvulsas !== 1 ? "s" : ""}` : ""}{mesasAvulsas > 0 && cadeirasAvulsas > 0 ? " + " : ""}{cadeirasAvulsas > 0 ? `${cadeirasAvulsas} cadeira${cadeirasAvulsas !== 1 ? "s" : ""}` : ""})
                  </span>
                  <span>{formatarValor(valorAvulsos)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frete</span>
                <span>{formatarValor(valorFrete)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-primary">{formatarValor(valorTotal)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => setShowPreview(false)} variant="outline" className="flex-1 gap-2" disabled={confirmarPedido.isPending}>
              <Edit2 className="h-4 w-4" />
              Editar
            </Button>
            <Button onClick={handleConfirmar} className="flex-1 gap-2" disabled={confirmarPedido.isPending}>
              <Check className="h-4 w-4" />
              {confirmarPedido.isPending ? "Confirmando..." : "Confirmar"}
            </Button>
          </div>

          {confirmarPedido.isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-600">
                {confirmarPedido.error?.message || "Erro desconhecido"}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============ MAIN SCREEN ============
  const diasDaSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const diaDaSemanaAtual = diasDaSemana[currentDate.getDay()];
  const mesesAbreviados = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  const renderReservaInfo = () => {
    if (selectedDays.length === 0) {
      return (
        <div className="text-sm text-muted-foreground">
          Selecione os dias que deseja reservar os kits
        </div>
      );
    }
    const primeirodia = selectedDays[0];
    const ultimoDia = selectedDays[selectedDays.length - 1];
    const mesAbreviado = mesesAbreviados[selectedMonth];
    if (selectedDays.length === 1) {
      return <div className="text-lg font-medium">Reserva para o dia {primeirodia}/{mesAbreviado}</div>;
    }
    return (
      <>
        <div className="text-lg font-medium">Reserva do dia {primeirodia}/{mesAbreviado}</div>
        <div className="text-sm text-muted-foreground">Até o dia {ultimoDia}/{mesAbreviado}</div>
      </>
    );
  };

  const semKitsDisponiveis = selectedDays.length > 0 && kitsDisponiveis !== undefined && kitsDisponiveis === 0;
  const canProceed = selectedDays.length > 0 && selectedAddress && nome.length >= 3 && whatsapp.length >= 10 && !semKitsDisponiveis;

  return (
    <div className="flex min-h-screen items-start justify-center p-3 pt-6">
      <div className="w-full max-w-md flex flex-col gap-3">
        {/* Seletores de mês e ano */}
        <div className="flex gap-3">
          <div className="flex-1">
            <MonthSelector selectedMonth={selectedMonth} selectedYear={selectedYear} onMonthChange={handleMonthChange} />
          </div>
          <div className="flex-1">
            <YearSelector selectedYear={selectedYear} onYearChange={handleYearChange} />
          </div>
        </div>

        {/* Calendário */}
        <DayCalendar
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          selectedDays={selectedDays}
          onDayToggle={handleDayToggle}
        />

        {/* Card info dia atual + reserva */}
        <div className="bg-muted rounded-2xl p-3">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="text-lg font-medium">{currentDate.getDate()} hoje</div>
              <div className="text-sm text-muted-foreground">{diaDaSemanaAtual}</div>
            </div>
            <div className="text-muted-foreground/30">|</div>
            <div className="flex-1">{renderReservaInfo()}</div>
          </div>
        </div>

        {/* Loading de kits */}
        {selectedDays.length > 0 && kitsLoading && (
          <div className="text-center text-sm text-muted-foreground py-4">
            Verificando disponibilidade...
          </div>
        )}

        {/* Sem kits cadastrados */}
        {selectedDays.length > 0 && semKitsCadastrados && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-center">
            <p className="text-sm font-semibold text-amber-800">Nenhum kit disponível no momento.</p>
            <p className="text-xs text-amber-600 mt-1">Entre em contato com o administrador para mais informações.</p>
          </div>
        )}

        {/* Quantidade, Preço, Endereço + formulário */}
        {kitFixo && (
          <div className={`transition-opacity duration-300 ${showCards && isCardsVisible ? "opacity-100" : "opacity-0 invisible"}`}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <QuantitySelector quantity={quantity} onQuantityChange={setQuantity} min={minKits} max={kitsDisponiveis !== undefined && kitsDisponiveis > 0 ? kitsDisponiveis : undefined} />
              </div>
              <div>
                <PriceCard total={valorKit + valorAvulsos} />
              </div>
            </div>

            {/* Quantidade em negrito + disponibilidade */}
            <div className="mt-1 text-center">
              <span className="text-sm font-bold text-slate-700"><strong>{quantity}</strong> kits</span>
              {kitsDisponiveis !== undefined && kitFixo && selectedDays.length > 0 && (
                <div className={`text-xs mt-0.5 ${kitsDisponiveis === 0 ? "text-red-600 font-semibold" : kitsDisponiveis < 5 ? "text-orange-500" : "text-slate-500"}`}>
                  <strong>{kitsDisponiveis}</strong> kits disponíveis
                  {kitsDisponiveis > 0 && (
                    <span> ({kitsDisponiveis * kitFixo.mesas} mesa{kitsDisponiveis * kitFixo.mesas !== 1 ? "s" : ""} + {kitsDisponiveis * kitFixo.cadeiras} cadeira{kitsDisponiveis * kitFixo.cadeiras !== 1 ? "s" : ""})</span>
                  )}
                </div>
              )}
            </div>

            {/* Alerta sem kits */}
            {semKitsDisponiveis && (
              <div className="mt-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-center">
                <p className="text-sm font-semibold text-red-700">Nenhum kit disponível para o período selecionado.</p>
                <p className="text-xs text-red-500 mt-0.5">Escolha outras datas para verificar disponibilidade.</p>
              </div>
            )}

            {/* Itens avulsos */}
            {(precoMesaAvulsa > 0 || precoCadeiraAvulsa > 0) && (
              <div className="mt-3 bg-card rounded-xl border p-4">
                <h3 className="font-semibold text-sm text-slate-600 mb-3">Precisa de itens avulsos?</h3>
                <div className="grid grid-cols-2 gap-4">
                  {precoMesaAvulsa > 0 && (
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Mesas extras</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setMesasAvulsas((v) => Math.max(0, v - 1))}
                          className="w-8 h-8 rounded-lg border flex items-center justify-center text-slate-600 hover:bg-slate-100"
                        >−</button>
                        <span className="w-8 text-center font-semibold">{mesasAvulsas}</span>
                        <button
                          type="button"
                          onClick={() => setMesasAvulsas((v) => v + 1)}
                          className="w-8 h-8 rounded-lg border flex items-center justify-center text-slate-600 hover:bg-slate-100"
                        >+</button>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{formatarValor(precoMesaAvulsa)} cada</p>
                    </div>
                  )}
                  {precoCadeiraAvulsa > 0 && (
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Cadeiras extras</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCadeirasAvulsas((v) => Math.max(0, v - 1))}
                          className="w-8 h-8 rounded-lg border flex items-center justify-center text-slate-600 hover:bg-slate-100"
                        >−</button>
                        <span className="w-8 text-center font-semibold">{cadeirasAvulsas}</span>
                        <button
                          type="button"
                          onClick={() => setCadeirasAvulsas((v) => v + 1)}
                          className="w-8 h-8 rounded-lg border flex items-center justify-center text-slate-600 hover:bg-slate-100"
                        >+</button>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{formatarValor(precoCadeiraAvulsa)} cada</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Endereço */}
            <div className="mt-2">
              <AddressSelector
                selectedAddress={selectedAddress}
                onAddAddress={handleAddAddress}
                onEditAddress={handleEditAddress}
                onDeleteAddress={handleDeleteAddress}
              />
            </div>

            {/* Dados pessoais */}
            <div className="mt-3 bg-card rounded-xl border p-4 space-y-3">
              <h3 className="font-semibold text-sm text-slate-600">Dados pessoais</h3>
              <div>
                <input
                  type="text"
                  placeholder="Nome completo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <input
                  type="tel"
                  placeholder="(XX) XXXXX-XXXX"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(formatWhatsApp(e.target.value))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Forma de pagamento + observações */}
            <div className="mt-3 bg-card rounded-xl border p-4 space-y-3">
              <h3 className="font-semibold text-sm text-slate-600">Pagamento</h3>
              <Select value={formaPagamento} onValueChange={(v: string) => setFormaPagamento(v as "PIX" | "DINHEIRO" | "CARTAO")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                  <SelectItem value="CARTAO">Cartão</SelectItem>
                </SelectContent>
              </Select>

              <div>
                <textarea
                  placeholder="Observações (opcional)"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  maxLength={500}
                  rows={2}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
            </div>

            {/* Resumo rápido */}
            <div className="mt-3 bg-slate-50 rounded-xl p-3 flex justify-between items-center">
              <span className="text-sm text-slate-600">Total</span>
              <span className="font-bold text-lg text-primary">{formatarValor(valorTotal)}</span>
            </div>

            {/* Mensagem de validação */}
            {!canProceed && (
              <div className="mt-2 text-sm text-red-500 font-medium text-center">
                {!selectedAddress && "Adicione um endereço de entrega"}
                {selectedAddress && nome.length < 3 && "Preencha seu nome"}
                {selectedAddress && nome.length >= 3 && whatsapp.length < 10 && "Preencha seu WhatsApp"}
              </div>
            )}

            {/* Botão Revisar */}
            <div className="mt-3">
              <Button
                onClick={() => setShowPreview(true)}
                disabled={!canProceed}
                className="w-full font-semibold"
                size="default"
                type="button"
              >
                Revisar Pedido
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Drawer de endereço */}
      <AddressFormDrawer
        isOpen={isAddressDrawerOpen}
        onClose={() => {
          setIsAddressDrawerOpen(false);
          setEditingAddress(null);
          setDrawerMode("create");
        }}
        onSave={handleSaveAddress}
        initialAddress={editingAddress}
        mode={drawerMode}
      />
    </div>
  );
}
