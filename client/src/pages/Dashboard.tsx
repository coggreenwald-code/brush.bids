import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useArtworks } from "@/hooks/use-artworks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArtworkCard } from "@/components/ArtworkCard";
import { Link } from "wouter";
import { Plus, DollarSign, Palette, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  
  // In a real app we'd filter by artistId/ownerId. 
  // For this mock, we'll fetch all and pretend to filter or just show list.
  const { data: artworks, isLoading } = useArtworks();

  const myArtworks = artworks?.filter(a => a.artistId === parseInt(user?.id as any || "0")) || [];
  
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
            <h1 className="text-3xl font-display font-bold">Artist Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.username}</p>
          </div>
          <Link href="/submit-artwork">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
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
                  <div className="text-center py-12 border-2 border-dashed rounded-xl">
                    <Palette className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">No artworks yet</h3>
                    <p className="text-muted-foreground mb-4">Start your journey by submitting your first piece.</p>
                    <Link href="/submit-artwork">
                      <Button>Submit Art</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {myArtworks.map(artwork => (
                      <ArtworkCard key={artwork.id} artwork={artwork} showStatus />
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
                  Artworks with high-quality descriptions and backstory tend to sell for 25% more. Try adding more detail to your next submission!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
