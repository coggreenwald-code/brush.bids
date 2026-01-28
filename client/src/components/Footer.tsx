import { Link } from "wouter";
import { Brush, Mail, MapPin, Heart } from "lucide-react";
import { SiInstagram, SiX, SiFacebook } from "react-icons/si";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-[#1F4959] text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Brush className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-display font-bold">BrushBids</span>
            </Link>
            <p className="text-sm text-white/70 leading-relaxed">
              The premier marketplace where student artists showcase their talent and collectors discover the next generation of creators.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-colors" data-testid="link-instagram" aria-label="Instagram">
                <SiInstagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-colors" data-testid="link-twitter" aria-label="Twitter">
                <SiX className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-colors" data-testid="link-facebook" aria-label="Facebook">
                <SiFacebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/gallery" className="text-white/70 hover:text-white transition-colors" data-testid="link-footer-gallery">
                  Gallery
                </Link>
              </li>
              <li>
                <Link href="/submit-artwork" className="text-white/70 hover:text-white transition-colors" data-testid="link-footer-submit">
                  Submit Artwork
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-white/70 hover:text-white transition-colors" data-testid="link-footer-dashboard">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/my-bids" className="text-white/70 hover:text-white transition-colors" data-testid="link-footer-bids">
                  My Bids
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-white/70 hover:text-white transition-colors" data-testid="link-footer-about">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-white/70 hover:text-white transition-colors" data-testid="link-footer-faq">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-white/70 hover:text-white transition-colors" data-testid="link-footer-terms">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-white/70 hover:text-white transition-colors" data-testid="link-footer-contact">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Get in Touch</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-white/70">
                <Mail className="w-4 h-4" />
                <span>support@brushbids.com</span>
              </li>
              <li className="flex items-center gap-2 text-white/70">
                <MapPin className="w-4 h-4" />
                <span>San Francisco, CA</span>
              </li>
            </ul>
            
            {/* Charity Note */}
            <div className="mt-6 p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-sm">
                <Heart className="w-4 h-4 text-[#5C7C89]" />
                <span className="text-white/70">15% of every sale goes to charity</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/60">
          <p>&copy; {currentYear} BrushBids. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
