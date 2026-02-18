import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";
import type { Artwork, InsertArtwork, UpdateArtworkStatusRequest } from "@shared/schema";

export function useArtworks(filters?: { status?: string; artistId?: number }) {
  return useQuery({
    queryKey: [api.artworks.list.path, filters],
    queryFn: async () => {
      const url = filters 
        ? buildUrl(api.artworks.list.path) + `?${new URLSearchParams(filters as any).toString()}`
        : api.artworks.list.path;
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch artworks");
      return api.artworks.list.responses[200].parse(await res.json());
    },
  });
}

export function useArtwork(id: number) {
  return useQuery({
    queryKey: [api.artworks.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.artworks.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch artwork");
      return api.artworks.get.responses[200].parse(await res.json());
    },
  });
}

export function useCreateArtwork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertArtwork) => {
      const validated = api.artworks.create.input.parse(data);
      const res = await fetch(api.artworks.create.path, {
        method: api.artworks.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.artworks.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error('Failed to create artwork');
      }
      return api.artworks.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.artworks.list.path] }),
  });
}

export function useUpdateArtworkStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & UpdateArtworkStatusRequest) => {
      const url = buildUrl(api.artworks.updateStatus.path, { id });
      const res = await fetch(url, {
        method: api.artworks.updateStatus.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error('Failed to update status');
      return api.artworks.updateStatus.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.artworks.list.path] }),
  });
}

export function useDeleteArtwork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.artworks.delete.path, { id });
      const res = await fetch(url, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error('Failed to delete artwork');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.artworks.list.path] }),
  });
}

export function useAiReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.artworks.aiReview.path, { id });
      const res = await fetch(url, {
        method: api.artworks.aiReview.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error('Failed to generate AI review');
      return api.artworks.aiReview.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.artworks.list.path] }),
  });
}
