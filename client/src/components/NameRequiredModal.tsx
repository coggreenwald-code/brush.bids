import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Shown to artists who finished onboarding before names were required. Their
// listings otherwise display as "BrushBids Artist", which costs them sales.
export function NameRequiredModal({ userId, isOpen, onComplete }: { userId: string; isOpen: boolean; onComplete: () => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const { toast } = useToast();

  const saveName = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/users/${userId}/name`, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onComplete();
    },
    onError: (err: Error) => {
      toast({ title: "Couldn't save your name", description: err.message, variant: "destructive" });
    },
  });

  const canSave = firstName.trim() && lastName.trim() && !saveName.isPending;

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md bg-[#0a0a0f] border-white/10 [&>button]:hidden" data-testid="modal-name-required">
        <DialogHeader>
          <DialogTitle className="text-white">Add your name</DialogTitle>
          <DialogDescription className="text-white/50">
            Collectors want to know who made the work. Your listings show your name; if you're under 18, only your last initial is shown.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSave) saveName.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="required-first-name" className="text-white/60">First name</Label>
            <Input id="required-first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="bg-white/[0.03] border-white/10 text-white" data-testid="input-required-first-name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="required-last-name" className="text-white/60">Last name</Label>
            <Input id="required-last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="bg-white/[0.03] border-white/10 text-white" data-testid="input-required-last-name" />
          </div>
          <Button type="submit" disabled={!canSave} className="w-full rounded-full bg-white text-[#0a0a0f] font-semibold hover:bg-white/90" data-testid="button-save-name">
            {saveName.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
