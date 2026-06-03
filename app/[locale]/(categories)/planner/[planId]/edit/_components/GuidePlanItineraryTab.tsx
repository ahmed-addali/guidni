"use client";

import { useState, useTransition, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Trash2, GripVertical, Plus, Search, X,
  ChevronDown, ChevronUp, StickyNote, Heart, AlertTriangle,
  Clock, Pencil, Check, FileText, ArrowLeft,
} from "lucide-react";
import {
  removeBlockFromPlan,
  saveGuideNote,
  addBlockToPlan,
  addNoteBlockToPlan,
  reorderBlocksInDay,
  searchPlanItems,
  addDayToPlan,
  removeDayFromPlan,
  getWishlistForPlanEditor,
  updateDayTheme,
  updateDayNotes,
  searchShopsForPlanEditor,
  getShopProductsForPlanEditor,
  addShopPickToPlanDay,
  removeShopPickFromPlanDay,
  addStayToPlan,
  removeStayFromPlan,
  addRentalToPlan,
  removeRentalFromPlan,
  updateMultiDayBlockNote,
  type SearchResultItem,
  type ShopSearchResult,
  type ProductSearchResult,
} from "@/lib/actions/guide-plan-editor";
import type {
  PlanDay,
  PlanBlock,
  PlanItinerary,
  PlanMultiDayBlock,
  LogisticsType,
  PlanItemType,
  PlanShopSuggestion,
} from "@/lib/planner/types";

/* ─── Props ──────────────────────────────────────────────────────────────────── */

interface Props {
  planId:        string;
  itinerary:     PlanItinerary;
  destinationId: string;
}

/* ─── Constants ──────────────────────────────────────────────────────────────── */

const TIME_OPTIONS: string[] = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

const TYPE_COLOR: Record<string, string> = {
  ACTIVITY:   "bg-orange-50 text-orange-700",
  ATTRACTION: "bg-blue-50 text-blue-700",
  RESTAURANT: "bg-green-50 text-green-700",
  STAY:       "bg-purple-50 text-purple-700",
  TRANSFER:   "bg-sky-50 text-sky-700",
  RENTAL:     "bg-fuchsia-50 text-fuchsia-700",
  NOTE:       "bg-amber-50 text-amber-700",
};

const TYPE_ICON: Record<string, string> = {
  ACTIVITY:   "🎯",
  ATTRACTION: "🏛️",
  RESTAURANT: "🍽️",
  STAY:       "🏨",
  TRANSFER:   "🚗",
  RENTAL:     "🛵",
  NOTE:       "📝",
};

type BlockTypeOption = {
  type:    PlanItemType | "SHOPPING";
  label:   string;
  emoji:   string;
  color:   string;
};

const BLOCK_TYPE_OPTIONS: BlockTypeOption[] = [
  { type: "ACTIVITY",   label: "Activity",   emoji: "🎯",  color: "border-orange-200 hover:bg-orange-50 hover:border-orange-300" },
  { type: "ATTRACTION", label: "Attraction", emoji: "🏛️",  color: "border-blue-200 hover:bg-blue-50 hover:border-blue-300" },
  { type: "RESTAURANT", label: "Restaurant", emoji: "🍽️",  color: "border-green-200 hover:bg-green-50 hover:border-green-300" },
  { type: "STAY",       label: "Stay",       emoji: "🏨",  color: "border-purple-200 hover:bg-purple-50 hover:border-purple-300" },
  { type: "TRANSFER",   label: "Transfer",   emoji: "🚗",  color: "border-sky-200 hover:bg-sky-50 hover:border-sky-300" },
  { type: "RENTAL",     label: "Rental",     emoji: "🛵",  color: "border-fuchsia-200 hover:bg-fuchsia-50 hover:border-fuchsia-300" },
  { type: "NOTE",       label: "Note",       emoji: "📝",  color: "border-amber-200 hover:bg-amber-50 hover:border-amber-300" },
  { type: "SHOPPING",   label: "Shopping",   emoji: "🛍️",  color: "border-orange-200 hover:bg-orange-50 hover:border-orange-300" },
];

const LOGISTICS_SUBTYPES: { key: LogisticsType; label: string; emoji: string }[] = [
  { key: "ARRIVAL_TRANSFER",   label: "Arrival Transfer",   emoji: "🛬" },
  { key: "DEPARTURE_TRANSFER", label: "Departure Transfer", emoji: "🛫" },
  { key: "CITY_TRANSFER",      label: "City Transfer",      emoji: "🚕" },
  { key: "RENTAL_PICKUP",      label: "Rental Pickup",      emoji: "🚗" },
  { key: "RENTAL_DROPOFF",     label: "Rental Drop-off",    emoji: "🏁" },
];

const LOGISTICS_LABEL: Record<LogisticsType, { label: string; emoji: string }> = {
  ARRIVAL_TRANSFER:   { label: "Arrival Transfer",   emoji: "🛬" },
  DEPARTURE_TRANSFER: { label: "Departure Transfer", emoji: "🛫" },
  CITY_TRANSFER:      { label: "City Transfer",      emoji: "🚕" },
  RENTAL_PICKUP:      { label: "Rental Pickup",      emoji: "🚗" },
  RENTAL_DROPOFF:     { label: "Rental Drop-off",    emoji: "🏁" },
};


/* ─── BlockCard (editor) ─────────────────────────────────────────────────────── */

