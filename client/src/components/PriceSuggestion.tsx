import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";

type Suggestion = { suggested: number; low: number; high: number; basedOn: number; basis: "sold" | "listed" } | null;

// Suggested price for a piece of this size, from what similar work on
// BrushBids has sold (or is listed) for. The artist always decides.
export function PriceSuggestion({ width, height, onUse }: { width: number; height: number; onUse: (price: number) => void }) {
  const ready = width > 0 && height > 0;
  const { data } = useQuery<Suggestion>({
    queryKey: ["/api/pricing/suggest", width, height],
    queryFn: async () => (await fetch(`/api/pricing/suggest?width=${width}&height=${height}`)).json(),
    enabled: ready,
  });
  if (!ready) return <p className="text-xs text-white/40">Enter the size below to see a suggested price.</p>;
  if (!data) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-white/60" data-testid="price-suggestion">
      <Lightbulb className="w-3.5 h-3.5 text-amber-300" />
      <span>
        Suggested <strong className="text-white">${data.suggested}</strong> (most similar pieces ${data.low} to ${data.high}),
        based on {data.basedOn} {data.basis === "sold" ? "sold pieces" : "pieces on BrushBids"}.
      </span>
      <Button type="button" size="sm" variant="ghost" className="h-6 px-2 text-xs text-violet-300" onClick={() => onUse(data.suggested)} data-testid="button-use-suggested-price">
        Use ${data.suggested}
      </Button>
    </div>
  );
}
