import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, ExternalLink } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type PendingPayout = {
  id: number;
  bidId: number;
  artworkId: number;
  artistId: string;
  amount: string;
  method: "paypal" | "venmo" | "zelle";
  handle: string;
  recipientEmail: string | null;
  forMinor: boolean;
  status: "pending" | "paid" | "skipped";
  createdAt: string;
  artistFirstName: string | null;
  artistLastName: string | null;
  artistEmail: string | null;
  artworkTitle: string;
};

const methodLink = (m: PendingPayout["method"], handle: string): string | null => {
  // Best-effort deep links — fine if some don't open (Zelle has no public URL).
  if (m === "paypal") return `https://www.paypal.com/paypalme/${encodeURIComponent(handle.replace(/^@/, ""))}`;
  if (m === "venmo") return `https://venmo.com/${encodeURIComponent(handle.replace(/^@/, ""))}`;
  return null;
};

export function AdminPayoutsTab() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"pending" | "paid">("pending");
  const { data: payouts, isLoading } = useQuery<PendingPayout[]>({
    queryKey: ["/api/admin/payouts", tab],
    queryFn: async () => {
      const res = await fetch(`/api/admin/payouts?status=${tab}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load payouts");
      return res.json();
    },
  });

  const markPaid = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/admin/payouts/${id}/mark-paid`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Marked as paid" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payouts"] });
    },
    onError: (e: Error) => toast({ title: "Couldn't update payout", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["pending", "paid"] as const).map((t) => (
          <Button
            key={t}
            variant={tab === t ? "default" : "outline"}
            onClick={() => setTab(t)}
            className={tab === t ? "rounded-full bg-white text-[#0a0a0f] hover:bg-white/90" : "rounded-full border-white/15 text-white"}
            data-testid={`tab-payouts-${t}`}
          >
            {t === "pending" ? "Pending" : "Paid"}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-white/60"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
      ) : !payouts || payouts.length === 0 ? (
        <Card className="bg-white/[0.02] border-white/5">
          <CardContent className="p-6 text-white/60 text-center">
            {tab === "pending" ? "No pending payouts right now." : "No payouts have been marked paid yet."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {payouts.map((p) => {
            const link = methodLink(p.method, p.handle);
            const artist = [p.artistFirstName, p.artistLastName].filter(Boolean).join(" ") || p.artistEmail || p.artistId;
            return (
              <Card key={p.id} className="bg-white/[0.02] border-white/5" data-testid={`row-payout-${p.id}`}>
                <CardContent className="p-4 flex flex-wrap items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-white">{artist}</span>
                      {p.forMinor && (
                        <Badge variant="outline" className="border-amber-500/40 text-amber-300">Minor — paying parent</Badge>
                      )}
                      <span className="text-white/40 text-sm">· "{p.artworkTitle}"</span>
                    </div>
                    <div className="text-sm text-white/60 mt-1">
                      Send <span className="text-emerald-300 font-semibold">${p.amount}</span> via {p.method.toUpperCase()} to{" "}
                      <span className="text-white">{p.handle}</span>
                      {p.recipientEmail && p.recipientEmail !== p.handle && (
                        <> (notify {p.recipientEmail})</>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {link && (
                      <a href={link} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="rounded-full border-white/15 text-white" data-testid={`button-open-${p.method}-${p.id}`}>
                          Open {p.method} <ExternalLink className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </a>
                    )}
                    {tab === "pending" && (
                      <Button
                        onClick={() => markPaid.mutate(p.id)}
                        disabled={markPaid.isPending}
                        className="rounded-full bg-emerald-500 text-[#0a0a0f] hover:bg-emerald-400"
                        data-testid={`button-mark-paid-${p.id}`}
                      >
                        <Check className="w-4 h-4 mr-1" /> Mark paid
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
