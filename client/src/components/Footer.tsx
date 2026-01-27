import { Link } from "wouter";
import { Gavel, Mail, MapPin } from "lucide-react";
import { SiInstagram, SiX, SiFacebook } from "react-icons/si";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-card mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Gavel className="w-6 h-6 text-primary" />
              <span className="text-xl font-display font-bold">BrushBids</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              The premier marketplace where student artists showcase their talent and collectors discover the next generation of creators.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-instagram" aria-label="Instagram">
                <SiInstagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-twitter" aria-label="Twitter">
                <SiX className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-facebook" aria-label="Facebook">
                <SiFacebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/gallery" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-gallery">
                  Gallery
                </Link>
              </li>
              <li>
                <Link href="/submit-artwork" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-submit">
                  Submit Artwork
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-dashboard">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/my-bids" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-bids">
                  My Bids
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-about">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-faq">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-terms">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-contact">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Get in Touch</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>support@brushbids.com</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>San Francisco, CA</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>&copy; {currentYear} BrushBids. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
