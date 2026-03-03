import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette, ShoppingBag, Sparkles, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface WelcomeModalProps {
  isOpen: boolean;
  userId: string;
  existingFirstName?: string | null;
  existingLastName?: string | null;
  onComplete: () => void;
}

type RoleOption = "artist" | "buyer" | "both";

const roleOptions: { id: RoleOption; title: string; description: string; icon: typeof Palette }[] = [
  {
    id: "artist",
    title: "I'm an Artist",
    description: "Submit and sell your artwork to collectors worldwide",
    icon: Palette,
  },
  {
    id: "buyer",
    title: "I'm a Collector",
    description: "Discover and bid on unique student artwork",
    icon: ShoppingBag,
  },
  {
    id: "both",
    title: "I'm Both",
    description: "Create art and collect from other artists",
    icon: Sparkles,
  },
];

export function WelcomeModal({ isOpen, userId, existingFirstName, existingLastName, onComplete }: WelcomeModalProps) {
  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);
  const [firstName, setFirstName] = useState(existingFirstName || "");
  const [lastName, setLastName] = useState(existingLastName || "");
  const { toast } = useToast();

  const needsName = !existingFirstName || !existingLastName;

  const completeOnboardingMutation = useMutation({
    mutationFn: async (data: { role: RoleOption; firstName?: string; lastName?: string }) => {
      const res = await apiRequest("POST", `/api/users/${userId}/complete-onboarding`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Welcome to BrushBids!",
        description: "Your account is all set up. Start exploring!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      onComplete();
    },
    onError: () => {
      toast({
        title: "Setup Failed",
        description: "Could not save your preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleContinue = () => {
    if (selectedRole) {
      const data: { role: RoleOption; firstName?: string; lastName?: string } = { role: selectedRole };
      if (needsName && firstName.trim()) data.firstName = firstName.trim();
      if (needsName && lastName.trim()) data.lastName = lastName.trim();
      completeOnboardingMutation.mutate(data);
    }
  };

  const canContinue = selectedRole && (!needsName || (firstName.trim() && lastName.trim()));

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg bg-[#0a0a0f]/95 backdrop-blur-xl border border-white/10" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-display text-center gradient-text">Welcome to BrushBids!</DialogTitle>
          <DialogDescription className="text-center text-white/50">
            {needsName ? "Let's set up your profile. " : ""}Tell us how you'd like to use the platform.
          </DialogDescription>
        </DialogHeader>
        
        {needsName && (
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-white/60">First Name</Label>
              <Input
                id="firstName"
                placeholder="Enter your first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-[#A78BFA]"
                data-testid="input-first-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-white/60">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Enter your last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-[#A78BFA]"
                data-testid="input-last-name"
              />
            </div>
          </div>
        )}
        
        <div className={`space-y-3 ${needsName ? 'mt-4' : 'mt-4'}`}>
          {roleOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedRole === option.id;
            
            return (
              <Card 
                key={option.id}
                className={`cursor-pointer transition-all hover-elevate bg-[#12121e] border-white/10 ${
                  isSelected ? "ring-2 ring-[#A78BFA] border-[#A78BFA]/50" : ""
                }`}
                onClick={() => setSelectedRole(option.id)}
                data-testid={`card-role-${option.id}`}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isSelected ? "bg-[#A78BFA] text-white" : "bg-white/5 text-white/50"
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{option.title}</h3>
                    <p className="text-sm text-white/50">{option.description}</p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#A78BFA] flex items-center justify-center">
                      <svg className="w-3 h-3 text-[#0a0a0f]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <Button 
          className="w-full mt-4 rounded-full bg-white text-[#0a0a0f] font-semibold hover:bg-white/90" 
          size="lg"
          disabled={!canContinue || completeOnboardingMutation.isPending}
          onClick={handleContinue}
          data-testid="button-complete-onboarding"
        >
          {completeOnboardingMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Setting up...
            </>
          ) : (
            "Get Started"
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
