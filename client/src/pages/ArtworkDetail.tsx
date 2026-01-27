import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Footer } from "@/components/Footer";
import { useArtwork } from "@/hooks/use-artworks";
import { useBids, usePlaceBid } from "@/hooks/use-bids";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, DollarSign, Clock, Heart, Share2, Sparkles, Twitter, Facebook, Link as LinkIcon, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const bidSchema = z.object({
  amount: z.coerce.number().min(1, "Bid must be at least $1"),
});

function CountdownTimer({ endDate }: { endDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diff = endDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  return (
    <div className="flex gap-2 text-center">
      {[
        { value: timeLeft.days, label: "Days" },
        { value: timeLeft.hours, label: "Hours" },
        { value: timeLeft.minutes, label: "Min" },
        { value: timeLeft.seconds, label: "Sec" },
      ].map(({ value, label }) => (
        <div key={label} className="bg-muted rounded-lg px-3 py-2 min-w-[60px]">
          <div className="text-xl font-mono font-bold">{value.toString().padStart(2, '0')}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
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

  const form = useForm({
    resolver: zodResolver(bidSchema),
    defaultValues: { amount: "" },
  });

  if (loadingArtwork) return <Layout><div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div></Layout>;
  if (!artwork) return <Layout><div className="text-center py-20">Artwork not found</div></Layout>;

  const currentPrice = bids && bids.length > 0 
    ? Math.max(...bids.map(b => Number(b.amount))) 
    : Number(artwork.price);

  const auctionEndDate = new Date(artwork.createdAt || new Date());
  auctionEndDate.setDate(auctionEndDate.getDate() + 7);

  const onSubmit = (data: { amount: number }) => {
    if (data.amount <= currentPrice) {
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
      amount: data.amount.toString(),
    }, {
      onSuccess: () => {
        toast({ title: "Bid Placed!", description: `You successfully bid $${data.amount}` });
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
    artist: currentPrice * 0.70,
    platform: currentPrice * 0.15,
    charity: currentPrice * 0.15,
  };

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pb-16">
        {/* Image Side */}
        <div className="space-y-6">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-muted aspect-[4/5]">
            <img src={displayImage} alt={artwork.title} className="w-full h-full object-cover" data-testid="img-artwork" />
          </div>
          
          {artwork.aiFeedback && (
            <Card className="p-6 bg-primary/5 border-primary/20">
              <h3 className="font-semibold flex items-center gap-2 mb-2 text-primary">
                <Sparkles className="w-4 h-4" /> AI Curator Feedback
              </h3>
              <p className="text-sm text-muted-foreground italic">"{artwork.aiFeedback}"</p>
              <div className="mt-4 flex items-center gap-2">
                <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all" 
                    style={{ width: `${artwork.aiScore || 0}%` }} 
                  />
                </div>
                <span className="text-xs font-bold">{artwork.aiScore}/100</span>
              </div>
            </Card>
          )}

          {/* Revenue Split Info */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Revenue Distribution</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Artist (70%)</span>
                <span className="font-mono font-semibold">${revenueSplit.artist.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">BrushBids (15%)</span>
                <span className="font-mono">${revenueSplit.platform.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-green-600">
                <span className="text-sm">Charity (15%)</span>
                <span className="font-mono font-semibold">${revenueSplit.charity.toFixed(2)}</span>
              </div>
            </div>
            {artwork.charityId && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">Supporting: <span className="font-medium text-foreground">Arts Education Foundation</span></p>
              </div>
            )}
          </Card>
        </div>

        {/* Info Side */}
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Badge variant="secondary" className="uppercase tracking-wider">Original Art</Badge>
              {artwork.status === 'pending' && <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending Review</Badge>}
              {artwork.status === 'approved' && <Badge variant="outline" className="text-green-600 border-green-600">Live Auction</Badge>}
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4" data-testid="text-artwork-title">{artwork.title}</h1>
            <div className="flex items-center gap-4">
              <Avatar className="w-10 h-10">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${artwork.artistId}`} />
                <AvatarFallback>A</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-muted-foreground">Created by</p>
                <p className="font-semibold">Artist #{artwork.artistId}</p>
              </div>
            </div>
          </div>

          <Separator />

          <p className="text-lg leading-relaxed text-muted-foreground">
            {artwork.description}
          </p>

          <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Current Price</p>
                <div className="text-3xl font-mono font-bold text-primary" data-testid="text-current-price">
                  ${currentPrice.toLocaleString()}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                  <Clock className="w-4 h-4" /> Time Remaining
                </p>
                <CountdownTimer endDate={auctionEndDate} />
              </div>
            </div>

            {artwork.status === 'approved' ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Place your bid</FormLabel>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <FormControl>
                              <Input 
                                type="number" 
                                className="pl-9 h-12 text-lg" 
                                placeholder={(currentPrice + 10).toString()} 
                                data-testid="input-bid-amount"
                                {...field} 
                              />
                            </FormControl>
                          </div>
                          <Button type="submit" size="lg" className="h-12 px-8" disabled={placeBid.isPending} data-testid="button-place-bid">
                            {placeBid.isPending ? "Placing..." : "Bid Now"}
                          </Button>
                        </div>
                        <FormMessage />
                        <div className="flex gap-2 mt-2">
                          {[10, 25, 50, 100].map((increment) => (
                            <Button
                              key={increment}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => form.setValue("amount", (currentPrice + increment).toString() as any)}
                              data-testid={`button-increment-${increment}`}
                            >
                              +${increment}
                            </Button>
                          ))}
                        </div>
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            ) : (
              <div className="p-4 bg-muted rounded-lg text-center text-muted-foreground">
                Bidding is not open for this item yet.
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <Button 
              variant="outline" 
              className={`flex-1 gap-2 ${saved ? 'text-red-500 border-red-200' : ''}`}
              onClick={handleSave}
              data-testid="button-save"
            >
              <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} /> {saved ? 'Saved' : 'Save'}
            </Button>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex-1 gap-2" data-testid="button-share">
                  <Share2 className="w-4 h-4" /> Share
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56">
                <div className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => window.open(`https://twitter.com/intent/tweet?text=Check out this artwork: ${artwork.title}&url=${window.location.href}`, '_blank')}>
                    <Twitter className="w-4 h-4" /> Twitter
                  </Button>
                  <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`, '_blank')}>
                    <Facebook className="w-4 h-4" /> Facebook
                  </Button>
                  <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleCopyLink}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy Link'}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Bid History</h3>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {loadingBids ? (
                <p>Loading bids...</p>
              ) : bids?.length === 0 ? (
                <p className="text-muted-foreground italic">No bids yet. Be the first!</p>
              ) : (
                bids?.map((bid, index) => (
                  <div key={bid.id} className="flex items-center justify-between py-3 border-b last:border-0" data-testid={`bid-${bid.id}`}>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>B</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm flex items-center gap-2">
                          Bidder #{bid.bidderId}
                          {index === 0 && <Badge variant="secondary" className="text-xs">Highest</Badge>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(bid.createdAt || "").toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="font-mono font-bold">
                      ${Number(bid.amount).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </Layout>
  );
}
