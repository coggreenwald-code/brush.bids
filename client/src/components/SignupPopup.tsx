import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";

const POPUP_DISMISSED_KEY = "brushbids_signup_popup_dismissed";

export function SignupPopup() {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated || location !== "/") return;
    try {
      if (localStorage.getItem(POPUP_DISMISSED_KEY)) return;
    } catch {}

    const timer = setTimeout(() => {
      setShow(true);
    }, 20000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, location]);

  const handleDismiss = (dontShowAgain?: boolean) => {
    setShow(false);
    if (dontShowAgain) {
      try {
        localStorage.setItem(POPUP_DISMISSED_KEY, "true");
      } catch {}
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    setError("");
    try {
      await apiRequest("POST", "/api/drop-signups", { email });
      setStatus("done");
      try {
        localStorage.setItem(POPUP_DISMISSED_KEY, "true");
      } catch {}
    } catch (err: any) {
      setStatus("error");
      setError(err?.message?.replace(/^\d+:\s*/, "") || "Something went wrong. Please try again.");
    }
  };

  if (isAuthenticated) return null;

  return (
    <Dialog open={show} onOpenChange={(open) => { if (!open) handleDismiss(); }}>
      <DialogContent className="sm:max-w-md p-8 bg-white border border-gray-200 shadow-2xl" data-testid="signup-popup">
        {status === "done" ? (
          <div className="flex flex-col items-center text-center space-y-4">
            <h2 className="text-2xl font-display font-bold text-[#0a0a0f]">You're on the list</h2>
            <p className="text-sm text-gray-500">We'll email you when the next drop of student work goes live.</p>
            <Button className="w-full rounded-full bg-[#0a0a0f] text-white font-semibold text-base py-5 hover:bg-[#0a0a0f]/90" onClick={() => handleDismiss(true)}>
              Keep browsing
            </Button>
          </div>
        ) : (
          <form className="flex flex-col items-center text-center space-y-4" onSubmit={handleSubmit}>
            <h2 className="text-2xl font-display font-bold text-[#0a0a0f]" data-testid="text-popup-title">
              Get notified of the next drop
            </h2>

            <p className="text-sm text-gray-500" data-testid="text-popup-description">
              New work from student artists, released in small drops. One email when it goes live.
            </p>

            <Input
              type="email"
              required
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border-gray-200 text-[#0a0a0f] placeholder:text-gray-400 focus-visible:ring-[#A78BFA]"
              data-testid="input-popup-email"
            />

            {status === "error" && <p className="text-sm text-red-600">{error}</p>}

            <Button
              type="submit"
              disabled={status === "saving"}
              className="w-full rounded-full bg-[#0a0a0f] text-white font-semibold text-base py-5 hover:bg-[#0a0a0f]/90"
              data-testid="button-popup-notify"
            >
              {status === "saving" ? "Saving..." : "Notify me"}
            </Button>

            <button
              type="button"
              className="text-xs font-bold underline text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              onClick={() => handleDismiss(true)}
              data-testid="button-popup-reject"
            >
              No thanks
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
