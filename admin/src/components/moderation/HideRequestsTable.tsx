import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { StarRating } from "@/components/common/StarRating";
import type { ModerationSummary } from "@/types";
import type { ReviewActionDialogState } from "@/types/ui";
import type { UseMutationResult } from "@tanstack/react-query";

export function HideRequestsTable({
  hideRequests,
  setReviewDialog,
  moderateReviewMutation,
}: {
  hideRequests: ModerationSummary["hideRequests"];

  setReviewDialog: (opts: ReviewActionDialogState) => void;

  moderateReviewMutation: UseMutationResult<
    unknown,
    unknown,
    {
      reviewId: string;
      action: "remove" | "reject_hide" | "restore" | "approve_hide";
      reason?: string;
    },
    unknown
  >;
}) {
  const columns = [
    {
      accessorKey: "venueName",
      header: "Venue & Parties",
      cell: ({
        row,
      }: {
        row: { original: ModerationSummary["hideRequests"][0] };
      }) => (
        <div>
          <p className="font-bold text-[var(--text-primary)]">
            {row.original.venueName}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            Owner: {row.original.ownerUsername}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            Reviewer: {row.original.userName}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "comment",
      header: "Review & Rating",
      cell: ({
        row,
      }: {
        row: { original: ModerationSummary["hideRequests"][0] };
      }) => (
        <div>
          <StarRating rating={row.original.rating} />
          <p className="text-sm text-[var(--text-primary)] line-clamp-2 max-w-xs">
            {row.original.comment}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "hideRequestReason",
      header: "Hide Reason",
      cell: ({
        row,
      }: {
        row: { original: ModerationSummary["hideRequests"][0] };
      }) => (
        <p className="text-sm text-orange-600 dark:text-orange-400 max-w-xs line-clamp-2">
          {row.original.hideRequestReason}
        </p>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({
        row,
      }: {
        row: { original: ModerationSummary["hideRequests"][0] };
      }) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-950"
            onClick={() =>
              setReviewDialog({
                open: true,
                action: "approve_hide",
                reviewId: row.original._id,
              })
            }
            disabled={moderateReviewMutation.isPending}
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              moderateReviewMutation.mutate({
                reviewId: row.original._id,
                action: "reject_hide",
              })
            }
            disabled={moderateReviewMutation.isPending}
          >
            Reject
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={hideRequests}
      page={1}
      totalPages={1}
      onPageChange={() => {}}
      emptyMessage="No pending hide requests."
    />
  );
}
