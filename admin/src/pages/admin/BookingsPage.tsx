import { useState } from "react";

import { useApiQuery } from "../../hooks/useApi";
import { useModal } from "../../hooks/useModal";
import { BookingDetailPanel } from "../../components/common/panels/BookingDetailPanel";
import { QUERY_KEYS } from "../../config/queryKeys";
import { API_ENDPOINTS } from "../../constants";
import { DataTable } from "../../components/ui/data-table";
import { Badge } from "../../components/ui/badge";

// Types
interface BookerInfo {
  name: string;
  email: string;
  phone?: string;
}

interface Booking {
  [key: string]: unknown;
  _id: string;
  venue: { name: string };
  bookerInfo: BookerInfo;
  date: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "REFUNDED";
  price: number;
  createdAt: string;
}

interface BookingsResponse {
  bookings: Booking[];
  pagination: { totalPages: number; currentPage: number };
}

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  CONFIRMED: "default",
  PENDING: "secondary",
  CANCELLED: "destructive",
  REFUNDED: "outline",
};

// Component
export default function BookingsPage() {
  const [page, setPage] = useState(1);
  const { openModal } = useModal();

  const params = new URLSearchParams({ page: String(page), limit: "10" });

  const { data, isLoading } = useApiQuery<BookingsResponse>(
    [...QUERY_KEYS.ADMIN_BOOKINGS, page],
    { method: "GET", url: `${API_ENDPOINTS.ADMIN_BOOKINGS}?${params}` },
  );

  const columns = [
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
      accessorKey: "venue",
      header: "Venue",
      cell: ({ row }: { row: { original: Booking } }) => (
        <span className="font-medium">{row.original.venue?.name ?? "—"}</span>
      ),
    },
    {
      accessorKey: "bookerInfo",
      header: "Booked By",
      cell: ({ row }: { row: { original: Booking } }) => {
        const b: BookerInfo = row.original.bookerInfo ?? {};
        return (
          <div>
            <p className="font-medium text-sm">{b.name ?? "—"}</p>
            <p className="text-xs text-muted-foreground">{b.email}</p>
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
        <Badge variant={STATUS_VARIANT[row.original.status] ?? "outline"}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "price",
      header: "Amount",
      cell: ({ row }: { row: { original: Booking } }) => (
        <span className="font-semibold text-green-600">
          ₹{(row.original.price as number).toLocaleString("en-IN")}
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">All Bookings</h1>
        <p className="text-muted-foreground mt-1">
          A global read-only view of every booking across all venues.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={data?.bookings ?? []}
        page={page}
        totalPages={data?.pagination?.totalPages ?? 0}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage="No bookings found."
      />
    </div>
  );
}
