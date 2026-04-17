import { useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

export default function FAQ() {
  const artistFaqs = [
    {
      question: "Who can submit artwork on BrushBids?",
      answer: "Any student currently enrolled in an accredited educational institution (high school, college, university, or art school) can submit their artwork to BrushBids. We verify student status through your educational email or enrollment documentation.",
    },
    {
      question: "What types of artwork can I submit?",
      answer: "BrushBids accepts various forms of visual art including paintings, drawings, digital art, photography, mixed media, and sculptures (photos of 3D work). All submissions must be original works created by you.",
    },
    {
      question: "How does the BrushBids curation process work?",
      answer: "Our expert curators, supported by advanced review tools, evaluate every submission based on technical execution, composition, creativity, and presentation. You can choose instant feedback or wait for a detailed human curator review. Works meeting our standards are approved for auction; others receive constructive feedback for improvement.",
    },
    {
      question: "How much do I earn from a sale?",
      answer: "You receive 75% of the final sale price. 20% goes to BrushBids for platform operations, and 5% goes to the charity you select when submitting your artwork.",
    },
    {
      question: "How and when do I get paid?",
      answer: "Once your artwork sells on BrushBids and the buyer completes payment, your earnings are deposited to your connected payment account within 5-7 business days.",
    },
    {
      question: "What happens if my artwork is rejected?",
      answer: "You'll receive detailed feedback from our curators explaining why. Common reasons include image quality issues, incomplete descriptions, or technique areas needing improvement. You can always resubmit after making adjustments.",
    },
  ];

  const buyerFaqs = [
    {
      question: "How do BrushBids auctions work?",
      answer: "Each artwork has a starting price set by the artist. You can place bids above the current highest bid. Auctions run for a set duration chosen by the artist (between 1 and 30 days). If a bid is placed in the last 2 minutes, the auction automatically extends to prevent sniping. The highest bidder when the auction closes wins the artwork.",
    },
    {
      question: "What payment methods are accepted?",
      answer: "BrushBids accepts all major credit cards, debit cards, and PayPal through our secure payment processor. Payment is collected when you win an auction.",
    },
    {
      question: "How is artwork delivered?",
      answer: "Physical artwork is shipped directly from the artist. Digital artwork is delivered via secure download link. Shipping costs and methods are displayed before you place your bid.",
    },
    {
      question: "What if the artwork isn't as described?",
      answer: "BrushBids has a buyer protection policy. If the artwork differs significantly from the listing, you can request a return within 7 days of receipt. We mediate all disputes fairly.",
    },
    {
      question: "Can I contact the artist directly?",
      answer: "After winning an auction on BrushBids, you can message the artist through our platform for shipping coordination or questions about the piece. We encourage respectful collector-artist relationships.",
    },
  ];

  const generalFaqs = [
    {
      question: "What is BrushBids?",
      answer: "BrushBids is a student art auction platform that connects emerging student artists with collectors worldwide. Founded by Charles Greenwald at The Dwight School in New York, BrushBids provides a curated marketplace where students can showcase, auction, and sell their original artwork — with 5% of every sale going to a charity of the artist's choice.",
    },
    {
      question: "Who founded BrushBids?",
      answer: "BrushBids was founded by Charles Greenwald, a student at The Dwight School in New York City. The idea was born during a junior-year lecture when Charles noticed that exceptional student art filled the school's halls, yet there was no credible online platform for students to sell their work. The concept was developed through the Tufts Entrepreneurship Center and the Derby School of Entrepreneurship.",
    },
    {
      question: "Is BrushBids free to use?",
      answer: "Yes, BrushBids is completely free to join for both artists and collectors. There are no listing fees or membership costs. BrushBids only takes a 20% commission when an artwork sells, with 75% going to the artist and 5% to the artist's chosen charity.",
    },
    {
      question: "What makes BrushBids different from other art marketplaces?",
      answer: "BrushBids focuses exclusively on student artists, uses expert curation for fair and unbiased reviews, and ensures 5% of every sale goes to charity. We're building a community, not just a marketplace.",
    },
    {
      question: "How do charities receive donations?",
      answer: "BrushBids partners with verified charitable organizations. Donations are aggregated and transferred quarterly, with full transparency reports available to both artists and the public.",
    },
    {
      question: "Is my personal information secure?",
      answer: "Absolutely. BrushBids uses industry-standard encryption for all data. Payment information is processed by certified payment providers and never stored on our servers.",
    },
    {
      question: "How can I report inappropriate content?",
      answer: "Each listing has a 'Report' option. The BrushBids team reviews all reports within 24 hours and takes appropriate action. We have zero tolerance for plagiarism, offensive content, or misrepresentation.",
    },
  ];

  const allFaqs = [...artistFaqs, ...buyerFaqs, ...generalFaqs];

  useEffect(() => {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": allFaqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer,
        },
      })),
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(faqSchema);
    script.id = "faq-jsonld";
    const existing = document.getElementById("faq-jsonld");
    if (existing) existing.remove();
    document.head.appendChild(script);

    return () => {
      const el = document.getElementById("faq-jsonld");
      if (el) el.remove();
    };
  }, []);

  return (
    <Layout>
      <SEOHead title="FAQ | BrushBids" description="Frequently asked questions about BrushBids, the student art auction platform. Learn how to submit artwork, bid on pieces, understand our 75/15/10 revenue split, and more." />
      <div className="space-y-16 pb-16 max-w-3xl mx-auto">
        <section className="text-center space-y-6" aria-label="FAQ Introduction">
          <div className="w-16 h-16 rounded-2xl bg-[#A78BFA]/10 flex items-center justify-center mx-auto">
            <HelpCircle className="w-8 h-8 text-[#A78BFA]" />
          </div>
          <span className="text-xs font-medium text-[#A78BFA] uppercase tracking-[0.3em]">Support</span>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white">Frequently Asked Questions</h1>
          <p className="text-xl text-white/50">
            Find answers to common questions about BrushBids.
          </p>
        </section>

        <section className="space-y-6" aria-label="Artist FAQs">
          <h2 className="text-2xl font-display font-bold text-white">For Artists</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {artistFaqs.map((faq, i) => (
              <AccordionItem key={i} value={`artist-${i}`} className="border border-white/5 rounded-lg px-4 bg-white/[0.02]" data-testid={`faq-artist-${i}`}>
                <AccordionTrigger className="text-left hover:no-underline text-white/90 hover:text-[#A78BFA]">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-white/50">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section className="space-y-6" aria-label="Buyer FAQs">
          <h2 className="text-2xl font-display font-bold text-white">For Collectors</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {buyerFaqs.map((faq, i) => (
              <AccordionItem key={i} value={`buyer-${i}`} className="border border-white/5 rounded-lg px-4 bg-white/[0.02]" data-testid={`faq-buyer-${i}`}>
                <AccordionTrigger className="text-left hover:no-underline text-white/90 hover:text-[#A78BFA]">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-white/50">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section className="space-y-6" aria-label="General FAQs">
          <h2 className="text-2xl font-display font-bold text-white">General</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {generalFaqs.map((faq, i) => (
              <AccordionItem key={i} value={`general-${i}`} className="border border-white/5 rounded-lg px-4 bg-white/[0.02]" data-testid={`faq-general-${i}`}>
                <AccordionTrigger className="text-left hover:no-underline text-white/90 hover:text-[#A78BFA]">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-white/50">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section className="text-center p-8 rounded-2xl bg-white/[0.02] border border-white/5" aria-label="Contact Support">
          <h3 className="text-xl font-bold text-white mb-2">Still have questions?</h3>
          <p className="text-white/50 mb-4">Can't find what you're looking for? Reach out to our support team.</p>
          <a href="/contact" className="text-[#A78BFA] font-semibold hover:underline" data-testid="link-faq-contact">Contact Support</a>
        </section>
      </div>

      <Footer />
    </Layout>
  );
}
