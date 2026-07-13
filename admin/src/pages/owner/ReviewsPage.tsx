import { useState } from "react";
import { useParams } from "react-router";
import { useToast } from "../../hooks/useToast";
import type { ColumnDef } from "@tanstack/react-table";

import { useReviews, useReplyToReview, useReportReview } from "../../services/api/useReviews";
import type { Review, ReplyDialogState, ReportDialogState } from "../../types";
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
import { Label } from "../../components/ui/label";

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  visible: "default",
  flagged: "secondary",
  removed: "destructive",
};

const HIDE_REQUEST_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  none: "outline",
  pending: "secondary",
  approved: "destructive",
  rejected: "outline",
};

export default function ReviewsPage() {
  const { venueId } = useParams<{ venueId: string }>();
  const [page, setPage] = useState(1);
  const [replyDialog, setReplyDialog] = useState<ReplyDialogState>({
    open: false,
  });
  const [replyText, setReplyText] = useState("");
  const [reportDialog, setReportDialog] = useState<ReportDialogState>({
    open: false,
  });
  const [reportReason, setReportReason] = useState("");

  const { data, isLoading } = useReviews(venueId!, page);

  const replyMutation = useReplyToReview();
  const reportMutation = useReportReview();
  const { success, error } = useToast();

  const columns: ColumnDef<Review, unknown>[] = [
    {
      accessorKey: "userId",
      header: "Reviewer",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-sm">{row.original.userId.username}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.userId.email}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "rating",
      header: "Rating",
      cell: ({ row }) => (
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <span
              key={i}
              className={
                i < row.original.rating ? "text-yellow-500" : "text-gray-300"
              }
            >
              ★
            </span>
          ))}
        </div>
      ),
    },
    {
      accessorKey: "comment",
      header: "Comment",
      cell: ({ row }) => (
        <p className="text-sm max-w-xs truncate">
          {row.original.comment || "—"}
        </p>
      ),
    },
    {
      accessorKey: "ownerReply",
      header: "Your Reply",
      cell: ({ row }) =>
        row.original.ownerReply ? (
          <div className="text-sm">
            <p className="text-gray-600 dark:text-gray-400 italic">
              {row.original.ownerReply.text}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(row.original.ownerReply.repliedAt).toLocaleDateString()}
            </p>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setReplyDialog({ open: true, reviewId: row.original._id });
              setReplyText("");
            }}
            disabled={replyMutation.isPending}
          >
            Reply
          </Button>
        ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className="flex flex-col gap-2">
          <Badge variant={STATUS_VARIANT[row.original.status] ?? "outline"}>
            {row.original.status}
          </Badge>
          {row.original.hideRequestStatus !== "none" && (
            <Badge
              variant={HIDE_REQUEST_VARIANT[row.original.hideRequestStatus]}
            >
              {row.original.hideRequestStatus === "pending"
                ? "Hide Requested"
                : `Hide ${row.original.hideRequestStatus}`}
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="destructive"
          onClick={() => {
            setReportDialog({ open: true, reviewId: row.original._id });
            setReportReason("");
          }}
          disabled={
            row.original.hideRequestStatus === "pending" ||
            reportMutation.isPending
          }
        >
          Report
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reviews</h1>
        <p className="text-muted-foreground mt-1">
          All reviews left on your venue. Reply to reviews and report
          inappropriate content to admins.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={data?.reviews ?? []}
        page={page}
        totalPages={data?.pagination?.totalPages ?? 0}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage="No reviews yet for this venue."
      />

      {/* Reply Dialog */}
      <Dialog
        open={replyDialog.open}
        onOpenChange={(open) => setReplyDialog({ open })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reply to Review</DialogTitle>
            <DialogDescription>
              Share your response to this customer's review.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="reply-text">Your Reply</Label>
              <textarea
                id="reply-text"
                placeholder="Thank you for your feedback..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                maxLength={500}
                rows={4}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {replyText.length}/500
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReplyDialog({ open: false });
                setReplyText("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (replyDialog.reviewId && replyText.trim()) {
                  replyMutation.mutate({
                    venueId: venueId!,
                    reviewId: replyDialog.reviewId,
                    text: replyText,
                  }, {
                    onSuccess: () => {
                      success("Reply added successfully");
                      setReplyDialog({ open: false });
                      setReplyText("");
                    },
                    onError: (e) => {
                      const err = e as import("axios").AxiosError<{ message: string }>;
                      error(err.response?.data?.message ?? "Failed to add reply");
                    }
                  });
                } else {
                  error("Reply cannot be empty");
                }
              }}
              disabled={replyMutation.isPending || !replyText.trim()}
            >
              {replyMutation.isPending ? "Posting..." : "Post Reply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog
        open={reportDialog.open}
        onOpenChange={(open) => setReportDialog({ open })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report Review to Admin</DialogTitle>
            <DialogDescription>
              Explain why this review should be hidden. An admin will review
              your request.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="report-reason">
                Reason (minimum 10 characters)
              </Label>
              <textarea
                id="report-reason"
                placeholder="This review contains inappropriate language..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                maxLength={500}
                rows={4}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {reportReason.length}/500
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReportDialog({ open: false });
                setReportReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (reportDialog.reviewId && reportReason.trim().length >= 10) {
                  reportMutation.mutate({
                    venueId: venueId!,
                    reviewId: reportDialog.reviewId,
                    reason: reportReason,
                  }, {
                    onSuccess: () => {
                      success("Report submitted to admin for review");
                      setReportDialog({ open: false });
                      setReportReason("");
                    },
                    onError: (e) => {
                      const err = e as import("axios").AxiosError<{ message: string }>;
                      error(err.response?.data?.message ?? "Failed to submit report");
                    }
                  });
                } else {
                  error("Reason must be at least 10 characters");
                }
              }}
              disabled={
                reportMutation.isPending || reportReason.trim().length < 10
              }
            >
              {reportMutation.isPending ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
