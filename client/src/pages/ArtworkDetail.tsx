import { useState, useEffect, useRef } from "react";
import { artistDisplayName } from "@/lib/artistName";
import { Layout } from "@/components/Layout";
import { Footer } from "@/components/Footer";
import { useArtwork, useRelistArtwork } from "@/hooks/use-artworks";
import { handleArtworkImageError } from "@/lib/imageFallback";
import { useBids, usePlaceBid, useBuyNow } from "@/hooks/use-bids";
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
import { Loader2, DollarSign, Clock, Heart, Share2, Twitter, Facebook, Copy, Check, User, QrCode, Ruler, ArrowLeft, AlertTriangle, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery, useMutation } from "@tanstack/react-query";
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

import { SEOHead } from "@/components/SEOHead";
import { PurchasePanel } from "@/components/PurchasePanel";
import { askingPrice } from "@shared/pricing";
import { ARTIST_PERCENT, PLATFORM_PERCENT, CHARITY_PERCENT, SHOW_CHARITY_NAMES, MIN_BUYER_AGE } from "@shared/siteConfig";

export default function ArtworkDetail() {
  const [match, params] = useRoute("/artwork/:id");
  const id = parseInt(params?.id || "0");
  const { data: artwork, isLoading: loadingArtwork } = useArtwork(id);
  const { data: bids, isLoading: loadingBids } = useBids(id);
  const { user } = useAuth();
  const placeBid = usePlaceBid();
  const buyNow = useBuyNow();
  const relistArtwork = useRelistArtwork();
  const [relistDuration, setRelistDuration] = useState<1 | 3 | 5 | 7>(7);
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showShipping, setShowShipping] = useState(false);
  const [pendingBidAmount, setPendingBidAmount] = useState<number>(0);
  const [confirmedAdult, setConfirmedAdult] = useState(false);
  // Which flow the shipping modal is collecting an address for.
  const [checkoutMode, setCheckoutMode] = useState<'bid' | 'buyout'>('bid');

  const [pendingBidSuccess, setPendingBidSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bidParam = params.get('bid');
    const buyoutParam = params.get('buyout');
    if (bidParam === 'success') {
      setPendingBidSuccess(true);
      window.history.replaceState({}, "", window.location.pathname);
    } else if (bidParam === 'cancelled') {
      toast({
        title: "Bid cancelled",
        description: "No charge was made. You can try again any time before the auction ends.",
        variant: "destructive",
      });
      window.history.replaceState({}, "", window.location.pathname);
    } else if (buyoutParam === 'success') {
      toast({
        title: "Purchase complete!",
        description: "Your card has been charged and the artwork is yours. The auction is now closed.",
      });
      window.history.replaceState({}, "", window.location.pathname);
    } else if (buyoutParam === 'cancelled') {
      toast({
        title: "Purchase cancelled",
        description: "No charge was made. The artwork is still available.",
        variant: "destructive",
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [toast]);

  const { data: artist } = useQuery<UserType>({
    queryKey: ['/api/users', artwork?.artistId],
    enabled: !!artwork?.artistId,
  });

  const { data: charities } = useQuery<Array<{ id: number; name: string }>>({
    queryKey: ['/api/charities'],
    staleTime: 5 * 60 * 1000,
  });

  const isOwnArtwork = !!user && !!artwork && user.id === artwork.artistId;
  // Hybrid payout-readiness check: any payout target works (Connect ready or
  // a manual handle / parent handle for minors). Stripe-only status is still
  // queried so we can surface the "account restricted" warning later.
  const { data: payoutStatus } = useQuery<{ ready: boolean }>({
    queryKey: ["/api/users/me/payout-status"],
    enabled: isOwnArtwork,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
  const { data: connectStatus } = useQuery<{ onboardingComplete: boolean; payoutsEnabled: boolean }>({
    queryKey: ["/api/stripe/connect/status"],
    enabled: isOwnArtwork,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
  // Only surface the warning once we know for certain — don't block on loading state.
  const payoutSetupNeeded = isOwnArtwork && !!payoutStatus && !payoutStatus.ready;

  const onboardTabRef = useRef<Window | null>(null);
  const onboard = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/stripe/connect/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Failed to start onboarding");
      return body as { url: string };
    },
    onSuccess: (data) => {
      if (onboardTabRef.current && !onboardTabRef.current.closed) {
        onboardTabRef.current.location.href = data.url;
      } else {
        window.open(data.url, "_blank", "noopener,noreferrer");
      }
      onboardTabRef.current = null;
    },
    onError: (err: Error) => {
      onboardTabRef.current?.close();
      onboardTabRef.current = null;
      toast({ title: "Couldn't start onboarding", description: err.message, variant: "destructive" });
    },
  });
  const handleOnboardClick = () => {
    onboardTabRef.current = window.open("", "_blank", "noopener,noreferrer");
    onboard.mutate();
  };
  const publicCharityNote = SHOW_CHARITY_NAMES ? artwork?.charityNote : undefined;
  const charityName = !SHOW_CHARITY_NAMES
    ? undefined
    : artwork?.charityId
    ? charities?.find(c => c.id === artwork.charityId)?.name
    : null;

  useEffect(() => {
    if (!pendingBidSuccess || !artwork) return;
    if (artwork.charityId && !charities) return;
    const charityLabel = publicCharityNote || charityName;
    toast({
      title: "Bid hold authorized",
      description: charityLabel
        ? `Your card has been authorized. We'll only charge it if you win. ${CHARITY_PERCENT}% of the sale goes to ${charityLabel}.`
        : "Your card has been authorized. We'll only charge it if you win.",
    });
    setPendingBidSuccess(false);
  }, [pendingBidSuccess, artwork, charities, charityName, toast]);

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

  const doPlaceBid = (amount: number, shipping: {
    toStreet: string; toCity: string; toState: string; toZip: string;
    carrier: string; service: string; shippingAmount: number;
  } | null) => {
    placeBid.mutate({
      artworkId: artwork.id,
      bidderId: user!.id as unknown as string,
      amount: amount.toString(),
      confirmedAdult,
      ...(shipping ? {
        shippingStreet: shipping.toStreet,
        shippingCity: shipping.toCity,
        shippingState: shipping.toState,
        shippingPostalCode: shipping.toZip,
        shippingCountry: "US",
        shippingCarrier: shipping.carrier,
        shippingService: shipping.service,
        shippingAmount: shipping.shippingAmount.toString(),
      } : {}),
    } as any, {
      onSuccess: (data: { checkoutUrl?: string; auctionExtended?: boolean } | undefined) => {
        if (data?.checkoutUrl) {
          toast({ title: "Securing your bid…", description: "Redirecting to checkout to authorize a card hold for $" + amount });
        } else if (data?.auctionExtended) {
          toast({ title: "Bid Placed + Time Extended!", description: `You bid $${amount}. The auction was extended by 2 minutes.` });
        } else {
          toast({ title: "Bid Placed!", description: `You successfully bid $${amount}` });
        }
        form.reset();
      },
      onError: (err: Error) => {
        toast({ title: "Bid failed", description: err.message, variant: "destructive" });
      },
    });
  };

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
    if (!confirmedAdult) {
      toast({ title: `Buyers must be ${MIN_BUYER_AGE} or older`, description: `Please confirm you are ${MIN_BUYER_AGE} or older to continue.`, variant: "destructive" });
      return;
    }
    setCheckoutMode('bid');
    setPendingBidAmount(amount);
    setShowShipping(true);
  };

  const doBuyNow = (amount: number, shipping: Parameters<typeof doPlaceBid>[1]) => {
    buyNow.mutate({
      artworkId: artwork.id,
      bidderId: user!.id as unknown as string,
      confirmedAdult,
      ...(shipping ? {
        shippingStreet: shipping.toStreet,
        shippingCity: shipping.toCity,
        shippingState: shipping.toState,
        shippingPostalCode: shipping.toZip,
        shippingCountry: "US",
        shippingCarrier: shipping.carrier,
        shippingService: shipping.service,
        shippingAmount: shipping.shippingAmount.toString(),
      } : {}),
    }, {
      onSuccess: (data: { checkoutUrl?: string } | undefined) => {
        if (data?.checkoutUrl) {
          toast({ title: "Taking you to checkout…", description: `Your card will be charged $${amount.toLocaleString()} to buy this artwork now.` });
        }
      },
      onError: (err: Error) => {
        toast({ title: "Purchase failed", description: err.message, variant: "destructive" });
      },
    });
  };

  const handleBuyNowClick = () => {
    if (!user) {
      toast({ title: "Please login", description: "You must be logged in to buy this artwork", variant: "destructive" });
      return;
    }
    if (!confirmedAdult) {
      toast({ title: `Buyers must be ${MIN_BUYER_AGE} or older`, description: `Please confirm you are ${MIN_BUYER_AGE} or older to continue.`, variant: "destructive" });
      return;
    }
    if (artwork.buyNowPrice == null) return;
    setCheckoutMode('buyout');
    setPendingBidAmount(Number(artwork.buyNowPrice));
    setShowShipping(true);
  };

  const handleShippingConfirm = (shipping: Parameters<typeof doPlaceBid>[1]) => {
    setShowShipping(false);
    if (checkoutMode === 'buyout') {
      doBuyNow(pendingBidAmount, shipping);
    } else {
      doPlaceBid(pendingBidAmount, shipping);
    }
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
    artist: askingPrice(artwork) * ARTIST_PERCENT / 100,
    platform: askingPrice(artwork) * PLATFORM_PERCENT / 100,
    charity: askingPrice(artwork) * CHARITY_PERCENT / 100,
  };

  const isActiveAuction = artwork.status === 'approved' && !isAuctionEnded;

  return (
    <Layout>
      <SEOHead title={`${artwork.title} | BrushBids`} description={artwork.description.slice(0, 160)} />
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="mb-8">
          <Link href="/gallery">
            <span className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm cursor-pointer" data-testid="link-back-gallery">
              <ArrowLeft className="w-4 h-4" />
              Back to Gallery
            </span>
          </Link>
        </div>

        {payoutSetupNeeded && (
          <div
            className="mb-8 flex items-start gap-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3"
            data-testid="banner-payout-setup"
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
            <p className="text-sm text-amber-200/90">
              Your payout account isn't set up yet — you can still sell, but set it up so we can pay you once a piece is delivered.{" "}
              <button
                onClick={handleOnboardClick}
                disabled={onboard.isPending}
                className="underline underline-offset-2 hover:text-amber-100 disabled:opacity-60"
                data-testid="link-payout-setup"
              >
                {onboard.isPending ? "Opening…" : "Finish setup →"}
              </button>
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-7 space-y-8">
            <div className="relative rounded-md overflow-hidden bg-white/[0.02] aspect-[4/5]">
              <img src={displayImage} alt={artwork.title} onError={handleArtworkImageError} className="w-full h-full object-cover" data-testid="img-artwork" />
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-md p-6">
              <p className="text-xs font-medium text-violet-400 uppercase tracking-[0.3em] mb-5">Revenue Distribution</p>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-white/60">Artist ({ARTIST_PERCENT}%)</span>
                    <span className="font-mono text-sm font-semibold text-white">${revenueSplit.artist.toFixed(2)}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-violet-500" style={{ width: `${ARTIST_PERCENT}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-white/60">BrushBids ({PLATFORM_PERCENT}%)</span>
                    <span className="font-mono text-sm text-white/70">${revenueSplit.platform.toFixed(2)}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-blue-400" style={{ width: `${PLATFORM_PERCENT}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-emerald-400/80">
                      {publicCharityNote || charityName
                        ? <>Charity ({CHARITY_PERCENT}%) <span className="text-white/40">—</span> <span className="text-emerald-300/90 font-medium truncate max-w-[160px] inline-block align-bottom" title={publicCharityNote || charityName || undefined}>{publicCharityNote || charityName}</span></>
                        : `Charity (${CHARITY_PERCENT}%)`}
                    </span>
                    <span className="font-mono text-sm font-semibold text-emerald-400 shrink-0">${revenueSplit.charity.toFixed(2)}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${CHARITY_PERCENT}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {artwork.status === 'pending' && (
                  <span className="text-xs font-medium text-violet-400 uppercase tracking-[0.3em]">Pending Review</span>
                )}
                {artwork.status === 'approved' && (
                  <span className="text-xs font-medium text-violet-400 uppercase tracking-[0.3em]">{artwork.paidAt ? 'Sold' : 'Available'}</span>
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
                      {artistDisplayName(artist)}
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
              {(artwork.charityId || artwork.charityNote) && (
                <div className="flex items-center gap-2 text-sm text-white/40" data-testid={`text-charity-${artwork.id}`}>
                  <Heart className="w-4 h-4 text-emerald-400/70" />
                  <span>{CHARITY_PERCENT}% of sale goes to <span className="text-emerald-400/80 font-medium">{publicCharityNote || charityName || "charity"}</span></span>
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
                        {artistDisplayName(artist)}
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

            <PurchasePanel artwork={artwork} isOwnArtwork={isOwnArtwork} />

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
