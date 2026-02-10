import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useArtworks } from "@/hooks/use-artworks";
import { ArtworkCard } from "@/components/ArtworkCard";
import { ArrowRight, Sparkles, Upload, Palette, Eye, DollarSign, Heart, GraduationCap, Award, Users, Brush, Frame, LogIn } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";

export default function Home() {
  const { data: artworks, isLoading } = useArtworks({ status: "approved" });
  const { isAuthenticated } = useAuth();

  const featuredArtworks = artworks?.slice(0, 3) || [];

  const howItWorksArtist = [
    { icon: Upload, title: "Submit Your Art", description: "Upload your artwork with a description and set your starting price." },
    { icon: Sparkles, title: "Expert Review", description: "Our curators review your submission for quality, supported by advanced tools trained by art professionals." },
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

  return (
    <Layout>
      {/* Fixed Sign In Button - Top Right */}
      {!isAuthenticated && (
        <div className="fixed top-4 right-4 z-50 md:top-6 md:right-6">
          <Button 
            onClick={() => window.location.href = "/api/login"}
            className="bg-[#4C392D] text-white shadow-lg gap-2 rounded-full px-6"
            data-testid="button-fixed-sign-in"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </Button>
        </div>
      )}

      <div className="space-y-24 pb-16">
        {/* Hero Section - Rich Gradient */}
        <section 
          className="relative rounded-3xl overflow-hidden text-white py-28 px-6 md:px-12"
          style={{ background: "linear-gradient(135deg, #4C392D 0%, #6B5244 30%, #9E8472 60%, #B8965A 85%, #C9A84C 100%)" }}
        >
          {/* Artistic background elements */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-10 right-10 w-64 h-64 bg-[#C9A84C]/10 blob-shape" />
            <div className="absolute bottom-20 left-20 w-48 h-48 bg-[#A8AEB5]/12 blob-shape" style={{ animationDelay: '-4s' }} />
            <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-[#9E8472]/10 blob-shape" style={{ animationDelay: '-2s' }} />
            <div className="absolute top-20 left-1/2 w-40 h-40 bg-[#B8965A]/8 blob-shape" style={{ animationDelay: '-6s' }} />
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
              The premier marketplace for emerging student artists. 
              Expert curation supported by technology ensures only the best work reaches collectors.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <Link href="/gallery">
                <Button data-testid="button-start-bidding" size="lg" className="h-14 px-10 text-lg rounded-full bg-white text-[#4C392D] font-semibold shadow-lg shadow-black/20">
                  Explore Gallery <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/submit-artwork">
                <Button data-testid="button-submit-art-hero" size="lg" variant="outline" className="h-14 px-10 text-lg rounded-full border-white/30 text-white backdrop-blur font-semibold">
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

        {/* How It Works - Modern Cards */}
        <section className="space-y-12">
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
            {/* For Artists - Warm Gold Tones */}
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
                    <motion.div 
                      className="w-12 h-12 rounded-xl bg-[#B8965A] flex items-center justify-center"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <GraduationCap className="w-6 h-6 text-white" />
                    </motion.div>
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
                    <Button data-testid="button-start-selling" className="mt-8 w-full rounded-full bg-[#B8965A] text-white" size="lg">Start Selling Your Art</Button>
                  </Link>
                </div>
              </Card>
            </motion.div>

            {/* For Buyers - Coral/Rose Tones */}
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
                    <motion.div 
                      className="w-12 h-12 rounded-xl bg-[#96A0AB] flex items-center justify-center"
                      whileHover={{ scale: 1.1, rotate: -5 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <Users className="w-6 h-6 text-white" />
                    </motion.div>
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
                    <Button data-testid="button-browse-gallery" variant="outline" className="mt-8 w-full rounded-full border-[#96A0AB]/30 text-[#96A0AB] dark:text-[#A8AEB5]" size="lg">Browse the Gallery</Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Expert Curation Explainer - Artistic Layout */}
        <motion.section 
          className="relative overflow-hidden"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <div className="absolute inset-0 watercolor-bg rounded-3xl" />
          <div className="absolute inset-0 rounded-3xl" style={{ background: "radial-gradient(ellipse at 30% 40%, rgba(185,150,90,0.06) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(185,150,90,0.06) 0%, transparent 50%)" }} />
          <div className="relative grid md:grid-cols-2 gap-12 items-center bg-card/50 backdrop-blur-sm p-8 md:p-12 rounded-3xl border">
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <motion.div 
                className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full bg-[#C9A84C]/10 text-[#B8965A] dark:text-[#C9A84C]"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <Award className="w-4 h-4" />
                Expert Curation
              </motion.div>
              <h2 className="text-3xl md:text-4xl font-display font-bold">
                Curated by 
                <span className="italic text-[#B8965A] dark:text-[#C9A84C]"> Experts</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Every submission is carefully reviewed by our team of experienced curators. They use advanced tools trained by art professionals to evaluate technique, composition, and originality — ensuring only the highest quality student work reaches the marketplace.
              </p>
              <ul className="space-y-4">
                {[
                  { label: 'Choose Your Review Style', desc: 'Get instant feedback or opt for a detailed human review' },
                  { label: 'Curator-Verified Quality', desc: 'Every piece approved by experienced art professionals' },
                  { label: 'Professional Standards', desc: 'Consistent evaluation criteria across all submissions' },
                ].map((item, i) => (
                  <motion.li 
                    key={item.label} 
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                  >
                    <motion.div 
                      className="w-8 h-8 rounded-full bg-[#C9A84C]/10 text-[#B8965A] dark:text-[#C9A84C] flex items-center justify-center flex-shrink-0 mt-0.5"
                      whileHover={{ scale: 1.2, rotate: 10 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <Award className="w-4 h-4" />
                    </motion.div>
                    <div>
                      <span className="font-medium">{item.label}</span>
                      <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            <motion.div 
              className="relative"
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 2 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3, type: "spring" }}
            >
              <div className="absolute -inset-4 rounded-3xl blur-2xl" style={{ background: "linear-gradient(to bottom right, rgba(185,150,90,0.2), rgba(185,150,90,0.2))" }} />
              <motion.div 
                className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-gray-800"
                whileHover={{ rotate: 0, scale: 1.02 }}
                transition={{ duration: 0.5 }}
              >
                <img 
                  src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1000&auto=format&fit=crop" 
                  alt="Expert Art Curation" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 mix-blend-overlay" style={{ background: "linear-gradient(to top right, rgba(185,150,90,0.3), transparent)" }} />
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        {/* Featured Section - Gallery Grid Style */}
        <section className="space-y-8">
          <motion.div 
            className="flex items-end justify-between gap-4"
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
              <Button data-testid="button-view-gallery" variant="outline" className="hidden md:flex rounded-full">
                View All <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-[400px] bg-muted animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : featuredArtworks.length === 0 ? (
            <motion.div 
              className="text-center py-20 border-2 border-dashed rounded-3xl bg-muted/10 watercolor-bg"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <motion.div 
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#C9A84C]/10 flex items-center justify-center"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
              >
                <Palette className="w-10 h-10 text-[#B8965A]" />
              </motion.div>
              <h3 className="text-2xl font-display font-bold mb-3">No artworks yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">Be the first to showcase your creativity and start your journey as a selling artist.</p>
              <Link href="/submit-artwork">
                <Button data-testid="button-submit-first" size="lg" className="rounded-full">Submit Your Art</Button>
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredArtworks.map((artwork, i) => (
                <motion.div
                  key={artwork.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                >
                  <ArtworkCard artwork={artwork} />
                </motion.div>
              ))}
            </div>
          )}
          
          <motion.div 
            className="flex justify-center md:hidden"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link href="/gallery">
              <Button data-testid="button-view-gallery-mobile" variant="outline" className="rounded-full">
                View All Gallery <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </section>

        {/* Stats Bar - Modern Glass Cards with Warm Colors */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, i) => (
            <motion.div 
              key={stat.label}
              className="relative group"
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: 0.1 * i, duration: 0.5, type: "spring" }}
            >
              <Card className="text-center p-6 hover-artistic border-2 border-transparent bg-card/80 backdrop-blur-sm">
                <motion.div 
                  className={`w-12 h-12 mx-auto mb-3 rounded-xl ${stat.bg} flex items-center justify-center`}
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </motion.div>
                <motion.div 
                  className="text-3xl md:text-4xl font-display font-bold text-foreground"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </Card>
            </motion.div>
          ))}
        </section>

        {/* Student Spotlight / Testimonials */}
        <section className="space-y-10">
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
                <Card className="p-6 h-full flex flex-col hover-artistic group" style={{ background: i === 0 ? "linear-gradient(to bottom right, rgba(185,150,90,0.04), rgba(185,150,90,0.08))" : i === 1 ? "linear-gradient(to bottom right, rgba(168,174,181,0.04), rgba(168,174,181,0.08))" : "linear-gradient(to bottom right, rgba(201,168,76,0.04), rgba(201,168,76,0.08))" }}>
                  <CardContent className="p-0 flex-1 flex flex-col">
                    <div className="flex items-center gap-4 mb-4">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <Avatar className={`w-14 h-14 border-2 ${i === 0 ? 'border-[#B8965A]/30 group-hover:border-[#B8965A]/50' : i === 1 ? 'border-[#96A0AB]/30 group-hover:border-[#96A0AB]/50' : 'border-[#C9A84C]/30 group-hover:border-[#C9A84C]/50'} transition-colors`}>
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${testimonial.avatar}`} />
                          <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </motion.div>
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-xs text-muted-foreground">{testimonial.school}</p>
                        <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${i === 0 ? 'bg-[#B8965A]/10 text-[#B8965A] dark:text-[#C9A84C]' : i === 1 ? 'bg-[#96A0AB]/10 text-[#96A0AB] dark:text-[#A8AEB5]' : 'bg-[#C9A84C]/10 text-[#C9A84C] dark:text-[#C9A84C]'}`}>
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

        {/* CTA Section - Warm Gradient */}
        <motion.section 
          className="relative overflow-hidden text-center py-20 px-8 rounded-3xl text-white"
          style={{ background: "linear-gradient(135deg, #4C392D 0%, #6B5244 50%, #9E8472 100%)" }}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
        >
          {/* Artistic background */}
          <div className="absolute inset-0">
            <motion.div 
              className="absolute top-10 left-10 w-32 h-32 bg-[#C9A84C]/10 blob-shape"
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div 
              className="absolute bottom-10 right-10 w-48 h-48 bg-[#A8AEB5]/12 blob-shape"
              animate={{ scale: [1, 1.15, 1], rotate: [0, -5, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
            <motion.div 
              className="absolute top-1/2 left-1/2 w-36 h-36 bg-[#9E8472]/8 blob-shape"
              animate={{ scale: [1, 1.08, 1], rotate: [0, 3, 0] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            />
          </div>
          
          <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" viewBox="0 0 1200 400">
            <path d="M0,200 Q300,100 600,200 T1200,200" fill="none" stroke="currentColor" strokeWidth="60" strokeLinecap="round" />
          </svg>
          
          <div className="relative z-10">
            <motion.h2 
              className="text-3xl md:text-5xl font-display font-bold mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Ready to <span className="italic text-white">Create Your Legacy?</span>
            </motion.h2>
            <motion.p 
              className="text-white/80 text-lg max-w-xl mx-auto mb-10"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              Whether you're looking to sell your art or discover the next big talent, BrushBids is your platform.
            </motion.p>
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Link href="/submit-artwork">
                <Button data-testid="button-submit-artwork-cta" size="lg" className="min-w-[220px] h-14 text-lg rounded-full bg-white text-[#4C392D] font-semibold">
                  Submit Your Artwork
                </Button>
              </Link>
              <Link href="/gallery">
                <Button data-testid="button-explore-gallery-cta" size="lg" variant="outline" className="min-w-[220px] h-14 text-lg rounded-full border-white/30 text-white font-semibold">
                  Explore Gallery
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.section>
      </div>

      <Footer />
    </Layout>
  );
}
