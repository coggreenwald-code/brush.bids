import type { SyntheticEvent } from "react";

export const ARTWORK_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1579783902614-a3fb39279c0f?q=80&w=800&auto=format&fit=crop";

export function handleArtworkImageError(
  e: SyntheticEvent<HTMLImageElement, Event>,
) {
  const img = e.currentTarget;
  if (img.src === ARTWORK_FALLBACK_IMAGE) return;
  img.src = ARTWORK_FALLBACK_IMAGE;
}
