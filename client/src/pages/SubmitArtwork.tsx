import { Layout } from "@/components/Layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateArtwork } from "@/hooks/use-artworks";
import { useCharities } from "@/hooks/use-charities";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Loader2, UploadCloud, Sparkles, Camera, ImagePlus, Zap, Clock, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState, useRef, useCallback } from "react";

const formSchema = z.object({
  title: z.string().min(3, "Title too short"),
  description: z.string().min(10, "Description too short"),
  imageUrl: z.string().min(1, "Please upload an image of your artwork"),
  price: z.coerce.number().min(1, "Price must be positive"),
  dimensionLength: z.coerce.number().min(0.1, "Length is required"),
  dimensionWidth: z.coerce.number().min(0.1, "Width is required"),
  auctionDurationDays: z.coerce.number().min(1).max(30).default(7),
  charityId: z.coerce.number().optional(),
  reviewType: z.enum(["ai_instant", "human_curator"]),
});

export default function SubmitArtwork() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createArtwork = useCreateArtwork();
  const { data: charities } = useCharities();
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const generateDescription = useMutation({
    mutationFn: async (data: { title: string; medium?: string }) => {
      const res = await apiRequest("POST", "/api/artworks/generate-description", data);
      return res.json();
    },
    onSuccess: (data) => {
      form.setValue("description", data.description);
      toast({
        title: "Description Generated",
        description: "A description has been created. Feel free to edit it!",
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Could not generate description. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateDescription = () => {
    const title = form.getValues("title");
    if (!title || title.length < 3) {
      toast({
        title: "Title Required",
        description: "Please enter a title first so we can generate a relevant description.",
        variant: "destructive",
      });
      return;
    }
    generateDescription.mutate({ title });
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      price: 0,
      dimensionLength: 0,
      dimensionWidth: 0,
      auctionDurationDays: 7,
      reviewType: "ai_instant",
    },
  });

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/artworks/upload-image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      form.setValue("imageUrl", data.imageUrl);
      setImagePreview(URL.createObjectURL(file));
      toast({ title: "Image Uploaded", description: "Your artwork image is ready." });
    } catch {
      toast({ title: "Upload Failed", description: "Could not upload image. Please try again.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file);
  };

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setShowCamera(true);
    } catch {
      toast({ title: "Camera Unavailable", description: "Could not access your camera. Please check permissions.", variant: "destructive" });
    }
  }, [toast]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `scan-${Date.now()}.jpg`, { type: "image/jpeg" });
        uploadImage(file);
      }
    }, "image/jpeg", 0.92);
    stopCamera();
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  }, []);

  const removeImage = () => {
    form.setValue("imageUrl", "");
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[50vh]">
          <p className="text-white/50">Please log in to submit artwork.</p>
        </div>
      </Layout>
    );
  }

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const { dimensionLength, dimensionWidth, ...rest } = data;
    const dimensions = `${dimensionLength} x ${dimensionWidth} inches`;
    createArtwork.mutate({
      ...rest,
      artistId: user.id,
      price: data.price.toString(),
      dimensions,
    } as any, {
      onSuccess: () => {
        toast({
          title: "Submission Successful",
          description: data.reviewType === "ai_instant"
            ? "Your artwork has been submitted for instant expert review."
            : "Your artwork has been submitted and will be reviewed by our curators soon.",
        });
        setLocation("/dashboard");
      },
      onError: (err) => {
        toast({
          title: "Submission Failed",
          description: err.message,
          variant: "destructive",
        });
      }
    });
  };

  const selectedReviewType = form.watch("reviewType");

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <span className="text-xs font-medium text-[#E8C874] uppercase tracking-[0.3em]">Create Listing</span>
          <h1 className="text-3xl font-display font-bold text-white mt-1">Submit Artwork</h1>
          <p className="text-white/50">Upload your masterpiece for expert review and global auction.</p>
        </div>

        <div className="p-8 rounded-xl bg-white/[0.02] border border-white/5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Sunset over the Dorms" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" {...field} data-testid="input-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <FormLabel className="text-white/70">Description & Backstory</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full border-white/20 text-white hover:bg-white/10"
                        onClick={handleGenerateDescription}
                        disabled={generateDescription.isPending}
                        data-testid="button-ai-generate-description"
                      >
                        {generateDescription.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        Auto Write
                      </Button>
                    </div>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell us about your creative process, or click 'Auto Write' to generate a description..." 
                        className="min-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-white/30"
                        {...field} 
                        data-testid="textarea-description"
                      />
                    </FormControl>
                    <FormDescription className="text-white/30">Good stories increase sales by 25%. Let us help you craft the perfect description!</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Reserve Price ($)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="50.00" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" {...field} data-testid="input-price" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="auctionDurationDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Auction Duration</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white" data-testid="select-auction-duration">
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">1 Day</SelectItem>
                          <SelectItem value="3">3 Days</SelectItem>
                          <SelectItem value="5">5 Days</SelectItem>
                          <SelectItem value="7">7 Days</SelectItem>
                          <SelectItem value="14">14 Days</SelectItem>
                          <SelectItem value="30">30 Days</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="dimensionLength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Length (inches)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="24" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" {...field} data-testid="input-dimension-length" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dimensionWidth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Width (inches)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="36" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" {...field} data-testid="input-dimension-width" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="charityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Select Charity (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white" data-testid="select-charity">
                            <SelectValue placeholder="Choose a cause" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-72">
                          {(() => {
                            const groups: Record<string, { label: string; items: Array<{ id: number; name: string; category?: string }> }> = {
                              global: { label: "Global & National Charities", items: [] },
                              nyc_art: { label: "NYC Art Charities", items: [] },
                              us_art: { label: "U.S. Art Charities", items: [] },
                            };
                            (charities ?? []).forEach(c => {
                              const cat = (c as any).category || "global";
                              if (groups[cat]) groups[cat].items.push(c);
                              else groups.global.items.push(c);
                            });
                            return Object.entries(groups).map(([key, group]) => (
                              group.items.length > 0 ? (
                                <SelectGroup key={key}>
                                  <SelectLabel className="text-xs font-semibold uppercase tracking-wider text-white/40">{group.label}</SelectLabel>
                                  {group.items.map(c => (
                                    <SelectItem key={c.id} value={c.id.toString()} data-testid={`charity-option-${c.id}`}>
                                      {c.name}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              ) : null
                            ));
                          })()}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-white/30">10% of proceeds go to your chosen charity.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="imageUrl"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-white/70">Artwork Image</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        {imagePreview || form.getValues("imageUrl") ? (
                          <div className="relative rounded-lg overflow-hidden border border-white/10 bg-white/5">
                            <img 
                              src={imagePreview || form.getValues("imageUrl")} 
                              alt="Artwork preview" 
                              className="w-full max-h-64 object-contain"
                              data-testid="img-artwork-preview"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2"
                              onClick={removeImage}
                              data-testid="button-remove-image"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div 
                            className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-[#E8C874]/30 hover:bg-white/[0.02]"
                            onClick={() => fileInputRef.current?.click()}
                            data-testid="dropzone-image"
                          >
                            <ImagePlus className="w-10 h-10 mx-auto mb-3 text-white/30" />
                            <p className="font-medium text-sm text-white/70">Click to upload your artwork</p>
                            <p className="text-xs text-white/30 mt-1">JPG, PNG, GIF, WebP up to 10MB</p>
                          </div>
                        )}

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileSelect}
                          data-testid="input-file-upload"
                        />

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-full border-white/20 text-white hover:bg-white/10"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            data-testid="button-upload-file"
                          >
                            {uploading ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <UploadCloud className="w-4 h-4 mr-2" />
                            )}
                            From Camera Roll
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-full border-white/20 text-white hover:bg-white/10"
                            onClick={startCamera}
                            disabled={uploading || showCamera}
                            data-testid="button-scan-artwork"
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            Scan Artwork
                          </Button>
                        </div>

                        {showCamera && (
                          <div className="relative rounded-lg overflow-hidden border border-white/10 bg-black">
                            <video ref={videoRef} autoPlay playsInline className="w-full" data-testid="video-camera" />
                            <canvas ref={canvasRef} className="hidden" />
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                              <Button
                                type="button"
                                size="lg"
                                className="rounded-full bg-white text-black"
                                onClick={capturePhoto}
                                data-testid="button-capture"
                              >
                                <Camera className="w-5 h-5 mr-2" /> Capture
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                className="rounded-full border-white text-white"
                                onClick={stopCamera}
                                data-testid="button-cancel-camera"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription className="text-white/30">Upload from your camera roll or scan your artwork directly.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reviewType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">Review Type</FormLabel>
                    <FormDescription className="mb-3 text-white/30">Choose how you'd like your artwork reviewed.</FormDescription>
                    <FormControl>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div 
                          className={`cursor-pointer transition-all rounded-xl p-4 flex flex-col items-center text-center gap-3 border ${field.value === "ai_instant" ? "ring-2 ring-[#E8C874] border-[#E8C874]/30 bg-[#E8C874]/5" : "border-white/5 bg-white/[0.02] hover:border-white/10"}`}
                          onClick={() => field.onChange("ai_instant")}
                          data-testid="card-review-ai"
                        >
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${field.value === "ai_instant" ? "bg-[#E8C874] text-[#0a0a0f]" : "bg-white/5 text-white/50"}`}>
                            <Zap className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm text-white">Instant Feedback</h4>
                            <p className="text-xs text-white/40 mt-1">
                              Get immediate feedback from our review tool, trained by experienced curators for accurate, expert-level analysis.
                            </p>
                            <span className="inline-block mt-2 text-xs font-medium text-[#E8C874]">Results in seconds</span>
                          </div>
                        </div>

                        <div 
                          className={`cursor-pointer transition-all rounded-xl p-4 flex flex-col items-center text-center gap-3 border ${field.value === "human_curator" ? "ring-2 ring-white/40 border-white/20 bg-white/5" : "border-white/5 bg-white/[0.02] hover:border-white/10"}`}
                          onClick={() => field.onChange("human_curator")}
                          data-testid="card-review-human"
                        >
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${field.value === "human_curator" ? "bg-white/20 text-white" : "bg-white/5 text-white/50"}`}>
                            <Clock className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm text-white">Human Curator</h4>
                            <p className="text-xs text-white/40 mt-1">
                              Get a personalized review from our team of experienced curators with detailed, written feedback.
                            </p>
                            <span className="inline-block mt-2 text-xs font-medium text-white/50">2-3 business days</span>
                          </div>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                size="lg"
                className="w-full rounded-full bg-[#E8C874] text-[#0a0a0f] font-semibold hover:bg-[#E8C874]/90"
                disabled={createArtwork.isPending}
                data-testid="button-submit-artwork"
              >
                {createArtwork.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Submit for Review
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </Layout>
  );
}
