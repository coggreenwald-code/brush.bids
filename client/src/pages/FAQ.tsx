import { Layout } from "@/components/Layout";
import { Footer } from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

export default function FAQ() {
  const artistFaqs = [
    {
      question: "Who can submit artwork?",
      answer: "Any student currently enrolled in an accredited educational institution (high school, college, university, or art school) can submit their artwork. We verify student status through your educational email or enrollment documentation.",
    },
    {
      question: "What types of artwork can I submit?",
      answer: "We accept various forms of visual art including paintings, drawings, digital art, photography, mixed media, and sculptures (photos of 3D work). All submissions must be original works created by you.",
    },
    {
      question: "How does the curation process work?",
      answer: "Our expert curators, supported by advanced review tools, evaluate submissions based on technical execution, composition, creativity, and presentation. You can choose instant feedback or wait for a detailed human curator review. Works meeting our standards are approved for auction; others receive constructive feedback for improvement.",
    },
    {
      question: "How much do I earn from a sale?",
      answer: "You receive 75% of the final sale price. 15% goes to BrushBids for platform operations, and 10% goes to the charity you select when submitting your artwork.",
    },
    {
      question: "How and when do I get paid?",
      answer: "Once your artwork sells and the buyer completes payment, your earnings are deposited to your connected payment account within 5-7 business days.",
    },
    {
      question: "What happens if my artwork is rejected?",
      answer: "You'll receive detailed feedback from our curators explaining why. Common reasons include image quality issues, incomplete descriptions, or technique areas needing improvement. You can always resubmit after making adjustments.",
    },
  ];

  const buyerFaqs = [
    {
      question: "How do auctions work?",
      answer: "Each artwork has a starting price set by the artist. You can place bids above the current highest bid. Auctions typically run for 7 days. The highest bidder when the auction closes wins the artwork.",
    },
    {
      question: "What payment methods are accepted?",
      answer: "We accept all major credit cards, debit cards, and PayPal through our secure payment processor. Payment is collected when you win an auction.",
    },
    {
      question: "How is artwork delivered?",
      answer: "Physical artwork is shipped directly from the artist. Digital artwork is delivered via secure download link. Shipping costs and methods are displayed before you place your bid.",
    },
    {
      question: "What if the artwork isn't as described?",
      answer: "We have a buyer protection policy. If the artwork differs significantly from the listing, you can request a return within 7 days of receipt. We mediate all disputes fairly.",
    },
    {
      question: "Can I contact the artist directly?",
      answer: "After winning an auction, you can message the artist through our platform for shipping coordination or questions about the piece. We encourage respectful collector-artist relationships.",
    },
  ];

  const generalFaqs = [
    {
      question: "What makes BrushBids different from other art marketplaces?",
      answer: "We focus exclusively on student artists, use expert curation for fair and unbiased reviews, and ensure 10% of every sale goes to charity. We're building a community, not just a marketplace.",
    },
    {
      question: "How do charities receive donations?",
      answer: "We partner with verified charitable organizations. Donations are aggregated and transferred quarterly, with full transparency reports available to both artists and the public.",
    },
    {
      question: "Is my personal information secure?",
      answer: "Absolutely. We use industry-standard encryption for all data. Payment information is processed by certified payment providers and never stored on our servers.",
    },
    {
      question: "How can I report inappropriate content?",
      answer: "Each listing has a 'Report' option. Our team reviews all reports within 24 hours and takes appropriate action. We have zero tolerance for plagiarism, offensive content, or misrepresentation.",
    },
  ];

  return (
    <Layout>
      <div className="space-y-16 pb-16 max-w-3xl mx-auto">
        {/* Header */}
        <section className="text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold">Frequently Asked Questions</h1>
          <p className="text-xl text-muted-foreground">
            Find answers to common questions about BrushBids.
          </p>
        </section>

        {/* For Artists */}
        <section className="space-y-6">
          <h2 className="text-2xl font-display font-bold">For Artists</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {artistFaqs.map((faq, i) => (
              <AccordionItem key={i} value={`artist-${i}`} className="border rounded-lg px-4" data-testid={`faq-artist-${i}`}>
                <AccordionTrigger className="text-left hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* For Buyers */}
        <section className="space-y-6">
          <h2 className="text-2xl font-display font-bold">For Buyers</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {buyerFaqs.map((faq, i) => (
              <AccordionItem key={i} value={`buyer-${i}`} className="border rounded-lg px-4" data-testid={`faq-buyer-${i}`}>
                <AccordionTrigger className="text-left hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* General */}
        <section className="space-y-6">
          <h2 className="text-2xl font-display font-bold">General</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {generalFaqs.map((faq, i) => (
              <AccordionItem key={i} value={`general-${i}`} className="border rounded-lg px-4" data-testid={`faq-general-${i}`}>
                <AccordionTrigger className="text-left hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Still have questions */}
        <section className="text-center p-8 rounded-2xl bg-card border">
          <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
          <p className="text-muted-foreground mb-4">Can't find what you're looking for? Reach out to our support team.</p>
          <a href="/contact" className="text-primary font-semibold hover:underline" data-testid="link-faq-contact">Contact Support</a>
        </section>
      </div>

      <Footer />
    </Layout>
  );
}
