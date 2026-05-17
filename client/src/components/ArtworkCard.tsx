import { Link } from "wouter";
import { type Artwork, type User } from "@shared/schema";
import { Rocket, Clock } from "lucide-react";
import { useCharities } from "@/hooks/use-charities";
import { handleArtworkImageError } from "@/lib/imageFallback";

function getAuctionEndDate(artwork: Artwork): Date {
  if (artwork.endTime) return new Date(artwork.endTime);
  const d = new Date(artwork.createdAt || new Date());
  d.setDate(d.getDate() + (artwork.auctionDurationDays || 7));
  return d;
}

function getTimeLeftLabel(endDate: Date): string {
  const diff = endDate.getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h left`;
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

interface ArtworkCardProps {
  artwork: Artwork & { artist?: User };
  showStatus?: boolean;
}

export function ArtworkCard({ artwork, showStatus = false }: ArtworkCardProps) {
  const displayImage = artwork.imageUrl || "https://images.unsplash.com/photo-1579783902614-a3fb39279c0f?q=80&w=800&auto=format&fit=crop";
  const { data: charities } = useCharities();
  const charityLabel = artwork.charityNote || charities?.find(c => c.id === artwork.charityId)?.name;

  return (
    <Link href={`/artwork/${artwork.id}`}>
      <div
        className="group cursor-pointer bg-white/[0.02] border border-white/5 rounded-md transition-all duration-300 hover:border-white/10 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] h-full flex flex-col"
        data-testid={`card-artwork-${artwork.id}`}
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-t-md bg-white/[0.02]">
          <img
            src={displayImage}
            alt={artwork.title}
            onError={handleArtworkImageError}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {showStatus && (
            <div className="absolute top-3 right-3 z-10">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  artwork.status === "approved"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : artwork.status === "rejected"
                    ? "bg-red-500/20 text-red-300 border border-red-500/30"
                    : "bg-white/10 text-white/60 border border-white/10"
                }`}
              >
                {artwork.status}
              </span>
            </div>
          )}

          <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
            {(artwork.promotionPercentage ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#A78BFA]/20 text-[#A78BFA] border border-[#A78BFA]/30 backdrop-blur-sm">
                <Rocket className="w-3 h-3" />
                Boosted
              </span>
            )}
          </div>

          <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            <p className="text-white/80 text-sm font-medium">View artwork</p>
            {artwork.price && (
              <p className="text-[#34D399] text-sm font-semibold mt-1">
                Starting at ${Number(artwork.price).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        <div className="p-5 flex flex-col flex-1">
          <h3 className="font-display text-lg font-semibold text-white line-clamp-1 group-hover:text-[#F472B6] transition-colors duration-300">
            {artwork.title}
          </h3>
          <p className="text-sm text-white/50 mt-1">
            by{" "}
            <span className="font-medium text-white/70">
              {artwork.artist
                ? `${artwork.artist.firstName || ""} ${artwork.artist.lastName || ""}`.trim() || artwork.artistId
                : artwork.artistId}
            </span>
          </p>
          {charityLabel && (
            <p className="text-xs text-emerald-400/70 mt-1" data-testid={`text-charity-${artwork.id}`}>
              5% → {charityLabel}
            </p>
          )}
          {artwork.status === "approved" && (
            <div
              className="flex items-center gap-1 mt-3 text-xs text-[#60A5FA]/70"
              data-testid={`auction-time-${artwork.id}`}
            >
              <Clock className="w-3 h-3" />
              {(() => {
                const endDate = getAuctionEndDate(artwork);
                const label = getTimeLeftLabel(endDate);
                return (
                  <span className={label === "Ended" ? "text-red-400 font-medium" : ""}>
                    {label}
                  </span>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
