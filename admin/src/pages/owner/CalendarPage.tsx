import { useState, useMemo } from "react";
import { useParams } from "react-router";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { CalendarDays, Lock, Unlock } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { AxiosError } from "axios";

import { useOwnerAvailability, useBlockDates, useUnblockDates } from "../../services/api/useVenues";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { DataTable } from "../../components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";

import "react-day-picker/dist/style.css";

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function CalendarPage() {
  const { venueId } = useParams<{ venueId: string }>();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);

  const { data, isLoading } = useOwnerAvailability(venueId!); // Note: the hook returns { venueId, date, slots } in standard. Wait, the old API query expected { bookedDates, blockedDates, workingDays }. Let me fix it here.
  const blockMutation = useBlockDates();
  const unblockMutation = useUnblockDates();
  const { success, error } = useToast();

  // Derived sets
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
        };
      })
      .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
  }, [data, today]);

  const paginatedData = useMemo(() => {
    const limit = 10;
    return blockedDatesArray.slice((tablePage - 1) * limit, tablePage * limit);
  }, [blockedDatesArray, tablePage]);

  const totalPages = Math.ceil(blockedDatesArray.length / 10);

  const columns: ColumnDef<(typeof blockedDatesArray)[0]>[] = [
    {
      accessorKey: "dateObj",
      header: "Date",
      cell: ({ row }) =>
        row.original.dateObj.toLocaleDateString("en-IN", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    },
    {
      accessorKey: "isPast",
      header: "Status",
      cell: ({ row }) =>
        row.original.isPast ? (
          <Badge variant="secondary">Past</Badge>
        ) : (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-none">
            Upcoming
          </Badge>
        ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          disabled={row.original.isPast || unblockMutation.isPending}
          onClick={() => unblockMutation.mutate({ dates: [row.original.date] })}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Unlock className="h-4 w-4 mr-2" />
          Unblock
        </Button>
      ),
    },
  ];

  // Day click handler
  const handleDayClick = (date: Date) => {
    if (isDisabledDay(date)) return;

    setSelectedDate(date);
    setConflictMessage(null);
    setConfirmOpen(true);
  };

  const handleConfirmAction = () => {
    if (!selectedDate) return;
    const dateStr = toLocalDateStr(selectedDate);
    if (selectedDate && isBlocked(selectedDate)) {
      unblockMutation.mutate({ venueId: venueId!, dates: [dateStr] }, {
        onSuccess: () => {
          success("Date unblocked successfully");
          setConfirmOpen(false);
          setSelectedDate(null);
          setConflictMessage(null);
        },
        onError: () => {
          setConfirmOpen(false);
          error("Failed to unblock date. Please try again.");
        }
      });
    } else {
      blockMutation.mutate({ venueId: venueId!, dates: [dateStr] }, {
        onSuccess: () => {
          success("Date blocked successfully");
          setConfirmOpen(false);
          setSelectedDate(null);
          setConflictMessage(null);
        },
        onError: (err) => {
          setConfirmOpen(false);
          if (err instanceof AxiosError && err.response?.status === 409) {
            const msg =
              (err.response.data as { message?: string })?.message ??
              "This date was just booked by a customer and cannot be blocked.";
            setConflictMessage(msg);
            error(msg);
          } else {
            error("Failed to block date. Please try again.");
          }
        }
      });
    }
  };

  const isCurrentlyBlocked = selectedDate ? isBlocked(selectedDate) : false;

  return (
    <div className="space-y-6 p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground mt-1">
            Manage availability — block dates to prevent new bookings.
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900">
          <CalendarDays className="h-5 w-5 text-white" />
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        {[
          { color: "bg-zinc-200", label: "Past / Unavailable" },
          {
            color: "bg-blue-100 border border-blue-300",
            label: "Booked by customer",
          },
          {
            color: "bg-red-100 border border-red-300",
            label: "Blocked by you",
          },
          { color: "bg-white border border-zinc-300", label: "Available" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`h-4 w-4 rounded ${color}`} />
            <span className="text-zinc-600">{label}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
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

      {/* Custom day styles injected via <style> */}
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

      {/* Blocked Dates Data Table */}
      <div className="mt-8">
        <h2 className="text-xl font-bold tracking-tight mb-4">
          Blocked Dates List
        </h2>
        <DataTable
          columns={columns}
          data={paginatedData}
          page={tablePage}
          totalPages={totalPages}
          onPageChange={setTablePage}
          isLoading={isLoading}
          emptyMessage="No dates have been blocked yet."
        />
      </div>

      {/* Conflict error banner */}
      {conflictMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <strong>Conflict:</strong> {conflictMessage}
        </div>
      )}

      {/* Block/Unblock Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onOpenChange={(o) => {
          setConfirmOpen(o);
          if (!o) setSelectedDate(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-zinc-600" />
              {isCurrentlyBlocked ? "Unblock Date" : "Block Date"}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to{" "}
              {isCurrentlyBlocked ? "unblock" : "block"}{" "}
              <strong>
                {selectedDate
                  ? selectedDate.toLocaleDateString("en-IN", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : ""}
              </strong>
              ?{" "}
              {isCurrentlyBlocked
                ? "Customers will be able to book on this date again."
                : "Customers will not be able to book on this date."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmOpen(false);
                setSelectedDate(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant={isCurrentlyBlocked ? "default" : "destructive"}
              disabled={blockMutation.isPending || unblockMutation.isPending}
              onClick={handleConfirmAction}
            >
              {isCurrentlyBlocked
                ? unblockMutation.isPending
                  ? "Unblocking…"
                  : "Confirm Unblock"
                : blockMutation.isPending
                  ? "Blocking…"
                  : "Confirm Block"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
