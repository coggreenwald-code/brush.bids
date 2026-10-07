import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { handleArtworkImageError } from "@/lib/imageFallback";
import { Loader2 } from "lucide-react";

type OrderRow = {
  id: number; status: string; statusToken: string; totalAmount: string | null; paidAt: string | null;
  artwork: { id: number; title: string; imageUrl: string } | null; artistName: string | null;
};
type OfferRow = {
  id: number; amount: string; status: string; expiresAt: string;
  artwork: { id: number; title: string; imageUrl: string; askingPrice: number } | null;
};

const ORDER_LABELS: Record<string, string> = {
  paid: "Paid, waiting to ship", shipped: "On its way", delivered: "Delivered", completed: "Delivered",
  issue: "Problem reported", refunded: "Refunded", cancelled: "Cancelled",
};
const OFFER_LABELS: Record<string, string> = {
  pending: "Waiting for the artist", accepted: "Accepted, ready to buy", declined: "Declined",
  expired: "Expired", withdrawn: "Withdrawn", purchased: "Purchased",
};

export default function Purchases() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const orders = useQuery<OrderRow[]>({ queryKey: ["/api/my/orders"], enabled: !!user });
  const offers = useQuery<OfferRow[]>({ queryKey: ["/api/my/offers"], enabled: !!user });
  const withdraw = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/my/offers/${id}/withdraw`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/my/offers"] }),
    onError: () => toast({ title: "Couldn't withdraw that offer", variant: "destructive" }),
  });

  if (authLoading) return <Layout><div className="py-32 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/40" /></div></Layout>;
  if (!user) {
    return (
      <Layout>
        <div className="py-32 text-center space-y-4">
          <h1 className="text-2xl font-display font-bold text-white">Sign in to see your purchases</h1>
          <Button asChild className="rounded-full"><a href="/api/login">Sign in</a></Button>
        </div>
      </Layout>
    );
  }

  const openOffers = (offers.data ?? []).filter((o) => o.status !== "purchased");

  return (
    <Layout>
      <SEOHead title="My Purchases | BrushBids" description="Your BrushBids orders and offers." />
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-12" data-testid="page-purchases">
        <section className="space-y-4">
          <h1 className="text-3xl font-display font-bold text-white">My Purchases</h1>
          {orders.isLoading ? <Loader2 className="w-5 h-5 animate-spin text-white/40" /> : (orders.data ?? []).length === 0 ? (
            <p className="text-white/50">No purchases yet. <Link href="/gallery" className="underline">Browse the gallery</Link>.</p>
          ) : (
            <ul className="space-y-3">
              {orders.data!.map((o) => (
                <li key={o.id}>
                  <Link href={`/order/${o.statusToken}`}>
                    <div className="flex items-center gap-4 rounded-md border border-white/10 bg-white/[0.02] p-4 cursor-pointer hover:border-white/20" data-testid={`order-${o.id}`}>
                      {o.artwork && <img src={o.artwork.imageUrl} onError={handleArtworkImageError} alt="" className="w-16 h-16 object-cover rounded" />}
                      <div className="flex-1">
                        <p className="font-medium text-white">{o.artwork?.title ?? "Artwork"}</p>
                        <p className="text-sm text-white/50">{ORDER_LABELS[o.status] ?? o.status}</p>
                      </div>
                      {o.totalAmount && <span className="font-mono text-white">${Number(o.totalAmount).toFixed(2)}</span>}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-display font-bold text-white">My Offers</h2>
          {openOffers.length === 0 ? <p className="text-white/50">No offers.</p> : (
            <ul className="space-y-3">
              {openOffers.map((o) => (
                <li key={o.id} className="flex items-center gap-4 rounded-md border border-white/10 bg-white/[0.02] p-4" data-testid={`offer-${o.id}`}>
                  {o.artwork && <img src={o.artwork.imageUrl} onError={handleArtworkImageError} alt="" className="w-16 h-16 object-cover rounded" />}
                  <div className="flex-1">
                    <p className="font-medium text-white">{o.artwork?.title ?? "Artwork"}</p>
                    <p className="text-sm text-white/50">
                      ${Number(o.amount).toFixed(2)} · {OFFER_LABELS[o.status] ?? o.status}
                      {(o.status === "pending" || o.status === "accepted") && ` · until ${new Date(o.expiresAt).toLocaleString()}`}
                    </p>
                  </div>
                  {o.status === "accepted" && o.artwork && (
                    <Button asChild size="sm" className="rounded-full"><Link href={`/artwork/${o.artwork.id}`}>Buy now</Link></Button>
                  )}
                  {(o.status === "pending" || o.status === "accepted") && (
                    <Button size="sm" variant="ghost" className="text-white/50" onClick={() => withdraw.mutate(o.id)}>Withdraw</Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <Footer />
    </Layout>
  );
}
