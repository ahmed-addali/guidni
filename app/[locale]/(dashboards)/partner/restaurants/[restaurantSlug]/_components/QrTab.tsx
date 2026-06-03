"use client";

import { useState, useRef } from "react";
import QRCode from "react-qr-code";
import { Download, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  restaurantSlug: string;
  locale: string;
  labels: {
    title: string;
    description: string;
    tableLabel: string;
    general: string;
    previewLabel: string;
    linkLabel: string;
    download: string;
    tableMode: string;
    generalMode: string;
  };
}

export function QrTab({ restaurantSlug, locale, labels }: Props) {
  const [tableMode, setTableMode] = useState(false);
  const [tableNumber, setTableNumber] = useState(1);
  const qrRef = useRef<HTMLDivElement>(null);

  const baseUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${locale}/restaurants/${restaurantSlug}/menu`
      : `/${locale}/restaurants/${restaurantSlug}/menu`;

  const qrUrl = tableMode ? `${baseUrl}?table=${tableNumber}` : baseUrl;

  function handleDownload() {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const size = 400;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new window.Image();
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      const a = document.createElement("a");
      const label = tableMode ? `qr-table-${tableNumber}` : "qr-general";
      a.download = `${restaurantSlug}-${label}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <p className="text-sm text-gray-500">{labels.description}</p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setTableMode(false)}
          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
            !tableMode
              ? "bg-primary text-white border-primary"
              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
          }`}
        >
          {labels.generalMode}
        </button>
        <button
          onClick={() => setTableMode(true)}
          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
            tableMode
              ? "bg-primary text-white border-primary"
              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
          }`}
        >
          {labels.tableMode}
        </button>
      </div>

      {/* Table number picker */}
      {tableMode && (
        <div>
          <label className="text-xs font-medium text-gray-500 mb-2 block">{labels.tableLabel}</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTableNumber((n) => Math.max(1, n - 1))}
              className="h-9 w-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center font-bold text-gray-900 text-lg">{tableNumber}</span>
            <button
              onClick={() => setTableNumber((n) => Math.min(50, n + 1))}
              className="h-9 w-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* QR preview */}
      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 space-y-4">
        <p className="text-sm font-medium text-gray-700">{labels.previewLabel}</p>
        <div ref={qrRef} className="flex justify-center">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <QRCode value={qrUrl} size={180} />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-gray-400">{labels.linkLabel}</p>
          <p className="text-xs text-gray-600 font-mono break-all bg-white border border-gray-100 rounded-lg px-3 py-2">
            {qrUrl}
          </p>
        </div>
      </div>

      {/* Download */}
      <Button onClick={handleDownload} variant="outline" className="gap-2">
        <Download className="h-4 w-4" />
        {labels.download}
      </Button>
    </div>
  );
}
