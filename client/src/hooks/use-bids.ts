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
        if (res.status === 400) {
          const error = api.bids.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error('Failed to place bid');
      }
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: [api.bids.list.path, variables.artworkId] 
      });
      queryClient.invalidateQueries({
        queryKey: [api.artworks.get.path, variables.artworkId],
      });
    },
  });
}
