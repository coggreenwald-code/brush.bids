import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Footer } from "@/components/Footer";
import { useArtworks } from "@/hooks/use-artworks";
import { ArtworkCard } from "@/components/ArtworkCard";
import { Search, SlidersHorizontal, X, Palette } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
      <div className="pb-24">
        <div
          style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }}
          className="border-b border-white/5 mb-12"
        >
          <div className="max-w-7xl mx-auto px-6 py-16">
            <span className="text-xs font-medium text-[#A78BFA] uppercase tracking-[0.3em]">
              Curated Collection
            </span>
            <h1 className="text-5xl md:text-6xl font-display font-bold mt-4 text-white">
              Gallery
            </h1>
            <p className="text-white/50 mt-4 text-lg max-w-xl">
              Browse unique artworks from emerging student talent
            </p>
          </div>
        </div>

        <div
          style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }}
          className="sticky top-0 z-30 border-b border-white/5 backdrop-blur-xl"
        >
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  placeholder="Search artworks..."
                  className="w-full pl-11 pr-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#A78BFA]/40 focus:bg-white/[0.07] transition-colors"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-gallery-search"
                />
              </div>

              <div className="hidden md:flex items-center gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm transition-all duration-200 ${
                      selectedCategory === cat
                        ? "bg-[#A78BFA] text-[#0a0a0f] font-medium"
                        : "border border-white/10 text-white/60 hover:bg-white/5 hover:text-white hover:border-white/20"
                    }`}
                    data-testid={`filter-category-${cat.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {cat === "All Categories" ? "All" : cat}
                  </button>
                ))}
              </div>

              <div className="hidden md:block ml-auto">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger
                    className="w-44 rounded-full bg-white/5 border-white/10 text-white/70 text-sm focus:ring-0 focus:border-white/20"
                    data-testid="select-sort"
                  >
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="hidden md:flex items-center">
                <span className="text-sm text-white/40">
                  {filteredArtworks.length} {filteredArtworks.length === 1 ? "artwork" : "artworks"}
                </span>
              </div>

              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetTrigger asChild>
                  <button
                    className="md:hidden p-2.5 rounded-full border border-white/10 text-white/60 hover:bg-white/5 transition-colors"
                    data-testid="button-mobile-filters"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 bg-[#0a0a0f] border-white/10">
                  <SheetHeader>
                    <SheetTitle className="text-white">Filters</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-6 mt-6">
                    <div className="space-y-2">
                      <Label className="text-white/60">Category</Label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger data-testid="select-category-mobile" className="bg-white/5 border-white/10 text-white">
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
                      <Label className="text-white/60">Sort By</Label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger data-testid="select-sort-mobile" className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {sortOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <button
                      className="w-full py-2.5 rounded-full border border-white/20 text-white text-sm hover:bg-white/10 transition-colors"
                      onClick={clearFilters}
                      data-testid="button-clear-filters-mobile"
                    >
                      Clear All Filters
                    </button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {(activeFilters.length > 0 || searchQuery) && (
          <div className="flex items-center gap-2 flex-wrap mt-6 px-1">
            <span className="text-sm text-white/40">Active filters:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm">
                Search: {searchQuery}
                <button onClick={() => setSearchQuery("")} className="ml-1 text-white/40 hover:text-white transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {activeFilters.map((filter) => (
              <span key={filter as string} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm">
                {filter}
              </span>
            ))}
            <button
              onClick={clearFilters}
              className="text-sm text-[#A78BFA] hover:text-[#A78BFA]/80 transition-colors"
              data-testid="button-clear-all"
            >
              Clear all
            </button>
          </div>
        )}

        <div className="mt-10">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="aspect-[4/5] bg-white/[0.02] animate-pulse rounded-md border border-white/5" />
              ))}
            </div>
          ) : filteredArtworks.length === 0 ? (
            <div className="py-24 text-center border border-white/5 rounded-md bg-white/[0.02]">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#A78BFA]/10 flex items-center justify-center">
                <Palette className="w-10 h-10 text-[#A78BFA]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Artworks Found</h3>
              <p className="text-white/50 mb-6">
                {searchQuery || activeFilters.length > 0 
                  ? "Try adjusting your filters or search query."
                  : "Be the first to submit your artwork!"}
              </p>
              {(searchQuery || activeFilters.length > 0) && (
                <button
                  onClick={clearFilters}
                  className="px-6 py-2.5 rounded-full border border-white/20 text-white text-sm hover:bg-white/10 transition-colors"
                  data-testid="button-clear-filters-empty"
                >
                  Clear Filters
                </button>
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
      </div>

      <Footer />
    </Layout>
  );
}
