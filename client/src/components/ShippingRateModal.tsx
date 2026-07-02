import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Truck, Package, ArrowRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export type ShippingRate = {
  rateId: string;
  carrier: string;
  service: string;
  rate: number;
  estimatedDays: number | null;
  deliveryDate: string | null;
};

type Props = {
  open: boolean;
  artworkId: number;
  bidAmount: number;
  onConfirm: (shipping: {
    toStreet: string;
    toCity: string;
    toState: string;
    toZip: string;
    carrier: string;
    service: string;
    shippingAmount: number;
  } | null) => void;
  onCancel: () => void;
};

type Step = "address" | "rates";

export function ShippingRateModal({ open, artworkId, bidAmount, onConfirm, onCancel }: Props) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("address");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [loadingRates, setLoadingRates] = useState(false);
  const [rates, setRates] = useState<ShippingRate[] | null>(null);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);

  const addressValid = street.trim().length > 2 && city.trim().length > 1 && state.trim().length === 2 && zip.trim().length >= 5;

  const fetchRates = async () => {
    setLoadingRates(true);
    setRatesError(null);
    setRates(null);
    try {
      const params = new URLSearchParams({
        artworkId: artworkId.toString(),
        toStreet: street.trim(),
        toCity: city.trim(),
        toState: state.trim().toUpperCase(),
        toZip: zip.trim(),
      });
      const res = await fetch(`/api/shipping/rates?${params}`, { credentials: "include" });
      if (res.status === 422) {
        const body = await res.json();
        setRatesError(body.message || "Shipping rates unavailable.");
        setStep("rates");
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Could not fetch shipping rates.");
      }
      const data: ShippingRate[] = await res.json();
      setRates(data);
      if (data.length > 0) setSelectedRateId(data[0].rateId);
      setStep("rates");
    } catch (err: any) {
      setRatesError(err.message || "Could not load shipping rates.");
      setStep("rates");
    } finally {
      setLoadingRates(false);
    }
  };

  const selectedRate = rates?.find(r => r.rateId === selectedRateId) ?? null;

  const handleConfirm = () => {
    if (ratesError || !rates || rates.length === 0) {
      onConfirm(null);
      return;
    }
    if (!selectedRate) {
      toast({ title: "Select a shipping option", description: "Please choose a shipping method to continue.", variant: "destructive" });
      return;
    }
    onConfirm({
      toStreet: street.trim(),
      toCity: city.trim(),
      toState: state.trim().toUpperCase(),
      toZip: zip.trim(),
      carrier: selectedRate.carrier,
      service: selectedRate.service,
      shippingAmount: selectedRate.rate,
    });
  };

  const handleBack = () => {
    setStep("address");
    setRates(null);
    setRatesError(null);
    setSelectedRateId(null);
  };

  const handleSkip = () => {
    onConfirm(null);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent
        className="sm:max-w-md bg-[#0d0d14] border-white/10 p-0 gap-0 flex flex-col max-h-[90vh]"
        data-testid="dialog-shipping-rates"
      >
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4 text-left">
          <DialogTitle className="font-display text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#34D399]" /> Shipping
          </DialogTitle>
          <DialogDescription className="text-white/50">
            {step === "address"
              ? "Enter your shipping address to see live carrier rates."
              : ratesError
              ? "Shipping rates couldn't be loaded."
              : "Choose a shipping method for this artwork."}
          </DialogDescription>
        </DialogHeader>

        {step === "address" && (
          <>
            <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-2 space-y-4">
              <div>
                <Label className="text-white/60 text-sm">Street address</Label>
                <Input
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="123 Main St"
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  data-testid="input-shipping-street"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <Label className="text-white/60 text-sm">City</Label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    data-testid="input-shipping-city"
                  />
                </div>
                <div>
                  <Label className="text-white/60 text-sm">State</Label>
                  <Input
                    value={state}
                    onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
                    placeholder="CA"
                    maxLength={2}
                    className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    data-testid="input-shipping-state"
                  />
                </div>
                <div>
                  <Label className="text-white/60 text-sm">ZIP</Label>
                  <Input
                    value={zip}
                    onChange={(e) => setZip(e.target.value.slice(0, 10))}
                    placeholder="90210"
                    maxLength={10}
                    className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    data-testid="input-shipping-zip"
                  />
                </div>
              </div>
            </div>
            <div className="shrink-0 border-t border-white/10 px-6 py-4 space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  className="flex-1 rounded-full bg-white text-[#0a0a0f] font-semibold hover:bg-white/90"
                  disabled={!addressValid || loadingRates}
                  onClick={fetchRates}
                  data-testid="button-get-rates"
                >
                  {loadingRates ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                  {loadingRates ? "Getting rates…" : "See shipping rates"}
                </Button>
                <Button
                  variant="ghost"
                  className="rounded-full text-white/40 hover:text-white/60"
                  onClick={handleSkip}
                  data-testid="button-skip-shipping"
                >
                  Skip
                </Button>
              </div>
              <p className="text-xs text-white/30 text-center">
                Skipping will continue without a shipping selection. You can arrange shipping directly with the artist.
              </p>
            </div>
          </>
        )}

        {step === "rates" && (
          <>
            <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-2 space-y-4">
              {ratesError ? (
                <div className="flex items-start gap-3 rounded-md border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
                  <div>
                    <p className="text-sm text-amber-200/80">{ratesError}</p>
                    <p className="text-xs text-white/40 mt-1">You can still place your bid — shipping can be arranged with the artist directly.</p>
                  </div>
                </div>
              ) : rates && rates.length === 0 ? (
                <div className="text-center py-4">
                  <Package className="w-8 h-8 text-white/20 mx-auto mb-2" />
                  <p className="text-sm text-white/50">No shipping rates returned for this route.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {rates?.map((rate) => (
                    <button
                      key={rate.rateId}
                      type="button"
                      onClick={() => setSelectedRateId(rate.rateId)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedRateId === rate.rateId
                          ? "border-[#34D399]/50 bg-[#34D399]/5"
                          : "border-white/8 bg-white/[0.02] hover:border-white/15"
                      }`}
                      data-testid={`rate-option-${rate.rateId}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {selectedRateId === rate.rateId && (
                            <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-white">
                              {rate.carrier} <span className="text-white/50 font-normal">{rate.service}</span>
                            </p>
                            {rate.estimatedDays != null && (
                              <p className="text-xs text-white/40 mt-0.5">
                                Est. {rate.estimatedDays} business day{rate.estimatedDays !== 1 ? "s" : ""}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-[#34D399] shrink-0">${rate.rate.toFixed(2)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-white/10 px-6 py-4 space-y-3">
              {selectedRate && (
                <div className="rounded-md bg-white/[0.02] border border-white/5 px-3 py-2 text-xs text-white/50 flex justify-between">
                  <span>Bid: <span className="text-white font-medium">${bidAmount.toLocaleString()}</span></span>
                  <span>+ Shipping: <span className="text-[#34D399] font-medium">${selectedRate.rate.toFixed(2)}</span></span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-white/40 hover:text-white/60"
                  onClick={handleBack}
                  data-testid="button-back-shipping"
                >
                  Back
                </Button>
                <Button
                  className="flex-1 rounded-full bg-white text-[#0a0a0f] font-semibold hover:bg-white/90"
                  onClick={handleConfirm}
                  disabled={!ratesError && rates !== null && rates.length > 0 && !selectedRate}
                  data-testid="button-confirm-shipping"
                >
                  {ratesError || !rates || rates.length === 0 ? "Continue without shipping" : "Continue to Payment"}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
