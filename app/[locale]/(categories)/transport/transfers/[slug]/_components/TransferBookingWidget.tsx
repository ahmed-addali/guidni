"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { FiCheck, FiMinus, FiPlus, FiArrowRight, FiCalendar, FiAlertTriangle } from "react-icons/fi";
import { format } from "date-fns";
import { DatePickerInput } from "@/components/shared/DatePickerInput";
import { TimePickerInput } from "@/components/shared/TimePickerInput";
import { createTransferReservation } from "@/lib/actions/transfer-reservations";

type TransferType = "AIRPORT_TRANSFER" | "TAXI" | "CHAUFFEUR" | "SHUTTLE";

interface BookedSlot {
  date:           string; // "yyyy-MM-dd"
  time:           string; // "HH:MM"
  hoursRequested: number;
}

interface Props {
  transferId:        string;
  type:              TransferType;
  pricePerTrip?:     number | null;
  pricePerHour?:     number | null;
  pricePerPerson?:   number | null;
  capacity:          number;
  locale:            string;
  unavailableDates?: string[];
  /** For CHAUFFEUR: active bookings with their time ranges for overlap detection */
  bookedSlots?:      BookedSlot[];
  labels: {
    perTrip:             string;
    perHour:             string;
    perPerson:           string;
    date:                string;
    time:                string;
    pickup:              string;
    pickupPlaceholder:   string;
    dropoff:             string;
    dropoffOptional:     string;
    dropoffPlaceholder:  string;
    flightNumber:        string;
    flightPlaceholder:   string;
    hours:               string;
    passengers:          string;
    contactName:         string;
    namePlaceholder:     string;
    contactPhone:        string;
    phonePlaceholder:    string;
    notes:               string;
    notesPlaceholder:    string;
    total:               string;
    book:                string;
    booking:             string;
    noCharge:            string;
    doneTitle:           string;
    doneMessage:         string;
    errDateTime:         string;
    errPickup:           string;
    errName:             string;
    errMinHour:          string;
    errTimeConflict:     string;
    viewBooking:         string;
    bookAgain:           string;
  };
}

function toMins(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m ?? 0);
}

function calcTotal(
  type: TransferType,
  passengers: number,
  hoursRequested: number,
  pricePerTrip?: number | null,
  pricePerHour?: number | null,
  pricePerPerson?: number | null
): number {
  switch (type) {
    case "CHAUFFEUR":
      return (pricePerHour ?? 0) * hoursRequested;
    case "SHUTTLE":
      return pricePerPerson
        ? pricePerPerson * passengers
        : (pricePerTrip ?? 0);
    default:
      return pricePerTrip ?? 0;
  }
}

