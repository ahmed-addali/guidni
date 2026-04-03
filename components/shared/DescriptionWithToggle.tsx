"use client";

import { useState } from "react";

interface Props {
  text: string;
  maxLength?: number;
  showMoreLabel: string;
  showLessLabel: string;
  className?: string;
}

export function DescriptionWithToggle({
  text,
  maxLength = 300,
  showMoreLabel,
  showLessLabel,
  className = "text-gray-600 leading-relaxed whitespace-pre-line",
}: Props) {
  const [expanded, setExpanded] = useState(false);

  if (text.length <= maxLength) {
    return <p className={className}>{text}</p>;
  }

  return (
    <div>
      <p className={className}>
        {expanded ? text : `${text.slice(0, maxLength).trimEnd()}…`}
      </p>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-2 text-sm font-semibold text-blue-600 hover:underline focus:outline-none"
      >
        {expanded ? showLessLabel : showMoreLabel}
      </button>
    </div>
  );
}
