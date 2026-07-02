
import { useState } from 'react';
import { ShieldAlert, ShieldCheck, KeyRound } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { useApiQuery, useApiMutation } from '../../hooks/useApi';
import { useModal } from '../../hooks/useModal';
import { QUERY_KEYS } from '../../config/queryKeys';
import { API_ENDPOINTS } from '../../constants';
import { DataTable } from '../../components/ui/data-table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
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
}

interface UsersResponse {
  users: User[];
  pagination: { totalPages: number; currentPage: number };
}

// Component
export default function UsersPage() {
  const [page, setPage] = useState(1);
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
        <Badge variant={row.original.active ? 'default' : 'secondary'}>
          {row.original.active ? 'Active' : 'Suspended'}
        </Badge>
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
    </div>
  );
}