export function TransferBookingWidget({
  transferId, type, pricePerTrip, pricePerHour, pricePerPerson, capacity, labels,
  unavailableDates = [], bookedSlots = [],
}: Props) {
  const params = useParams();
  const locale = params.locale as string;

  const [date,           setDate]           = useState<Date | undefined>();
  const [time,           setTime]           = useState("");
  const [pickup,         setPickup]         = useState("");
  const [dropoff,        setDropoff]        = useState("");
  const [passengers,     setPassengers]     = useState(1);
  const [hoursRequested, setHoursRequested] = useState(1);
  const [flightNumber,   setFlightNumber]   = useState("");
  const [contactName,    setContactName]    = useState("");
  const [contactPhone,   setContactPhone]   = useState("");
  const [notes,          setNotes]          = useState("");
  const [done,           setDone]           = useState(false);
  const [pending,        start]             = useTransition();

  const total = calcTotal(type, passengers, hoursRequested, pricePerTrip, pricePerHour, pricePerPerson);

  // Pre-compute which time slots are unavailable for the time picker (CHAUFFEUR only)
  const unavailableTimes = useMemo((): string[] => {
    if (type !== "CHAUFFEUR" || !date || bookedSlots.length === 0) return [];
    const dateStr   = format(date, "yyyy-MM-dd");
    const slotsForDay = bookedSlots.filter((s) => s.date === dateStr);
    if (!slotsForDay.length) return [];

    const result: string[] = [];
    const MINS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    for (let h = 0; h < 24; h++) {
      for (const m of MINS) {
        const startMins = h * 60 + m;
        const endMins   = startMins + hoursRequested * 60;
        const conflicts = slotsForDay.some((slot) => {
          const slotStart = toMins(slot.time);
          const slotEnd   = slotStart + slot.hoursRequested * 60;
          return startMins < slotEnd && slotStart < endMins;
        });
        if (conflicts) {
          result.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
        }
      }
    }
    return result;
  }, [type, date, hoursRequested, bookedSlots]);

  // Conflict check against the currently selected time
  const hasTimeConflict = useMemo(() => {
    if (!time || unavailableTimes.length === 0) return false;
    return unavailableTimes.includes(time);
  }, [time, unavailableTimes]);

  function handleBook() {
    if (!date || !time)        return toast.error(labels.errDateTime);
    if (!pickup)               return toast.error(labels.errPickup);
    if (!contactName.trim())   return toast.error(labels.errName);
    if (type === "CHAUFFEUR" && hoursRequested < 1) return toast.error(labels.errMinHour);
    if (hasTimeConflict)       return toast.error(labels.errTimeConflict);

    start(async () => {
      const res = await createTransferReservation({
        transferId,
        date,
        time,
        pickupLocation:  pickup,
        dropoffLocation: dropoff || undefined,
        passengers,
        hoursRequested:  type === "CHAUFFEUR" ? hoursRequested : undefined,
        flightNumber:    type === "AIRPORT_TRANSFER" ? (flightNumber || undefined) : undefined,
        contactName,
        contactPhone:    contactPhone || undefined,
        notes:           notes || undefined,
      });
      if (res.success) setDone(true);
      else toast.error(res.error);
    });
  }

  if (done) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center space-y-4">
        <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <FiCheck className="h-6 w-6 text-green-600" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-gray-900">{labels.doneTitle}</p>
          <p className="text-sm text-gray-500">{labels.doneMessage}</p>
        </div>
        <div className="flex flex-col gap-2 pt-1">
          <Link
            href={`/${locale}/bookings?tab=transfers`}
            className="flex items-center justify-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
          >
            <FiArrowRight className="h-4 w-4" />
            {labels.viewBooking}
          </Link>
          <button
            type="button"
            onClick={() => {
              setDone(false);
              setDate(undefined); setTime(""); setPickup(""); setDropoff("");
              setFlightNumber(""); setContactName(""); setContactPhone(""); setNotes("");
              setPassengers(1); setHoursRequested(1);
            }}
            className="flex items-center justify-center gap-2 text-sm font-medium text-gray-600 border border-gray-200 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <FiCalendar className="h-4 w-4" />
            {labels.bookAgain}
          </button>
        </div>
      </div>
    );
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";
  const labelCls = "text-sm font-medium text-gray-700";

  return (
    <div id="booking-widget" className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
      {/* Price display */}
      <div className="flex items-baseline gap-1">
        {type === "CHAUFFEUR" && pricePerHour && (
          <><span className="text-2xl font-bold text-gray-900">{pricePerHour} TND</span><span className="text-sm text-gray-400">{labels.perHour}</span></>
        )}
        {type === "SHUTTLE" && pricePerPerson ? (
          <><span className="text-2xl font-bold text-gray-900">{pricePerPerson} TND</span><span className="text-sm text-gray-400">{labels.perPerson}</span></>
        ) : type !== "CHAUFFEUR" && pricePerTrip ? (
          <><span className="text-2xl font-bold text-gray-900">{pricePerTrip} TND</span><span className="text-sm text-gray-400">{labels.perTrip}</span></>
        ) : null}
      </div>

      <div className="space-y-3">
        {/* Date */}
        <div className="space-y-1.5">
          <label className={labelCls}>{labels.date}</label>
          <div className={`${inputCls} flex items-center`}>
            <DatePickerInput
              selected={date}
              onDateChange={setDate}
              minDate={new Date()}
              placeholder={labels.date}
              disabledDates={unavailableDates}
            />
          </div>
        </div>

        {/* Time */}
        <div className="space-y-1.5">
          <label className={labelCls}>{labels.time}</label>
          <div className={`${inputCls} flex items-center`}>
            <TimePickerInput
              value={time}
              onChange={setTime}
              placeholder={labels.time}
              unavailableTimes={unavailableTimes}
            />
          </div>
        </div>

        {/* Pickup */}
        <div className="space-y-1.5">
          <label className={labelCls}>{labels.pickup}</label>
          <input type="text" value={pickup} onChange={(e) => setPickup(e.target.value)}
            placeholder={labels.pickupPlaceholder} className={inputCls} />
        </div>

        {/* Dropoff */}
        <div className="space-y-1.5">
          <label className={labelCls}>
            {type === "CHAUFFEUR" ? labels.dropoffOptional : labels.dropoff}
          </label>
          <input type="text" value={dropoff} onChange={(e) => setDropoff(e.target.value)}
            placeholder={labels.dropoffPlaceholder} className={inputCls} />
        </div>

        {/* Flight number — AIRPORT_TRANSFER only */}
        {type === "AIRPORT_TRANSFER" && (
          <div className="space-y-1.5">
            <label className={labelCls}>{labels.flightNumber}</label>
            <input type="text" value={flightNumber} onChange={(e) => setFlightNumber(e.target.value)}
              placeholder={labels.flightPlaceholder} className={inputCls} />
          </div>
        )}

        {/* Hours — CHAUFFEUR only */}
        {type === "CHAUFFEUR" && (
          <div className="space-y-1.5">
            <label className={labelCls}>{labels.hours}</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setHoursRequested((h) => Math.max(1, h - 1))}
                className="h-9 w-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <FiMinus className="h-3.5 w-3.5" />
              </button>
              <span className="w-8 text-center font-semibold text-gray-900">{hoursRequested}</span>
              <button
                type="button"
                onClick={() => setHoursRequested((h) => Math.min(24, h + 1))}
                className="h-9 w-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <FiPlus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Passengers */}
        <div className="space-y-1.5">
          <label className={labelCls}>{labels.passengers}</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPassengers((p) => Math.max(1, p - 1))}
              className="h-9 w-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <FiMinus className="h-3.5 w-3.5" />
            </button>
            <span className="w-8 text-center font-semibold text-gray-900">{passengers}</span>
            <button
              type="button"
              onClick={() => setPassengers((p) => Math.min(capacity, p + 1))}
              className="h-9 w-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <FiPlus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Contact name */}
        <div className="space-y-1.5">
          <label className={labelCls}>{labels.contactName}</label>
          <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)}
            placeholder={labels.namePlaceholder} className={inputCls} />
        </div>

        {/* Contact phone */}
        <div className="space-y-1.5">
          <label className={labelCls}>{labels.contactPhone}</label>
          <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
            placeholder={labels.phonePlaceholder} className={inputCls} />
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className={labelCls}>{labels.notes}</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            placeholder={labels.notesPlaceholder}
            className={`${inputCls} resize-none`} />
        </div>
      </div>

      {/* Time conflict warning (CHAUFFEUR only) */}
      {hasTimeConflict && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <FiAlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{labels.errTimeConflict}</p>
        </div>
      )}

      {/* Price summary */}
      {total > 0 && !hasTimeConflict && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 space-y-1.5 text-sm">
          {type === "CHAUFFEUR" && (
            <div className="flex justify-between text-gray-600">
              <span>{pricePerHour} TND × {hoursRequested} {labels.hours.toLowerCase()}</span>
              <span>{total} TND</span>
            </div>
          )}
          {type === "SHUTTLE" && pricePerPerson && (
            <div className="flex justify-between text-gray-600">
              <span>{pricePerPerson} TND × {passengers} {labels.passengers.toLowerCase()}</span>
              <span>{total} TND</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-200">
            <span>{labels.total}</span>
            <span>{total} TND</span>
          </div>
        </div>
      )}

      <button
        onClick={handleBook}
        disabled={pending || !date || !time || !pickup || !contactName.trim() || hasTimeConflict}
        className="w-full bg-primary text-white rounded-xl py-3 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {pending ? labels.booking : labels.book}
      </button>

      <p className="text-xs text-center text-gray-400">{labels.noCharge}</p>
    </div>
  );
}
