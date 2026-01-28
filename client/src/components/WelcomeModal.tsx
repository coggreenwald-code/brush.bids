import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Palette, ShoppingBag, Sparkles, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface WelcomeModalProps {
  isOpen: boolean;
  userId: string;
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

export function WelcomeModal({ isOpen, userId, onComplete }: WelcomeModalProps) {
  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);
  const { toast } = useToast();

  const completeOnboardingMutation = useMutation({
    mutationFn: async (role: RoleOption) => {
      const res = await apiRequest("POST", `/api/users/${userId}/complete-onboarding`, { role });
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
      completeOnboardingMutation.mutate(selectedRole);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-display text-center">Welcome to BrushBids!</DialogTitle>
          <DialogDescription className="text-center">
            Tell us how you'd like to use the platform. You can change this anytime.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 mt-4">
          {roleOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedRole === option.id;
            
            return (
              <Card 
                key={option.id}
                className={`cursor-pointer transition-all hover-elevate ${
                  isSelected ? "ring-2 ring-primary border-primary" : ""
                }`}
                onClick={() => setSelectedRole(option.id)}
                data-testid={`card-role-${option.id}`}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isSelected ? "bg-primary text-white" : "bg-muted"
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{option.title}</h3>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
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
          className="w-full mt-4" 
          size="lg"
          disabled={!selectedRole || completeOnboardingMutation.isPending}
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
