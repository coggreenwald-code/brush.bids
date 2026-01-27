import { useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { Gavel, Clock, TrendingUp, AlertCircle, Heart, Loader2 } from "lucide-react";
import type { Artwork } from "@shared/schema";

interface UserBidSummary {
  artworkId: number;
  artwork: Artwork | null;
  userHighestBid: number;
  artworkHighestBid: number;
  isHighest: boolean;
  auctionEnded: boolean;
  latestBidAt: string | null;
}

function getTimeRemaining(createdAt: Date | string | null): string {
  if (!createdAt) return "Unknown";
  const created = new Date(createdAt);
  const endDate = new Date(created);
  endDate.setDate(endDate.getDate() + 7);
  
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  
  if (diff <= 0) return "Ended";
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

export default function MyBids() {
  const { user, isAuthenticated } = useAuth();

  const { data: bids, isLoading } = useQuery<UserBidSummary[]>({
    queryKey: ["/api/my-bids"],
    enabled: isAuthenticated,
  });

  const { activeBids, wonBids, outbidBids } = useMemo(() => {
    if (!bids) return { activeBids: [], wonBids: [], outbidBids: [] };
    
    const active: UserBidSummary[] = [];
    const won: UserBidSummary[] = [];
    const outbid: UserBidSummary[] = [];
    
    bids.forEach(bid => {
      if (bid.auctionEnded) {
        if (bid.isHighest) {
          won.push(bid);
        } else {
          outbid.push(bid);
        }
      } else {
        if (bid.isHighest) {
          active.push(bid);
        } else {
          outbid.push(bid);
        }
      }
    });
    
    return { activeBids: active, wonBids: won, outbidBids: outbid };
  }, [bids]);

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="p-8 text-center max-w-md">
            <Gavel className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-6">
              Please sign in to view your bids and watchlist.
            </p>
            <Button onClick={() => window.location.href = "/api/login"} data-testid="button-login-bids">
              Sign In
            </Button>
          </Card>
        </div>
        <Footer />
      </Layout>
    );
  }

  const stats = [
    { label: "Active Bids", value: activeBids.length, icon: Gavel, color: "text-primary" },
    { label: "Auctions Won", value: wonBids.length, icon: TrendingUp, color: "text-green-600" },
    { label: "Outbid", value: outbidBids.length, icon: AlertCircle, color: "text-orange-500" },
  ];

  return (
    <Layout>
      <div className="space-y-8 pb-16">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold">My Bids</h1>
          <p className="text-muted-foreground">Track your active bids and auction history</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? "-" : stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Outbid Alert */}
        {outbidBids.filter(b => !b.auctionEnded).length > 0 && (
          <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400 text-base">
                <AlertCircle className="w-5 h-5" />
                You've Been Outbid on {outbidBids.filter(b => !b.auctionEnded).length} Active Auction{outbidBids.filter(b => !b.auctionEnded).length > 1 ? 's' : ''}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Someone has placed a higher bid. Place a new bid to stay in the running!</p>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active" data-testid="tab-active-bids">
              Active ({isLoading ? "-" : activeBids.length})
            </TabsTrigger>
            <TabsTrigger value="outbid" data-testid="tab-outbid">
              Outbid ({isLoading ? "-" : outbidBids.length})
            </TabsTrigger>
            <TabsTrigger value="won" data-testid="tab-won-bids">
              Won ({isLoading ? "-" : wonBids.length})
            </TabsTrigger>
            <TabsTrigger value="watchlist" data-testid="tab-watchlist">
              Watchlist
            </TabsTrigger>
          </TabsList>

          {/* Active Bids Tab */}
          <TabsContent value="active" className="mt-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : activeBids.length === 0 ? (
              <Card className="p-12 text-center">
                <Gavel className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Bids</h3>
                <p className="text-muted-foreground mb-4">
                  You're not currently the highest bidder on any active auction.
                </p>
                <Link href="/gallery">
                  <Button data-testid="button-browse-gallery-bids">Browse Gallery</Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeBids.map((bid) => (
                  <Card key={bid.artworkId} className="p-4" data-testid={`card-bid-${bid.artworkId}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={bid.artwork?.imageUrl || "https://images.unsplash.com/photo-1579783902614-a3fb39279c0f?q=80&w=200"} 
                          alt={bid.artwork?.title || "Artwork"} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/artwork/${bid.artworkId}`}>
                          <h3 className="font-semibold hover:text-primary truncate" data-testid={`link-bid-artwork-${bid.artworkId}`}>
                            {bid.artwork?.title || `Artwork #${bid.artworkId}`}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>Ends in {getTimeRemaining(bid.artwork?.createdAt || null)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Your Bid</p>
                        <p className="text-lg font-mono font-bold">${bid.userHighestBid.toLocaleString()}</p>
                        <Badge className="mt-1 bg-green-600">Highest Bidder</Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Outbid Tab */}
          <TabsContent value="outbid" className="mt-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : outbidBids.length === 0 ? (
              <Card className="p-12 text-center">
                <TrendingUp className="w-12 h-12 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Outbid Items</h3>
                <p className="text-muted-foreground">
                  You haven't been outbid on any artwork. Keep bidding!
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {outbidBids.map((bid) => (
                  <Card key={bid.artworkId} className="p-4 border-orange-200 dark:border-orange-800" data-testid={`card-outbid-${bid.artworkId}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={bid.artwork?.imageUrl || "https://images.unsplash.com/photo-1579783902614-a3fb39279c0f?q=80&w=200"} 
                          alt={bid.artwork?.title || "Artwork"} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/artwork/${bid.artworkId}`}>
                          <h3 className="font-semibold hover:text-primary truncate">
                            {bid.artwork?.title || `Artwork #${bid.artworkId}`}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{bid.auctionEnded ? 'Auction Ended' : `Ends in ${getTimeRemaining(bid.artwork?.createdAt || null)}`}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Your Bid</p>
                        <p className="text-lg font-mono font-bold text-orange-600">${bid.userHighestBid.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Current: ${bid.artworkHighestBid.toLocaleString()}</p>
                        <Badge variant="outline" className="mt-1 border-orange-500 text-orange-600">Outbid</Badge>
                      </div>
                      {!bid.auctionEnded && (
                        <Link href={`/artwork/${bid.artworkId}`}>
                          <Button size="sm" data-testid={`button-rebid-${bid.artworkId}`}>Bid Again</Button>
                        </Link>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Won Tab */}
          <TabsContent value="won" className="mt-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : wonBids.length === 0 ? (
              <Card className="p-12 text-center">
                <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Won Auctions Yet</h3>
                <p className="text-muted-foreground">
                  Auctions you win will appear here.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {wonBids.map((bid) => (
                  <Card key={bid.artworkId} className="p-4 border-green-200 dark:border-green-800" data-testid={`card-won-${bid.artworkId}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={bid.artwork?.imageUrl || "https://images.unsplash.com/photo-1579783902614-a3fb39279c0f?q=80&w=200"} 
                          alt={bid.artwork?.title || "Artwork"} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/artwork/${bid.artworkId}`}>
                          <h3 className="font-semibold hover:text-primary truncate">
                            {bid.artwork?.title || `Artwork #${bid.artworkId}`}
                          </h3>
                        </Link>
                        <p className="text-sm text-green-600">Auction Ended - You Won!</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Winning Bid</p>
                        <p className="text-lg font-mono font-bold text-green-600">${bid.userHighestBid.toLocaleString()}</p>
                        <Badge className="mt-1 bg-green-600">Won</Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Watchlist Tab */}
          <TabsContent value="watchlist" className="mt-6">
            <Card className="p-12 text-center">
              <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Your Watchlist is Empty</h3>
              <p className="text-muted-foreground mb-4">
                Save artworks you love to keep track of their auctions.
              </p>
              <Link href="/gallery">
                <Button variant="outline" data-testid="button-explore-watchlist">Explore Artworks</Button>
              </Link>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </Layout>
  );
}
