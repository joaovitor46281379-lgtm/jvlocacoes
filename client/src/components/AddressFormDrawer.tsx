import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVilas } from "@shared/hooks/use-vilas";

interface Address {
  id: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  vilaId?: string;
  city: string;
  state: string;
  zipCode: string;
  reference?: string;
}

interface AddressFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: {
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    vilaId: string;
    city: string;
    state: string;
    zipCode: string;
    reference: string;
  }) => void;
  initialAddress?: Address | null;
  mode?: 'create' | 'edit';
}

export function AddressFormDrawer({
  isOpen,
  onClose,
  onSave,
  initialAddress,
  mode = 'create',
}: AddressFormDrawerProps) {
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [neighborhoodId, setNeighborhoodId] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [reference, setReference] = useState("");

  const { data: neighborhoods } = useVilas(true);
  const selectedNeighborhood = neighborhoods?.find(n => n.id === neighborhoodId);

  // Preencher campos quando initialAddress mudar
  useEffect(() => {
    if (initialAddress && mode === 'edit') {
      setStreet(initialAddress.street);
      setNumber(initialAddress.number);
      setComplement(initialAddress.complement || "");
      setNeighborhood(initialAddress.neighborhood);
      setNeighborhoodId(initialAddress.vilaId || "");
      setCity(initialAddress.city);
      setZipCode(initialAddress.zipCode);
      setReference(initialAddress.reference || "");
    }
  }, [initialAddress, mode]);

  const resetForm = () => {
    setStreet("");
    setNumber("");
    setComplement("");
    setNeighborhood("");
    setNeighborhoodId("");
    setCity("");
    setZipCode("");
    setReference("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!street || !number || !neighborhoodId || !city || !zipCode) {
      alert("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    onSave({
      street,
      number,
      complement,
      neighborhood,
      vilaId: neighborhoodId,
      city,
      state: "PR",
      zipCode,
      reference,
    });

    handleClose();
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={handleClose} />

      {/* Drawer */}
      <div className="fixed left-0 right-0 bottom-0 bg-background rounded-t-3xl z-50 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">
            {mode === 'edit' ? 'Editar endereço' : 'Adicionar endereço'}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="street">Rua *</Label>
              <Input
                id="street"
                placeholder="Nome da rua"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="placeholder:text-muted-foreground/40"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="number">Número *</Label>
                <Input
                  id="number"
                  placeholder="123"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  className="placeholder:text-muted-foreground/40"
                  required
                />
              </div>
              <div>
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  placeholder="Apto 45"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  className="placeholder:text-muted-foreground/40"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="neighborhood">Bairro *</Label>
              <Select
                value={neighborhoodId}
                onValueChange={(id) => {
                  setNeighborhoodId(id);
                  const selected = neighborhoods?.find(n => n.id === id);
                  if (selected) {
                    setNeighborhood(selected.nome);
                  }
                }}
              >
                <SelectTrigger id="neighborhood">
                  <SelectValue placeholder="Selecione o bairro" />
                </SelectTrigger>
                <SelectContent>
                  {neighborhoods?.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedNeighborhood && (
                <div className="mt-2 text-sm">
                  <span className="text-muted-foreground">Valor do frete: </span>
                  <span className="font-semibold text-primary">
                    R$ {Number(selectedNeighborhood.valorFrete).toFixed(2)}
                  </span>
                </div>
              )}
              {neighborhoods?.length === 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Nenhum bairro disponível. Contate o administrador.
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="reference">Ponto de referência</Label>
              <Input
                id="reference"
                placeholder="Ex: Próximo ao mercado"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="placeholder:text-muted-foreground/40"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Cidade *</Label>
                <Input
                  id="city"
                  placeholder="Nome da cidade"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="placeholder:text-muted-foreground/40"
                  required
                />
              </div>
              <div>
                <Label htmlFor="zipCode">CEP *</Label>
                <Input
                  id="zipCode"
                  placeholder="12345-678"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="placeholder:text-muted-foreground/40"
                  required
                />
              </div>
            </div>

            <div className="pt-4">
              <Button type="submit" className="w-full">
                Salvar endereço
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
