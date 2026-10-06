import { Layout } from "@/components/Layout";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { ARTIST_PERCENT, PLATFORM_PERCENT, CHARITY_PERCENT } from "@shared/siteConfig";
import { Heart, Users, Award, TrendingUp, Sparkles, GraduationCap, Palette } from "lucide-react";

const values = [
  {
    icon: Heart,
    title: "Supporting Artists",
    description: "We believe every student artist deserves a platform to showcase their work and earn recognition.",
    iconColor: "text-[#F472B6]",
  },
  {
    icon: Award,
    title: "Quality First",
    description: "Our expert curation ensures only the highest quality work reaches collectors, maintaining trust on both sides.",
    iconColor: "text-[#A78BFA]",
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "We're building a community where artists, collectors, and charities come together for a common good.",
    iconColor: "text-[#60A5FA]",
  },
  {
    icon: TrendingUp,
    title: "Fair Compensation",
    description: `Artists receive ${ARTIST_PERCENT}% of every sale, ensuring they're fully compensated for their creative work.`,
    iconColor: "text-[#34D399]",
  },
];

const revenueSplits = [
  { percent: ARTIST_PERCENT, label: "Artist", sublabel: "Goes directly to the creator", color: "#A78BFA" },
  { percent: PLATFORM_PERCENT, label: "BrushBids", sublabel: "Platform & operations", color: "#60A5FA" },
  { percent: CHARITY_PERCENT, label: "Charity", sublabel: "Artist's chosen cause", color: "#34D399" },
];

