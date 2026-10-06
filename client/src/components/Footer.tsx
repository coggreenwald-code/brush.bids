import { Link } from "wouter";
import { Mail, MapPin } from "lucide-react";
import { SiInstagram, SiX, SiFacebook } from "react-icons/si";
import { SOCIAL_URLS, CONTACT_EMAIL } from "@shared/siteConfig";
import logoImage from "@assets/BrushBids_Logo_1772561349423.png";

const FOOTER_SOCIALS = [
  { Icon: SiInstagram, href: SOCIAL_URLS.instagram, label: "Instagram" },
  { Icon: SiX, href: SOCIAL_URLS.x, label: "X" },
  { Icon: SiFacebook, href: SOCIAL_URLS.facebook, label: "Facebook" },
].filter((s) => s.href);

function OutlinedBrushBidsLogo() {
  return (
    <div className="w-full flex items-center justify-center gap-0 py-12 select-none group">
      <span
        className="text-[4rem] md:text-[7rem] lg:text-[9rem] font-extrabold tracking-tight leading-none opacity-[0.08] group-hover:opacity-[0.15] transition-opacity duration-700"
        style={{
          WebkitTextStroke: "1.5px white",
          color: "transparent",
        }}
      >
        BrushBids
      </span>
      <img
        src={logoImage}
        alt=""
        className="brightness-0 invert opacity-[0.08] group-hover:opacity-[0.15] transition-opacity duration-700 flex-shrink-0"
        draggable={false}
        style={{ width: "clamp(120px, 18vw, 240px)", height: "clamp(120px, 18vw, 240px)", marginLeft: "-50px" }}
      />
    </div>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/5 bg-[#08080d] mt-auto bg-mesh-purple">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 py-16">
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-widest mb-6">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/" className="text-white/40 hover:text-white transition-colors duration-200" data-testid="link-footer-home">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="text-white/40 hover:text-white transition-colors duration-200" data-testid="link-footer-gallery">
                  Gallery
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-white/40 hover:text-white transition-colors duration-200" data-testid="link-footer-about">
                  About
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-white/40 hover:text-white transition-colors duration-200" data-testid="link-footer-faq">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-widest mb-6">Resources</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/submit-artwork" className="text-white/40 hover:text-white transition-colors duration-200" data-testid="link-footer-submit">
                  Submit Artwork
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-white/40 hover:text-white transition-colors duration-200" data-testid="link-footer-dashboard">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-white/40 hover:text-white transition-colors duration-200" data-testid="link-footer-terms">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-widest mb-6">Get in Touch</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/contact" className="text-white/40 hover:text-white transition-colors duration-200" data-testid="link-footer-contact">
                  Contact Us
                </Link>
              </li>
              <li className="flex items-center gap-2 text-white/40">
                <Mail className="w-4 h-4" />
                <span>{CONTACT_EMAIL}</span>
              </li>
              <li className="flex items-center gap-2 text-white/40">
                <MapPin className="w-4 h-4" />
                <span>New York, NY</span>
              </li>
            </ul>
            {FOOTER_SOCIALS.length > 0 && (
              <div className="flex gap-3 mt-6">
                {FOOTER_SOCIALS.map(({ Icon, href, label }) => (
                  <a key={label} href={href} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white/30 hover:text-white hover:border-white/30 transition-all duration-200" data-testid={`link-${label.toLowerCase()}`} aria-label={label}>
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="divider-line" />

        <OutlinedBrushBidsLogo />

        <div className="divider-line" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 py-8 text-xs text-white/30">
          <p>&copy; {currentYear} BrushBids. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white/60 transition-colors duration-200">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white/60 transition-colors duration-200">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
