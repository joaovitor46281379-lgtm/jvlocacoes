import { useState, useEffect } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuantitySelectorProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  min?: number;
  max?: number;
}

export function QuantitySelector({
  quantity,
  onQuantityChange,
  min = 1,
  max = 99,
}: QuantitySelectorProps) {
  const [showMinError, setShowMinError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Controlar fade in e fade out
  useEffect(() => {
    if (showMinError) {
      // Fade in
      setIsVisible(true);

      // Iniciar fade out após 2.5 segundos
      const fadeOutTimer = setTimeout(() => {
        setIsVisible(false);
      }, 2500);

      // Remover do DOM após fade out (3 segundos total)
      const removeTimer = setTimeout(() => {
        setShowMinError(false);
      }, 3000);

      return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [showMinError]);

  const handleIncrement = () => {
    if (quantity < max) {
      onQuantityChange(quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > min) {
      onQuantityChange(quantity - 1);
    } else {
      // Mostrar mensagem de erro
      setShowMinError(true);
    }
  };

  return (
    <div className="bg-muted rounded-2xl p-4 h-full flex flex-col justify-center gap-3">
      <div className="text-xs text-muted-foreground font-medium text-center">
        Quantidade
      </div>

      {/* Mensagem de erro */}
      {showMinError && (
        <div
          className={`text-xs text-destructive font-medium text-center transition-opacity duration-500 ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          Quantidade mínima é {min} {min === 1 ? "kit" : "kits"}
        </div>
      )}

      <div className="flex items-center gap-2 w-full">
        <Button
          variant="outline"
          size="icon"
          onClick={handleDecrement}
          className="h-9 w-9 flex-shrink-0"
        >
          <Minus className="h-4 w-4" />
        </Button>

        <div className="flex-1 text-center">
          <div className="text-2xl font-bold tabular-nums">{quantity}</div>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={handleIncrement}
          disabled={quantity >= max}
          className="h-9 w-9 flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
