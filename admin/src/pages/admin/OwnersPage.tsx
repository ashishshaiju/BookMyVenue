
import { useState } from 'react';

import { useApiQuery } from '../../hooks/useApi';
import { useModal } from '../../hooks/useModal';
import { OwnerDetailPanel } from '../../components/common/panels/OwnerDetailPanel';
import { QUERY_KEYS } from '../../config/queryKeys';
import { API_ENDPOINTS } from '../../constants';
import { DataTable } from '../../components/ui/data-table';
import { Badge } from '../../components/ui/badge';

// Types
interface Owner {
  [key: string]: unknown;
  _id: string;
  username: string;
  email: string;
  active: boolean;
  createdAt: string;
}

interface OwnersResponse {
  users: Owner[];
  pagination: { totalPages: number; currentPage: number };
}

// Component
export default function OwnersPage() {
  const [page, setPage] = useState(1);
  const { openModal } = useModal();

  const params = new URLSearchParams({ page: String(page), limit: '10', role: 'owner' });

  const { data, isLoading } = useApiQuery<OwnersResponse>(
    [...QUERY_KEYS.ADMIN_OWNERS, page],
    { method: 'GET', url: `${API_ENDPOINTS.ADMIN_USERS}?${params}` },
  );

  const columns = [
    {
      accessorKey: 'username',
      header: 'Name',
      cell: ({ row }: { row: { original: Owner } }) => (
        <span 
          className="font-medium cursor-pointer text-primary hover:underline"
          onClick={() => {
            openModal({
              title: `Owner Profile`,
              size: 'xl',
              component: OwnerDetailPanel,
              data: row.original,
              actions: []
            });
          }}
        >
          {row.original.username}
        </span>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }: { row: { original: Owner } }) => (
        <span className="text-muted-foreground text-sm">{row.original.email}</span>
      ),
    },
    {
      accessorKey: 'active',
      header: 'Status',
      cell: ({ row }: { row: { original: Owner } }) => (
        <Badge variant={row.original.active ? 'default' : 'secondary'}>
          {row.original.active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Joined',
      cell: ({ row }: { row: { original: Owner } }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Venue Owners</h1>
        <p className="text-muted-foreground mt-1">
          A global read-only view of all registered venue owners.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={data?.users ?? []}
        page={page}
        totalPages={data?.pagination?.totalPages ?? 0}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage="No owners found."
      />
    </div>
  );
}
