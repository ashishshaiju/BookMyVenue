import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function RejectVenueDialog({
  open,
  setOpen,
  rejectReason,
  setRejectReason,
  handleReject,
  isPending,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  rejectReason: string;
  setRejectReason: (reason: string) => void;
  handleReject: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Venue</DialogTitle>
          <DialogDescription>
            This reason will be sent to the venue owner. Be specific and
            constructive.
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
              setOpen(false);
              setRejectReason("");
            }}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!rejectReason.trim() || isPending}
            onClick={handleReject}
          >
            {isPending ? "Rejecting…" : "Confirm Rejection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
