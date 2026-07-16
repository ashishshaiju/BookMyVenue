export interface User {
  [key: string]: unknown;
  _id: string;
  username: string;
  email: string;
  status: "active" | "suspended" | "banned";
  createdAt: string;
}

export interface Owner {
  [key: string]: unknown;
  _id: string;
  username: string;
  email: string;
  status: "active" | "suspended" | "banned";
  venuesCount: number;
  createdAt: string;
}

export interface Admin {
  [key: string]: unknown;
  _id: string;
  username: string;
  email: string;
  role: "admin" | "superAdmin";
  createdAt: string;
}

export interface Venue {
  [key: string]: unknown;
  _id: string;
  name: string;
  category: string;
  capacity: number;
  pricePerHour: number;
  status: "draft" | "pending" | "active" | "rejected" | "deactivated";
  address: {
    city: string;
    state: string;
  };
  ownerId: {
    username: string;
    email: string;
  };
  rating?: number;
  createdAt: string;
}

export interface MyVenue {
  [key: string]: unknown;
  _id: string;
  name: string;
  status: "active" | "pending" | "rejected" | "deactivated" | "draft";
  category: string;
  rating?: number;
  totalBookings?: number;
}

export interface Booking {
  [key: string]: unknown;
  _id: string;
  bookingRefId: string;
  venueId: { name: string; _id: string };
  date: string;
  startTime: number;
  endTime: number;
  status: "pending" | "confirmed" | "cancelled";
  totalPrice: number;
  createdAt: string;
  bookerName?: string;
  bookerPhone?: string;
}

export interface BookerInfo {
  name?: string;
  email?: string;
  phone?: string;
}

export interface Review {
  [key: string]: unknown;
  _id: string;
  userId: { username: string; email: string };
  rating: number;
  comment?: string;
  status: "visible" | "flagged" | "removed";
  hideRequestStatus: "none" | "pending" | "approved" | "rejected";
  ownerReply?: { text: string; repliedAt: string | Date };
  hideRequestReason?: string;
  createdAt: string;
}

export interface Log {
  [key: string]: unknown;
  _id: string;
  adminId: { username: string; email: string };
  action: string;
  targetModel: string;
  targetId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export interface BanRecord {
  [key: string]: unknown;
  _id: string;
  scope: string;
  reason: string;
  status: string;
  expiresAt: string | null;
  createdAt: string;
}

export interface MonthData {
  month: string;
  revenue: number;
  bookings: number;
}

export interface BlockedDate {
  dateObj: Date;
  isPast: boolean;
  date: string;
  venueId: string;
}
