import { IconType } from "react-icons";
import {
  RiRidingFill,
  RiShoppingBag2Line,
} from "react-icons/ri";
import {
  MdKitesurfing,
  MdOutlineAttractions,
  MdEventAvailable,
  MdFamilyRestroom,
  MdRestaurantMenu,
  MdSpa,
  MdTempleBuddhist,
} from "react-icons/md";
import { BiTrip } from "react-icons/bi";
import { GiTreehouse } from "react-icons/gi";
import { PiChalkboardTeacherDuotone } from "react-icons/pi";
import { HiTicket } from "react-icons/hi2";
import { FaBinoculars } from "react-icons/fa";

export type ActivityCategory = {
  id: string;
  icon: IconType;
  label: { en: string; fr: string; ar: string };
};

export const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  { id: "adventures", icon: RiRidingFill, label: { en: "Adventures", fr: "Aventures", ar: "مغامرات" } },
  { id: "water_sports", icon: MdKitesurfing, label: { en: "Water Sports", fr: "Sports nautiques", ar: "الرياضات المائية" } },
  { id: "trips", icon: BiTrip, label: { en: "Trips", fr: "Excursions", ar: "رحلات" } },
  { id: "tickets", icon: HiTicket, label: { en: "Entry Tickets", fr: "Billets d'entrée", ar: "تذاكر الدخول" } },
  { id: "attractions", icon: MdOutlineAttractions, label: { en: "Attractions", fr: "Attractions", ar: "معالم سياحية" } },
  { id: "culture", icon: MdTempleBuddhist, label: { en: "Cultural", fr: "Culturel", ar: "تجارب ثقافية" } },
  { id: "food_drink", icon: MdRestaurantMenu, label: { en: "Food & Drink", fr: "Gastronomie", ar: "المأكولات" } },
  { id: "nature_wildlife", icon: GiTreehouse, label: { en: "Nature", fr: "Nature", ar: "الطبيعة" } },
  { id: "workshops", icon: PiChalkboardTeacherDuotone, label: { en: "Workshops", fr: "Ateliers", ar: "ورشات" } },
  { id: "sightseeing", icon: FaBinoculars, label: { en: "Sightseeing", fr: "Visites", ar: "جولات" } },
  { id: "wellness", icon: MdSpa, label: { en: "Wellness & Spa", fr: "Bien-être", ar: "الاسترخاء" } },
  { id: "events", icon: MdEventAvailable, label: { en: "Events", fr: "Événements", ar: "فعاليات" } },
  { id: "shopping", icon: RiShoppingBag2Line, label: { en: "Shopping", fr: "Shopping", ar: "التسوق" } },
  { id: "family_friendly", icon: MdFamilyRestroom, label: { en: "Family", fr: "Famille", ar: "عائلي" } },
];

export function getCategoryById(id: string): ActivityCategory | undefined {
  return ACTIVITY_CATEGORIES.find((c) => c.id === id);
}

export function getCategoryLabel(id: string, locale: string): string {
  const cat = getCategoryById(id);
  if (!cat) return id;
  return cat.label[locale as "en" | "fr" | "ar"] ?? cat.label.en;
}
