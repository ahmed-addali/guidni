"use client";

import { useRef } from "react";
import QRCode from "react-qr-code";
import { Copy, Download, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface BookingQRCodeProps {
  bookingRef: string;
  /** Base URL of the app — passed from server so it works in SSR too */
  baseUrl: string;
}

export function BookingQRCode({ bookingRef, baseUrl }: BookingQRCodeProps) {
  const verifyUrl = `${baseUrl}/verify/${bookingRef}`;
  const qrRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(bookingRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const canvas = document.createElement("canvas");
    const size = 300;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      const link = document.createElement("a");
      link.download = `booking-${bookingRef}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgStr)));
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 border border-gray-100 rounded-lg bg-white">
      {/* QR Code */}
      <div ref={qrRef} className="p-3 bg-white border border-gray-100 rounded-lg">
        <QRCode value={verifyUrl} size={160} />
      </div>

      {/* Booking ref + copy */}
      <div className="flex items-center gap-2">
        <span className="font-mono font-semibold text-gray-900 tracking-wider text-sm">
          {bookingRef}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy booking reference"
          className={cn(
            "flex items-center gap-1 text-xs px-2 py-1 rounded-md border transition-colors",
            copied
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-gray-200 text-gray-500 hover:bg-gray-50"
          )}
        >
          {copied ? (
            <><Check className="h-3 w-3" /> Copied</>
          ) : (
            <><Copy className="h-3 w-3" /> Copy</>
          )}
        </button>
      </div>

      {/* Hint */}
      <p className="text-xs text-gray-400 text-center max-w-48">
        Show this QR code or reference to the venue on arrival.
      </p>

      {/* Download */}
      <button
        type="button"
        onClick={handleDownload}
        className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
      >
        <Download className="h-3.5 w-3.5" />
        Download QR code
      </button>
    </div>
  );
}
