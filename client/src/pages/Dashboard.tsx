import { useState } from "react";
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
import { Plus, DollarSign, Palette, TrendingUp, Rocket, Sparkles, Clock, User, Loader2, Check, Settings, ShoppingBag, Pencil } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BoostArtworkModal } from "@/components/BoostArtworkModal";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Artwork } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();
  const [boostArtwork, setBoostArtwork] = useState<Artwork | null>(null);
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState(user?.bio || "");
  const [editingName, setEditingName] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const { toast } = useToast();
  
  // In a real app we'd filter by artistId/ownerId. 
  // For this mock, we'll fetch all and pretend to filter or just show list.
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
    // Artist gets 70% minus boost percentage
    return sum + (price * (0.70 - boost / 100));
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
              <Palette className="h-4 w-4 text-blue-500" />
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
                              <Badge variant="outline" className="bg-amber-500/90 text-white border-amber-400">
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
                            {artwork.status === 'approved' && !artwork.paidAt && (
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
                            )}
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
    </Layout>
  );
}
