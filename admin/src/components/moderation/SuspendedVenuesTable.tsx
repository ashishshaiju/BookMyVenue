import { RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import type { ModerationSummary } from "@/types";
import type { UseMutationResult } from "@tanstack/react-query";

export function SuspendedVenuesTable({
  suspendedVenues,
  unsuspendVenueMutation,
}: {
  suspendedVenues: ModerationSummary["suspendedVenues"];

  unsuspendVenueMutation: UseMutationResult<
    unknown,
    unknown,
    { venueId: string },
    unknown
  >;
}) {
  const columns = [
    {
      accessorKey: "name",
      header: "Venue",
      cell: ({
        row,
      }: {
        row: { original: ModerationSummary["suspendedVenues"][0] };
      }) => (
        <p className="font-bold text-[var(--text-primary)]">
          {row.original.name}
        </p>
      ),
    },
    {
      accessorKey: "suspensionReason",
      header: "Reason",
      cell: ({
        row,
      }: {
        row: { original: ModerationSummary["suspendedVenues"][0] };
      }) => (
        <p className="text-sm text-[var(--text-secondary)] max-w-xs line-clamp-2">
          {row.original.suspensionReason}
        </p>
      ),
    },
    {
      accessorKey: "suspendedAt",
      header: "Suspended On",
      cell: ({
        row,
      }: {
        row: { original: ModerationSummary["suspendedVenues"][0] };
      }) => (
        <p className="text-sm text-[var(--text-secondary)]">
          {new Date(row.original.suspendedAt).toLocaleDateString()}
        </p>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: () => (
        <Badge
          variant="outline"
          className="bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950"
        >
          Suspended
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({
        row,
      }: {
        row: { original: ModerationSummary["suspendedVenues"][0] };
      }) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            unsuspendVenueMutation.mutate({ venueId: row.original._id })
          }
          disabled={unsuspendVenueMutation.isPending}
        >
          <RotateCcw size={16} className="mr-1" /> Unsuspend
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={suspendedVenues}
      page={1}
      totalPages={1}
      onPageChange={() => {}}
      emptyMessage="No suspended venues."
    />
  );
}
