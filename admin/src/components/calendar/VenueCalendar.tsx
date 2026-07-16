import React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

export function VenueCalendar({
  isLoading,
  handleDayClick,
  isDisabledDay,
  isBooked,
  isBlocked,
  isPast,
  isTooFar,
  isNonWorkingDay,
}: {
  isLoading: boolean;
  handleDayClick: (date: Date) => void;
  isDisabledDay: (date: Date) => boolean;
  isBooked: (date: Date) => boolean;
  isBlocked: (date: Date) => boolean;
  isPast: (date: Date) => boolean;
  isTooFar: (date: Date) => boolean;
  isNonWorkingDay: (date: Date) => boolean;
}) {
  return (
    <>
      <div className="rounded-md border p-6 overflow-x-auto">
        {isLoading ? (
          <div className="h-80 animate-pulse rounded-xl bg-zinc-100" />
        ) : (
          <div className="flex justify-center">
            <DayPicker
              mode="single"
              showOutsideDays={false}
              onDayClick={handleDayClick}
              disabled={isDisabledDay}
              modifiers={{
                booked: (date) => isBooked(date),
                blocked: (date) => isBlocked(date),
                unavailable: (date) =>
                  isPast(date) || isTooFar(date) || isNonWorkingDay(date),
              }}
              modifiersClassNames={{
                booked: "rdp-day--booked",
                blocked: "rdp-day--blocked",
                unavailable: "rdp-day--unavailable",
              }}
              styles={{
                root: {
                  "--rdp-accent-color": "#18181b",
                } as React.CSSProperties,
              }}
            />
          </div>
        )}
      </div>
      <style>{`
        .rdp-day--booked {
          background-color: #dbeafe !important;
          color: #1d4ed8 !important;
          cursor: not-allowed !important;
        }
        .rdp-day--booked:hover {
          background-color: #bfdbfe !important;
        }
        .rdp-day--blocked {
          background-color: #fee2e2 !important;
          color: #dc2626 !important;
          cursor: default !important;
        }
        .rdp-day--blocked:hover {
          background-color: #fecaca !important;
        }
        .rdp-day--unavailable {
          background-color: #e4e4e7 !important;
          color: #a1a1aa !important;
          opacity: 0.5;
          cursor: not-allowed !important;
        }
      `}</style>
    </>
  );
}
