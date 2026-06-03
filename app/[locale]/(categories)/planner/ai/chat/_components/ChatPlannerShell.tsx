"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { useChatPlannerStore } from "@/stores/chatPlannerStore";
import { ChatPanel } from "./ChatPanel";
import { PlanPanel } from "./PlanPanel";
import { ChatSidebar } from "./ChatSidebar";

type Props = { userId: string };

export function ChatPlannerShell({ userId }: Props) {
  const { panelRatio, setPanelRatio } = useChatPlannerStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const [dragging, setDragging] = useState(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    setDragging(true);
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const sidebarWidth = document.querySelector(".sidebar-container")?.getBoundingClientRect().width || 0;
      const x = e.clientX - rect.left - sidebarWidth;
      const ratio = x / (rect.width - sidebarWidth);
      setPanelRatio(ratio);
    };

    const onMouseUp = () => {
      isDragging.current = false;
      setDragging(false);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [setPanelRatio]);

  const leftPct = `${(panelRatio * 100).toFixed(1)}%`;
  const rightPct = `${((1 - panelRatio) * 100).toFixed(1)}%`;

  return (
    <div
      ref={containerRef}
      className="flex h-[calc(100vh-64px)] overflow-hidden bg-white"
      style={{ cursor: dragging ? "col-resize" : undefined }}
    >
      {/* Sidebar */}
      <div className="sidebar-container h-full shrink-0">
        <ChatSidebar />
      </div>
      {/* Left panel — Chat */}
      <div className="h-full overflow-hidden" style={{ width: leftPct, minWidth: 280 }}>
        <ChatPanel userId={userId} />
      </div>

      {/* Resizable divider */}
      <div
        onMouseDown={onMouseDown}
        className={`shrink-0 w-1.5 cursor-col-resize relative group transition-colors ${
          dragging ? "bg-primary/30" : "bg-gray-100 hover:bg-primary/20"
        }`}
      >
        {/* Grip dots */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1 w-1 rounded-full transition-colors ${
                dragging ? "bg-primary" : "bg-gray-300 group-hover:bg-primary/60"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Right panel — Plan / Map / Alternatives */}
      <div className="h-full overflow-hidden" style={{ width: rightPct, minWidth: 320 }}>
        <PlanPanel userId={userId} />
      </div>
    </div>
  );
}
