import { Layout } from "@/components/Layout";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Heart, Users, Award, TrendingUp, Sparkles, GraduationCap, Palette } from "lucide-react";
import logoUnicef from "@assets/unicef.png";
import logoWwf from "@assets/wwf.png";
import logoCharityWater from "@assets/charity-water.png";
import logoMet from "@assets/met.png";
import logoStudioMuseum from "@assets/studio-museum.png";
import logoYoungarts from "@assets/youngarts.png";

const featuredCharities = [
  {
    name: "United Nations Children's Fund",
    description: "UNICEF works in over 190 countries to protect the rights of every child, providing healthcare, nutrition, education, and emergency relief to children in need worldwide.",
    category: "Child Welfare",
    logo: logoUnicef,
  },
  {
    name: "World Wildlife Fund",
    description: "WWF leads global efforts to protect wildlife and conserve natural habitats, working with communities to reduce humanity's impact on the environment.",
    category: "Environment",
    logo: logoWwf,
  },
  {
    name: "Charity: Water",
    description: "Bringing clean, safe drinking water to people in developing countries through sustainable water projects, transforming health, education, and livelihoods.",
    category: "Clean Water",
    logo: logoCharityWater,
  },
  {
    name: "The Metropolitan Museum of Art",
    description: "The Met's education programs provide free public access to 5,000 years of art, offering workshops, lectures, and resources for students and artists of all backgrounds.",
    category: "Art Education",
    logo: logoMet,
  },
  {
    name: "The Studio Museum in Harlem",
    description: "A leading institution that champions the work of artists of African descent, providing studio residencies, exhibitions, and community programs in New York City.",
    category: "Artist Diversity",
    logo: logoStudioMuseum,
  },
  {
    name: "National YoungArts Foundation",
    description: "Identifies and supports the next generation of artists through scholarships, mentorship, and professional development, nurturing talent from high school onward.",
    category: "Emerging Artists",
    logo: logoYoungarts,
  },
];

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
    description: "Artists receive 75% of every sale, ensuring they're fully compensated for their creative work.",
    iconColor: "text-[#34D399]",
  },
];

const revenueSplits = [
  { percent: 75, label: "Artist", sublabel: "Goes directly to the creator", color: "#A78BFA" },
  { percent: 20, label: "BrushBids", sublabel: "Platform & operations", color: "#60A5FA" },
  { percent: 5, label: "Charity", sublabel: "Artist's chosen cause", color: "#34D399" },
];

export default function About() {
  return (
    <Layout>
      <SEOHead title="About BrushBids — Student Art Auction Platform | BrushBids" description="BrushBids is a student art auction platform founded by Charles Greenwald at The Dwight School, New York. 75% of every sale goes to the artist, 5% to charity. Discover our mission, values, and the charities we support." />
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
                BrushBids was founded in 2024 at <span className="text-white/80 font-medium">The Dwight School New York</span> by <span className="text-white/80 font-medium">Charles Greenwald</span>. The idea emerged during a junior-year course selection lecture led by the director of the art department. While the discussion focused on academics, a more structural issue stood out: exceptional student artwork filled the halls, yet there was no real infrastructure to help student artists gain exposure or sell their work through a credible online marketplace.
              </p>
              <p>
                During that lecture, the first version of BrushBids was sketched on a napkin in the high school's Quad, the central gathering space of the campus. That napkin remained pinned to a bulletin board throughout the year, serving as a constant reminder of a simple but persistent problem in student art: talent without access.
              </p>
              <p>
                The concept was rigorously developed through hands-on iteration during the <span className="text-white/80 font-medium">Venture Accelerator Program at Tufts University</span>, where constant pitching, mentorship, and feedback refined the original model. Further progress came through collaboration with the <span className="text-white/80 font-medium">Derby School of Entrepreneurship</span>, helping transition BrushBids from an early idea into a working product.
              </p>
              <p>
                Today, BrushBids is a student-first art marketplace. The platform creates a direct pathway for student artists to share, sell, and be discovered without relying on elite galleries, institutions, or traditional gatekeepers.
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
          aria-label="Featured Charities"
          className="py-20 md:py-28 relative bg-mesh-mixed bg-dots-sparse"
          style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }}
          data-testid="section-featured-charities"
        >
          <div className="watermark-text" aria-hidden="true">Partners</div>
          <div className="floating-orb w-60 h-60 gradient-orb-emerald animate-float-slow" style={{ top: '-5%', left: '-3%' }} />
          <div className="floating-orb-sm w-52 h-52 gradient-orb-pink animate-float" style={{ bottom: '5%', right: '-2%' }} />
          <div className="floating-orb-sm w-36 h-36 gradient-orb-blue animate-float-reverse" style={{ top: '40%', right: '5%' }} />
          <div className="max-w-5xl mx-auto px-6 space-y-12 relative z-10">
            <div className="text-center space-y-3">
              <span className="text-xs font-medium text-[#34D399] uppercase tracking-[0.3em]">
                Giving Back
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
                Charities We Champion
              </h2>
              <p className="text-white/50 max-w-2xl mx-auto">
                Every sale on BrushBids directs 5% to a charity chosen by the artist. Here are some of the causes closest to our mission.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCharities.map((charity) => (
                <div
                  key={charity.name}
                  className="section-outlined bg-white/[0.02] p-6 flex flex-col gap-4 transition-colors duration-300 hover:border-white/10"
                  data-testid={`card-charity-${charity.name.toLowerCase().replace(/\s+/g, '-').slice(0, 30)}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-md bg-white/90 flex items-center justify-center p-1.5">
                      <img src={charity.logo} alt={`${charity.name} logo`} className="w-full h-full object-contain" />
                    </div>
                    <span className="text-xs font-medium uppercase tracking-wider text-[#34D399]">{charity.category}</span>
                  </div>
                  <h3 className="font-semibold text-lg text-white leading-tight">{charity.name}</h3>
                  <p className="text-sm text-white/40 leading-relaxed flex-1">{charity.description}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-white/40 text-center">
              Artists can choose from <span className="font-semibold text-white/70">50 charities</span> when submitting artwork, including global organizations, NYC art institutions, and U.S. art foundations.
            </p>
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
