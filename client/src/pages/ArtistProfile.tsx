import { Layout } from "@/components/Layout";
import { Footer } from "@/components/Footer";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
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
          <Loader2 className="animate-spin w-8 h-8" />
        </div>
      </Layout>
    );
  }

  if (!artist) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold">Artist Not Found</h1>
          <p className="text-muted-foreground mt-2">This profile doesn't exist.</p>
        </div>
      </Layout>
    );
  }

  const artistName = artist.firstName && artist.lastName 
    ? `${artist.firstName} ${artist.lastName}` 
    : artist.username || `Artist #${artistId}`;

  const totalEarnings = soldWorks.reduce((sum, work) => sum + Number(work.price) * 0.75, 0);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8 pb-16">
        <Card className="p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <Avatar className="w-32 h-32">
              <AvatarImage src={artist.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${artistId}`} />
              <AvatarFallback className="text-4xl">{artist.firstName?.charAt(0) || 'A'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-display font-bold" data-testid="text-artist-name">{artistName}</h1>
              <Badge variant="secondary" className="mt-2 capitalize">{artist.role}</Badge>
              {artist.createdAt && (
                <p className="text-sm text-muted-foreground mt-2 flex items-center justify-center md:justify-start gap-1">
                  <Calendar className="w-4 h-4" />
                  Member since {new Date(artist.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              )}
              <div className="mt-6">
                <h2 className="font-semibold mb-2">About</h2>
                {artist.bio ? (
                  <p className="text-muted-foreground" data-testid="text-artist-bio">{artist.bio}</p>
                ) : (
                  <p className="text-muted-foreground italic">This artist hasn't added a bio yet.</p>
                )}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 text-center">
            <Palette className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-3xl font-bold">{artistArtworks.length}</p>
            <p className="text-sm text-muted-foreground">Total Artworks</p>
          </Card>
          <Card className="p-6 text-center">
            <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <p className="text-3xl font-bold">{soldWorks.length}</p>
            <p className="text-sm text-muted-foreground">Works Sold</p>
          </Card>
          <Card className="p-6 text-center">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-3xl font-bold">${totalEarnings.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total Earnings</p>
          </Card>
        </div>

        {activeListings.length > 0 && (
          <div>
            <h2 className="text-2xl font-display font-bold mb-6">Active Listings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeListings.map((artwork) => (
                <Link key={artwork.id} href={`/artwork/${artwork.id}`}>
                  <Card className="overflow-hidden hover-elevate cursor-pointer" data-testid={`card-artwork-${artwork.id}`}>
                    <div className="aspect-[4/3] bg-muted relative">
                      <img 
                        src={artwork.imageUrl || "https://images.unsplash.com/photo-1579783902614-a3fb39279c0f?q=80&w=400"} 
                        alt={artwork.title}
                        className="w-full h-full object-cover"
                      />
                      {artwork.promotionPercentage && artwork.promotionPercentage > 0 && (
                        <Badge className="absolute top-2 right-2 bg-[#B8965A]">Boosted</Badge>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold truncate">{artwork.title}</h3>
                      <p className="text-lg font-mono font-bold text-primary mt-1">${Number(artwork.price).toLocaleString()}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {soldWorks.length > 0 && (
          <div>
            <h2 className="text-2xl font-display font-bold mb-6">Past Sales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {soldWorks.map((artwork) => (
                <Link key={artwork.id} href={`/artwork/${artwork.id}`}>
                  <Card className="overflow-hidden hover-elevate cursor-pointer opacity-75" data-testid={`card-sold-artwork-${artwork.id}`}>
                    <div className="aspect-[4/3] bg-muted relative">
                      <img 
                        src={artwork.imageUrl || "https://images.unsplash.com/photo-1579783902614-a3fb39279c0f?q=80&w=400"} 
                        alt={artwork.title}
                        className="w-full h-full object-cover grayscale"
                      />
                      <Badge className="absolute top-2 right-2 bg-green-600">Sold</Badge>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold truncate">{artwork.title}</h3>
                      <p className="text-lg font-mono font-bold text-muted-foreground mt-1">${Number(artwork.price).toLocaleString()}</p>
                      {artwork.paidAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Sold {new Date(artwork.paidAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {portfolioItems && portfolioItems.length > 0 && (
          <div>
            <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
              <FolderOpen className="w-6 h-6" /> Portfolio
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolioItems.map((item) => (
                <Card key={item.id} className="overflow-hidden" data-testid={`card-portfolio-${item.id}`}>
                  <div className="aspect-square bg-muted relative">
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                    {item.listedForSale && (
                      <Badge className="absolute top-2 right-2 bg-[#B8965A]">For Sale</Badge>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold truncate">{item.title}</h3>
                    {item.dimensions && <p className="text-xs text-muted-foreground">{item.dimensions}</p>}
                    {item.listedForSale && item.price && (
                      <p className="text-lg font-mono font-bold text-primary mt-1">${Number(item.price).toLocaleString()}</p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {artistArtworks.length === 0 && (!portfolioItems || portfolioItems.length === 0) && !loadingArtworks && (
          <Card className="p-12 text-center">
            <Palette className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold">No Artworks Yet</h3>
            <p className="text-muted-foreground mt-2">This artist hasn't submitted any artworks yet.</p>
          </Card>
        )}
      </div>

      <Footer />
    </Layout>
  );
}
