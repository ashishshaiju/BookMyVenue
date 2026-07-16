import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { ReportDialogState } from "@/types/ui";
import { MAX_TEXT_LENGTH, MIN_REASON_LENGTH } from "@/constants/validation";

export function ReportDialog({
  reportDialog,
  setReportDialog,
  reportReason,
  setReportReason,
  handleReport,
  isPending,
}: {
  reportDialog: ReportDialogState;
  setReportDialog: (opts: ReportDialogState) => void;
  reportReason: string;
  setReportReason: (reason: string) => void;
  handleReport: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog
      open={reportDialog.open}
      onOpenChange={(open) => setReportDialog({ open })}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report Review to Admin</DialogTitle>
          <DialogDescription>
            Explain why this review should be hidden. An admin will review your
            request.
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
              maxLength={MAX_TEXT_LENGTH}
              rows={4}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {reportReason.length}/{MAX_TEXT_LENGTH}
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
            onClick={handleReport}
            disabled={
              isPending || reportReason.trim().length < MIN_REASON_LENGTH
            }
          >
            {isPending ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
