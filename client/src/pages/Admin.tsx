import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Footer } from "@/components/Footer";
import { useArtworks, useUpdateArtworkStatus, useAiReview, useDeleteArtwork } from "@/hooks/use-artworks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Sparkles, Loader2, Search, Clock, AlertCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Admin() {
  const { user } = useAuth();
  const { data: allArtworks, isLoading } = useArtworks();
  const updateStatus = useUpdateArtworkStatus();
  const aiReview = useAiReview();
  const deleteArtwork = useDeleteArtwork();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [activeTab, setActiveTab] = useState("pending");

  const filteredArtworks = useMemo(() => {
    if (!allArtworks) return [];
    
    let filtered = allArtworks.filter(a => a.status === activeTab);
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.description.toLowerCase().includes(query) ||
          a.artistId.toString().includes(query)
      );
    }
    
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
        break;
      case "score-high":
        filtered.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
        break;
      case "score-low":
        filtered.sort((a, b) => (a.aiScore || 0) - (b.aiScore || 0));
        break;
    }
    
    return filtered;
  }, [allArtworks, searchQuery, sortBy, activeTab]);

  const pendingCount = allArtworks?.filter(a => a.status === "pending").length || 0;
  const approvedCount = allArtworks?.filter(a => a.status === "approved").length || 0;
  const rejectedCount = allArtworks?.filter(a => a.status === "rejected").length || 0;

  if (user?.role !== "admin") {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="p-8 text-center max-w-md">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to access the admin panel.</p>
          </Card>
        </div>
        <Footer />
      </Layout>
    );
  }

  const handleReview = (id: number) => {
    aiReview.mutate(id, {
      onSuccess: (data) => {
        toast({
          title: "Review Complete",
          description: `Score: ${data.score}/100. Feedback generated.`,
        });
      }
    });
  };

  const handleDecision = (id: number, status: "approved" | "rejected") => {
    updateStatus.mutate({ id, status }, {
      onSuccess: () => {
        toast({
          title: `Artwork ${status}`,
          variant: status === 'approved' ? 'default' : 'destructive',
        });
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteArtwork.mutate(id, {
      onSuccess: () => {
        toast({
          title: "Artwork deleted",
          description: "The artwork has been permanently removed.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Layout>
      <div className="space-y-6 pb-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold" data-testid="text-admin-title">Admin Curation Portal</h1>
            <p className="text-muted-foreground">Review, approve, reject, or remove artwork submissions</p>
          </div>
          
          {pendingCount > 0 && (
            <Badge variant="outline" className="bg-[#B8965A]/10 text-[#4C392D] border-[#B8965A]/20 dark:bg-[#B8965A]/20 dark:text-[#C9A84C]">
              <AlertCircle className="w-3 h-3 mr-1" />
              {pendingCount} pending review
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-[#B8965A]" data-testid="text-pending-count">{pendingCount}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600" data-testid="text-approved-count">{approvedCount}</div>
            <div className="text-sm text-muted-foreground">Approved</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600" data-testid="text-rejected-count">{rejectedCount}</div>
            <div className="text-sm text-muted-foreground">Rejected</div>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by title, description, or artist ID..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-admin-search"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48" data-testid="select-admin-sort">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="score-high">Score: High to Low</SelectItem>
              <SelectItem value="score-low">Score: Low to High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending" data-testid="tab-pending">
              Pending ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="approved" data-testid="tab-approved">
              Approved ({approvedCount})
            </TabsTrigger>
            <TabsTrigger value="rejected" data-testid="tab-rejected">
              Rejected ({rejectedCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-48 bg-muted animate-pulse rounded-xl" />
                ))}
              </div>
            ) : filteredArtworks.length === 0 ? (
              <Card className="p-12 text-center">
                <Check className="w-12 h-12 mx-auto text-green-500 mb-4" />
                <h3 className="text-xl font-bold">
                  {activeTab === "pending" ? "All caught up!" : `No ${activeTab} artworks`}
                </h3>
                <p className="text-muted-foreground">
                  {activeTab === "pending" 
                    ? "No pending artworks to review." 
                    : `There are no ${activeTab} artworks${searchQuery ? " matching your search" : ""}.`}
                </p>
              </Card>
            ) : (
              <div className="grid gap-6">
                {filteredArtworks.map((artwork) => (
                  <Card key={artwork.id} className="p-6 flex flex-col md:flex-row gap-6 overflow-hidden" data-testid={`card-artwork-${artwork.id}`}>
                    <div className="w-full md:w-48 aspect-square bg-muted rounded-lg overflow-hidden shrink-0">
                      <img src={artwork.imageUrl} alt={artwork.title} className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <div className="flex justify-between items-start gap-4 flex-wrap">
                        <div>
                          <h3 className="text-xl font-bold">{artwork.title}</h3>
                          <p className="text-sm text-muted-foreground">by Artist #{artwork.artistId}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={
                              artwork.status === 'pending' 
                                ? "bg-[#B8965A]/10 text-[#4C392D] border-[#B8965A]/20" 
                                : artwork.status === 'approved'
                                ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                                : "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
                            }
                          >
                            {artwork.status.charAt(0).toUpperCase() + artwork.status.slice(1)}
                          </Badge>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(artwork.createdAt || '').toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm line-clamp-2">{artwork.description}</p>
                      
                      {artwork.aiScore ? (
                        <div className="bg-primary/5 border border-primary/10 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="font-bold text-primary">AI Score: {artwork.aiScore}/100</span>
                          </div>
                          <p className="text-sm italic text-muted-foreground">"{artwork.aiFeedback}"</p>
                        </div>
                      ) : (
                        <Button 
                          variant="secondary" 
                          onClick={() => handleReview(artwork.id)}
                          disabled={aiReview.isPending}
                          data-testid={`button-ai-review-${artwork.id}`}
                        >
                          {aiReview.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                          Generate AI Review
                        </Button>
                      )}
                      
                      <div className="flex gap-3 pt-4 border-t flex-wrap">
                        {artwork.status !== "approved" && (
                          <Button 
                            className="bg-green-600 text-white" 
                            onClick={() => handleDecision(artwork.id, "approved")}
                            disabled={updateStatus.isPending}
                            data-testid={`button-approve-${artwork.id}`}
                          >
                            <Check className="w-4 h-4 mr-2" /> Approve
                          </Button>
                        )}
                        {artwork.status !== "rejected" && (
                          <Button 
                            variant="destructive"
                            onClick={() => handleDecision(artwork.id, "rejected")}
                            disabled={updateStatus.isPending}
                            data-testid={`button-reject-${artwork.id}`}
                          >
                            <X className="w-4 h-4 mr-2" /> Reject
                          </Button>
                        )}
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              className="text-destructive border-destructive/30"
                              disabled={deleteArtwork.isPending}
                              data-testid={`button-delete-${artwork.id}`}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete "{artwork.title}"?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove this artwork and all associated bids. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(artwork.id)}
                                className="bg-destructive text-destructive-foreground"
                                data-testid={`button-confirm-delete-${artwork.id}`}
                              >
                                Delete Permanently
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </Layout>
  );
}
