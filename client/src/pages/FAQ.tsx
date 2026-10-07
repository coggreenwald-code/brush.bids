import { useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { ARTIST_PERCENT, PLATFORM_PERCENT, CHARITY_PERCENT, PAYOUT_TIMING, MIN_BUYER_AGE, CONTACT_EMAIL, MIN_OFFER_PERCENT, OFFER_WINDOW_HOURS, INSPECTION_DAYS } from "@shared/siteConfig";
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
      answer: "Our expert curators, supported by advanced review tools, evaluate every submission based on technical execution, composition, creativity, and presentation. You can choose instant feedback or wait for a detailed human curator review. Works meeting our standards are approved for sale; others receive constructive feedback for improvement.",
    },
    {
      question: "How much do I earn from a sale?",
      answer: `You receive ${ARTIST_PERCENT}% of the final sale price. ${PLATFORM_PERCENT}% goes to BrushBids for platform operations, and ${CHARITY_PERCENT}% goes to charity.`,
    },
    {
      question: "How and when do I get paid?",
      answer: `You are paid ${PAYOUT_TIMING}. Holding payment until delivery protects both you and the buyer if a piece is lost or damaged in shipping. Artists under 18 are paid through a parent or guardian.`,
    },
    {
      question: "Do I need to handle US sales tax on my sales?",
      answer: "No. BrushBids operates as the marketplace facilitator and uses Stripe Tax to calculate, collect, and remit US sales tax to each state on your behalf. Your payout is always based on your pre-tax winning bid — the tax the buyer pays does not come out of your ${ARTIST_PERCENT}% share. You'll see the pre-tax sale amount on your earnings dashboard.",
    },
    {
      question: "What happens if my artwork is rejected?",
      answer: "You'll receive detailed feedback from our curators explaining why. Common reasons include image quality issues, incomplete descriptions, or technique areas needing improvement. You can always resubmit after making adjustments.",
    },
  ];

  const buyerFaqs = [
    {
      question: "How does buying work?",
      answer: `Every piece has a fixed price set by the artist. Buy it now, or make an offer of at least ${MIN_OFFER_PERCENT}% of the price; the artist has ${OFFER_WINDOW_HOURS} hours to accept, and then you have ${OFFER_WINDOW_HOURS} hours to pay.`,
    },
    {
      question: "What payment methods are accepted?",
      answer: `BrushBids accepts major credit and debit cards through Stripe. You must be ${MIN_BUYER_AGE} or older to buy or make an offer.`,
    },
    {
      question: "Will I be charged sales tax?",
      answer: "If your shipping address is in a US state where BrushBids is required to collect sales tax, the appropriate tax will be calculated by Stripe and added on top of the price at checkout. As the marketplace facilitator, BrushBids collects and remits the tax to the relevant authorities — artists do not need to handle sales tax themselves. Your tax is shown as a separate line on your receipt.",
    },
    {
      question: "How is artwork delivered?",
      answer: "Artwork ships directly from the artist with tracking. Shipping is calculated from the artist's location to your address before you pay.",
    },
    {
      question: "What if the artwork isn't as described?",
      answer: `Report it from your order page within ${INSPECTION_DAYS} days of delivery. The artist isn't paid until that window passes, so we can hold the payment and make it right, including a full refund for damaged or misdescribed work.`,
    },
  ];

  const generalFaqs = [
    {
      question: "What is BrushBids?",
      answer: `BrushBids is a student art platform that connects emerging student artists with collectors worldwide. Founded by Charles Greenwald at The Dwight School in New York, BrushBids provides a curated marketplace where students can showcase and sell their original artwork, with ${CHARITY_PERCENT}% of every sale going to charity.`,
    },
    {
      question: "Who founded BrushBids?",
      answer: "BrushBids was founded by Charles Greenwald, a student at The Dwight School in New York City. The idea was born during a junior-year lecture when Charles noticed that exceptional student art filled the school's halls, yet there was no credible online platform for students to sell their work. The concept was developed during the Venture Accelerator Program at Tufts University and the Derby School of Entrepreneurship.",
    },
    {
      question: "Is BrushBids free to use?",
      answer: `Yes, BrushBids is completely free to join for both artists and collectors. There are no listing fees or membership costs. BrushBids only takes a ${PLATFORM_PERCENT}% commission when an artwork sells, with ${ARTIST_PERCENT}% going to the artist and ${CHARITY_PERCENT}% to charity.`,
    },
    {
      question: "What makes BrushBids different from other art marketplaces?",
      answer: `BrushBids focuses exclusively on student artists, uses expert curation for fair and unbiased reviews, and sends ${CHARITY_PERCENT}% of every sale to charity.`,
    },
    {
      question: "How do charities receive donations?",
      answer: "We are finalizing written agreements with our charity partners and will publish the list, and how donations are transferred, once they are signed.",
    },
    {
      question: "Is my personal information secure?",
      answer: "Card payments are processed by Stripe and card numbers never reach our servers. Artist contact, payout and address details are never shown publicly. See our Privacy Policy for what we collect and why.",
    },
    {
      question: "How can I report inappropriate content?",
      answer: `Email ${CONTACT_EMAIL} with a link to the listing. We review every report and remove plagiarized, offensive or misleading work.`,
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
      <SEOHead title="FAQ | BrushBids" description="Frequently asked questions about BrushBids: buying, offers, shipping, selling and payouts." />
      <div className="space-y-16 pb-16 max-w-3xl mx-auto px-4 md:px-0">
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
