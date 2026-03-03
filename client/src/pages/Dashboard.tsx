import { useState, useRef } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useArtworks } from "@/hooks/use-artworks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { Plus, DollarSign, Palette, TrendingUp, Rocket, Sparkles, Clock, User, Loader2, Check, Settings, ShoppingBag, Pencil, QrCode, Trash2, ArrowRight, ImagePlus, FolderOpen } from "lucide-react";
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

function SaleCountdown({ listedAt }: { listedAt: string }) {
  const endDate = new Date(new Date(listedAt).getTime() + 14 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();

  if (diff <= 0) return <span className="text-red-600 text-xs font-medium">Listing expired</span>;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return (
    <span className="text-xs text-[#B8965A] font-medium flex items-center gap-1" data-testid="text-sale-countdown">
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
  const [convertOpts, setConvertOpts] = useState({ auctionDurationDays: "7", charityId: "", reviewType: "ai_instant" as const });

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
      const res = await apiRequest("POST", `/api/portfolio/${id}/convert-to-auction`, {
        auctionDurationDays: Number(opts.auctionDurationDays),
        charityId: opts.charityId ? Number(opts.charityId) : undefined,
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

  const myArtworks = artworks?.filter(a => a.artistId === user?.id) || [];
  
  // Calculate real stats based on user's actual activity
  const soldArtworks = myArtworks.filter(a => a.paidAt);
  const totalEarnings = soldArtworks.reduce((sum, a) => {
    const price = Number(a.price) || 0;
    const boost = a.promotionPercentage || 0;
    // Artist gets 75% minus boost percentage
    return sum + (price * (0.75 - boost / 100));
  }, 0);
  const totalSold = soldArtworks.length;
  const activeListings = myArtworks.filter(a => a.status === "approved" && !a.paidAt).length;
  const pendingReview = myArtworks.filter(a => a.status === "pending").length;

  // Only show chart data if there are actual earnings
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
            <h2 className="text-2xl font-bold">Please Sign In</h2>
            <p>You need to be logged in to view your dashboard.</p>
            <Button onClick={() => window.location.href = "/api/login"}>Login</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm font-medium text-primary uppercase tracking-wider">Your Studio</span>
            <h1 className="text-3xl font-display font-bold mt-1">
              {user.role === "buyer" ? "Collector Dashboard" : user.role === "both" ? "Artist & Collector Dashboard" : "Artist Dashboard"}
            </h1>
            <p className="text-muted-foreground">Welcome back, {user.firstName || user.username}</p>
          </div>
          {(user.role === "artist" || user.role === "both") && (
            <Link href="/submit-artwork">
              <Button size="lg" className="rounded-full shadow-lg">
                <Plus className="mr-2 h-5 w-5" /> Submit New Art
              </Button>
            </Link>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${Math.round(totalEarnings).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{totalSold > 0 ? `From ${totalSold} sale${totalSold > 1 ? 's' : ''}` : 'No sales yet'}</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Listings</CardTitle>
              <Palette className="h-4 w-4 text-[#9E8472]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeListings}</div>
              <p className="text-xs text-muted-foreground">{pendingReview > 0 ? `${pendingReview} pending review` : 'None pending review'}</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Items Sold</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSold}</div>
              <p className="text-xs text-muted-foreground">Across 5 different buyers</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="artworks">
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="artworks">My Artworks</TabsTrigger>
                  <TabsTrigger value="portfolio" data-testid="tab-portfolio">
                    <FolderOpen className="w-4 h-4 mr-1" /> Portfolio
                  </TabsTrigger>
                  <TabsTrigger value="sold">Sold History</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="artworks" className="space-y-6">
                {isLoading ? (
                  <div>Loading...</div>
                ) : myArtworks.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed rounded-2xl bg-muted/10 watercolor-bg">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <Palette className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">No artworks yet</h3>
                    <p className="text-muted-foreground mb-4">Start your journey by submitting your first piece.</p>
                    <Link href="/submit-artwork">
                      <Button>Submit Art</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {myArtworks.map(artwork => (
                      <Card key={artwork.id} className="overflow-hidden" data-testid={`card-dashboard-artwork-${artwork.id}`}>
                        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
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
                            >
                              {artwork.status}
                            </Badge>
                            {(artwork.promotionPercentage ?? 0) > 0 && (
                              <Badge variant="outline" className="bg-[#B8965A]/90 text-white border-[#C9A84C]">
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
                        <CardContent className="p-4 space-y-3">
                          <div>
                            <h3 className="font-semibold line-clamp-1">{artwork.title}</h3>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <Clock className="w-3 h-3" />
                              <span>Auction active</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t">
                            <div>
                              <div className="text-xs text-muted-foreground">Current Bid</div>
                              <div className="font-bold text-primary">${Number(artwork.price).toLocaleString()}</div>
                            </div>
                            <div className="flex gap-2">
                              {artwork.status === 'approved' && !artwork.paidAt && (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
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
                                    variant={(artwork.promotionPercentage ?? 0) > 0 ? "outline" : "default"}
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
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="portfolio" className="space-y-6">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">Showcase your artwork. List pieces for sale or submit them to auction.</p>
                  <Button onClick={() => setShowAddForm(true)} size="sm" className="rounded-full gap-1" data-testid="button-add-portfolio">
                    <Plus className="w-4 h-4" /> Add Artwork
                  </Button>
                </div>
                {portfolioLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="animate-spin w-8 h-8" /></div>
                ) : !portfolioItems || portfolioItems.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed rounded-2xl bg-muted/10">
                    <Palette className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">Your portfolio is empty</h3>
                    <p className="text-muted-foreground mb-4">Start building your portfolio by adding your artwork.</p>
                    <Button onClick={() => setShowAddForm(true)} className="rounded-full gap-2" data-testid="button-add-portfolio-empty">
                      <Plus className="w-4 h-4" /> Add Your First Piece
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {portfolioItems.map((item) => (
                      <Card key={item.id} className="overflow-hidden group" data-testid={`portfolio-item-${item.id}`}>
                        <div className="aspect-square overflow-hidden bg-muted relative">
                          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                          {item.listedForSale && (
                            <Badge className="absolute top-2 right-2 bg-[#B8965A]" data-testid={`badge-listed-${item.id}`}>
                              <DollarSign className="w-3 h-3 mr-1" /> Listed
                            </Badge>
                          )}
                        </div>
                        <CardContent className="p-4 space-y-3">
                          <div>
                            <h3 className="font-semibold text-lg line-clamp-1" data-testid={`text-portfolio-title-${item.id}`}>{item.title}</h3>
                            {item.dimensions && <p className="text-xs text-muted-foreground">{item.dimensions}</p>}
                            {item.description && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.description}</p>}
                          </div>

                          {item.listedForSale && item.listedAt && (
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-semibold">${Number(item.price).toLocaleString()}</span>
                              {(item as any).expired ? (
                                <span className="text-xs text-red-600 font-medium">Listing expired</span>
                              ) : (
                                <SaleCountdown listedAt={item.listedAt.toString()} />
                              )}
                            </div>
                          )}

                          <div className="flex gap-2 flex-wrap">
                            {!item.listedForSale && !(item as any).expired && (
                              <>
                                <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs" onClick={() => setShowSellDialog(item)} data-testid={`button-list-sale-${item.id}`}>
                                  <DollarSign className="w-3 h-3" /> List for Sale
                                </Button>
                                <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs" onClick={() => setShowConvertDialog(item)} data-testid={`button-convert-auction-${item.id}`}>
                                  <ArrowRight className="w-3 h-3" /> Submit to Auction
                                </Button>
                              </>
                            )}
                            {item.listedForSale && !(item as any).expired && (
                              <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs" onClick={() => setShowConvertDialog(item)} data-testid={`button-convert-auction-listed-${item.id}`}>
                                <ArrowRight className="w-3 h-3" /> Submit to Auction
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deletePortfolioItem.mutate(item.id)} data-testid={`button-delete-portfolio-${item.id}`}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="sold">
                <div className="text-center py-12 text-muted-foreground">
                  Transaction history will appear here.
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Earnings Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                        <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(value) => `$${value}`} />
                        <Tooltip />
                        <Bar dataKey="earnings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-center">
                    <div className="text-muted-foreground">
                      <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No earnings yet</p>
                      <p className="text-xs">Your earnings will appear here once you make a sale</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" /> Your Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Name Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">Name</Label>
                    {!editingName && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-6 px-2 text-xs"
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
                          data-testid="input-edit-first-name"
                        />
                        <Input
                          placeholder="Last name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          data-testid="input-edit-last-name"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setEditingName(false)}
                          data-testid="button-cancel-name"
                        >
                          Cancel
                        </Button>
                        <Button 
                          size="sm" 
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
                    <p className="text-sm font-medium">
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : <span className="text-muted-foreground italic">Add your name</span>}
                    </p>
                  )}
                </div>

                {/* Bio Section */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">Bio</Label>
                    {!editingBio && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-6 px-2 text-xs"
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
                      className="min-h-[100px]"
                      maxLength={500}
                      data-testid="textarea-bio"
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">{bioText.length}/500</span>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setEditingBio(false)}
                          data-testid="button-cancel-bio"
                        >
                          Cancel
                        </Button>
                        <Button 
                          size="sm" 
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
                      <p className="text-sm text-muted-foreground">{user.bio}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Add a bio to tell buyers about yourself and your art.
                      </p>
                    )}
                    <Link href={`/artist/${user?.id}`}>
                      <Button variant="outline" size="sm" className="mt-3 w-full" data-testid="link-view-my-profile">
                        View Public Profile
                      </Button>
                    </Link>
                  </div>
                )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" /> Account Type
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Current: <span className="font-medium text-foreground capitalize">{user?.role === "both" ? "Artist & Collector" : user?.role}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant={user?.role === "artist" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => updateRoleMutation.mutate("artist")}
                    disabled={updateRoleMutation.isPending || user?.role === "artist"}
                    data-testid="button-role-artist"
                  >
                    <Palette className="w-4 h-4 mr-1" /> Artist
                  </Button>
                  <Button 
                    variant={user?.role === "buyer" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => updateRoleMutation.mutate("buyer")}
                    disabled={updateRoleMutation.isPending || user?.role === "buyer"}
                    data-testid="button-role-collector"
                  >
                    <ShoppingBag className="w-4 h-4 mr-1" /> Collector
                  </Button>
                  <Button 
                    variant={user?.role === "both" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => updateRoleMutation.mutate("both")}
                    disabled={updateRoleMutation.isPending || user?.role === "both"}
                    data-testid="button-role-both"
                  >
                    <Sparkles className="w-4 h-4 mr-1" /> Both
                  </Button>
                </div>
                {updateRoleMutation.isPending && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Updating...
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary to-accent text-white border-0">
              <CardHeader>
                <CardTitle className="text-white">Pro Tip</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/90">
                  Boost your listings to get more visibility! Promoted artworks appear first in the gallery and attract more bidders.
                </p>
              </CardContent>
            </Card>
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
        <DialogContent className="sm:max-w-md" data-testid="dialog-add-portfolio">
          <DialogHeader>
            <DialogTitle className="font-display">Add to Portfolio</DialogTitle>
            <DialogDescription>Add a new artwork to your personal portfolio.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={newItem.title} onChange={(e) => setNewItem(p => ({ ...p, title: e.target.value }))} placeholder="Artwork title" data-testid="input-portfolio-title" />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea value={newItem.description} onChange={(e) => setNewItem(p => ({ ...p, description: e.target.value }))} placeholder="Brief description..." data-testid="input-portfolio-description" />
            </div>
            <div>
              <Label>Dimensions (L x W in inches)</Label>
              <div className="flex gap-2 items-center">
                <Input type="number" placeholder="Length" onChange={(e) => { const l = e.target.value; const w = newItem.dimensions.split(" x ")[1]?.replace(" inches", "") || ""; setNewItem(p => ({ ...p, dimensions: l && w ? `${l} x ${w} inches` : "" })); }} data-testid="input-portfolio-length" />
                <span className="text-muted-foreground">x</span>
                <Input type="number" placeholder="Width" onChange={(e) => { const w = e.target.value; const l = newItem.dimensions.split(" x ")[0] || ""; setNewItem(p => ({ ...p, dimensions: l && w ? `${l} x ${w} inches` : "" })); }} data-testid="input-portfolio-width" />
                <span className="text-muted-foreground text-sm whitespace-nowrap">inches</span>
              </div>
            </div>
            <div>
              <Label>Image</Label>
              {imagePreview ? (
                <div className="relative rounded-md overflow-hidden border bg-muted">
                  <img src={imagePreview} alt="Preview" className="w-full max-h-48 object-contain" />
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors" onClick={() => fileInputRef.current?.click()} data-testid="dropzone-portfolio-image">
                  <ImagePlus className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); }} data-testid="input-portfolio-file" />
            </div>
            <Button className="w-full rounded-full" disabled={!newItem.title || !newItem.imageUrl || createItem.isPending} onClick={() => createItem.mutate(newItem)} data-testid="button-save-portfolio">
              {createItem.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Add to Portfolio
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showSellDialog} onOpenChange={(open) => { if (!open) setShowSellDialog(null); }}>
        <DialogContent className="sm:max-w-sm" data-testid="dialog-list-sale">
          <DialogHeader>
            <DialogTitle className="font-display">List for Sale</DialogTitle>
            <DialogDescription>Set a price for "{showSellDialog?.title}". Once listed, you have 2 weeks to complete the sale.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Price ($)</Label>
              <Input type="number" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} placeholder="100" data-testid="input-sell-price" />
            </div>
            <Button className="w-full rounded-full" disabled={!sellPrice || Number(sellPrice) <= 0 || listForSale.isPending} onClick={() => showSellDialog && listForSale.mutate({ id: showSellDialog.id, price: Number(sellPrice) })} data-testid="button-confirm-list">
              {listForSale.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              List for Sale (2-Week Window)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showConvertDialog} onOpenChange={(open) => { if (!open) setShowConvertDialog(null); }}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-convert-auction">
          <DialogHeader>
            <DialogTitle className="font-display">Submit to Auction</DialogTitle>
            <DialogDescription>Convert "{showConvertDialog?.title}" into an auction listing. It will go through curation review first.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Auction Duration</Label>
              <Select value={convertOpts.auctionDurationDays} onValueChange={(v) => setConvertOpts(p => ({ ...p, auctionDurationDays: v }))}>
                <SelectTrigger data-testid="select-convert-duration"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Day</SelectItem>
                  <SelectItem value="3">3 Days</SelectItem>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="14">14 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Charity (Optional)</Label>
              <Select value={convertOpts.charityId} onValueChange={(v) => setConvertOpts(p => ({ ...p, charityId: v }))}>
                <SelectTrigger data-testid="select-convert-charity"><SelectValue placeholder="Choose a cause" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {charities?.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Review Type</Label>
              <Select value={convertOpts.reviewType} onValueChange={(v: "ai_instant" | "human_curator") => setConvertOpts(p => ({ ...p, reviewType: v }))}>
                <SelectTrigger data-testid="select-convert-review"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ai_instant">Instant Feedback</SelectItem>
                  <SelectItem value="human_curator">Human Curator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full rounded-full" disabled={convertToAuction.isPending} onClick={() => showConvertDialog && convertToAuction.mutate({ id: showConvertDialog.id, opts: convertOpts })} data-testid="button-confirm-convert">
              {convertToAuction.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Submit for Review
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
