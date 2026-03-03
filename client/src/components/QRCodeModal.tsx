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
        dark: "#4C392D",
        light: "#FFFFFF",
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
        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:serif;margin:0;">
          <h2 style="color:#4C392D;margin-bottom:8px;">${artworkTitle}</h2>
          <p style="color:#9E8472;margin-bottom:24px;">Scan to bid on BrushBids</p>
          <img src="${qrDataUrl}" width="280" height="280" />
          <p style="color:#9E8472;margin-top:16px;font-size:12px;">${artworkUrl}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-sm" data-testid="qr-code-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <QrCode className="w-5 h-5 text-[#B8965A]" /> QR Code
          </DialogTitle>
          <DialogDescription>
            Display this QR code at your art show. Visitors can scan it to view and bid on "{artworkTitle}".
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <canvas ref={canvasRef} data-testid="qr-canvas" />
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center break-all max-w-[280px]">{artworkUrl}</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={handleDownload}
            data-testid="button-qr-download"
          >
            <Download className="w-4 h-4" /> Download
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2"
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
