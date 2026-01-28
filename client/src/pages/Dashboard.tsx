import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useArtworks } from "@/hooks/use-artworks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Plus, DollarSign, Palette, TrendingUp, Rocket, Sparkles, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BoostArtworkModal } from "@/components/BoostArtworkModal";
import type { Artwork } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();
  const [boostArtwork, setBoostArtwork] = useState<Artwork | null>(null);
  
  // In a real app we'd filter by artistId/ownerId. 
  // For this mock, we'll fetch all and pretend to filter or just show list.
  const { data: artworks, isLoading } = useArtworks();

  const myArtworks = artworks?.filter(a => a.artistId === user?.id) || [];
  
  const totalEarnings = 1250; // Mock data
  const totalSold = 3;
  const activeListings = myArtworks.length;

  const chartData = [
    { name: 'Jan', earnings: 400 },
    { name: 'Feb', earnings: 300 },
    { name: 'Mar', earnings: 550 },
    { name: 'Apr', earnings: 200 },
  ];

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
            <h1 className="text-3xl font-display font-bold mt-1">Artist Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.firstName || user.username}</p>
          </div>
          <Link href="/submit-artwork">
            <Button size="lg" className="rounded-full shadow-lg">
              <Plus className="mr-2 h-5 w-5" /> Submit New Art
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalEarnings}</div>
              <p className="text-xs text-muted-foreground">+20.1% from last month</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Listings</CardTitle>
              <Palette className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeListings}</div>
              <p className="text-xs text-muted-foreground">3 pending review</p>
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
