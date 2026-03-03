import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Palette, Heart, DollarSign, Award } from "lucide-react";

const POPUP_DISMISSED_KEY = "brushbids_signup_popup_dismissed";

export function SignupPopup() {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [show, setShow] = useState(false);

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
      <DialogContent className="sm:max-w-md" data-testid="signup-popup">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display text-center">Join the BrushBids Community</DialogTitle>
          <DialogDescription className="text-center text-base mt-2">
            Connect with emerging student artists, discover unique artwork, and support charitable causes.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 my-4">
          {[
            { icon: Palette, label: "Submit & sell your art" },
            { icon: Award, label: "Bid on unique pieces" },
            { icon: Heart, label: "Support charities" },
            { icon: DollarSign, label: "Earn as an artist" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 p-3 rounded-lg bg-[#F9F0EA] text-sm">
              <Icon className="w-4 h-4 text-[#B8965A] flex-shrink-0" />
              <span className="text-[#4C392D]">{label}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Button
            className="w-full rounded-full bg-[#4C392D] hover:bg-[#3a2b22] text-white"
            onClick={() => { handleDismiss(); setLoc("/auth"); }}
            data-testid="button-signup-popup-create"
          >
            Create Free Account
          </Button>
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => handleDismiss(true)}
              data-testid="button-signup-popup-dont-show"
            >
              Don't show again
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => handleDismiss()}
              data-testid="button-signup-popup-dismiss"
            >
              Maybe later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
