import { Layout } from "@/components/Layout";
import { Footer } from "@/components/Footer";
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
  },
  {
    icon: Award,
    title: "Quality First",
    description: "Our expert curation ensures only the highest quality work reaches collectors, maintaining trust on both sides.",
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "We're building a community where artists, collectors, and charities come together for a common good.",
  },
  {
    icon: TrendingUp,
    title: "Fair Compensation",
    description: "Artists receive 75% of every sale, ensuring they're fairly compensated for their creative work.",
  },
];

const revenueSplits = [
  { percent: 75, label: "Artist", sublabel: "Goes directly to the creator", color: "#E8C874" },
  { percent: 15, label: "BrushBids", sublabel: "Platform & operations", color: "rgba(255,255,255,0.7)" },
  { percent: 10, label: "Charity", sublabel: "Artist's chosen cause", color: "#6BCB77" },
];

export default function About() {
  return (
    <Layout>
      <div className="pb-0">
        <section
          className="hero-gradient relative py-24 md:py-36 text-center"
          style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }}
          data-testid="section-about-hero"
        >
          <div className="max-w-3xl mx-auto px-6 space-y-6">
            <span className="text-xs font-medium text-[#E8C874] uppercase tracking-[0.3em]" data-testid="label-about">
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
          className="py-20 md:py-28"
          style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }}
          data-testid="section-about-story"
        >
          <div className="max-w-3xl mx-auto px-6 space-y-10">
            <div className="space-y-3">
              <span className="text-xs font-medium text-[#E8C874] uppercase tracking-[0.3em]">
                Our Story
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
                Born From a Napkin Sketch
              </h2>
            </div>
            <div className="space-y-6 text-white/60 text-base md:text-lg leading-relaxed">
              <p>
                BrushBids was founded in 2024 at <span className="text-white/80 font-medium">The Dwight School New York</span> by <span className="text-white/80 font-medium">Charlie Greenwald</span>. The idea emerged during a junior-year course selection lecture led by the director of the art department. While the discussion focused on academics, a more structural issue stood out: exceptional student artwork filled the halls, yet there was no real infrastructure to help student artists gain exposure or sell their work through a credible online marketplace.
              </p>
              <p>
                During that lecture, the first version of BrushBids was sketched on a napkin in the high school's Quad, the central gathering space of the campus. That napkin remained pinned to a bulletin board throughout the year, serving as a constant reminder of a simple but persistent problem in student art: talent without access.
              </p>
              <p>
                Under Charlie's leadership, the concept was rigorously developed through hands-on iteration at the <span className="text-white/80 font-medium">Tufts Entrepreneurship Center</span>, where constant pitching, mentorship, and feedback refined the original model. Further progress came through collaboration with the <span className="text-white/80 font-medium">Derby School of Entrepreneurship</span>, helping transition BrushBids from an early idea into a working product.
              </p>
              <p>
                Today, BrushBids reflects Charlie's vision of a student-first art marketplace. The platform creates a direct pathway for student artists to share, sell, and be discovered — without relying on elite galleries, institutions, or traditional gatekeepers.
              </p>
            </div>
          </div>
        </section>

        <div className="divider-line" style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }} />

        <section
          className="py-20 md:py-28"
          style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }}
          data-testid="section-founder"
        >
          <div className="max-w-4xl mx-auto px-6">
            <div className="bg-white/[0.02] border border-white/5 rounded-md p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center">
              <div className="w-20 h-20 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-9 h-9 text-[#E8C874]" />
              </div>
              <div className="space-y-3 text-center md:text-left">
                <span className="text-xs font-medium text-[#E8C874] uppercase tracking-[0.3em]">
                  Founder
                </span>
                <h3 className="text-2xl font-display font-bold text-white" data-testid="text-founder-name">
                  Charlie Greenwald
                </h3>
                <p className="text-white/50 leading-relaxed">
                  A student at The Dwight School in New York City, Charlie identified a gap between the exceptional art created by students and the opportunities available to share it with the world. What started as a napkin sketch became a mission to democratize access for emerging artists everywhere.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="divider-line" style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }} />

        <section
          className="py-20 md:py-28"
          style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }}
          data-testid="section-values"
        >
          <div className="max-w-5xl mx-auto px-6 space-y-12">
            <div className="text-center space-y-3">
              <span className="text-xs font-medium text-[#E8C874] uppercase tracking-[0.3em]">
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
                  className="bg-white/[0.02] border border-white/5 rounded-md p-6 md:p-8 transition-colors duration-300 hover:border-white/10"
                  data-testid={`card-value-${value.title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="w-11 h-11 rounded-md bg-white/[0.04] border border-white/10 flex items-center justify-center mb-5">
                    <value.icon className="w-5 h-5 text-[#E8C874]" />
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
          className="py-20 md:py-28"
          style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }}
          data-testid="section-revenue-split"
        >
          <div className="max-w-4xl mx-auto px-6 space-y-12">
            <div className="text-center space-y-3">
              <span className="text-xs font-medium text-[#E8C874] uppercase tracking-[0.3em]">
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
                <div className="h-full bg-[#E8C874]" style={{ width: "75%" }} />
                <div className="h-full bg-white/20" style={{ width: "15%" }} />
                <div className="h-full bg-[#6BCB77]" style={{ width: "10%" }} />
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
        </section>

        <div className="divider-line" style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }} />

        <section
          className="py-20 md:py-28"
          style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }}
          data-testid="section-featured-charities"
        >
          <div className="max-w-5xl mx-auto px-6 space-y-12">
            <div className="text-center space-y-3">
              <span className="text-xs font-medium text-[#E8C874] uppercase tracking-[0.3em]">
                Giving Back
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
                Charities We Champion
              </h2>
              <p className="text-white/50 max-w-2xl mx-auto">
                Every sale on BrushBids directs 10% to a charity chosen by the artist. Here are some of the causes closest to our mission.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCharities.map((charity) => (
                <div
                  key={charity.name}
                  className="bg-white/[0.02] border border-white/5 rounded-md p-6 flex flex-col gap-4 transition-colors duration-300 hover:border-white/10"
                  data-testid={`card-charity-${charity.name.toLowerCase().replace(/\s+/g, '-').slice(0, 30)}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-md bg-white/90 flex items-center justify-center p-1.5">
                      <img src={charity.logo} alt={`${charity.name} logo`} className="w-full h-full object-contain" />
                    </div>
                    <span className="text-xs font-medium uppercase tracking-wider text-[#E8C874]">{charity.category}</span>
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
          className="py-20 md:py-28"
          style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }}
          data-testid="section-curation"
        >
          <div className="max-w-4xl mx-auto px-6 space-y-12">
            <div className="text-center space-y-3">
              <span className="text-xs font-medium text-[#E8C874] uppercase tracking-[0.3em]">
                Quality Assurance
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
                Expert Curation
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/[0.02] border border-white/5 rounded-md p-6 md:p-8 space-y-4">
                <div className="w-11 h-11 rounded-md bg-white/[0.04] border border-white/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#E8C874]" />
                </div>
                <h3 className="font-semibold text-lg text-white">Rigorous Review</h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  Our curation team, supported by advanced review tools trained by experienced art professionals, evaluates every submission based on technical execution, composition, creativity, and market appeal.
                </p>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-md p-6 md:p-8 space-y-4">
                <div className="w-11 h-11 rounded-md bg-white/[0.04] border border-white/10 flex items-center justify-center">
                  <Palette className="w-5 h-5 text-[#E8C874]" />
                </div>
                <h3 className="font-semibold text-lg text-white">Growth-Oriented</h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  Artists can choose between instant feedback or a detailed human curator review. Even rejected works come with constructive guidance, making BrushBids a learning platform as much as a marketplace.
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
