import { Layout } from "@/components/Layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateArtwork } from "@/hooks/use-artworks";
import { useCharities } from "@/hooks/use-charities";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Loader2, UploadCloud } from "lucide-react";
import { Card } from "@/components/ui/card";

// Extending schema from shared but coercing numbers for form handling
const formSchema = z.object({
  title: z.string().min(3, "Title too short"),
  description: z.string().min(10, "Description too short"),
  imageUrl: z.string().url("Must be a valid URL"),
  price: z.coerce.number().min(1, "Price must be positive"),
  charityId: z.coerce.number().optional(),
});

export default function SubmitArtwork() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createArtwork = useCreateArtwork();
  const { data: charities } = useCharities();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      price: 0,
    },
  });

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[50vh]">
          <p>Please log in to submit artwork.</p>
        </div>
      </Layout>
    );
  }

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createArtwork.mutate({
      ...data,
      artistId: parseInt(user.id as any),
      price: data.price.toString(), // DB expects decimal as string sometimes or number depending on driver, but schema says decimal
    } as any, {
      onSuccess: () => {
        toast({
          title: "Submission Successful",
          description: "Your artwork has been sent to AI curators for review.",
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

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Submit Artwork</h1>
          <p className="text-muted-foreground">Upload your masterpiece for AI curation and global auction.</p>
        </div>

        <Card className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Sunset over the Dorms" {...field} />
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
                    <FormLabel>Description & Backstory</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell us about your creative process..." 
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>Good stories increase sales by 25%.</FormDescription>
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
                      <FormLabel>Reserve Price ($)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="50.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="charityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Charity (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a cause" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {charities?.map(c => (
                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>15% of proceeds go here.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input placeholder="https://..." {...field} />
                        <Button type="button" variant="outline" size="icon">
                          <UploadCloud className="w-4 h-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>Link to your high-res image file.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" size="lg" className="w-full" disabled={createArtwork.isPending}>
                {createArtwork.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  "Submit to Curators"
                )}
              </Button>
            </form>
          </Form>
        </Card>
      </div>
    </Layout>
  );
}
