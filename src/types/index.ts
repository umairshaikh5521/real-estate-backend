import { Context } from "hono";

// Extend Hono context with custom variables
export interface AppContext extends Context {
  Variables: {
    user?: {
      id: string;
      email: string;
      role: UserRole;
      emailVerified: boolean;
    };
  };
}

// User roles enum
export enum UserRole {
  ADMIN = "admin",
  BUILDER = "builder",
  CHANNEL_PARTNER = "channel_partner",
  CUSTOMER = "customer",
}

// Common status enums
export enum LeadStatus {
  NEW = "new",
  CONTACTED = "contacted",
  QUALIFIED = "qualified",
  PROPOSAL = "proposal",
  NEGOTIATION = "negotiation",
  CONVERTED = "converted",
  LOST = "lost",
}

export enum BookingStatus {
  BOOKED = "booked",
  PAYMENT_PENDING = "payment_pending",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum ProjectStatus {
  PLANNING = "planning",
  ACTIVE = "active",
  SOLD_OUT = "sold_out",
  COMPLETED = "completed",
}

export enum UnitStatus {
  AVAILABLE = "available",
  BOOKED = "booked",
  SOLD = "sold",
}
