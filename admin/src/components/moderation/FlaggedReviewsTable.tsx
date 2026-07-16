import { Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { StarRating } from "@/components/common/StarRating";
import type { ModerationSummary } from "@/types";
import type { ReviewActionDialogState } from "@/types/ui";
import type { UseMutationResult } from "@tanstack/react-query";

export function FlaggedReviewsTable({
  flaggedReviews,
  setReviewDialog,
  moderateReviewMutation,
}: {
  flaggedReviews: ModerationSummary["flaggedReviews"];

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
      header: "Venue & User",
      cell: ({
        row,
      }: {
        row: { original: ModerationSummary["flaggedReviews"][0] };
      }) => (
        <div>
          <p className="font-bold text-[var(--text-primary)]">
            {row.original.venueName}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            by {row.original.userName}
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
        row: { original: ModerationSummary["flaggedReviews"][0] };
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
      accessorKey: "moderationReason",
      header: "Flag Reason",
      cell: ({
        row,
      }: {
        row: { original: ModerationSummary["flaggedReviews"][0] };
      }) => (
        <p className="text-sm text-red-600 dark:text-red-400 max-w-xs line-clamp-2">
          {row.original.moderationReason || "No reason provided"}
        </p>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({
        row,
      }: {
        row: { original: ModerationSummary["flaggedReviews"][0] };
      }) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950"
            onClick={() =>
              setReviewDialog({
                open: true,
                action: "remove",
                reviewId: row.original._id,
              })
            }
            disabled={moderateReviewMutation.isPending}
          >
            <Trash2 size={16} className="mr-1" /> Remove
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              moderateReviewMutation.mutate({
                reviewId: row.original._id,
                action: "restore",
              })
            }
            disabled={moderateReviewMutation.isPending}
          >
            <RotateCcw size={16} className="mr-1" /> Restore
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={flaggedReviews}
      page={1}
      totalPages={1}
      onPageChange={() => {}}
      emptyMessage="No flagged reviews found."
    />
  );
}
