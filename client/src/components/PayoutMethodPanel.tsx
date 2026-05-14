import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Wallet, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

type PayoutMethod = "paypal" | "venmo" | "zelle";

type PayoutStatus = {
  ready: boolean;
  isMinor: boolean;
  method: "stripe" | PayoutMethod | null;
  handle: string | null;
  forMinor: boolean;
  adultUpgradeAvailable: boolean;
};

// Primary payout settings panel. Drives the manual (PayPal/Venmo/Zelle) handle
// path that's now the default for new artists. Stripe Connect is handled by
// the separate StripeConnectPanel as an *optional upgrade*.
export default function PayoutMethodPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: status } = useQuery<PayoutStatus>({
    queryKey: ["/api/users/me/payout-status"],
    enabled: !!user,
    staleTime: 0,
  });

  const [method, setMethod] = useState<PayoutMethod | "">("");
  const [handle, setHandle] = useState("");
  const [dob, setDob] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentMethod, setParentMethod] = useState<PayoutMethod | "">("");
  const [parentHandle, setParentHandle] = useState("");
  const [parentTermsAccepted, setParentTermsAccepted] = useState(false);

  // Hydrate from user when it loads.
  useEffect(() => {
    if (!user) return;
    setMethod((user.payoutMethod as PayoutMethod | null) || "");
    setHandle(user.payoutHandle || "");
    setDob(user.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : "");
    setParentEmail(user.parentGuardianEmail || "");
    setParentMethod((user.parentPayoutMethod as PayoutMethod | null) || "");
    setParentHandle(user.parentPayoutHandle || "");
    setParentTermsAccepted(!!user.parentTermsAcceptedAt);
  }, [user]);

  // Compute minor purely from the locally entered DOB so the form responds
  // immediately to changes (the server-side flag only updates on save).
  const enteredAge = dob ? Math.floor((Date.now() - new Date(dob + "T00:00:00").getTime()) / (365.25 * 24 * 3600 * 1000)) : null;
  const minor = enteredAge !== null && enteredAge < 18;

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const body: Record<string, unknown> = {};
      if (dob) body.dateOfBirth = dob;
      if (minor) {
        body.payoutMethod = null;
        body.payoutHandle = null;
        body.parentGuardianEmail = parentEmail || null;
        body.parentPayoutMethod = parentMethod || null;
        body.parentPayoutHandle = parentHandle || null;
        body.parentTermsAccepted = parentTermsAccepted;
      } else {
        body.payoutMethod = method || null;
        body.payoutHandle = handle || null;
      }
      const res = await apiRequest("PATCH", `/api/users/${user.id}/payout-settings`, body);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Payout details saved" });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/payout-status"] });
    },
    onError: (e: Error) => toast({ title: "Couldn't save", description: e.message, variant: "destructive" }),
  });

  const canSave = !!dob && (
    minor
      ? !!parentEmail && !!parentMethod && !!parentHandle && parentTermsAccepted
      : !!method && !!handle
  );

  const isStripe = status?.method === "stripe";

  return (
    <Card className="bg-white/[0.02] border-white/5" data-testid="card-payout-method">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Wallet className="w-5 h-5 text-[#A78BFA]" /> Payout details
          {status?.ready && (
            <Badge className="ml-2 bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Ready
            </Badge>
          )}
          {status && !status.ready && (
            <Badge variant="outline" className="ml-2 border-white/20 text-white/50">
              <AlertCircle className="w-3 h-3 mr-1" /> Optional
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isStripe ? (
          <p className="text-sm text-white/70">
            You're set up with Stripe — payouts go directly to your connected bank account on each sale.
            You can add a backup PayPal/Venmo/Zelle handle below if you'd like.
          </p>
        ) : (
          <p className="text-sm text-white/60">
            Set up your payout method to receive earnings when your artwork sells. You can submit and list artwork right away — add your PayPal, Venmo, or Zelle details here and we'll send your share once a sale is complete.
          </p>
        )}

        {status?.adultUpgradeAvailable && (
          <div className="rounded-lg border border-[#A78BFA]/40 bg-[#A78BFA]/10 p-3 text-sm text-white">
            You're 18 now — you can switch payouts to your own account below instead of your parent or guardian's.
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="payout-dob" className="text-white/60">Date of birth</Label>
          <Input
            id="payout-dob"
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="bg-white/5 border-white/10 text-white"
            data-testid="input-payout-dob"
          />
          <p className="text-xs text-white/40">
            We use this to keep under-18 artists' earnings flowing through a parent or guardian.
          </p>
        </div>

        {!minor && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-white/60">Method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as PayoutMethod)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white" data-testid="select-payout-method">
                  <SelectValue placeholder="Choose…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="venmo">Venmo</SelectItem>
                  <SelectItem value="zelle">Zelle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-white/60">Handle / email</Label>
              <Input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="e.g. @yourname or you@email.com"
                className="bg-white/5 border-white/10 text-white"
                data-testid="input-payout-handle"
              />
            </div>
          </div>
        )}

        {minor && (
          <div className="space-y-3 rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <p className="text-sm text-white/80 font-medium">Parent / guardian payout</p>
            <p className="text-xs text-white/50">
              Because you're under 18, your earnings will be sent to your parent or guardian's account
              until your 18th birthday.
            </p>
            <div className="space-y-2">
              <Label className="text-white/60">Parent / guardian email</Label>
              <Input
                type="email"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                placeholder="parent@email.com"
                className="bg-white/5 border-white/10 text-white"
                data-testid="input-parent-email"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-white/60">Parent payout method</Label>
                <Select value={parentMethod} onValueChange={(v) => setParentMethod(v as PayoutMethod)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white" data-testid="select-parent-method">
                    <SelectValue placeholder="Choose…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="venmo">Venmo</SelectItem>
                    <SelectItem value="zelle">Zelle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-white/60">Parent handle / email</Label>
                <Input
                  value={parentHandle}
                  onChange={(e) => setParentHandle(e.target.value)}
                  placeholder="e.g. @parent or parent@email.com"
                  className="bg-white/5 border-white/10 text-white"
                  data-testid="input-parent-handle"
                />
              </div>
            </div>
            <label className="flex items-start gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                className="mt-1"
                checked={parentTermsAccepted}
                onChange={(e) => setParentTermsAccepted(e.target.checked)}
                data-testid="checkbox-parent-terms"
              />
              <span>
                My parent or guardian has read and agreed to the BrushBids seller terms and is aware
                that auction proceeds will be sent to the account above.
              </span>
            </label>
          </div>
        )}

        <Button
          onClick={() => save.mutate()}
          disabled={!canSave || save.isPending}
          className="rounded-full bg-white text-[#0a0a0f] hover:bg-white/90"
          data-testid="button-save-payout"
        >
          {save.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : "Save payout details"}
        </Button>
      </CardContent>
    </Card>
  );
}
