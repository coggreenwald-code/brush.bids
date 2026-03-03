import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Footer } from "@/components/Footer";
import { useArtwork } from "@/hooks/use-artworks";
import { useBids, usePlaceBid } from "@/hooks/use-bids";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Loader2, DollarSign, Clock, Heart, Share2, Twitter, Facebook, Copy, Check, User, QrCode, Ruler, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import type { User as UserType } from "@shared/schema";
import { QRCodeModal } from "@/components/QRCodeModal";

const bidSchema = z.object({
  amount: z.coerce.number().min(1, "Bid must be at least $1"),
});

function CountdownTimer({ endDate }: { endDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: false });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const diff = endDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: true });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        ended: false,
      });
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  if (timeLeft.ended) {
    return (
      <div className="flex items-center gap-2 text-red-400 font-semibold" data-testid="text-auction-ended">
        <Clock className="w-4 h-4" /> Auction Ended
      </div>
    );
  }

  const isUrgent = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes < 5;

  return (
    <div className="flex gap-3" data-testid="countdown-timer">
      {[
        { value: timeLeft.days, label: "Days" },
        { value: timeLeft.hours, label: "Hrs" },
        { value: timeLeft.minutes, label: "Min" },
        { value: timeLeft.seconds, label: "Sec" },
      ].map(({ value, label }) => (
        <div key={label} className="text-center">
          <div className={`font-mono text-2xl font-bold tracking-tight ${isUrgent ? 'text-red-400' : 'text-white'}`}>
            {value.toString().padStart(2, '0')}
          </div>
          <div className={`text-[10px] uppercase tracking-[0.15em] mt-1 ${isUrgent ? 'text-red-400/60' : 'text-white/40'}`}>
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ArtworkDetail() {
  const [match, params] = useRoute("/artwork/:id");
  const id = parseInt(params?.id || "0");
  const { data: artwork, isLoading: loadingArtwork } = useArtwork(id);
  const { data: bids, isLoading: loadingBids } = useBids(id);
  const { user } = useAuth();
  const placeBid = usePlaceBid();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const { data: artist } = useQuery<UserType>({
    queryKey: ['/api/users', artwork?.artistId],
    enabled: !!artwork?.artistId,
  });

  const form = useForm({
    resolver: zodResolver(bidSchema),
    defaultValues: { amount: "" },
  });

  if (loadingArtwork) return <Layout><div className="flex justify-center py-20"><Loader2 className="animate-spin text-white/40" /></div></Layout>;
  if (!artwork) return <Layout><div className="text-center py-20 text-white/60">Artwork not found</div></Layout>;

  const currentPrice = bids && bids.length > 0 
    ? Math.max(...bids.map(b => Number(b.amount))) 
    : Number(artwork.price);

  const auctionEndDate = artwork.endTime 
    ? new Date(artwork.endTime)
    : (() => {
        const d = new Date(artwork.createdAt || new Date());
        d.setDate(d.getDate() + ((artwork as any).auctionDurationDays || 7));
        return d;
      })();
  const isAuctionEnded = auctionEndDate <= new Date();

  const onSubmit = (data: { amount: string }) => {
    const amount = Number(data.amount);
    if (amount <= currentPrice) {
      form.setError("amount", { message: `Bid must be higher than current price ($${currentPrice})` });
      return;
    }
    
    if (!user) {
      toast({ title: "Please login", description: "You must be logged in to place a bid", variant: "destructive" });
      return;
    }

    placeBid.mutate({
      artworkId: artwork.id,
      bidderId: user.id as unknown as string,
      amount: amount.toString(),
    }, {
      onSuccess: (data: any) => {
        if (data?.auctionExtended) {
          toast({ 
            title: "Bid Placed + Time Extended!", 
            description: `You bid $${amount}. The auction was extended by 2 minutes due to last-minute bidding.` 
          });
        } else {
          toast({ title: "Bid Placed!", description: `You successfully bid $${amount}` });
        }
        form.reset();
      }
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link copied!", description: "Share this artwork with others" });
  };

  const handleSave = () => {
    setSaved(!saved);
    toast({ 
      title: saved ? "Removed from watchlist" : "Added to watchlist",
      description: saved ? "You won't receive updates for this artwork" : "You'll be notified of bid changes"
    });
  };

  const displayImage = artwork.imageUrl || "https://images.unsplash.com/photo-1579783902614-a3fb39279c0f?q=80&w=800&auto=format&fit=crop";

  const revenueSplit = {
    artist: currentPrice * 0.75,
    platform: currentPrice * 0.15,
    charity: currentPrice * 0.10,
  };

  const isActiveAuction = artwork.status === 'approved' && !isAuctionEnded;

  return (
    <Layout>
      <div className="w-full">
        <div className="mb-8">
          <Link href="/gallery">
            <span className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm cursor-pointer" data-testid="link-back-gallery">
              <ArrowLeft className="w-4 h-4" />
              Back to Gallery
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-7 space-y-8">
            <div className="relative rounded-md overflow-hidden bg-white/[0.02] aspect-[4/5]">
              <img src={displayImage} alt={artwork.title} className="w-full h-full object-cover" data-testid="img-artwork" />
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-md p-6">
              <p className="text-xs font-medium text-violet-400 uppercase tracking-[0.3em] mb-5">Revenue Distribution</p>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-white/60">Artist (75%)</span>
                    <span className="font-mono text-sm font-semibold text-white">${revenueSplit.artist.toFixed(2)}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-violet-500" style={{ width: '75%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-white/60">BrushBids (15%)</span>
                    <span className="font-mono text-sm text-white/70">${revenueSplit.platform.toFixed(2)}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-blue-400" style={{ width: '15%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-emerald-400/80">Charity (10%)</span>
                    <span className="font-mono text-sm font-semibold text-emerald-400">${revenueSplit.charity.toFixed(2)}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: '10%' }} />
                  </div>
                </div>
              </div>
              {artwork.charityId && (
                <div className="mt-5 pt-4 border-t border-white/5">
                  <p className="text-sm text-white/40">Supporting: <span className="font-medium text-white/70">Arts Education Foundation</span></p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {artwork.status === 'pending' && (
                  <span className="text-xs font-medium text-violet-400 uppercase tracking-[0.3em]">Pending Review</span>
                )}
                {artwork.status === 'approved' && (
                  <span className="text-xs font-medium text-violet-400 uppercase tracking-[0.3em]">Live Auction</span>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6 leading-tight" data-testid="text-artwork-title">{artwork.title}</h1>
              <Link href={`/artist/${artwork.artistId}`}>
                <div className="flex items-center gap-4 cursor-pointer group" data-testid="link-artist-profile">
                  <Avatar className="w-10 h-10 border border-white/10">
                    <AvatarImage src={artist?.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${artwork.artistId}`} />
                    <AvatarFallback className="bg-white/[0.05] text-white/60">{artist?.firstName?.charAt(0) || 'A'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-widest">Artist</p>
                    <p className="text-sm font-medium text-white group-hover:text-violet-400 transition-colors">
                      {artist?.firstName && artist?.lastName 
                        ? `${artist.firstName} ${artist.lastName}` 
                        : artist?.username || `Artist #${artwork.artistId}`}
                    </p>
                  </div>
                </div>
              </Link>
            </div>

            <div className="h-px bg-white/5" />

            <div className="space-y-3">
              <p className="text-xs font-medium text-violet-400 uppercase tracking-[0.3em]">About This Work</p>
              <p className="text-base leading-relaxed text-white/60">
                {artwork.description}
              </p>
              {(artwork as any).dimensions && (
                <div className="flex items-center gap-2 text-sm text-white/40" data-testid="text-dimensions">
                  <Ruler className="w-4 h-4" />
                  <span>{(artwork as any).dimensions}</span>
                </div>
              )}
            </div>

            {artist && (
              <div className="bg-white/[0.02] border border-white/5 rounded-md p-5">
                <p className="text-xs font-medium text-violet-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> About the Artist
                </p>
                <Link href={`/artist/${artwork.artistId}`}>
                  <div className="flex items-start gap-4 cursor-pointer group">
                    <Avatar className="w-11 h-11 border border-white/10">
                      <AvatarImage src={artist.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${artwork.artistId}`} />
                      <AvatarFallback className="bg-white/[0.05] text-white/60">{artist.firstName?.charAt(0) || 'A'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-white group-hover:text-violet-400 transition-colors">
                        {artist.firstName && artist.lastName 
                          ? `${artist.firstName} ${artist.lastName}` 
                          : artist.username || `Artist #${artwork.artistId}`}
                      </p>
                      {artist.bio ? (
                        <p className="text-sm text-white/50 mt-1 line-clamp-3">{artist.bio}</p>
                      ) : (
                        <p className="text-sm text-white/30 mt-1 italic">This artist hasn't added a bio yet.</p>
                      )}
                      <span className="text-xs text-violet-400 mt-2 inline-block" data-testid="link-view-artist-profile">
                        View Full Profile
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            <div className={`bg-white/[0.02] border rounded-md p-6 space-y-6 ${isActiveAuction ? 'border-violet-400/30 glow-purple' : 'border-white/5'}`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Current Price</p>
                  <div className="text-3xl font-mono font-bold text-emerald-400" data-testid="text-current-price">
                    ${currentPrice.toLocaleString()}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Time Remaining
                  </p>
                  <CountdownTimer endDate={auctionEndDate} />
                </div>
              </div>

              {artwork.status === 'approved' && !isAuctionEnded ? (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                              <FormControl>
                                <Input 
                                  type="number" 
                                  className="pl-9 h-12 text-lg bg-white/[0.03] border-white/10 text-white placeholder:text-white/30 focus:border-violet-400/50 focus:ring-violet-400/20" 
                                  placeholder={(currentPrice + 10).toString()} 
                                  data-testid="input-bid-amount"
                                  {...field} 
                                />
                              </FormControl>
                            </div>
                            <Button 
                              type="submit" 
                              className="h-12 px-8 rounded-full bg-white text-[#0a0a0f] font-semibold hover:bg-white/90" 
                              disabled={placeBid.isPending} 
                              data-testid="button-place-bid"
                            >
                              {placeBid.isPending ? "Placing..." : "Bid Now"}
                            </Button>
                          </div>
                          <FormMessage />
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {[10, 25, 50, 100].map((increment) => (
                              <Button
                                key={increment}
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-full border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
                                onClick={() => form.setValue("amount", (currentPrice + increment).toString() as any)}
                                data-testid={`button-increment-${increment}`}
                              >
                                +${increment}
                              </Button>
                            ))}
                          </div>
                          <p className="text-xs text-white/30 mt-1">Bids in the last 2 minutes automatically extend the auction by 2 minutes to prevent sniping.</p>
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              ) : isAuctionEnded && artwork.status === 'approved' ? (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-md text-center" data-testid="auction-ended-notice">
                  <p className="font-semibold text-red-400">Auction Has Ended</p>
                  <p className="text-sm text-red-400/70 mt-1">Bidding is no longer available for this artwork.</p>
                </div>
              ) : (
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-md text-center text-white/40">
                  Bidding is not open for this item yet.
                </div>
              )}
            </div>

            <div className="flex gap-3 flex-wrap">
              <Button 
                variant="outline" 
                className={`flex-1 gap-2 rounded-full border-white/20 text-white/70 hover:bg-white/10 hover:text-white ${saved ? 'text-red-400 border-red-400/30' : ''}`}
                onClick={handleSave}
                data-testid="button-save"
              >
                <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} /> {saved ? 'Saved' : 'Save'}
              </Button>

              {user && artwork.artistId === user.id && artwork.status === 'approved' && (
                <Button
                  variant="outline"
                  className="flex-1 gap-2 rounded-full border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
                  onClick={() => setShowQR(true)}
                  data-testid="button-qr-code"
                >
                  <QrCode className="w-4 h-4" /> QR Code
                </Button>
              )}
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 gap-2 rounded-full border-white/20 text-white/70 hover:bg-white/10 hover:text-white" data-testid="button-share">
                    <Share2 className="w-4 h-4" /> Share
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 bg-[#0a0a0f]/95 backdrop-blur-xl border-white/10">
                  <div className="space-y-1">
                    <Button variant="ghost" className="w-full justify-start gap-2 text-white/70 hover:text-white hover:bg-white/10" onClick={() => window.open(`https://twitter.com/intent/tweet?text=Check out this artwork: ${artwork.title}&url=${window.location.href}`, '_blank')}>
                      <Twitter className="w-4 h-4" /> Twitter
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-2 text-white/70 hover:text-white hover:bg-white/10" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`, '_blank')}>
                      <Facebook className="w-4 h-4" /> Facebook
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-2 text-white/70 hover:text-white hover:bg-white/10" onClick={handleCopyLink}>
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied!' : 'Copy Link'}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <p className="text-xs font-medium text-violet-400 uppercase tracking-[0.3em] mb-5">Bid History</p>
              <div className="space-y-0 max-h-72 overflow-y-auto pr-1">
                {loadingBids ? (
                  <p className="text-white/40">Loading bids...</p>
                ) : bids?.length === 0 ? (
                  <p className="text-white/30 italic text-sm">No bids yet. Be the first!</p>
                ) : (
                  bids?.map((bid, index) => (
                    <div key={bid.id} className="flex items-center justify-between gap-4 py-4 border-b border-white/5 last:border-0" data-testid={`bid-${bid.id}`}>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8 border border-white/10">
                          <AvatarFallback className="bg-white/[0.05] text-white/50 text-xs">B</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm text-white/80 flex items-center gap-2 flex-wrap">
                            Bidder #{bid.bidderId}
                            {index === 0 && <Badge className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Highest</Badge>}
                          </p>
                          <p className="text-xs text-white/30">
                            {new Date(bid.createdAt || "").toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="font-mono font-bold text-white">
                        ${Number(bid.amount).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {artwork && (
        <QRCodeModal
          isOpen={showQR}
          onClose={() => setShowQR(false)}
          artworkTitle={artwork.title}
          artworkId={artwork.id}
        />
      )}

      <Footer />
    </Layout>
  );
}
