import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useArtworks } from "@/hooks/use-artworks";
import { ArrowRight, Sparkles, Upload, Palette, Eye, DollarSign, Heart, GraduationCap, Award, Users, Brush, Frame } from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

const placeholderArtworks = [
  {
    id: 0,
    title: "Ethereal Horizons",
    artistName: "Maya Rodriguez",
    imageUrl: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 0,
    title: "Urban Fragments",
    artistName: "Liam Chen",
    imageUrl: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 0,
    title: "Silent Currents",
    artistName: "Sofia Patel",
    imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb39279c0f?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 0,
    title: "Chromatic Dreams",
    artistName: "Kai Williams",
    imageUrl: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 0,
    title: "Whispered Light",
    artistName: "Elena Torres",
    imageUrl: "https://images.unsplash.com/photo-1549887534-1541e9326642?q=80&w=800&auto=format&fit=crop",
  },
];

export default function Home() {
  const { data: artworks, isLoading } = useArtworks({ status: "approved" });
  const { isAuthenticated } = useAuth();

  const wheelArtworks = artworks && artworks.length >= 3
    ? artworks.slice(0, 8).map(a => ({
        id: a.id,
        title: a.title,
        artistName: `Artist #${a.artistId}`,
        imageUrl: a.imageUrl || placeholderArtworks[0].imageUrl,
      }))
    : placeholderArtworks;

  const [currentIndex, setCurrentIndex] = useState(0);

  const nextArtwork = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % wheelArtworks.length);
  }, [wheelArtworks.length]);

  useEffect(() => {
    const interval = setInterval(nextArtwork, 10000);
    return () => clearInterval(interval);
  }, [nextArtwork]);

  const featuredArtworks = artworks?.slice(0, 6) || [];

  const howItWorksArtist = [
    { icon: Upload, title: "Submit Your Art", description: "Upload your artwork with a description and set your starting price." },
    { icon: Sparkles, title: "Expert Review", description: "Our curators review your submission for quality, supported by advanced tools trained by art professionals." },
    { icon: DollarSign, title: "Get Paid", description: "Immediately get paid when your art sells." },
    { icon: Heart, title: "Give Back", description: "A portion of the sale goes to your chosen charity, making a positive impact." },
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
      quote: "BrushBids gave me my first real art sale. The curator feedback actually helped me improve my technique!",
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
    { value: "500+", label: "Student Artists", icon: GraduationCap, color: "text-[#B8965A]", bg: "bg-[#B8965A]/10" },
    { value: "$125K", label: "Earned by Artists", icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { value: "$18K", label: "Donated to Charity", icon: Heart, color: "text-[#C9A84C]", bg: "bg-[#C9A84C]/10" },
    { value: "2,000+", label: "Artworks Sold", icon: Frame, color: "text-[#96A0AB]", bg: "bg-[#96A0AB]/10" },
  ];

  const currentArt = wheelArtworks[currentIndex];
  const prevIndex = (currentIndex - 1 + wheelArtworks.length) % wheelArtworks.length;
  const nextIndex = (currentIndex + 1) % wheelArtworks.length;

  return (
    <Layout>
      <div className="space-y-24 pb-16">
        {/* iPod-Style Artwork Wheel Hero */}
        <section className="relative py-8 md:py-16" data-testid="section-hero">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
            {/* Artwork Wheel - Left Side */}
            <div className="relative flex-shrink-0 w-full md:w-auto flex justify-center">
              <div className="relative">
                {/* Outer Ring / Wheel */}
                <div className="relative w-[320px] h-[320px] md:w-[420px] md:h-[420px] rounded-full bg-gradient-to-br from-[#DDDAD3] via-[#e8e2dc] to-[#d4cec7] dark:from-[#3a3530] dark:via-[#2e2a26] dark:to-[#3a3530] shadow-2xl flex items-center justify-center" data-testid="artwork-wheel">
                  {/* Inner track marks like iPod wheel */}
                  <div className="absolute inset-3 rounded-full border border-[#c5beb6] dark:border-[#4a4540]" />
                  <div className="absolute inset-6 rounded-full border border-[#d0c9c1] dark:border-[#3e3935] border-dashed opacity-50" />
                  
                  {/* Navigation dots around the wheel */}
                  {wheelArtworks.map((_, i) => {
                    const angle = (i * 360) / wheelArtworks.length - 90;
                    const radius = 145;
                    const mdRadius = 193;
                    const x = Math.cos((angle * Math.PI) / 180);
                    const y = Math.sin((angle * Math.PI) / 180);
                    const isActive = i === currentIndex;
                    return (
                      <button
                        key={i}
                        className={cn(
                          "absolute w-3 h-3 rounded-full transition-all duration-500 z-10",
                          isActive ? "bg-[#B8965A] scale-125 shadow-lg shadow-[#B8965A]/30" : "bg-[#A89D92]/40 hover:bg-[#A89D92]/70"
                        )}
                        style={{
                          left: `calc(50% + ${x * radius}px - 6px)`,
                          top: `calc(50% + ${y * radius}px - 6px)`,
                        }}
                        onClick={() => setCurrentIndex(i)}
                        data-testid={`wheel-dot-${i}`}
                      />
                    );
                  })}
                  
                  {/* Center Artwork Display */}
                  <div className="relative w-[200px] h-[200px] md:w-[280px] md:h-[280px] rounded-full overflow-hidden shadow-inner border-4 border-white/50 dark:border-white/10">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={currentIndex}
                        src={currentArt.imageUrl}
                        alt={currentArt.title}
                        className="w-full h-full object-cover"
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        data-testid="img-current-artwork"
                      />
                    </AnimatePresence>
                    <div className="absolute inset-0 rounded-full shadow-[inset_0_0_30px_rgba(0,0,0,0.15)] pointer-events-none" />
                  </div>
                </div>

                {/* Subtle reflection below wheel */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[200px] h-[30px] bg-gradient-to-b from-[#4C392D]/5 to-transparent rounded-full blur-xl" />
              </div>
            </div>

            {/* Artwork Info - Right Side */}
            <div className="flex-1 text-center md:text-left space-y-6 max-w-lg">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full bg-[#B8965A]/10 text-[#B8965A] dark:text-[#C9A84C] mb-4">
                  <Brush className="w-3.5 h-3.5" />
                  Now Showing
                </span>
              </motion.div>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="space-y-3"
                >
                  <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground leading-tight" data-testid="text-artwork-title">
                    {currentArt.title}
                  </h1>
                  <p className="text-lg md:text-xl text-[#9E8472] dark:text-[#A89D92] font-medium" data-testid="text-artist-name">
                    by {currentArt.artistName}
                  </p>
                </motion.div>
              </AnimatePresence>

              <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                The premier marketplace for emerging student artists. Expert curation supported by technology ensures only the best work reaches collectors.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start pt-2">
                <Link href="/gallery">
                  <Button data-testid="button-explore-gallery" size="lg" className="rounded-md bg-[#4C392D] text-white gap-2">
                    Explore Gallery <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/submit-artwork">
                  <Button data-testid="button-submit-art-hero" size="lg" variant="outline" className="rounded-md gap-2 border-[#9E8472]/30 text-[#4C392D] dark:text-foreground">
                    Submit Artwork <Upload className="w-4 h-4" />
                  </Button>
                </Link>
              </div>

              {/* Wheel progress bar */}
              <div className="flex items-center gap-2 pt-4">
                {wheelArtworks.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={cn(
                      "h-1 rounded-full transition-all duration-500",
                      i === currentIndex ? "w-8 bg-[#B8965A]" : "w-2 bg-[#DDDAD3] dark:bg-[#3a3530] hover:bg-[#A89D92]"
                    )}
                    data-testid={`progress-dot-${i}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How It Works - Modern Cards */}
        <section className="space-y-12" data-testid="section-how-it-works">
          <motion.div 
            className="text-center max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sm font-medium text-[#B8965A] dark:text-[#C9A84C] uppercase tracking-wider">Simple Process</span>
            <h2 className="text-3xl md:text-4xl font-display font-bold mt-2 mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">Whether you're a student artist or an art enthusiast, getting started is simple.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* For Artists */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="relative overflow-hidden p-8 h-full" style={{ background: "linear-gradient(to bottom right, rgba(185,150,90,0.08), rgba(185,150,90,0.15))", borderColor: "rgba(185,150,90,0.25)" }}>
                <div className="absolute top-0 right-0 w-40 h-40 bg-[#C9A84C]/10 blob-shape -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-[#B8965A] flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-display font-bold">For Artists</h3>
                      <p className="text-sm text-muted-foreground">Start selling your work</p>
                    </div>
                  </div>
                  <div className="space-y-5">
                    {howItWorksArtist.map((step, i) => (
                      <motion.div 
                        key={step.title} 
                        className="flex gap-4 items-start"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#B8965A] text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-[#B8965A]/30">
                          {i + 1}
                        </div>
                        <div className="pt-0.5">
                          <h4 className="font-semibold flex items-center gap-2">
                            <step.icon className="w-4 h-4 text-[#B8965A] dark:text-[#C9A84C]" />
                            {step.title}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <Link href="/submit-artwork">
                    <Button data-testid="button-start-selling" className="mt-8 w-full rounded-md bg-[#B8965A] text-white" size="lg">Start Selling Your Art</Button>
                  </Link>
                </div>
              </Card>
            </motion.div>

            {/* For Collectors */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="relative overflow-hidden p-8 h-full" style={{ background: "linear-gradient(to bottom right, rgba(168,174,181,0.08), rgba(168,174,181,0.15))", borderColor: "rgba(168,174,181,0.25)" }}>
                <div className="absolute top-0 right-0 w-40 h-40 bg-[#A8AEB5]/10 blob-shape -translate-y-1/2 translate-x-1/2" style={{ animationDelay: '-3s' }} />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-[#96A0AB] flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-display font-bold">For Collectors</h3>
                      <p className="text-sm text-muted-foreground">Discover emerging talent</p>
                    </div>
                  </div>
                  <div className="space-y-5">
                    {howItWorksBuyer.map((step, i) => (
                      <motion.div 
                        key={step.title} 
                        className="flex gap-4 items-start"
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#96A0AB] text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-[#96A0AB]/30">
                          {i + 1}
                        </div>
                        <div className="pt-0.5">
                          <h4 className="font-semibold flex items-center gap-2">
                            <step.icon className="w-4 h-4 text-[#96A0AB] dark:text-[#A8AEB5]" />
                            {step.title}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <Link href="/gallery">
                    <Button data-testid="button-browse-gallery" variant="outline" className="mt-8 w-full rounded-md border-[#96A0AB]/30 text-[#96A0AB] dark:text-[#A8AEB5]" size="lg">Browse the Gallery</Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Featured Artworks - Large imagery, NO prices/bids/timers */}
        <section className="space-y-8" data-testid="section-featured">
          <motion.div 
            className="flex items-end justify-between gap-4 flex-wrap"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <div>
              <span className="text-sm font-medium text-[#B8965A] dark:text-[#C9A84C] uppercase tracking-wider">Curated Collection</span>
              <h2 className="text-3xl md:text-4xl font-display font-bold mt-2">Featured Works</h2>
              <p className="text-muted-foreground mt-2 max-w-lg">Hand-picked by our expert curators for exceptional quality and creativity</p>
            </div>
            <Link href="/gallery">
              <Button data-testid="button-view-gallery" variant="outline" className="hidden md:flex rounded-md gap-2">
                View All <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-[350px] bg-muted animate-pulse rounded-md" />
              ))}
            </div>
          ) : featuredArtworks.length === 0 ? (
            <motion.div 
              className="text-center py-20 border-2 border-dashed rounded-md bg-muted/10"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#C9A84C]/10 flex items-center justify-center">
                <Palette className="w-10 h-10 text-[#B8965A]" />
              </div>
              <h3 className="text-2xl font-display font-bold mb-3">No artworks yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">Be the first to showcase your creativity and start your journey as a selling artist.</p>
              <Link href="/submit-artwork">
                <Button data-testid="button-submit-first" size="lg" className="rounded-md">Submit Your Art</Button>
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredArtworks.map((artwork, i) => (
                <motion.div
                  key={artwork.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <Link href={`/artwork/${artwork.id}`}>
                    <Card className="overflow-hidden cursor-pointer group border shadow-sm hover:shadow-lg transition-all duration-300 bg-card" data-testid={`card-featured-${artwork.id}`}>
                      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                        <img 
                          src={artwork.imageUrl || "https://images.unsplash.com/photo-1579783902614-a3fb39279c0f?q=80&w=800&auto=format&fit=crop"} 
                          alt={artwork.title} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                          <p className="text-white text-sm font-medium">View artwork</p>
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="font-display text-lg font-semibold line-clamp-1 group-hover:text-[#B8965A] transition-colors">
                          {artwork.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          by <span className="font-medium text-foreground/80">Artist #{artwork.artistId}</span>
                        </p>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          <div className="flex justify-center md:hidden">
            <Link href="/gallery">
              <Button data-testid="button-view-gallery-mobile" variant="outline" className="rounded-md gap-2">
                View All Gallery <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6" data-testid="section-stats">
          {stats.map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: 0.1 * i, duration: 0.5, type: "spring" }}
            >
              <Card className="text-center p-6 border bg-card">
                <div className={`w-12 h-12 mx-auto mb-3 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="text-3xl md:text-4xl font-display font-bold text-foreground">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </Card>
            </motion.div>
          ))}
        </section>

        {/* Testimonials */}
        <section className="space-y-10" data-testid="section-testimonials">
          <motion.div 
            className="text-center max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sm font-medium text-[#96A0AB] dark:text-[#A8AEB5] uppercase tracking-wider">Community Stories</span>
            <h2 className="text-3xl md:text-4xl font-display font-bold mt-2 mb-4">Student Spotlight</h2>
            <p className="text-muted-foreground text-lg">Hear from artists and collectors who are part of the BrushBids community.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: 0.15 * i, duration: 0.6, type: "spring" }}
              >
                <Card className="p-6 h-full flex flex-col border" style={{ background: i === 0 ? "linear-gradient(to bottom right, rgba(185,150,90,0.04), rgba(185,150,90,0.08))" : i === 1 ? "linear-gradient(to bottom right, rgba(168,174,181,0.04), rgba(168,174,181,0.08))" : "linear-gradient(to bottom right, rgba(201,168,76,0.04), rgba(201,168,76,0.08))" }}>
                  <CardContent className="p-0 flex-1 flex flex-col">
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className={`w-14 h-14 border-2 ${i === 0 ? 'border-[#B8965A]/30' : i === 1 ? 'border-[#96A0AB]/30' : 'border-[#C9A84C]/30'}`}>
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${testimonial.avatar}`} />
                        <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-xs text-muted-foreground">{testimonial.school}</p>
                        <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${i === 0 ? 'bg-[#B8965A]/10 text-[#B8965A] dark:text-[#C9A84C]' : i === 1 ? 'bg-[#96A0AB]/10 text-[#96A0AB] dark:text-[#A8AEB5]' : 'bg-[#C9A84C]/10 text-[#C9A84C]'}`}>
                          {testimonial.role}
                        </span>
                      </div>
                    </div>
                    <p className="text-muted-foreground leading-relaxed flex-1 font-display italic text-lg">"{testimonial.quote}"</p>
                    <div className="mt-4 pt-4 border-t text-sm text-muted-foreground flex items-center gap-2">
                      {testimonial.sold && (
                        <>
                          <Palette className={`w-4 h-4 ${i === 0 ? 'text-[#B8965A]' : 'text-[#96A0AB]'}`} />
                          <span>{testimonial.sold} artworks sold</span>
                        </>
                      )}
                      {testimonial.purchased && (
                        <>
                          <Frame className="w-4 h-4 text-[#C9A84C]" />
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

        {/* CTA Section */}
        <motion.section 
          className="relative overflow-hidden text-center py-20 px-8 rounded-md"
          style={{ background: "linear-gradient(135deg, #4C392D 0%, #6B5244 50%, #9E8472 100%)" }}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          data-testid="section-cta"
        >
          <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" viewBox="0 0 1200 400">
            <path d="M0,200 Q300,100 600,200 T1200,200" fill="none" stroke="white" strokeWidth="60" strokeLinecap="round" />
          </svg>
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-6 text-white">
              Ready to <span className="italic text-white">Create Your Legacy?</span>
            </h2>
            <p className="text-white/80 text-lg max-w-xl mx-auto mb-10">
              Whether you're looking to sell your art or discover the next big talent, BrushBids is your platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/submit-artwork">
                <Button data-testid="button-submit-artwork-cta" size="lg" className="min-w-[220px] h-14 text-lg rounded-md bg-white text-[#4C392D] font-semibold">
                  Submit Your Artwork
                </Button>
              </Link>
              <Link href="/gallery">
                <Button data-testid="button-explore-gallery-cta" size="lg" variant="outline" className="min-w-[220px] h-14 text-lg rounded-md border-white/30 text-white font-semibold">
                  Explore Gallery
                </Button>
              </Link>
            </div>
          </div>
        </motion.section>
      </div>

      <Footer />
    </Layout>
  );
}

