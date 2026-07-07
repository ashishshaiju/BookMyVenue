
import { useState } from 'react';
import { ShieldAlert, ShieldCheck, KeyRound, Ban } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

import { useApiQuery, useApiMutation } from '../../hooks/useApi';
import { useModal } from '../../hooks/useModal';
import { QUERY_KEYS } from '../../config/queryKeys';
import { API_ENDPOINTS } from '../../constants';
import { DataTable } from '../../components/ui/data-table';
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
import type { UserProfile } from '../../components/guards/AuthGuard';

// Types
interface User {
  [key: string]: unknown;
  _id: string;
  username: string;
  email: string;
  active: boolean;
  createdAt: string;
  roles: string[];
  banReason?: string;
  bannedAt?: string;
  bannedBy?: string;
}

interface UsersResponse {
  users: User[];
  pagination: { totalPages: number; currentPage: number };
}

// Component
export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [banDialog, setBanDialog] = useState<{
    open: boolean;
    user: User | null;
    reason: string;
    scope: 'full' | 'commenting' | 'owner_dashboard' | 'venue_creation';
    venueId?: string | null;
    duration?: 'permanent' | '1day' | '7days' | '30days' | 'custom';
    customDate?: string;
  }>({
    open: false,
    user: null,
    reason: '',
    scope: 'full',
  });
  const { openModal, closeModal } = useModal();
  const queryClient = useQueryClient();

  const params = new URLSearchParams({ page: String(page), limit: '10' });

  const { data, isLoading } = useApiQuery<UsersResponse>(
    [...QUERY_KEYS.ADMIN_OWNERS, 'all-users', page],
    { method: 'GET', url: `${API_ENDPOINTS.ADMIN_USERS}?${params}` },
  );

  const { data: profile } = useApiQuery<UserProfile>(
    QUERY_KEYS.PROFILE,
    { method: 'GET', url: API_ENDPOINTS.PROFILE },
    { staleTime: Infinity }
  );

  const toggleStatusMutation = useApiMutation<{ active: boolean }, { userId: string }>(
    (v) => ({ url: `/user/${v.userId}/toggle-status`, method: 'PATCH' }),
    {
      onSuccess: () => {
        toast.success('User status updated');
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_OWNERS });
        closeModal();
      },
      onError: (err: Error) => {
        const axiosErr = err as import("axios").AxiosError<{message: string}>;
        toast.error(axiosErr.response?.data?.message || 'Failed to update user status');
      }
    }
  );

  const changePasswordMutation = useApiMutation<unknown, unknown>(
    () => ({ url: `/auth/change-password`, method: 'PATCH' }),
    {
      onSuccess: () => {
        toast.success('Password changed successfully. Please use your new password next time.');
        closeModal();
      },
      onError: (err: Error) => {
        const axiosErr = err as import("axios").AxiosError<{message: string}>;
        toast.error(axiosErr.response?.data?.message || 'Failed to change password');
      },
    }
  );

  const resetPasswordMutation = useApiMutation<unknown, { userId: string }>(
    (v) => ({ url: `/user/${v.userId}/reset-password`, method: 'POST' }),
    {
      onSuccess: () => {
        toast.success('Password reset successfully. Email dispatched.');
        closeModal();
      },
      onError: (err: Error) => {
        const axiosErr = err as import("axios").AxiosError<{message: string}>;
        toast.error(axiosErr.response?.data?.message || 'Failed to reset password');
        closeModal();
      },
    }
  );

  const banUserMutation = useApiMutation<
    unknown,
    { userId: string; scope: string; reason: string; venueId?: string | null; expiresAt?: string | null }
  >(
    (v) => ({
      url: '/moderation/bans',
      method: 'POST',
      data: {
        userId: v.userId,
        scope: v.scope,
        reason: v.reason,
        venueId: v.venueId || undefined,
        expiresAt: v.expiresAt || undefined,
      },
    }),
    {
      onSuccess: () => {
        toast.success('User banned successfully');
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_OWNERS });
        setBanDialog({ open: false, user: null, reason: '', scope: 'full' });
      },
      onError: (err: Error) => {
        const axiosErr = err as import('axios').AxiosError<{ message: string }>;
        toast.error(axiosErr.response?.data?.message || 'Failed to ban user');
      },
    }
  );

  const handleToggleStatus = (user: User) => {
    openModal({
      title: `${user.active ? 'Suspend' : 'Activate'} User`,
      size: 'md',
      data: user,
      component: () => (
        <div className="p-4 text-center">
          <p className="mb-4">Are you sure you want to {user.active ? 'suspend' : 'activate'} <strong>{user.username}</strong>?</p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={closeModal} disabled={toggleStatusMutation.isPending}>Cancel</Button>
            <Button 
              variant={user.active ? 'destructive' : 'default'} 
              onClick={() => {
                toggleStatusMutation.mutate({ userId: user._id });
              }}
              disabled={toggleStatusMutation.isPending}
            >
              {toggleStatusMutation.isPending ? 'Processing...' : 'Confirm'}
            </Button>
          </div>
        </div>
      ),
      actions: []
    });
  };

  const handleResetPassword = (user: User) => {
    if (profile && user._id === profile._id) {
      openModal({
        title: `Change My Password`,
        size: 'md',
        data: user,
        component: function ChangePasswordForm() {
          const [oldPass, setOldPass] = useState('');
          const [newPass, setNewPass] = useState('');
          const [confirmPass, setConfirmPass] = useState('');

          const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            if (newPass !== confirmPass) {
              toast.error('New passwords do not match');
              return;
            }
            if (newPass.length < 8) {
              toast.error('Password must be at least 8 characters');
              return;
            }
            changePasswordMutation.mutate({ oldPassword: oldPass, newPassword: newPass });
          };

          return (
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Old Password</label>
                <input 
                  type="password" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={oldPass} 
                  onChange={e => setOldPass(e.target.value)} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">New Password</label>
                <input 
                  type="password" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newPass} 
                  onChange={e => setNewPass(e.target.value)} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm New Password</label>
                <input 
                  type="password" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={confirmPass} 
                  onChange={e => setConfirmPass(e.target.value)} 
                  required 
                />
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <Button type="button" variant="outline" onClick={closeModal} disabled={changePasswordMutation.isPending}>Cancel</Button>
                <Button type="submit" disabled={changePasswordMutation.isPending}>
                  {changePasswordMutation.isPending ? 'Saving...' : 'Change Password'}
                </Button>
              </div>
            </form>
          );
        },
        actions: []
      });
    } else {
      openModal({
        title: `Reset Password for ${user.username}`,
        size: 'md',
        data: user,
        component: () => (
          <div className="p-4 text-center">
            <p className="mb-4">This will generate a new random password and email it to <strong>{user.email}</strong>. Are you sure?</p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={closeModal} disabled={resetPasswordMutation.isPending}>Cancel</Button>
              <Button 
                variant="destructive" 
                onClick={() => resetPasswordMutation.mutate({ userId: user._id })}
                disabled={resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending ? 'Processing...' : 'Reset Password'}
              </Button>
            </div>
          </div>
        ),
        actions: []
      });
    }
  };

  const columns = [
    {
      accessorKey: 'username',
      header: 'Name',
      cell: ({ row }: { row: { original: User } }) => (
        <span className="font-medium text-zinc-900">{row.original.username}</span>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'roles',
      header: 'Roles',
      cell: ({ row }: { row: { original: User } }) => {
        const roles = row.original.roles || [];
        return (
          <div className="flex gap-1 flex-wrap">
            {roles.map((role: string) => (
              <Badge key={role} variant={role === 'superAdmin' ? 'default' : 'secondary'} className="capitalize">
                {role}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: 'active',
      header: 'Status',
      cell: ({ row }: { row: { original: User } }) => (
        <div className="flex gap-2 flex-wrap">
          <Badge variant={row.original.active ? 'default' : 'secondary'}>
            {row.original.active ? 'Active' : 'Suspended'}
          </Badge>
          {Boolean((row.original as Record<string, unknown>).isBanned) && (
            <Badge variant="destructive" className="bg-red-600/20 text-red-600">
              Banned
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Joined',
      cell: ({ row }: { row: { original: User } }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: { original: User } }) => {
        const isSelf = profile && row.original._id === profile._id;

        return (
          <div className="flex items-center gap-2">
            {!isSelf && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBanDialog({ open: true, user: row.original, reason: '', scope: 'full' })}
                title="Ban User"
              >
                <Ban className="w-4 h-4 text-red-500" />
              </Button>
            )}
            {!isSelf && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleStatus(row.original)}
                title={row.original.active ? 'Suspend User' : 'Activate User'}
              >
                {row.original.active ? <ShieldAlert className="w-4 h-4 text-red-500" /> : <ShieldCheck className="w-4 h-4 text-green-500" />}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleResetPassword(row.original)}
              title="Reset Password"
            >
              <KeyRound className="w-4 h-4 text-amber-500" />
            </Button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-1">SuperAdmin control panel for all users.</p>
        </div>
      </div>
      
      <DataTable
        columns={columns}
        data={data?.users || []}
        page={page}
        totalPages={data?.pagination?.totalPages || 0}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage="No users found."
      />

      {/* Ban User Dialog */}
      <Dialog open={banDialog.open} onOpenChange={(open) => setBanDialog({ ...banDialog, open })}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              Ban {banDialog.user?.username} from the platform. Select ban scope and provide a reason.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ban-scope">Ban Scope</Label>
              <Select value={banDialog.scope} onValueChange={(value) => setBanDialog({ ...banDialog, scope: value as 'full' | 'commenting' | 'owner_dashboard' | 'venue_creation', venueId: undefined })}>
                <SelectTrigger className="rounded-lg border border-[var(--bg-grey)] bg-[var(--bg-primary)]">
                  <SelectValue placeholder="Select ban scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Platform Ban</SelectItem>
                  <SelectItem value="commenting">Commenting Ban</SelectItem>
                  <SelectItem value="owner_dashboard">Owner Dashboard Ban</SelectItem>
                  <SelectItem value="venue_creation">Venue Creation Ban</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-[var(--text-secondary)]">
                {banDialog.scope === 'full' && 'Blocks all access to the platform'}
                {banDialog.scope === 'commenting' && 'Blocks review/comment creation'}
                {banDialog.scope === 'owner_dashboard' && 'Blocks owner dashboard access'}
                {banDialog.scope === 'venue_creation' && 'Blocks new venue creation'}
              </p>
            </div>

            {(banDialog.scope === 'commenting' || banDialog.scope === 'owner_dashboard') && (
              <div className="space-y-2">
                <Label htmlFor="ban-venue">Venue Scope (Optional)</Label>
                <Select value={banDialog.venueId || 'all'} onValueChange={(value) => setBanDialog({ ...banDialog, venueId: value === 'all' ? null : value })}>
                  <SelectTrigger className="rounded-lg border border-[var(--bg-grey)] bg-[var(--bg-primary)]">
                    <SelectValue placeholder="Select venue" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Venues (Global)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-[var(--text-secondary)]">
                  Leave as "All Venues" for a global ban, or select a specific venue for venue-scoped restriction
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="ban-duration">Duration</Label>
              <Select value={banDialog.duration || 'permanent'} onValueChange={(value) => setBanDialog({ ...banDialog, duration: value as 'permanent' | '1day' | '7days' | '30days' | 'custom', customDate: undefined })}>
                <SelectTrigger className="rounded-lg border border-[var(--bg-grey)] bg-[var(--bg-primary)]">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="permanent">Permanent</SelectItem>
                  <SelectItem value="1day">1 Day</SelectItem>
                  <SelectItem value="7days">7 Days</SelectItem>
                  <SelectItem value="30days">30 Days</SelectItem>
                  <SelectItem value="custom">Custom Date</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {banDialog.duration === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="ban-custom-date">Expiry Date</Label>
                <Input
                  id="ban-custom-date"
                  type="datetime-local"
                  value={banDialog.customDate || ''}
                  onChange={(e) => setBanDialog({ ...banDialog, customDate: e.target.value })}
                  className="rounded-lg border border-[var(--bg-grey)] bg-[var(--bg-primary)]"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="ban-reason">Ban Reason</Label>
              <Input
                id="ban-reason"
                placeholder="e.g., Violating terms of service, abusive behavior"
                value={banDialog.reason}
                onChange={(e) => setBanDialog({ ...banDialog, reason: e.target.value })}
                minLength={10}
                className="rounded-lg border border-[var(--bg-grey)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
              />
              <p className="text-xs text-[var(--text-secondary)]">
                Minimum 10 characters required
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBanDialog({ open: false, user: null, reason: '', scope: 'full' })}
              disabled={banUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (banDialog.user && banDialog.reason.trim().length >= 10) {
                  let expiresAt: string | null = null;
                  const now = new Date();
                  switch (banDialog.duration) {
                    case '1day':
                      expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
                      break;
                    case '7days':
                      expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
                      break;
                    case '30days':
                      expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
                      break;
                    case 'custom':
                      expiresAt = banDialog.customDate ? new Date(banDialog.customDate).toISOString() : null;
                      break;
                  }
                  banUserMutation.mutate({
                    userId: banDialog.user._id,
                    scope: banDialog.scope,
                    reason: banDialog.reason,
                    venueId: banDialog.venueId,
                    expiresAt,
                  });
                }
              }}
              disabled={banUserMutation.isPending || banDialog.reason.trim().length < 10}
            >
              {banUserMutation.isPending ? 'Banning...' : 'Ban User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
