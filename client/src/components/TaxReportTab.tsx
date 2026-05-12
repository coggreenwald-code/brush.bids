import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Download, Receipt, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TaxSummaryRow = {
  month: string;
  state: string;
  taxableAmount: number;
  taxAmount: number;
  saleCount: number;
};

type TaxSaleRow = {
  bidId: number;
  artworkId: number;
  artworkTitle: string;
  bidderId: string;
  capturedAt: string | null;
  amount: number;
  taxableAmount: number;
  taxAmount: number;
  taxRate: number;
  shippingState: string;
  shippingCity: string;
  shippingPostalCode: string;
  taxJurisdiction: string;
  stripePaymentIntentId: string | null;
  stripeTaxTransactionId: string | null;
};

type TaxReportResponse = {
  summary: TaxSummaryRow[];
  sales: TaxSaleRow[];
  totals: { taxableAmount: number; taxAmount: number; saleCount: number };
};

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export function TaxReportTab() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    const s = p.toString();
    return s ? `?${s}` : "";
  }, [from, to]);

  const { data, isLoading, error } = useQuery<TaxReportResponse>({
    queryKey: ["/api/admin/tax-report", from, to],
    queryFn: async () => {
      const res = await fetch(`/api/admin/tax-report${queryString}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load tax report");
      return res.json();
    },
  });

  const handleExport = () => {
    window.open(`/api/admin/tax-report.csv${queryString}`, "_blank");
  };

  const stateTotals = useMemo(() => {
    if (!data) return [] as Array<{ state: string; tax: number; taxable: number; count: number }>;
    const map = new Map<string, { state: string; tax: number; taxable: number; count: number }>();
    for (const r of data.summary) {
      const key = r.state || "—";
      const cur = map.get(key) || { state: key, tax: 0, taxable: 0, count: 0 };
      cur.tax += r.taxAmount;
      cur.taxable += r.taxableAmount;
      cur.count += r.saleCount;
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.tax - a.tax);
  }, [data]);

  return (
    <div className="space-y-6" data-testid="tab-tax-report">
      <div className="flex flex-wrap items-end gap-3 p-4 rounded-lg border border-white/5 bg-white/[0.02]">
        <div className="space-y-1">
          <Label className="text-xs text-white/50 uppercase tracking-widest">From</Label>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="bg-white/5 border-white/10 text-white"
            data-testid="input-tax-from"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-white/50 uppercase tracking-widest">To</Label>
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="bg-white/5 border-white/10 text-white"
            data-testid="input-tax-to"
          />
        </div>
        <Button
          variant="outline"
          className="rounded-full border-white/10 text-white/70 ml-auto"
          onClick={handleExport}
          data-testid="button-export-tax-csv"
        >
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-white/40" />
        </div>
      ) : error ? (
        <div className="p-6 rounded-lg border border-red-500/20 bg-red-500/5 text-red-300" data-testid="text-tax-error">
          Failed to load tax report.
        </div>
      ) : !data || data.sales.length === 0 ? (
        <div className="p-12 text-center rounded-lg border border-dashed border-white/10 bg-white/[0.02]">
          <Receipt className="w-10 h-10 mx-auto mb-3 text-white/30" />
          <p className="text-white/60">No tax has been collected in this range yet.</p>
          <p className="text-xs text-white/40 mt-2">
            Tax populates here once a winning bid is captured for a buyer in a registered jurisdiction.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-5 rounded-lg border border-white/5 bg-white/[0.02]">
              <p className="text-xs text-white/40 uppercase tracking-widest">Tax Collected</p>
              <p className="font-mono text-2xl font-bold text-emerald-400 mt-1" data-testid="text-tax-total">
                {fmt(data.totals.taxAmount)}
              </p>
            </div>
            <div className="p-5 rounded-lg border border-white/5 bg-white/[0.02]">
              <p className="text-xs text-white/40 uppercase tracking-widest">Taxable Sales</p>
              <p className="font-mono text-2xl font-bold text-white mt-1" data-testid="text-taxable-total">
                {fmt(data.totals.taxableAmount)}
              </p>
            </div>
            <div className="p-5 rounded-lg border border-white/5 bg-white/[0.02]">
              <p className="text-xs text-white/40 uppercase tracking-widest">Sales w/ Tax</p>
              <p className="font-mono text-2xl font-bold text-white mt-1" data-testid="text-sale-count">
                {data.totals.saleCount}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-[#A78BFA] uppercase tracking-[0.3em] flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" /> By State
              </h3>
              <div className="rounded-lg border border-white/5 bg-white/[0.02] divide-y divide-white/5">
                {stateTotals.map((s) => (
                  <div
                    key={s.state}
                    className="flex items-center justify-between p-3"
                    data-testid={`row-state-${s.state}`}
                  >
                    <div>
                      <p className="font-mono text-white">{s.state}</p>
                      <p className="text-xs text-white/40">{s.count} sale{s.count === 1 ? "" : "s"} · {fmt(s.taxable)} taxable</p>
                    </div>
                    <p className="font-mono font-semibold text-emerald-400">{fmt(s.tax)}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-medium text-[#A78BFA] uppercase tracking-[0.3em] flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" /> By Month × State
              </h3>
              <div className="rounded-lg border border-white/5 bg-white/[0.02] divide-y divide-white/5 max-h-[400px] overflow-y-auto">
                {data.summary.map((r, i) => (
                  <div
                    key={`${r.month}-${r.state}-${i}`}
                    className="flex items-center justify-between p-3"
                    data-testid={`row-month-${r.month}-${r.state || "none"}`}
                  >
                    <div>
                      <p className="font-mono text-sm text-white">{r.month} · {r.state || "—"}</p>
                      <p className="text-xs text-white/40">{r.saleCount} sale{r.saleCount === 1 ? "" : "s"}</p>
                    </div>
                    <p className="font-mono text-sm text-emerald-400">{fmt(r.taxAmount)}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="space-y-3">
            <h3 className="text-sm font-medium text-[#A78BFA] uppercase tracking-[0.3em]">Sales detail</h3>
            <div className="overflow-x-auto rounded-lg border border-white/5 bg-white/[0.02]">
              <table className="w-full text-sm" data-testid="table-tax-sales">
                <thead className="text-left text-xs uppercase tracking-widest text-white/40">
                  <tr>
                    <th className="p-3">Captured</th>
                    <th className="p-3">Artwork</th>
                    <th className="p-3">Ship-to</th>
                    <th className="p-3 text-right">Bid</th>
                    <th className="p-3 text-right">Rate</th>
                    <th className="p-3 text-right">Tax</th>
                    <th className="p-3">Tax Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.sales.map((s) => (
                    <tr key={s.bidId} data-testid={`row-sale-${s.bidId}`}>
                      <td className="p-3 text-white/70 text-xs">
                        {s.capturedAt ? new Date(s.capturedAt).toLocaleString() : "—"}
                      </td>
                      <td className="p-3 text-white/80">{s.artworkTitle}</td>
                      <td className="p-3 text-white/60">
                        {[s.shippingCity, s.shippingState, s.shippingPostalCode].filter(Boolean).join(", ") || "—"}
                      </td>
                      <td className="p-3 text-right font-mono text-white">{fmt(s.amount)}</td>
                      <td className="p-3 text-right font-mono text-white/60">{s.taxRate.toFixed(2)}%</td>
                      <td className="p-3 text-right font-mono text-emerald-400">{fmt(s.taxAmount)}</td>
                      <td className="p-3 font-mono text-xs text-white/40" data-testid={`text-tax-ref-${s.bidId}`}>
                        {s.stripeTaxTransactionId || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
