import { useState, useRef } from "react";
import { Layout } from "@/components/Layout";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import { handleArtworkImageError } from "@/lib/imageFallback";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, DollarSign, Trash2, ArrowRight, ImagePlus, Clock, Palette } from "lucide-react";
import { useCharities } from "@/hooks/use-charities";
import type { PortfolioItem } from "@shared/schema";

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

export default function Portfolio() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
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

  const { data: items, isLoading } = useQuery<PortfolioItem[]>({
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

  const deleteItem = useMutation({
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

  if (!user) {
    return <Layout><div className="flex items-center justify-center h-[50vh]"><p>Please log in to view your portfolio.</p></div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8 pb-16">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <span className="text-sm font-medium text-[#B8965A] uppercase tracking-wider">Your Collection</span>
            <h1 className="text-3xl font-display font-bold mt-1" data-testid="text-portfolio-title">My Portfolio</h1>
            <p className="text-muted-foreground">Showcase your artwork. List pieces for sale or submit them to auction.</p>
          </div>
          <Button onClick={() => setShowAddForm(true)} className="rounded-full gap-2" data-testid="button-add-portfolio">
            <Plus className="w-4 h-4" /> Add Artwork
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8" /></div>
        ) : !items || items.length === 0 ? (
          <Card className="p-12 text-center">
            <Palette className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Your portfolio is empty</h3>
            <p className="text-muted-foreground mb-4">Start building your portfolio by adding your artwork.</p>
            <Button onClick={() => setShowAddForm(true)} className="rounded-full gap-2" data-testid="button-add-portfolio-empty">
              <Plus className="w-4 h-4" /> Add Your First Piece
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden group" data-testid={`portfolio-item-${item.id}`}>
                <div className="aspect-square overflow-hidden bg-muted relative">
                  <img src={item.imageUrl} alt={item.title} onError={handleArtworkImageError} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
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
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-1 text-xs"
                          onClick={() => setShowSellDialog(item)}
                          data-testid={`button-list-sale-${item.id}`}
                        >
                          <DollarSign className="w-3 h-3" /> List for Sale
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-1 text-xs"
                          onClick={() => setShowConvertDialog(item)}
                          data-testid={`button-convert-auction-${item.id}`}
                        >
                          <ArrowRight className="w-3 h-3" /> Submit to Auction
                        </Button>
                      </>
                    )}
                    {item.listedForSale && !(item as any).expired && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-1 text-xs"
                        onClick={() => setShowConvertDialog(item)}
                        data-testid={`button-convert-auction-listed-${item.id}`}
                      >
                        <ArrowRight className="w-3 h-3" /> Submit to Auction
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteItem.mutate(item.id)}
                      data-testid={`button-delete-portfolio-${item.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-add-portfolio">
          <DialogHeader>
            <DialogTitle className="font-display">Add to Portfolio</DialogTitle>
            <DialogDescription>Add a new artwork to your personal portfolio.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={newItem.title}
                onChange={(e) => setNewItem(p => ({ ...p, title: e.target.value }))}
                placeholder="Artwork title"
                data-testid="input-portfolio-title"
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea
                value={newItem.description}
                onChange={(e) => setNewItem(p => ({ ...p, description: e.target.value }))}
                placeholder="Brief description..."
                data-testid="input-portfolio-description"
              />
            </div>
            <div>
              <Label>Dimensions (L x W in inches)</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  placeholder="Length"
                  onChange={(e) => {
                    const l = e.target.value;
                    const w = newItem.dimensions.split(" x ")[1]?.replace(" inches", "") || "";
                    setNewItem(p => ({ ...p, dimensions: l && w ? `${l} x ${w} inches` : "" }));
                  }}
                  data-testid="input-portfolio-length"
                />
                <span className="text-muted-foreground">x</span>
                <Input
                  type="number"
                  placeholder="Width"
                  onChange={(e) => {
                    const w = e.target.value;
                    const l = newItem.dimensions.split(" x ")[0] || "";
                    setNewItem(p => ({ ...p, dimensions: l && w ? `${l} x ${w} inches` : "" }));
                  }}
                  data-testid="input-portfolio-width"
                />
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
                <div
                  className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="dropzone-portfolio-image"
                >
                  <ImagePlus className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); }}
                data-testid="input-portfolio-file"
              />
            </div>
            <Button
              className="w-full rounded-full"
              disabled={!newItem.title || !newItem.imageUrl || createItem.isPending}
              onClick={() => createItem.mutate(newItem)}
              data-testid="button-save-portfolio"
            >
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
            <DialogDescription>
              Set a price for "{showSellDialog?.title}". Once listed, you have 2 weeks to complete the sale.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Price ($)</Label>
              <Input
                type="number"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                placeholder="100"
                data-testid="input-sell-price"
              />
            </div>
            <Button
              className="w-full rounded-full"
              disabled={!sellPrice || Number(sellPrice) <= 0 || listForSale.isPending}
              onClick={() => showSellDialog && listForSale.mutate({ id: showSellDialog.id, price: Number(sellPrice) })}
              data-testid="button-confirm-list"
            >
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
            <DialogDescription>
              Convert "{showConvertDialog?.title}" into an auction listing. It will go through curation review first.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Auction Duration</Label>
              <Select value={convertOpts.auctionDurationDays} onValueChange={(v) => setConvertOpts(p => ({ ...p, auctionDurationDays: v }))}>
                <SelectTrigger data-testid="select-convert-duration"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Day</SelectItem>
                  <SelectItem value="3">3 Days</SelectItem>
                  <SelectItem value="5">5 Days</SelectItem>
                  <SelectItem value="7">7 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Charity (Optional)</Label>
              <Select value={convertOpts.charityId} onValueChange={(v) => setConvertOpts(p => ({ ...p, charityId: v, charityNote: v !== "other" ? "" : p.charityNote }))}>
                <SelectTrigger data-testid="select-convert-charity"><SelectValue placeholder="Choose a cause" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {charities?.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                  <SelectItem value="other" data-testid="charity-option-other-portfolio">Other (describe below)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {convertOpts.charityId === "other" && (
              <div>
                <Label>Where should the 5% go?</Label>
                <input
                  className="w-full mt-1 px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
                  placeholder="e.g. Local after-school art program"
                  value={convertOpts.charityNote}
                  onChange={(e) => setConvertOpts(p => ({ ...p, charityNote: e.target.value }))}
                  data-testid="input-charity-note-portfolio"
                />
              </div>
            )}
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
            <Button
              className="w-full rounded-full"
              disabled={convertToAuction.isPending || (convertOpts.charityId === "other" && !convertOpts.charityNote.trim())}
              onClick={() => showConvertDialog && convertToAuction.mutate({ id: showConvertDialog.id, opts: convertOpts })}
              data-testid="button-confirm-convert"
            >
              {convertToAuction.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Submit for Review
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </Layout>
  );
}
