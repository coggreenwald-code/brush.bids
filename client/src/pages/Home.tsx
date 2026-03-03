import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useArtworks } from "@/hooks/use-artworks";
import { ArrowRight, Sparkles, Upload, Palette, Eye, DollarSign, Heart, GraduationCap, Award, Users, Frame, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";

import heroImage from "@assets/Z-A18XdAxsiBvxgt_DavidHockney,PortraitofanArtist-PoolwithTwoF_1771370870284.avif";
import brushBidsLogo from "@assets/BrushBids_Logo_1769695882555.png";
import artSunset from "@assets/art-sunset-mountains.png";
import artPortrait from "@assets/art-abstract-portrait.png";
import artOcean from "@assets/art-ocean-watercolor.png";
import artGeometric from "@assets/art-geometric-abstract.png";
import artFloral from "@assets/art-floral-still-life.png";
import artCityscape from "@assets/art-urban-cityscape.png";
import artFlow from "@assets/art-abstract-flow.png";


const placeholderArtworks = [
  { id: 0, title: "Ethereal Horizons", artistName: "Maya Rodriguez", imageUrl: artSunset },
  { id: 0, title: "Urban Fragments", artistName: "Liam Chen", imageUrl: artPortrait },
  { id: 0, title: "Silent Currents", artistName: "Sofia Patel", imageUrl: artOcean },
  { id: 0, title: "Chromatic Dreams", artistName: "Kai Williams", imageUrl: artGeometric },
  { id: 0, title: "Whispered Light", artistName: "Elena Torres", imageUrl: artFloral },
  { id: 0, title: "Golden Reverie", artistName: "Aiden Brooks", imageUrl: artCityscape },
  { id: 0, title: "Tidal Memory", artistName: "Nora Kim", imageUrl: artFlow },
];

function parseStatValue(value: string): { prefix: string; number: number; suffix: string } {
  const match = value.match(/^([^0-9]*)([0-9,]+(?:\.\d+)?)(.*)$/);
  if (!match) return { prefix: "", number: 0, suffix: value };
  return {
    prefix: match[1],
    number: parseFloat(match[2].replace(/,/g, "")),
    suffix: match[3],
  };
}

function CountUpNumber({ value, duration = 2000 }: { value: string; duration?: number }) {
  const { prefix, number, suffix } = parseStatValue(value);
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const startTime = performance.now();
          const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * number));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasAnimated, number, duration]);

  const formatted = count >= 1000 ? count.toLocaleString() : count.toString();
  return <span ref={ref}>{prefix}{formatted}{suffix}</span>;
}

