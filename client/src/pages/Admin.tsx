import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Footer } from "@/components/Footer";
import { useArtworks, useUpdateArtworkStatus, useAiReview, useDeleteArtwork } from "@/hooks/use-artworks";
import { Button } from "@/components/ui/button";
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
          <div className="p-8 text-center max-w-md rounded-xl bg-white/[0.02] border border-white/5">
            <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-white/50">You don't have permission to access the admin panel.</p>
          </div>
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
            <span className="text-xs font-medium text-[#A78BFA] uppercase tracking-[0.3em]">Administration</span>
            <h1 className="text-3xl font-display font-bold text-white mt-1" data-testid="text-admin-title">Admin Curation Portal</h1>
            <p className="text-white/50">Review, approve, reject, or remove artwork submissions</p>
          </div>
          
          {pendingCount > 0 && (
            <Badge variant="outline" className="bg-[#A78BFA]/10 text-[#A78BFA] border-[#A78BFA]/20">
              <AlertCircle className="w-3 h-3 mr-1" />
              {pendingCount} pending review
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 text-center rounded-xl bg-white/[0.02] border border-white/5">
            <div className="text-2xl font-bold text-[#A78BFA]" data-testid="text-pending-count">{pendingCount}</div>
            <div className="text-sm text-white/40">Pending</div>
          </div>
          <div className="p-4 text-center rounded-xl bg-white/[0.02] border border-white/5">
            <div className="text-2xl font-bold text-emerald-400" data-testid="text-approved-count">{approvedCount}</div>
            <div className="text-sm text-white/40">Approved</div>
          </div>
          <div className="p-4 text-center rounded-xl bg-white/[0.02] border border-white/5">
            <div className="text-2xl font-bold text-red-400" data-testid="text-rejected-count">{rejectedCount}</div>
            <div className="text-sm text-white/40">Rejected</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input 
              placeholder="Search by title, description, or artist ID..." 
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-admin-search"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white" data-testid="select-admin-sort">
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
                  <div key={i} className="h-48 bg-white/5 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : filteredArtworks.length === 0 ? (
              <div className="p-12 text-center rounded-xl bg-white/[0.02] border border-white/5">
                <Check className="w-12 h-12 mx-auto text-emerald-400 mb-4" />
                <h3 className="text-xl font-bold text-white">
                  {activeTab === "pending" ? "All caught up!" : `No ${activeTab} artworks`}
                </h3>
                <p className="text-white/50">
                  {activeTab === "pending" 
                    ? "No pending artworks to review." 
                    : `There are no ${activeTab} artworks${searchQuery ? " matching your search" : ""}.`}
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredArtworks.map((artwork) => (
                  <div key={artwork.id} className="p-6 flex flex-col md:flex-row gap-6 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors" data-testid={`card-artwork-${artwork.id}`}>
                    <div className="w-full md:w-48 aspect-square bg-white/5 rounded-lg overflow-hidden shrink-0">
                      <img src={artwork.imageUrl} alt={artwork.title} className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <div className="flex justify-between items-start gap-4 flex-wrap">
                        <div>
                          <h3 className="text-xl font-bold text-white">{artwork.title}</h3>
                          <p className="text-sm text-white/40">by Artist #{artwork.artistId}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={
                              artwork.status === 'pending' 
                                ? "bg-[#A78BFA]/10 text-[#A78BFA] border-[#A78BFA]/20" 
                                : artwork.status === 'approved'
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                            }
                          >
                            {artwork.status.charAt(0).toUpperCase() + artwork.status.slice(1)}
                          </Badge>
                          <span className="text-sm text-white/30 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(artwork.createdAt || '').toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-white/60 line-clamp-2">{artwork.description}</p>
                      
                      {artwork.aiScore ? (
                        <div className="bg-[#A78BFA]/5 border border-[#A78BFA]/10 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-[#A78BFA]" />
                            <span className="font-bold text-[#A78BFA]">AI Score: {artwork.aiScore}/100</span>
                          </div>
                          <p className="text-sm italic text-white/50">"{artwork.aiFeedback}"</p>
                        </div>
                      ) : (
                        <Button 
                          variant="outline" 
                          className="rounded-full border-white/20 text-white hover:bg-white/10"
                          onClick={() => handleReview(artwork.id)}
                          disabled={aiReview.isPending}
                          data-testid={`button-ai-review-${artwork.id}`}
                        >
                          {aiReview.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                          Generate AI Review
                        </Button>
                      )}
                      
                      <div className="flex gap-3 pt-4 border-t border-white/5 flex-wrap">
                        {artwork.status !== "approved" && (
                          <Button 
                            className="rounded-full bg-emerald-500 text-white hover:bg-emerald-500/90" 
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
                            className="rounded-full"
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
                              className="rounded-full border-red-500/20 text-red-400 hover:bg-red-500/10"
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
                  </div>
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
