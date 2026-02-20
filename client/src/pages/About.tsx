import { Layout } from "@/components/Layout";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Heart, Users, Award, Sparkles, TrendingUp, Globe, Droplets, Palette, GraduationCap, TreePine, Baby } from "lucide-react";
import brushBidsLogo from "@assets/BrushBids_Logo_1769695882555.png";
import bgFeininger from "@assets/Feininger-Fishing-Boats-hi-res-scaled-1_1771388372886.jpg";

const featuredCharities = [
  {
    name: "United Nations Children's Fund",
    description: "UNICEF works in over 190 countries to protect the rights of every child, providing healthcare, nutrition, education, and emergency relief to children in need worldwide.",
    category: "Child Welfare",
    icon: Baby,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    name: "World Wildlife Fund",
    description: "WWF leads global efforts to protect wildlife and conserve natural habitats, working with communities to reduce humanity's impact on the environment.",
    category: "Environment",
    icon: TreePine,
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-950/30",
  },
  {
    name: "Charity: Water",
    description: "Bringing clean, safe drinking water to people in developing countries through sustainable water projects, transforming health, education, and livelihoods.",
    category: "Clean Water",
    icon: Droplets,
    color: "text-cyan-600",
    bg: "bg-cyan-50 dark:bg-cyan-950/30",
  },
  {
    name: "The Metropolitan Museum of Art",
    description: "The Met's education programs provide free public access to 5,000 years of art, offering workshops, lectures, and resources for students and artists of all backgrounds.",
    category: "Art Education",
    icon: Globe,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/30",
  },
  {
    name: "The Studio Museum in Harlem",
    description: "A leading institution that champions the work of artists of African descent, providing studio residencies, exhibitions, and community programs in New York City.",
    category: "Artist Diversity",
    icon: Palette,
    color: "text-purple-600",
    bg: "bg-purple-50 dark:bg-purple-950/30",
  },
  {
    name: "National YoungArts Foundation",
    description: "Identifies and supports the next generation of artists through scholarships, mentorship, and professional development, nurturing talent from high school onward.",
    category: "Emerging Artists",
    icon: GraduationCap,
    color: "text-rose-600",
    bg: "bg-rose-50 dark:bg-rose-950/30",
  },
];

const values = [
  {
    icon: Heart,
    title: "Supporting Artists",
    description: "We believe every student artist deserves a platform to showcase their work and earn recognition.",
    bgPosition: "left top",
  },
  {
    icon: Award,
    title: "Quality First",
    description: "Our expert curation ensures only the highest quality work reaches collectors, maintaining trust on both sides.",
    bgPosition: "right top",
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "We're building a community where artists, collectors, and charities come together for a common good.",
    bgPosition: "left bottom",
  },
  {
    icon: TrendingUp,
    title: "Fair Compensation",
    description: "Artists receive 75% of every sale, ensuring they're fairly compensated for their creative work.",
    bgPosition: "right bottom",
  },
];

