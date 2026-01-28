import { Link } from "wouter";
import { type Artwork, type User } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Clock, Sparkles, Rocket } from "lucide-react";

interface ArtworkCardProps {
  artwork: Artwork & { artist?: User };
  showStatus?: boolean;
}

export function ArtworkCard({ artwork, showStatus = false }: ArtworkCardProps) {
  const displayImage = artwork.imageUrl || "https://images.unsplash.com/photo-1579783902614-a3fb39279c0f?q=80&w=800&auto=format&fit=crop";

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Link href={`/artwork/${artwork.id}`}>
        <Card 
          className="overflow-hidden cursor-pointer group border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-card h-full flex flex-col"
          data-testid={`card-artwork-${artwork.id}`}
        >
          {/* Image Container with Artistic Frame Effect */}
          <div className="relative aspect-[4/5] overflow-hidden bg-muted">
            <img 
              src={displayImage} 
              alt={artwork.title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Inner Frame Effect */}
            <div className="absolute inset-2 border border-white/0 group-hover:border-white/30 rounded-sm transition-all duration-500 pointer-events-none" />
            
            {showStatus && (
              <div className="absolute top-3 right-3 z-10">
                <Badge 
                  variant={
                    artwork.status === 'approved' ? 'default' : 
                    artwork.status === 'rejected' ? 'destructive' : 'secondary'
                  }
                  className="shadow-lg"
                >
                  {artwork.status}
                </Badge>
              </div>
            )}
            
            <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
              {artwork.aiScore && (
                <Badge variant="outline" className="bg-black/60 text-white border-white/20 backdrop-blur-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {artwork.aiScore}/100
                </Badge>
              )}
              {(artwork.promotionPercentage ?? 0) > 0 && (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg flex items-center gap-1">
                  <Rocket className="w-3 h-3" />
                  Boosted
                </Badge>
              )}
            </div>
            
            {/* Hover Action Hint */}
            <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
              <p className="text-white text-sm font-medium">View artwork details</p>
            </div>
          </div>
          
          {/* Content Section */}
          <div className="p-5 flex flex-col flex-1 bg-card">
            <h3 className="font-display text-xl font-semibold mb-1 line-clamp-1 group-hover:text-primary transition-colors duration-300">
              {artwork.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              by <span className="font-medium text-foreground/80">{artwork.artistId}</span>
            </p>
            
            <div className="mt-auto">
              {/* Auction Timer Placeholder */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                <Clock className="w-3.5 h-3.5" />
                <span>Auction ends in 6d 23h</span>
              </div>
              
              {/* Price Section */}
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Current Bid
                </div>
                <div className="font-display font-bold text-xl text-primary">
                  ${Number(artwork.price).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
