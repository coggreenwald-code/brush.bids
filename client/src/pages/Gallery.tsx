import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Footer } from "@/components/Footer";
import { useArtworks } from "@/hooks/use-artworks";
import { ArtworkCard } from "@/components/ArtworkCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, X, Palette } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";

const categories = [
  "All Categories",
  "Painting",
  "Digital Art",
  "Photography",
  "Drawing",
  "Sculpture",
  "Mixed Media",
  "Illustration",
];

const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "ending-soon", label: "Ending Soon" },
];

export default function Gallery() {
  const { data: artworks, isLoading } = useArtworks({ status: "approved" });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  const filteredArtworks = useMemo(() => {
    if (!artworks) return [];
    
    let filtered = [...artworks];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.description.toLowerCase().includes(query)
      );
    }
    
    if (selectedCategory !== "All Categories") {
      filtered = filtered.filter((a) => 
        a.description.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        a.title.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }
    
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
        break;
      case "ending-soon":
        filtered.sort((a, b) => {
          const aEnd = new Date(a.createdAt || 0);
          const bEnd = new Date(b.createdAt || 0);
          aEnd.setDate(aEnd.getDate() + 7);
          bEnd.setDate(bEnd.getDate() + 7);
          return aEnd.getTime() - bEnd.getTime();
        });
        break;
    }
    
    filtered.sort((a, b) => {
      const aBoost = a.promotionPercentage ?? 0;
      const bBoost = b.promotionPercentage ?? 0;
      return bBoost - aBoost;
    });
    
    return filtered;
  }, [artworks, searchQuery, selectedCategory, sortBy]);

  const activeFilters = [
    selectedCategory !== "All Categories" && selectedCategory,
  ].filter(Boolean);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All Categories");
    setSortBy("newest");
  };

  return (
    <Layout>
      <div className="space-y-8 pb-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-sm font-medium text-[#B8965A] dark:text-[#C9A84C] uppercase tracking-wider">Curated Collection</span>
            <h1 className="text-4xl font-display font-bold mt-1">Gallery</h1>
            <p className="text-muted-foreground mt-2">Browse unique artworks from emerging student talent</p>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search artworks..." 
                className="pl-9 bg-card" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-gallery-search"
              />
            </div>
            
            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden" data-testid="button-mobile-filters">
                  <SlidersHorizontal className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="space-y-6 mt-6">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger data-testid="select-category-mobile">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Sort By</Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger data-testid="select-sort-mobile">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button variant="outline" className="w-full" onClick={clearFilters} data-testid="button-clear-filters-mobile">
                    Clear All Filters
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4 flex-wrap">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48" data-testid="select-category">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48" data-testid="select-sort">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground">
              {filteredArtworks.length} {filteredArtworks.length === 1 ? "artwork" : "artworks"}
            </span>
          </div>
        </div>

        {(activeFilters.length > 0 || searchQuery) && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                Search: {searchQuery}
                <button onClick={() => setSearchQuery("")} className="ml-1">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {activeFilters.map((filter) => (
              <Badge key={filter as string} variant="secondary" className="gap-1">
                {filter}
              </Badge>
            ))}
            <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="button-clear-all">
              Clear all
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-[350px] bg-muted animate-pulse rounded-md" />
            ))}
          </div>
        ) : filteredArtworks.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed rounded-md bg-muted/10">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#B8965A]/10 flex items-center justify-center">
              <Palette className="w-10 h-10 text-[#B8965A]" />
            </div>
            <h3 className="text-xl font-bold mb-2">No Artworks Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || activeFilters.length > 0 
                ? "Try adjusting your filters or search query."
                : "Be the first to submit your artwork!"}
            </p>
            {(searchQuery || activeFilters.length > 0) && (
              <Button variant="outline" onClick={clearFilters} data-testid="button-clear-filters-empty">
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredArtworks.map((artwork) => (
              <ArtworkCard key={artwork.id} artwork={artwork} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </Layout>
  );
}
