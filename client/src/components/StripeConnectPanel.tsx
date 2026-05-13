import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2, CheckCircle2, AlertCircle, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ConnectStatus {
  hasAccount: boolean;
  onboardingComplete: boolean;
  payoutsEnabled: boolean;
}

export default function StripeConnectPanel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [location] = useLocation();

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
        try {
          const body = await res.json();
          if (body?.message) message = body.message;
        } catch { /* non-JSON */ }
        throw new Error(message);
      }
      return res.json() as Promise<{ url: string }>;
    },
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: (err: Error) => {
      toast({ title: "Couldn't start onboarding", description: err.message, variant: "destructive" });
    },
  });

  // When the user returns from Stripe (?stripe=return), pull a fresh status.
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
    <div className="rounded-xl bg-white/[0.02] border border-white/5 p-5" data-testid="panel-stripe-connect">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${ready ? "bg-emerald-500/10 text-emerald-400" : "bg-[#A78BFA]/10 text-[#A78BFA]"}`}>
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
    </div>
  );
}
