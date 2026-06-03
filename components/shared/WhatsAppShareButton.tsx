"use client";

import { useEffect, useState } from "react";
import { FaWhatsapp } from "react-icons/fa6";

type Props = {
  title: string;
  label?: string;
  className?: string;
};

export function WhatsAppShareButton({ title, label, className }: Props) {
  const [url, setUrl] = useState("");

  // Resolve the URL client-side so SSR doesn't mismatch
  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  const text = encodeURIComponent(`${title}\n${url}`);
  const href = `https://wa.me/?text=${text}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label ?? "Share on WhatsApp"}
      title={label ?? "Share on WhatsApp"}
      className={className}
    >
      <FaWhatsapp className="h-4 w-4 text-[#25D366]" />
    </a>
  );
}
