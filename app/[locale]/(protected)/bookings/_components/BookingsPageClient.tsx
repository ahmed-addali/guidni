"use client";

import { useState } from "react";
import { ActivityBookingCard } from "./ActivityBookingCard";
import { StayBookingCard } from "./StayBookingCard";
import { PassBookingCard } from "./PassBookingCard";
import { RentalBookingCard } from "./RentalBookingCard";
import { TransferBookingCard } from "./TransferBookingCard";
import { FiActivity } from "react-icons/fi";
import { BsHouses } from "react-icons/bs";
import { FaTicket } from "react-icons/fa6";
import { TbCar, TbRoute } from "react-icons/tb";
import { cn } from "@/lib/utils";
import type { BookingStatus } from "@prisma/client";

interface ActivityBooking {
  id: string;
  activityTitle: string;
  coverImageUrl?: string;
  date: Date;
  time: string;
  adults: number;
  children: number;
  totalPrice: number;
  status: BookingStatus;
}

interface StayBooking {
  id: string;
  stayTitle: string;
  location: string;
  coverImageUrl?: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  adults: number;
  children: number;
  totalPrice: number;
  status: BookingStatus;
  bookingRef: string;
}

interface PassBooking {
  bookingRef: string;
  passName: string;
  passKey: string;
  date: Date;
  expiresAt: Date;
  participants: number;
  totalPrice: number;
  status: BookingStatus;
}

interface RentalBooking {
  id: string;
  rentalTitle: string;
  rentalType: string;
  coverImageUrl?: string;
  startDate: Date;
  endDate: Date;
  days: number;
  totalPrice: number;
  status: BookingStatus;
  bookingRef: string;
}

interface TransferBooking {
  id:             string;
  transferTitle:  string;
  transferType:   string;
  coverImageUrl?: string;
  date:           Date;
  time:           string;
  pickupLocation: string;
  passengers:     number;
  totalPrice:     number;
  status:         BookingStatus;
  bookingRef:     string;
}

interface Labels {
  activities: string;
  stays: string;
  passes: string;
  rentals: string;
  transfers: string;
  noActivities: string;
  noStays: string;
  noPasses: string;
  noRentals: string;
  noTransfers: string;
  viewDetails: string;
  bookingRef: string;
  adults: string;
  children: string;
  nights: string;
  days: string;
  passengers: string;
  browseActivities: string;
  browseStays: string;
  browsePasses: string;
  browseRentals: string;
  browseTransfers: string;
  participants: string;
  validUntil: string;
}

interface Props {
  activityBookings:  ActivityBooking[];
  stayBookings:      StayBooking[];
  passBookings:      PassBooking[];
  rentalBookings:    RentalBooking[];
  transferBookings:  TransferBooking[];
  locale: string;
  labels: Labels;
}

type Tab = "activities" | "stays" | "passes" | "rentals" | "transfers";

const TABS: { id: Tab; icon: React.ReactNode; labelKey: keyof Labels; countKey: "activities" | "stays" | "passes" | "rentals" | "transfers" }[] = [
  { id: "activities", icon: <FiActivity className="h-4 w-4" />, labelKey: "activities", countKey: "activities" },
  { id: "stays",      icon: <BsHouses className="h-4 w-4" />,   labelKey: "stays",      countKey: "stays" },
  { id: "passes",     icon: <FaTicket className="h-4 w-4" />,   labelKey: "passes",     countKey: "passes" },
  { id: "rentals",    icon: <TbCar className="h-4 w-4" />,      labelKey: "rentals",    countKey: "rentals" },
  { id: "transfers",  icon: <TbRoute className="h-4 w-4" />,    labelKey: "transfers",  countKey: "transfers" },
];

export function BookingsPageClient({
  activityBookings,
  stayBookings,
  passBookings,
  rentalBookings,
  transferBookings,
  locale,
  labels,
}: Props) {
  const [tab, setTab] = useState<Tab>("activities");

  const counts = {
    activities: activityBookings.length,
    stays: stayBookings.length,
    passes: passBookings.length,
    rentals: rentalBookings.length,
    transfers: transferBookings.length,
  };

  const cardLabels = {
    adults: labels.adults,
    children: labels.children,
    nights: labels.nights,
    viewDetails: labels.viewDetails,
    bookingRef: labels.bookingRef,
  };

  const rentalCardLabels = {
    days: labels.days,
    viewDetails: labels.viewDetails,
    bookingRef: labels.bookingRef,
  };

  const transferCardLabels = {
    passengers: labels.passengers,
    bookingRef: labels.bookingRef,
  };

  const passCardLabels = {
    participants: labels.participants,
    validUntil: labels.validUntil,
    viewDetails: labels.viewDetails,
  };

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(({ id, icon, labelKey, countKey }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
              tab === id
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {icon}
            {labels[labelKey] as string}
            <span className="ml-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
              {counts[countKey]}
            </span>
          </button>
        ))}
      </div>

      {/* Activities tab */}
      {tab === "activities" && (
        <div className="space-y-3">
          {activityBookings.length === 0 ? (
            <EmptyState message={labels.noActivities} href={`/${locale}/activities`} cta={labels.browseActivities} />
          ) : (
            activityBookings.map((b) => (
              <ActivityBookingCard key={b.id} {...b} locale={locale} labels={cardLabels} />
            ))
          )}
        </div>
      )}

      {/* Stays tab */}
      {tab === "stays" && (
        <div className="space-y-3">
          {stayBookings.length === 0 ? (
            <EmptyState message={labels.noStays} href={`/${locale}/stays`} cta={labels.browseStays} />
          ) : (
            stayBookings.map((b) => (
              <StayBookingCard key={b.id} {...b} locale={locale} labels={cardLabels} />
            ))
          )}
        </div>
      )}

      {/* Passes tab */}
      {tab === "passes" && (
        <div className="space-y-3">
          {passBookings.length === 0 ? (
            <EmptyState message={labels.noPasses} href={`/${locale}/passes`} cta={labels.browsePasses} />
          ) : (
            passBookings.map((b) => (
              <PassBookingCard key={b.bookingRef} {...b} locale={locale} labels={passCardLabels} />
            ))
          )}
        </div>
      )}

      {/* Rentals tab */}
      {tab === "rentals" && (
        <div className="space-y-3">
          {rentalBookings.length === 0 ? (
            <EmptyState message={labels.noRentals} href={`/${locale}/transport`} cta={labels.browseRentals} />
          ) : (
            rentalBookings.map((b) => (
              <RentalBookingCard key={b.id} {...b} labels={rentalCardLabels} />
            ))
          )}
        </div>
      )}

      {/* Transfers tab */}
      {tab === "transfers" && (
        <div className="space-y-3">
          {transferBookings.length === 0 ? (
            <EmptyState message={labels.noTransfers} href={`/${locale}/transport?service=transfers`} cta={labels.browseTransfers} />
          ) : (
            transferBookings.map((b) => (
              <TransferBookingCard key={b.id} {...b} labels={transferCardLabels} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({ message, href, cta }: { message: string; href: string; cta: string }) {
  return (
    <div className="text-center py-16 space-y-4">
      <p className="text-gray-500">{message}</p>
      <a
        href={href}
        className="inline-block bg-primary text-white text-sm px-5 py-2 rounded-md hover:bg-primary/90 transition-colors"
      >
        {cta}
      </a>
    </div>
  );
}
