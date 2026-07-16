import { Badge } from "@/components/ui/badge";
import { BookingDetailPanel } from "@/components/common/panels/BookingDetailPanel";
import { STATUS_VARIANT } from "@/constants/statusVariants";

import type { Booking } from "@/types/models";

import { type ActiveModal } from "@/store/useModalStore";

export function useBookingColumns({
  openModal,
}: {
  openModal: (opts: Omit<ActiveModal, "id">) => void;
}) {
  return [
    {
      accessorKey: "_id",
      header: "Reference",
      cell: ({ row }: { row: { original: Booking } }) => {
        const id: string = row.original._id;
        return (
          <span
            className="font-mono text-sm font-medium cursor-pointer text-primary hover:underline"
            onClick={() => {
              openModal({
                title: `Booking Details`,
                size: "xl",
                component: BookingDetailPanel,
                data: row.original,
                actions: [],
              });
            }}
          >
            BMV-{id.slice(-6).toUpperCase()}
          </span>
        );
      },
    },
    {
      accessorKey: "venueId",
      header: "Venue",
      cell: ({ row }: { row: { original: Booking } }) => (
        <span className="font-medium">{row.original.venueId?.name ?? "—"}</span>
      ),
    },
    {
      accessorKey: "bookerName",
      header: "Booked By",
      cell: ({ row }: { row: { original: Booking } }) => {
        return (
          <div>
            <p className="font-medium text-sm">
              {row.original.bookerName ?? "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              {row.original.bookerPhone ?? "—"}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: "date",
      header: "Event Date",
      cell: ({ row }: { row: { original: Booking } }) =>
        new Date(row.original.date).toLocaleDateString(),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: { original: Booking } }) => (
        <Badge
          variant={
            STATUS_VARIANT[(row.original.status as string).toUpperCase()] ??
            "outline"
          }
        >
          {(row.original.status as string).toUpperCase()}
        </Badge>
      ),
    },
    {
      accessorKey: "totalPrice",
      header: "Amount",
      cell: ({ row }: { row: { original: Booking } }) => (
        <span className="font-semibold text-green-600">
          ₹{(row.original.totalPrice as number).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Booked On",
      cell: ({ row }: { row: { original: Booking } }) =>
        new Date(row.original.createdAt).toLocaleDateString(),
    },
  ];
}
