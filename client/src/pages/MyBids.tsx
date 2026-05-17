import { useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import { handleArtworkImageError } from "@/lib/imageFallback";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { Gavel, Clock, TrendingUp, AlertCircle, Heart, Loader2 } from "lucide-react";
import type { Artwork } from "@shared/schema";

type HoldStatus = "pending" | "authorized" | "captured" | "canceled" | "failed";

interface UserBidSummary {
  artworkId: number;
  artwork: Artwork | null;
  userHighestBid: number;
  artworkHighestBid: number;
  isHighest: boolean;
  auctionEnded: boolean;
  latestBidAt: string | null;
  isPaid: boolean;
  holdStatus: HoldStatus;
  taxAmount: number | null;
  taxRate: number | null;
  taxJurisdiction: string | null;
  capturedAt: string | null;
}

function TaxLine({ bid }: { bid: UserBidSummary }) {
  if (bid.taxAmount == null || bid.taxAmount <= 0) return null;
  const total = bid.userHighestBid + bid.taxAmount;
  return (
    <div className="mt-2 text-xs space-y-0.5 text-right" data-testid={`text-tax-line-${bid.artworkId}`}>
      <div className="flex items-center justify-end gap-2 text-white/40">
        <span>Sales tax{bid.taxJurisdiction ? ` (${bid.taxJurisdiction})` : ""}</span>
        <span className="font-mono text-emerald-300">+${bid.taxAmount.toFixed(2)}</span>
      </div>
      <div className="flex items-center justify-end gap-2 text-white/60">
        <span>Total charged</span>
        <span className="font-mono text-white">${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
    </div>
  );
}

// Maps the raw bid hold state to user-facing copy. Authorized = card hold
// placed but not yet charged. Charged = scheduler captured the hold after
// auction end. Released = the user was outbid and their hold was canceled.
function HoldStatusBadge({ status }: { status: HoldStatus }) {
  const map: Record<HoldStatus, { label: string; className: string }> = {
    pending:    { label: "Awaiting Authorization", className: "bg-white/10 text-white/60 border border-white/10" },
    authorized: { label: "Authorized (Hold)",      className: "bg-[#A78BFA]/20 text-[#A78BFA] border border-[#A78BFA]/20" },
    captured:   { label: "Charged",                className: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" },
    canceled:   { label: "Released",               className: "bg-white/5 text-white/40 border border-white/10" },
    failed:     { label: "Failed",                 className: "bg-red-500/15 text-red-400 border border-red-500/20" },
  };
  const { label, className } = map[status];
  return <Badge className={`mt-1 ${className}`} data-testid={`badge-hold-${status}`}>{label}</Badge>;
}

function getTimeRemaining(artwork: { endTime?: Date | string | null; createdAt?: Date | string | null; auctionDurationDays?: number | null } | null): string {
  if (!artwork) return "Unknown";
  let end: Date;
  if (artwork.endTime) {
    end = new Date(artwork.endTime);
  } else if (artwork.createdAt) {
    end = new Date(artwork.createdAt);
    end.setDate(end.getDate() + (artwork.auctionDurationDays || 7));
  } else {
    return "Unknown";
  }
  const diff = end.getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

export default function MyBids() {
  const { isAuthenticated } = useAuth();

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
          <div className="p-8 text-center max-w-md rounded-xl bg-white/[0.02] border border-white/5">
            <Gavel className="w-12 h-12 mx-auto text-white/30 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Sign In Required</h2>
            <p className="text-white/50 mb-6">
              Please sign in to view your bids and watchlist.
            </p>
            <Button onClick={() => window.location.href = "/api/login"} className="rounded-full bg-white text-[#0a0a0f] font-semibold hover:bg-white/90" data-testid="button-login-bids">
              Sign In
            </Button>
          </div>
        </div>
        <Footer />
      </Layout>
    );
  }

  const stats = [
    { label: "Active Bids", value: activeBids.length, icon: Gavel, color: "text-[#A78BFA]" },
    { label: "Auctions Won", value: wonBids.length, icon: TrendingUp, color: "text-emerald-400" },
    { label: "Outbid", value: outbidBids.length, icon: AlertCircle, color: "text-orange-400" },
  ];

  return (
    <Layout>
      <div className="space-y-8 pb-16">
        <div>
          <span className="text-xs font-medium text-[#A78BFA] uppercase tracking-[0.3em]">Activity</span>
          <h1 className="text-3xl font-display font-bold text-white mt-1">My Bids</h1>
          <p className="text-white/50">Track your active bids and auction history</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between gap-2 pb-2">
                <span className="text-sm font-medium text-white/50">{stat.label}</span>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold text-white">{isLoading ? "-" : stat.value}</div>
            </div>
          ))}
        </div>

        {outbidBids.filter(b => !b.auctionEnded).length > 0 && (
          <div className="p-5 rounded-xl bg-orange-500/5 border border-orange-500/10">
            <div className="flex items-center gap-2 text-orange-400 font-semibold text-base pb-2">
              <AlertCircle className="w-5 h-5" />
              You've Been Outbid on {outbidBids.filter(b => !b.auctionEnded).length} Active Auction{outbidBids.filter(b => !b.auctionEnded).length > 1 ? 's' : ''}
            </div>
            <p className="text-sm text-white/50">Someone has placed a higher bid. Place a new bid to stay in the running!</p>
          </div>
        )}

        <Tabs defaultValue="active">
          <TabsList className="max-sm:mx-3 max-sm:w-[calc(100%-1.5rem)] max-sm:flex-wrap max-sm:gap-1">
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

          <TabsContent value="active" className="mt-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-white/30" />
              </div>
            ) : activeBids.length === 0 ? (
              <div className="p-12 text-center rounded-xl bg-white/[0.02] border border-white/5">
                <Gavel className="w-12 h-12 mx-auto text-white/20 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Active Bids</h3>
                <p className="text-white/50 mb-4">
                  You're not currently the highest bidder on any active auction.
                </p>
                <Link href="/gallery">
                  <Button className="rounded-full bg-white text-[#0a0a0f] font-semibold hover:bg-white/90" data-testid="button-browse-gallery-bids">Browse Gallery</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {activeBids.map((bid) => (
                  <div key={bid.artworkId} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors" data-testid={`card-bid-${bid.artworkId}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                        <img 
                          src={bid.artwork?.imageUrl || "https://images.unsplash.com/photo-1579783902614-a3fb39279c0f?q=80&w=200"} 
                          alt={bid.artwork?.title || "Artwork"} 
                          onError={handleArtworkImageError}
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/artwork/${bid.artworkId}`}>
                          <h3 className="font-semibold text-white hover:text-[#A78BFA] truncate transition-colors" data-testid={`link-bid-artwork-${bid.artworkId}`}>
                            {bid.artwork?.title || `Artwork #${bid.artworkId}`}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-2 text-sm text-white/40">
                          <Clock className="w-3 h-3" />
                          <span>Ends in {getTimeRemaining(bid.artwork || null)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-white/40">Your Bid</p>
                        <p className="text-lg font-mono font-bold text-white">${bid.userHighestBid.toLocaleString()}</p>
                        <Badge className="mt-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">Highest Bidder</Badge>
                        <HoldStatusBadge status={bid.holdStatus} />
                        <TaxLine bid={bid} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="outbid" className="mt-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-white/30" />
              </div>
            ) : outbidBids.length === 0 ? (
              <div className="p-12 text-center rounded-xl bg-white/[0.02] border border-white/5">
                <TrendingUp className="w-12 h-12 mx-auto text-emerald-400/50 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Outbid Items</h3>
                <p className="text-white/50">
                  You haven't been outbid on any artwork. Keep bidding!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {outbidBids.map((bid) => (
                  <div key={bid.artworkId} className="p-4 rounded-xl bg-white/[0.02] border border-orange-500/10 hover:border-orange-500/20 transition-colors" data-testid={`card-outbid-${bid.artworkId}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                        <img 
                          src={bid.artwork?.imageUrl || "https://images.unsplash.com/photo-1579783902614-a3fb39279c0f?q=80&w=200"} 
                          alt={bid.artwork?.title || "Artwork"} 
                          onError={handleArtworkImageError}
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/artwork/${bid.artworkId}`}>
                          <h3 className="font-semibold text-white hover:text-[#A78BFA] truncate transition-colors">
                            {bid.artwork?.title || `Artwork #${bid.artworkId}`}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-2 text-sm text-white/40">
                          <Clock className="w-3 h-3" />
                          <span>{bid.auctionEnded ? 'Auction Ended' : `Ends in ${getTimeRemaining(bid.artwork || null)}`}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-white/40">Your Bid</p>
                        <p className="text-lg font-mono font-bold text-orange-400">${bid.userHighestBid.toLocaleString()}</p>
                        <p className="text-xs text-white/40">Current: ${bid.artworkHighestBid.toLocaleString()}</p>
                        <Badge variant="outline" className="mt-1 border-orange-500/30 text-orange-400 bg-orange-500/10">Outbid</Badge>
                        <HoldStatusBadge status={bid.holdStatus} />
                      </div>
                      {!bid.auctionEnded && (
                        <Link href={`/artwork/${bid.artworkId}`}>
                          <Button size="sm" className="rounded-full bg-white text-[#0a0a0f] font-semibold hover:bg-white/90" data-testid={`button-rebid-${bid.artworkId}`}>Bid Again</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="won" className="mt-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-white/30" />
              </div>
            ) : wonBids.length === 0 ? (
              <div className="p-12 text-center rounded-xl bg-white/[0.02] border border-white/5">
                <TrendingUp className="w-12 h-12 mx-auto text-white/20 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Won Auctions Yet</h3>
                <p className="text-white/50">
                  Auctions you win will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {wonBids.map((bid) => (
                  <div key={bid.artworkId} className="p-4 rounded-xl bg-white/[0.02] border border-emerald-500/10 hover:border-emerald-500/20 transition-colors" data-testid={`card-won-${bid.artworkId}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                        <img 
                          src={bid.artwork?.imageUrl || "https://images.unsplash.com/photo-1579783902614-a3fb39279c0f?q=80&w=200"} 
                          alt={bid.artwork?.title || "Artwork"} 
                          onError={handleArtworkImageError}
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/artwork/${bid.artworkId}`}>
                          <h3 className="font-semibold text-white hover:text-[#A78BFA] truncate transition-colors">
                            {bid.artwork?.title || `Artwork #${bid.artworkId}`}
                          </h3>
                        </Link>
                        <p className="text-sm text-emerald-400">Auction Ended - You Won!</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-white/40">Winning Bid</p>
                        <p className="text-lg font-mono font-bold text-emerald-400">${bid.userHighestBid.toLocaleString()}</p>
                        <HoldStatusBadge status={bid.holdStatus} />
                        <TaxLine bid={bid} />
                      </div>
                      {bid.holdStatus === 'authorized' && (
                        <div className="text-right text-xs text-white/40 max-w-[160px]">
                          Charging your card on file…<br />
                          You'll get a receipt by email.
                        </div>
                      )}
                      {bid.holdStatus === 'failed' && (
                        <div className="text-right text-xs text-red-400 max-w-[160px]">
                          Card authorization failed. Please contact support.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="watchlist" className="mt-6">
            <div className="p-12 text-center rounded-xl bg-white/[0.02] border border-white/5">
              <Heart className="w-12 h-12 mx-auto text-white/20 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Your Watchlist is Empty</h3>
              <p className="text-white/50 mb-4">
                Save artworks you love to keep track of their auctions.
              </p>
              <Link href="/gallery">
                <Button variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10" data-testid="button-explore-watchlist">Explore Artworks</Button>
              </Link>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </Layout>
  );
}
