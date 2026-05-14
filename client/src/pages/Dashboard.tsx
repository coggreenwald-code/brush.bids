import { useState, useRef, useCallback, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useArtworks } from "@/hooks/use-artworks";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StripeConnectPanel from "@/components/StripeConnectPanel";
import PayoutMethodPanel from "@/components/PayoutMethodPanel";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { Plus, DollarSign, Palette, TrendingUp, Rocket, Sparkles, Clock, User, Loader2, Check, Settings, ShoppingBag, Pencil, QrCode, Trash2, ArrowRight, ImagePlus, FolderOpen, AlertTriangle, MapPin } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BoostArtworkModal } from "@/components/BoostArtworkModal";
import { QRCodeModal } from "@/components/QRCodeModal";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCharities } from "@/hooks/use-charities";
import type { Artwork, PortfolioItem } from "@shared/schema";
import { SEOHead } from "@/components/SEOHead";

function SaleCountdown({ listedAt }: { listedAt: string }) {
  const endDate = new Date(new Date(listedAt).getTime() + 14 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();

  if (diff <= 0) return <span className="text-red-400 text-xs font-medium">Listing expired</span>;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return (
    <span className="text-xs text-[#A78BFA] font-medium flex items-center gap-1" data-testid="text-sale-countdown">
      <Clock className="w-3 h-3" /> {days}d {hours}h left to sell
    </span>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [boostArtwork, setBoostArtwork] = useState<Artwork | null>(null);
  const [qrArtwork, setQrArtwork] = useState<Artwork | null>(null);
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState(user?.bio || "");
  const [editingName, setEditingName] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [editingShipFrom, setEditingShipFrom] = useState(false);
  const [shipFromStreet, setShipFromStreet] = useState((user as any)?.shipFromStreet || "");
  const [shipFromCity, setShipFromCity] = useState((user as any)?.shipFromCity || "");
  const [shipFromState, setShipFromState] = useState((user as any)?.shipFromState || "");
  const [shipFromZip, setShipFromZip] = useState((user as any)?.shipFromZip || "");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: charities } = useCharities();

  const [showAddForm, setShowAddForm] = useState(false);
  const [showSellDialog, setShowSellDialog] = useState<PortfolioItem | null>(null);
  const [showConvertDialog, setShowConvertDialog] = useState<PortfolioItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({ title: "", description: "", imageUrl: "", dimensions: "" });
  const [sellPrice, setSellPrice] = useState("");
  const [convertOpts, setConvertOpts] = useState<{ auctionDurationDays: string; charityId: string; charityNote: string; reviewType: "ai_instant" | "human_curator" }>({ auctionDurationDays: "7", charityId: "", charityNote: "", reviewType: "ai_instant" });

  const { data: portfolioItems, isLoading: portfolioLoading } = useQuery<PortfolioItem[]>({
    queryKey: ['/api/portfolio', user?.id],
    enabled: !!user?.id,
  });

  const createItem = useMutation({
    mutationFn: async (data: typeof newItem) => {
      const res = await apiRequest("POST", "/api/portfolio", { ...data, artistId: user?.id });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio', user?.id] });
      toast({ title: "Added to Portfolio", description: "Your artwork has been added to your portfolio." });
      setShowAddForm(false);
      setNewItem({ title: "", description: "", imageUrl: "", dimensions: "" });
      setImagePreview(null);
    },
    onError: () => { toast({ title: "Error", description: "Failed to add item.", variant: "destructive" }); },
  });

  const listForSale = useMutation({
    mutationFn: async ({ id, price }: { id: number; price: number }) => {
      const res = await apiRequest("PATCH", `/api/portfolio/${id}/list-for-sale`, { price });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio', user?.id] });
      toast({ title: "Listed for Sale", description: "Your artwork is now listed. You have 2 weeks to complete the sale." });
      setShowSellDialog(null);
      setSellPrice("");
    },
    onError: () => { toast({ title: "Error", description: "Failed to list item.", variant: "destructive" }); },
  });

  const deletePortfolioItem = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/portfolio/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio', user?.id] });
      toast({ title: "Removed", description: "Item removed from your portfolio." });
    },
  });

  const convertToAuction = useMutation({
    mutationFn: async ({ id, opts }: { id: number; opts: typeof convertOpts }) => {
      const isOther = opts.charityId === "other";
      const res = await apiRequest("POST", `/api/portfolio/${id}/convert-to-auction`, {
        auctionDurationDays: Number(opts.auctionDurationDays),
        charityId: isOther ? undefined : (opts.charityId ? Number(opts.charityId) : undefined),
        charityNote: isOther ? opts.charityNote : undefined,
        reviewType: opts.reviewType,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/artworks'] });
      toast({ title: "Submitted for Auction", description: "Your portfolio piece has been submitted for curation review." });
      setShowConvertDialog(null);
    },
    onError: () => { toast({ title: "Error", description: "Failed to convert item.", variant: "destructive" }); },
  });

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/artworks/upload-image", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setNewItem(prev => ({ ...prev, imageUrl: data.imageUrl }));
      setImagePreview(URL.createObjectURL(file));
    } catch {
      toast({ title: "Upload Failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };
  
  const { data: artworks, isLoading } = useArtworks();

  const updateBioMutation = useMutation({
    mutationFn: async (bio: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      const res = await apiRequest("PATCH", `/api/users/${user.id}/bio`, { bio });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your bio has been saved successfully.",
      });
      setEditingBio(false);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Could not save your bio. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateShipFromMutation = useMutation({
    mutationFn: async (data: { shipFromStreet: string; shipFromCity: string; shipFromState: string; shipFromZip: string }) => {
      const res = await apiRequest("PATCH", "/api/users/me/ship-from", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Shipping address saved" });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setEditingShipFrom(false);
    },
    onError: () => {
      toast({ title: "Could not save address", description: "Please try again.", variant: "destructive" });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async (role: "artist" | "buyer" | "both") => {
      if (!user?.id) throw new Error("Not authenticated");
      const res = await apiRequest("PATCH", `/api/users/${user.id}/role`, { role });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Role Updated",
        description: "Your account type has been changed.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Could not change your role. Please try again.",
        variant: "destructive",
      });
    },
  });

  const profilePicInputRef = useRef<HTMLInputElement>(null);
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);

  const updateProfileImageMutation = useMutation({
    mutationFn: async (profileImageUrl: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      const res = await apiRequest("PATCH", `/api/users/${user.id}/profile-image`, { profileImageUrl });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Profile Picture Updated", description: "Your profile picture has been saved." });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: () => {
      toast({ title: "Update Failed", description: "Could not update your profile picture.", variant: "destructive" });
    },
  });

  const uploadProfilePic = async (file: File) => {
    setUploadingProfilePic(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/artworks/upload-image", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      updateProfileImageMutation.mutate(data.imageUrl);
    } catch {
      toast({ title: "Upload Failed", variant: "destructive" });
    } finally {
      setUploadingProfilePic(false);
    }
  };

  const initialAvatarColors = [
    { bg: "#A78BFA", label: "Violet" },
    { bg: "#F472B6", label: "Pink" },
    { bg: "#60A5FA", label: "Blue" },
    { bg: "#34D399", label: "Emerald" },
    { bg: "#FB923C", label: "Orange" },
    { bg: "#F87171", label: "Red" },
    { bg: "#38BDF8", label: "Sky" },
    { bg: "#A3E635", label: "Lime" },
  ];

  const updateNameMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const res = await apiRequest("PATCH", `/api/users/${user.id}/name`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Name Updated",
        description: "Your name has been saved successfully.",
      });
      setEditingName(false);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Could not save your name. Please try again.",
        variant: "destructive",
      });
    },
  });

  const isArtist = user?.role === "artist" || user?.role === "both";
  // Connect status remains around so the optional Stripe upgrade panel can
  // show "needs attention" for artists who already started Stripe onboarding,
  // but it no longer drives whether the artist can list — that's payoutStatus.
  const { data: connectStatus } = useQuery<{ hasAccount: boolean; onboardingComplete: boolean; payoutsEnabled: boolean }>({
    queryKey: ["/api/stripe/connect/status"],
    enabled: !!user && isArtist,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
  const { data: payoutStatus } = useQuery<{ ready: boolean; isMinor: boolean; method: string | null; handle: string | null; forMinor: boolean; adultUpgradeAvailable: boolean }>({
    queryKey: ["/api/users/me/payout-status"],
    enabled: !!user && isArtist,
    staleTime: 0,
  });
  const payoutSetupNeeded = isArtist && payoutStatus !== undefined && !payoutStatus.ready;
  // Stripe-only "account restricted" banner. Only relevant if the artist
  // actually started Stripe onboarding.
  const payoutAccountNeedsAttention = isArtist && connectStatus !== undefined && connectStatus.onboardingComplete && !connectStatus.payoutsEnabled;

  const prevNeedsPayout = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    if (!payoutStatus || !user) return;
    if (prevNeedsPayout.current === true && payoutStatus.ready) {
      toast({ title: "Payout details saved — you're all set to receive earnings!" });
    }
    prevNeedsPayout.current = !payoutStatus.ready;
  }, [payoutStatus, user, toast]);

  const attentionTabRef = useRef<Window | null>(null);
  const onboardAttention = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/stripe/connect/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: window.location.origin }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || "Failed to start onboarding");
      return body as { url: string };
    },
    onSuccess: (data) => {
      if (attentionTabRef.current && !attentionTabRef.current.closed) {
        attentionTabRef.current.location.href = data.url;
      } else {
        window.open(data.url, "_blank", "noopener,noreferrer");
      }
      attentionTabRef.current = null;
    },
    onError: (err: Error) => {
      attentionTabRef.current?.close();
      attentionTabRef.current = null;
      toast({ title: "Could not open Stripe", description: err.message, variant: "destructive" });
    },
  });
  const handleAttentionFixClick = useCallback(() => {
    attentionTabRef.current = window.open("about:blank", "_blank", "noopener,noreferrer");
    onboardAttention.mutate();
  }, [onboardAttention]);

  const myArtworks = artworks?.filter(a => a.artistId === user?.id) || [];
  
  const soldArtworks = myArtworks.filter(a => a.paidAt);
  const totalEarnings = soldArtworks.reduce((sum, a) => {
    const price = Number(a.price) || 0;
    const boost = a.promotionPercentage || 0;
    return sum + (price * (0.75 - boost / 100));
  }, 0);
  const totalSold = soldArtworks.length;
  const activeListings = myArtworks.filter(a => a.status === "approved" && !a.paidAt).length;
  const pendingReview = myArtworks.filter(a => a.status === "pending").length;

  const chartData = totalSold > 0 ? [
    { name: 'Jan', earnings: 0 },
    { name: 'Feb', earnings: 0 },
    { name: 'Mar', earnings: 0 },
    { name: 'Apr', earnings: Math.round(totalEarnings) },
  ] : [];

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full min-h-[50vh]">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-white">Please Sign In</h2>
            <p className="text-white/60">You need to be logged in to view your dashboard.</p>
            <Button onClick={() => window.location.href = "/api/login"} className="rounded-full bg-white text-[#0a0a0f] hover:bg-white/90">Login</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead title="Dashboard | BrushBids" description="Manage your artworks, portfolio, earnings, and profile on BrushBids." />
      <div className="space-y-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <span className="text-sm font-medium text-[#A78BFA] uppercase tracking-widest">Your Studio</span>
            <h1 className="text-3xl font-display font-bold mt-1 text-white">
              {user.role === "buyer" ? "Collector Dashboard" : user.role === "both" ? "Artist & Collector Dashboard" : "Artist Dashboard"}
            </h1>
            <p className="text-white/50">Welcome back, {user.firstName || user.username}</p>
          </div>
          {(user.role === "artist" || user.role === "both") && (
            <Link href="/submit-artwork">
              <Button className="rounded-full bg-white text-[#0a0a0f] font-semibold px-6 hover:bg-white/90">
                <Plus className="mr-2 h-5 w-5" /> Submit New Art
              </Button>
            </Link>
          )}
        </div>

        {(user.role === "artist" || user.role === "both") && (
          <div id="payouts">
            <PayoutMethodPanel />
            <StripeConnectPanel />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/[0.02] border border-white/5 rounded-lg p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-sm font-medium text-white/50">Total Earnings</span>
              <DollarSign className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">${Math.round(totalEarnings).toLocaleString()}</div>
            <p className="text-xs text-white/40 mt-1">{totalSold > 0 ? `From ${totalSold} sale${totalSold > 1 ? 's' : ''}` : 'No sales yet'}</p>
          </div>
          
          <div className="bg-white/[0.02] border border-white/5 rounded-lg p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-sm font-medium text-white/50">Active Listings</span>
              <Palette className="h-4 w-4 text-[#A78BFA]" />
            </div>
            <div className="text-2xl font-bold text-white">{activeListings}</div>
            <p className="text-xs text-white/40 mt-1">{pendingReview > 0 ? `${pendingReview} pending review` : 'None pending review'}</p>
          </div>
          
          <div className="bg-white/[0.02] border border-white/5 rounded-lg p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-sm font-medium text-white/50">Items Sold</span>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">{totalSold}</div>
            <p className="text-xs text-white/40 mt-1">Across 5 different buyers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="artworks">
              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <TabsList className="bg-white/[0.03] border border-white/5 rounded-full p-1 max-sm:mx-3 max-sm:w-[calc(100%-1.5rem)] max-sm:justify-between">
                  <TabsTrigger value="artworks" className="rounded-full text-white/50 data-[state=active]:text-white data-[state=active]:bg-white/10 data-[state=active]:shadow-none px-4 py-1.5 text-sm max-sm:px-3">My Artworks</TabsTrigger>
                  <TabsTrigger value="portfolio" data-testid="tab-portfolio" className="rounded-full text-white/50 data-[state=active]:text-white data-[state=active]:bg-white/10 data-[state=active]:shadow-none px-4 py-1.5 text-sm max-sm:px-3">
                    <FolderOpen className="w-4 h-4 mr-1" /> Portfolio
                  </TabsTrigger>
                  <TabsTrigger value="sold" className="rounded-full text-white/50 data-[state=active]:text-white data-[state=active]:bg-white/10 data-[state=active]:shadow-none px-4 py-1.5 text-sm max-sm:px-3">Sold History</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="artworks" className="space-y-6">
                {payoutSetupNeeded && (
                  <div
                    className="flex items-start gap-3 rounded-md border border-violet-500/20 bg-violet-500/5 px-4 py-3"
                    data-testid="banner-payout-setup-artworks"
                  >
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-violet-400" />
                    <p className="text-sm text-violet-200/80">
                      Add your payout details above so we can send your share when an artwork sells. You can list and receive bids right now — funds are held safely until you're ready.{" "}
                      <a href="#payouts" className="underline underline-offset-2 hover:text-violet-100 cursor-pointer" data-testid="link-payout-setup-artworks">
                        Set up payouts →
                      </a>
                    </p>
                  </div>
                )}
                {payoutAccountNeedsAttention && (
                  <div
                    className="flex items-start gap-3 rounded-md border border-amber-400/40 bg-amber-400/10 px-4 py-3"
                    data-testid="banner-payout-attention-artworks"
                  >
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-300" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-amber-100/90">
                        Your payout account needs attention — Stripe has restricted payouts and may require additional verification. Fix this soon to avoid payout delays.
                      </p>
                      <button
                        type="button"
                        onClick={handleAttentionFixClick}
                        disabled={onboardAttention.isPending}
                        className="mt-1.5 text-sm underline underline-offset-2 text-amber-200 hover:text-amber-50 cursor-pointer disabled:opacity-60"
                        data-testid="button-payout-attention-fix-artworks"
                      >
                        {onboardAttention.isPending ? "Opening…" : "Fix now →"}
                      </button>
                    </div>
                  </div>
                )}
                {isLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="animate-spin w-8 h-8 text-[#A78BFA]" /></div>
                ) : myArtworks.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#A78BFA]/10 flex items-center justify-center">
                      <Palette className="w-8 h-8 text-[#A78BFA]" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">No artworks yet</h3>
                    <p className="text-white/50 mb-4">Start your journey by submitting your first piece.</p>
                    <Link href="/submit-artwork">
                      <Button className="rounded-full bg-white text-[#0a0a0f] hover:bg-white/90">Submit Art</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {myArtworks.map(artwork => (
                      <div key={artwork.id} className="bg-[#0d0d14] border border-white/5 rounded-lg overflow-visible" data-testid={`card-dashboard-artwork-${artwork.id}`}>
                        <div className="relative aspect-[4/3] overflow-hidden bg-white/[0.02] rounded-t-lg">
                          <Link href={`/artwork/${artwork.id}`}>
                            <img 
                              src={artwork.imageUrl || "https://images.unsplash.com/photo-1579783902614-a3fb39279c0f?q=80&w=800"} 
                              alt={artwork.title} 
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                            />
                          </Link>
                          <div className="absolute top-3 right-3 flex gap-2">
                            <Badge 
                              variant={
                                artwork.status === 'approved' ? 'default' : 
                                artwork.status === 'rejected' ? 'destructive' : 'secondary'
                              }
                              className={artwork.status === 'approved' ? 'bg-emerald-500/80 text-white border-emerald-400/30' : ''}
                            >
                              {artwork.status}
                            </Badge>
                            {(artwork.promotionPercentage ?? 0) > 0 && (
                              <Badge variant="outline" className="bg-[#A78BFA]/90 text-white border-[#A78BFA]/50">
                                <Rocket className="w-3 h-3 mr-1" />
                                {artwork.promotionPercentage}% Boost
                              </Badge>
                            )}
                          </div>
                          {artwork.aiScore && (
                            <div className="absolute top-3 left-3">
                              <Badge variant="outline" className="bg-black/60 text-white border-white/20">
                                <Sparkles className="w-3 h-3 mr-1" />
                                {artwork.aiScore}/100
                              </Badge>
                            </div>
                          )}
                        </div>
                        <div className="p-4 space-y-3">
                          <div>
                            <h3 className="font-semibold text-white line-clamp-1">{artwork.title}</h3>
                            <div className="flex items-center gap-2 text-xs text-white/40 mt-1">
                              <Clock className="w-3 h-3" />
                              <span>Auction active</span>
                            </div>
                            {(artwork.charityId || artwork.charityNote) && (
                              <p className="text-xs text-emerald-400/70 mt-1">5% → {artwork.charityNote || charities?.find(c => c.id === artwork.charityId)?.name || "Chosen charity"}</p>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                            <div>
                              <div className="text-xs text-white/40">Current Bid</div>
                              <div className="font-bold text-emerald-400">${Number(artwork.price).toLocaleString()}</div>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              {artwork.status === 'approved' && !artwork.paidAt && (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="border-white/10 text-white/70 hover:text-white rounded-full"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setQrArtwork(artwork);
                                    }}
                                    data-testid={`button-qr-artwork-${artwork.id}`}
                                  >
                                    <QrCode className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    className={`rounded-full ${(artwork.promotionPercentage ?? 0) > 0 ? 'border-white/10 text-white/70 bg-transparent border' : 'bg-white text-[#0a0a0f] hover:bg-white/90'}`}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setBoostArtwork(artwork);
                                    }}
                                    data-testid={`button-boost-artwork-${artwork.id}`}
                                  >
                                    <Rocket className="w-4 h-4 mr-1" />
                                    {(artwork.promotionPercentage ?? 0) > 0 ? "Edit Boost" : "Boost"}
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="portfolio" className="space-y-6">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <p className="text-sm text-white/50">Showcase your artwork. List pieces for sale or submit them to auction.</p>
                  <Button onClick={() => setShowAddForm(true)} size="sm" className="rounded-full bg-white text-[#0a0a0f] gap-1 hover:bg-white/90" data-testid="button-add-portfolio">
                    <Plus className="w-4 h-4" /> Add Artwork
                  </Button>
                </div>
                {portfolioLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="animate-spin w-8 h-8 text-[#A78BFA]" /></div>
                ) : !portfolioItems || portfolioItems.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                    <Palette className="w-12 h-12 mx-auto mb-4 text-white/30" />
                    <h3 className="text-lg font-semibold text-white">Your portfolio is empty</h3>
                    <p className="text-white/50 mb-4">Start building your portfolio by adding your artwork.</p>
                    <Button onClick={() => setShowAddForm(true)} className="rounded-full bg-white text-[#0a0a0f] gap-2 hover:bg-white/90" data-testid="button-add-portfolio-empty">
                      <Plus className="w-4 h-4" /> Add Your First Piece
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {portfolioItems.map((item) => (
                      <div key={item.id} className="bg-[#0d0d14] border border-white/5 rounded-lg overflow-visible group" data-testid={`portfolio-item-${item.id}`}>
                        <div className="aspect-square overflow-hidden bg-white/[0.02] relative rounded-t-lg">
                          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                          {item.listedForSale && (
                            <Badge className="absolute top-2 right-2 bg-emerald-500 text-white" data-testid={`badge-listed-${item.id}`}>
                              <DollarSign className="w-3 h-3 mr-1" /> Listed
                            </Badge>
                          )}
                        </div>
                        <div className="p-4 space-y-3">
                          <div>
                            <h3 className="font-semibold text-lg text-white line-clamp-1" data-testid={`text-portfolio-title-${item.id}`}>{item.title}</h3>
                            {item.dimensions && <p className="text-xs text-white/40">{item.dimensions}</p>}
                            {item.description && <p className="text-sm text-white/50 line-clamp-2 mt-1">{item.description}</p>}
                          </div>

                          {item.listedForSale && item.listedAt && (
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono font-semibold text-white">${Number(item.price).toLocaleString()}</span>
                              {(item as any).expired ? (
                                <span className="text-xs text-red-400 font-medium">Listing expired</span>
                              ) : (
                                <SaleCountdown listedAt={item.listedAt.toString()} />
                              )}
                            </div>
                          )}

                          <div className="flex gap-2 flex-wrap">
                            {!item.listedForSale && !(item as any).expired && (
                              <>
                                <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs rounded-full border-white/10 text-white/70" onClick={() => setShowSellDialog(item)} data-testid={`button-list-sale-${item.id}`}>
                                  <DollarSign className="w-3 h-3" /> List for Sale
                                </Button>
                                <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs rounded-full border-white/10 text-white/70" onClick={() => setShowConvertDialog(item)} data-testid={`button-convert-auction-${item.id}`}>
                                  <ArrowRight className="w-3 h-3" /> Submit to Auction
                                </Button>
                              </>
                            )}
                            {item.listedForSale && !(item as any).expired && (
                              <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs rounded-full border-white/10 text-white/70" onClick={() => setShowConvertDialog(item)} data-testid={`button-convert-auction-listed-${item.id}`}>
                                <ArrowRight className="w-3 h-3" /> Submit to Auction
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="text-red-400" onClick={() => deletePortfolioItem.mutate(item.id)} data-testid={`button-delete-portfolio-${item.id}`}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="sold">
                <div className="text-center py-12 text-white/40">
                  Transaction history will appear here.
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <div className="bg-white/[0.02] border border-white/5 rounded-lg p-5">
              <h3 className="text-white font-semibold mb-4">Earnings Overview</h3>
              {chartData.length > 0 ? (
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tick={{ fill: 'rgba(255,255,255,0.4)' }} />
                      <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(value) => `$${value}`} tick={{ fill: 'rgba(255,255,255,0.4)' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0d0d14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                        labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                      />
                      <Bar dataKey="earnings" fill="#A78BFA" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-center">
                  <div>
                    <DollarSign className="w-8 h-8 mx-auto mb-2 text-white/20" />
                    <p className="text-sm text-white/40">No earnings yet</p>
                    <p className="text-xs text-white/30">Your earnings will appear here once you make a sale</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-lg p-5">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <User className="w-5 h-5 text-[#A78BFA]" /> Your Profile
                </h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-sm text-white/50">Profile Picture</Label>
                  <div className="flex items-center gap-4">
                    <div className="relative flex-shrink-0">
                      {user?.profileImageUrl && !user.profileImageUrl.startsWith("initial:") ? (
                        <img
                          src={user.profileImageUrl}
                          alt="Profile"
                          className="w-16 h-16 rounded-full object-cover border-2 border-white/10"
                          data-testid="img-profile-picture"
                        />
                      ) : (
                        <div
                          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white border-2 border-white/10"
                          style={{ backgroundColor: user?.profileImageUrl?.startsWith("initial:") ? user.profileImageUrl.split(":")[1] : "#A78BFA" }}
                          data-testid="img-profile-initial"
                        >
                          {(user?.firstName?.[0] || user?.email?.[0] || "?").toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        ref={profilePicInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadProfilePic(file);
                          e.target.value = "";
                        }}
                        data-testid="input-profile-pic-upload"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full border-white/10 text-white/60 text-xs"
                        onClick={() => profilePicInputRef.current?.click()}
                        disabled={uploadingProfilePic || updateProfileImageMutation.isPending}
                        data-testid="button-upload-profile-pic"
                      >
                        {uploadingProfilePic ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <ImagePlus className="w-3 h-3 mr-1" />}
                        Upload Photo
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 mb-2">Or choose a color</p>
                    <div className="flex flex-wrap gap-2">
                      {initialAvatarColors.map((color) => (
                        <button
                          key={color.label}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white transition-colors hover:brightness-110 ${
                            user?.profileImageUrl === `initial:${color.bg}` ? "ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0f]" : "hover:ring-1 hover:ring-white/30"
                          }`}
                          style={{ backgroundColor: color.bg }}
                          onClick={() => updateProfileImageMutation.mutate(`initial:${color.bg}`)}
                          disabled={updateProfileImageMutation.isPending}
                          title={color.label}
                          data-testid={`button-avatar-${color.label.toLowerCase()}`}
                        >
                          {(user?.firstName?.[0] || user?.email?.[0] || "?").toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-white/50">Name</Label>
                    {!editingName && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-xs text-white/50"
                        onClick={() => {
                          setFirstName(user?.firstName || "");
                          setLastName(user?.lastName || "");
                          setEditingName(true);
                        }}
                        data-testid="button-edit-name"
                      >
                        <Pencil className="w-3 h-3 mr-1" /> Edit
                      </Button>
                    )}
                  </div>
                  {editingName ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="First name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                          data-testid="input-edit-first-name"
                        />
                        <Input
                          placeholder="Last name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                          data-testid="input-edit-last-name"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-full border-white/10 text-white/60"
                          onClick={() => setEditingName(false)}
                          data-testid="button-cancel-name"
                        >
                          Cancel
                        </Button>
                        <Button 
                          size="sm" 
                          className="rounded-full bg-white text-[#0a0a0f] hover:bg-white/90"
                          onClick={() => updateNameMutation.mutate({ firstName: firstName.trim(), lastName: lastName.trim() })}
                          disabled={updateNameMutation.isPending || !firstName.trim() || !lastName.trim()}
                          data-testid="button-save-name"
                        >
                          {updateNameMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4 mr-1" />
                          )}
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-white">
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : <span className="text-white/30 italic">Add your name</span>}
                    </p>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-white/50">Bio</Label>
                    {!editingBio && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-xs text-white/50"
                        onClick={() => {
                          setBioText(user?.bio || "");
                          setEditingBio(true);
                        }}
                        data-testid="button-edit-bio"
                      >
                        <Pencil className="w-3 h-3 mr-1" /> Edit
                      </Button>
                    )}
                  </div>
                {editingBio ? (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Tell buyers about yourself, your artistic style, and what inspires you..."
                      value={bioText}
                      onChange={(e) => setBioText(e.target.value)}
                      className="min-h-[100px] bg-white/5 border-white/10 text-white placeholder:text-white/30"
                      maxLength={500}
                      data-testid="textarea-bio"
                    />
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <span className="text-xs text-white/40">{bioText.length}/500</span>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-full border-white/10 text-white/60"
                          onClick={() => setEditingBio(false)}
                          data-testid="button-cancel-bio"
                        >
                          Cancel
                        </Button>
                        <Button 
                          size="sm" 
                          className="rounded-full bg-white text-[#0a0a0f] hover:bg-white/90"
                          onClick={() => updateBioMutation.mutate(bioText)}
                          disabled={updateBioMutation.isPending}
                          data-testid="button-save-bio"
                        >
                          {updateBioMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4 mr-1" />
                          )}
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    {user?.bio ? (
                      <p className="text-sm text-white/50">{user.bio}</p>
                    ) : (
                      <p className="text-sm text-white/30 italic">
                        Add a bio to tell buyers about yourself and your art.
                      </p>
                    )}
                    <Link href={`/artist/${user?.id}`}>
                      <Button variant="outline" size="sm" className="mt-3 w-full rounded-full border-white/10 text-white/60" data-testid="link-view-my-profile">
                        View Public Profile
                      </Button>
                    </Link>
                  </div>
                )}
                </div>
              </div>
            </div>

            {(user.role === "artist" || user.role === "both") && (
              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-5" data-testid="card-ship-from">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#34D399]" /> Ship-From Address
                  </h3>
                  {!editingShipFrom && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-white/50"
                      onClick={() => {
                        setShipFromStreet((user as any)?.shipFromStreet || "");
                        setShipFromCity((user as any)?.shipFromCity || "");
                        setShipFromState((user as any)?.shipFromState || "");
                        setShipFromZip((user as any)?.shipFromZip || "");
                        setEditingShipFrom(true);
                      }}
                      data-testid="button-edit-ship-from"
                    >
                      <Pencil className="w-3 h-3 mr-1" /> Edit
                    </Button>
                  )}
                </div>
                <p className="text-xs text-white/40 mb-3">Used to calculate real-time shipping rates for buyers at checkout.</p>
                {editingShipFrom ? (
                  <div className="space-y-3">
                    <Input
                      placeholder="Street address"
                      value={shipFromStreet}
                      onChange={(e) => setShipFromStreet(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                      data-testid="input-ship-from-street"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        placeholder="City"
                        value={shipFromCity}
                        onChange={(e) => setShipFromCity(e.target.value)}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 col-span-1"
                        data-testid="input-ship-from-city"
                      />
                      <Input
                        placeholder="State (e.g. CA)"
                        value={shipFromState}
                        onChange={(e) => setShipFromState(e.target.value.toUpperCase().slice(0, 2))}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                        data-testid="input-ship-from-state"
                        maxLength={2}
                      />
                      <Input
                        placeholder="ZIP"
                        value={shipFromZip}
                        onChange={(e) => setShipFromZip(e.target.value.slice(0, 10))}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                        data-testid="input-ship-from-zip"
                        maxLength={10}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full border-white/10 text-white/60"
                        onClick={() => setEditingShipFrom(false)}
                        data-testid="button-cancel-ship-from"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="rounded-full bg-white text-[#0a0a0f] hover:bg-white/90"
                        onClick={() => updateShipFromMutation.mutate({ shipFromStreet, shipFromCity, shipFromState, shipFromZip })}
                        disabled={updateShipFromMutation.isPending || !shipFromStreet.trim() || !shipFromCity.trim() || !shipFromState.trim() || !shipFromZip.trim()}
                        data-testid="button-save-ship-from"
                      >
                        {updateShipFromMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {(user as any)?.shipFromStreet ? (
                      <p className="text-sm text-white/60" data-testid="text-ship-from-display">
                        {(user as any).shipFromStreet}, {(user as any).shipFromCity}, {(user as any).shipFromState} {(user as any).shipFromZip}
                      </p>
                    ) : (
                      <p className="text-sm text-white/30 italic">No address saved yet. Add one so buyers see live shipping rates.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="bg-white/[0.02] border border-white/5 rounded-lg p-5">
              <h3 className="text-white font-semibold flex items-center gap-2 mb-3">
                <Settings className="w-5 h-5 text-[#60A5FA]" /> Account Type
              </h3>
              <div className="space-y-3">
                <p className="text-sm text-white/50">
                  Current: <span className="font-medium text-white capitalize">{user?.role === "both" ? "Artist & Collector" : user?.role}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant={user?.role === "artist" ? "default" : "outline"} 
                    size="sm"
                    className={`rounded-full ${user?.role === "artist" ? "bg-white text-[#0a0a0f] hover:bg-white/90" : "border-white/10 text-white/60"}`}
                    onClick={() => updateRoleMutation.mutate("artist")}
                    disabled={updateRoleMutation.isPending || user?.role === "artist"}
                    data-testid="button-role-artist"
                  >
                    <Palette className="w-4 h-4 mr-1" /> Artist
                  </Button>
                  <Button 
                    variant={user?.role === "buyer" ? "default" : "outline"} 
                    size="sm"
                    className={`rounded-full ${user?.role === "buyer" ? "bg-white text-[#0a0a0f] hover:bg-white/90" : "border-white/10 text-white/60"}`}
                    onClick={() => updateRoleMutation.mutate("buyer")}
                    disabled={updateRoleMutation.isPending || user?.role === "buyer"}
                    data-testid="button-role-collector"
                  >
                    <ShoppingBag className="w-4 h-4 mr-1" /> Collector
                  </Button>
                  <Button 
                    variant={user?.role === "both" ? "default" : "outline"} 
                    size="sm"
                    className={`rounded-full ${user?.role === "both" ? "bg-white text-[#0a0a0f] hover:bg-white/90" : "border-white/10 text-white/60"}`}
                    onClick={() => updateRoleMutation.mutate("both")}
                    disabled={updateRoleMutation.isPending || user?.role === "both"}
                    data-testid="button-role-both"
                  >
                    <Sparkles className="w-4 h-4 mr-1" /> Both
                  </Button>
                </div>
                {updateRoleMutation.isPending && (
                  <div className="flex items-center gap-2 text-sm text-white/40">
                    <Loader2 className="w-4 h-4 animate-spin" /> Updating...
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg p-5 border border-[#A78BFA]/20 bg-gradient-to-br from-[#A78BFA]/10 to-transparent">
              <h3 className="text-[#A78BFA] font-semibold mb-2">Pro Tip</h3>
              <p className="text-white/60 text-sm">
                Boost your listings to get more visibility! Promoted artworks appear first in the gallery and attract more bidders.
              </p>
            </div>

            <div className="rounded-lg p-5 border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent" data-testid="card-tax-info">
              <h3 className="text-emerald-300 font-semibold mb-2">Sales Tax — Handled For You</h3>
              <p className="text-white/60 text-sm">
                BrushBids is the marketplace facilitator for your sales. Stripe Tax calculates US sales tax based on the buyer's shipping address and we collect &amp; remit it for you. Your 75% payout is always based on the pre-tax winning bid.
              </p>
            </div>
          </div>
        </div>
      </div>

      {boostArtwork && (
        <BoostArtworkModal 
          artwork={boostArtwork} 
          open={!!boostArtwork} 
          onOpenChange={(open) => !open && setBoostArtwork(null)} 
        />
      )}

      {qrArtwork && (
        <QRCodeModal
          isOpen={!!qrArtwork}
          onClose={() => setQrArtwork(null)}
          artworkTitle={qrArtwork.title}
          artworkId={qrArtwork.id}
        />
      )}

      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="sm:max-w-md bg-[#0d0d14] border-white/10" data-testid="dialog-add-portfolio">
          <DialogHeader>
            <DialogTitle className="font-display text-white">Add to Portfolio</DialogTitle>
            <DialogDescription className="text-white/50">Add a new artwork to your personal portfolio.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white/60">Title</Label>
              <Input value={newItem.title} onChange={(e) => setNewItem(p => ({ ...p, title: e.target.value }))} placeholder="Artwork title" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" data-testid="input-portfolio-title" />
            </div>
            <div>
              <Label className="text-white/60">Description (optional)</Label>
              <Textarea value={newItem.description} onChange={(e) => setNewItem(p => ({ ...p, description: e.target.value }))} placeholder="Brief description..." className="bg-white/5 border-white/10 text-white placeholder:text-white/30" data-testid="input-portfolio-description" />
            </div>
            <div>
              <Label className="text-white/60">Dimensions (L x W in inches)</Label>
              <div className="flex gap-2 items-center">
                <Input type="number" placeholder="Length" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" onChange={(e) => { const l = e.target.value; const w = newItem.dimensions.split(" x ")[1]?.replace(" inches", "") || ""; setNewItem(p => ({ ...p, dimensions: l && w ? `${l} x ${w} inches` : "" })); }} data-testid="input-portfolio-length" />
                <span className="text-white/40">x</span>
                <Input type="number" placeholder="Width" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" onChange={(e) => { const w = e.target.value; const l = newItem.dimensions.split(" x ")[0] || ""; setNewItem(p => ({ ...p, dimensions: l && w ? `${l} x ${w} inches` : "" })); }} data-testid="input-portfolio-width" />
                <span className="text-white/40 text-sm whitespace-nowrap">inches</span>
              </div>
            </div>
            <div>
              <Label className="text-white/60">Image</Label>
              {imagePreview ? (
                <div className="relative rounded-md overflow-hidden border border-white/10 bg-white/[0.02]">
                  <img src={imagePreview} alt="Preview" className="w-full max-h-48 object-contain" />
                </div>
              ) : (
                <div className="border border-dashed border-white/10 rounded-md p-6 text-center cursor-pointer hover:border-[#A78BFA]/30 hover:bg-white/[0.02] transition-colors" onClick={() => fileInputRef.current?.click()} data-testid="dropzone-portfolio-image">
                  <ImagePlus className="w-8 h-8 mx-auto mb-2 text-white/30" />
                  <p className="text-sm text-white/40">Click to upload</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); }} data-testid="input-portfolio-file" />
            </div>
            <Button className="w-full rounded-full bg-white text-[#0a0a0f] font-semibold hover:bg-white/90" disabled={!newItem.title || !newItem.imageUrl || createItem.isPending} onClick={() => createItem.mutate(newItem)} data-testid="button-save-portfolio">
              {createItem.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Add to Portfolio
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showSellDialog} onOpenChange={(open) => { if (!open) setShowSellDialog(null); }}>
        <DialogContent className="sm:max-w-sm bg-[#0d0d14] border-white/10" data-testid="dialog-list-sale">
          <DialogHeader>
            <DialogTitle className="font-display text-white">List for Sale</DialogTitle>
            <DialogDescription className="text-white/50">Set a price for "{showSellDialog?.title}". Once listed, you have 2 weeks to complete the sale.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white/60">Price ($)</Label>
              <Input type="number" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} placeholder="100" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" data-testid="input-sell-price" />
            </div>
            <Button className="w-full rounded-full bg-white text-[#0a0a0f] font-semibold hover:bg-white/90" disabled={!sellPrice || Number(sellPrice) <= 0 || listForSale.isPending} onClick={() => showSellDialog && listForSale.mutate({ id: showSellDialog.id, price: Number(sellPrice) })} data-testid="button-confirm-list">
              {listForSale.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              List for Sale (2-Week Window)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showConvertDialog} onOpenChange={(open) => { if (!open) setShowConvertDialog(null); }}>
        <DialogContent className="sm:max-w-md bg-[#0d0d14] border-white/10" data-testid="dialog-convert-auction">
          <DialogHeader>
            <DialogTitle className="font-display text-white">Submit to Auction</DialogTitle>
            <DialogDescription className="text-white/50">Convert "{showConvertDialog?.title}" into an auction listing. It will go through curation review first.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white/60">Auction Duration</Label>
              <Select value={convertOpts.auctionDurationDays} onValueChange={(v) => setConvertOpts(p => ({ ...p, auctionDurationDays: v }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white" data-testid="select-convert-duration"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#0d0d14] border-white/10">
                  <SelectItem value="1">1 Day</SelectItem>
                  <SelectItem value="3">3 Days</SelectItem>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="14">14 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/60">Charity (Optional)</Label>
              <Select value={convertOpts.charityId} onValueChange={(v) => setConvertOpts(p => ({ ...p, charityId: v, charityNote: v !== "other" ? "" : p.charityNote }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white" data-testid="select-convert-charity"><SelectValue placeholder="Choose a cause" /></SelectTrigger>
                <SelectContent className="bg-[#0d0d14] border-white/10 max-h-60">
                  {charities?.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                  <SelectItem value="other" data-testid="charity-option-other-dashboard">Other (describe below)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {convertOpts.charityId === "other" && (
              <div>
                <Label className="text-white/60">Where should the 5% go?</Label>
                <input
                  className="w-full mt-1 px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
                  placeholder="e.g. Local after-school art program"
                  value={convertOpts.charityNote}
                  onChange={(e) => setConvertOpts(p => ({ ...p, charityNote: e.target.value }))}
                  data-testid="input-charity-note-dashboard"
                />
              </div>
            )}
            <div>
              <Label className="text-white/60">Review Type</Label>
              <Select value={convertOpts.reviewType} onValueChange={(v: "ai_instant" | "human_curator") => setConvertOpts(p => ({ ...p, reviewType: v }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white" data-testid="select-convert-review"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#0d0d14] border-white/10">
                  <SelectItem value="ai_instant">Instant Feedback</SelectItem>
                  <SelectItem value="human_curator">Human Curator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full rounded-full bg-white text-[#0a0a0f] font-semibold hover:bg-white/90" disabled={convertToAuction.isPending || (convertOpts.charityId === "other" && !convertOpts.charityNote.trim())} onClick={() => showConvertDialog && convertToAuction.mutate({ id: showConvertDialog.id, opts: convertOpts })} data-testid="button-confirm-convert">
              {convertToAuction.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Submit for Review
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
