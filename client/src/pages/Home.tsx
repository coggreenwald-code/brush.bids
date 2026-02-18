import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useArtworks } from "@/hooks/use-artworks";
import { ArrowRight, Sparkles, Upload, Palette, Eye, DollarSign, Heart, GraduationCap, Award, Users, Brush, Frame, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";

import heroImage from "@assets/Z-A18XdAxsiBvxgt_DavidHockney,PortraitofanArtist-PoolwithTwoF_1771370870284.avif";
import artSunset from "@assets/art-sunset-mountains.png";
import artPortrait from "@assets/art-abstract-portrait.png";
import artOcean from "@assets/art-ocean-watercolor.png";
import artGeometric from "@assets/art-geometric-abstract.png";
import artFloral from "@assets/art-floral-still-life.png";
import artCityscape from "@assets/art-urban-cityscape.png";
import artFlow from "@assets/art-abstract-flow.png";
import bgWatercolor from "@assets/bg-watercolor-warm.png";
import bgBrushstrokes from "@assets/bg-brushstrokes-gold.png";
import bgPaintSplatter from "@assets/bg-paint-splatter.png";


const placeholderArtworks = [
  { id: 0, title: "Ethereal Horizons", artistName: "Maya Rodriguez", imageUrl: artSunset },
  { id: 0, title: "Urban Fragments", artistName: "Liam Chen", imageUrl: artPortrait },
  { id: 0, title: "Silent Currents", artistName: "Sofia Patel", imageUrl: artOcean },
  { id: 0, title: "Chromatic Dreams", artistName: "Kai Williams", imageUrl: artGeometric },
  { id: 0, title: "Whispered Light", artistName: "Elena Torres", imageUrl: artFloral },
  { id: 0, title: "Golden Reverie", artistName: "Aiden Brooks", imageUrl: artCityscape },
  { id: 0, title: "Tidal Memory", artistName: "Nora Kim", imageUrl: artFlow },
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
        imageUrl: a.imageUrl || artSunset,
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

  const getCoverFlowItems = useCallback(() => {
    const total = coverFlowArtworks.length;
    const items: { artwork: typeof coverFlowArtworks[0]; offset: number; arrayIdx: number }[] = [];
    for (let i = -3; i <= 3; i++) {
      const idx = ((currentIndex + i) % total + total) % total;
      items.push({ artwork: coverFlowArtworks[idx], offset: i, arrayIdx: idx });
    }
    return items;
  }, [coverFlowArtworks, currentIndex]);

  const flowItems = getCoverFlowItems();

  return (
    <Layout>
      <div className="pb-16">
        {/* Hero Section */}
        <section className="relative -mt-4 md:-mt-8" style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }} data-testid="section-hero">
          <div className="relative w-full min-h-[520px] md:min-h-[600px] lg:min-h-[680px] overflow-hidden">
            <img
              src={heroImage}
              alt="David Hockney - Portrait of an Artist (Pool with Two Figures)"
              className="absolute inset-0 w-full h-full object-cover"
              data-testid="img-hero-background"
            />
            <div
              className="absolute inset-0 dark:opacity-90"
              style={{
                background: "linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.1) 70%, transparent 100%)",
              }}
            />
            <div
              className="absolute inset-0 dark:opacity-90"
              style={{
                background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 40%)",
              }}
            />

            <div className="relative z-10 h-full min-h-[520px] md:min-h-[600px] lg:min-h-[680px] flex items-end">
              <div className="max-w-2xl px-6 md:px-12 lg:px-16 pb-12 md:pb-16 space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7 }}
                >
                  <span className="inline-flex items-center gap-2 text-sm font-medium px-4 py-1.5 rounded-full bg-white/15 text-white/90 backdrop-blur-sm">
                    <Brush className="w-3.5 h-3.5" />
                    Turning Student Creativity Into Opportunity
                  </span>
                </motion.div>

                <motion.h1
                  className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white leading-[1.05] tracking-tight drop-shadow-lg"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.1 }}
                  data-testid="text-hero-title"
                >
                  Your Art.{" "}
                  <span className="text-[#E8C874]">Your Future.</span>
                </motion.h1>

                <motion.p
                  className="text-base md:text-lg text-white/80 leading-relaxed max-w-xl drop-shadow-md"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                  data-testid="text-mission-statement"
                >
                  BrushBids strives to provide student artists with the necessary resources and pathways towards selling their art to a global audience, allowing them to make their artistic dreams a reality.
                </motion.p>

                <motion.div
                  className="flex flex-col sm:flex-row gap-3 pt-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.3 }}
                >
                  <Link href="/gallery">
                    <Button data-testid="button-explore-gallery" size="lg" className="rounded-md bg-white text-[#4C392D] gap-2 px-8 border-white">
                      Explore Gallery <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href="/submit-artwork">
                    <Button data-testid="button-submit-art-hero" size="lg" variant="outline" className="rounded-md gap-2 border-white/40 text-white px-8 backdrop-blur-sm bg-white/10">
                      Submit Artwork <Upload className="w-4 h-4" />
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Cover Flow Featured Works — Full Width */}
        <section className="relative mt-20 md:mt-28 -mx-4 md:-mx-8" style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }} data-testid="section-featured-works">
          <div className="pb-8 md:pb-12">
            <motion.div
              className="text-left px-6 md:px-12 lg:px-16 mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-display font-semibold tracking-tight leading-[1.05]">Featured<br />Works</h2>
            </motion.div>

            <div className="relative select-none">
              <div
                className="relative mx-auto"
                style={{
                  height: "500px",
                  perspective: "1400px",
                  perspectiveOrigin: "50% 38%",
                  overflow: "hidden",
                }}
                data-testid="cover-flow-container"
              >
                <div
                  className="absolute bottom-0 left-0 right-0 h-[35%] pointer-events-none"
                  style={{
                    background: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.01) 50%, rgba(0,0,0,0.035) 100%)",
                  }}
                />

                <div className="absolute inset-0 flex items-start justify-center" style={{ paddingTop: "10px" }}>
                  {flowItems.map(({ artwork, offset, arrayIdx }) => {
                    const isCenter = offset === 0;
                    const absOffset = Math.abs(offset);
                    const side = offset < 0 ? -1 : offset > 0 ? 1 : 0;

                    const coverSize = isCenter ? 340 : 260;
                    const centerGap = 220;
                    const stackSpacing = 110;
                    const translateX = isCenter ? 0 : side * (centerGap + (absOffset - 1) * stackSpacing);
                    const rotateY = isCenter ? 0 : side * -45;
                    const translateZ = isCenter ? 120 : -(absOffset * 30);
                    const zIndex = 20 - absOffset;
                    const itemOpacity = absOffset >= 3 ? 0.25 : absOffset === 2 ? 0.6 : 1;

                    return (
                      <div
                        key={`flow-${arrayIdx}`}
                        className="absolute cursor-pointer"
                        style={{
                          zIndex,
                          transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg)`,
                          transition: "transform 0.6s cubic-bezier(0.25, 0.1, 0.25, 1), opacity 0.5s ease",
                          transformStyle: "preserve-3d",
                          opacity: itemOpacity,
                          willChange: "transform, opacity",
                        }}
                        onClick={() => {
                          if (offset < 0) goPrev();
                          else if (offset > 0) goNext();
                        }}
                      >
                        <div
                          className="relative overflow-hidden"
                          style={{
                            width: `${coverSize}px`,
                            height: `${coverSize}px`,
                            borderRadius: "4px",
                            boxShadow: isCenter
                              ? "0 12px 40px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.15)"
                              : `${side * -4}px 4px 16px rgba(0,0,0,0.2)`,
                          }}
                        >
                          <img
                            src={artwork.imageUrl}
                            alt={artwork.title}
                            className="w-full h-full object-cover"
                            draggable={false}
                            loading="lazy"
                          />
                          {isCenter && (
                            <div
                              className="absolute inset-0 pointer-events-none"
                              style={{
                                background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%)",
                                borderRadius: "4px",
                              }}
                            />
                          )}
                        </div>

                        <div
                          className="overflow-hidden pointer-events-none"
                          style={{
                            width: `${coverSize}px`,
                            height: `${coverSize * 0.22}px`,
                            marginTop: "1px",
                            transform: "scaleY(-1)",
                            WebkitMaskImage: "linear-gradient(to top, transparent 20%, rgba(0,0,0,0.18) 100%)",
                            maskImage: "linear-gradient(to top, transparent 20%, rgba(0,0,0,0.18) 100%)",
                            opacity: isCenter ? 0.25 : 0.12,
                          }}
                        >
                          <img
                            src={artwork.imageUrl}
                            alt=""
                            className="w-full object-cover object-bottom"
                            style={{ height: `${coverSize}px` }}
                            draggable={false}
                            loading="lazy"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="text-center -mt-2">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-0.5"
                  >
                    <h3 className="text-xl md:text-2xl font-display font-bold tracking-tight" data-testid="text-coverflow-title">
                      {currentArt.title}
                    </h3>
                    <p className="text-sm text-muted-foreground tracking-wide" data-testid="text-coverflow-artist">
                      by {currentArt.artistName}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-center gap-6 mt-4">
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
                        "rounded-full transition-all duration-300",
                        i === currentIndex
                          ? "w-6 h-2 bg-[#B8965A]"
                          : "w-2 h-2 bg-[#DDDAD3] dark:bg-[#3a3530]"
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
          </div>
        </section>

        {/* How It Works — Centered with decorative background */}
        <section className="relative mt-0 -mx-4 md:-mx-8 overflow-hidden" style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }} data-testid="section-how-it-works">
          <div className="absolute inset-0 pointer-events-none">
            <img src={bgWatercolor} alt="" className="w-full h-full object-cover opacity-[0.15] dark:opacity-[0.06]" />
          </div>
          <div className="relative z-10 px-6 md:px-12 lg:px-16 py-20 md:py-28">
            <motion.div
              className="text-center mb-12 md:mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-sm md:text-base font-medium text-muted-foreground uppercase tracking-[0.25em]">Simple Process</span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-sans font-semibold tracking-tight mt-2">How It Works</h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-16 md:gap-20 max-w-5xl mx-auto">
              <motion.div
                className="flex flex-col"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5 }}
              >
                <div className="mb-8 border-b border-[#e0d6cd] dark:border-border pb-4">
                  <span className="text-xs font-medium text-[#B8965A] dark:text-[#C9A84C] uppercase tracking-[0.2em]">Artists</span>
                  <h3 className="text-xl md:text-2xl font-sans font-semibold mt-2">Start selling your work</h3>
                </div>
                <div className="space-y-4 flex-1">
                  {howItWorksArtist.map((step, i) => (
                    <motion.div
                      key={step.title}
                      className="flex gap-5 items-start rounded-md p-4 -mx-4 transition-colors md:hover:bg-[#B8965A]/[0.06] md:dark:hover:bg-[#C9A84C]/[0.08] cursor-default"
                      whileHover={{ scale: 1.03, y: -2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      style={{ transformOrigin: "left center" }}
                      data-testid={`step-artist-${i}`}
                    >
                      <span className="flex-shrink-0 text-2xl font-display font-bold text-[#B8965A]/50 dark:text-[#C9A84C]/50 leading-none pt-0.5 tabular-nums">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <h4 className="font-bold text-sm uppercase tracking-wide">{step.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{step.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <Link href="/submit-artwork">
                  <Button data-testid="button-start-selling" className="mt-10 rounded-md bg-[#4C392D] text-white px-8 uppercase tracking-wider text-xs" size="lg">Start Selling</Button>
                </Link>
              </motion.div>

              <motion.div
                className="flex flex-col"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="mb-8 border-b border-[#e0d6cd] dark:border-border pb-4">
                  <span className="text-xs font-medium text-[#96A0AB] dark:text-[#A8AEB5] uppercase tracking-[0.2em]">Collectors</span>
                  <h3 className="text-xl md:text-2xl font-sans font-semibold mt-2">Discover emerging talent</h3>
                </div>
                <div className="space-y-4 flex-1">
                  {howItWorksBuyer.map((step, i) => (
                    <motion.div
                      key={step.title}
                      className="flex gap-5 items-start rounded-md p-4 -mx-4 transition-colors md:hover:bg-[#96A0AB]/[0.06] md:dark:hover:bg-[#A8AEB5]/[0.08] cursor-default"
                      whileHover={{ scale: 1.03, y: -2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      style={{ transformOrigin: "left center" }}
                      data-testid={`step-collector-${i}`}
                    >
                      <span className="flex-shrink-0 text-2xl font-display font-bold text-[#96A0AB]/50 dark:text-[#A8AEB5]/50 leading-none pt-0.5 tabular-nums">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <h4 className="font-bold text-sm uppercase tracking-wide">{step.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{step.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <Link href="/gallery">
                  <Button data-testid="button-browse-gallery" variant="outline" className="mt-10 rounded-md px-8 uppercase tracking-wider text-xs" size="lg">Browse Gallery</Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats — with decorative background */}
        <section className="relative mt-0 -mx-4 md:-mx-8 overflow-hidden" style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }} data-testid="section-stats">
          <div className="absolute inset-0 pointer-events-none">
            <img src={bgBrushstrokes} alt="" className="w-full h-full object-cover opacity-[0.12] dark:opacity-[0.05]" />
          </div>
          <div className="relative z-10 px-6 md:px-12 lg:px-16 py-20 md:py-28">
            <motion.div
              className="mb-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-5xl md:text-7xl lg:text-8xl font-sans font-semibold tracking-tight leading-[0.95]">Our<br />Impact</h2>
            </motion.div>
            <div className="border-t border-[#e0d6cd] dark:border-border pt-10 md:pt-14">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                {stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: 0.08 * i, duration: 0.4 }}
                  >
                    <p className="text-3xl md:text-4xl font-display font-bold" data-testid={`text-stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                      {stat.value}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2 tracking-wide uppercase">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA — with decorative background */}
        <section className="relative mt-0 mb-8 -mx-4 md:-mx-8 overflow-hidden" style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }} data-testid="section-cta">
          <div className="absolute inset-0 pointer-events-none">
            <img src={bgPaintSplatter} alt="" className="w-full h-full object-cover opacity-[0.1] dark:opacity-[0.04]" />
          </div>
          <div className="relative z-10 px-6 md:px-12 lg:px-16 py-20 md:py-28">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
              className="text-right max-w-3xl ml-auto"
            >
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight leading-[1.05]">Ready to Start<br />Your Journey?</h2>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed mt-4 max-w-lg ml-auto">
                Join a community of student artists and collectors making art accessible and impactful.
              </p>
              <div className="flex flex-wrap gap-4 justify-end mt-8">
                <Link href="/submit-artwork">
                  <Button size="lg" className="rounded-md bg-[#4C392D] text-white gap-2 px-8 uppercase tracking-wider text-xs" data-testid="button-cta-submit">
                    Submit Your Art <Upload className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/gallery">
                  <Button size="lg" variant="outline" className="rounded-md gap-2 px-8 uppercase tracking-wider text-xs" data-testid="button-cta-browse">
                    Browse Gallery <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </div>

      <Footer />
    </Layout>
  );
}
