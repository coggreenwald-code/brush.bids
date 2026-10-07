import { Link } from "wouter";
import { artistDisplayName } from "@/lib/artistName";
import { type Artwork, type User } from "@shared/schema";
import { Rocket } from "lucide-react";
import { askingPrice } from "@shared/pricing";
import { useCharities } from "@/hooks/use-charities";
import { CHARITY_PERCENT, SHOW_CHARITY_NAMES } from "@shared/siteConfig";
import { handleArtworkImageError } from "@/lib/imageFallback";

interface ArtworkCardProps {
  artwork: Artwork & { artist?: User };
  showStatus?: boolean;
}

export function ArtworkCard({ artwork, showStatus = false }: ArtworkCardProps) {
  const displayImage = artwork.imageUrl || "https://images.unsplash.com/photo-1579783902614-a3fb39279c0f?q=80&w=800&auto=format&fit=crop";
  const { data: charities } = useCharities();
  const charityLabel = SHOW_CHARITY_NAMES
    ? artwork.charityNote || charities?.find(c => c.id === artwork.charityId)?.name
    : (artwork.charityId || artwork.charityNote) ? "charity" : undefined;

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
            <p className="text-[#34D399] text-sm font-semibold mt-1">
              {artwork.paidAt ? "Sold" : `$${askingPrice(artwork).toLocaleString()}`}
            </p>
          </div>
        </div>

        <div className="p-5 flex flex-col flex-1">
          <h3 className="font-display text-lg font-semibold text-white line-clamp-1 group-hover:text-[#F472B6] transition-colors duration-300">
            {artwork.title}
          </h3>
          <p className="text-sm text-white/50 mt-1">
            by{" "}
            <span className="font-medium text-white/70">
              {artistDisplayName(artwork.artist)}
            </span>
          </p>
          {charityLabel && (
            <p className="text-xs text-emerald-400/70 mt-1" data-testid={`text-charity-${artwork.id}`}>
              {CHARITY_PERCENT}% to {charityLabel}
            </p>
          )}
          {artwork.status === "approved" && (
            <div className="flex items-center justify-between mt-3 text-sm" data-testid={`price-${artwork.id}`}>
              <span className={artwork.paidAt ? "text-white/40 line-through" : "font-semibold text-[#34D399]"}>
                ${askingPrice(artwork).toLocaleString()}
              </span>
              {artwork.paidAt && <span className="text-xs font-medium uppercase tracking-wider text-white/50">Sold</span>}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
