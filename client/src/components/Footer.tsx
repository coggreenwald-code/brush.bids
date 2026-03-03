import { Link } from "wouter";
import { Mail, MapPin } from "lucide-react";
import { SiInstagram, SiX, SiFacebook } from "react-icons/si";

function OutlinedBrushBidsLogo() {
  return (
    <div className="w-full flex justify-center py-12">
      <svg
        viewBox="0 0 900 120"
        className="w-full max-w-4xl h-auto opacity-[0.08] hover:opacity-[0.15] transition-opacity duration-700"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g stroke="white" strokeWidth="1.5">
          <path d="M30 95V25h30c12 0 20 3 25 8s8 12 8 20-3 15-8 20-13 8-25 8H45v14H30zm15-28h15c7 0 12-2 16-5s5-8 5-14-2-11-5-14-9-5-16-5H45v38z" />
          <path d="M105 95V25h30c10 0 18 3 23 8s7 10 7 17c0 5-1 10-4 14s-7 7-12 9l20 22h-18l-18-20h-13v20h-15zm15-34h14c6 0 10-1 13-4s5-7 5-11-2-8-5-11-7-4-13-4h-14v30z" />
          <path d="M185 95V25h15v42c0 8 2 14 5 17s8 5 14 5 11-2 14-5 5-9 5-17V25h15v45c0 10-3 18-10 24s-15 8-24 8-17-3-24-8-10-14-10-24z" />
          <path d="M285 82l11-7c2 5 5 9 9 11s8 4 14 4c5 0 10-1 13-4s5-6 5-10c0-3-1-6-3-8s-7-5-14-7c-9-3-16-7-20-11s-6-9-6-16c0-5 1-9 4-13s6-7 11-9 10-3 15-3c7 0 13 2 18 5s9 8 11 14l-11 6c-2-4-4-7-7-9s-7-3-11-3c-5 0-9 1-12 4s-4 5-4 9c0 3 1 5 3 7s7 5 14 7c9 4 16 7 20 12s6 10 6 16c0 5-1 10-4 14s-7 7-12 10-10 3-16 3c-8 0-15-2-20-6s-10-9-12-17z" />
          <path d="M400 95V25h15v28h35V25h15v70h-15V67h-35v28h-15z" />
          <path d="M495 95V25h30c10 0 18 3 23 8s7 10 7 17c0 5-1 10-4 14s-7 7-12 9l20 22h-18l-18-20h-13v20h-15zm15-34h14c6 0 10-1 13-4s5-7 5-11-2-8-5-11-7-4-13-4h-14v30z" />
          <path d="M580 95V25h15v56h33v14h-48z" />
          <path d="M650 95V25h15v70h-15z" />
          <path d="M695 95V25h25c10 0 19 2 27 7s14 11 18 19 6 17 6 26-2 18-6 26-10 14-18 19-17 7-27 7h-25zm15-14h10c7 0 13-2 19-5s10-8 13-14 4-13 4-21-1-15-4-21-7-11-13-14-12-5-19-5h-10v56z" />
          <path d="M800 82l11-7c2 5 5 9 9 11s8 4 14 4c5 0 10-1 13-4s5-6 5-10c0-3-1-6-3-8s-7-5-14-7c-9-3-16-7-20-11s-6-9-6-16c0-5 1-9 4-13s6-7 11-9 10-3 15-3c7 0 13 2 18 5s9 8 11 14l-11 6c-2-4-4-7-7-9s-7-3-11-3c-5 0-9 1-12 4s-4 5-4 9c0 3 1 5 3 7s7 5 14 7c9 4 16 7 20 12s6 10 6 16c0 5-1 10-4 14s-7 7-12 10-10 3-16 3c-8 0-15-2-20-6s-10-9-12-17z" />
        </g>
      </svg>
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
                <span>support@brushbids.com</span>
              </li>
              <li className="flex items-center gap-2 text-white/40">
                <MapPin className="w-4 h-4" />
                <span>New York, NY</span>
              </li>
            </ul>
            <div className="flex gap-3 mt-6">
              <a href="#" className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white/30 hover:text-white hover:border-white/30 transition-all duration-200" data-testid="link-instagram" aria-label="Instagram">
                <SiInstagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white/30 hover:text-white hover:border-white/30 transition-all duration-200" data-testid="link-twitter" aria-label="Twitter">
                <SiX className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white/30 hover:text-white hover:border-white/30 transition-all duration-200" data-testid="link-facebook" aria-label="Facebook">
                <SiFacebook className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="divider-line" />

        <OutlinedBrushBidsLogo />

        <div className="divider-line" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 py-8 text-xs text-white/30">
          <p>&copy; {currentYear} BrushBids. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-white/60 transition-colors duration-200">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white/60 transition-colors duration-200">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