function TestimonialSlider() {
  const testimonials = [
    { quote: "BrushBids gave me my first real audience. I sold three pieces in my first week!", name: "Maya R.", role: "Student Artist, NYU" },
    { quote: "The curation process is incredible. Every piece in the gallery feels handpicked.", name: "James L.", role: "Art Collector" },
    { quote: "I love that a portion goes to charity. It makes collecting feel even more meaningful.", name: "Sarah K.", role: "Collector & Patron" },
    { quote: "As a student, having a professional platform to showcase my work has been life-changing.", name: "David C.", role: "Student Artist, RISD" },
  ];
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((p) => (p + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <div className="max-w-3xl mx-auto text-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <p className="text-2xl md:text-3xl font-display italic text-white/90 leading-relaxed" data-testid={`text-testimonial-${current}`}>
            "{testimonials[current].quote}"
          </p>
          <div>
            <p className="text-[#F472B6] font-semibold">{testimonials[current].name}</p>
            <p className="text-white/40 text-sm">{testimonials[current].role}</p>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="flex justify-center gap-2 mt-8">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={cn(
              "rounded-full transition-all duration-300",
              i === current ? "w-8 h-2 bg-[#A78BFA]" : "w-2 h-2 bg-white/20 hover:bg-white/40"
            )}
            data-testid={`testimonial-dot-${i}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const { data: artworks, isLoading } = useArtworks({ status: "approved", sortBy: "views" });
  const { isAuthenticated } = useAuth();
  const [hasPointer, setHasPointer] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    setHasPointer(mq.matches);
    const handler = (e: MediaQueryListEvent) => setHasPointer(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const coverFlowArtworks = useMemo(() => {
    if (artworks && artworks.length >= 3) {
      return artworks.slice(0, 12).map(a => ({
        id: a.id,
        title: a.title,
        artistName: (a as any).artist?.firstName && (a as any).artist?.lastName ? `${(a as any).artist.firstName} ${(a as any).artist.lastName}` : a.artistId,
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
    { value: "500+", label: "Student Artists", icon: GraduationCap },
    { value: "$125K", label: "Earned by Artists", icon: DollarSign },
    { value: "$18K", label: "Donated to Charity", icon: Heart },
    { value: "2,000+", label: "Artworks Sold", icon: Frame },
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
      <div>
        {/* Hero Section */}
        <section className="relative -mt-16" style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }} data-testid="section-hero">
          <div className="relative w-full min-h-[600px] md:min-h-[700px] lg:min-h-[800px] overflow-hidden">
            <img
              src={heroImage}
              alt="David Hockney - Portrait of an Artist (Pool with Two Figures)"
              className="absolute inset-0 w-full h-full object-cover"
              data-testid="img-hero-background"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(10,10,15,0.85) 0%, rgba(10,10,15,0.5) 40%, rgba(10,10,15,0.2) 70%, transparent 100%)" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,10,15,1) 0%, rgba(10,10,15,0.3) 30%, transparent 60%)" }} />

            <div className="relative z-10 h-full min-h-[600px] md:min-h-[700px] lg:min-h-[800px] flex items-end">
              <div className="max-w-3xl px-6 md:px-12 lg:px-16 pb-20 md:pb-28 space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7 }}
                >
                  <span className="inline-flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-full bg-white/10 text-white/80 backdrop-blur-sm border border-white/10 uppercase tracking-widest">
                    <img src={brushBidsLogo} alt="BrushBids" className="w-4 h-4 object-contain" style={{ filter: "invert(1) brightness(2)" }} />
                    Turning Student Creativity Into Opportunity
                  </span>
                </motion.div>

                <motion.h1
                  className="text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-[1.0] tracking-tight"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.1 }}
                  data-testid="text-hero-title"
                >
                  Your Art.{" "}
                  <span className="text-[#A78BFA]">Your Future.</span>
                </motion.h1>

                <motion.p
                  className="text-lg md:text-xl text-white/60 leading-relaxed max-w-xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                  data-testid="text-mission-statement"
                >
                  BrushBids strives to provide student artists with the necessary resources and pathways towards selling their art to a global audience.
                </motion.p>

                <motion.div
                  className="flex flex-col sm:flex-row gap-3 pt-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.3 }}
                >
                  <Link href="/gallery">
                    <Button data-testid="button-explore-gallery" size="lg" className="rounded-full bg-white text-[#0a0a0f] gap-2 px-8 font-semibold hover:bg-white/90">
                      Explore Gallery <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href="/submit-artwork">
                    <Button data-testid="button-submit-art-hero" size="lg" variant="outline" className="rounded-full gap-2 border-white/20 text-white px-8 hover:bg-white/10 bg-transparent">
                      Submit Artwork <Upload className="w-4 h-4" />
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Cover Flow Featured Works */}
        <section className="relative" style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }} data-testid="section-featured-works">
          <div className="relative z-10 pt-16 md:pt-24 pb-0">
            <motion.div
              className="text-left px-6 md:px-12 lg:px-16 mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-xs font-medium text-[#A78BFA] uppercase tracking-[0.3em] mb-3 block">Curated Collection</span>
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">Featured<br />Works</h2>
            </motion.div>

            <div className="relative select-none">
              <div
                className="relative mx-auto overflow-hidden"
                style={{
                  height: "500px",
                  perspective: "1400px",
                  perspectiveOrigin: "50% 38%",
                }}
                data-testid="cover-flow-container"
              >
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
                              ? "0 12px 40px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3)"
                              : `${side * -4}px 4px 16px rgba(0,0,0,0.4)`,
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

              <div className="absolute bottom-[90px] left-0 z-20 px-6 md:px-12 lg:px-16 text-left hidden md:block" style={{ maxWidth: "calc(50% - 190px)" }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-0.5"
                  >
                    <h3 className="text-lg md:text-xl lg:text-2xl font-display font-bold tracking-tight italic text-white" data-testid="text-coverflow-title">
                      {currentArt.title}
                    </h3>
                    <p className="text-white/50 tracking-wide text-[17px] font-semibold text-left" data-testid="text-coverflow-artist">
                      By {currentArt.artistName}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="md:hidden absolute bottom-[70px] left-0 right-0 z-20 text-center px-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`mobile-${currentIndex}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-0.5 mt-6"
                  >
                    <h3 className="text-base font-display font-bold tracking-tight italic text-white" data-testid="text-coverflow-title-mobile">
                      {currentArt.title}
                    </h3>
                    <p className="text-white/50 tracking-wide text-sm font-semibold" data-testid="text-coverflow-artist-mobile">
                      {currentArt.artistName}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="absolute bottom-[24px] left-0 right-0 flex items-center justify-center gap-6 z-20">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={goPrev}
                  className="rounded-full border-white/20 text-white hover:bg-white/10 bg-transparent"
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
                          ? "w-6 h-2 bg-[#A78BFA]"
                          : "w-2 h-2 bg-white/20"
                      )}
                      data-testid={`coverflow-dot-${i}`}
                    />
                  ))}
                </div>

                <Button
                  size="icon"
                  variant="outline"
                  onClick={goNext}
                  className="rounded-full border-white/20 text-white hover:bg-white/10 bg-transparent"
                  data-testid="button-coverflow-next"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="relative py-24 md:py-32" style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }} data-testid="section-how-it-works">
          <div className="absolute inset-0 bg-mesh-purple section-tint-purple" />
          <div className="geometric-lines" />
          <div className="floating-orb gradient-orb-purple w-[300px] h-[300px] -top-20 -right-20 animate-float-slow opacity-40" />
          <div className="floating-orb gradient-orb-blue w-[250px] h-[250px] -bottom-16 -left-16 animate-float-reverse opacity-30" />
          <div className="watermark-text" style={{ top: "-20px" }}>Process</div>
          <div className="relative z-10 px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
            <div className="section-outlined p-8 md:p-12 lg:p-16">
              <div className="mb-16 relative z-10">
                <span className="text-xs font-medium text-[#A78BFA] uppercase tracking-[0.3em] mb-3 block">Simple Process</span>
              </div>

              <div className="grid md:grid-cols-2 gap-16 md:gap-20 max-w-5xl mx-auto relative z-10">
                <motion.div
                  className="flex flex-col"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="mb-8 border-b border-white/10 pb-4">
                    <span className="text-xs font-medium text-[#A78BFA] uppercase tracking-[0.2em]">Artists</span>
                    <h3 className="text-xl md:text-2xl font-semibold mt-2 text-white">Start selling your work</h3>
                  </div>
                  <div className="space-y-2 flex-1">
                    {howItWorksArtist.map((step, i) => (
                      <motion.div
                        key={step.title}
                        className="flex gap-5 items-start rounded-lg p-4 -mx-4 transition-colors hover:bg-white/5 cursor-default"
                        whileHover={hasPointer ? { x: 4 } : undefined}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        data-testid={`step-artist-${i}`}
                      >
                        <span className="flex-shrink-0 text-2xl font-bold text-[#A78BFA]/30 leading-none pt-0.5 tabular-nums">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div>
                          <h4 className="font-semibold text-base text-white uppercase tracking-wide">{step.title}</h4>
                          <p className="text-sm text-white/50 mt-1 leading-relaxed">{step.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <Link href="/submit-artwork">
                    <Button data-testid="button-start-selling" className="mt-10 rounded-full bg-white text-[#0a0a0f] px-8 font-semibold hover:bg-white/90" size="lg">Start Selling</Button>
                  </Link>
                </motion.div>

                <motion.div
                  className="flex flex-col"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <div className="mb-8 border-b border-white/10 pb-4">
                    <span className="text-xs font-medium text-[#60A5FA] uppercase tracking-[0.2em]">Collectors</span>
                    <h3 className="text-xl md:text-2xl font-semibold mt-2 text-white">Discover emerging talent</h3>
                  </div>
                  <div className="space-y-2 flex-1">
                    {howItWorksBuyer.map((step, i) => (
                      <motion.div
                        key={step.title}
                        className="flex gap-5 items-start rounded-lg p-4 -mx-4 transition-colors hover:bg-white/5 cursor-default"
                        whileHover={hasPointer ? { x: 4 } : undefined}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        data-testid={`step-collector-${i}`}
                      >
                        <span className="flex-shrink-0 text-2xl font-bold text-[#60A5FA]/20 leading-none pt-0.5 tabular-nums">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div>
                          <h4 className="font-semibold text-base text-white uppercase tracking-wide">{step.title}</h4>
                          <p className="text-sm text-white/50 mt-1 leading-relaxed">{step.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <Link href="/gallery">
                    <Button data-testid="button-browse-gallery" variant="outline" className="mt-10 rounded-full px-8 border-white/20 text-white hover:bg-white/10 bg-transparent font-semibold" size="lg">Browse Gallery</Button>
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="relative py-24 md:py-32" style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }} data-testid="section-stats">
          <div className="absolute inset-0 bg-mesh-blue section-tint-blue bg-dots" />
          <div className="floating-orb gradient-orb-blue w-[280px] h-[280px] -top-16 -left-20 animate-float-slow opacity-35" />
          <div className="floating-orb gradient-orb-pink w-[220px] h-[220px] -bottom-12 -right-16 animate-float-reverse opacity-30" />
          <div className="watermark-text">Impact</div>
          <div className="relative z-10 px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
            <div className="section-outlined p-8 md:p-12 lg:p-16">
              <div className="mb-12 relative z-10">
                <span className="text-xs font-medium text-[#60A5FA] uppercase tracking-[0.3em] mb-3 block">By The Numbers</span>
              </div>
              <div className="divider-line mb-12 relative z-10" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 relative z-10">
                {stats.map((stat, i) => {
                  const statColors = ["#A78BFA", "#34D399", "#F472B6", "#60A5FA"];
                  const color = statColors[i % statColors.length];
                  return (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ delay: 0.08 * i, duration: 0.4 }}
                      className="rounded-xl p-6 border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-default"
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: `${color}15`, borderColor: `${color}30`, borderWidth: '1px' }}>
                        <stat.icon className="w-5 h-5" style={{ color }} />
                      </div>
                      <p className="text-3xl md:text-4xl font-bold tabular-nums text-white" data-testid={`text-stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                        <CountUpNumber value={stat.value} />
                      </p>
                      <p className="text-sm text-white/40 mt-2 tracking-wide uppercase">{stat.label}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="relative py-24 md:py-32" style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }} data-testid="section-testimonials">
          <div className="absolute inset-0 bg-mesh-mixed section-tint-mixed" />
          <div className="floating-orb gradient-orb-pink w-[260px] h-[260px] top-0 left-1/2 -translate-x-1/2 animate-float opacity-25" />
          <div className="floating-orb-sm gradient-orb-purple w-[180px] h-[180px] -bottom-10 left-10 animate-float-reverse opacity-25" />
          <div className="watermark-text">Testimonials</div>
          <div className="relative z-10 px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
            <div className="section-outlined p-8 md:p-12 lg:p-16">
              <div className="mb-12 relative z-10">
                <span className="text-xs font-medium text-[#F472B6] uppercase tracking-[0.3em] mb-3 block">Community</span>
              </div>
              <div className="relative z-10">
                <TestimonialSlider />
              </div>
            </div>
          </div>
        </section>

        {/* Revenue Split */}
        <section className="relative py-24 md:py-32" style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }} data-testid="section-revenue-split">
          <div className="absolute inset-0 bg-mesh-purple bg-grid-fine" />
          <div className="floating-orb gradient-orb-emerald w-[240px] h-[240px] -top-16 -right-16 animate-float-slow opacity-30" />
          <div className="floating-orb gradient-orb-purple w-[200px] h-[200px] -bottom-12 -left-12 animate-float-reverse opacity-25" />
          <div className="watermark-text">Transparency</div>
          <div className="relative z-10 px-6 md:px-12 lg:px-16 max-w-5xl mx-auto">
            <div className="section-outlined p-8 md:p-12 lg:p-16">
              <motion.div
                className="text-center mb-16 relative z-10"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <span className="text-xs font-medium text-[#A78BFA] uppercase tracking-[0.3em] mb-3 block">Transparent Pricing</span>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Where Your Money Goes</h2>
                <p className="text-white/50 mt-4 max-w-xl mx-auto">Every sale is split transparently between the artist, the platform, and a charity of the artist's choice.</p>
              </motion.div>
              <div className="grid md:grid-cols-3 gap-6 relative z-10">
                {[
                  { pct: "75%", label: "Artist", desc: "Goes directly to the student artist", color: "#A78BFA" },
                  { pct: "15%", label: "Platform", desc: "Supports BrushBids operations", color: "#60A5FA" },
                  { pct: "10%", label: "Charity", desc: "Donated to a cause the artist chooses", color: "#34D399" },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * i, duration: 0.4 }}
                    className="rounded-xl border border-white/5 bg-white/[0.02] p-8 text-center hover:border-white/10 transition-colors"
                    data-testid={`revenue-split-${item.label.toLowerCase()}`}
                  >
                    <p className="text-5xl md:text-6xl font-bold mb-2" style={{ color: item.color }}>{item.pct}</p>
                    <p className="text-white font-semibold text-lg mb-1">{item.label}</p>
                    <p className="text-white/40 text-sm">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative py-24 md:py-32" style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }} data-testid="section-cta">
          <div className="absolute inset-0 bg-mesh-mixed" />
          <div className="floating-orb gradient-orb-purple w-[280px] h-[280px] -top-16 -right-20 animate-float-slow opacity-35" />
          <div className="floating-orb gradient-orb-blue w-[220px] h-[220px] -bottom-12 -left-16 animate-float-reverse opacity-30" />
          <div className="watermark-text">Journey</div>
          <div className="relative z-10 px-6 md:px-12 lg:px-16 max-w-5xl mx-auto">
            <div className="section-outlined p-8 md:p-12 lg:p-16">
              <div className="relative z-10 flex items-center justify-center">
                <div className="max-w-2xl space-y-6 text-center">
                <motion.h2
                  className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.05] tracking-tight"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.7 }}
                  data-testid="text-cta-title"
                >
                  Ready to Start<br />Your Journey?
                </motion.h2>

                <motion.p
                  className="text-white/60 text-base md:text-lg leading-relaxed max-w-lg mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.7, delay: 0.1 }}
                >
                  Join a community of student artists and collectors making art accessible and impactful.
                </motion.p>

                <motion.div
                  className="flex flex-wrap gap-4 justify-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                >
                  <Link href="/submit-artwork">
                    <Button size="lg" className="rounded-full bg-white text-[#0a0a0f] gap-2 px-8 font-semibold hover:bg-white/90" data-testid="button-cta-submit">
                      Submit Your Art <Upload className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href="/gallery">
                    <Button size="lg" variant="outline" className="rounded-full gap-2 px-8 border-white/20 text-white hover:bg-white/10 bg-transparent" data-testid="button-cta-browse">
                      Browse Gallery <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </motion.div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </Layout>
  );
}
