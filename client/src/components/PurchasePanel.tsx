import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Truck, ShieldCheck, Loader2, Tag } from "lucide-react";
import type { Artwork } from "@shared/schema";
import { askingPrice, minOfferAmount, needsWhiteGlove } from "@shared/pricing";
import { CONTACT_EMAIL, INSPECTION_DAYS, MIN_BUYER_AGE, OFFER_WINDOW_HOURS, WHITE_GLOVE_SHIPPING_TIERS } from "@shared/siteConfig";

type MyOffer = { id: number; artworkId: number; amount: string; status: string; expiresAt: string };
type ShipTo = { name: string; street1: string; street2: string; city: string; state: string; zip: string };

const money = (n: number | string) => `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

async function errorMessage(err: unknown): Promise<string> {
  const msg = err instanceof Error ? err.message : String(err);
  // apiRequest errors look like "400: {\"message\":\"...\"}"
  const json = msg.replace(/^\d+:\s*/, "");
  try { return JSON.parse(json).message || json; } catch { return json; }
}

export function PurchasePanel({ artwork, isOwnArtwork }: { artwork: Artwork; isOwnArtwork: boolean }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const price = askingPrice(artwork);
  const minOffer = minOfferAmount(artwork);
  const sold = !!artwork.paidAt;
  const available = artwork.status === "approved" && !sold;
  // Oversized or high-value pieces need specialist shipping; until those
  // rates are set, buyers arrange the purchase by email.
  const contactToBuy = needsWhiteGlove(artwork as any) && WHITE_GLOVE_SHIPPING_TIERS.length === 0;

  const [confirmedAdult, setConfirmedAdult] = useState(false);
  const [zip, setZip] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutOfferId, setCheckoutOfferId] = useState<number | undefined>();
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [shipTo, setShipTo] = useState<ShipTo>({ name: "", street1: "", street2: "", city: "", state: "", zip: "" });

  const estimate = useQuery<{ amount: string; label: string; whiteGlove: boolean }>({
    queryKey: ["/api/shipping/estimate", artwork.id, zip],
    queryFn: async () => {
      const res = await fetch(`/api/shipping/estimate?artworkId=${artwork.id}&zip=${zip}`);
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    enabled: /^\d{5}$/.test(zip),
  });

  const myOffers = useQuery<MyOffer[]>({ queryKey: ["/api/my/offers"], enabled: !!user });
  const myOffer = myOffers.data?.find((o) => o.artworkId === artwork.id && (o.status === "pending" || o.status === "accepted"));

  const checkout = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/checkout", {
        artworkId: artwork.id, offerId: checkoutOfferId, confirmedAdult, shipTo,
      });
      return res.json() as Promise<{ checkoutUrl: string }>;
    },
    onSuccess: ({ checkoutUrl }) => { window.location.href = checkoutUrl; },
    onError: async (err) => toast({ title: "Couldn't start checkout", description: await errorMessage(err), variant: "destructive" }),
  });

  const makeOffer = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/offers", { artworkId: artwork.id, amount: Number(offerAmount), confirmedAdult });
      return res.json();
    },
    onSuccess: () => {
      setOfferOpen(false);
      setOfferAmount("");
      queryClient.invalidateQueries({ queryKey: ["/api/my/offers"] });
      toast({ title: "Offer sent", description: `The artist has ${OFFER_WINDOW_HOURS} hours to respond. We'll email you either way.` });
    },
    onError: async (err) => toast({ title: "Offer not sent", description: await errorMessage(err), variant: "destructive" }),
  });

  const requireReady = (): boolean => {
    if (!user) {
      window.location.href = "/api/login";
      return false;
    }
    if (!confirmedAdult) {
      toast({ title: `Buyers must be ${MIN_BUYER_AGE} or older`, description: `Please confirm you are ${MIN_BUYER_AGE} or older to continue.`, variant: "destructive" });
      return false;
    }
    return true;
  };

  const openCheckout = (offerId?: number) => {
    if (!requireReady()) return;
    setCheckoutOfferId(offerId);
    setShipTo((s) => ({ ...s, zip: s.zip || zip }));
    setCheckoutOpen(true);
  };

  if (sold) {
    return (
      <div className="bg-white/[0.02] border border-white/5 rounded-md p-6 text-center" data-testid="panel-sold">
        <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Sold</p>
        <p className="text-2xl font-mono font-bold text-white/70">{money(price)}</p>
        <p className="text-sm text-white/40 mt-2">This piece found a home. Explore more work in the gallery.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.02] border border-violet-400/30 rounded-md p-6 space-y-5" data-testid="panel-purchase">
      <div>
        <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Price</p>
        <div className="text-3xl font-mono font-bold text-emerald-400" data-testid="text-price">{money(price)}</div>
      </div>

      {!available ? (
        <p className="text-sm text-white/40">This piece isn't available for purchase right now.</p>
      ) : isOwnArtwork ? (
        <p className="text-sm text-white/50">This is your listing. Offers and sales show up on your Dashboard.</p>
      ) : contactToBuy ? (
        <div className="space-y-3" data-testid="panel-contact-to-buy">
          <p className="text-sm text-white/60">This piece needs specialist art shipping, so we arrange the purchase personally, including an insured shipping quote to your door.</p>
          <Button asChild className="w-full h-12 rounded-full bg-white text-[#0a0a0f] font-semibold hover:bg-white/90">
            <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`I'd like to buy "${artwork.title}"`)}`} data-testid="button-email-to-buy">Email us to buy</a>
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="ship-zip" className="text-xs text-white/50 flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> Shipping to</Label>
            <div className="flex items-center gap-3">
              <Input id="ship-zip" inputMode="numeric" maxLength={5} placeholder="ZIP code" value={zip}
                onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
                className="w-32 bg-white/[0.03] border-white/10 text-white" data-testid="input-estimate-zip" />
              <span className="text-sm text-white/60" data-testid="text-shipping-estimate">
                {estimate.isFetching ? "Calculating..." : estimate.data ? `${money(estimate.data.amount)} insured shipping` : estimate.error ? "Enter a valid ZIP" : "Enter your ZIP for shipping"}
              </span>
            </div>
            {estimate.data?.whiteGlove && (
              <p className="text-xs text-white/40">Ships with white-glove art handling.</p>
            )}
          </div>

          {myOffer?.status === "accepted" && (
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200" data-testid="notice-offer-accepted">
              Your offer of {money(myOffer.amount)} was accepted. Complete your purchase by {new Date(myOffer.expiresAt).toLocaleString()}.
            </div>
          )}
          {myOffer?.status === "pending" && (
            <div className="rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm text-white/60" data-testid="notice-offer-pending">
              Your offer of {money(myOffer.amount)} is waiting for the artist.
            </div>
          )}

          <label className="flex items-start gap-2 text-xs text-white/50 cursor-pointer" data-testid="label-confirm-adult">
            <input type="checkbox" className="mt-0.5 accent-violet-500" checked={confirmedAdult}
              onChange={(e) => setConfirmedAdult(e.target.checked)} data-testid="checkbox-confirm-adult" />
            <span>I am {MIN_BUYER_AGE} or older. Purchases and offers are binding, so buyers must be adults.</span>
          </label>

          <div className="grid gap-3">
            {myOffer?.status === "accepted" ? (
              <Button className="h-12 rounded-full bg-white text-[#0a0a0f] font-semibold hover:bg-white/90"
                onClick={() => openCheckout(myOffer.id)} data-testid="button-buy-offer">
                Buy for {money(myOffer.amount)}
              </Button>
            ) : (
              <Button className="h-12 rounded-full bg-white text-[#0a0a0f] font-semibold hover:bg-white/90"
                onClick={() => openCheckout()} data-testid="button-buy-now">
                Buy Now
              </Button>
            )}
            {!myOffer && (
              <Button variant="outline" className="h-12 rounded-full border-white/20 text-white hover:bg-white/10"
                onClick={() => { if (requireReady()) setOfferOpen(true); }} data-testid="button-make-offer">
                <Tag className="w-4 h-4 mr-2" /> Make an Offer
              </Button>
            )}
          </div>

          <p className="text-xs text-white/40 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400/70" />
            Shipping is insured. The artist is paid only after your piece arrives and you've had {INSPECTION_DAYS} days to check it. Sales tax is added at checkout.
          </p>
        </>
      )}

      <Dialog open={offerOpen} onOpenChange={setOfferOpen}>
        <DialogContent className="sm:max-w-md bg-[#0a0a0f] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Make an offer</DialogTitle>
            <DialogDescription className="text-white/50">
              Offers start at {money(minOffer)}. The artist has {OFFER_WINDOW_HOURS} hours to accept; if they do, you'll have {OFFER_WINDOW_HOURS} hours to pay.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); makeOffer.mutate(); }}>
            <Input type="number" step="0.01" min={minOffer} max={price} placeholder={minOffer.toFixed(2)}
              value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)}
              className="bg-white/[0.03] border-white/10 text-white" data-testid="input-offer-amount" />
            <Button type="submit" disabled={makeOffer.isPending || !offerAmount} className="w-full rounded-full bg-white text-[#0a0a0f] font-semibold hover:bg-white/90" data-testid="button-send-offer">
              {makeOffer.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send offer"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md bg-[#0a0a0f] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Where should we ship it?</DialogTitle>
            <DialogDescription className="text-white/50">US addresses only. You'll confirm and pay on the next screen.</DialogDescription>
          </DialogHeader>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); checkout.mutate(); }}>
            {([
              ["name", "Full name"], ["street1", "Street address"], ["street2", "Apt, suite (optional)"], ["city", "City"],
            ] as const).map(([key, label]) => (
              <Input key={key} placeholder={label} value={shipTo[key]} required={key !== "street2"}
                onChange={(e) => setShipTo({ ...shipTo, [key]: e.target.value })}
                className="bg-white/[0.03] border-white/10 text-white" data-testid={`input-ship-${key}`} />
            ))}
            <div className="flex gap-3">
              <Input placeholder="State (NY)" maxLength={2} value={shipTo.state} required
                onChange={(e) => setShipTo({ ...shipTo, state: e.target.value.toUpperCase() })}
                className="w-28 bg-white/[0.03] border-white/10 text-white" data-testid="input-ship-state" />
              <Input placeholder="ZIP" inputMode="numeric" maxLength={10} value={shipTo.zip} required
                onChange={(e) => setShipTo({ ...shipTo, zip: e.target.value })}
                className="flex-1 bg-white/[0.03] border-white/10 text-white" data-testid="input-ship-zip" />
            </div>
            <Button type="submit" disabled={checkout.isPending} className="w-full h-12 rounded-full bg-white text-[#0a0a0f] font-semibold hover:bg-white/90" data-testid="button-continue-checkout">
              {checkout.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue to payment"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
