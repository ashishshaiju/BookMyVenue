import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2, RotateCcw, AlertCircle, AlertTriangle } from "lucide-react";
import { useToast } from "../../hooks/useToast";

import { useApiQuery, useApiMutation } from "../../hooks/useApi";
import { QUERY_KEYS } from "../../config/queryKeys";
import { API_ENDPOINTS } from "../../constants";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { DataTable } from "../../components/ui/data-table";
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

interface ModerationSummary {
  flaggedReviews: Array<{
    _id: string;
    venueId: string;
    venueName: string;
    userName: string;
    rating: number;
    comment: string;
    moderationReason?: string;
    moderatedAt?: string;
    createdAt: string;
  }>;
  hideRequests: Array<{
    _id: string;
    venueName: string;
    ownerUsername: string;
    ownerEmail: string;
    userName: string;
    userEmail: string;
    rating: number;
    comment: string;
    hideRequestReason: string;
    hideRequestedAt: string;
  }>;
  suspendedVenues: Array<{
    _id: string;
    name: string;
    suspensionReason: string;
    suspendedAt: string;
  }>;
  bannedUsers: Array<{
    _id: string;
    userId: string;
    username: string;
    email: string;
    scope: string;
    banReason: string;
    bannedAt: string;
  }>;
}

const ModerationPage = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean;
    action: "remove" | "restore" | "approve_hide";
    reviewId?: string;
  }>({ open: false, action: "remove" });
  const [reviewReason, setReviewReason] = useState("");

  const { data: moderation, isLoading } = useApiQuery<ModerationSummary>(
    ["moderation-summary"],
    { url: API_ENDPOINTS.MODERATION_SUMMARY, method: "GET" },
  );

  const moderateReviewMutation = useApiMutation<
    unknown,
    {
      reviewId: string;
      action: "remove" | "restore" | "approve_hide" | "reject_hide";
      reason?: string;
    }
  >(
    (vars) => ({
      method: "POST",
      url: `${API_ENDPOINTS.REVIEWS}/${vars.reviewId}/moderate`,
      data: { action: vars.action, reason: vars.reason },
    }),
    {
      onSuccess: () => {
        success("Review moderated successfully");
        queryClient.invalidateQueries({ queryKey: ["moderation-summary"] });
        setReviewDialog({ open: false, action: "remove" });
        setReviewReason("");
      },
      onError: (err) => {
        const axiosErr = err as import("axios").AxiosError<{ message: string }>;
        error(axiosErr.response?.data?.message || "Failed to moderate review");
      },
    },
  );

  const unsuspendVenueMutation = useApiMutation<unknown, { venueId: string }>(
    (vars) => ({
      method: "POST",
      url: `${API_ENDPOINTS.VENUES}/${vars.venueId}/unsuspend`,
    }),
    {
      onSuccess: () => {
        success("Venue unsuspended successfully");
        queryClient.invalidateQueries({ queryKey: ["moderation-summary"] });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_VENUES });
      },
      onError: (err) => {
        const axiosErr = err as import("axios").AxiosError<{ message: string }>;
        error(axiosErr.response?.data?.message || "Failed to unsuspend venue");
      },
    },
  );

  const unbanUserMutation = useApiMutation<unknown, { userId: string }>(
    (vars) => ({
      method: "POST",
      url: `${API_ENDPOINTS.MODERATION_BANS}/user/${vars.userId}/lift-all`,
    }),
    {
      onSuccess: () => {
        success("User unbanned successfully");
        queryClient.invalidateQueries({ queryKey: ["moderation-summary"] });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_OWNERS });
      },
      onError: (err) => {
        const axiosErr = err as import("axios").AxiosError<{ message: string }>;
        error(axiosErr.response?.data?.message || "Failed to unban user");
      },
    },
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        Loading moderation data...
      </div>
    );
  }

  const flaggedReviews = moderation?.flaggedReviews || [];
  const hideRequests = moderation?.hideRequests || [];
  const suspendedVenues = moderation?.suspendedVenues || [];
  const bannedUsers = moderation?.bannedUsers || [];

  // Columns for Flagged Reviews
  const flaggedReviewsColumns = [
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
          <div className="flex gap-0.5 mb-1">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className={
                  i < row.original.rating
                    ? "text-yellow-500 text-xs"
                    : "text-gray-300 text-xs"
                }
              >
                ★
              </span>
            ))}
          </div>
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

  // Columns for Hide Requests
  const hideRequestsColumns = [
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
          <div className="flex gap-0.5 mb-1">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className={
                  i < row.original.rating
                    ? "text-yellow-500 text-xs"
                    : "text-gray-300 text-xs"
                }
              >
                ★
              </span>
            ))}
          </div>
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

  // Columns for Suspended Venues
  const suspendedVenuesColumns = [
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

  // Columns for Banned Users
  const bannedUsersColumns = [
    {
      accessorKey: "username",
      header: "User",
      cell: ({
        row,
      }: {
        row: { original: ModerationSummary["bannedUsers"][0] };
      }) => (
        <div>
          <p className="font-bold text-[var(--text-primary)]">
            {row.original.username}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            {row.original.email}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "banReason",
      header: "Ban Reason",
      cell: ({
        row,
      }: {
        row: { original: ModerationSummary["bannedUsers"][0] };
      }) => (
        <p className="text-sm text-[var(--text-secondary)] max-w-xs line-clamp-2">
          {row.original.banReason}
        </p>
      ),
    },
    {
      accessorKey: "bannedAt",
      header: "Banned On",
      cell: ({
        row,
      }: {
        row: { original: ModerationSummary["bannedUsers"][0] };
      }) => (
        <p className="text-sm text-[var(--text-secondary)]">
          {new Date(row.original.bannedAt).toLocaleDateString()}
        </p>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: () => (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-300 dark:bg-red-950"
        >
          Banned
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({
        row,
      }: {
        row: { original: ModerationSummary["bannedUsers"][0] };
      }) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            unbanUserMutation.mutate({ userId: row.original.userId })
          }
          disabled={unbanUserMutation.isPending}
        >
          <RotateCcw size={16} className="mr-1" /> Unban
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Moderation
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage flagged reviews, suspended venues, and banned users.
        </p>
      </div>

      {/* Flagged Reviews */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="text-red-500" size={24} />
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            Flagged Reviews
          </h2>
        </div>
        <Card className="p-0 border overflow-hidden">
          <DataTable
            columns={flaggedReviewsColumns}
            data={flaggedReviews}
            page={1}
            totalPages={1}
            onPageChange={() => {}}
            emptyMessage="No flagged reviews found."
          />
        </Card>
      </div>

      {/* Hide Requests */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-orange-500" size={24} />
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            Hide Requests
          </h2>
        </div>
        <Card className="p-0 border overflow-hidden">
          <DataTable
            columns={hideRequestsColumns}
            data={hideRequests}
            page={1}
            totalPages={1}
            onPageChange={() => {}}
            emptyMessage="No pending hide requests."
          />
        </Card>
      </div>

      {/* Suspended Venues */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          Suspended Venues
        </h2>
        <Card className="p-0 border overflow-hidden">
          <DataTable
            columns={suspendedVenuesColumns}
            data={suspendedVenues}
            page={1}
            totalPages={1}
            onPageChange={() => {}}
            emptyMessage="No suspended venues."
          />
        </Card>
      </div>

      {/* Banned Users */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          Banned Users
        </h2>
        <Card className="p-0 border overflow-hidden">
          <DataTable
            columns={bannedUsersColumns}
            data={bannedUsers}
            page={1}
            totalPages={1}
            onPageChange={() => {}}
            emptyMessage="No banned users."
          />
        </Card>
      </div>

      {/* Review Moderation Dialog */}
      <Dialog
        open={reviewDialog.open}
        onOpenChange={(open) => setReviewDialog({ ...reviewDialog, open })}
      >
        <DialogContent className="rounded-2xl border border-[var(--bg-grey)] bg-[var(--bg-tertiary)]">
          <DialogHeader>
            <DialogTitle>
              {reviewDialog.action === "remove"
                ? "Remove Review"
                : reviewDialog.action === "approve_hide"
                  ? "Approve Hide Request"
                  : "Restore Review"}
            </DialogTitle>
            <DialogDescription>
              {reviewDialog.action === "remove"
                ? "Are you sure you want to remove this review? This action cannot be undone."
                : reviewDialog.action === "approve_hide"
                  ? "Approving this hide request will remove the review. Please provide a reason (minimum 10 characters)."
                  : "Restore this review to be visible again?"}
            </DialogDescription>
          </DialogHeader>

          {(reviewDialog.action === "remove" ||
            reviewDialog.action === "approve_hide") && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="removal-reason">
                  Reason for removal (required)
                </Label>
                <Input
                  id="removal-reason"
                  placeholder="e.g., Contains inappropriate content"
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  className="rounded-lg border border-[var(--bg-grey)] bg-[var(--bg-primary)]"
                />
                {reviewReason.trim().length > 0 &&
                  reviewReason.trim().length < 10 && (
                    <p className="text-xs text-red-500 mt-1">
                      Reason must be at least 10 characters.
                    </p>
                  )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewDialog({ open: false, action: "remove" })}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (reviewDialog.reviewId) {
                  moderateReviewMutation.mutate({
                    reviewId: reviewDialog.reviewId,
                    action: reviewDialog.action,
                    reason:
                      reviewDialog.action === "remove" ||
                      reviewDialog.action === "approve_hide"
                        ? reviewReason
                        : undefined,
                  });
                }
              }}
              disabled={
                moderateReviewMutation.isPending ||
                ((reviewDialog.action === "remove" ||
                  reviewDialog.action === "approve_hide") &&
                  reviewReason.trim().length < 10)
              }
              className={`${reviewDialog.action === "remove" || reviewDialog.action === "approve_hide" ? "bg-red-600 text-white hover:bg-red-700" : ""}`}
            >
              {moderateReviewMutation.isPending ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModerationPage;
