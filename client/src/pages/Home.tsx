import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useArtworks } from "@/hooks/use-artworks";
import { ArtworkCard } from "@/components/ArtworkCard";
import { ArrowRight, Sparkles, Upload, Palette, Eye, DollarSign, Heart, GraduationCap, Award, Users, Brush, Frame } from "lucide-react";
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
    { value: "500+", label: "Student Artists", icon: GraduationCap },
    { value: "$125K", label: "Earned by Artists", icon: DollarSign },
    { value: "$18K", label: "Donated to Charity", icon: Heart },
    { value: "2,000+", label: "Artworks Sold", icon: Frame },
  ];

  return (
    <Layout>
      <div className="space-y-24 pb-16">
        {/* Hero Section - Modern & Artistic */}
        <section className="relative rounded-3xl overflow-hidden bg-[#1F4959] text-white py-28 px-6 md:px-12">
          {/* Artistic background elements */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-10 right-10 w-64 h-64 bg-white/5 blob-shape" />
            <div className="absolute bottom-20 left-20 w-48 h-48 bg-[#5C7C89]/20 blob-shape" style={{ animationDelay: '-4s' }} />
            <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-white/5 blob-shape" style={{ animationDelay: '-2s' }} />
          </div>
          
          {/* Brush stroke decorations */}
          <svg className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" viewBox="0 0 1200 600">
            <path d="M0,200 Q300,100 600,200 T1200,200" fill="none" stroke="currentColor" strokeWidth="80" strokeLinecap="round" />
            <path d="M0,400 Q400,500 800,400 T1200,450" fill="none" stroke="currentColor" strokeWidth="40" strokeLinecap="round" />
          </svg>
          
          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <span className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-6">
                <Brush className="w-4 h-4" />
                Where creativity meets opportunity
              </span>
              <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight tracking-tight text-white">
                Turning student creativity
                <span className="block mt-2 italic">into opportunity.</span>
              </h1>
            </motion.div>
            
            <motion.p 
              className="text-lg md:text-xl text-white max-w-2xl mx-auto leading-relaxed font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              The premier AI-curated marketplace for emerging student artists. 
              Every purchase supports both the artist and a cause they care about.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <Link href="/gallery">
                <Button data-testid="button-start-bidding" size="lg" className="h-14 px-10 text-lg rounded-full bg-white text-[#1F4959] hover:bg-white/90 font-semibold shadow-lg shadow-black/20">
                  Explore Gallery <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/submit-artwork">
                <Button data-testid="button-submit-art-hero" size="lg" variant="outline" className="h-14 px-10 text-lg rounded-full border-white/30 text-white hover:bg-white/10 hover:text-white backdrop-blur font-semibold">
                  Submit Artwork <Upload className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
          
          {/* Decorative bottom wave */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1200 120" className="w-full h-12 fill-background">
              <path d="M0,60 C200,100 400,20 600,60 C800,100 1000,20 1200,60 L1200,120 L0,120 Z" />
            </svg>
          </div>
        </section>

        {/* Stats Bar - Modern Glass Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 -mt-8">
          {stats.map((stat, i) => (
            <motion.div 
              key={stat.label}
              className="relative group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.5 }}
            >
              <Card className="text-center p-6 hover-artistic border-2 border-transparent hover:border-primary/20 bg-card/80 backdrop-blur-sm">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-3xl md:text-4xl font-display font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </Card>
            </motion.div>
          ))}
        </section>

        {/* Featured Section - Gallery Grid Style */}
        <section className="space-y-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="text-sm font-medium text-primary uppercase tracking-wider">Curated Collection</span>
              <h2 className="text-3xl md:text-4xl font-display font-bold mt-2">Featured Works</h2>
              <p className="text-muted-foreground mt-2 max-w-lg">Hand-picked by our AI curation engine for exceptional quality and creativity</p>
            </div>
            <Link href="/gallery">
              <Button data-testid="button-view-gallery" variant="outline" className="hidden md:flex rounded-full">
                View All <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-[400px] bg-muted animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : featuredArtworks.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed rounded-3xl bg-muted/10 watercolor-bg">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Palette className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-display font-bold mb-3">No artworks yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">Be the first to showcase your creativity and start your journey as a selling artist.</p>
              <Link href="/submit-artwork">
                <Button data-testid="button-submit-first" size="lg" className="rounded-full">Submit Your Art</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredArtworks.map((artwork) => (
                <ArtworkCard key={artwork.id} artwork={artwork} />
              ))}
            </div>
          )}
          
          <div className="flex justify-center md:hidden">
            <Link href="/gallery">
              <Button data-testid="button-view-gallery-mobile" variant="outline" className="rounded-full">
                View All Gallery <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>

        {/* How It Works - Modern Cards */}
        <section className="space-y-12">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-sm font-medium text-primary uppercase tracking-wider">Simple Process</span>
            <h2 className="text-3xl md:text-4xl font-display font-bold mt-2 mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">Whether you're a student artist or an art enthusiast, getting started is simple.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* For Artists */}
            <Card className="relative overflow-hidden p-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 blob-shape -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-display font-bold">For Artists</h3>
                    <p className="text-sm text-muted-foreground">Start selling your work</p>
                  </div>
                </div>
                <div className="space-y-5">
                  {howItWorksArtist.map((step, i) => (
                    <div key={step.title} className="flex gap-4 items-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-primary/30">
                        {i + 1}
                      </div>
                      <div className="pt-0.5">
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
                  <Button data-testid="button-start-selling" className="mt-8 w-full rounded-full" size="lg">Start Selling Your Art</Button>
                </Link>
              </div>
            </Card>

            {/* For Buyers */}
            <Card className="relative overflow-hidden p-8 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
              <div className="absolute top-0 right-0 w-40 h-40 bg-accent/5 blob-shape -translate-y-1/2 translate-x-1/2" style={{ animationDelay: '-3s' }} />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-display font-bold">For Collectors</h3>
                    <p className="text-sm text-muted-foreground">Discover emerging talent</p>
                  </div>
                </div>
                <div className="space-y-5">
                  {howItWorksBuyer.map((step, i) => (
                    <div key={step.title} className="flex gap-4 items-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-accent/30">
                        {i + 1}
                      </div>
                      <div className="pt-0.5">
                        <h4 className="font-semibold flex items-center gap-2">
                          <step.icon className="w-4 h-4 text-accent" />
                          {step.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/gallery">
                  <Button data-testid="button-browse-gallery" variant="outline" className="mt-8 w-full rounded-full" size="lg">Browse the Gallery</Button>
                </Link>
              </div>
            </Card>
          </div>
        </section>

        {/* AI Curation Explainer - Artistic Layout */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 watercolor-bg rounded-3xl" />
          <div className="relative grid md:grid-cols-2 gap-12 items-center bg-card/50 backdrop-blur-sm p-8 md:p-12 rounded-3xl border">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full bg-primary/10 text-primary">
                <Sparkles className="w-4 h-4" />
                AI-Powered
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-bold">
                Curated by 
                <span className="italic text-[#1F4959]"> Intelligence</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Every submission is analyzed by our advanced AI curators. They evaluate technique, composition, and originality to ensure only the highest quality student work reaches the marketplace.
              </p>
              <ul className="space-y-4">
                {['Instant Feedback for Artists', 'Quality Assurance for Buyers', 'Fair & Unbiased Selection'].map((item) => (
                  <li key={item} className="flex items-center gap-3 font-medium">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <Award className="w-4 h-4" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-2xl" />
              <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500 border-4 border-white dark:border-gray-800">
                <img 
                  src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1000&auto=format&fit=crop" 
                  alt="AI Art Analysis" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-transparent mix-blend-overlay" />
              </div>
            </div>
          </div>
        </section>

        {/* Student Spotlight / Testimonials */}
        <section className="space-y-10">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-sm font-medium text-primary uppercase tracking-wider">Community Stories</span>
            <h2 className="text-3xl md:text-4xl font-display font-bold mt-2 mb-4">Student Spotlight</h2>
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
                <Card className="p-6 h-full flex flex-col hover-artistic group">
                  <CardContent className="p-0 flex-1 flex flex-col">
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="w-14 h-14 border-2 border-primary/20 group-hover:border-primary/40 transition-colors">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${testimonial.avatar}`} />
                        <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-xs text-muted-foreground">{testimonial.school}</p>
                        <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {testimonial.role}
                        </span>
                      </div>
                    </div>
                    <p className="text-muted-foreground leading-relaxed flex-1 font-display italic text-lg">"{testimonial.quote}"</p>
                    <div className="mt-4 pt-4 border-t text-sm text-muted-foreground flex items-center gap-2">
                      {testimonial.sold && (
                        <>
                          <Palette className="w-4 h-4 text-primary" />
                          <span>{testimonial.sold} artworks sold</span>
                        </>
                      )}
                      {testimonial.purchased && (
                        <>
                          <Frame className="w-4 h-4 text-primary" />
                          <span>{testimonial.purchased} artworks purchased</span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section - Artistic Final Touch */}
        <section className="relative overflow-hidden text-center py-20 px-8 rounded-3xl bg-[#1F4959] text-white">
          {/* Artistic background */}
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-32 h-32 bg-white/5 blob-shape" />
            <div className="absolute bottom-10 right-10 w-48 h-48 bg-[#5C7C89]/20 blob-shape" style={{ animationDelay: '-3s' }} />
          </div>
          
          <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" viewBox="0 0 1200 400">
            <path d="M0,200 Q300,100 600,200 T1200,200" fill="none" stroke="currentColor" strokeWidth="60" strokeLinecap="round" />
          </svg>
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
              Ready to <span className="italic text-white">Create Your Legacy?</span>
            </h2>
            <p className="text-white/80 text-lg max-w-xl mx-auto mb-10">
              Whether you're looking to sell your art or discover the next big talent, BrushBids is your platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/submit-artwork">
                <Button data-testid="button-submit-artwork-cta" size="lg" className="min-w-[220px] h-14 text-lg rounded-full bg-white text-[#1F4959] hover:bg-white/90 font-semibold">
                  Submit Your Artwork
                </Button>
              </Link>
              <Link href="/gallery">
                <Button data-testid="button-explore-gallery-cta" size="lg" variant="outline" className="min-w-[220px] h-14 text-lg rounded-full border-white/30 text-white hover:bg-white/10 hover:text-white font-semibold">
                  Explore Gallery
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </Layout>
  );
}
