import { Link } from "wouter";
import { Mail, MapPin, Heart } from "lucide-react";
import { SiInstagram, SiX, SiFacebook } from "react-icons/si";
import logoImage from "@/assets/logo.png";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[#e0d6cd] bg-[#f0e6dc] dark:bg-[#1e1a17] dark:border-[#2a2420] mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src={logoImage} alt="BrushBids" className="w-full h-full dark:invert" />
              </div>
              <span className="text-xl font-display font-bold text-[#4C392D] dark:text-foreground">BrushBids</span>
            </Link>
            <p className="text-sm text-[#7a6b5e] dark:text-muted-foreground leading-relaxed">
              The premier marketplace where student artists showcase their talent and collectors discover the next generation of creators.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-9 h-9 rounded-full bg-[#4C392D]/8 dark:bg-white/10 flex items-center justify-center text-[#7a6b5e] dark:text-muted-foreground hover:text-[#4C392D] dark:hover:text-foreground transition-colors" data-testid="link-instagram" aria-label="Instagram">
                <SiInstagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-[#4C392D]/8 dark:bg-white/10 flex items-center justify-center text-[#7a6b5e] dark:text-muted-foreground hover:text-[#4C392D] dark:hover:text-foreground transition-colors" data-testid="link-twitter" aria-label="Twitter">
                <SiX className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-[#4C392D]/8 dark:bg-white/10 flex items-center justify-center text-[#7a6b5e] dark:text-muted-foreground hover:text-[#4C392D] dark:hover:text-foreground transition-colors" data-testid="link-facebook" aria-label="Facebook">
                <SiFacebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-[#4C392D] dark:text-foreground">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/gallery" className="text-[#7a6b5e] dark:text-muted-foreground hover:text-[#4C392D] dark:hover:text-foreground transition-colors" data-testid="link-footer-gallery">
                  Gallery
                </Link>
              </li>
              <li>
                <Link href="/submit-artwork" className="text-[#7a6b5e] dark:text-muted-foreground hover:text-[#4C392D] dark:hover:text-foreground transition-colors" data-testid="link-footer-submit">
                  Submit Artwork
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-[#7a6b5e] dark:text-muted-foreground hover:text-[#4C392D] dark:hover:text-foreground transition-colors" data-testid="link-footer-dashboard">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/my-bids" className="text-[#7a6b5e] dark:text-muted-foreground hover:text-[#4C392D] dark:hover:text-foreground transition-colors" data-testid="link-footer-bids">
                  My Bids
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-[#4C392D] dark:text-foreground">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-[#7a6b5e] dark:text-muted-foreground hover:text-[#4C392D] dark:hover:text-foreground transition-colors" data-testid="link-footer-about">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-[#7a6b5e] dark:text-muted-foreground hover:text-[#4C392D] dark:hover:text-foreground transition-colors" data-testid="link-footer-faq">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-[#7a6b5e] dark:text-muted-foreground hover:text-[#4C392D] dark:hover:text-foreground transition-colors" data-testid="link-footer-terms">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-[#7a6b5e] dark:text-muted-foreground hover:text-[#4C392D] dark:hover:text-foreground transition-colors" data-testid="link-footer-contact">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-[#4C392D] dark:text-foreground">Get in Touch</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-[#7a6b5e] dark:text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>support@brushbids.com</span>
              </li>
              <li className="flex items-center gap-2 text-[#7a6b5e] dark:text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>San Francisco, CA</span>
              </li>
            </ul>
            
            <div className="mt-6 p-3 rounded-lg bg-[#B8965A]/8 dark:bg-[#B8965A]/10 border border-[#B8965A]/15 dark:border-[#B8965A]/20">
              <div className="flex items-center gap-2 text-sm">
                <Heart className="w-4 h-4 text-[#B8965A]" />
                <span className="text-[#7a6b5e] dark:text-muted-foreground">A portion of every sale goes to charity</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[#d6ccc2] dark:border-[#2a2420] mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[#9E8472] dark:text-muted-foreground">
          <p>&copy; {currentYear} BrushBids. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-[#4C392D] dark:hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[#4C392D] dark:hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
