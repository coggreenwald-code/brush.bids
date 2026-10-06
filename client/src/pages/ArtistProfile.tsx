import { Layout } from "@/components/Layout";
import { artistDisplayName } from "@/lib/artistName";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { handleArtworkImageError } from "@/lib/imageFallback";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Palette, DollarSign, ShoppingBag, Calendar, FolderOpen } from "lucide-react";
import type { User, Artwork, PortfolioItem } from "@shared/schema";

export default function ArtistProfile() {
  const [, params] = useRoute("/artist/:id");
  const artistId = params?.id;

  const { data: artist, isLoading: loadingArtist } = useQuery<User>({
    queryKey: ['/api/users', artistId],
    enabled: !!artistId,
  });

  const { data: allArtworks, isLoading: loadingArtworks } = useQuery<Artwork[]>({
    queryKey: ['/api/artworks'],
  });

  const { data: portfolioItems } = useQuery<PortfolioItem[]>({
    queryKey: ['/api/portfolio', artistId],
    enabled: !!artistId,
  });

  const artistArtworks = allArtworks?.filter(a => String(a.artistId) === artistId) || [];
  const activeListings = artistArtworks.filter(a => a.status === "approved" && !a.paidAt);
  const soldWorks = artistArtworks.filter(a => a.paidAt);
  const pendingWorks = artistArtworks.filter(a => a.status === "pending");

  if (loadingArtist) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin w-8 h-8 text-white/30" />
        </div>
      </Layout>
    );
  }

  if (!artist) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-white">Artist Not Found</h1>
          <p className="text-white/50 mt-2">This profile doesn't exist.</p>
        </div>
      </Layout>
    );
  }

  const artistName = artistDisplayName(artist);

  const totalEarnings = soldWorks.reduce((sum, work) => sum + Number(work.price) * 0.75, 0);

  return (
    <Layout>
      <SEOHead title={`${artistName} | BrushBids`} description={`View artwork by ${artistName} on BrushBids.`} />
      <div className="max-w-5xl mx-auto space-y-8 pb-16 px-4 md:px-0">
        <div className="p-8 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <Avatar className="w-32 h-32">
              <AvatarImage src={artist.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${artistId}`} />
              <AvatarFallback className="text-4xl bg-white/10 text-white">{artist.firstName?.charAt(0) || 'A'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left">
              <span className="text-xs font-medium text-[#A78BFA] uppercase tracking-[0.3em]">Artist Profile</span>
              <h1 className="text-3xl font-display font-bold text-white mt-1" data-testid="text-artist-name">{artistName}</h1>
              <Badge variant="outline" className="mt-2 capitalize border-white/10 text-white/60">{artist.role}</Badge>
              {artist.createdAt && (
                <p className="text-sm text-white/40 mt-2 flex items-center justify-center md:justify-start gap-1">
                  <Calendar className="w-4 h-4" />
                  Member since {new Date(artist.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              )}
              <div className="mt-6">
                <h2 className="font-semibold text-white mb-2">About</h2>
                {artist.bio ? (
                  <p className="text-white/50" data-testid="text-artist-bio">{artist.bio}</p>
                ) : (
                  <p className="text-white/30 italic">This artist hasn't added a bio yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 text-center rounded-xl bg-white/[0.02] border border-white/5">
            <Palette className="w-8 h-8 mx-auto mb-2 text-[#A78BFA]" />
            <p className="text-3xl font-bold text-white">{artistArtworks.length}</p>
            <p className="text-sm text-white/40">Total Artworks</p>
          </div>
          <div className="p-6 text-center rounded-xl bg-white/[0.02] border border-white/5">
            <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
            <p className="text-3xl font-bold text-white">{soldWorks.length}</p>
            <p className="text-sm text-white/40">Works Sold</p>
          </div>
          <div className="p-6 text-center rounded-xl bg-white/[0.02] border border-white/5">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
            <p className="text-3xl font-bold text-white">${totalEarnings.toLocaleString()}</p>
            <p className="text-sm text-white/40">Total Earnings</p>
          </div>
        </div>

        {activeListings.length > 0 && (
          <div>
            <h2 className="text-2xl font-display font-bold text-white mb-6">Active Listings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeListings.map((artwork) => (
                <Link key={artwork.id} href={`/artwork/${artwork.id}`}>
                  <div className="overflow-visible rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors cursor-pointer hover-elevate" data-testid={`card-artwork-${artwork.id}`}>
                    <div className="aspect-[4/3] bg-white/5 relative rounded-t-xl overflow-hidden">
                      <img 
                        src={artwork.imageUrl || "https://images.unsplash.com/photo-1579783902614-a3fb39279c0f?q=80&w=400"} 
                        alt={artwork.title}
                        onError={handleArtworkImageError}
                        className="w-full h-full object-cover"
                      />
                      {artwork.promotionPercentage && artwork.promotionPercentage > 0 && (
                        <Badge className="absolute top-2 right-2 bg-[#A78BFA] text-[#0a0a0f]">Boosted</Badge>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-white truncate">{artwork.title}</h3>
                      <p className="text-lg font-mono font-bold text-emerald-400 mt-1">${Number(artwork.price).toLocaleString()}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {soldWorks.length > 0 && (
          <div>
            <h2 className="text-2xl font-display font-bold text-white mb-6">Past Sales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {soldWorks.map((artwork) => (
                <Link key={artwork.id} href={`/artwork/${artwork.id}`}>
                  <div className="overflow-visible rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors cursor-pointer opacity-75 hover-elevate" data-testid={`card-sold-artwork-${artwork.id}`}>
                    <div className="aspect-[4/3] bg-white/5 relative rounded-t-xl overflow-hidden">
                      <img 
                        src={artwork.imageUrl || "https://images.unsplash.com/photo-1579783902614-a3fb39279c0f?q=80&w=400"} 
                        alt={artwork.title}
                        onError={handleArtworkImageError}
                        className="w-full h-full object-cover grayscale"
                      />
                      <Badge className="absolute top-2 right-2 bg-emerald-500 text-white">Sold</Badge>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-white truncate">{artwork.title}</h3>
                      <p className="text-lg font-mono font-bold text-white/40 mt-1">${Number(artwork.price).toLocaleString()}</p>
                      {artwork.paidAt && (
                        <p className="text-xs text-white/30 mt-1">
                          Sold {new Date(artwork.paidAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {portfolioItems && portfolioItems.length > 0 && (
          <div>
            <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-2">
              <FolderOpen className="w-6 h-6 text-[#60A5FA]" /> Portfolio
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolioItems.map((item) => (
                <div key={item.id} className="overflow-visible rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors" data-testid={`card-portfolio-${item.id}`}>
                  <div className="aspect-square bg-white/5 relative rounded-t-xl overflow-hidden">
                    <img src={item.imageUrl} alt={item.title} onError={handleArtworkImageError} className="w-full h-full object-cover" />
                    {item.listedForSale && (
                      <Badge className="absolute top-2 right-2 bg-[#A78BFA] text-[#0a0a0f]">For Sale</Badge>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-white truncate">{item.title}</h3>
                    {item.dimensions && <p className="text-xs text-white/30">{item.dimensions}</p>}
                    {item.listedForSale && item.price && (
                      <p className="text-lg font-mono font-bold text-emerald-400 mt-1">${Number(item.price).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {artistArtworks.length === 0 && (!portfolioItems || portfolioItems.length === 0) && !loadingArtworks && (
          <div className="p-12 text-center rounded-xl bg-white/[0.02] border border-white/5">
            <Palette className="w-12 h-12 mx-auto mb-4 text-white/20" />
            <h3 className="text-xl font-semibold text-white">No Artworks Yet</h3>
            <p className="text-white/50 mt-2">This artist hasn't submitted any artworks yet.</p>
          </div>
        )}
      </div>

      <Footer />
    </Layout>
  );
}
