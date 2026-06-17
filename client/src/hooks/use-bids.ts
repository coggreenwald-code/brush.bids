import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertBid } from "@shared/schema";

export function useBids(artworkId: number) {
  return useQuery({
    queryKey: [api.bids.list.path, artworkId],
    queryFn: async () => {
      const url = buildUrl(api.bids.list.path, { artworkId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch bids");
      return api.bids.list.responses[200].parse(await res.json());
    },
    enabled: !!artworkId,
  });
}

export function usePlaceBid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertBid) => {
      const validated = api.bids.create.input.parse(data);
      const res = await fetch(api.bids.create.path, {
        method: api.bids.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        let message = 'Failed to place bid';
        try {
          const body = await res.json();
          if (body?.message) message = body.message;
        } catch {/* non-JSON body */}
        throw new Error(message);
      }
      return await res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [api.bids.list.path, variables.artworkId],
      });
      queryClient.invalidateQueries({
        queryKey: [api.artworks.get.path, variables.artworkId],
      });
      // Redirect to Stripe Checkout to authorize the card hold; the bid is
      // persisted as authorized when the webhook fires after checkout.
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
  });
}

type BuyNowInput = {
  artworkId: number;
  bidderId: string;
  shippingStreet?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
  shippingCarrier?: string;
  shippingService?: string;
  shippingAmount?: string;
};

// Buy It Now — charges immediately. Redirects to Stripe Checkout; the sale is
// finalized (artwork marked sold, auction ended, other holds released) by the
// webhook once payment confirms.
export function useBuyNow() {
  return useMutation({
    mutationFn: async (data: BuyNowInput) => {
      const validated = api.buyout.create.input.parse(data);
      const res = await fetch(api.buyout.create.path, {
        method: api.buyout.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        let message = 'Failed to start checkout';
        try {
          const body = await res.json();
          if (body?.message) message = body.message;
        } catch {/* non-JSON body */}
        throw new Error(message);
      }
      return await res.json();
    },
    onSuccess: (data) => {
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
  });
}
