import { Layout } from "@/components/Layout";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Gavel, Heart, Users, Award, Sparkles, TrendingUp } from "lucide-react";

export default function About() {
  const values = [
    {
      icon: Heart,
      title: "Supporting Artists",
      description: "We believe every student artist deserves a platform to showcase their work and earn recognition.",
    },
    {
      icon: Award,
      title: "Quality First",
      description: "Our AI curation ensures only the highest quality work reaches collectors, maintaining trust on both sides.",
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "We're building a community where artists, collectors, and charities come together for a common good.",
    },
    {
      icon: TrendingUp,
      title: "Fair Compensation",
      description: "Artists receive 70% of every sale, ensuring they're fairly compensated for their creative work.",
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
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Gavel className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold">About BrushBids</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We're on a mission to connect emerging student artists with collectors who appreciate authentic, fresh creativity.
          </p>
        </section>

        {/* Story */}
        <section className="space-y-6">
          <h2 className="text-2xl font-display font-bold">Our Story</h2>
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-muted-foreground leading-relaxed">
              BrushBids was founded in 2024 with a simple belief: student artists deserve better opportunities to share and sell their work. Too often, talented young creators struggle to find platforms that take them seriously and offer fair compensation.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We built BrushBids as the bridge between passionate student artists and discerning collectors. Using AI-powered curation, we ensure quality while eliminating bias. Every artwork that reaches our marketplace has been evaluated for technique, composition, and originality.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              But we didn't stop there. We believe art should give back. That's why 15% of every sale goes to a charity chosen by the artist. To date, our community has donated over $18,000 to causes ranging from environmental conservation to arts education.
            </p>
          </div>
        </section>

        {/* Revenue Split */}
        <section className="space-y-6">
          <h2 className="text-2xl font-display font-bold">How Revenue is Shared</h2>
          <Card className="p-8">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-5xl font-display font-bold text-primary mb-2">70%</div>
                <div className="text-lg font-semibold">Artist</div>
                <p className="text-sm text-muted-foreground mt-1">Goes directly to the creator</p>
              </div>
              <div>
                <div className="text-5xl font-display font-bold text-foreground mb-2">15%</div>
                <div className="text-lg font-semibold">BrushBids</div>
                <p className="text-sm text-muted-foreground mt-1">Platform & operations</p>
              </div>
              <div>
                <div className="text-5xl font-display font-bold text-green-600 mb-2">15%</div>
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
              <Card key={value.title} className="p-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <value.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* AI Curation */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-display font-bold">AI-Powered Curation</h2>
          </div>
          <Card className="p-8 bg-gradient-to-br from-primary/5 to-accent/5">
            <p className="text-muted-foreground leading-relaxed">
              Our proprietary AI system evaluates every submission based on multiple criteria: technical execution, composition, creativity, and market appeal. This ensures fair, unbiased reviews while maintaining the high quality standards our collectors expect.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Artists receive instant feedback on their submissions, helping them understand how to improve and succeed. Even rejected works come with constructive guidance, making BrushBids a learning platform as much as a marketplace.
            </p>
          </Card>
        </section>
      </div>

      <Footer />
    </Layout>
  );
}
