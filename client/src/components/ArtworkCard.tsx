import { Link } from "wouter";
import { type Artwork, type User } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Rocket } from "lucide-react";

interface ArtworkCardProps {
  artwork: Artwork & { artist?: User };
  showStatus?: boolean;
}

export function ArtworkCard({ artwork, showStatus = false }: ArtworkCardProps) {
  const displayImage = artwork.imageUrl || "https://images.unsplash.com/photo-1579783902614-a3fb39279c0f?q=80&w=800&auto=format&fit=crop";

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Link href={`/artwork/${artwork.id}`}>
        <Card 
          className="overflow-hidden cursor-pointer group border shadow-sm hover:shadow-lg transition-all duration-300 bg-card h-full flex flex-col"
          data-testid={`card-artwork-${artwork.id}`}
        >
          <div className="relative aspect-[4/5] overflow-hidden bg-muted">
            <img 
              src={displayImage} 
              alt={artwork.title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
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
              {(artwork.promotionPercentage ?? 0) > 0 && (
                <Badge className="bg-gradient-to-r from-[#B8965A] to-[#C9A84C] text-white border-0 shadow-lg flex items-center gap-1">
                  <Rocket className="w-3 h-3" />
                  Boosted
                </Badge>
              )}
            </div>
            
            <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
              <p className="text-white text-sm font-medium">View artwork</p>
            </div>
          </div>
          
          <div className="p-5 flex flex-col flex-1 bg-card">
            <h3 className="font-display text-lg font-semibold line-clamp-1 group-hover:text-[#B8965A] transition-colors duration-300">
              {artwork.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              by <span className="font-medium text-foreground/80">{artwork.artist ? `${artwork.artist.firstName || ''} ${artwork.artist.lastName || ''}`.trim() || artwork.artistId : artwork.artistId}</span>
            </p>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
