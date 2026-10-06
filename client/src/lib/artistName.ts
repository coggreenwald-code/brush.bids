type NamedArtist = { firstName?: string | null; lastName?: string | null; username?: string | null } | null | undefined;

// Public display name for an artist. Falls back to a generic label rather than
// exposing internal ids, which read as random numbers to buyers.
export function artistDisplayName(artist: NamedArtist): string {
  const full = [artist?.firstName, artist?.lastName].filter(Boolean).join(" ").trim();
  if (full) return full;
  if (artist?.username && !/^\d+$/.test(artist.username)) return artist.username;
  return "BrushBids Artist";
}
