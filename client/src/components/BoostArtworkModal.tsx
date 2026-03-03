import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { type Artwork } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Rocket, TrendingUp, Zap, Crown } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BoostArtworkModalProps {
  artwork: Artwork;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const boostTiers = [
  {
    percentage: 0,
    name: "No Boost",
    description: "Standard listing visibility",
    icon: null,
    color: "text-white/40",
  },
  {
    percentage: 5,
    name: "Starter Boost",
    description: "Slight visibility increase in gallery",
    icon: TrendingUp,
    color: "text-white/60",
  },
  {
    percentage: 10,
    name: "Pro Boost",
    description: "Priority placement in search and gallery",
    icon: Rocket,
    color: "text-[#96A0AB]",
  },
  {
    percentage: 15,
    name: "Premium Boost",
    description: "Top placement + featured badge",
    icon: Zap,
    color: "text-[#A78BFA]",
  },
  {
    percentage: 20,
    name: "Elite Boost",
    description: "Maximum visibility + special highlighting",
    icon: Crown,
    color: "text-[#A78BFA]",
  },
];

export function BoostArtworkModal({ artwork, open, onOpenChange }: BoostArtworkModalProps) {
  const [selectedPercentage, setSelectedPercentage] = useState(
    artwork.promotionPercentage?.toString() || "0"
  );
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (promotionPercentage: number) => {
      return apiRequest("PATCH", `/api/artworks/${artwork.id}/promotion`, { promotionPercentage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artworks"] });
      toast({
        title: "Boost Updated",
        description: selectedPercentage === "0" 
          ? "Boost removed from your artwork" 
          : `Your artwork is now boosted at ${selectedPercentage}%`,
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update boost",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    mutation.mutate(parseInt(selectedPercentage));
  };

  const currentPrice = Number(artwork.price);
  const selectedTier = boostTiers.find(t => t.percentage === parseInt(selectedPercentage));
  const estimatedFee = (currentPrice * parseInt(selectedPercentage)) / 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[#0a0a0f]/95 backdrop-blur-xl border border-white/10" data-testid="dialog-boost-artwork">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#A78BFA]">
            <Rocket className="w-5 h-5 text-[#A78BFA]" />
            Boost Your Listing
          </DialogTitle>
          <DialogDescription className="text-white/50">
            Increase your artwork's visibility by paying an additional percentage of the final sale price. This fee goes to BrushBids to help promote your work.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="bg-[#12121e] rounded-lg p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <img 
                src={artwork.imageUrl || "https://images.unsplash.com/photo-1579783902614-a3fb39279c0f?q=80&w=200"} 
                alt={artwork.title}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div>
                <h4 className="font-semibold text-white">{artwork.title}</h4>
                <p className="text-sm text-white/50">Current bid: ${currentPrice.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <RadioGroup 
            value={selectedPercentage} 
            onValueChange={setSelectedPercentage}
            className="space-y-3"
            data-testid="radiogroup-boost-tiers"
          >
            {boostTiers.map((tier) => (
              <div key={tier.percentage} className="relative">
                <RadioGroupItem
                  value={tier.percentage.toString()}
                  id={`boost-${tier.percentage}`}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`boost-${tier.percentage}`}
                  className="flex items-center gap-4 p-4 border border-white/10 rounded-lg cursor-pointer transition-all peer-data-[state=checked]:border-[#A78BFA]/50 peer-data-[state=checked]:bg-[#A78BFA]/5 hover:bg-white/5"
                  data-testid={`option-boost-${tier.percentage}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tier.icon ? 'bg-[#A78BFA]/10' : 'bg-white/5'}`}>
                    {tier.icon ? <tier.icon className={`w-5 h-5 ${tier.color}`} /> : <span className="text-white/40">-</span>}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-white">{tier.name}</span>
                      {tier.percentage > 0 && (
                        <Badge variant="outline" className="text-xs border-white/10 text-white/60">
                          {tier.percentage}%
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-white/50">{tier.description}</p>
                  </div>
                  {tier.percentage > 0 && (
                    <div className="text-right">
                      <div className="text-sm font-medium text-white">
                        ~${((currentPrice * tier.percentage) / 100).toFixed(2)}
                      </div>
                      <div className="text-xs text-white/40">est. fee</div>
                    </div>
                  )}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {parseInt(selectedPercentage) > 0 && (
            <div className="bg-[#F472B6]/5 border border-[#F472B6]/20 rounded-lg p-4 space-y-2">
              <h5 className="font-medium flex items-center gap-2 text-[#F472B6]">
                {selectedTier?.icon && <selectedTier.icon className={`w-4 h-4 ${selectedTier.color}`} />}
                Fee Breakdown
              </h5>
              <div className="text-sm space-y-1">
                <div className="flex justify-between gap-2 flex-wrap">
                  <span className="text-white/50">Boost fee ({selectedPercentage}% of sale)</span>
                  <span className="font-medium text-white">~${estimatedFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between gap-2 flex-wrap">
                  <span className="text-white/50">Your earnings (75% - {selectedPercentage}%)</span>
                  <span className="font-medium text-white">~${((currentPrice * (75 - parseInt(selectedPercentage))) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between gap-2 flex-wrap pt-2 border-t border-white/10">
                  <span className="text-white/50">Charity (10%)</span>
                  <span className="text-white">~${(currentPrice * 0.10).toFixed(2)}</span>
                </div>
              </div>
              <p className="text-xs text-white/40 mt-2">
                Fee is only charged when your artwork sells. No upfront cost.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-white/10 text-white/60 hover:text-white" data-testid="button-cancel-boost">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={mutation.isPending}
            className="rounded-full bg-white text-[#0a0a0f] font-semibold hover:bg-white/90"
            data-testid="button-save-boost"
          >
            {mutation.isPending ? "Saving..." : "Save Boost Settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
