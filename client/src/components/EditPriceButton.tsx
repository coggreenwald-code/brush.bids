import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Pencil, Loader2 } from "lucide-react";
import type { Artwork } from "@shared/schema";
import { askingPrice, parseDimensions } from "@shared/pricing";
import { PriceSuggestion } from "@/components/PriceSuggestion";

// Price shown on the artist's dashboard card, with an editor for unsold work.
export function EditPriceButton({ artwork }: { artwork: Artwork }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState(String(askingPrice(artwork)));
  const [w, h] = parseDimensions(artwork.dimensions);
  const save = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/artworks/${artwork.id}/price`, { price: Number(price) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artworks"] });
      setOpen(false);
      toast({ title: "Price updated" });
    },
    onError: (err: Error) => toast({ title: "Couldn't update the price", description: err.message.replace(/^\d+:\s*/, ""), variant: "destructive" }),
  });

  return (
    <div>
      <div className="text-xs text-white/40">{artwork.paidAt ? "Sold for" : "Price"}</div>
      <div className="flex items-center gap-1">
        <span className="font-bold text-emerald-400">${askingPrice(artwork).toLocaleString()}</span>
        {!artwork.paidAt && (
          <button type="button" onClick={(e) => { e.preventDefault(); setOpen(true); }} className="p-1 text-white/40 hover:text-white" aria-label="Change price" data-testid={`button-edit-price-${artwork.id}`}>
            <Pencil className="w-3 h-3" />
          </button>
        )}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-[#0a0a0f] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Set your price</DialogTitle>
            <DialogDescription className="text-white/50">You decide what "{artwork.title}" sells for. You keep 75% of the sale.</DialogDescription>
          </DialogHeader>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
            <Input type="number" min={1} step="1" value={price} onChange={(e) => setPrice(e.target.value)}
              className="bg-white/[0.03] border-white/10 text-white" data-testid="input-edit-price" />
            {w && h ? <PriceSuggestion width={w} height={h} onUse={(p) => setPrice(String(p))} /> : null}
            <Button type="submit" disabled={save.isPending || !(Number(price) >= 1)} className="w-full rounded-full bg-white text-[#0a0a0f] hover:bg-white/90">
              {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save price"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