function BlockCard({
  block, planId, onRemoved,
  onDragStart, onDragOver, onDrop, isDragOver,
}: {
  block:       PlanBlock;
  planId:      string;
  onRemoved:   (itinerary: PlanDay[]) => void;
  onDragStart: (blockId: string) => void;
  onDragOver:  (e: React.DragEvent, blockId: string) => void;
  onDrop:      (e: React.DragEvent, blockId: string) => void;
  isDragOver:  boolean;
}) {
  const [noteOpen,    setNoteOpen]    = useState(false);
  const [noteValue,   setNoteValue]   = useState(block.guideNote ?? "");
  const [noteChanged, setNoteChanged] = useState(false);
  const [isPending,   startTransition] = useTransition();

  const isNote     = block.item.type === "NOTE";
  const hasTime    = !!block.time;
  const logLabel   = block.logisticsType ? LOGISTICS_LABEL[block.logisticsType] : null;

  function handleNoteChange(v: string) {
    setNoteValue(v);
    setNoteChanged(v !== (block.guideNote ?? ""));
  }

  function saveNote() {
    startTransition(async () => {
      const res = await saveGuideNote(planId, block.id, noteValue);
      if (!res.success) { toast.error(res.error); return; }
      toast.success("Note saved");
      setNoteChanged(false);
    });
  }

  function remove() {
    startTransition(async () => {
      const res = await removeBlockFromPlan(planId, block.id);
      if (!res.success) { toast.error(res.error); return; }
      onRemoved(res.itinerary);
    });
  }

  return (
    <div
      draggable
      onDragStart={() => onDragStart(block.id)}
      onDragOver={(e) => onDragOver(e, block.id)}
      onDrop={(e) => onDrop(e, block.id)}
      className={[
        "flex items-stretch gap-0 border rounded-xl group transition-all cursor-default overflow-hidden",
        isNote
          ? "bg-amber-50/60 border-amber-100"
          : "bg-white border-gray-100 hover:border-gray-200",
        isDragOver ? "border-primary/50 bg-primary/5 scale-[0.99]" : "",
      ].join(" ")}
    >
      {/* Drag handle */}
      <div className="flex items-center px-2 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-400 shrink-0">
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Thumbnail — hidden for NOTE type */}
      {!isNote && (
        block.item.imageUrl ? (
          <div className="h-12 w-12 rounded-lg overflow-hidden shrink-0 bg-gray-100 my-2.5">
            <Image
              src={block.item.imageUrl}
              alt={block.item.name}
              width={48} height={48}
              className="object-cover w-full h-full"
            />
          </div>
        ) : (
          <div className="h-12 w-12 rounded-lg bg-gray-50 shrink-0 flex items-center justify-center text-xl my-2.5">
            {logLabel?.emoji ?? TYPE_ICON[block.item.type] ?? "📍"}
          </div>
        )
      )}

      {/* Content */}
      <div className="flex-1 min-w-0 px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">

            {/* Meta row: type badge + logistics label + time */}
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              {/* Logistics label takes priority over plain item type */}
              {logLabel ? (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-700">
                  {logLabel.emoji} {logLabel.label}
                </span>
              ) : (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${TYPE_COLOR[block.item.type] ?? "bg-gray-100 text-gray-600"}`}>
                  {isNote ? "Note" : block.item.type}
                </span>
              )}
              {hasTime && (
                <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                  <Clock className="h-3 w-3" />
                  {block.time!.start} – {block.time!.end}
                </span>
              )}
            </div>

            {/* Body */}
            {isNote ? (
              <p className="text-xs text-amber-800 leading-relaxed whitespace-pre-wrap">
                {block.item.name}
              </p>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {block.customTitle ?? block.item.name}
                </p>
                {block.item.price > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">TND {block.item.price}</p>
                )}
              </>
            )}
          </div>

          {/* Actions — visible on hover */}
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isNote && (
              <button
                onClick={() => setNoteOpen((v) => !v)}
                className={`p-1.5 rounded-lg transition-colors ${
                  noteOpen || block.guideNote
                    ? "bg-amber-50 text-amber-600"
                    : "hover:bg-gray-100 text-gray-400"
                }`}
                title="Guide note"
              >
                <StickyNote className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={remove}
              disabled={isPending}
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
              title="Remove"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Guide note editor */}
        {!isNote && noteOpen && (
          <div className="mt-2 space-y-1.5">
            <textarea
              value={noteValue}
              onChange={(e) => handleNoteChange(e.target.value)}
              rows={2}
              maxLength={300}
              placeholder="Add a local tip or context for travelers…"
              className="w-full text-xs px-3 py-2 border border-amber-200 rounded-lg bg-amber-50/50 focus:outline-none focus:border-amber-300 resize-none"
            />
            {noteChanged && (
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => { setNoteValue(block.guideNote ?? ""); setNoteChanged(false); }}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={saveNote}
                  disabled={isPending}
                  className="text-xs font-medium px-2.5 py-1 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  {isPending ? "Saving…" : "Save note"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── AddBlockDrawer ─────────────────────────────────────────────────────────── */

type DrawerStep = "type" | "logistics-subtype" | "search" | "note";

function AddBlockDrawer({
  planId, dayIndex, destinationId, onAdded, onClose, onOpenShopping,
}: {
  planId:          string;
  dayIndex:        number;
  destinationId:   string;
  onAdded:         (itinerary: PlanDay[]) => void;
  onClose:         () => void;
  onOpenShopping:  () => void;
}) {
  const [step,         setStep]         = useState<DrawerStep>("type");
  const [blockType,    setBlockType]    = useState<PlanItemType | null>(null);
  const [logType,      setLogType]      = useState<LogisticsType | null>(null);
  const [query,        setQuery]        = useState("");
  const [results,      setResults]      = useState<SearchResultItem[]>([]);
  const [wishlist,     setWishlist]     = useState<SearchResultItem[]>([]);
  const [activeTab,    setActiveTab]    = useState<"search" | "wishlist">("search");
  const [noteText,     setNoteText]     = useState("");
  const [timeEnabled,  setTimeEnabled]  = useState(false);
  const [timeStart,    setTimeStart]    = useState("09:00");
  const [timeEnd,      setTimeEnd]      = useState("10:00");
  const [loading,      setLoading]      = useState(false);
  const [isPending,    startTransition] = useTransition();

  const inputRef  = useRef<HTMLInputElement>(null);
  const noteRef   = useRef<HTMLTextAreaElement>(null);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Map logistics sub-type → transfer type filter
  function getTransferTypes(lt: LogisticsType | null): ("AIRPORT_TRANSFER" | "TAXI" | "CHAUFFEUR" | "SHUTTLE")[] | undefined {
    if (!lt) return undefined;
    if (lt === "ARRIVAL_TRANSFER" || lt === "DEPARTURE_TRANSFER") return ["AIRPORT_TRANSFER"];
    if (lt === "CITY_TRANSFER") return ["TAXI", "CHAUFFEUR", "SHUTTLE"];
    return undefined; // RENTAL_PICKUP / RENTAL_DROPOFF — handled by type filter
  }

  function runSearch(q: string, typeFilter?: PlanItemType[], lt?: LogisticsType | null) {
    setLoading(true);
    (async () => {
      const ttypes = getTransferTypes(lt ?? logType);
      const res = await searchPlanItems(q, destinationId, typeFilter, ttypes);
      if (res.success) setResults(res.results);
      setLoading(false);
    })();
  }

  function loadWishlist(typeFilter?: PlanItemType[]) {
    (async () => {
      const res = await getWishlistForPlanEditor(destinationId);
      if (res.success) {
        setWishlist(
          typeFilter
            ? res.results.filter((r) => typeFilter.includes(r.type as PlanItemType))
            : res.results
        );
      }
    })();
  }

  function handleQueryChange(q: string, typeFilter?: PlanItemType[]) {
    setQuery(q);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => runSearch(q, typeFilter, logType), 350);
  }

  // ── Step: select block type ──────────────────────────────────────────────────

  function handleTypeSelect(type: BlockTypeOption["type"]) {
    if (type === "SHOPPING") {
      onClose();
      onOpenShopping();
      return;
    }
    if (type === "NOTE") {
      setBlockType("NOTE");
      setStep("note");
      setTimeout(() => noteRef.current?.focus(), 50);
      return;
    }
    if (type === "TRANSFER" || type === "RENTAL") {
      setBlockType(type);
      setStep("logistics-subtype");
      return;
    }
    setBlockType(type);
    setStep("search");
    const filter = [type] as PlanItemType[];
    runSearch("", filter);
    loadWishlist(filter);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  // ── Step: select logistics sub-type ─────────────────────────────────────────

  function handleLogisticsSubtype(lt: LogisticsType) {
    setLogType(lt);
    const itemType: PlanItemType =
      lt === "RENTAL_PICKUP" || lt === "RENTAL_DROPOFF" ? "RENTAL" : "TRANSFER";
    setBlockType(itemType);
    setStep("search");
    runSearch("", [itemType], lt);
    loadWishlist([itemType]);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  // ── Add item block ────────────────────────────────────────────────────────────

  function addItem(item: SearchResultItem) {
    if (!blockType || blockType === "NOTE") return;
    startTransition(async () => {
      const time = timeEnabled ? { start: timeStart, end: timeEnd } : undefined;
      const res = await addBlockToPlan(
        planId,
        dayIndex,
        blockType as "ACTIVITY" | "ATTRACTION" | "RESTAURANT" | "STAY" | "TRANSFER" | "RENTAL",
        item.id,
        time,
        logType ?? undefined
      );
      if (!res.success) { toast.error(res.error); return; }
      toast.success(`${item.name} added`);
      onAdded(res.itinerary);
      onClose();
    });
  }

  // ── Add note block ────────────────────────────────────────────────────────────

  function addNote() {
    if (!noteText.trim()) return;
    startTransition(async () => {
      const time = timeEnabled ? { start: timeStart, end: timeEnd } : undefined;
      const res  = await addNoteBlockToPlan(planId, dayIndex, noteText, time);
      if (!res.success) { toast.error(res.error); return; }
      toast.success("Note added");
      onAdded(res.itinerary);
      onClose();
    });
  }

  // ── Back navigation ───────────────────────────────────────────────────────────

  function goBack() {
    if (step === "search" && (blockType === "TRANSFER" || blockType === "RENTAL")) {
      setStep("logistics-subtype");
      setLogType(null);
    } else if (step === "search" || step === "note" || step === "logistics-subtype") {
      setStep("type");
      setBlockType(null);
      setLogType(null);
      setQuery("");
      setResults([]);
      setNoteText("");
    }
  }

  // ── Step header text ──────────────────────────────────────────────────────────

  const headerTitle = {
    type:              "What are you adding?",
    "logistics-subtype": "What kind of transfer?",
    search:            blockType ? `Add ${blockType.charAt(0) + blockType.slice(1).toLowerCase()}` : "Search",
    note:              "Add a note",
  }[step];

  const typeFilter: PlanItemType[] | undefined = blockType && blockType !== "NOTE"
    ? [blockType]
    : undefined;

  const displayList = activeTab === "wishlist" ? wishlist : results;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            {step !== "type" && (
              <button
                onClick={goBack}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <h3 className="font-semibold text-gray-900 text-sm">{headerTitle}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Step 1: Type selector ───────────────────────────────────────────── */}
        {step === "type" && (
          <div className="p-4 grid grid-cols-4 gap-2 overflow-y-auto">
            {BLOCK_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.type}
                onClick={() => handleTypeSelect(opt.type)}
                className={[
                  "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
                  opt.color,
                ].join(" ")}
              >
                <span className="text-2xl leading-none">{opt.emoji}</span>
                <span className="text-[11px] font-semibold text-gray-700">{opt.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Step 2a: Logistics sub-type ─────────────────────────────────────── */}
        {step === "logistics-subtype" && (
          <div className="p-4 space-y-2 overflow-y-auto">
            {LOGISTICS_SUBTYPES.filter((lt) =>
              blockType === "RENTAL"
                ? lt.key === "RENTAL_PICKUP" || lt.key === "RENTAL_DROPOFF"
                : lt.key !== "RENTAL_PICKUP" && lt.key !== "RENTAL_DROPOFF"
            ).map((lt) => (
              <button
                key={lt.key}
                onClick={() => handleLogisticsSubtype(lt.key)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
              >
                <span className="text-xl leading-none">{lt.emoji}</span>
                <span className="text-sm font-medium text-gray-800">{lt.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Step 2b: Search ─────────────────────────────────────────────────── */}
        {step === "search" && (
          <>
            {/* Tabs */}
            <div className="flex border-b border-gray-100 shrink-0">
              <button
                onClick={() => setActiveTab("search")}
                className={[
                  "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors",
                  activeTab === "search"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700",
                ].join(" ")}
              >
                <Search className="h-3.5 w-3.5" />
                Search
              </button>
              <button
                onClick={() => setActiveTab("wishlist")}
                className={[
                  "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors",
                  activeTab === "wishlist"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700",
                ].join(" ")}
              >
                <Heart className="h-3.5 w-3.5" />
                Wishlist
                {wishlist.length > 0 && (
                  <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                    {wishlist.length}
                  </span>
                )}
              </button>
            </div>

            {/* Search input */}
            {activeTab === "search" && (
              <div className="px-5 py-3 border-b border-gray-100 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => handleQueryChange(e.target.value, typeFilter)}
                    placeholder={`Search ${blockType?.toLowerCase() ?? "items"}s…`}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Optional time row */}
            <div className="px-5 py-2.5 border-b border-gray-50 shrink-0 bg-gray-50/60">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setTimeEnabled((v) => !v)}
                  className={[
                    "flex items-center gap-1.5 text-xs font-medium transition-colors",
                    timeEnabled ? "text-primary" : "text-gray-400 hover:text-gray-600",
                  ].join(" ")}
                >
                  <Clock className="h-3.5 w-3.5" />
                  {timeEnabled ? "Time set" : "Set time (optional)"}
                </button>
                {timeEnabled && (
                  <div className="flex items-center gap-1.5 flex-1">
                    <select
                      value={timeStart}
                      onChange={(e) => {
                        setTimeStart(e.target.value);
                        const idx = TIME_OPTIONS.indexOf(e.target.value);
                        if (TIME_OPTIONS.indexOf(timeEnd) <= idx) {
                          setTimeEnd(TIME_OPTIONS[Math.min(idx + 2, TIME_OPTIONS.length - 1)]);
                        }
                      }}
                      className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-primary/50 bg-white"
                    >
                      {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <span className="text-gray-400 text-xs">–</span>
                    <select
                      value={timeEnd}
                      onChange={(e) => setTimeEnd(e.target.value)}
                      className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-primary/50 bg-white"
                    >
                      {TIME_OPTIONS.filter((t) => t > timeStart).map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setTimeEnabled(false)}
                      className="p-0.5 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Results list */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === "search" && loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : displayList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                  {activeTab === "wishlist" ? (
                    <>
                      <Heart className="h-8 w-8 text-gray-200 mb-3" />
                      <p className="text-sm font-medium text-gray-500">No wishlist items</p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400">No results found</p>
                  )}
                </div>
              ) : (
                <ul className="divide-y divide-gray-50 px-2 py-2">
                  {displayList.map((item) => (
                    <li key={`${item.type}-${item.id}`}>
                      <button
                        type="button"
                        onClick={() => addItem(item)}
                        disabled={isPending}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
                      >
                        {item.imageUrl ? (
                          <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              width={40} height={40}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center text-base">
                            {TYPE_ICON[item.type] ?? "📍"}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            <span className={`inline-block mr-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${TYPE_COLOR[item.type] ?? "bg-gray-100 text-gray-600"}`}>
                              {item.type}
                            </span>
                            {item.price > 0 ? `TND ${item.price}` : "Free"}
                            {item.location ? ` · ${item.location}` : ""}
                          </p>
                        </div>
                        <Plus className="h-4 w-4 text-primary shrink-0" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {/* ── Step 2c: Note ───────────────────────────────────────────────────── */}
        {step === "note" && (
          <div className="flex-1 flex flex-col p-5 gap-3">
            {/* Optional time */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <button
                onClick={() => setTimeEnabled((v) => !v)}
                className={[
                  "flex items-center gap-1.5 text-xs font-medium transition-colors",
                  timeEnabled ? "text-primary" : "text-gray-400 hover:text-gray-600",
                ].join(" ")}
              >
                <Clock className="h-3.5 w-3.5" />
                {timeEnabled ? "Time set" : "Set time (optional)"}
              </button>
              {timeEnabled && (
                <div className="flex items-center gap-1.5 flex-1">
                  <select
                    value={timeStart}
                    onChange={(e) => {
                      setTimeStart(e.target.value);
                      const idx = TIME_OPTIONS.indexOf(e.target.value);
                      if (TIME_OPTIONS.indexOf(timeEnd) <= idx) {
                        setTimeEnd(TIME_OPTIONS[Math.min(idx + 2, TIME_OPTIONS.length - 1)]);
                      }
                    }}
                    className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-primary/50 bg-white"
                  >
                    {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span className="text-gray-400 text-xs">–</span>
                  <select
                    value={timeEnd}
                    onChange={(e) => setTimeEnd(e.target.value)}
                    className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-primary/50 bg-white"
                  >
                    {TIME_OPTIONS.filter((t) => t > timeStart).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setTimeEnabled(false)}
                    className="p-0.5 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-500">
              Add a free-text note — instructions, reminders, or anything travelers should know.
            </p>
            <textarea
              ref={noteRef}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={5}
              maxLength={400}
              placeholder="e.g. Check into hotel, meet at lobby, free time to explore the medina…"
              className="flex-1 w-full text-sm px-3 py-2.5 border border-amber-200 rounded-xl bg-amber-50/40 focus:outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-100 resize-none"
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addNote(); }}
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-400">{noteText.length}/400</span>
              <button
                onClick={addNote}
                disabled={isPending || !noteText.trim()}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />
                {isPending ? "Adding…" : "Add note"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Shopping picks section ─────────────────────────────────────────────────── */

function ShoppingSection({
  planId, dayIndex, destinationId, current, onChanged, isOpen, onClose,
}: {
  planId:        string;
  dayIndex:      number;
  destinationId: string;
  current:       PlanShopSuggestion[] | undefined;
  onChanged:     (itinerary: PlanDay[]) => void;
  isOpen:        boolean;
  onClose:       () => void;
}) {
  const [shopStep,   setShopStep]   = useState<"shop" | "products">("shop");
  const [query,      setQuery]      = useState("");
  const [shops,      setShops]      = useState<ShopSearchResult[]>([]);
  const [picked,     setPicked]     = useState<ShopSearchResult | null>(null);
  const [products,   setProducts]   = useState<ProductSearchResult[]>([]);
  const [selected,   setSelected]   = useState<Set<string>>(new Set());
  const [shopNote,   setShopNote]   = useState("");
  const [loading,    setLoading]    = useState(false);
  const [isPending,  startTransition] = useTransition();
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function searchShops(q: string) {
    setLoading(true);
    (async () => {
      const res = await searchShopsForPlanEditor(q, destinationId);
      if (res.success) setShops(res.results);
      setLoading(false);
    })();
  }

  function handleQueryChange(v: string) {
    setQuery(v);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => searchShops(v), 350);
  }

  // Reset + load shops when drawer opens
  useEffect(() => {
    if (!isOpen) return;
    setShopStep("shop");
    setQuery("");
    setShopNote("");
    setPicked(null);
    setSelected(new Set());
    searchShops("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function handleShopSelect(shop: ShopSearchResult) {
    setPicked(shop);
    setSelected(new Set());
    setShopNote("");
    setShopStep("products");
    setLoading(true);
    (async () => {
      const res = await getShopProductsForPlanEditor(shop.id);
      if (res.success) setProducts(res.products);
      setLoading(false);
    })();
  }

  function toggleProduct(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleAddShop() {
    if (!picked) return;
    startTransition(async () => {
      const pickedProducts = products
        .filter((p) => selected.has(p.id))
        .map((p) => ({
          productId:   p.id,
          productSlug: p.slug,
          productName: p.name,
          price:       p.price,
          imageUrl:    p.imageUrl ?? undefined,
        }));

      const shopPick: PlanShopSuggestion = {
        shopId:   picked.id,
        shopSlug: picked.slug,
        shopName: picked.name,
        category: picked.category,
        imageUrl: picked.imageUrl ?? undefined,
        note:     shopNote.trim(),
        products: pickedProducts,
      };

      const res = await addShopPickToPlanDay(planId, dayIndex, shopPick);
      if (!res.success) { toast.error(res.error); return; }
      toast.success(`${picked.name} added`);
      onClose();
      onChanged(res.itinerary);
    });
  }

  function handleRemoveShop(shopId: string) {
    startTransition(async () => {
      const res = await removeShopPickFromPlanDay(planId, dayIndex, shopId);
      if (!res.success) { toast.error(res.error); return; }
      onChanged(res.itinerary);
    });
  }

  const shopsList = current ?? [];

  return (
    <>
      {/* Existing picks (always visible in day) */}
      {shopsList.length > 0 && (
        <div className="space-y-2">
          {shopsList.map((shop) => (
            <div key={shop.shopId} className="flex items-center gap-3 px-4 py-3 bg-orange-50/60 border border-orange-100 rounded-xl group">
              {shop.imageUrl ? (
                <div className="h-8 w-8 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                  <Image src={shop.imageUrl} alt={shop.shopName} width={32} height={32} className="object-cover w-full h-full" />
                </div>
              ) : (
                <span className="text-lg shrink-0">🛍️</span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{shop.shopName}</p>
                <p className="text-xs text-gray-500">
                  {shop.category}
                  {shop.products.length > 0 ? ` · ${shop.products.length} product${shop.products.length !== 1 ? "s" : ""}` : ""}
                </p>
              </div>
              <button
                onClick={() => handleRemoveShop(shop.shopId)}
                disabled={isPending}
                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2.5">
                {shopStep === "products" && (
                  <button
                    onClick={() => setShopStep("shop")}
                    className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                )}
                <h3 className="font-semibold text-gray-900 text-sm">
                  {shopStep === "shop" ? "Pick a shop" : picked?.name ?? "Select products"}
                </h3>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            {shopStep === "shop" && (
              <>
                <div className="px-5 py-3 border-b border-gray-100 shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      autoFocus
                      value={query}
                      onChange={(e) => handleQueryChange(e.target.value)}
                      placeholder="Search shops…"
                      className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {loading ? (
                    <div className="flex justify-center py-10">
                      <div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                  ) : shops.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-10">No shops found</p>
                  ) : (
                    <ul className="divide-y divide-gray-50 px-2 py-2">
                      {shops.map((shop) => (
                        <li key={shop.id}>
                          <button
                            type="button"
                            onClick={() => handleShopSelect(shop)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left"
                          >
                            {shop.imageUrl ? (
                              <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                                <Image src={shop.imageUrl} alt={shop.name} width={40} height={40} className="object-cover w-full h-full" />
                              </div>
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-orange-50 shrink-0 flex items-center justify-center text-xl">🛍️</div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{shop.name}</p>
                              <p className="text-xs text-gray-400">{shop.category}</p>
                            </div>
                            <Plus className="h-4 w-4 text-primary shrink-0" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}

            {shopStep === "products" && (
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                  {loading ? (
                    <div className="flex justify-center py-10">
                      <div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="p-4 space-y-3">
                      {products.length > 0 && (
                        <>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Select products to highlight (optional)
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            {products.map((p) => {
                              const isSel = selected.has(p.id);
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => toggleProduct(p.id)}
                                  className={[
                                    "relative rounded-xl border-2 overflow-hidden transition-all text-left",
                                    isSel ? "border-primary" : "border-gray-100 hover:border-gray-200",
                                  ].join(" ")}
                                >
                                  {p.imageUrl ? (
                                    <div className="relative h-20 w-full bg-gray-100">
                                      <Image src={p.imageUrl} alt={p.name} fill className="object-cover" sizes="120px" />
                                    </div>
                                  ) : (
                                    <div className="h-20 w-full bg-gray-50 flex items-center justify-center text-2xl">🛍</div>
                                  )}
                                  <div className="p-1.5">
                                    <p className="text-[10px] text-gray-700 truncate leading-tight">{p.name}</p>
                                    <p className="text-[10px] font-semibold text-orange-600">TND {p.price}</p>
                                  </div>
                                  {isSel && (
                                    <div className="absolute top-1.5 right-1.5 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                                      <Check className="h-3 w-3 text-white" />
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                          Shop note (optional)
                        </label>
                        <input
                          value={shopNote}
                          onChange={(e) => setShopNote(e.target.value)}
                          maxLength={120}
                          placeholder="e.g. Best handmade ceramics in the medina…"
                          className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-gray-100 shrink-0">
                  <button
                    onClick={handleAddShop}
                    disabled={isPending}
                    className="w-full py-3 bg-primary text-white font-semibold text-sm rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isPending ? "Adding…" : `Add ${picked?.name ?? "shop"}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Remove day confirmation ────────────────────────────────────────────────── */

function RemoveDayDialog({
  dayNumber, blockCount, onConfirm, onClose, isPending,
}: {
  dayNumber:  number;
  blockCount: number;
  onConfirm:  () => void;
  onClose:    () => void;
  isPending:  boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Remove Day {dayNumber}?</h3>
            <p className="text-sm text-gray-500 mt-1">
              {blockCount > 0
                ? `This will permanently remove Day ${dayNumber} and its ${blockCount} block${blockCount !== 1 ? "s" : ""}.`
                : `Day ${dayNumber} is empty and will be removed.`}
            </p>
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 py-2.5 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 py-2.5 text-sm font-semibold bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {isPending ? "Removing…" : "Remove day"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Day section ────────────────────────────────────────────────────────────── */

function DaySection({
  day, dayIndex, planId, destinationId, totalDays,
  onItineraryChanged,
}: {
  day:                PlanDay;
  dayIndex:           number;
  planId:             string;
  destinationId:      string;
  totalDays:          number;
  onItineraryChanged: (itinerary: PlanDay[]) => void;
}) {
  const [collapsed,        setCollapsed]        = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [addDrawerOpen,    setAddDrawerOpen]    = useState(false);
  const [shoppingOpen,     setShoppingOpen]     = useState(false);
  const [isPending,        startTransition]     = useTransition();

  // Shopping state synced from server returns
  const [localShopping, setLocalShopping] = useState<PlanShopSuggestion[] | undefined>(
    day.shopping?.shops
  );

  function handleShoppingChanged(itinerary: PlanDay[]) {
    const updated = itinerary[dayIndex];
    if (updated) setLocalShopping(updated.shopping?.shops);
    onItineraryChanged(itinerary);
  }

  // ── Day theme editor ─────────────────────────────────────────────────────────
  const [themeEditing,  setThemeEditing]  = useState(false);
  const [themeValue,    setThemeValue]    = useState(day.theme);
  const [, themeTransition]               = useTransition();

  function saveTheme() {
    const trimmed = themeValue.trim();
    if (trimmed === day.theme) { setThemeEditing(false); return; }
    themeTransition(async () => {
      const res = await updateDayTheme(planId, dayIndex, trimmed);
      if (!res.success) { toast.error(res.error); return; }
      day.theme = trimmed || `Day ${dayIndex + 1}`;
      setThemeEditing(false);
    });
  }

  // ── Day notes editor ─────────────────────────────────────────────────────────
  const [notesOpen,    setNotesOpen]    = useState(!!day.notes);
  const [notesValue,   setNotesValue]   = useState(day.notes ?? "");
  const [notesChanged, setNotesChanged] = useState(false);
  const notesDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, notesTransition]             = useTransition();

  function handleNotesChange(v: string) {
    setNotesValue(v);
    setNotesChanged(v !== (day.notes ?? ""));
    if (notesDebounce.current) clearTimeout(notesDebounce.current);
    notesDebounce.current = setTimeout(() => {
      notesTransition(async () => {
        const res = await updateDayNotes(planId, dayIndex, v);
        if (res.success) { day.notes = v; setNotesChanged(false); }
      });
    }, 1000);
  }

  // ── Drag-to-reorder (HTML5 DnD on blocks array) ──────────────────────────────
  const dragSourceId = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleDragStart = useCallback((blockId: string) => {
    dragSourceId.current = blockId;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, blockId: string) => {
    e.preventDefault();
    if (dragSourceId.current !== blockId) setDragOverId(blockId);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetBlockId: string) => {
    e.preventDefault();
    setDragOverId(null);
    const sourceId = dragSourceId.current;
    dragSourceId.current = null;
    if (!sourceId || sourceId === targetBlockId) return;

    const blocks    = day.blocks;
    const sourceIdx = blocks.findIndex((b) => b.id === sourceId);
    const targetIdx = blocks.findIndex((b) => b.id === targetBlockId);
    if (sourceIdx === -1 || targetIdx === -1) return;

    const newBlocks = [...blocks];
    const [moved]   = newBlocks.splice(sourceIdx, 1);
    newBlocks.splice(targetIdx, 0, moved);
    day.blocks = newBlocks; // optimistic local update

    startTransition(async () => {
      const res = await reorderBlocksInDay(planId, dayIndex, newBlocks.map((b) => b.id));
      if (!res.success) {
        toast.error("Failed to reorder");
        day.blocks = blocks; // revert
      } else {
        onItineraryChanged(res.itinerary);
      }
    });
  }, [day, planId, dayIndex, startTransition, onItineraryChanged]);

  function handleRemoveDay() {
    startTransition(async () => {
      const res = await removeDayFromPlan(planId, dayIndex);
      if (!res.success) { toast.error(res.error); return; }
      toast.success(`Day ${day.dayNumber} removed`);
      setRemoveDialogOpen(false);
      onItineraryChanged(res.itinerary);
    });
  }

  const nonShoppingBlocks = day.blocks;

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">

        {/* ── Day header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="flex items-center gap-2.5 group flex-1 min-w-0 mr-3"
          >
            <span className="h-7 w-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
              {day.dayNumber}
            </span>
            {collapsed
              ? <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600 shrink-0" />
              : <ChevronUp   className="h-4 w-4 text-gray-400 group-hover:text-gray-600 shrink-0" />
            }
          </button>

          {/* Theme — inline editor */}
          {themeEditing ? (
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <input
                autoFocus
                value={themeValue}
                onChange={(e) => setThemeValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveTheme(); if (e.key === "Escape") setThemeEditing(false); }}
                onBlur={saveTheme}
                maxLength={60}
                className="flex-1 text-sm font-semibold text-gray-900 bg-transparent border-b-2 border-primary/60 outline-none min-w-0 pb-0.5"
              />
              <button
                onClick={saveTheme}
                className="h-6 w-6 rounded-md bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors shrink-0"
              >
                <Check className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setThemeEditing(true)}
              className="flex items-center gap-1.5 group/theme flex-1 min-w-0"
              title="Edit day theme"
            >
              <span className="text-sm font-semibold text-gray-900 truncate">{themeValue}</span>
              <Pencil className="h-3 w-3 text-gray-400 opacity-0 group-hover/theme:opacity-100 transition-opacity shrink-0" />
            </button>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-1 shrink-0 ml-3">
            <span className="text-xs text-gray-400 hidden sm:block">
              {nonShoppingBlocks.length} {nonShoppingBlocks.length === 1 ? "block" : "blocks"}
            </span>
            <button
              onClick={() => setNotesOpen((v) => !v)}
              className={`p-1.5 rounded-lg transition-colors ${
                notesOpen || day.notes
                  ? "bg-amber-50 text-amber-600"
                  : "text-gray-300 hover:text-gray-500 hover:bg-gray-100"
              }`}
              title="Day notes"
            >
              <FileText className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setAddDrawerOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
            {totalDays > 1 && (
              <button
                onClick={() => setRemoveDialogOpen(true)}
                disabled={isPending}
                className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                title="Remove this day"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Day notes ───────────────────────────────────────────────────────── */}
        {notesOpen && (
          <div className="px-5 py-3 border-b border-gray-100 bg-amber-50/40">
            <textarea
              value={notesValue}
              onChange={(e) => handleNotesChange(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Practical tips for this day — best time to visit, what to bring, local advice…"
              className="w-full text-xs px-3 py-2 border border-amber-200 rounded-xl bg-white focus:outline-none focus:border-amber-300 resize-none"
            />
            {notesChanged && (
              <p className="text-[10px] text-amber-600 mt-1">Saving…</p>
            )}
          </div>
        )}

        {/* ── Block list (in array order — no time sort) ───────────────────────── */}
        {!collapsed && (
          <div className="p-4">
            {nonShoppingBlocks.length === 0 ? (
              <button
                onClick={() => setAddDrawerOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-8 text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-xl hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
              >
                <Plus className="h-4 w-4" />
                Add your first block
              </button>
            ) : (
              <div className="space-y-2">
                {nonShoppingBlocks.map((block) => (
                  <BlockCard
                    key={block.id}
                    block={block}
                    planId={planId}
                    onRemoved={(itinerary) => onItineraryChanged(itinerary)}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    isDragOver={dragOverId === block.id}
                  />
                ))}
                {/* Bottom add shortcut */}
                <button
                  onClick={() => setAddDrawerOpen(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-gray-400 hover:text-primary transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add block
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Shopping picks ───────────────────────────────────────────────────── */}
        {!collapsed && (
          <div className="px-4 pb-4 border-t border-gray-50 pt-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Shopping Picks
              </p>
              <button
                onClick={() => setShoppingOpen(true)}
                className="flex items-center gap-1 text-[10px] font-semibold text-orange-500 hover:text-orange-600 transition-colors"
              >
                <Plus className="h-3 w-3" />
                {localShopping?.length ? "Add shop" : "Add picks"}
              </button>
            </div>
            <ShoppingSection
              planId={planId}
              dayIndex={dayIndex}
              destinationId={destinationId}
              current={localShopping}
              onChanged={handleShoppingChanged}
              isOpen={shoppingOpen}
              onClose={() => setShoppingOpen(false)}
            />
            {(!localShopping || localShopping.length === 0) && (
              <p className="text-xs text-gray-400 py-1">No shopping picks yet.</p>
            )}
          </div>
        )}
      </div>

      {/* ── Add block drawer ─────────────────────────────────────────────────── */}
      {addDrawerOpen && (
        <AddBlockDrawer
          planId={planId}
          dayIndex={dayIndex}
          destinationId={destinationId}
          onAdded={(itinerary) => { onItineraryChanged(itinerary); setAddDrawerOpen(false); }}
          onClose={() => setAddDrawerOpen(false)}
          onOpenShopping={() => { setAddDrawerOpen(false); setShoppingOpen(true); }}
        />
      )}

      {/* ── Remove day dialog ─────────────────────────────────────────────────── */}
      {removeDialogOpen && (
        <RemoveDayDialog
          dayNumber={day.dayNumber}
          blockCount={day.blocks.length}
          onConfirm={handleRemoveDay}
          onClose={() => setRemoveDialogOpen(false)}
          isPending={isPending}
        />
      )}
    </>
  );
}

/* ─── Multi-day block card (stays / rentals) ─────────────────────────────────── */

function MultiDayBlockCard({
  block, kind, planId, duration, onChanged,
}: {
  block:     PlanMultiDayBlock;
  kind:      "stay" | "rental";
  planId:    string;
  duration:  number;
  onChanged: (itinerary: PlanItinerary) => void;
}) {
  const [noteOpen,    setNoteOpen]    = useState(false);
  const [noteValue,   setNoteValue]   = useState(block.note ?? "");
  const [noteChanged, setNoteChanged] = useState(false);
  const [isPending,   startTransition] = useTransition();

  const emoji = kind === "stay" ? "🏨" : "🚗";

  const rangeLabel =
    block.fromDay === 1 && block.toDay === duration
      ? `All ${duration} days`
      : block.fromDay === block.toDay
      ? `Day ${block.fromDay}`
      : `Day ${block.fromDay} – Day ${block.toDay}`;

  function remove() {
    startTransition(async () => {
      const res = kind === "stay"
        ? await removeStayFromPlan(planId, block.id)
        : await removeRentalFromPlan(planId, block.id);
      if (!res.success) { toast.error(res.error); return; }
      onChanged(res.itinerary);
    });
  }

  function saveNote() {
    startTransition(async () => {
      const res = await updateMultiDayBlockNote(planId, block.id, noteValue, kind);
      if (!res.success) { toast.error(res.error); return; }
      toast.success("Note saved");
      setNoteChanged(false);
    });
  }

  return (
    <div className="flex items-stretch gap-0 border border-gray-100 rounded-xl group bg-white hover:border-gray-200 overflow-hidden transition-all">
      {/* Thumbnail / emoji */}
      {block.item.imageUrl ? (
        <div className="h-12 w-12 rounded-lg overflow-hidden shrink-0 bg-gray-100 my-2.5 ml-2">
          <Image src={block.item.imageUrl} alt={block.item.name} width={48} height={48} className="object-cover w-full h-full" />
        </div>
      ) : (
        <div className="h-12 w-12 rounded-lg bg-gray-50 shrink-0 flex items-center justify-center text-xl my-2.5 ml-2">
          {emoji}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0 px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${kind === "stay" ? "bg-purple-50 text-purple-700" : "bg-fuchsia-50 text-fuchsia-700"}`}>
                {kind === "stay" ? "Stay" : "Rental"}
              </span>
              <span className="text-[10px] text-gray-400">{rangeLabel}</span>
            </div>
            <p className="text-sm font-medium text-gray-900 truncate">{block.item.name}</p>
            {block.item.price > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">TND {block.item.price} / {kind === "stay" ? "night" : "day"}</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setNoteOpen((v) => !v)}
              className={`p-1.5 rounded-lg transition-colors ${noteOpen || block.note ? "bg-amber-50 text-amber-600" : "hover:bg-gray-100 text-gray-400"}`}
              title="Add note"
            >
              <StickyNote className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={remove}
              disabled={isPending}
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
              title="Remove"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        {noteOpen && (
          <div className="mt-2 space-y-1.5">
            <textarea
              value={noteValue}
              onChange={(e) => { setNoteValue(e.target.value); setNoteChanged(e.target.value !== (block.note ?? "")); }}
              rows={2}
              maxLength={300}
              placeholder="Add a note for travelers…"
              className="w-full text-xs px-3 py-2 border border-amber-200 rounded-lg bg-amber-50/50 focus:outline-none focus:border-amber-300 resize-none"
            />
            {noteChanged && (
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => { setNoteValue(block.note ?? ""); setNoteChanged(false); }} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                <button onClick={saveNote} disabled={isPending} className="text-xs font-medium px-2.5 py-1 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50">
                  {isPending ? "Saving…" : "Save note"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Multi-day add drawer (stays / rentals) ─────────────────────────────────── */

function MultiDayAddDrawer({
  kind, planId, duration, destinationId, onAdded, onClose,
}: {
  kind:          "stay" | "rental";
  planId:        string;
  duration:      number;
  destinationId: string;
  onAdded:       (itinerary: PlanItinerary) => void;
  onClose:       () => void;
}) {
  type MdStep = "search" | "range";
  const [step,        setStep]        = useState<MdStep>("search");
  const [query,       setQuery]       = useState("");
  const [results,     setResults]     = useState<SearchResultItem[]>([]);
  const [picked,      setPicked]      = useState<SearchResultItem | null>(null);
  const [fromDay,     setFromDay]     = useState(1);
  const [toDay,       setToDay]       = useState(duration);
  const [loading,     setLoading]     = useState(false);
  const [isPending,   startTransition] = useTransition();
  const inputRef  = useRef<HTMLInputElement>(null);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const itemType: PlanItemType = kind === "stay" ? "STAY" : "RENTAL";

  function runSearch(q: string) {
    setLoading(true);
    (async () => {
      const res = await searchPlanItems(q, destinationId, [itemType]);
      if (res.success) setResults(res.results);
      setLoading(false);
    })();
  }

  useEffect(() => {
    runSearch("");
    setTimeout(() => inputRef.current?.focus(), 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleQueryChange(q: string) {
    setQuery(q);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => runSearch(q), 350);
  }

  function handleItemSelect(item: SearchResultItem) {
    setPicked(item);
    setStep("range");
  }

  function handleAdd() {
    if (!picked) return;
    startTransition(async () => {
      const res = kind === "stay"
        ? await addStayToPlan(planId, picked.id, fromDay, toDay)
        : await addRentalToPlan(planId, picked.id, fromDay, toDay);
      if (!res.success) { toast.error(res.error); return; }
      toast.success(`${picked.name} added`);
      onAdded(res.itinerary);
      onClose();
    });
  }

  const dayOptions = Array.from({ length: duration }, (_, i) => i + 1);
  const title = kind === "stay" ? "Add accommodation" : "Add rental";
  const emoji = kind === "stay" ? "🏨" : "🚗";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            {step === "range" && (
              <button onClick={() => setStep("search")} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <h3 className="font-semibold text-gray-900 text-sm">
              {step === "search" ? title : `Set day range`}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search step */}
        {step === "search" && (
          <>
            <div className="px-5 py-3 border-b border-gray-100 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder={`Search ${kind === "stay" ? "hotels & stays" : "car & bike rentals"}…`}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-colors"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : results.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-12">No results found</p>
              ) : (
                <ul className="divide-y divide-gray-50 px-2 py-2">
                  {results.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => handleItemSelect(item)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left"
                      >
                        {item.imageUrl ? (
                          <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                            <Image src={item.imageUrl} alt={item.name} width={40} height={40} className="object-cover w-full h-full" />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center text-base">{emoji}</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {item.price > 0 ? `TND ${item.price}` : "Free"}
                            {item.location ? ` · ${item.location}` : ""}
                          </p>
                        </div>
                        <Plus className="h-4 w-4 text-primary shrink-0" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {/* Range step */}
        {step === "range" && picked && (
          <div className="flex-1 flex flex-col p-5 gap-5">
            {/* Selected item preview */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              {picked.imageUrl ? (
                <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                  <Image src={picked.imageUrl} alt={picked.name} width={40} height={40} className="object-cover w-full h-full" />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center text-base">{emoji}</div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{picked.name}</p>
                {picked.price > 0 && <p className="text-xs text-gray-400">TND {picked.price} / {kind === "stay" ? "night" : "day"}</p>}
              </div>
            </div>

            {/* Day range pickers */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Day range</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">From day</label>
                  <select
                    value={fromDay}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setFromDay(v);
                      if (toDay < v) setToDay(v);
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary/50 bg-white"
                  >
                    {dayOptions.map((d) => <option key={d} value={d}>Day {d}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">To day</label>
                  <select
                    value={toDay}
                    onChange={(e) => setToDay(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary/50 bg-white"
                  >
                    {dayOptions.filter((d) => d >= fromDay).map((d) => <option key={d} value={d}>Day {d}</option>)}
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                {kind === "stay"
                  ? `${toDay - fromDay} night${toDay - fromDay !== 1 ? "s" : ""}`
                  : `${toDay - fromDay + 1} day${toDay - fromDay + 1 !== 1 ? "s" : ""}`}
              </p>
            </div>

            <div className="mt-auto">
              <button
                onClick={handleAdd}
                disabled={isPending}
                className="w-full py-3 bg-primary text-white font-semibold text-sm rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isPending ? "Adding…" : `Add ${picked.name}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Stays section ──────────────────────────────────────────────────────────── */

function StaysSection({
  planId, duration, destinationId, stays, onChanged,
}: {
  planId:        string;
  duration:      number;
  destinationId: string;
  stays:         PlanMultiDayBlock[];
  onChanged:     (itinerary: PlanItinerary) => void;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-base">🏨</span>
          <p className="text-sm font-semibold text-gray-900">Accommodation</p>
          {stays.length > 0 && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {stays.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-primary border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add stay
        </button>
      </div>

      <div className="p-4 space-y-2">
        {stays.length === 0 ? (
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-6 text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-xl hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
          >
            <Plus className="h-4 w-4" />
            Add accommodation
          </button>
        ) : (
          stays.map((block) => (
            <MultiDayBlockCard
              key={block.id}
              block={block}
              kind="stay"
              planId={planId}
              duration={duration}
              onChanged={onChanged}
            />
          ))
        )}
      </div>

      {drawerOpen && (
        <MultiDayAddDrawer
          kind="stay"
          planId={planId}
          duration={duration}
          destinationId={destinationId}
          onAdded={onChanged}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </div>
  );
}

/* ─── Rentals section ────────────────────────────────────────────────────────── */

function RentalsSection({
  planId, duration, destinationId, rentals, onChanged,
}: {
  planId:        string;
  duration:      number;
  destinationId: string;
  rentals:       PlanMultiDayBlock[];
  onChanged:     (itinerary: PlanItinerary) => void;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-base">🚗</span>
          <p className="text-sm font-semibold text-gray-900">Rentals</p>
          {rentals.length > 0 && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {rentals.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-primary border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add rental
        </button>
      </div>

      <div className="p-4 space-y-2">
        {rentals.length === 0 ? (
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-6 text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-xl hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
          >
            <Plus className="h-4 w-4" />
            Add rental
          </button>
        ) : (
          rentals.map((block) => (
            <MultiDayBlockCard
              key={block.id}
              block={block}
              kind="rental"
              planId={planId}
              duration={duration}
              onChanged={onChanged}
            />
          ))
        )}
      </div>

      {drawerOpen && (
        <MultiDayAddDrawer
          kind="rental"
          planId={planId}
          duration={duration}
          destinationId={destinationId}
          onAdded={onChanged}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </div>
  );
}

/* ─── Main tab ───────────────────────────────────────────────────────────────── */

export function GuidePlanItineraryTab({ planId, itinerary: initialItinerary, destinationId }: Props) {
  const [planItinerary, setPlanItinerary] = useState<PlanItinerary>(initialItinerary);
  const [isPending, startTransition] = useTransition();

  const days = planItinerary.days;

  function handleDaysChanged(updatedDays: PlanDay[]) {
    setPlanItinerary((prev) => ({ ...prev, days: updatedDays }));
  }

  function handleMultiDayChanged(updated: PlanItinerary) {
    setPlanItinerary(updated);
  }

  function handleAddDay() {
    startTransition(async () => {
      const res = await addDayToPlan(planId);
      if (!res.success) { toast.error(res.error); return; }
      setPlanItinerary((prev) => ({ ...prev, days: res.itinerary }));
      toast.success(`Day ${res.itinerary.length} added`);
    });
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {/* ── Stays & Rentals (trip-level) ───────────────────────────────────── */}
      <StaysSection
        planId={planId}
        duration={days.length}
        destinationId={destinationId}
        stays={planItinerary.stays}
        onChanged={handleMultiDayChanged}
      />
      <RentalsSection
        planId={planId}
        duration={days.length}
        destinationId={destinationId}
        rentals={planItinerary.rentals}
        onChanged={handleMultiDayChanged}
      />

      {/* ── Day sections ───────────────────────────────────────────────────── */}
      {days.map((day, dayIndex) => (
        <DaySection
          key={`day-${day.dayNumber}`}
          day={day}
          dayIndex={dayIndex}
          planId={planId}
          destinationId={destinationId}
          totalDays={days.length}
          onItineraryChanged={handleDaysChanged}
        />
      ))}

      <button
        onClick={handleAddDay}
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-medium text-gray-500 border-2 border-dashed border-gray-200 rounded-2xl hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all disabled:opacity-50"
      >
        {isPending ? (
          <span className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        Add day
      </button>
    </div>
  );
}
