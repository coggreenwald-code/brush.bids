import { Link } from "wouter";
import { type Artwork, type User } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

interface ArtworkCardProps {
  artwork: Artwork & { artist?: User }; // Artist might be joined or not depending on query
  showStatus?: boolean;
}

export function ArtworkCard({ artwork, showStatus = false }: ArtworkCardProps) {
  // Placeholder logic for empty images
  const displayImage = artwork.imageUrl || "https://images.unsplash.com/photo-1579783902614-a3fb39279c0f?q=80&w=800&auto=format&fit=crop";

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Link href={`/artwork/${artwork.id}`}>
        <Card className="overflow-hidden cursor-pointer group border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-card h-full flex flex-col">
          <div className="relative aspect-[4/5] overflow-hidden bg-muted">
            {/* Descriptive alt text for accessibility */}
            <img 
              src={displayImage} 
              alt={artwork.title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {showStatus && (
              <div className="absolute top-3 right-3">
                <Badge variant={
                  artwork.status === 'approved' ? 'default' : 
                  artwork.status === 'rejected' ? 'destructive' : 'secondary'
                }>
                  {artwork.status}
                </Badge>
              </div>
            )}
            
            {artwork.aiScore && (
              <div className="absolute top-3 left-3">
                <Badge variant="outline" className="bg-black/50 text-white border-white/20 backdrop-blur-md">
                  AI Score: {artwork.aiScore}/100
                </Badge>
              </div>
            )}
          </div>
          
          <div className="p-5 flex flex-col flex-1">
            <h3 className="font-display font-bold text-xl mb-1 line-clamp-1 group-hover:text-primary transition-colors">
              {artwork.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              by <span className="font-medium text-foreground">{artwork.artistId}</span>
            </p>
            
            <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/50">
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Current Price
              </div>
              <div className="font-mono font-bold text-lg text-primary">
                ${Number(artwork.price).toLocaleString()}
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
