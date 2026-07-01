
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';

import { useApiQuery, useApiMutation } from '../../hooks/useApi';
import { useModal } from '../../hooks/useModal';
import { VenueDetailPanel } from '../../components/common/panels/VenueDetailPanel';
import { QUERY_KEYS } from '../../config/queryKeys';
import { API_ENDPOINTS } from '../../constants';
import { DataTable } from '../../components/ui/data-table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

// Types
interface Venue {
  [key: string]: unknown;
  _id: string;
  name: string;
  city: string;
  venueType: string;
  status: 'PendingReview' | 'Approved' | 'Rejected' | 'Suspended';
  active: boolean;
  suspensionReason?: string;
  createdAt: string;
}

interface VenuesResponse {
  venues: Venue[];
  pagination: { totalPages: number; currentPage: number };
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  Approved: 'default',
  PendingReview: 'secondary',
  Rejected: 'destructive',
  Suspended: 'outline',
};

//  Component
export default function VenuesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('All');

  // Reject dialog
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; venueId: string }>({
    open: false,
    venueId: '',
  });
  const [rejectReason, setRejectReason] = useState('');

  // Suspend dialog
  const [suspendDialog, setSuspendDialog] = useState<{ open: boolean; venueId: string }>({
    open: false,
    venueId: '',
  });
  const [suspensionReason, setSuspensionReason] = useState('');

  // Feature dialog
  const [featureDialog, setFeatureDialog] = useState<{ open: boolean; venueId: string }>({
    open: false,
    venueId: '',
  });
  const [featureDuration, setFeatureDuration] = useState('7');

  const { openModal, closeModal } = useModal();

  // Shared invalidator
  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_VENUES });

  // Query
  const params = new URLSearchParams({ page: String(page), limit: '10' });
  if (statusFilter !== 'All') params.append('status', statusFilter);

  const { data, isLoading } = useApiQuery<VenuesResponse>(
    [...QUERY_KEYS.ADMIN_VENUES, page, statusFilter],
    { method: 'GET', url: `${API_ENDPOINTS.ADMIN_VENUES}?${params}` },
  );

  // Mutations (all via useApiMutation builder)
  const approveMutation = useApiMutation<unknown, { id: string }>(
    (vars) => ({ method: 'POST', url: `${API_ENDPOINTS.VENUES}/${vars.id}/approve` }),
    {
      onSuccess: () => { toast.success('Venue approved'); invalidate(); },
      onError: (e: Error) => {
        const err = e as import("axios").AxiosError<{message: string}>;
        toast.error(err.response?.data?.message ?? 'Failed to approve');
      },
    },
  );

  const rejectMutation = useApiMutation<unknown, { id: string; reason: string }>(
    (vars) => ({
      method: 'POST',
      url: `${API_ENDPOINTS.VENUES}/${vars.id}/reject`,
      data: { reason: vars.reason },
    }),
    {
      onSuccess: () => {
        toast.success('Venue rejected');
        invalidate();
        setRejectDialog({ open: false, venueId: '' });
        setRejectReason('');
      },
      onError: (e: Error) => {
        const err = e as import("axios").AxiosError<{message: string}>;
        toast.error(err.response?.data?.message ?? 'Failed to reject');
      },
    },
  );

  const featureMutation = useApiMutation<unknown, { id: string; duration: number | null }>(
    (vars) => ({
      method: 'POST',
      url: `${API_ENDPOINTS.VENUES}/${vars.id}/feature`,
      data: { duration: vars.duration },
    }),
    {
      onSuccess: () => {
        toast.success('Venue featured!');
        invalidate();
        setFeatureDialog({ open: false, venueId: '' });
      },
      onError: (e: Error) => {
        const err = e as import("axios").AxiosError<{message: string}>;
        toast.error(err.response?.data?.message ?? 'Failed to feature venue');
      },
    },
  );

  const suspendMutation = useApiMutation<unknown, { id: string; suspensionReason: string }>(
    (vars) => ({
      method: 'POST',
      url: `${API_ENDPOINTS.VENUES}/${vars.id}/deactivate`,
      data: { suspensionReason: vars.suspensionReason },
    }),
    {
      onSuccess: () => {
        toast.success('Venue suspended');
        invalidate();
        setSuspendDialog({ open: false, venueId: '' });
        setSuspensionReason('');
        closeModal();
      },
      onError: (e: Error) => {
        const err = e as import("axios").AxiosError<{message: string}>;
        toast.error(err.response?.data?.message ?? 'Failed to suspend venue');
      },
    },
  );

  const unsuspendMutation = useApiMutation<unknown, { id: string }>(
    (vars) => ({
      method: 'POST',
      url: `${API_ENDPOINTS.VENUES}/${vars.id}/unsuspend`,
    }),
    {
      onSuccess: () => {
        toast.success('Venue unsuspended');
        invalidate();
        closeModal();
      },
      onError: (e: Error) => {
        const err = e as import("axios").AxiosError<{message: string}>;
        toast.error(err.response?.data?.message ?? 'Failed to unsuspend venue');
      },
    },
  );

  // Handlers
  const handleReject = () => {
    if (!rejectReason.trim()) return toast.error('Please enter a rejection reason');
    rejectMutation.mutate({ id: rejectDialog.venueId, reason: rejectReason });
  };

  const handleFeature = () => {
    const duration = featureDuration === 'indefinite' ? null : Number(featureDuration);
    featureMutation.mutate({ id: featureDialog.venueId, duration });
  };

  const handleSuspend = () => {
    if (!suspensionReason.trim()) return toast.error('Please enter a suspension reason');
    suspendMutation.mutate({ id: suspendDialog.venueId, suspensionReason });
  };

  // Columns
  const columns = [
    {
      accessorKey: 'name',
      header: 'Venue',
      cell: ({ row }: { row: { original: Venue } }) => (
        <div 
          className="cursor-pointer group"
          onClick={() => {
            openModal({
              title: row.original.name,
              size: 'xl',
              component: VenueDetailPanel,
              data: row.original,
              actions: [
                ...(row.original.status === 'PendingReview' ? [
                  { label: 'Approve', variant: 'default' as const, onClick: () => approveMutation.mutate({ id: row.original._id }), isLoading: approveMutation.isPending },
                  { label: 'Reject', variant: 'destructive' as const, onClick: () => { closeModal(); setRejectDialog({ open: true, venueId: row.original._id }); } }
                ] : []),
                ...(row.original.status === 'Approved' ? [
                  { label: 'Suspend', variant: 'destructive' as const, onClick: () => { closeModal(); setSuspendDialog({ open: true, venueId: row.original._id }); } }
                ] : []),
                ...(row.original.status === 'Suspended' ? [
                  { label: 'Unsuspend', variant: 'default' as const, onClick: () => unsuspendMutation.mutate({ id: row.original._id }), isLoading: unsuspendMutation.isPending }
                ] : []),
              ]
            });
          }}
        >
          <p className="font-medium group-hover:text-primary transition-colors hover:underline">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.city}</p>
        </div>
      ),
    },
    {
      accessorKey: 'venueType',
      header: 'Type',
      cell: ({ row }: { row: { original: Venue } }) => (
        <span className="capitalize text-sm">{row.original.venueType}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: Venue } }) => {
        const v = row.original as Venue;
        return (
          <div className="flex flex-col gap-1 items-start">
            <Badge variant={STATUS_VARIANT[v.status] ?? 'outline'}>{v.status}</Badge>
            {v.status === 'Approved' && !v.active && (
              <Badge variant="outline" className="text-amber-600 border-amber-600 text-xs">
                Inactive
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }: { row: { original: Venue } }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }: { row: { original: Venue } }) => {
        const venue = row.original as Venue;
        const isBusy =
          approveMutation.isPending ||
          rejectMutation.isPending ||
          featureMutation.isPending ||
          suspendMutation.isPending ||
          unsuspendMutation.isPending;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" disabled={isBusy}>
                <span className="sr-only">Open actions</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {venue.status === 'PendingReview' && (
                <>
                  <DropdownMenuItem onClick={() => approveMutation.mutate({ id: venue._id })}>
                    ✓ Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setRejectDialog({ open: true, venueId: venue._id })}
                  >
                    ✕ Reject…
                  </DropdownMenuItem>
                </>
              )}

              {venue.status === 'Approved' && (
                <>
                  <DropdownMenuItem
                    onClick={() => setFeatureDialog({ open: true, venueId: venue._id })}
                  >
                    ★ Feature Venue…
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-amber-600 focus:text-amber-600"
                    onClick={() => setSuspendDialog({ open: true, venueId: venue._id })}
                  >
                    ⏸ Suspend…
                  </DropdownMenuItem>
                </>
              )}

              {venue.status === 'Suspended' && (
                <DropdownMenuItem
                  onClick={() => unsuspendMutation.mutate({ id: venue._id })}
                >
                  ✓ Unsuspend
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Render
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Venues</h1>
          <p className="text-muted-foreground mt-1">Manage all venues on the platform.</p>
        </div>
        <div className="w-[200px]">
          <Select
            value={statusFilter}
            onValueChange={(v) => { setStatusFilter(v); setPage(1); }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="PendingReview">Pending Review</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Suspended">Suspended</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data?.venues ?? []}
        page={page}
        totalPages={data?.pagination?.totalPages ?? 0}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage="No venues found."
      />

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) => setRejectDialog((p) => ({ ...p, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Venue</DialogTitle>
            <DialogDescription>
              This reason will be sent to the venue owner. Be specific and constructive.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="reject-reason">Rejection Reason *</Label>
            <Input
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Incomplete documentation, inappropriate photos…"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialog({ open: false, venueId: '' });
                setRejectReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || rejectMutation.isPending}
              onClick={handleReject}
            >
              {rejectMutation.isPending ? 'Rejecting…' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feature Dialog */}
      <Dialog
        open={featureDialog.open}
        onOpenChange={(open) => setFeatureDialog((p) => ({ ...p, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feature Venue</DialogTitle>
            <DialogDescription>
              Choose how long this venue appears in the featured section.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="feature-duration">Duration</Label>
            <Select value={featureDuration} onValueChange={setFeatureDuration}>
              <SelectTrigger id="feature-duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 Days</SelectItem>
                <SelectItem value="30">30 Days</SelectItem>
                <SelectItem value="indefinite">Indefinitely</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFeatureDialog({ open: false, venueId: '' })}
            >
              Cancel
            </Button>
            <Button disabled={featureMutation.isPending} onClick={handleFeature}>
              {featureMutation.isPending ? 'Saving…' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog
        open={suspendDialog.open}
        onOpenChange={(open) => setSuspendDialog((p) => ({ ...p, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Venue</DialogTitle>
            <DialogDescription>
              This venue will be immediately hidden from users. The reason will be emailed to the owner.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="suspend-reason">Suspension Reason *</Label>
            <Input
              id="suspend-reason"
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              placeholder="e.g. Repeated user complaints, safety hazard…"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSuspendDialog({ open: false, venueId: '' });
                setSuspensionReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={suspensionReason.trim().length < 10 || suspendMutation.isPending}
              onClick={handleSuspend}
            >
              {suspendMutation.isPending ? 'Suspending…' : 'Confirm Suspension'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
