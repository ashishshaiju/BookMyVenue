import { useState } from "react";
import { useToast } from "@/hooks/useToast";
import { useModal } from "@/hooks/useModal";
import { FeaturedVenuesPanel } from "@/components/common/panels/FeaturedVenuesPanel";
import {
  useAdminVenues,
  useApproveVenue,
  useRejectVenue,
  useFeatureVenue,
  useSuspendVenue,
  useUnsuspendVenue,
} from "@/services/api/useAdminVenues";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { VenueDialogState } from "@/types/ui";

// Extracted Components
import { useVenueColumns } from "@/components/venues/useVenueColumns";
import { RejectVenueDialog } from "@/components/venues/RejectVenueDialog";
import { SuspendVenueDialog } from "@/components/venues/SuspendVenueDialog";
import { FeatureVenueDialog } from "@/components/venues/FeatureVenueDialog";

export default function VenuesPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("All");

  const [rejectDialog, setRejectDialog] = useState<VenueDialogState>({
    open: false,
    venueId: "",
  });
  const [rejectReason, setRejectReason] = useState("");

  const [suspendDialog, setSuspendDialog] = useState<VenueDialogState>({
    open: false,
    venueId: "",
  });
  const [suspensionReason, setSuspensionReason] = useState("");

  const [featureDialog, setFeatureDialog] = useState<VenueDialogState>({
    open: false,
    venueId: "",
  });
  const [featureDuration, setFeatureDuration] = useState("7");

  const { openModal, closeModal } = useModal();
  const { success, error } = useToast();

  const { data, isLoading } = useAdminVenues(page, statusFilter);

  const approveMutation = useApproveVenue();
  const rejectMutation = useRejectVenue();
  const featureMutation = useFeatureVenue();
  const suspendMutation = useSuspendVenue();
  const unsuspendMutation = useUnsuspendVenue();

  const handleReject = () => {
    if (!rejectReason.trim()) return error("Please enter a rejection reason");
    if (!rejectDialog.venueId) return;

    rejectMutation.mutate(
      { id: rejectDialog.venueId, reason: rejectReason },
      {
        onSuccess: () => {
          success("Venue rejected");
          setRejectDialog({ open: false, venueId: "" });
          setRejectReason("");
        },
        onError: (e: unknown) => {
          const err = e as import("axios").AxiosError<{ message: string }>;
          error(err.response?.data?.message ?? "Failed to reject");
        },
      },
    );
  };

  const handleFeature = () => {
    if (!featureDialog.venueId) return;

    featureMutation.mutate(
      {
        id: featureDialog.venueId,
        durationDays: "7", // Default to 7 days for featuring
      },
      {
        onSuccess: () => {
          success("Venue featured!");
          setFeatureDialog({ open: false, venueId: "" });
        },
        onError: (e: unknown) => {
          const err = e as import("axios").AxiosError<{ message: string }>;
          error(err.response?.data?.message ?? "Failed to feature venue");
        },
      },
    );
  };

  const handleSuspend = () => {
    if (!suspensionReason.trim())
      return error("Please enter a suspension reason");
    if (!suspendDialog.venueId) return;

    suspendMutation.mutate(
      { id: suspendDialog.venueId, suspensionReason },
      {
        onSuccess: () => {
          success("Venue suspended");
          setSuspendDialog({ open: false, venueId: "" });
          setSuspensionReason("");
          closeModal();
        },
        onError: (e: unknown) => {
          const err = e as import("axios").AxiosError<{ message: string }>;
          error(err.response?.data?.message ?? "Failed to suspend venue");
        },
      },
    );
  };

  const columns = useVenueColumns({
    openModal,
    closeModal,
    approveMutation,
    rejectMutation,
    featureMutation,
    suspendMutation,
    unsuspendMutation,
    setRejectDialog,
    setSuspendDialog,
    setFeatureDialog,
    success,
    error,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Venues</h1>
          <p className="text-muted-foreground mt-1">
            Manage, approve, and monitor venues across the platform.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() =>
              openModal({
                title: "Featured Venues",
                size: "2xl",
                component: FeaturedVenuesPanel,
                actions: [],
                data: {},
              })
            }
          >
            Manage Featured
          </Button>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="PendingReview">Pending Review</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
              <SelectItem value="Suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.venues ?? []}
        page={page}
        totalPages={data?.pagination?.totalPages ?? 0}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage={
          statusFilter === "All"
            ? "No venues found."
            : `No ${statusFilter.toLowerCase()} venues found.`
        }
      />

      <RejectVenueDialog
        open={rejectDialog.open}
        setOpen={(open) => setRejectDialog({ ...rejectDialog, open })}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        handleReject={handleReject}
        isPending={rejectMutation.isPending}
      />

      <SuspendVenueDialog
        open={suspendDialog.open}
        setOpen={(open) => setSuspendDialog({ ...suspendDialog, open })}
        suspensionReason={suspensionReason}
        setSuspensionReason={setSuspensionReason}
        handleSuspend={handleSuspend}
        isPending={suspendMutation.isPending}
      />

      <FeatureVenueDialog
        open={featureDialog.open}
        setOpen={(open) => setFeatureDialog({ ...featureDialog, open })}
        featureDuration={featureDuration}
        setFeatureDuration={setFeatureDuration}
        handleFeature={handleFeature}
        isPending={featureMutation.isPending}
      />
    </div>
  );
}
