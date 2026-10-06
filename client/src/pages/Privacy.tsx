import { Layout } from "@/components/Layout";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { ShieldCheck } from "lucide-react";
import { CONTACT_EMAIL, MIN_BUYER_AGE } from "@shared/siteConfig";

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: "1. Who we are",
    body: (
      <>
        BrushBids is an online marketplace for original artwork by student artists, operated from New York, NY. This policy explains what personal information we collect, why, who we share it with, and the choices you have. Questions go to{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="underline">{CONTACT_EMAIL}</a>.
      </>
    ),
  },
  {
    title: "2. What we collect",
    body: (
      <ul className="list-disc pl-5 space-y-2">
        <li><strong>Account details:</strong> name, email address and profile photo from the sign-in provider you use, plus the username and bio you add.</li>
        <li><strong>Artist details:</strong> date of birth (to apply our rules for artists under 18), payout method and handle, a parent or guardian's email and payout details for artists under 18, the ship-from address used to calculate shipping, and the artwork images and descriptions you submit.</li>
        <li><strong>Buyer details:</strong> shipping address, order history, and your confirmation that you are {MIN_BUYER_AGE} or older. Card details are entered directly with Stripe and never reach our servers.</li>
        <li><strong>Email list:</strong> the email address you give us to hear about new drops.</li>
        <li><strong>Technical data:</strong> a session cookie that keeps you signed in, and small preferences stored in your browser (for example, that you closed a pop-up).</li>
      </ul>
    ),
  },
  {
    title: "3. How we use it",
    body: (
      <ul className="list-disc pl-5 space-y-2">
        <li>To run your account, list artwork, process purchases, ship orders, and pay artists.</li>
        <li>To calculate, collect and report sales tax, and to meet tax and payment-law obligations.</li>
        <li>To review submitted artwork, including with automated tools that analyze the image and description.</li>
        <li>To send emails about your account, your orders and payouts, and, if you asked, new drops.</li>
        <li>To prevent fraud and keep the platform safe.</li>
      </ul>
    ),
  },
  {
    title: "4. What is public",
    body: "Your artist profile shows your display name, bio, profile photo and listed artwork. We never show your email, date of birth, payout details, parent or guardian contact, or address on public pages.",
  },
  {
    title: "5. Who we share it with",
    body: (
      <>
        We do not sell personal information. We share it only with service providers that help us run BrushBids, and only what each one needs:
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li><strong>Stripe</strong> for payments, sales tax and artist payouts.</li>
          <li><strong>EasyPost</strong> and shipping carriers to quote shipping and deliver artwork.</li>
          <li><strong>Replit</strong> to host the site and database and provide sign-in.</li>
          <li><strong>OpenAI</strong> to help review artwork submissions and draft descriptions.</li>
          <li>Our <strong>email provider</strong> to send account and order emails.</li>
          <li>The <strong>artist</strong> who sold you a piece receives your name and shipping address so they can ship it.</li>
        </ul>
        We may also disclose information when the law requires it or to protect the safety of our users.
      </>
    ),
  },
  {
    title: "6. Young people",
    body: `Artists must be at least 13. Artists under 18 need a parent or guardian's permission, and their earnings are paid to that parent or guardian. Buyers must be ${MIN_BUYER_AGE} or older. We do not knowingly collect information from children under 13; if you believe a child under 13 has given us information, email us and we will delete it.`,
  },
  {
    title: "7. How long we keep it",
    body: "We keep account information while your account is open. We keep order, payout and tax records for as long as tax and payment laws require, even after an account is closed.",
  },
  {
    title: "8. Your choices",
    body: (
      <>
        You can update your profile and payout details from your dashboard. To get a copy of your information, correct it, or delete your account, email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="underline">{CONTACT_EMAIL}</a>. A parent or guardian of an artist under 18 can make these requests for their child. To leave the drop email list, use the unsubscribe link in any drop email or email us.
      </>
    ),
  },
  {
    title: "9. Security",
    body: "Connections to BrushBids are encrypted, card payments are handled by Stripe, and access to personal information is limited to what is needed to run the platform. No system is perfectly secure, so please use a strong password with your sign-in provider.",
  },
  {
    title: "10. Changes",
    body: "If we change this policy, we will update the date above, and for significant changes we will notify account holders by email.",
  },
];

export default function Privacy() {
  return (
    <Layout>
      <SEOHead title="Privacy Policy | BrushBids" description="What personal information BrushBids collects, how it is used, and the choices you have." />
      <div className="space-y-12 pb-16 max-w-3xl mx-auto px-4 md:px-0">
        <section className="text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[#A78BFA]/10 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8 text-[#A78BFA]" />
          </div>
          <span className="text-xs font-medium text-[#A78BFA] uppercase tracking-[0.3em]">Legal</span>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white">Privacy Policy</h1>
          <p className="text-white/40">Last updated: October 2026</p>
        </section>

        <div className="space-y-8">
          {sections.map(({ title, body }) => (
            <section key={title}>
              <h2 className="text-xl font-display font-bold text-white">{title}</h2>
              <div className="text-white/50 mt-2 leading-relaxed">{body}</div>
            </section>
          ))}
        </div>
      </div>

      <Footer />
    </Layout>
  );
}
