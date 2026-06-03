"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FaPrayingHands } from "react-icons/fa";
import { LuHeartHandshake } from "react-icons/lu";
import { MdCelebration } from "react-icons/md";
import { FiInfo } from "react-icons/fi";

type CultureGroup = {
  title: string;
  points: string[];
};

const SECTION_ICONS = [
  <FaPrayingHands key="0" className="h-4 w-4 text-green-600" />,
  <LuHeartHandshake key="1" className="h-4 w-4 text-amber-500" />,
  <MdCelebration key="2" className="h-4 w-4 text-blue-600" />,
  <FiInfo key="3" className="h-4 w-4 text-purple-500" />,
];

export function CultureAccordion({ groups }: { groups: CultureGroup[] }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6">
      <Accordion className="w-full">
        {groups.map((group, i) => (
          <AccordionItem key={group.title} value={group.title}>
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-gray-50">
                  {SECTION_ICONS[i] ?? (
                    <FiInfo className="h-4 w-4 text-gray-500" />
                  )}
                </div>
                <span className="font-semibold text-gray-800 text-sm">
                  {group.title}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4 px-1">
              <ul className="space-y-2">
                {group.points.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-3 text-sm text-gray-600"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" />
                    {point}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
