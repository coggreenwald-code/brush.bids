import { Layout } from "@/components/Layout";
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
import { Loader2, DollarSign, Clock, Heart, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const bidSchema = z.object({
  amount: z.coerce.number().min(1, "Bid must be at least $1"),
});

export default function ArtworkDetail() {
  const [match, params] = useRoute("/artwork/:id");
  const id = parseInt(params?.id || "0");
  const { data: artwork, isLoading: loadingArtwork } = useArtwork(id);
  const { data: bids, isLoading: loadingBids } = useBids(id);
  const { user } = useAuth();
  const placeBid = usePlaceBid();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(bidSchema),
    defaultValues: { amount: "" },
  });

  if (loadingArtwork) return <Layout><div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div></Layout>;
  if (!artwork) return <Layout><div className="text-center py-20">Artwork not found</div></Layout>;

  const currentPrice = bids && bids.length > 0 
    ? Math.max(...bids.map(b => Number(b.amount))) 
    : Number(artwork.price);

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
      bidderId: user.id as unknown as number, // Casting because auth user type is string-based vs db int
      amount: data.amount.toString(),
    }, {
      onSuccess: () => {
        toast({ title: "Bid Placed!", description: `You successfully bid $${data.amount}` });
        form.reset();
      }
    });
  };

  const displayImage = artwork.imageUrl || "https://images.unsplash.com/photo-1579783902614-a3fb39279c0f?q=80&w=800&auto=format&fit=crop";

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image Side */}
        <div className="space-y-6">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-muted aspect-[4/5]">
            <img src={displayImage} alt={artwork.title} className="w-full h-full object-cover" />
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
                    className="h-full bg-primary" 
                    style={{ width: `${artwork.aiScore || 0}%` }} 
                  />
                </div>
                <span className="text-xs font-bold">{artwork.aiScore}/100</span>
              </div>
            </Card>
          )}
        </div>

        {/* Info Side */}
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="uppercase tracking-wider">Original Art</Badge>
              {artwork.status === 'pending' && <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending Review</Badge>}
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">{artwork.title}</h1>
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
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Current Price</p>
                <div className="text-3xl font-mono font-bold text-primary">
                  ${currentPrice.toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Time Remaining</p>
                <div className="text-xl font-medium flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" /> 3d 12h
                </div>
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
                              <Input type="number" className="pl-9 h-12 text-lg" placeholder={(currentPrice + 10).toString()} {...field} />
                            </FormControl>
                          </div>
                          <Button type="submit" size="lg" className="h-12 px-8" disabled={placeBid.isPending}>
                            {placeBid.isPending ? "Placing..." : "Bid Now"}
                          </Button>
                        </div>
                        <FormMessage />
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
            <Button variant="outline" className="flex-1 gap-2">
              <Heart className="w-4 h-4" /> Save
            </Button>
            <Button variant="outline" className="flex-1 gap-2">
              <Share2 className="w-4 h-4" /> Share
            </Button>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {loadingBids ? (
                <p>Loading bids...</p>
              ) : bids?.length === 0 ? (
                <p className="text-muted-foreground italic">No bids yet. Be the first!</p>
              ) : (
                bids?.map((bid) => (
                  <div key={bid.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>B</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">Bidder #{bid.bidderId}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(bid.createdAt || "").toLocaleDateString()}
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
    </Layout>
  );
}

// Helper icons
function Sparkles(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M9 3v4" />
      <path d="M3 5h4" />
      <path d="M3 9h4" />
    </svg>
  );
}
