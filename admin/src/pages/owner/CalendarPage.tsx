import { useState, useMemo } from "react";
import { useParams } from "react-router";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { DEFAULT_PAGE_LIMIT } from "@/constants/pagination";
import { AxiosError } from "axios";

import {
  useOwnerAvailability,
  useBlockDates,
  useUnblockDates,
} from "@/services/api/useVenues";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { BlockedDate } from "@/types/models";

// Extracted Components
import { BlockedDatesTable } from "@/components/calendar/BlockedDatesTable";
import { toLocalDateStr } from "@/utils/dateUtils";

export default function CalendarPage() {
  const { venueId } = useParams<{ venueId: string }>();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);

  const { data, isLoading } = useOwnerAvailability(venueId!);
  const blockMutation = useBlockDates();
  const unblockMutation = useUnblockDates();
  const { success, error } = useToast();

  const bookedSet = useMemo(() => new Set(data?.bookedDates ?? []), [data]);
  const blockedSet = useMemo(() => new Set(data?.blockedDates ?? []), [data]);
  const workingDaysSet = useMemo(
    () => new Set(data?.workingDays ?? []),
    [data],
  );

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const sixMonthsFromNow = useMemo(() => {
    const d = new Date(today);
    d.setMonth(d.getMonth() + 6);
    return d;
  }, [today]);

  const isBooked = (date: Date) => bookedSet.has(toLocalDateStr(date));
  const isBlocked = (date: Date) => blockedSet.has(toLocalDateStr(date));
  const isPast = (date: Date) => date < today;
  const isTooFar = (date: Date) => date > sixMonthsFromNow;
  const isNonWorkingDay = (date: Date) => {
    if (workingDaysSet.size === 0) return false;
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    return !workingDaysSet.has(dayName);
  };
  const isDisabledDay = (date: Date) =>
    isPast(date) || isTooFar(date) || isBooked(date) || isNonWorkingDay(date);

  const [tablePage, setTablePage] = useState(1);

  const blockedDatesArray = useMemo(() => {
    if (!data?.blockedDates) return [];
    return data.blockedDates
      .map((dateStr) => {
        const d = new Date(`${dateStr}T00:00:00Z`);
        const localD = new Date(
          d.getUTCFullYear(),
          d.getUTCMonth(),
          d.getUTCDate(),
        );
        return {
          date: dateStr,
          dateObj: localD,
          isPast: localD < today,
          venueId: venueId ?? "",
        };
      })
      .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
  }, [data, today, venueId]);

  const paginatedData = useMemo(() => {
    const limit = DEFAULT_PAGE_LIMIT;
    return blockedDatesArray.slice((tablePage - 1) * limit, tablePage * limit);
  }, [blockedDatesArray, tablePage]);

  const totalPages = Math.ceil(blockedDatesArray.length / 10);

  const handleDayClick = (date: Date) => {
    if (isDisabledDay(date)) return;

    setSelectedDate(date);
    setConflictMessage(null);
    setConfirmOpen(true);
  };

  const handleConfirmAction = () => {
    if (!selectedDate) return;
    const dateStr = toLocalDateStr(selectedDate);
    const currentlyBlocked = isBlocked(selectedDate);

    if (currentlyBlocked) {
      unblockMutation.mutate(
        { venueId: venueId!, dates: [dateStr] },
        {
          onSuccess: () => {
            success(`Unblocked ${dateStr}`);
            setConfirmOpen(false);
            setSelectedDate(null);
          },
          onError: (e: unknown) => {
            const err = e as AxiosError<{ message: string }>;
            error(err.response?.data?.message ?? "Failed to unblock date");
          },
        },
      );
    } else {
      blockMutation.mutate(
        { venueId: venueId!, dates: [dateStr] },
        {
          onSuccess: () => {
            success(`Blocked ${dateStr}`);
            setConfirmOpen(false);
            setSelectedDate(null);
          },
          onError: (e: unknown) => {
            const err = e as AxiosError<{ message: string }>;
            if (err.response?.status === 409) {
              setConflictMessage(
                err.response.data.message ||
                  "This date cannot be blocked because there are existing bookings.",
              );
            } else {
              error(err.response?.data?.message ?? "Failed to block date");
              setConfirmOpen(false);
            }
          },
        },
      );
    }
  };

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Calendar & Availability
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Manage your venue's schedule, view bookings, and block off unavailable
          dates.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 bg-[var(--bg-primary)] p-6 rounded-xl border border-[var(--bg-grey)] shadow-sm flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-6 pb-4 border-b border-[var(--bg-grey)]">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-[var(--text-primary)]">
              <CalendarDays className="h-5 w-5 text-primary" />
              Select Dates
            </h2>
            <div className="flex gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span>Booked</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Blocked</span>
              </div>
            </div>
          </div>

          <DayPicker
            mode="single"
            selected={selectedDate || undefined}
            onDayClick={handleDayClick}
            disabled={isDisabledDay}
            modifiers={{
              booked: (d) => isBooked(d),
              blocked: (d) => isBlocked(d),
            }}
            modifiersStyles={{
              booked: {
                backgroundColor: "#10b981",
                color: "white",
                fontWeight: "bold",
              },
              blocked: {
                backgroundColor: "#ef4444",
                color: "white",
                fontWeight: "bold",
                textDecoration: "line-through",
              },
            }}
            className="border-none p-0"
            classNames={{
              day: "h-12 w-12 text-sm font-medium hover:bg-[var(--bg-grey)] hover:text-[var(--text-primary)] rounded-lg transition-colors focus:bg-primary focus:text-primary-foreground focus:outline-none aria-selected:bg-primary aria-selected:text-primary-foreground",
            }}
          />
        </div>

        <div className="lg:col-span-7 bg-[var(--bg-primary)] rounded-xl border border-[var(--bg-grey)] shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
          <div className="p-6 border-b border-[var(--bg-grey)] bg-muted/20">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Blocked Dates Management
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Review and unblock previously restricted dates.
            </p>
          </div>

          <BlockedDatesTable
            tablePage={tablePage}
            setTablePage={setTablePage}
            paginatedData={paginatedData as BlockedDate[]}
            totalPages={totalPages}
            isLoading={isLoading}
            unblockMutation={unblockMutation}
          />
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && isBlocked(selectedDate)
                ? "Unblock Date"
                : "Block Date"}
            </DialogTitle>
            <DialogDescription>
              {selectedDate && isBlocked(selectedDate)
                ? `Are you sure you want to unblock ${selectedDate.toLocaleDateString()}? This will allow customers to book this date.`
                : `Are you sure you want to block ${selectedDate?.toLocaleDateString()}? Customers will not be able to book this date.`}
            </DialogDescription>
          </DialogHeader>

          {conflictMessage && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm mb-4 border border-red-100">
              {conflictMessage}
            </div>
          )}

          <DialogFooter className="mt-6 gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmOpen(false);
                setConflictMessage(null);
              }}
              disabled={blockMutation.isPending || unblockMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant={
                selectedDate && isBlocked(selectedDate)
                  ? "default"
                  : "destructive"
              }
              onClick={handleConfirmAction}
              disabled={blockMutation.isPending || unblockMutation.isPending}
            >
              {blockMutation.isPending || unblockMutation.isPending
                ? "Processing..."
                : "Confirm Action"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
