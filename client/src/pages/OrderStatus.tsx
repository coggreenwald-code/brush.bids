import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CheckCircle2, Circle, Loader2, Truck } from "lucide-react";
import { CONTACT_EMAIL } from "@shared/siteConfig";

type OrderView = {
  id: number;
  status: "pending_payment" | "paid" | "shipped" | "delivered" | "completed" | "issue" | "cancelled" | "refunded";
  artwork: { id: number; title: string; imageUrl: string } | null;
  artistName: string | null;
  itemAmount: string; shippingAmount: string; taxAmount: string | null; totalAmount: string | null;
  shipName: string | null; shipCity: string | null; shipState: string | null;
  carrier: string | null; trackingNumber: string | null; trackingUrl: string | null; whiteGlove: boolean;
  paidAt: string | null; shippedAt: string | null; deliveredAt: string | null; payoutReleaseAt: string | null;
  issueNote: string | null; inspectionDays: number;
};

const money = (n: string | null) => (n == null ? "" : `$${Number(n).toFixed(2)}`);
const date = (d: string | null) => (d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : null);

export default function OrderStatus() {
  const [, params] = useRoute("/order/:token");
  const token = params?.token ?? "";
  const justPaid = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("paid");
  const { toast } = useToast();
  const [issueOpen, setIssueOpen] = useState(false);
  const [note, setNote] = useState("");

  const { data: order, isLoading, error } = useQuery<OrderView>({
    queryKey: [`/api/order-status/${token}`],
    enabled: !!token,
    // Right after checkout the payment confirmation can take a few seconds.
    refetchInterval: (q) => (q.state.data?.status === "pending_payment" ? 2000 : false),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: [`/api/order-status/${token}`] });
  const received = useMutation({
    mutationFn: () => apiRequest("POST", `/api/order-status/${token}/received`),
    onSuccess: () => { refresh(); toast({ title: "Thanks for confirming!" }); },
    onError: () => toast({ title: "Couldn't update the order", variant: "destructive" }),
  });
  const report = useMutation({
    mutationFn: () => apiRequest("POST", `/api/order-status/${token}/issue`, { note }),
    onSuccess: () => { refresh(); setIssueOpen(false); toast({ title: "We got your report", description: "The artist's payment is on hold while we sort it out." }); },
    onError: (err: Error) => toast({ title: "Couldn't send your report", description: err.message.replace(/^\d+:\s*/, ""), variant: "destructive" }),
  });

  if (isLoading) return <Layout><div className="py-32 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/40" /></div></Layout>;
  if (error || !order) {
    return (
      <Layout>
        <div className="py-32 text-center space-y-3">
          <h1 className="text-2xl font-display font-bold text-white">Order not found</h1>
          <p className="text-white/50">Check the link in your confirmation email, or contact {CONTACT_EMAIL}.</p>
        </div>
      </Layout>
    );
  }

  const steps = [
    { label: "Paid", at: order.paidAt, done: !!order.paidAt },
    { label: order.whiteGlove ? "Picked up for art handling" : "Shipped", at: order.shippedAt, done: !!order.shippedAt },
    { label: "Delivered", at: order.deliveredAt, done: !!order.deliveredAt },
  ];
  const canConfirm = order.status === "paid" || order.status === "shipped";
  const canReport = order.status === "paid" || order.status === "shipped" || order.status === "delivered";

  return (
    <Layout>
      <SEOHead title="Your Order | BrushBids" description="Track your BrushBids order." />
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8" data-testid="page-order-status">
        {order.status === "pending_payment" ? (
          <div className="text-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-white/40 mx-auto" />
            <p className="text-white/60">{justPaid ? "Confirming your payment..." : "This order hasn't been paid."}</p>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-violet-400">Order #{order.id}</p>
            <h1 className="text-3xl font-display font-bold text-white">
              {order.status === "refunded" ? "Refunded" : order.status === "cancelled" ? "Cancelled" : order.status === "issue" ? "We're looking into it" : order.status === "completed" || order.status === "delivered" ? "Delivered" : "Thank you!"}
            </h1>
            {order.artistName && <p className="text-white/50">Your purchase supports {order.artistName}.</p>}
          </div>
        )}

        {order.artwork && (
          <Link href={`/artwork/${order.artwork.id}`}>
            <div className="flex items-center gap-4 rounded-md border border-white/10 bg-white/[0.02] p-4 cursor-pointer">
              <img src={order.artwork.imageUrl} alt={order.artwork.title} className="w-20 h-20 object-cover rounded" />
              <div className="flex-1">
                <p className="font-semibold text-white">{order.artwork.title}</p>
                {order.artistName && <p className="text-sm text-white/50">by {order.artistName}</p>}
              </div>
            </div>
          </Link>
        )}

        {order.paidAt && order.status !== "refunded" && order.status !== "cancelled" && (
          <ol className="space-y-3" data-testid="order-steps">
            {steps.map((s) => (
              <li key={s.label} className="flex items-center gap-3">
                {s.done ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Circle className="w-5 h-5 text-white/20" />}
                <span className={s.done ? "text-white" : "text-white/40"}>{s.label}</span>
                {s.at && <span className="text-sm text-white/40 ml-auto">{date(s.at)}</span>}
              </li>
            ))}
          </ol>
        )}

        {order.trackingNumber && (
          <div className="flex items-center gap-3 text-sm text-white/70">
            <Truck className="w-4 h-4" />
            <span>{order.carrier} {order.trackingNumber}</span>
            {order.trackingUrl && <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="ml-auto underline text-violet-300">Track package</a>}
          </div>
        )}
        {order.whiteGlove && order.status === "paid" && (
          <p className="text-sm text-white/50">This piece ships with professional art handlers. We'll email you when it's picked up.</p>
        )}

        {order.paidAt && (
          <dl className="rounded-md border border-white/10 divide-y divide-white/5 text-sm">
            {[["Artwork", order.itemAmount], ["Insured shipping", order.shippingAmount], ["Sales tax", order.taxAmount], ["Total", order.totalAmount]].map(([k, v]) => (
              <div key={k} className="flex justify-between px-4 py-2">
                <dt className="text-white/50">{k}</dt><dd className="text-white font-mono">{money(v)}</dd>
              </div>
            ))}
            <div className="flex justify-between px-4 py-2">
              <dt className="text-white/50">Ship to</dt><dd className="text-white">{order.shipName}, {order.shipCity}, {order.shipState}</dd>
            </div>
          </dl>
        )}

        {order.status === "delivered" && order.payoutReleaseAt && (
          <p className="text-sm text-white/50">
            Something wrong with your piece? Report it by {new Date(order.payoutReleaseAt).toLocaleString()} and we'll hold the artist's payment while we help.
          </p>
        )}
        {order.status === "issue" && (
          <p className="text-sm text-amber-200/90">You reported: "{order.issueNote}". We'll email you within two business days.</p>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {canConfirm && (
            <Button onClick={() => received.mutate()} disabled={received.isPending} className="flex-1 rounded-full bg-white text-[#0a0a0f] hover:bg-white/90" data-testid="button-confirm-received">
              I received my artwork
            </Button>
          )}
          {canReport && !issueOpen && (
            <Button variant="outline" onClick={() => setIssueOpen(true)} className="flex-1 rounded-full border-white/20 text-white hover:bg-white/10" data-testid="button-report-problem">
              Report a problem
            </Button>
          )}
        </div>
        {issueOpen && (
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); report.mutate(); }}>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What happened? (damaged, not as described, never arrived...)"
              className="bg-white/[0.03] border-white/10 text-white" data-testid="input-issue-note" />
            <Button type="submit" disabled={report.isPending || note.trim().length < 5} className="rounded-full" data-testid="button-send-report">Send report</Button>
          </form>
        )}

        <p className="text-xs text-white/30 text-center">Questions? Email {CONTACT_EMAIL} with your order number.</p>
      </div>
      <Footer />
    </Layout>
  );
}
