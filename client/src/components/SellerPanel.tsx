import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { handleArtworkImageError } from "@/lib/imageFallback";
import { Loader2, Package, Printer } from "lucide-react";
import { INSPECTION_DAYS } from "@shared/siteConfig";

type SellerOffer = {
  id: number; amount: string; status: string; expiresAt: string;
  artwork: { id: number; title: string; imageUrl: string; askingPrice: number } | null;
};
type SellerOrder = {
  id: number; status: string; itemAmount: string; artistEarnings: string; shipTo: string | null;
  whiteGlove: boolean; canBuyLabel: boolean; carrier: string | null; trackingNumber: string | null;
  trackingUrl: string | null; labelUrl: string | null; paidAt: string | null; deliveredAt: string | null;
  payoutReleaseAt: string | null; payoutReleasedAt: string | null;
  artwork: { id: number; title: string; imageUrl: string } | null;
};

const money = (n: string | number) => `$${Number(n).toFixed(2)}`;
const cleanError = (err: Error) => {
  const raw = err.message.replace(/^\d+:\s*/, "");
  try { return JSON.parse(raw).message || raw; } catch { return raw; }
};

function orderStatusText(o: SellerOrder): string {
  switch (o.status) {
    case "paid": return o.whiteGlove ? "Sold. BrushBids will arrange white-glove pickup." : "Sold. Ship within 5 days.";
    case "shipped": return "Shipped. Waiting for delivery.";
    case "delivered": return o.payoutReleaseAt ? `Delivered. You'll be paid after ${new Date(o.payoutReleaseAt).toLocaleDateString()}.` : "Delivered.";
    case "completed": return "Complete. Payment released.";
    case "issue": return "The buyer reported a problem. BrushBids will contact you.";
    case "refunded": return "Refunded to the buyer.";
    default: return o.status;
  }
}

function ShipActions({ order }: { order: SellerOrder }) {
  const { toast } = useToast();
  const [carrier, setCarrier] = useState("USPS");
  const [tracking, setTracking] = useState("");
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["/api/selling/orders"] });
  const buyLabel = useMutation({
    mutationFn: async () => (await apiRequest("POST", `/api/selling/orders/${order.id}/label`)).json(),
    onSuccess: (data: { labelUrl: string }) => { refresh(); if (data.labelUrl) window.open(data.labelUrl, "_blank"); },
    onError: (err: Error) => toast({ title: "Couldn't buy the label", description: cleanError(err), variant: "destructive" }),
  });
  const addTracking = useMutation({
    mutationFn: () => apiRequest("POST", `/api/selling/orders/${order.id}/tracking`, { carrier, trackingNumber: tracking }),
    onSuccess: () => { refresh(); toast({ title: "Marked as shipped", description: "We emailed the buyer their tracking link." }); },
    onError: (err: Error) => toast({ title: "Couldn't save tracking", description: cleanError(err), variant: "destructive" }),
  });

  if (order.status !== "paid" || order.whiteGlove) return null;
  return (
    <div className="space-y-3 pt-2">
      {order.canBuyLabel && (
        <Button onClick={() => buyLabel.mutate()} disabled={buyLabel.isPending} className="rounded-full bg-white text-[#0a0a0f] hover:bg-white/90" data-testid={`button-buy-label-${order.id}`}>
          {buyLabel.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Printer className="w-4 h-4 mr-2" />Print prepaid insured label</>}
        </Button>
      )}
      <form className="flex flex-wrap gap-2 items-center" onSubmit={(e) => { e.preventDefault(); addTracking.mutate(); }}>
        <span className="text-xs text-white/40 w-full">{order.canBuyLabel ? "Or, if you paid for postage yourself:" : "Shipped it? Add the tracking number:"}</span>
        <select value={carrier} onChange={(e) => setCarrier(e.target.value)} className="h-9 rounded-md bg-white/[0.03] border border-white/10 text-white text-sm px-2">
          {["USPS", "UPS", "FedEx", "DHL"].map((c) => <option key={c} value={c} className="bg-[#0a0a0f]">{c}</option>)}
        </select>
        <Input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Tracking number" className="h-9 flex-1 min-w-[160px] bg-white/[0.03] border-white/10 text-white" data-testid={`input-tracking-${order.id}`} />
        <Button type="submit" size="sm" variant="outline" disabled={addTracking.isPending || tracking.trim().length < 8} className="rounded-full border-white/20 text-white">Save</Button>
      </form>
      {!order.canBuyLabel && <p className="text-xs text-white/40">Postage you pay for is reimbursed with your payout. Please buy insurance for the full sale price.</p>}
    </div>
  );
}

