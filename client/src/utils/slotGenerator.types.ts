/**
 * Type definitions for the slot generation system
 */

/**
 * Represents a preview slot in the slot generation system
 */
export interface PreviewSlot {
  id: string;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  name?: string;
  price: number;
  isAvailable: boolean;
  reason?: string;
}

/**
 * Represents a fixed package for venue booking
 */
export interface FixedPackage {
  slotName: string;
  startTime: string;
  endTime: string;
  price: string;
}

/**
 * Represents a pricing rule based on time of day
 */
export interface PricingRule {
  fromTime: string;
  toTime: string;
  price: string;
}

/**
 * Represents a blocked time period when venue is unavailable
 */
export interface BlockedTime {
  fromTime: string;
  toTime: string;
}

/**
 * Represents working hours for venue operation
 */
export interface WorkingHours {
  open: string;
  close: string;
}

/**
 * Configuration for slot generation based on booking type
 */
export interface SlotConfig {
  bookingType: 'fixedBooking' | 'flexibleBooking';
  workingDays: string[];
  workingHours?: WorkingHours;
  fixedPackages?: FixedPackage[];
  slotDuration?: string;
  pricingRules?: PricingRule[];
  blockedTimes?: BlockedTime[];
  samePrice?: string;
}
