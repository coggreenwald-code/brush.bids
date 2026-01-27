import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useArtworks } from "@/hooks/use-artworks";
import { ArtworkCard } from "@/components/ArtworkCard";
import { ArrowRight, Sparkles, Upload, Palette, Eye, DollarSign, Heart, GraduationCap, Award, Users } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Footer } from "@/components/Footer";

export default function Home() {
  const { data: artworks, isLoading } = useArtworks({ status: "approved" });

  const featuredArtworks = artworks?.slice(0, 3) || [];

  const howItWorksArtist = [
    { icon: Upload, title: "Submit Your Art", description: "Upload your artwork with a description and set your starting price." },
    { icon: Sparkles, title: "AI Curation", description: "Our AI reviews your submission for quality and provides feedback." },
    { icon: DollarSign, title: "Get Paid", description: "When your art sells, receive 70% of the final bid amount." },
    { icon: Heart, title: "Give Back", description: "15% goes to your chosen charity, making a positive impact." },
  ];

  const howItWorksBuyer = [
    { icon: Eye, title: "Browse Gallery", description: "Explore curated student artwork from talented emerging artists." },
    { icon: Palette, title: "Place Bids", description: "Bid on pieces you love and watch the auction unfold." },
    { icon: Award, title: "Win Artwork", description: "Secure unique pieces while supporting student artists." },
    { icon: Heart, title: "Support Causes", description: "Part of your purchase goes to charity." },
  ];

  const testimonials = [
    {
      name: "Emma Chen",
      school: "CalArts",
      role: "Artist",
      quote: "BrushBids gave me my first real art sale. The AI feedback actually helped me improve my technique!",
      avatar: "emma",
      sold: 3,
    },
    {
      name: "Marcus Johnson",
      school: "RISD",
      role: "Artist",
      quote: "I've sold 5 pieces and donated over $200 to environmental causes. This platform is changing lives.",
      avatar: "marcus",
      sold: 5,
    },
    {
      name: "Sarah Williams",
      school: "Art Collector",
      role: "Buyer",
      quote: "I discovered three amazing artists here. The quality of student work is incredible.",
      avatar: "sarah",
      purchased: 8,
    },
  ];

  const stats = [
    { value: "500+", label: "Student Artists" },
    { value: "$125K", label: "Earned by Artists" },
    { value: "$18K", label: "Donated to Charity" },
    { value: "2,000+", label: "Artworks Sold" },
  ];

  return (
    <Layout>
      <div className="space-y-20 pb-16">
        {/* Hero Section */}
        <section className="relative rounded-3xl overflow-hidden bg-foreground text-background py-24 px-6 md:px-12 flex flex-col items-center text-center">
          <div className="absolute inset-0 z-0 opacity-20">
            <img 
              src="https://images.unsplash.com/photo-1561214115-f2f134cc4912?q=80&w=2000&auto=format&fit=crop" 
              alt="Abstract art background" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/80 z-0" />
          
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight tracking-tight text-white">
                Turning student creativity <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400">into opportunity.</span>
              </h1>
            </motion.div>
            
            <motion.p 
              className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              The premier marketplace for emerging artists. AI-curated quality, transparent auctions, and a portion of every sale goes to charity.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <Link href="/gallery">
                <Button data-testid="button-start-bidding" size="lg" className="h-14 px-8 text-lg rounded-full bg-white text-foreground hover:bg-white/90">
                  Start Bidding <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/submit-artwork">
                <Button data-testid="button-submit-art-hero" size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-white/30 text-white hover:bg-white/10 hover:text-white backdrop-blur">
                  Submit Your Art <Upload className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div 
              key={stat.label}
              className="text-center p-6 rounded-2xl bg-card border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.5 }}
            >
              <div className="text-3xl md:text-4xl font-display font-bold text-primary">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </section>

        {/* Featured Section */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-display font-bold">Featured Works</h2>
              <p className="text-muted-foreground mt-1">Hand-picked by our AI curation engine</p>
            </div>
            <Link href="/gallery">
              <Button data-testid="button-view-gallery" variant="ghost" className="hidden md:flex">View All Gallery <ArrowRight className="ml-2 w-4 h-4" /></Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-[400px] bg-muted animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : featuredArtworks.length === 0 ? (
            <div className="text-center py-16 border rounded-2xl bg-muted/20">
              <Palette className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-bold mb-2">No artworks yet</h3>
              <p className="text-muted-foreground mb-4">Be the first to submit your artwork!</p>
              <Link href="/submit-artwork">
                <Button data-testid="button-submit-first">Submit Your Art</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredArtworks.map((artwork) => (
                <ArtworkCard key={artwork.id} artwork={artwork} />
              ))}
            </div>
          )}
        </section>

        {/* How It Works - Artists */}
        <section className="space-y-12">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">Whether you're a student artist or an art enthusiast, getting started is simple.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* For Artists */}
            <Card className="p-8 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200/50 dark:border-amber-800/30">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-2xl font-display font-bold">For Artists</h3>
              </div>
              <div className="space-y-6">
                {howItWorksArtist.map((step, i) => (
                  <div key={step.title} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        <step.icon className="w-4 h-4 text-primary" />
                        {step.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/submit-artwork">
                <Button data-testid="button-start-selling" className="mt-8 w-full">Start Selling Your Art</Button>
              </Link>
            </Card>

            {/* For Buyers */}
            <Card className="p-8 bg-gradient-to-br from-stone-50 to-neutral-50 dark:from-stone-900/20 dark:to-neutral-900/20 border-stone-200/50 dark:border-stone-800/30">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-foreground" />
                </div>
                <h3 className="text-2xl font-display font-bold">For Buyers</h3>
              </div>
              <div className="space-y-6">
                {howItWorksBuyer.map((step, i) => (
                  <div key={step.title} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        <step.icon className="w-4 h-4" />
                        {step.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/gallery">
                <Button data-testid="button-browse-gallery" variant="outline" className="mt-8 w-full">Browse the Gallery</Button>
              </Link>
            </Card>
          </div>
        </section>

        {/* AI Curation Explainer */}
        <section className="grid md:grid-cols-2 gap-12 items-center bg-card p-8 md:p-12 rounded-3xl border shadow-sm">
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
                  <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center text-xs">
                    <Award className="w-3 h-3" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
            <img 
              src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1000&auto=format&fit=crop" 
              alt="AI Art Analysis" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent mix-blend-overlay" />
          </div>
        </section>

        {/* Student Spotlight / Testimonials */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Student Spotlight</h2>
            <p className="text-muted-foreground text-lg">Hear from artists and collectors who are part of the BrushBids community.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.5 }}
              >
                <Card className="p-6 h-full flex flex-col">
                  <CardContent className="p-0 flex-1 flex flex-col">
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${testimonial.avatar}`} />
                        <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-xs text-muted-foreground">{testimonial.school} • {testimonial.role}</p>
                      </div>
                    </div>
                    <p className="text-muted-foreground italic flex-1">"{testimonial.quote}"</p>
                    <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                      {testimonial.sold && <span>{testimonial.sold} artworks sold</span>}
                      {testimonial.purchased && <span>{testimonial.purchased} artworks purchased</span>}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center py-16 px-8 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Ready to Join?</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
            Whether you're looking to sell your art or discover the next big talent, BrushBids is your platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/submit-artwork">
              <Button data-testid="button-submit-artwork-cta" size="lg" className="min-w-[200px]">Submit Your Artwork</Button>
            </Link>
            <Link href="/gallery">
              <Button data-testid="button-explore-gallery-cta" size="lg" variant="outline" className="min-w-[200px]">Explore Gallery</Button>
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </Layout>
  );
}
