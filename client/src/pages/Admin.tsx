import { Layout } from "@/components/Layout";
import { useArtworks, useUpdateArtworkStatus, useAiReview } from "@/hooks/use-artworks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const { data: artworks, isLoading } = useArtworks({ status: "pending" });
  const updateStatus = useUpdateArtworkStatus();
  const aiReview = useAiReview();
  const { toast } = useToast();

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
    updateStatus.mutate({ id, status }, {
      onSuccess: () => {
        toast({
          title: `Artwork ${status}`,
          variant: status === 'approved' ? 'default' : 'destructive',
        });
      }
    });
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Curation Queue</h1>
          <p className="text-muted-foreground">Review pending submissions with AI assistance</p>
        </div>

        {isLoading ? (
          <div>Loading queue...</div>
        ) : artworks?.length === 0 ? (
          <div className="p-12 text-center border rounded-xl bg-muted/20">
            <Check className="w-12 h-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-xl font-bold">All caught up!</h3>
            <p className="text-muted-foreground">No pending artworks to review.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {artworks?.map((artwork) => (
              <Card key={artwork.id} className="p-6 flex flex-col md:flex-row gap-6 overflow-hidden">
                <div className="w-full md:w-64 aspect-square bg-muted rounded-lg overflow-hidden shrink-0">
                  <img src={artwork.imageUrl} alt={artwork.title} className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold">{artwork.title}</h3>
                      <p className="text-sm text-muted-foreground">by Artist #{artwork.artistId}</p>
                    </div>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      Pending
                    </Badge>
                  </div>

                  <p className="text-sm">{artwork.description}</p>
                  
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
                    >
                      {aiReview.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                      Generate AI Review
                    </Button>
                  )}
                  
                  <div className="flex gap-3 pt-4 border-t">
                    <Button 
                      className="bg-green-600 hover:bg-green-700 text-white" 
                      onClick={() => handleDecision(artwork.id, "approved")}
                      disabled={updateStatus.isPending}
                    >
                      <Check className="w-4 h-4 mr-2" /> Approve
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => handleDecision(artwork.id, "rejected")}
                      disabled={updateStatus.isPending}
                    >
                      <X className="w-4 h-4 mr-2" /> Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
