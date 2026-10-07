import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

type AdminOrder = {
  id: number; status: string; artworkTitle: string | null; artistName: string; buyerName: string; shipTo: string;
  itemAmount: string; shippingAmount: string; taxAmount: string | null; totalAmount: string | null;
  whiteGlove: boolean; carrier: string | null; trackingNumber: string | null; trackingUrl: string | null;
  paidAt: string | null; shippedAt: string | null; deliveredAt: string | null; payoutReleaseAt: string | null;
  payoutReleasedAt: string | null; stripeTransferId: string | null; issueNote: string | null; adminNote: string | null;
  artaRequestId: string | null; shippingLabel: string | null;
};

const money = (n: string | null) => (n == null ? "-" : `$${Number(n).toFixed(2)}`);
const when = (d: string | null) => (d ? new Date(d).toLocaleDateString() : "-");

export function AdminOrdersTab() {
  const { toast } = useToast();
  const { data, isLoading } = useQuery<AdminOrder[]>({ queryKey: ["/api/admin/orders"] });
  const act = useMutation({
    mutationFn: ({ id, action, body }: { id: number; action: string; body?: unknown }) => apiRequest("POST", `/api/admin/orders/${id}/${action}`, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] }),
    onError: (err: Error) => toast({ title: "Action failed", description: err.message.replace(/^\d+:\s*/, ""), variant: "destructive" }),
  });
  const confirmAct = (id: number, action: string, question: string) => {
    if (window.confirm(question)) act.mutate({ id, action });
  };

  if (isLoading) return <Loader2 className="w-5 h-5 animate-spin text-white/40" />;
  const rows = data ?? [];
  const needsAttention = rows.filter((o) => o.status === "issue" || (o.whiteGlove && o.status === "paid") || o.adminNote);

  return (
    <div className="space-y-6" data-testid="admin-orders">
      {needsAttention.length > 0 && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          {needsAttention.length} order{needsAttention.length > 1 ? "s need" : " needs"} attention: problems reported, white-glove pickups to arrange, or notes.
        </div>
      )}
      {rows.length === 0 ? <p className="text-white/50">No orders yet.</p> : rows.map((o) => (
        <div key={o.id} className="rounded-md border border-white/10 bg-white/[0.02] p-4 space-y-2 text-sm" data-testid={`admin-order-${o.id}`}>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-white">#{o.id} {o.artworkTitle}</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/70">{o.status}</span>
            {o.whiteGlove && <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs text-violet-200">White-glove (ARTA)</span>}
            <span className="ml-auto font-mono text-white">{money(o.totalAmount)}</span>
          </div>
          <p className="text-white/60">Artist: {o.artistName} · Buyer: {o.buyerName}</p>
          <p className="text-white/50">
            Item {money(o.itemAmount)} · Shipping {money(o.shippingAmount)} · Tax {money(o.taxAmount)} · Paid {when(o.paidAt)} · Shipped {when(o.shippedAt)} · Delivered {when(o.deliveredAt)}
          </p>
          <pre className="font-sans whitespace-pre-wrap text-white/50">{o.shipTo}</pre>
          {o.trackingNumber && <p className="text-white/50">{o.carrier} {o.trackingNumber}{o.trackingUrl && <> · <a className="underline" href={o.trackingUrl} target="_blank" rel="noreferrer">track</a></>}</p>}
          {o.whiteGlove && o.status === "paid" && (
            <p className="text-violet-200">
              Book white-glove pickup in ARTA{o.artaRequestId ? ` using quote request ${o.artaRequestId}` : ` (charged: ${o.shippingLabel ?? "white-glove estimate"}; request a quote in ARTA)`}, then mark it shipped with ARTA's tracking.
            </p>
          )}
          {o.issueNote && <p className="text-amber-200">Buyer reported: {o.issueNote}</p>}
          {o.adminNote && <p className="text-white/40">Note: {o.adminNote}</p>}
          {o.payoutReleasedAt ? (
            <p className="text-emerald-300">Artist paid {when(o.payoutReleasedAt)}{o.stripeTransferId ? ` (Stripe ${o.stripeTransferId})` : " (manual payout queued)"}</p>
          ) : o.payoutReleaseAt ? (
            <p className="text-white/50">Artist payout releases {new Date(o.payoutReleaseAt).toLocaleString()}</p>
          ) : null}
          <div className="flex flex-wrap gap-2 pt-1">
            {o.status === "paid" && (
              <Button size="sm" variant="outline" className="rounded-full border-white/20 text-white" onClick={() => {
                const trackingUrl = window.prompt("Tracking link (from ARTA or the carrier). Leave blank if you don't have one yet.") ?? null;
                if (trackingUrl === null) return;
                act.mutate({ id: o.id, action: "mark-shipped", body: { trackingUrl } });
              }}>Mark shipped</Button>
            )}
            {(o.status === "paid" || o.status === "shipped") && (
              <Button size="sm" variant="outline" className="rounded-full border-white/20 text-white" onClick={() => confirmAct(o.id, "mark-delivered", "Mark this order delivered? The inspection window starts now.")}>Mark delivered</Button>
            )}
            {(o.status === "delivered" || o.status === "issue") && (
              <Button size="sm" variant="outline" className="rounded-full border-white/20 text-white" onClick={() => confirmAct(o.id, "release-now", "Pay the artist now?")}>Release payout now</Button>
            )}
            {!o.payoutReleasedAt && ["paid", "shipped", "delivered", "issue"].includes(o.status) && (
              <Button size="sm" variant="outline" className="rounded-full border-red-400/30 text-red-300" onClick={() => confirmAct(o.id, "refund", "Refund the buyer in full and put the artwork back on sale?")}>Refund buyer</Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
