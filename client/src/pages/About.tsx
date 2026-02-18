import { Layout } from "@/components/Layout";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Heart, Users, Award, Sparkles, TrendingUp } from "lucide-react";
import brushBidsLogo from "@assets/BrushBids_Logo_1769695882555.png";
import bgFeininger from "@assets/Feininger-Fishing-Boats-hi-res-scaled-1_1771388372886.jpg";

export default function About() {
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

  const team = [
    { name: "Sarah Mitchell", role: "Founder & CEO", avatar: "sarah-m" },
    { name: "David Chen", role: "Head of Technology", avatar: "david-c" },
    { name: "Maya Johnson", role: "Artist Relations", avatar: "maya-j" },
    { name: "Alex Rivera", role: "Community Manager", avatar: "alex-r" },
  ];

  return (
    <Layout>
      <div className="space-y-16 pb-16 max-w-4xl mx-auto">
        {/* Hero */}
        <section className="text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto overflow-hidden">
            <img src={brushBidsLogo} alt="BrushBids Logo" className="w-12 h-12 object-contain" style={{ mixBlendMode: "multiply" }} />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold"><span className="text-[#E8C874]">About BrushBids</span></h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We're on a mission to connect emerging student artists with collectors who appreciate authentic, fresh creativity.
          </p>
        </section>

        {/* Story */}
        <section className="space-y-6">
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
        <section className="space-y-6">
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

        {/* Values */}
        <section className="space-y-6">
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
        <section className="space-y-6">
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
