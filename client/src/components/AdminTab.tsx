import { useState, useMemo } from "react";
import { useArtworks, useUpdateArtworkStatus, useAiReview, useDeleteArtwork, useUpdateFeedback } from "@/hooks/use-artworks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Sparkles, Loader2, Search, Clock, AlertCircle, Trash2, Pencil, MessageSquare, Save, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

export function AdminTab() {
  const { data: allArtworks, isLoading } = useArtworks();
  const updateStatus = useUpdateArtworkStatus();
  const aiReview = useAiReview();
  const deleteArtwork = useDeleteArtwork();
  const updateFeedback = useUpdateFeedback();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [activeTab, setActiveTab] = useState("pending");
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<number, string>>({});
  const [editingFeedback, setEditingFeedback] = useState<Record<number, boolean>>({});

  const filteredArtworks = useMemo(() => {
    if (!allArtworks) return [];

    let filtered = allArtworks.filter(a => a.status === activeTab);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.description.toLowerCase().includes(query) ||
          (a.artist?.firstName && a.artist.firstName.toLowerCase().includes(query)) ||
          (a.artist?.lastName && a.artist.lastName.toLowerCase().includes(query)) ||
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

  const handleReview = (id: number) => {
    aiReview.mutate(id, {
      onSuccess: (data) => {
        toast({
          title: "AI Review Complete",
          description: `Score: ${data.score}/100. Feedback generated.`,
        });
      }
    });
  };

  const handleDecision = (id: number, status: "approved" | "rejected") => {
    const feedback = feedbackDrafts[id];
    updateStatus.mutate({ id, status, ...(feedback ? { feedback } : {}) }, {
      onSuccess: () => {
        toast({
          title: `Artwork ${status}`,
          description: feedback ? "Your curator feedback was saved." : undefined,
          variant: status === 'approved' ? 'default' : 'destructive',
        });
        setFeedbackDrafts(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
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

  const handleSaveFeedback = (id: number) => {
    const feedback = feedbackDrafts[id];
    if (!feedback?.trim()) return;
    updateFeedback.mutate({ id, feedback: feedback.trim() }, {
      onSuccess: () => {
        toast({ title: "Feedback Updated", description: "Curator feedback has been saved." });
        setEditingFeedback(prev => ({ ...prev, [id]: false }));
        setFeedbackDrafts(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    });
  };

  const startEditFeedback = (id: number, currentFeedback: string) => {
    setEditingFeedback(prev => ({ ...prev, [id]: true }));
    setFeedbackDrafts(prev => ({ ...prev, [id]: currentFeedback }));
  };

  const cancelEditFeedback = (id: number) => {
    setEditingFeedback(prev => ({ ...prev, [id]: false }));
    setFeedbackDrafts(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const artistName = (artwork: any) => {
    if (artwork.artist?.firstName || artwork.artist?.lastName) {
      return [artwork.artist.firstName, artwork.artist.lastName].filter(Boolean).join(" ");
    }
    return artwork.artist?.username || `Artist #${artwork.artistId}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-medium text-[#A78BFA] uppercase tracking-[0.3em]" data-testid="text-admin-label">Curation Portal</span>
          <p className="text-white/50 text-sm mt-1">Review, approve, reject, and manage feedback on submissions</p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="outline" className="bg-[#A78BFA]/10 text-[#A78BFA] border-[#A78BFA]/20">
            <AlertCircle className="w-3 h-3 mr-1" />
            {pendingCount} pending review
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 text-center rounded-xl bg-white/[0.02] border border-white/5">
          <div className="text-xl font-bold text-[#A78BFA]" data-testid="text-admin-pending-count">{pendingCount}</div>
          <div className="text-xs text-white/40">Pending</div>
        </div>
        <div className="p-3 text-center rounded-xl bg-white/[0.02] border border-white/5">
          <div className="text-xl font-bold text-emerald-400" data-testid="text-admin-approved-count">{approvedCount}</div>
          <div className="text-xs text-white/40">Approved</div>
        </div>
        <div className="p-3 text-center rounded-xl bg-white/[0.02] border border-white/5">
          <div className="text-xl font-bold text-red-400" data-testid="text-admin-rejected-count">{rejectedCount}</div>
          <div className="text-xs text-white/40">Rejected</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input
            placeholder="Search by title, artist, or description..."
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-admin-search"
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-44 bg-white/5 border-white/10 text-white" data-testid="select-admin-sort">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="score-high">Score: High → Low</SelectItem>
            <SelectItem value="score-low">Score: Low → High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/[0.03] border border-white/5 rounded-full p-1">
          <TabsTrigger value="pending" data-testid="tab-admin-pending" className="rounded-full text-white/50 data-[state=active]:text-white data-[state=active]:bg-white/10 data-[state=active]:shadow-none px-3 py-1.5 text-sm">
            Pending ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-admin-approved" className="rounded-full text-white/50 data-[state=active]:text-white data-[state=active]:bg-white/10 data-[state=active]:shadow-none px-3 py-1.5 text-sm">
            Approved ({approvedCount})
          </TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-admin-rejected" className="rounded-full text-white/50 data-[state=active]:text-white data-[state=active]:bg-white/10 data-[state=active]:shadow-none px-3 py-1.5 text-sm">
            Rejected ({rejectedCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin w-8 h-8 text-[#A78BFA]" /></div>
          ) : filteredArtworks.length === 0 ? (
            <div className="p-10 text-center rounded-xl bg-white/[0.02] border border-white/5">
              <Check className="w-10 h-10 mx-auto text-emerald-400 mb-3" />
              <h3 className="text-lg font-bold text-white">
                {activeTab === "pending" ? "All caught up!" : `No ${activeTab} artworks`}
              </h3>
              <p className="text-white/50 text-sm">
                {activeTab === "pending"
                  ? "No pending artworks to review."
                  : `There are no ${activeTab} artworks${searchQuery ? " matching your search" : ""}.`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredArtworks.map((artwork) => (
                <div key={artwork.id} className="p-4 md:p-5 flex flex-col md:flex-row gap-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors" data-testid={`card-admin-artwork-${artwork.id}`}>
                  <div className="w-full md:w-80 aspect-square bg-white/5 rounded-lg overflow-hidden shrink-0">
                    <img src={artwork.imageUrl} alt={artwork.title} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1 space-y-3 min-w-0">
                    <div className="flex justify-between items-start gap-3 flex-wrap">
                      <div>
                        <h3 className="text-lg font-bold text-white">{artwork.title}</h3>
                        <p className="text-sm text-white/40">by {artistName(artwork)}</p>
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
                        <span className="text-xs text-white/30 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(artwork.createdAt || '').toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-white/60 line-clamp-2">{artwork.description}</p>

                    {artwork.dimensions && (
                      <p className="text-xs text-white/30">Dimensions: {artwork.dimensions}</p>
                    )}

                    {artwork.aiScore && !editingFeedback[artwork.id] ? (
                      <div className="bg-[#A78BFA]/5 border border-[#A78BFA]/10 p-3 rounded-lg">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#A78BFA]" />
                            <span className="font-bold text-sm text-[#A78BFA]">AI Score: {artwork.aiScore}/100</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-white/40 hover:text-white h-7 px-2"
                            onClick={() => startEditFeedback(artwork.id, artwork.aiFeedback || "")}
                            data-testid={`button-edit-feedback-${artwork.id}`}
                          >
                            <Pencil className="w-3 h-3 mr-1" /> Edit Feedback
                          </Button>
                        </div>
                        <p className="text-sm italic text-white/50">"{artwork.aiFeedback}"</p>
                      </div>
                    ) : artwork.aiFeedback && !artwork.aiScore && !editingFeedback[artwork.id] ? (
                      <div className="bg-white/[0.03] border border-white/5 p-3 rounded-lg">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-white/40" />
                            <span className="font-medium text-sm text-white/60">Curator Feedback</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-white/40 hover:text-white h-7 px-2"
                            onClick={() => startEditFeedback(artwork.id, artwork.aiFeedback || "")}
                            data-testid={`button-edit-feedback-${artwork.id}`}
                          >
                            <Pencil className="w-3 h-3 mr-1" /> Edit
                          </Button>
                        </div>
                        <p className="text-sm italic text-white/50">"{artwork.aiFeedback}"</p>
                      </div>
                    ) : null}

                    {editingFeedback[artwork.id] && (
                      <div className="space-y-2">
                        <Textarea
                          value={feedbackDrafts[artwork.id] || ""}
                          onChange={(e) => setFeedbackDrafts(prev => ({ ...prev, [artwork.id]: e.target.value }))}
                          placeholder="Write or edit curator feedback..."
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[80px] text-sm"
                          data-testid={`textarea-feedback-${artwork.id}`}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="rounded-full bg-[#A78BFA] text-white hover:bg-[#A78BFA]/90 h-8 text-xs"
                            onClick={() => handleSaveFeedback(artwork.id)}
                            disabled={updateFeedback.isPending}
                            data-testid={`button-save-feedback-${artwork.id}`}
                          >
                            {updateFeedback.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
                            Save Feedback
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-full text-white/40 hover:text-white h-8 text-xs"
                            onClick={() => cancelEditFeedback(artwork.id)}
                            data-testid={`button-cancel-feedback-${artwork.id}`}
                          >
                            <XCircle className="w-3 h-3 mr-1" /> Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {activeTab === "pending" && !editingFeedback[artwork.id] && (
                      <div className="space-y-2">
                        <Textarea
                          value={feedbackDrafts[artwork.id] || ""}
                          onChange={(e) => setFeedbackDrafts(prev => ({ ...prev, [artwork.id]: e.target.value }))}
                          placeholder="Write curator feedback (optional — will be saved with your decision)..."
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[60px] text-sm"
                          data-testid={`textarea-pending-feedback-${artwork.id}`}
                        />
                      </div>
                    )}

                    <div className="flex gap-2 pt-2 border-t border-white/5 flex-wrap items-center">
                      {!artwork.aiScore && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full border-white/20 text-white hover:bg-white/10 h-8 text-xs"
                          onClick={() => handleReview(artwork.id)}
                          disabled={aiReview.isPending}
                          data-testid={`button-ai-review-${artwork.id}`}
                        >
                          {aiReview.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                          AI Review
                        </Button>
                      )}

                      {artwork.status !== "approved" && (
                        <Button
                          size="sm"
                          className="rounded-full bg-emerald-500 text-white hover:bg-emerald-500/90 h-8 text-xs"
                          onClick={() => handleDecision(artwork.id, "approved")}
                          disabled={updateStatus.isPending}
                          data-testid={`button-approve-${artwork.id}`}
                        >
                          <Check className="w-3 h-3 mr-1" /> Approve
                        </Button>
                      )}
                      {artwork.status !== "rejected" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="rounded-full h-8 text-xs"
                          onClick={() => handleDecision(artwork.id, "rejected")}
                          disabled={updateStatus.isPending}
                          data-testid={`button-reject-${artwork.id}`}
                        >
                          <X className="w-3 h-3 mr-1" /> Reject
                        </Button>
                      )}

                      {!editingFeedback[artwork.id] && artwork.aiFeedback && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-full text-white/40 hover:text-white h-8 text-xs"
                          onClick={() => startEditFeedback(artwork.id, artwork.aiFeedback || "")}
                          data-testid={`button-edit-feedback-action-${artwork.id}`}
                        >
                          <Pencil className="w-3 h-3 mr-1" /> Edit Feedback
                        </Button>
                      )}

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full border-red-500/20 text-red-400 hover:bg-red-500/10 h-8 text-xs ml-auto"
                            disabled={deleteArtwork.isPending}
                            data-testid={`button-delete-${artwork.id}`}
                          >
                            <Trash2 className="w-3 h-3 mr-1" /> Delete
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
  );
}
