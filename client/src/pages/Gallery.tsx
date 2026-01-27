import { Layout } from "@/components/Layout";
import { useArtworks } from "@/hooks/use-artworks";
import { ArtworkCard } from "@/components/ArtworkCard";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Gallery() {
  const { data: artworks, isLoading } = useArtworks({ status: "approved" });

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-display font-bold">Gallery</h1>
            <p className="text-muted-foreground mt-2">Browse unique artworks from emerging student talent</p>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search artworks..." className="pl-9 bg-card" />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-[350px] bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {artworks?.length === 0 ? (
              <div className="col-span-full py-20 text-center text-muted-foreground">
                No artworks found. Be the first to submit!
              </div>
            ) : (
              artworks?.map((artwork) => (
                <ArtworkCard key={artwork.id} artwork={artwork} />
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