export default function About() {
  return (
    <Layout>
      <SEOHead title="About BrushBids | Student Art Marketplace" description={`BrushBids is a student art marketplace founded by Charles Greenwald at The Dwight School, New York. ${ARTIST_PERCENT}% of every sale goes to the artist and ${CHARITY_PERCENT}% to charity.`} />
      <div className="pb-0">
        <section
          aria-label="About BrushBids"
          className="hero-gradient relative py-24 md:py-36 text-center"
          style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }}
          data-testid="section-about-hero"
        >
          <div className="max-w-3xl mx-auto px-6 space-y-6">
            <span className="text-xs font-medium text-[#A78BFA] uppercase tracking-[0.3em]" data-testid="label-about">
              About Us
            </span>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white leading-tight">
              Art Without <span className="gradient-text">Gatekeepers</span>
            </h1>
            <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
              BrushBids connects emerging student artists with collectors who appreciate authentic, fresh creativity — while giving back to causes that matter.
            </p>
          </div>
        </section>

        <section
          aria-label="Our Story"
          className="py-20 md:py-28 relative bg-mesh-purple"
          style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }}
          data-testid="section-about-story"
        >
          <div className="watermark-text" aria-hidden="true">Mission</div>
          <div className="floating-orb w-64 h-64 gradient-orb-purple animate-float-slow" style={{ top: '-5%', right: '-3%' }} />
          <div className="floating-orb-sm w-40 h-40 gradient-orb-blue animate-float-reverse" style={{ bottom: '10%', left: '-2%' }} />
          <div className="max-w-3xl mx-auto px-6 space-y-10 relative z-10">
            <div className="space-y-3">
              <span className="text-xs font-medium text-[#A78BFA] uppercase tracking-[0.3em]">
                Our Story
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
                Born From a Napkin Sketch
              </h2>
            </div>
            <div className="space-y-6 text-white/60 text-base md:text-lg leading-relaxed">
              <p>
                BrushBids was founded in 2024 by <span className="text-white/80 font-medium">Charles Greenwald</span>, its Founder and CEO. The company started from a simple observation about a market that doesn't work: student art is abundant and often exceptional, yet there is no credible channel connecting student artists to buyers. The talent exists. The distribution does not.
              </p>
              <p>
                Greenwald saw the gap during a junior-year course selection session led by his school's art department director. The discussion was about academics, but the hallways made the real point. Strong work hung on every wall with no path to exposure or sale beyond the building. During that session he sketched the first version of the platform on a napkin in the school's Quad. It stayed pinned to a bulletin board for the rest of the year as a reminder of the problem worth solving.
              </p>
              <p>
                The idea was built through iteration rather than theory. At the <span className="text-white/80 font-medium">Venture Accelerator Program at Tufts University</span>, constant pitching, mentorship, and critical feedback reshaped the original model. Work with the <span className="text-white/80 font-medium">Derby School of Entrepreneurship</span> then helped turn the concept into a working product.
              </p>
              <p>
                Today, BrushBids is a student-first art marketplace. It gives young artists a direct route to share, sell, and be discovered, without relying on elite galleries, institutions, or traditional gatekeepers.
              </p>
            </div>
          </div>
        </section>

        <div className="divider-line" style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }} />

        <section
          aria-label="Founder"
          className="py-20 md:py-28 relative bg-mesh-mixed"
          style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }}
          data-testid="section-founder"
        >
          <div className="floating-orb-sm w-48 h-48 gradient-orb-pink animate-float" style={{ top: '5%', left: '5%' }} />
          <div className="max-w-4xl mx-auto px-6 relative z-10">
            <div className="section-outlined bg-white/[0.02] p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center">
              <div className="w-20 h-20 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-9 h-9 text-[#A78BFA]" />
              </div>
              <div className="space-y-3 text-center md:text-left">
                <span className="text-xs font-medium text-[#A78BFA] uppercase tracking-[0.3em]">
                  Founder
                </span>
                <h3 className="text-2xl font-display font-bold text-white" data-testid="text-founder-name">
                  Charles Greenwald
                </h3>
                <p className="text-white/50 leading-relaxed">
                  A student at The Dwight School in New York City, Charles identified a gap between the exceptional art created by students and the opportunities available to share it with the world. What started as a napkin sketch became a mission to democratize access for emerging artists everywhere. <a href="/gallery" className="text-[#A78BFA] hover:underline">Explore the gallery</a> to see the results.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="divider-line" style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }} />

        <section
          aria-label="Our Values"
          className="py-20 md:py-28 relative bg-mesh-blue bg-dots"
          style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }}
          data-testid="section-values"
        >
          <div className="watermark-text" aria-hidden="true">Values</div>
          <div className="floating-orb w-72 h-72 gradient-orb-blue animate-float-slow" style={{ top: '-8%', left: '-4%' }} />
          <div className="floating-orb-sm w-48 h-48 gradient-orb-pink animate-float-reverse" style={{ bottom: '5%', right: '-2%' }} />
          <div className="max-w-5xl mx-auto px-6 space-y-12 relative z-10">
            <div className="text-center space-y-3">
              <span className="text-xs font-medium text-[#A78BFA] uppercase tracking-[0.3em]">
                What We Stand For
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
                Our Values
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              {values.map((value) => (
                <div
                  key={value.title}
                  className="section-outlined bg-white/[0.02] p-6 md:p-8 transition-colors duration-300 hover:border-white/10"
                  data-testid={`card-value-${value.title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="w-11 h-11 rounded-md bg-white/[0.04] border border-white/10 flex items-center justify-center mb-5">
                    <value.icon className={`w-5 h-5 ${value.iconColor}`} />
                  </div>
                  <h3 className="font-semibold text-lg text-white mb-2">{value.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="divider-line" style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }} />

        <section
          aria-label="Revenue Split"
          className="py-20 md:py-28 relative bg-mesh-purple bg-grid-fine"
          style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }}
          data-testid="section-revenue-split"
        >
          <div className="watermark-text" aria-hidden="true">Impact</div>
          <div className="floating-orb w-56 h-56 gradient-orb-emerald animate-float" style={{ top: '-5%', right: '2%' }} />
          <div className="floating-orb-sm w-44 h-44 gradient-orb-purple animate-float-reverse" style={{ bottom: '0%', left: '-1%' }} />
          <div className="max-w-4xl mx-auto px-6 space-y-12 relative z-10">
            <div className="section-outlined bg-white/[0.02] p-8 md:p-12">
              <div className="text-center space-y-3 mb-10">
                <span className="text-xs font-medium text-[#A78BFA] uppercase tracking-[0.3em]">
                  Transparent Model
                </span>
                <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
                  How Revenue is Shared
                </h2>
                <p className="text-white/50 max-w-xl mx-auto">
                  Every sale is split transparently so artists earn the most, the platform sustains itself, and a meaningful portion goes to charity.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex rounded-full overflow-hidden h-4 bg-white/[0.04]">
                  <div className="h-full bg-[#A78BFA]" style={{ width: "75%" }} />
                  <div className="h-full bg-[#60A5FA]" style={{ width: "20%" }} />
                  <div className="h-full bg-[#34D399]" style={{ width: "5%" }} />
                </div>

                <div className="grid md:grid-cols-3 gap-6 text-center">
                  {revenueSplits.map((split) => (
                    <div key={split.label} className="space-y-2" data-testid={`revenue-${split.label.toLowerCase()}`}>
                      <div
                        className="text-5xl font-display font-bold"
                        style={{ color: split.color }}
                      >
                        {split.percent}%
                      </div>
                      <div className="text-lg font-semibold text-white">{split.label}</div>
                      <p className="text-sm text-white/40">{split.sublabel}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="divider-line" style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }} />


        <section
          aria-label="Expert Curation"
          className="py-20 md:py-28 relative bg-mesh-blue"
          style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)", marginTop: "-40px" }}
          data-testid="section-curation"
        >
          <div className="geometric-lines" />
          <div className="floating-orb w-48 h-48 gradient-orb-purple animate-float" style={{ top: '0%', right: '0%' }} />
          <div className="floating-orb-sm w-40 h-40 gradient-orb-blue animate-float-reverse" style={{ bottom: '5%', left: '3%' }} />
          <div className="max-w-4xl mx-auto px-6 space-y-12 relative z-10">
            <div className="text-center space-y-3">
              <span className="text-xs font-medium text-[#A78BFA] uppercase tracking-[0.3em]">
                Quality Assurance
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
                Expert Curation
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="section-outlined bg-white/[0.02] p-6 md:p-8 space-y-4">
                <div className="w-11 h-11 rounded-md bg-white/[0.04] border border-white/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#F472B6]" />
                </div>
                <h3 className="font-semibold text-lg text-white">Rigorous Review</h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  Our curation team, supported by advanced review tools trained by experienced art professionals, evaluates every submission based on technical execution, composition, creativity, and market appeal.
                </p>
              </div>
              <div className="section-outlined bg-white/[0.02] p-6 md:p-8 space-y-4">
                <div className="w-11 h-11 rounded-md bg-white/[0.04] border border-white/10 flex items-center justify-center">
                  <Palette className="w-5 h-5 text-[#60A5FA]" />
                </div>
                <h3 className="font-semibold text-lg text-white">Growth-Oriented</h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  Artists can choose between instant feedback or a detailed human curator review. Even rejected works come with constructive guidance, making BrushBids a learning platform as much as a marketplace. Have questions about the process? Check our <a href="/faq" className="text-[#A78BFA] hover:underline">FAQ</a>.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </Layout>
  );
}
