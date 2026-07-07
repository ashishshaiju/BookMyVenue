import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2, RotateCcw, AlertCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

import { useApiQuery, useApiMutation } from '../../hooks/useApi';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

interface ModerationSummary {
  flaggedReviews: Array<{
    _id: string;
    venueId: string;
    venueName: string;
    userName: string;
    rating: number;
    comment: string;
    reason: string;
    flaggedAt: string;
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
    username: string;
    email: string;
    banReason: string;
    bannedAt: string;
  }>;
}

const ModerationPage = () => {
  const queryClient = useQueryClient();
  const [reviewDialog, setReviewDialog] = useState<{ open: boolean; action: 'remove' | 'restore'; reviewId?: string }>({
    open: false,
    action: 'remove',
  });
  const [reviewReason, setReviewReason] = useState('');

  const { data: moderation, isLoading } = useApiQuery<ModerationSummary>(
    ['moderation-summary'],
    {
      url: '/moderation/summary',
      method: 'GET',
    }
  );

  const moderateReviewMutation = useApiMutation<unknown, { reviewId: string; action: 'remove' | 'restore'; reason?: string }>(
    (vars) => ({
      method: 'POST',
      url: `/reviews/${vars.reviewId}/moderate`,
      data: { action: vars.action, reason: vars.reason },
    }),
    {
      onSuccess: () => {
        toast.success('Review moderated successfully');
        queryClient.invalidateQueries({ queryKey: ['moderation-summary'] });
        setReviewDialog({ open: false, action: 'remove' });
        setReviewReason('');
      },
      onError: (error) => {
        const err = error as import('axios').AxiosError<{ message: string }>;
        toast.error(err.response?.data?.message || 'Failed to moderate review');
      },
    }
  );

  const unbanUserMutation = useApiMutation<unknown, { userId: string }>(
    (vars) => ({
      method: 'POST',
      url: `/user/${vars.userId}/unban`,
    }),
    {
      onSuccess: () => {
        toast.success('User unbanned successfully');
        queryClient.invalidateQueries({ queryKey: ['moderation-summary'] });
      },
      onError: (error) => {
        const err = error as import('axios').AxiosError<{ message: string }>;
        toast.error(err.response?.data?.message || 'Failed to unban user');
      },
    }
  );

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading moderation data...</div>;
  }

  const flaggedReviews = moderation?.flaggedReviews || [];
  const hideRequests = moderation?.hideRequests || [];
  const suspendedVenues = moderation?.suspendedVenues || [];
  const bannedUsers = moderation?.bannedUsers || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Moderation</h1>
        <p className="text-[var(--text-secondary)]">Manage flagged reviews, suspended venues, and banned users</p>
      </div>

      {/* Flagged Reviews */}
      <Card className="p-6 border border-[var(--bg-grey)] bg-[var(--bg-tertiary)]">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="text-red-500" size={24} />
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Flagged Reviews ({flaggedReviews.length})</h2>
        </div>

        {flaggedReviews.length === 0 ? (
          <p className="text-[var(--text-secondary)]">No flagged reviews</p>
        ) : (
          <div className="space-y-4">
            {flaggedReviews.map((review) => (
              <div key={review._id} className="p-4 bg-[var(--bg-primary)] rounded-lg border border-red-200 dark:border-red-900">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-[var(--text-primary)]">{review.venueName}</p>
                    <p className="text-sm text-[var(--text-secondary)]">by {review.userName}</p>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < review.rating ? 'text-yellow-500' : 'text-gray-300'}>
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm mb-3">{review.comment}</p>
                <p className="text-xs text-red-600 dark:text-red-400 mb-3">
                  <strong>Flag reason:</strong> {review.reason}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={() => {
                      setReviewDialog({ open: true, action: 'remove', reviewId: review._id });
                    }}
                    disabled={moderateReviewMutation.isPending}
                  >
                    <Trash2 size={16} className="mr-1" /> Remove
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      moderateReviewMutation.mutate({
                        reviewId: review._id,
                        action: 'restore',
                      });
                    }}
                    disabled={moderateReviewMutation.isPending}
                  >
                    <RotateCcw size={16} className="mr-1" /> Restore
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Hide Requests */}
      <Card className="p-6 border border-[var(--bg-grey)] bg-[var(--bg-tertiary)]">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="text-orange-500" size={24} />
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Hide Requests ({hideRequests.length})</h2>
        </div>

        {hideRequests.length === 0 ? (
          <p className="text-[var(--text-secondary)]">No pending hide requests</p>
        ) : (
          <div className="space-y-4">
            {hideRequests.map((review) => (
              <div key={review._id} className="p-4 bg-[var(--bg-primary)] rounded-lg border border-orange-200 dark:border-orange-900">
                <div className="mb-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-[var(--text-primary)]">{review.venueName}</p>
                      <p className="text-sm text-[var(--text-secondary)]">Venue Owner: {review.ownerUsername} ({review.ownerEmail})</p>
                      <p className="text-sm text-[var(--text-secondary)]">Reviewer: {review.userName} ({review.userEmail})</p>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < review.rating ? 'text-yellow-500' : 'text-gray-300'}>★</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm mb-2">{review.comment}</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mb-2">
                    <strong>Reason:</strong> {review.hideRequestReason}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-950"
                    onClick={() => {
                      setReviewDialog({ open: true, action: 'remove', reviewId: review._id });
                    }}
                    disabled={moderateReviewMutation.isPending}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      moderateReviewMutation.mutate({
                        reviewId: review._id,
                        action: 'restore',
                      });
                    }}
                    disabled={moderateReviewMutation.isPending}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Suspended Venues */}
      <Card className="p-6 border border-[var(--bg-grey)] bg-[var(--bg-tertiary)]">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Suspended Venues ({suspendedVenues.length})</h2>

        {suspendedVenues.length === 0 ? (
          <p className="text-[var(--text-secondary)]">No suspended venues</p>
        ) : (
          <div className="space-y-4">
            {suspendedVenues.map((venue) => (
              <div key={venue._id} className="p-4 bg-[var(--bg-primary)] rounded-lg border border-yellow-200 dark:border-yellow-900">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-[var(--text-primary)]">{venue.name}</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      <strong>Reason:</strong> {venue.suspensionReason}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Suspended on {new Date(venue.suspendedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950">
                    Suspended
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Banned Users */}
      <Card className="p-6 border border-[var(--bg-grey)] bg-[var(--bg-tertiary)]">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Banned Users ({bannedUsers.length})</h2>

        {bannedUsers.length === 0 ? (
          <p className="text-[var(--text-secondary)]">No banned users</p>
        ) : (
          <div className="space-y-4">
            {bannedUsers.map((user) => (
              <div key={user._id} className="p-4 bg-[var(--bg-primary)] rounded-lg border border-red-200 dark:border-red-900">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-[var(--text-primary)]">{user.username}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{user.email}</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      <strong>Reason:</strong> {user.banReason}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Banned on {new Date(user.bannedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 dark:bg-red-950">
                    Banned
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => unbanUserMutation.mutate({ userId: user._id })}
                  disabled={unbanUserMutation.isPending}
                >
                  <RotateCcw size={16} className="mr-1" /> Unban
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Review Moderation Dialog */}
      <Dialog open={reviewDialog.open} onOpenChange={(open) => setReviewDialog({ ...reviewDialog, open })}>
        <DialogContent className="rounded-2xl border border-[var(--bg-grey)] bg-[var(--bg-tertiary)]">
          <DialogHeader>
            <DialogTitle>
              {reviewDialog.action === 'remove' ? 'Remove Review' : 'Restore Review'}
            </DialogTitle>
            <DialogDescription>
              {reviewDialog.action === 'remove'
                ? 'Are you sure you want to remove this review? This action cannot be undone.'
                : 'Restore this review to be visible again?'}
            </DialogDescription>
          </DialogHeader>

          {reviewDialog.action === 'remove' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="removal-reason">Reason for removal (optional)</Label>
                <Input
                  id="removal-reason"
                  placeholder="e.g., Contains inappropriate content"
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  className="rounded-lg border border-[var(--bg-grey)] bg-[var(--bg-primary)]"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewDialog({ open: false, action: 'remove' })}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (reviewDialog.reviewId) {
                  moderateReviewMutation.mutate({
                    reviewId: reviewDialog.reviewId,
                    action: reviewDialog.action,
                    reason: reviewDialog.action === 'remove' ? reviewReason : undefined,
                  });
                }
              }}
              disabled={moderateReviewMutation.isPending}
              className={`${reviewDialog.action === 'remove' ? 'bg-red-600 hover:bg-red-700' : ''}`}
            >
              {moderateReviewMutation.isPending ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModerationPage;
