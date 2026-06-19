import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
type ReviewModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venueName: string;
};

const ReviewModal = ({ open, onOpenChange, venueName }: ReviewModalProps) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[32px] border border-[var(--bg-grey)] bg-[var(--bg-tertiary)] p-7 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[var(--text-primary)]">
            Add Review
          </DialogTitle>

          <p className="text-sm text-[var(--text-secondary)]">
            Share your experience for {venueName}
          </p>
        </DialogHeader>

        {/* Stars */}
        <div className="mt-3">
          <p className="mb-3 font-medium text-[var(--text-primary)]">Your Rating</p>

          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="cursor-pointer transition hover:scale-110"
              >
                <Star
                  className={`size-8 ${
                    star <= rating
                      ? 'fill-[var(--bg-green)] text-[var(--bg-green)]'
                      : 'text-[var(--bg-grey)]'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Review */}
        <div className="mt-5">
          <p className="mb-3 font-medium text-[var(--text-primary)]">Review</p>

          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Tell others about your experience..."
            className="min-h-[140px] w-full rounded-3xl border border-[var(--bg-grey)] bg-[var(--bg-primary)] p-4 outline-none resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-2xl cursor-pointer"
          >
            Cancel
          </Button>

          <Button className="rounded-2xl bg-[var(--bg-green)] hover:opacity-90 cursor-pointer">
            Submit Review
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewModal;
