import { Badge } from '../../ui/badge';
import { Card } from '../../ui/card';

interface VenueData {
  status?: string; suspensionReason?: string; rejectionReason?: string; active?: boolean; name?: string; venueType?: string; bookingType?: string; coverImage?: string;
  capacity?: number; maxCapacity?: number; city?: string; district?: string; address?: string; pincode?: string;
  pricing?: { pricingType?: string; basePrice?: number; pricePerHour?: number; pricePerDay?: number; pricingRules?: { fromTime: string; toTime: string; price: number }[] };
  fixedPackages?: { name: string; startTime: string; endTime: string; price: number }[];
  amenities?: string[]; description?: string; contact?: { name: string; phone: string; email: string };
  createdAt?: string; [key: string]: unknown;
}
export function VenueDetailPanel({ data: rawData }: { data: Record<string, unknown> }) {
  const data = rawData as unknown as VenueData;
  if (!data) return null;

  return (
    <div className="space-y-6 text-sm">
      {/* Cover Image */}
      {data.coverImage && (
        <div className="w-full h-48 md:h-64 rounded-xl overflow-hidden relative">
          <img
            src={data.coverImage}
            alt={data.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 flex gap-2">
            <Badge variant={data.status === 'Approved' ? 'default' : data.status === 'Rejected' ? 'destructive' : 'secondary'}>
              {data.status}
            </Badge>
            {!data.active && <Badge variant="outline" className="bg-background text-muted-foreground">Deactivated</Badge>}
          </div>
        </div>
      )}

      {/* Rejection / Suspension Reasons */}
      {data.status === 'Rejected' && data.rejectionReason && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
          <strong>Rejection Reason:</strong> {data.rejectionReason}
        </div>
      )}
      {data.status === 'Suspended' && data.suspensionReason && (
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500">
          <strong>Suspension Reason:</strong> {data.suspensionReason}
        </div>
      )}

      {/* Core Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 bg-background/50 space-y-2">
          <h3 className="font-semibold text-foreground border-b border-border pb-2">Venue Details</h3>
          <div className="grid grid-cols-2 gap-y-1">
            <span className="text-muted-foreground">Name:</span> <span>{data.name}</span>
            <span className="text-muted-foreground">Type:</span> <span>{data.venueType}</span>
            <span className="text-muted-foreground">Booking Type:</span> <span>{data.bookingType === 'fixedBooking' ? 'Fixed Slots' : 'Flexible Time'}</span>
            <span className="text-muted-foreground">Capacity:</span> <span>{data.capacity || 'N/A'} (Max: {data.maxCapacity})</span>
          </div>
        </Card>

        <Card className="p-4 bg-background/50 space-y-2">
          <h3 className="font-semibold text-foreground border-b border-border pb-2">Location</h3>
          <div className="grid grid-cols-2 gap-y-1">
            <span className="text-muted-foreground">City:</span> <span>{data.city}</span>
            <span className="text-muted-foreground">District:</span> <span>{data.district}</span>
            <span className="text-muted-foreground">Address:</span> <span className="truncate" title={data.address}>{data.address}</span>
            <span className="text-muted-foreground">Pincode:</span> <span>{data.pincode}</span>
          </div>
        </Card>
      </div>

      {/* Pricing & Amenities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 bg-background/50 space-y-2">
          <h3 className="font-semibold text-foreground border-b border-border pb-2">Pricing Structure</h3>
          {data.pricing && (
            <div className="space-y-1">
              <div className="grid grid-cols-2 gap-y-1">
                <span className="text-muted-foreground">Type:</span> <span className="capitalize">{data.pricing.pricingType}</span>
                <span className="text-muted-foreground">Base Price:</span> <span>₹{data.pricing.basePrice}</span>
              </div>
              {data.pricing.pricingRules?.length > 0 && (
                <div className="mt-2 text-xs">
                  <span className="text-muted-foreground block mb-1">Time-based Rules:</span>
                  <ul className="list-disc list-inside space-y-1">
                                        {data.pricing.pricingRules.map((rule: { fromTime: string; toTime: string; price: number }, i: number) => (
                      <li key={i}>{rule.fromTime} - {rule.toTime}: ₹{rule.price}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {data.fixedPackages?.length > 0 && (
            <div className="space-y-1">
              <span className="text-muted-foreground block mb-1">Packages:</span>
              <ul className="list-disc list-inside space-y-1 text-xs">
                                {data.fixedPackages.map((pkg: { name: string; startTime: string; endTime: string; price: number }, i: number) => (
                  <li key={i}>{pkg.name} ({pkg.startTime}-{pkg.endTime}): ₹{pkg.price}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <Card className="p-4 bg-background/50 space-y-2">
          <h3 className="font-semibold text-foreground border-b border-border pb-2">Amenities</h3>
          <div className="flex flex-wrap gap-2">
            {data.amenities?.map((am: string, i: number) => (
              <Badge key={i} variant="secondary" className="bg-primary/10 hover:bg-primary/20 text-primary border-none">
                {am}
              </Badge>
            ))}
            {!data.amenities?.length && <span className="text-muted-foreground">No amenities listed</span>}
          </div>
        </Card>
      </div>

      {/* Description & Contact */}
      <Card className="p-4 bg-background/50 space-y-2">
        <h3 className="font-semibold text-foreground border-b border-border pb-2">Description & Contact</h3>
        <p className="text-muted-foreground break-words">{data.description}</p>
        {data.contact && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4 pt-4 border-t border-border">
            <div>
              <span className="text-muted-foreground text-xs block">Contact Name</span>
              <span>{data.contact.name}</span>
            </div>
            <div>
              <span className="text-muted-foreground text-xs block">Email</span>
              <span>{data.contact.email}</span>
            </div>
            <div>
              <span className="text-muted-foreground text-xs block">Phone</span>
              <span>{data.contact.phone}</span>
            </div>
          </div>
        )}
      </Card>

      <div className="text-xs text-muted-foreground text-right">
        Created on: {data.createdAt ? new Date(data.createdAt).toLocaleString() : 'N/A'}
      </div>
    </div>
  );
}
