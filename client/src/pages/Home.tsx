import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useArtworks } from "@/hooks/use-artworks";
import { ArrowRight, Sparkles, Upload, Palette, Eye, DollarSign, Heart, GraduationCap, Award, Users, Brush, Frame, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect, useCallback, useMemo } from "react";
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
  {
    id: 0,
    title: "Golden Reverie",
    artistName: "Aiden Brooks",
    imageUrl: "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 0,
    title: "Tidal Memory",
    artistName: "Nora Kim",
    imageUrl: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=800&auto=format&fit=crop",
  },
];

export default function Home() {
  const { data: artworks, isLoading } = useArtworks({ status: "approved" });
  const { isAuthenticated } = useAuth();

  const coverFlowArtworks = useMemo(() => {
    if (artworks && artworks.length >= 3) {
      return artworks.slice(0, 9).map(a => ({
        id: a.id,
        title: a.title,
        artistName: `Artist #${a.artistId}`,
        imageUrl: a.imageUrl || placeholderArtworks[0].imageUrl,
      }));
    }
    return placeholderArtworks;
  }, [artworks]);

  const [currentIndex, setCurrentIndex] = useState(0);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % coverFlowArtworks.length);
  }, [coverFlowArtworks.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + coverFlowArtworks.length) % coverFlowArtworks.length);
  }, [coverFlowArtworks.length]);

  useEffect(() => {
    const interval = setInterval(goNext, 6000);
    return () => clearInterval(interval);
  }, [goNext]);

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

  const stats = [
    { value: "500+", label: "Student Artists", icon: GraduationCap, color: "text-[#B8965A]", bg: "bg-[#B8965A]/10" },
    { value: "$125K", label: "Earned by Artists", icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { value: "$18K", label: "Donated to Charity", icon: Heart, color: "text-[#C9A84C]", bg: "bg-[#C9A84C]/10" },
    { value: "2,000+", label: "Artworks Sold", icon: Frame, color: "text-[#96A0AB]", bg: "bg-[#96A0AB]/10" },
  ];

  const currentArt = coverFlowArtworks[currentIndex];

  const getCoverFlowItems = () => {
    const total = coverFlowArtworks.length;
    const items: { artwork: typeof coverFlowArtworks[0]; offset: number }[] = [];
    for (let i = -3; i <= 3; i++) {
      const idx = ((currentIndex + i) % total + total) % total;
      items.push({ artwork: coverFlowArtworks[idx], offset: i });
    }
    return items;
  };

  return (
    <Layout>
      <div className="space-y-24 pb-16">
        {/* Hero Section */}
        <section className="relative py-12 md:py-20 overflow-hidden" data-testid="section-hero">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-[#F9F0EA] via-[#f0e6dc] to-[#e8ddd3] dark:from-[#2a2420] dark:via-[#1e1a17] dark:to-[#2a2420]" />
            <div className="absolute top-10 right-10 w-[400px] h-[400px] rounded-full bg-[#B8965A]/8 blur-[100px]" />
            <div className="absolute bottom-10 left-10 w-[300px] h-[300px] rounded-full bg-[#9E8472]/10 blur-[80px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#C9A84C]/5 blur-[120px]" />
            <svg className="absolute bottom-0 left-0 w-full opacity-[0.04] dark:opacity-[0.02]" viewBox="0 0 1200 200" preserveAspectRatio="none">
              <path d="M0,100 Q200,20 400,80 T800,60 T1200,100 L1200,200 L0,200 Z" fill="#4C392D" />
            </svg>
            <svg className="absolute top-0 right-0 w-64 h-64 opacity-[0.03] dark:opacity-[0.02]" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="80" stroke="#B8965A" strokeWidth="0.5" fill="none" />
              <circle cx="100" cy="100" r="60" stroke="#B8965A" strokeWidth="0.3" fill="none" />
              <circle cx="100" cy="100" r="40" stroke="#B8965A" strokeWidth="0.2" fill="none" />
            </svg>
          </div>

          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <span className="inline-flex items-center gap-2 text-sm font-medium px-4 py-1.5 rounded-full bg-[#B8965A]/10 text-[#B8965A] dark:text-[#C9A84C] mb-6">
                <Brush className="w-3.5 h-3.5" />
                Where Student Art Finds Its Audience
              </span>
            </motion.div>

            <motion.h1
              className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-[#4C392D] dark:text-foreground leading-[1.1] tracking-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              data-testid="text-hero-title"
            >
              Your Art.{" "}
              <span className="text-[#B8965A] dark:text-[#C9A84C]">Your Future.</span>
            </motion.h1>

            <motion.p
              className="text-base md:text-lg text-[#6b5c50] dark:text-muted-foreground leading-relaxed max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              data-testid="text-mission-statement"
            >
              BrushBids strives to provide student artists with the necessary resources and pathways towards selling their art to a global audience, allowing them to make their artistic dreams a reality.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              <Link href="/gallery">
                <Button data-testid="button-explore-gallery" size="lg" className="rounded-md bg-[#4C392D] text-white gap-2 px-8">
                  Explore Gallery <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/submit-artwork">
                <Button data-testid="button-submit-art-hero" size="lg" variant="outline" className="rounded-md gap-2 border-[#9E8472]/40 text-[#4C392D] dark:text-foreground px-8">
                  Submit Artwork <Upload className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Cover Flow Featured Works */}
        <section className="space-y-8" data-testid="section-featured-works">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sm font-medium text-[#B8965A] dark:text-[#C9A84C] uppercase tracking-wider">Curated Collection</span>
            <h2 className="text-3xl md:text-4xl font-display font-bold mt-2">Featured Works</h2>
          </motion.div>

          <div className="relative">
            {/* Cover Flow Container */}
            <div
              className="relative mx-auto overflow-hidden"
              style={{ height: "380px", perspective: "1200px" }}
              data-testid="cover-flow-container"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {getCoverFlowItems().map(({ artwork, offset }) => {
                  const isCenter = offset === 0;
                  const absOffset = Math.abs(offset);

                  const translateX = offset * 180;
                  const translateZ = isCenter ? 0 : -150 - absOffset * 40;
                  const rotateY = isCenter ? 0 : offset < 0 ? 45 : -45;
                  const scale = isCenter ? 1 : Math.max(0.5, 0.85 - absOffset * 0.1);
                  const zIndex = 10 - absOffset;
                  const opacity = absOffset > 2 ? 0.3 : 1;

                  return (
                    <motion.div
                      key={`${artwork.title}-${offset}`}
                      className="absolute cursor-pointer"
                      style={{
                        zIndex,
                        transformStyle: "preserve-3d",
                      }}
                      animate={{
                        x: translateX,
                        z: translateZ,
                        rotateY,
                        scale,
                        opacity,
                      }}
                      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                      onClick={() => {
                        if (offset < 0) goPrev();
                        else if (offset > 0) goNext();
                      }}
                    >
                      <div className="relative" style={{ transformStyle: "preserve-3d" }}>
                        {/* Artwork Cover */}
                        <div
                          className={cn(
                            "relative overflow-hidden rounded-md shadow-2xl",
                            isCenter ? "w-[240px] h-[240px] md:w-[280px] md:h-[280px]" : "w-[200px] h-[200px] md:w-[220px] md:h-[220px]"
                          )}
                          style={{
                            boxShadow: isCenter
                              ? "0 20px 60px rgba(76, 57, 45, 0.3), 0 8px 20px rgba(0,0,0,0.15)"
                              : "0 10px 30px rgba(0,0,0,0.2)",
                          }}
                        >
                          <img
                            src={artwork.imageUrl}
                            alt={artwork.title}
                            className="w-full h-full object-cover"
                            draggable={false}
                          />
                          {isCenter && (
                            <div className="absolute inset-0 ring-2 ring-[#B8965A]/30 rounded-md pointer-events-none" />
                          )}
                        </div>

                        {/* Reflection */}
                        <div
                          className={cn(
                            "relative overflow-hidden rounded-md mt-1",
                            isCenter ? "w-[240px] h-[80px] md:w-[280px] md:h-[90px]" : "w-[200px] h-[60px] md:w-[220px] md:h-[70px]"
                          )}
                          style={{
                            transform: "scaleY(-1)",
                            WebkitMaskImage: "linear-gradient(to top, transparent 0%, rgba(0,0,0,0.3) 100%)",
                            maskImage: "linear-gradient(to top, transparent 0%, rgba(0,0,0,0.3) 100%)",
                          }}
                        >
                          <img
                            src={artwork.imageUrl}
                            alt=""
                            className="w-full h-full object-cover object-bottom opacity-40"
                            draggable={false}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Current Artwork Title */}
            <div className="text-center mt-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-1"
                >
                  <h3 className="text-xl md:text-2xl font-display font-bold" data-testid="text-coverflow-title">
                    {currentArt.title}
                  </h3>
                  <p className="text-sm text-muted-foreground" data-testid="text-coverflow-artist">
                    by {currentArt.artistName}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-center gap-6 mt-6">
              <Button
                size="icon"
                variant="outline"
                onClick={goPrev}
                className="rounded-full border-[#9E8472]/30"
                data-testid="button-coverflow-prev"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>

              <div className="flex items-center gap-1.5">
                {coverFlowArtworks.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={cn(
                      "rounded-full transition-all duration-400",
                      i === currentIndex
                        ? "w-6 h-2 bg-[#B8965A]"
                        : "w-2 h-2 bg-[#DDDAD3] dark:bg-[#3a3530] hover:bg-[#A89D92]"
                    )}
                    data-testid={`coverflow-dot-${i}`}
                  />
                ))}
              </div>

              <Button
                size="icon"
                variant="outline"
                onClick={goNext}
                className="rounded-full border-[#9E8472]/30"
                data-testid="button-coverflow-next"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
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
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="relative overflow-visible p-8 h-full" style={{ background: "linear-gradient(to bottom right, rgba(185,150,90,0.08), rgba(185,150,90,0.15))", borderColor: "rgba(185,150,90,0.25)" }}>
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

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="relative overflow-visible p-8 h-full" style={{ background: "linear-gradient(to bottom right, rgba(168,174,181,0.08), rgba(168,174,181,0.15))", borderColor: "rgba(168,174,181,0.25)" }}>
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
                <p className={`text-2xl md:text-3xl font-display font-bold ${stat.color}`} data-testid={`text-stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </Card>
            </motion.div>
          ))}
        </section>

        {/* CTA Section */}
        <section className="text-center space-y-6 py-12" data-testid="section-cta">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold">Ready to Start Your Journey?</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Join a community of student artists and collectors making art accessible and impactful.
            </p>
          </motion.div>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link href="/submit-artwork">
              <Button size="lg" className="rounded-md bg-[#B8965A] text-white gap-2 px-8" data-testid="button-cta-submit">
                Submit Your Art <Upload className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/gallery">
              <Button size="lg" variant="outline" className="rounded-md gap-2 px-8" data-testid="button-cta-browse">
                Browse Gallery <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </section>
      </div>

      <Footer />
    </Layout>
  );
}
