"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cn } from "@/lib/utils";

// ─── Root ──────────────────────────────────────────────────────────────────────

function ToggleTabs({
  className,
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="toggle-tabs"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  );
}

// ─── List (the pill container) ─────────────────────────────────────────────────

function ToggleTabsList({
  className,
  ...props
}: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="toggle-tabs-list"
      className={cn(
        "inline-flex items-center rounded-xl border border-gray-200 bg-gray-50 p-1 gap-1",
        className
      )}
      {...props}
    />
  );
}

// ─── Trigger (each pill tab) ───────────────────────────────────────────────────

function ToggleTabsTrigger({
  className,
  ...props
}: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="toggle-tabs-trigger"
      className={cn(
        // base
        "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
        // inactive
        "text-gray-500 hover:text-gray-700",
        // active
        "data-active:bg-white data-active:text-gray-900 data-active:shadow-sm",
        className
      )}
      {...props}
    />
  );
}

// ─── Panel ─────────────────────────────────────────────────────────────────────

function ToggleTabsContent({
  className,
  ...props
}: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="toggle-tabs-content"
      className={cn("text-sm outline-none", className)}
      {...props}
    />
  );
}

export { ToggleTabs, ToggleTabsList, ToggleTabsTrigger, ToggleTabsContent };
