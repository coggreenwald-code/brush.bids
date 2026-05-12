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
