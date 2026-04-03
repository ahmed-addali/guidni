"use client";

import { useState } from "react";
import { QRCodeSVG } from "react-qr-code";
import { FiX, FiDownload } from "react-icons/fi";

interface Props {
  url:           string;
  activityTitle: string;
  expiresLabel?: string;
}

export function QRInviteModal({ url, activityTitle, expiresLabel }: Props) {
  const [open, setOpen] = useState(false);

  function downloadQR() {
    const svg = document.getElementById("qr-invite-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob    = new Blob([svgData], { type: "image/svg+xml" });
    const link    = document.createElement("a");
    link.href     = URL.createObjectURL(blob);
    link.download = `invite-qr.svg`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <path d="M14 14h2v2h-2zM18 14h3M14 18v3M18 18h3v3h-3z" />
        </svg>
        Show QR code
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-bold text-gray-900 text-base">Scan to book</h2>
                <p className="text-xs text-gray-400 mt-0.5 max-w-[180px] truncate">{activityTitle}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            <div className="flex justify-center p-4 bg-white border border-gray-100 rounded-xl">
              <QRCodeSVG
                id="qr-invite-svg"
                value={url}
                size={200}
                level="M"
                includeMargin={false}
              />
            </div>

            {expiresLabel && (
              <p className="text-xs text-center text-gray-400">{expiresLabel}</p>
            )}

            <button
              onClick={downloadQR}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FiDownload className="h-4 w-4" />
              Download SVG
            </button>
          </div>
        </div>
      )}
    </>
  );
}
