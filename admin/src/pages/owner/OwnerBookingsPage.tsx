import { useState } from "react";
import { useParams } from "react-router";
import { Plus } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import type { ColumnDef } from "@tanstack/react-table";

import { useOwnerBookings, useCreateOfflineBooking } from "../../services/api/useBookings";
import type { Booking, OfflineForm } from "../../types";
import { DataTable } from "../../components/ui/data-table";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  Confirmed: "default",
  Completed: "secondary",
  Cancelled: "destructive",
};

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

const EMPTY_FORM: OfflineForm = {
  customerName: "",
  phone: "",
  date: "",
  startTime: "",
  endTime: "",
  amountPaid: "",
};

export default function OwnerBookingsPage() {
  const { venueId } = useParams<{ venueId: string }>();
  const [page, setPage] = useState(1);
  const [offlineOpen, setOfflineOpen] = useState(false);
  const [form, setForm] = useState<OfflineForm>(EMPTY_FORM);

  const { data, isLoading } = useOwnerBookings(venueId!, page);
  const offlineMutation = useCreateOfflineBooking();
  const { success, error } = useToast();

  const handleSubmit = () => {
    if (
      !form.customerName.trim() ||
      !form.phone.trim() ||
      !form.date ||
      !form.startTime ||
      !form.endTime ||
      !form.amountPaid
    ) {
      error("Please fill in all fields");
      return;
    }
    const [sh, sm] = form.startTime.split(":").map(Number);
    const [eh, em] = form.endTime.split(":").map(Number);
    const startMins = (sh ?? 0) * 60 + (sm ?? 0);
    const endMins = (eh ?? 0) * 60 + (em ?? 0);
    if (endMins <= startMins) {
      error("End time must be after start time");
      return;
    }
    offlineMutation.mutate({
      venueId: venueId!,
      customerName: form.customerName,
      phone: form.phone,
      date: form.date,
      startTime: startMins,
      endTime: endMins,
      amountPaid: Number(form.amountPaid),
    }, {
      onSuccess: () => {
        success("Offline booking created");
        setOfflineOpen(false);
        setForm(EMPTY_FORM);
      },
      onError: (e) => {
        const err = e as import("axios").AxiosError<{ message: string }>;
        error(err.response?.data?.message ?? "Failed to create booking");
      }
    });
  };

  const set =
    (field: keyof OfflineForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const columns: ColumnDef<Booking, unknown>[] = [
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
      accessorKey: "bookerInfo",
      header: "Customer",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.bookerInfo?.name ?? "—"}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.bookerInfo?.phone ?? ""}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "price",
      header: "Amount",
      cell: ({ row }) => (
        <span className="font-semibold text-emerald-600">
          ₹{row.original.price.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      accessorKey: "paymentMethod",
      header: "Method",
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize text-xs">
          {row.original.paymentMethod ?? "online"}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANT[row.original.status] ?? "outline"}>
          {row.original.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground mt-1">
            All bookings for this venue.
          </p>
        </div>
        <Button onClick={() => setOfflineOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Offline Booking
        </Button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data?.bookings ?? []}
        page={page}
        totalPages={data?.pagination?.totalPages ?? 0}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage="No bookings found for this venue."
      />

      {/* Offline Booking Dialog */}
      <Dialog open={offlineOpen} onOpenChange={setOfflineOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Offline Booking</DialogTitle>
            <DialogDescription>
              Record a cash or walk-in booking directly without an online
              payment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label htmlFor="ob-name">Customer Name *</Label>
                <Input
                  id="ob-name"
                  placeholder="Ravi Kumar"
                  value={form.customerName}
                  onChange={set("customerName")}
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label htmlFor="ob-phone">Phone *</Label>
                <Input
                  id="ob-phone"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={set("phone")}
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label htmlFor="ob-date">Date *</Label>
                <Input
                  id="ob-date"
                  type="date"
                  value={form.date}
                  onChange={set("date")}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ob-start">Start Time *</Label>
                <Input
                  id="ob-start"
                  type="time"
                  value={form.startTime}
                  onChange={set("startTime")}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ob-end">End Time *</Label>
                <Input
                  id="ob-end"
                  type="time"
                  value={form.endTime}
                  onChange={set("endTime")}
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label htmlFor="ob-amount">Amount Paid (₹) *</Label>
                <Input
                  id="ob-amount"
                  type="number"
                  placeholder="5000"
                  min={1}
                  value={form.amountPaid}
                  onChange={set("amountPaid")}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOfflineOpen(false);
                setForm(EMPTY_FORM);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={offlineMutation.isPending}>
              {offlineMutation.isPending ? "Saving…" : "Create Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
