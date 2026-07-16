import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import type { Booking } from "@/types/models";
import { STATUS_VARIANT } from "@/constants/statusVariants";
import { minutesToTime } from "@/utils/bookingUtils";

export function useOwnerBookingColumns(): ColumnDef<Booking, unknown>[] {
  return [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.date}</p>
          <p className="text-xs text-muted-foreground">
            {minutesToTime(row.original.startTime)} —{" "}
            {minutesToTime(row.original.endTime)}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "bookerName",
      header: "Customer",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.bookerName ?? "—"}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.bookerPhone ?? ""}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "totalPrice",
      header: "Amount",
      cell: ({ row }) => (
        <span className="font-semibold text-emerald-600">
          ₹{(row.original.totalPrice as number)?.toLocaleString("en-IN") ?? 0}
        </span>
      ),
    },
    {
      accessorKey: "paymentMethod",
      header: "Method",
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize text-xs">
          {(row.original.paymentMethod as string) ?? "online"}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
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
  ];
}
