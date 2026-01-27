import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useArtworks } from "@/hooks/use-artworks";
import { ArtworkCard } from "@/components/ArtworkCard";
import { ArrowRight, Sparkles, Upload } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function Home() {
  const { data: artworks, isLoading } = useArtworks({ status: "approved" });

  const featuredArtworks = artworks?.slice(0, 3) || [];

  return (
    <Layout>
      <div className="space-y-16 pb-16">
        {/* Hero Section */}
        <section className="relative rounded-3xl overflow-hidden bg-foreground text-background py-20 px-6 md:px-12 flex flex-col items-center text-center">
          {/* Unsplash abstract artistic background */}
          <div className="absolute inset-0 z-0 opacity-20">
             <img 
               src="https://images.unsplash.com/photo-1561214115-f2f134cc4912?q=80&w=2000&auto=format&fit=crop" 
               alt="Abstract art background" 
               className="w-full h-full object-cover"
             />
          </div>
          
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight tracking-tight">
                Discover the Next <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Masterpiece</span>
              </h1>
            </motion.div>
            
            <motion.p 
              className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              The premier marketplace for student artists. Curated by AI, bid on by the world.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <Link href="/gallery">
                <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-primary hover:bg-primary/90 text-white">
                  Start Bidding <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-white/20 text-white hover:bg-white/10 hover:text-white">
                  Submit Art <Upload className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Featured Section */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-display font-bold">Featured Works</h2>
              <p className="text-muted-foreground mt-1">Hand-picked by our AI curation engine</p>
            </div>
            <Link href="/gallery">
              <Button variant="ghost" className="hidden md:flex">View All Gallery <ArrowRight className="ml-2 w-4 h-4" /></Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-[400px] bg-muted animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredArtworks.map((artwork) => (
                <ArtworkCard key={artwork.id} artwork={artwork} />
              ))}
            </div>
          )}
        </section>

        {/* AI Curation Explainer */}
        <section className="grid md:grid-cols-2 gap-12 items-center bg-white dark:bg-card p-8 rounded-3xl border shadow-sm">
          <div className="space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-3xl font-display font-bold">Powered by AI Curation</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Every submission is analyzed by our advanced AI curators. They evaluate technique, composition, and originality to ensure only the highest quality student work reaches the marketplace.
            </p>
            <ul className="space-y-3">
              {['Instant Feedback for Artists', 'Quality Assurance for Buyers', 'Fair & Unbiased Selection'].map((item) => (
                <li key={item} className="flex items-center gap-3 font-medium">
                  <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center text-xs">✓</div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
             {/* Unsplash tech/art image */}
             <img 
               src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1000&auto=format&fit=crop" 
               alt="AI Art Analysis" 
               className="w-full h-full object-cover"
             />
             <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent mix-blend-overlay" />
          </div>
        </section>
      </div>
    </Layout>
  );
}
