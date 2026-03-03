import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer, QrCode } from "lucide-react";
import QRCode from "qrcode";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  artworkTitle: string;
  artworkId: number;
}

export function QRCodeModal({ isOpen, onClose, artworkTitle, artworkId }: QRCodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const artworkUrl = `${window.location.origin}/artwork/${artworkId}`;

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    QRCode.toCanvas(canvasRef.current, artworkUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: "#FFFFFF",
        light: "#12121e",
      },
    }).then(() => {
      if (canvasRef.current) {
        setQrDataUrl(canvasRef.current.toDataURL("image/png"));
      }
    });
  }, [isOpen, artworkUrl]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.download = `brushbids-qr-${artworkId}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head><title>QR Code - ${artworkTitle}</title></head>
        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:serif;margin:0;background:#0a0a0f;">
          <h2 style="color:#A78BFA;margin-bottom:8px;">${artworkTitle}</h2>
          <p style="color:rgba(255,255,255,0.5);margin-bottom:24px;">Scan to bid on BrushBids</p>
          <img src="${qrDataUrl}" width="280" height="280" />
          <p style="color:rgba(255,255,255,0.4);margin-top:16px;font-size:12px;">${artworkUrl}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-sm bg-[#0a0a0f]/95 backdrop-blur-xl border border-white/10" data-testid="qr-code-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-[#A78BFA]">
            <QrCode className="w-5 h-5 text-[#A78BFA]" /> QR Code
          </DialogTitle>
          <DialogDescription className="text-white/50">
            Display this QR code at your art show. Visitors can scan it to view and bid on "{artworkTitle}".
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-4">
          <div className="bg-[#12121e] p-4 rounded-xl border border-white/10">
            <canvas ref={canvasRef} data-testid="qr-canvas" />
          </div>
          <p className="text-xs text-white/40 mt-3 text-center break-all max-w-[280px]">{artworkUrl}</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 gap-2 border-white/10 text-white/60 hover:text-white hover:border-white/20"
            onClick={handleDownload}
            data-testid="button-qr-download"
          >
            <Download className="w-4 h-4" /> Download
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2 border-white/10 text-white/60 hover:text-white hover:border-white/20"
            onClick={handlePrint}
            data-testid="button-qr-print"
          >
            <Printer className="w-4 h-4" /> Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