export function SellerPanel() {
  const { toast } = useToast();
  const offers = useQuery<SellerOffer[]>({ queryKey: ["/api/selling/offers"] });
  const orders = useQuery<SellerOrder[]>({ queryKey: ["/api/selling/orders"] });
  const respond = useMutation({
    mutationFn: ({ id, action }: { id: number; action: "accept" | "decline" }) => apiRequest("POST", `/api/selling/offers/${id}/${action}`),
    onSuccess: (_d, v) => {
      queryClient.invalidateQueries({ queryKey: ["/api/selling/offers"] });
      toast({ title: v.action === "accept" ? "Offer accepted" : "Offer declined", description: v.action === "accept" ? "The buyer has 48 hours to complete the purchase." : undefined });
    },
    onError: (err: Error) => toast({ title: "Couldn't update the offer", description: cleanError(err), variant: "destructive" }),
  });

  const pendingOffers = (offers.data ?? []).filter((o) => o.status === "pending" && new Date(o.expiresAt) > new Date());

  return (
    <div className="space-y-10" data-testid="panel-seller">
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-white">Offers waiting for you</h3>
        {offers.isLoading ? <Loader2 className="w-5 h-5 animate-spin text-white/40" /> : pendingOffers.length === 0 ? (
          <p className="text-sm text-white/40">No open offers.</p>
        ) : pendingOffers.map((o) => (
          <div key={o.id} className="flex flex-wrap items-center gap-4 rounded-md border border-white/10 bg-white/[0.02] p-4" data-testid={`seller-offer-${o.id}`}>
            {o.artwork && <img src={o.artwork.imageUrl} onError={handleArtworkImageError} alt="" className="w-14 h-14 object-cover rounded" />}
            <div className="flex-1 min-w-[160px]">
              <p className="font-medium text-white">{o.artwork?.title}</p>
              <p className="text-sm text-white/50">
                Offer {money(o.amount)}{o.artwork ? ` (listed at ${money(o.artwork.askingPrice)})` : ""} · answer by {new Date(o.expiresAt).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="rounded-full bg-white text-[#0a0a0f] hover:bg-white/90" disabled={respond.isPending} onClick={() => respond.mutate({ id: o.id, action: "accept" })} data-testid={`button-accept-offer-${o.id}`}>Accept</Button>
              <Button size="sm" variant="outline" className="rounded-full border-white/20 text-white" disabled={respond.isPending} onClick={() => respond.mutate({ id: o.id, action: "decline" })} data-testid={`button-decline-offer-${o.id}`}>Decline</Button>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-white">Sales</h3>
        <p className="text-sm text-white/40">You're paid once the buyer receives the piece and {INSPECTION_DAYS} days pass without a problem.</p>
        {orders.isLoading ? <Loader2 className="w-5 h-5 animate-spin text-white/40" /> : (orders.data ?? []).length === 0 ? (
          <p className="text-sm text-white/40">No sales yet.</p>
        ) : orders.data!.map((o) => (
          <div key={o.id} className="rounded-md border border-white/10 bg-white/[0.02] p-4 space-y-2" data-testid={`seller-order-${o.id}`}>
            <div className="flex items-center gap-4">
              {o.artwork && <img src={o.artwork.imageUrl} onError={handleArtworkImageError} alt="" className="w-14 h-14 object-cover rounded" />}
              <div className="flex-1">
                <p className="font-medium text-white">{o.artwork?.title}</p>
                <p className="text-sm text-white/50">{orderStatusText(o)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/40">You earn</p>
                <p className="font-mono text-emerald-400">{money(o.artistEarnings)}</p>
              </div>
            </div>
            {o.shipTo && (
              <div className="flex gap-2 text-sm text-white/70">
                <Package className="w-4 h-4 mt-0.5 shrink-0 text-white/40" />
                <pre className="font-sans whitespace-pre-wrap">{o.shipTo}</pre>
              </div>
            )}
            {o.trackingNumber && (
              <p className="text-sm text-white/50">
                {o.carrier} {o.trackingNumber}
                {o.labelUrl && <> · <a href={o.labelUrl} target="_blank" rel="noreferrer" className="underline">Reprint label</a></>}
              </p>
            )}
            <ShipActions order={o} />
          </div>
        ))}
      </section>
    </div>
  );
}
