import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useCharities() {
  return useQuery({
    queryKey: [api.charities.list.path],
    queryFn: async () => {
      const res = await fetch(api.charities.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch charities");
      return api.charities.list.responses[200].parse(await res.json());
    },
  });
}
