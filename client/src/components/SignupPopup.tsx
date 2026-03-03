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
      <DialogContent className="sm:max-w-md p-8 bg-white border border-gray-200 shadow-2xl" data-testid="signup-popup">
        <div className="flex flex-col items-center text-center space-y-4">
          <h2 className="text-2xl font-display font-bold text-[#0a0a0f]" data-testid="text-popup-title">
            Get 5% Off Your First Purchase
          </h2>

          <p className="text-sm text-gray-500" data-testid="text-popup-description">
            Enter your email. Get your 5% off code. Be the first to know about all things BrushBids.
          </p>

          <Input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-gray-50 border-gray-200 text-[#0a0a0f] placeholder:text-gray-400 focus-visible:ring-[#A78BFA]"
            data-testid="input-popup-email"
          />

          <Button
            className="w-full rounded-full bg-[#0a0a0f] text-white font-semibold text-base py-5 hover:bg-[#0a0a0f]/90"
            onClick={() => { handleDismiss(true); setLoc("/auth"); }}
            data-testid="button-popup-get-discount"
          >
            Get my 5% off
          </Button>

          <button
            className="text-xs font-bold underline text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
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
