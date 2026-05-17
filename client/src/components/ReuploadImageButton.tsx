import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, Loader2 } from "lucide-react";
import { useUpdateArtworkImage } from "@/hooks/use-artworks";
import { useToast } from "@/hooks/use-toast";

interface ReuploadImageButtonProps {
  artworkId: number;
  label?: string;
  variant?: "outline" | "default" | "ghost" | "secondary";
  size?: "sm" | "default" | "lg" | "icon";
  className?: string;
}

export function ReuploadImageButton({
  artworkId,
  label = "Replace image",
  variant = "outline",
  size = "sm",
  className = "",
}: ReuploadImageButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const mutation = useUpdateArtworkImage();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image.", variant: "destructive" });
      return;
    }
    mutation.mutate(
      { id: artworkId, file },
      {
        onSuccess: () => {
          toast({ title: "Image updated", description: "The new artwork image is live." });
        },
        onError: (err: any) => {
          toast({
            title: "Update failed",
            description: err?.message || "Could not update the image.",
            variant: "destructive",
          });
        },
      },
    );
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        disabled={mutation.isPending}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          inputRef.current?.click();
        }}
        data-testid={`button-reupload-artwork-${artworkId}`}
      >
        {mutation.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ImagePlus className="w-4 h-4" />
        )}
        {label && <span className="ml-1">{label}</span>}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
        data-testid={`input-reupload-artwork-${artworkId}`}
      />
    </>
  );
}
