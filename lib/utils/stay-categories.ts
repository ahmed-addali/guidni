import type { IconType } from "react-icons";
import { FaHotel, FaUmbrellaBeach } from "react-icons/fa";
import { MdApartment, MdVilla, MdHouseboat, MdCabin, MdEco, MdOutlineDiamond } from "react-icons/md";
import { FaHouseUser } from "react-icons/fa";
import { GiBarn } from "react-icons/gi";
import { IoBedOutline } from "react-icons/io5";
import { TbBuildingCottage } from "react-icons/tb";
import { HiViewGrid } from "react-icons/hi";

export type StayCategoryId =
  | "hotels"
  | "apartments"
  | "villas"
  | "guest_houses"
  | "beach_resorts"
  | "vacation_rentals"
  | "bnb"
  | "luxury"
  | "eco"
  | "cabins"
  | "cottages"
  | "houseboats";

export type StayCategory = {
  id: StayCategoryId;
  icon: IconType;
  label: { en: string; fr: string; ar: string };
};

export const STAY_CATEGORIES: StayCategory[] = [
  {
    id: "hotels",
    icon: FaHotel,
    label: { en: "Hotels", fr: "Hôtels", ar: "فنادق" },
  },
  {
    id: "apartments",
    icon: MdApartment,
    label: { en: "Apartments", fr: "Appartements", ar: "شقق" },
  },
  {
    id: "villas",
    icon: MdVilla,
    label: { en: "Villas", fr: "Villas", ar: "فلل" },
  },
  {
    id: "guest_houses",
    icon: FaHouseUser,
    label: { en: "Guest Houses", fr: "Maisons d'hôtes", ar: "بيوت ضيافة" },
  },
  {
    id: "beach_resorts",
    icon: FaUmbrellaBeach,
    label: { en: "Beach Resorts", fr: "Stations balnéaires", ar: "منتجعات شاطئية" },
  },
  {
    id: "vacation_rentals",
    icon: IoBedOutline,
    label: { en: "Vacation Rentals", fr: "Locations vacances", ar: "إيجارات عطلات" },
  },
  {
    id: "bnb",
    icon: GiBarn,
    label: { en: "Bed & Breakfast", fr: "Chambres d'hôtes", ar: "سرير وفطور" },
  },
  {
    id: "luxury",
    icon: MdOutlineDiamond,
    label: { en: "Luxury", fr: "Luxe", ar: "فاخرة" },
  },
  {
    id: "eco",
    icon: MdEco,
    label: { en: "Eco Stays", fr: "Éco-séjours", ar: "إقامات بيئية" },
  },
  {
    id: "cabins",
    icon: MdCabin,
    label: { en: "Cabins", fr: "Cabanes", ar: "كابينات" },
  },
  {
    id: "cottages",
    icon: TbBuildingCottage,
    label: { en: "Cottages", fr: "Chalets", ar: "منازل ريفية" },
  },
  {
    id: "houseboats",
    icon: MdHouseboat,
    label: { en: "Houseboats", fr: "Péniches", ar: "بيوت عائمة" },
  },
];

export const ALL_STAYS_ICON = HiViewGrid;

export function getCategoryById(id: string): StayCategory | undefined {
  return STAY_CATEGORIES.find((c) => c.id === id);
}

export function getCategoryLabel(
  id: string,
  locale: "en" | "fr" | "ar"
): string {
  return getCategoryById(id)?.label[locale] ?? id;
}
