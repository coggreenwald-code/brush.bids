import { Layout } from "@/components/Layout";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { FileText } from "lucide-react";

export default function Terms() {
  return (
    <Layout>
      <SEOHead title="Terms & Conditions | BrushBids" description="Read the BrushBids terms of service." />
      <div className="space-y-12 pb-16 max-w-3xl mx-auto px-4 md:px-0">
        <section className="text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[#A78BFA]/10 flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8 text-[#A78BFA]" />
          </div>
          <span className="text-xs font-medium text-[#A78BFA] uppercase tracking-[0.3em]">Legal</span>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white">Terms & Conditions</h1>
          <p className="text-white/40">Last updated: October 2026</p>
        </section>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-display font-bold text-white">1. Acceptance of Terms</h2>
            <p className="text-white/50 mt-2 leading-relaxed">
              By accessing or using BrushBids, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-white">2. User Accounts</h2>
            <p className="text-white/50 mt-2 leading-relaxed">
              To use certain features of BrushBids, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must be at least 13 years old to create an account. If you are under 18, you represent that you have your parent's or guardian's permission to use the platform. You must be 18 or older to place a bid, make an offer, or buy artwork, because those are binding commitments to pay.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-white">3. Artist Submissions</h2>
            <p className="text-white/50 mt-2 leading-relaxed">
              Artists must be currently enrolled students in an accredited educational institution. All submitted artwork must be original creations by the submitting artist. By submitting artwork, you grant BrushBids a non-exclusive license to display, promote, and facilitate the sale of your work. You retain all intellectual property rights to your artwork.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-white">4. Curation Process</h2>
            <p className="text-white/50 mt-2 leading-relaxed">
              All artwork submissions are evaluated by our expert curation team, supported by advanced review tools. BrushBids reserves the right to accept or reject any submission based on our quality standards. Artists may resubmit improved works.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-white">5. Purchases and Offers</h2>
            <p className="text-white/50 mt-2 leading-relaxed">
              Artwork is sold at the price the artist sets. Buyers may also make an offer of at least 75% of that price; an offer is a binding commitment to buy at the offered price if the artist accepts it within 48 hours, after which the buyer has 48 hours to complete payment. Buyers may report a problem within 3 days of delivery; otherwise sales are final unless the artwork is materially different from its listing. The sale price is distributed as follows: 75% to the artist, 20% to BrushBids, and 5% to charity.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-white">6. Payments</h2>
            <p className="text-white/50 mt-2 leading-relaxed">
              Payment processing is handled by third-party payment providers. BrushBids does not store credit card information. Buyers pay BrushBids at checkout for the artwork, insured shipping and any sales tax. BrushBids holds the artist's share until the artwork is delivered and the 3-day inspection window has passed, then pays the artist (or, for artists under 18, their parent or guardian).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-white">7. Shipping and Delivery</h2>
            <p className="text-white/50 mt-2 leading-relaxed">
              Artists are responsible for shipping physical artwork to buyers. Shipping costs should be included in the listing price or clearly communicated. Digital artwork is delivered via secure download. Risk of loss passes to the buyer upon delivery confirmation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-white">8. Prohibited Content</h2>
            <p className="text-white/50 mt-2 leading-relaxed">
              The following are prohibited: plagiarized or copied work, offensive or discriminatory content, illegal subject matter, content that infringes on third-party rights, and misleading or fraudulent listings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-white">9. Intellectual Property</h2>
            <p className="text-white/50 mt-2 leading-relaxed">
              Artists retain copyright ownership of their work. Upon sale, the buyer receives the physical or digital artwork but not reproduction rights unless explicitly stated. BrushBids retains the right to use sold artwork images for promotional purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-white">10. Privacy</h2>
            <p className="text-white/50 mt-2 leading-relaxed">
              Your use of BrushBids is also governed by our Privacy Policy at brushbids.com/privacy, which explains what personal information we collect and how we use it. We do not sell personal information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-white">11. Limitation of Liability</h2>
            <p className="text-white/50 mt-2 leading-relaxed">
              BrushBids is not liable for any indirect, incidental, or consequential damages arising from your use of the platform. Our total liability shall not exceed the amount you paid to us in the 12 months preceding any claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-white">12. Modifications</h2>
            <p className="text-white/50 mt-2 leading-relaxed">
              We reserve the right to modify these terms at any time. We will notify users of material changes via email or platform notification. Continued use after changes constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-white">13. Contact</h2>
            <p className="text-white/50 mt-2 leading-relaxed">
              For questions about these terms, please contact us at legal@brushbids.com or through our contact page.
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </Layout>
  );
}
