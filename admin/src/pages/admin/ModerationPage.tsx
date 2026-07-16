import { useState } from "react";
import { useApiQuery } from "@/hooks/useApi";
import { API_ENDPOINTS } from "@/constants";
import { QUERY_KEYS } from "@/config/queryKeys";
import { Card } from "@/components/ui/card";
import { AlertCircle, AlertTriangle } from "lucide-react";
// Extracted hooks and components
import { useModeration } from "@/hooks/useModeration";
import { FlaggedReviewsTable } from "@/components/moderation/FlaggedReviewsTable";
import { HideRequestsTable } from "@/components/moderation/HideRequestsTable";
import { SuspendedVenuesTable } from "@/components/moderation/SuspendedVenuesTable";
import { BannedUsersTable } from "@/components/moderation/BannedUsersTable";
import { ReviewActionDialog } from "@/components/moderation/ReviewActionDialog";
import type { ReviewActionDialogState } from "@/types/ui";
import type { ModerationSummary } from "@/types/moderation.types";

const ModerationPage = () => {
  const [reviewDialog, setReviewDialog] = useState<ReviewActionDialogState>({
    open: false,
    action: "remove",
    reviewId: null,
  });
  const [reviewReason, setReviewReason] = useState("");

  const { data: moderation, isLoading } = useApiQuery<ModerationSummary>(
    QUERY_KEYS.MODERATION_SUMMARY,
    { url: API_ENDPOINTS.MODERATION_SUMMARY, method: "GET" },
  );

  const { moderateReviewMutation, unsuspendVenueMutation, unbanUserMutation } =
    useModeration((opts) => setReviewDialog(opts), setReviewReason);

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

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Moderation Dashboard
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Review flagged content, manage suspensions, and handle user bans.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6 border-[var(--bg-grey)] bg-[var(--bg-primary)] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center text-[var(--text-primary)]">
              <AlertCircle className="mr-2 text-yellow-500" size={20} />
              Flagged Reviews
            </h2>
            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-yellow-900 dark:text-yellow-300">
              {flaggedReviews.length} Action
              {flaggedReviews.length !== 1 ? "s" : ""} Needed
            </span>
          </div>
          <div className="rounded-md border border-[var(--bg-grey)]">
            <FlaggedReviewsTable
              flaggedReviews={flaggedReviews}
              setReviewDialog={setReviewDialog}
              moderateReviewMutation={moderateReviewMutation}
            />
          </div>
        </Card>

        <Card className="p-6 border-[var(--bg-grey)] bg-[var(--bg-primary)] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center text-[var(--text-primary)]">
              <AlertTriangle className="mr-2 text-orange-500" size={20} />
              Hide Requests
            </h2>
            <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-orange-900 dark:text-orange-300">
              {hideRequests.length} Pending
            </span>
          </div>
          <div className="rounded-md border border-[var(--bg-grey)]">
            <HideRequestsTable
              hideRequests={hideRequests}
              setReviewDialog={setReviewDialog}
              moderateReviewMutation={moderateReviewMutation}
            />
          </div>
        </Card>

        <Card className="p-6 border-[var(--bg-grey)] bg-[var(--bg-primary)] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Suspended Venues
            </h2>
            <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-gray-700 dark:text-gray-300">
              {suspendedVenues.length} Total
            </span>
          </div>
          <div className="rounded-md border border-[var(--bg-grey)]">
            <SuspendedVenuesTable
              suspendedVenues={suspendedVenues}
              unsuspendVenueMutation={unsuspendVenueMutation}
            />
          </div>
        </Card>

        <Card className="p-6 border-[var(--bg-grey)] bg-[var(--bg-primary)] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Banned Users
            </h2>
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-red-900 dark:text-red-300">
              {bannedUsers.length} Total
            </span>
          </div>
          <div className="rounded-md border border-[var(--bg-grey)]">
            <BannedUsersTable
              bannedUsers={bannedUsers}
              unbanUserMutation={unbanUserMutation}
            />
          </div>
        </Card>
      </div>

      <ReviewActionDialog
        reviewDialog={reviewDialog}
        setReviewDialog={setReviewDialog}
        reviewReason={reviewReason}
        setReviewReason={setReviewReason}
        moderateReviewMutation={moderateReviewMutation}
      />
    </div>
  );
};

export default ModerationPage;
