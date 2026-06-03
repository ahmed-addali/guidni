import { FiWifi, FiShield, FiStar } from "react-icons/fi";
import {
  MdOutlinePool,
  MdOutlineLocalParking,
  MdOutlineKitchen,
  MdOutlineAcUnit,
  MdOutlinePets,
  MdOutlineBalcony,
  MdOutlineHeatPump,
  MdOutlineYard,
  MdOutlineSmokeFree,
  MdOutlineWheelchairPickup,
  MdOutlineElevator,
} from "react-icons/md";
import type { ComponentType } from "react";

export const PROPERTY_TYPES = [
  "Apartment", "Villa", "House", "Riad", "Bungalow", "Hotel Room", "Other",
] as const;

export const SPACE_CATEGORIES = [
  "Entire place", "Private room", "Shared room",
] as const;

export const AMENITY_KEYS = [
  "hasWifi",
  "hasPool",
  "hasParking",
  "hasKitchen",
  "hasAirConditioning",
  "isPetFriendly",
  "hasHeating",
  "hasGarden",
  "hasBalcony",
  "hasSecurity",
  "hasConcierge",
  "isSmokeFree",
  "wheelchairAccessible",
  "elevatorAvailable",
] as const;

export type AmenityKey = typeof AMENITY_KEYS[number];

export const AMENITY_ICONS: Record<AmenityKey, ComponentType<{ className?: string }>> = {
  hasWifi:              FiWifi,
  hasPool:              MdOutlinePool,
  hasParking:           MdOutlineLocalParking,
  hasKitchen:           MdOutlineKitchen,
  hasAirConditioning:   MdOutlineAcUnit,
  isPetFriendly:        MdOutlinePets,
  hasHeating:           MdOutlineHeatPump,
  hasGarden:            MdOutlineYard,
  hasBalcony:           MdOutlineBalcony,
  hasSecurity:          FiShield,
  hasConcierge:         FiStar,
  isSmokeFree:          MdOutlineSmokeFree,
  wheelchairAccessible: MdOutlineWheelchairPickup,
  elevatorAvailable:    MdOutlineElevator,
};
