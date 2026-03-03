import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const POPUP_DISMISSED_KEY = "brushbids_signup_popup_dismissed";

export function SignupPopup() {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (isAuthenticated || location !== "/") return;
    if (localStorage.getItem(POPUP_DISMISSED_KEY)) return;

    const timer = setTimeout(() => {
      setShow(true);
    }, 20000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, location]);

  const handleDismiss = (dontShowAgain?: boolean) => {
    setShow(false);
    if (dontShowAgain) {
      localStorage.setItem(POPUP_DISMISSED_KEY, "true");
    }
  };

  const [, setLoc] = useLocation();

  if (isAuthenticated) return null;

  return (
    <Dialog open={show} onOpenChange={(open) => { if (!open) handleDismiss(); }}>
      <DialogContent className="sm:max-w-md p-8" data-testid="signup-popup">
        <div className="flex flex-col items-center text-center space-y-4">
          <h2 className="text-2xl font-display font-bold text-[#E8C874]" data-testid="text-popup-title">
            Get 5% Off Your First Purchase
          </h2>

          <p className="text-sm text-[#4C392D]" data-testid="text-popup-description">
            Enter your email. Get your 5% off code. Be the first to know about all things BrushBids.
          </p>

          <Input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border-[#9E8472]/40 focus-visible:ring-[#E8C874]"
            data-testid="input-popup-email"
          />

          <Button
            className="w-full rounded-full bg-[#E8C874] hover:bg-[#d4b563] text-[#4C392D] font-semibold text-base py-5"
            onClick={() => { handleDismiss(true); setLoc("/auth"); }}
            data-testid="button-popup-get-discount"
          >
            Get my 5% off
          </Button>

          <button
            className="text-xs font-bold underline text-[#4C392D]/70 hover:text-[#4C392D] transition-colors cursor-pointer"
            onClick={() => handleDismiss(true)}
            data-testid="button-popup-reject"
          >
            Reject my 5% off
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
