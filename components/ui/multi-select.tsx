// Ported from guidni-old / yummy-branch, improved to Guidni design system.
// Generic multi-select: Popover trigger + Command (searchable) + checkboxes.

"use client";

import * as React from "react";
import { CheckIcon, XCircle, ChevronDown, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

export interface MultiSelectOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface MultiSelectProps {
  options:             MultiSelectOption[];
  onValueChange:       (value: string[]) => void;
  defaultValue?:       string[];
  placeholder?:        string;
  maxCount?:           number;
  modalPopover?:       boolean;
  className?:          string;
  searchPlaceholder?:  string;
  noResultsText?:      string;
  selectAllText?:      string;
  clearText?:          string;
  closeText?:          string;
}

export function MultiSelect({
  options,
  onValueChange,
  defaultValue       = [],
  placeholder        = "Select options",
  maxCount           = 3,
  modalPopover       = false,
  className,
  searchPlaceholder  = "Search...",
  noResultsText      = "No results found.",
  selectAllText      = "Select All",
  clearText          = "Clear",
  closeText          = "Close",
}: MultiSelectProps) {
    const [selectedValues, setSelectedValues] = React.useState<string[]>(defaultValue);
    const [isPopoverOpen,  setIsPopoverOpen]  = React.useState(false);

    // Keep internal state in sync when URL params change (parent controls defaultValue)
    React.useEffect(() => {
      setSelectedValues(defaultValue);
    }, [JSON.stringify(defaultValue)]); // eslint-disable-line react-hooks/exhaustive-deps

    const toggleOption = (value: string) => {
      const next = selectedValues.includes(value)
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value];
      setSelectedValues(next);
      onValueChange(next);
    };

    const handleClear = () => {
      setSelectedValues([]);
      onValueChange([]);
    };

    const toggleAll = () => {
      if (selectedValues.length === options.length) {
        handleClear();
      } else {
        const all = options.map((o) => o.value);
        setSelectedValues(all);
        onValueChange(all);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") setIsPopoverOpen(true);
      if (e.key === "Backspace" && !e.currentTarget.value) {
        const next = selectedValues.slice(0, -1);
        setSelectedValues(next);
        onValueChange(next);
      }
    };

    const hasSelection = selectedValues.length > 0;

    return (
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen} modal={modalPopover}>
        {/* Base UI Trigger renders as a <button> — don't nest another <button> inside */}
        <PopoverTrigger
          onClick={() => setIsPopoverOpen((prev) => !prev)}
          className={cn(
            "flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition-all min-h-10 h-auto bg-white [&_svg]:pointer-events-auto cursor-pointer",
            hasSelection
              ? "border-primary text-primary"
              : "border-gray-200 text-gray-500 hover:border-gray-300",
            className
          )}
        >
          {hasSelection ? (
            <div className="flex justify-between items-center w-full gap-2">
              {/* Selected badges */}
              <div className="flex flex-wrap items-center gap-1">
                {selectedValues.slice(0, maxCount).map((value) => {
                  const option = options.find((o) => o.value === value);
                  return (
                    <Badge
                      key={value}
                      variant="secondary"
                      className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary border-0 rounded-full"
                    >
                      {option?.icon && <option.icon className="h-3 w-3 mr-1" />}
                      {option?.label}
                      <XCircle
                        className="ml-1 h-3 w-3 cursor-pointer opacity-60 hover:opacity-100"
                        onClick={(e) => { e.stopPropagation(); toggleOption(value); }}
                      />
                    </Badge>
                  );
                })}
                {selectedValues.length > maxCount && (
                  <Badge
                    variant="secondary"
                    className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary border-0 rounded-full"
                  >
                    +{selectedValues.length - maxCount} more
                    <XCircle
                      className="ml-1 h-3 w-3 cursor-pointer opacity-60 hover:opacity-100"
                      onClick={(e) => { e.stopPropagation(); setSelectedValues(selectedValues.slice(0, maxCount)); onValueChange(selectedValues.slice(0, maxCount)); }}
                    />
                  </Badge>
                )}
              </div>

              {/* Right controls */}
              <div className="flex items-center gap-1 shrink-0">
                <XIcon
                  className="h-4 w-4 cursor-pointer text-gray-400 hover:text-gray-600"
                  onClick={(e) => { e.stopPropagation(); handleClear(); }}
                />
                <Separator orientation="vertical" className="h-4" />
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-sm text-gray-500">{placeholder}</span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          )}
        </PopoverTrigger>

        <PopoverContent
          className="w-[240px] p-0 shadow-lg"
          align="start"
        >
          <Command>
            <CommandInput placeholder={searchPlaceholder} onKeyDown={handleKeyDown} />
            <CommandList>
              <CommandEmpty>{noResultsText}</CommandEmpty>
              <CommandGroup>
                {/* Select All */}
                <CommandItem key="all" onSelect={toggleAll} className="cursor-pointer">
                  <div className={cn(
                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary shrink-0",
                    selectedValues.length === options.length
                      ? "bg-primary text-primary-foreground"
                      : "opacity-40 [&_svg]:invisible"
                  )}>
                    <CheckIcon className="h-3 w-3" />
                  </div>
                  <span className="text-sm font-medium">{selectAllText}</span>
                </CommandItem>

                {/* Options */}
                {options.map((option) => {
                  const isSelected = selectedValues.includes(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      onSelect={() => toggleOption(option.value)}
                      className="cursor-pointer"
                    >
                      <div className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary shrink-0",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-40 [&_svg]:invisible"
                      )}>
                        <CheckIcon className="h-3 w-3" />
                      </div>
                      {option.icon && <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />}
                      <span className="text-sm">{option.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>

              <CommandSeparator />

              {/* Footer actions */}
              <CommandGroup>
                <div className="flex items-center">
                  {selectedValues.length > 0 && (
                    <>
                      <CommandItem
                        onSelect={handleClear}
                        className="flex-1 justify-center cursor-pointer text-sm text-gray-500"
                      >
                        {clearText}
                      </CommandItem>
                      <Separator orientation="vertical" className="h-5" />
                    </>
                  )}
                  <CommandItem
                    onSelect={() => setIsPopoverOpen(false)}
                    className="flex-1 justify-center cursor-pointer text-sm font-medium"
                  >
                    {closeText}
                  </CommandItem>
                </div>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
}
