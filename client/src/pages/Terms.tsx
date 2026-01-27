import { Layout } from "@/components/Layout";
import { Footer } from "@/components/Footer";
import { FileText } from "lucide-react";

export default function Terms() {
  return (
    <Layout>
      <div className="space-y-12 pb-16 max-w-3xl mx-auto">
        {/* Header */}
        <section className="text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold">Terms & Conditions</h1>
          <p className="text-muted-foreground">Last updated: January 2026</p>
        </section>

        {/* Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-display font-bold">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using BrushBids, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold">2. User Accounts</h2>
            <p className="text-muted-foreground">
              To use certain features of BrushBids, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must be at least 13 years old to create an account. If you are under 18, you represent that you have your parent's or guardian's permission to use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold">3. Artist Submissions</h2>
            <p className="text-muted-foreground">
              Artists must be currently enrolled students in an accredited educational institution. All submitted artwork must be original creations by the submitting artist. By submitting artwork, you grant BrushBids a non-exclusive license to display, promote, and facilitate the sale of your work. You retain all intellectual property rights to your artwork.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold">4. AI Curation</h2>
            <p className="text-muted-foreground">
              All artwork submissions are evaluated by our AI curation system. BrushBids reserves the right to accept or reject any submission based on our quality standards. Decisions made by the AI curation system are final, though artists may resubmit improved works.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold">5. Bidding and Sales</h2>
            <p className="text-muted-foreground">
              When you place a bid, you enter a binding commitment to purchase the artwork at your bid price if you are the winning bidder. All sales are final unless the artwork is materially different from its listing. The sale price is distributed as follows: 70% to the artist, 15% to BrushBids, and 15% to the artist's designated charity.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold">6. Payments</h2>
            <p className="text-muted-foreground">
              Payment processing is handled by third-party payment providers. BrushBids does not store credit card information. Buyers must complete payment within 48 hours of winning an auction. Artists receive payment within 5-7 business days after the buyer's payment is confirmed.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold">7. Shipping and Delivery</h2>
            <p className="text-muted-foreground">
              Artists are responsible for shipping physical artwork to buyers. Shipping costs should be included in the listing price or clearly communicated. Digital artwork is delivered via secure download. Risk of loss passes to the buyer upon delivery confirmation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold">8. Prohibited Content</h2>
            <p className="text-muted-foreground">
              The following are prohibited: plagiarized or copied work, offensive or discriminatory content, illegal subject matter, content that infringes on third-party rights, and misleading or fraudulent listings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold">9. Intellectual Property</h2>
            <p className="text-muted-foreground">
              Artists retain copyright ownership of their work. Upon sale, the buyer receives the physical or digital artwork but not reproduction rights unless explicitly stated. BrushBids retains the right to use sold artwork images for promotional purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold">10. Privacy</h2>
            <p className="text-muted-foreground">
              Your use of BrushBids is governed by our Privacy Policy. We collect and use personal information as described therein. We do not sell personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold">11. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              BrushBids is not liable for any indirect, incidental, or consequential damages arising from your use of the platform. Our total liability shall not exceed the amount you paid to us in the 12 months preceding any claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold">12. Modifications</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these terms at any time. We will notify users of material changes via email or platform notification. Continued use after changes constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold">13. Contact</h2>
            <p className="text-muted-foreground">
              For questions about these terms, please contact us at legal@brushbids.com or through our contact page.
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </Layout>
  );
}
