interface PriceCardProps {
  total: number;
}

export function PriceCard({ total }: PriceCardProps) {

  return (
    <div className="bg-muted rounded-2xl p-4 h-full flex flex-col justify-center gap-3">
      <div className="text-xs text-muted-foreground font-medium text-center">
        Total (sem frete)
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-primary">
          R$ {total.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
