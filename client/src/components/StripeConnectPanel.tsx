import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2, CheckCircle2, AlertCircle, Wallet, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConnectStatus {
  hasAccount: boolean;
  onboardingComplete: boolean;
  payoutsEnabled: boolean;
}

class OnboardError extends Error {
  stripeCode?: string;
  constructor(message: string, stripeCode?: string) {
    super(message);
    this.stripeCode = stripeCode;
  }
}

const PLATFORM_CODES = new Set([
  "account_invalid",
  "platform_api_key_expired",
  "api_key_expired",
  "live_mode_not_enabled",
]);

function isPlatformError(err: OnboardError): boolean {
  if (err.stripeCode && PLATFORM_CODES.has(err.stripeCode)) return true;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("platform profile") ||
    msg.includes("live mode") ||
    msg.includes("business profile") ||
    msg.includes("connect is not fully configured") ||
    msg.includes("not yet enabled") ||
    msg.includes("platform owner")
  );
}

export default function StripeConnectPanel() {
  const queryClient = useQueryClient();
  const [location] = useLocation();

  const [connectError, setConnectError] = useState<{
    message: string;
    type: "platform" | "artist";
  } | null>(null);

  const { data: status, isLoading } = useQuery<ConnectStatus>({
    queryKey: ["/api/stripe/connect/status"],
    staleTime: 0,
    refetchOnMount: "always",
  });

  const refresh = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/stripe/connect/refresh-status", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to refresh status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stripe/connect/status"] });
    },
  });

  const onboard = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/stripe/connect/onboard", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        let message = "Failed to start onboarding";
        let stripeCode: string | undefined;
        try {
          const body = await res.json();
          if (body?.message) message = body.message;
          if (body?.stripeCode) stripeCode = body.stripeCode;
        } catch { /* non-JSON */ }
        throw new OnboardError(message, stripeCode);
      }
      return res.json() as Promise<{ url: string }>;
    },
    onSuccess: ({ url }) => {
      setConnectError(null);
      window.location.href = url;
    },
    onError: (err: OnboardError) => {
      setConnectError({
        message: err.message,
        type: isPlatformError(err) ? "platform" : "artist",
      });
    },
  });

  useEffect(() => {
    if (location.includes("stripe=return") || location.includes("stripe=refresh")) {
      refresh.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  if (isLoading) {
    return (
      <div className="rounded-xl bg-white/[0.02] border border-white/5 p-5 flex items-center gap-3">
        <Loader2 className="w-4 h-4 animate-spin text-white/40" />
        <span className="text-sm text-white/50">Loading payout status…</span>
      </div>
    );
  }

  const ready = status?.onboardingComplete && status?.payoutsEnabled;

  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/5 p-5 space-y-4" data-testid="panel-stripe-connect">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${ready ? "bg-emerald-500/10 text-emerald-400" : "bg-[#A78BFA]/10 text-[#A78BFA]"}`}>
            {ready ? <CheckCircle2 className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-semibold text-white">Artist Payouts</h3>
            <p className="text-sm text-white/50 mt-1 max-w-md">
              {ready
                ? "Your Stripe account is connected. When a buyer wins your auction we'll automatically send your share to your bank."
                : status?.hasAccount
                ? "You started Stripe onboarding but haven't finished. Complete it to start accepting bids."
                : "Connect a Stripe account to receive payouts. Buyers can't bid on your artwork until this is set up."}
            </p>
            {status && !ready && (
              <div className="flex items-center gap-2 mt-2 text-xs text-white/40">
                <AlertCircle className="w-3.5 h-3.5" />
                Onboarding: {status.onboardingComplete ? "complete" : "incomplete"} • Payouts: {status.payoutsEnabled ? "enabled" : "disabled"}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status?.hasAccount && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-white/10 text-white/70 hover:bg-white/5"
              onClick={() => refresh.mutate()}
              disabled={refresh.isPending}
              data-testid="button-refresh-stripe-status"
            >
              {refresh.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
              Refresh
            </Button>
          )}
          {!ready && (
            <Button
              size="sm"
              className="rounded-full bg-white text-[#0a0a0f] hover:bg-white/90"
              onClick={() => onboard.mutate()}
              disabled={onboard.isPending}
              data-testid="button-stripe-onboard"
            >
              {onboard.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
              {status?.hasAccount ? "Continue setup" : "Connect Stripe"}
            </Button>
          )}
        </div>
      </div>

      {connectError && (
        <div
          className={`flex items-start gap-3 rounded-lg p-4 text-sm ${
            connectError.type === "platform"
              ? "bg-blue-500/10 border border-blue-500/20 text-blue-300"
              : "bg-amber-500/10 border border-amber-500/20 text-amber-300"
          }`}
          data-testid="stripe-connect-error"
        >
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            {connectError.type === "platform" ? (
              <>
                <p className="font-medium text-blue-200">We're finishing our payment setup</p>
                <p className="mt-1 text-blue-300/80">
                  Our platform is still being verified with Stripe — this is on our end, not yours.
                  Everything will be ready soon. Check back in a little while or contact us if this persists.
                </p>
              </>
            ) : (
              <>
                <p className="font-medium text-amber-200">Couldn't reach Stripe</p>
                <p className="mt-1 text-amber-300/80">{connectError.message}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 rounded-full border-amber-500/30 text-amber-200 hover:bg-amber-500/10 h-7 px-3 text-xs"
                  onClick={() => onboard.mutate()}
                  disabled={onboard.isPending}
                  data-testid="button-stripe-retry"
                >
                  {onboard.isPending && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                  Continue setup
                </Button>
              </>
            )}
          </div>
          <button
            onClick={() => setConnectError(null)}
            className="text-white/40 hover:text-white/70 transition-colors shrink-0"
            aria-label="Dismiss"
            data-testid="button-dismiss-stripe-error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