export default function About() {
  return (
    <Layout>
      <div className="space-y-16 pb-16 max-w-4xl mx-auto">
        {/* Hero */}
        <section className="text-center space-y-6" data-testid="section-about-hero">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto overflow-hidden">
            <img src={brushBidsLogo} alt="BrushBids Logo" className="w-12 h-12 object-contain" style={{ mixBlendMode: "multiply" }} />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold"><span className="text-[#E8C874]">About BrushBids</span></h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We're on a mission to connect emerging student artists with collectors who appreciate authentic, fresh creativity.
          </p>
        </section>

        {/* Story */}
        <section className="space-y-6" data-testid="section-about-story">
          <h2 className="text-2xl font-display font-bold">Our Story</h2>
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-muted-foreground leading-relaxed">
              BrushBids was founded in 2024 at The Dwight School New York by Charlie Greenwald. The idea emerged during a junior-year course selection lecture led by the director of the art department. While the discussion focused on academics, a more structural issue stood out: exceptional student artwork filled the halls, yet there was no real infrastructure to help student artists gain exposure or sell their work through a credible online marketplace.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              During that lecture, the first version of BrushBids was sketched on a napkin in the high school's Quad, the central gathering space of the campus. That napkin remained pinned to a bulletin board throughout the year, serving as a constant reminder of a simple but persistent problem in student art: talent without access.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Under Charlie's leadership, the concept was rigorously developed through hands-on iteration at the Tufts Entrepreneurship Center, where constant pitching, mentorship, and feedback refined the original model. Further progress came through collaboration with the Derby School of Entrepreneurship, helping transition BrushBids from an early idea into a working product.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Today, BrushBids reflects Charlie's vision of a student-first art marketplace. The platform creates a direct pathway for student artists to share, sell, and be discovered without relying on elite galleries, institutions, or traditional gatekeepers, allowing exceptional work to stand on its own merits.
            </p>
          </div>
        </section>

        {/* Revenue Split */}
        <section className="space-y-6" data-testid="section-revenue-split">
          <h2 className="text-2xl font-display font-bold">How Revenue is Shared</h2>
          <Card className="relative overflow-hidden p-8">
            <div className="absolute inset-0 pointer-events-none">
              <img
                src={bgFeininger}
                alt=""
                className="w-full h-full object-cover opacity-[0.22] dark:opacity-[0.11]"
              />
            </div>
            <div className="relative z-10 grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-5xl font-display font-bold text-primary mb-2">75%</div>
                <div className="text-lg font-semibold">Artist</div>
                <p className="text-sm text-muted-foreground mt-1">Goes directly to the creator</p>
              </div>
              <div>
                <div className="text-5xl font-display font-bold text-foreground mb-2">15%</div>
                <div className="text-lg font-semibold">BrushBids</div>
                <p className="text-sm text-muted-foreground mt-1">Platform & operations</p>
              </div>
              <div>
                <div className="text-5xl font-display font-bold text-green-600 mb-2">10%</div>
                <div className="text-lg font-semibold">Charity</div>
                <p className="text-sm text-muted-foreground mt-1">Artist's chosen cause</p>
              </div>
            </div>
          </Card>
        </section>

        {/* Featured Charities */}
        <section className="space-y-6" data-testid="section-featured-charities">
          <div className="space-y-2">
            <h2 className="text-2xl font-display font-bold">Charities We Champion</h2>
            <p className="text-muted-foreground">
              Every sale on BrushBids directs 10% to a charity chosen by the artist. Here are 6 of the causes closest to our mission, spanning global welfare, environmental stewardship, and the arts.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCharities.map((charity) => (
              <Card key={charity.name} className="p-6 flex flex-col gap-4 hover-elevate" data-testid={`card-charity-${charity.name.toLowerCase().replace(/\s+/g, '-').slice(0, 30)}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${charity.bg}`}>
                    <charity.icon className={`w-5 h-5 ${charity.color}`} />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{charity.category}</span>
                </div>
                <h3 className="font-display font-semibold text-lg leading-tight">{charity.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{charity.description}</p>
              </Card>
            ))}
          </div>
          <p className="text-sm text-muted-foreground text-center pt-2">
            Artists can choose from <span className="font-semibold text-foreground">50 charities</span> when submitting artwork, including global organizations, NYC art institutions, and U.S. art foundations.
          </p>
        </section>

        {/* Values */}
        <section className="space-y-6" data-testid="section-values">
          <h2 className="text-2xl font-display font-bold">Our Values</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {values.map((value) => (
              <Card key={value.title} className="relative overflow-hidden p-6">
                <div className="absolute inset-0 pointer-events-none">
                  <img
                    src={bgFeininger}
                    alt=""
                    className="w-[200%] h-[200%] object-cover opacity-[0.22] dark:opacity-[0.11]"
                    style={{ objectPosition: value.bgPosition }}
                  />
                </div>
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <value.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Expert Curation */}
        <section className="space-y-6" data-testid="section-curation">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-display font-bold">Expert Curation</h2>
          </div>
          <Card className="p-8 bg-gradient-to-br from-primary/5 to-accent/5">
            <p className="text-muted-foreground leading-relaxed">
              Our curation team, supported by advanced review tools trained by experienced art professionals, evaluates every submission based on multiple criteria: technical execution, composition, creativity, and market appeal. This ensures fair, unbiased reviews while maintaining the high quality standards our collectors expect.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Artists can choose between instant feedback or a detailed human curator review. Even rejected works come with constructive guidance, making BrushBids a learning platform as much as a marketplace.
            </p>
          </Card>
        </section>
      </div>

      <Footer />
    </Layout>
  );
}
