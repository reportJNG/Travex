import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  numeric,
  boolean,
  jsonb,
  date,
  uniqueIndex,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";

// ── Enums ───────────────────────────────────────────────────────────
export const userRoleEnum = ["agency", "hotel", "super_admin"] as const;
export const accountStatusEnum = ["awaiting_review", "approved", "rejected", "suspended"] as const;
export const docTypeEnum = ["commercial_registry", "tax_card", "tourism_license", "other"] as const;
export const bookingStatusEnum = [
  "pending_payment", "pending_hotel", "awaiting_offline_payment",
  "confirmed", "completed", "rejected", "expired", "cancelled"
] as const;
export const paymentMethodEnum = ["cib", "edahabia", "offline"] as const;
export const paymentStatusEnum = ["initiated", "paid", "failed", "refund_required", "refunded"] as const;
export const invoiceStatusEnum = ["unpaid", "paid", "overdue"] as const;
export const claimStatusEnum = ["pending", "approved", "rejected"] as const;

export const userRole = pgEnum("user_role", userRoleEnum);
export const accountStatus = pgEnum("account_status", accountStatusEnum);
export const docType = pgEnum("doc_type", docTypeEnum);
export const bookingStatus = pgEnum("booking_status", bookingStatusEnum);
export const paymentMethod = pgEnum("payment_method", paymentMethodEnum);
export const paymentStatus = pgEnum("payment_status", paymentStatusEnum);
export const invoiceStatus = pgEnum("invoice_status", invoiceStatusEnum);
export const claimStatus = pgEnum("claim_status", claimStatusEnum);

// ── Users  ────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  avatar: text("avatar"),
  role: userRole("role").default("agency").notNull(),
  status: accountStatus("status").default("awaiting_review").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

// ── Profiles (extended user data) ──────────────────────────────────
export const profiles = pgTable("profiles", {
  id: integer("id").primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  legalName: varchar("legal_name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  wilayaCode: integer("wilaya_code"),
  taxId: varchar("tax_id", { length: 100 }),
  licenseNumber: varchar("license_number", { length: 100 }),
  preferredLocale: varchar("preferred_locale", { length: 2 }).default("fr").notNull(),
  rejectionReason: text("rejection_reason"),
  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

// ── Business Documents ─────────────────────────────────────────────
export const businessDocuments = pgTable("business_documents", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  type: docType("type").notNull(),
  storagePath: text("storage_path").notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// ── Wilayas (Algerian provinces) ───────────────────────────────────
export const wilayas = pgTable("wilayas", {
  code: integer("code").primaryKey(),
  nameFr: varchar("name_fr", { length: 100 }).notNull(),
  nameAr: varchar("name_ar", { length: 100 }).notNull(),
  nameEn: varchar("name_en", { length: 100 }).notNull(),
  lat: numeric("lat", { precision: 10, scale: 6 }),
  lng: numeric("lng", { precision: 10, scale: 6 }),
});

// ── Amenities ──────────────────────────────────────────────────────
export const amenities = pgTable("amenities", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 50 }).notNull().unique(),
  lucideIcon: varchar("lucide_icon", { length: 50 }).notNull(),
  labelAr: varchar("label_ar", { length: 100 }).notNull(),
  labelFr: varchar("label_fr", { length: 100 }).notNull(),
  labelEn: varchar("label_en", { length: 100 }).notNull(),
});

// ── Platform Settings ──────────────────────────────────────────────
export const platformSettings = pgTable("platform_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: varchar("value", { length: 255 }).notNull(),
});

// ── Hotels ─────────────────────────────────────────────────────────
export const hotels = pgTable("hotels", {
  id: serial("id").primaryKey(),
  ownerProfileId: integer("owner_profile_id"),
  isSeeded: boolean("is_seeded").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  wilayaCode: integer("wilaya_code").notNull(),
  address: text("address"),
  starRating: integer("star_rating"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  websiteUrl: text("website_url"),
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  googleMapsUrl: text("google_maps_url"),
  googlePlaceId: varchar("google_place_id", { length: 255 }).unique(),
  lat: numeric("lat", { precision: 10, scale: 6 }),
  lng: numeric("lng", { precision: 10, scale: 6 }),
  offlinePaymentWindowHours: integer("offline_payment_window_hours").default(48).notNull(),
  replacedSeededId: integer("replaced_seeded_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("one_hotel_per_owner").on(table.ownerProfileId),
]);

// ── Hotel Photos ───────────────────────────────────────────────────
export const hotelPhotos = pgTable("hotel_photos", {
  id: serial("id").primaryKey(),
  hotelId: integer("hotel_id").notNull()
    .references(() => hotels.id, { onDelete: "cascade" }),
  storagePath: text("storage_path").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});

// ── Hotel Amenities (junction) ─────────────────────────────────────
export const hotelAmenities = pgTable("hotel_amenities", {
  hotelId: integer("hotel_id").notNull()
    .references(() => hotels.id, { onDelete: "cascade" }),
  amenityId: integer("amenity_id").notNull()
    .references(() => amenities.id, { onDelete: "cascade" }),
}, (table) => [
  primaryKey({ columns: [table.hotelId, table.amenityId] }),
]);

// ── Room Types ─────────────────────────────────────────────────────
export const roomTypes = pgTable("room_types", {
  id: serial("id").primaryKey(),
  hotelId: integer("hotel_id").notNull()
    .references(() => hotels.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  totalCapacity: integer("total_capacity").notNull(),
  availableCount: integer("available_count").notNull(),
  b2bRate: numeric("b2b_rate", { precision: 12, scale: 2 }).notNull(),
  thumbnailPath: text("thumbnail_path"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

// ── Bookings ───────────────────────────────────────────────────────
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  reference: varchar("reference", { length: 50 }).notNull(),
  agencyId: integer("agency_id").notNull()
    .references(() => profiles.id),
  hotelId: integer("hotel_id").notNull()
    .references(() => hotels.id),
  roomTypeId: integer("room_type_id").notNull()
    .references(() => roomTypes.id),
  roomNameSnapshot: varchar("room_name_snapshot", { length: 100 }).notNull(),
  nightlyRateSnapshot: numeric("nightly_rate_snapshot", { precision: 12, scale: 2 }).notNull(),
  roomsCount: integer("rooms_count").notNull(),
  checkIn: date("check_in").notNull(),
  checkOut: date("check_out").notNull(),
  nights: integer("nights").notNull(),
  totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
  commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }).notNull(),
  commissionAmount: numeric("commission_amount", { precision: 12, scale: 2 }),
  paymentMethod: paymentMethod("payment_method").notNull(),
  status: bookingStatus("status").notNull(),
  rejectionReason: text("rejection_reason"),
  hotelDeadline: timestamp("hotel_deadline"),
  paymentDeadline: timestamp("payment_deadline"),
  confirmedAt: timestamp("confirmed_at"),
  receivedConfirmedAt: timestamp("received_confirmed_at"),
  voucherPath: text("voucher_path"),
  archivedByAgency: boolean("archived_by_agency").default(false).notNull(),
  invoiceId: integer("invoice_id")
    .references(() => invoices.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("idx_bookings_reference").on(table.reference),
  index("idx_bookings_agency").on(table.agencyId),
  index("idx_bookings_hotel_status").on(table.hotelId, table.status),
  index("idx_bookings_status_deadline").on(table.status, table.hotelDeadline),
  index("idx_bookings_status_payment").on(table.status, table.paymentDeadline),
]);

// ── Payments ───────────────────────────────────────────────────────
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 50 }).default("chargily").notNull(),
  method: paymentMethod("method").notNull(),
  checkoutId: varchar("checkout_id", { length: 255 }).unique(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  status: paymentStatus("status").default("initiated").notNull(),
  raw: jsonb("raw"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Invoices ───────────────────────────────────────────────────────
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  hotelId: integer("hotel_id").notNull()
    .references(() => hotels.id),
  periodYear: integer("period_year").notNull(),
  periodMonth: integer("period_month").notNull(),
  bookingsTotal: numeric("bookings_total", { precision: 14, scale: 2 }).notNull(),
  commissionDue: numeric("commission_due", { precision: 14, scale: 2 }).notNull(),
  status: invoiceStatus("status").default("unpaid").notNull(),
  pdfPath: text("pdf_path"),
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
  dueDate: date("due_date").notNull(),
  paidAt: timestamp("paid_at"),
  paymentReference: varchar("payment_reference", { length: 255 }),
}, (table) => [
  uniqueIndex("idx_invoices_hotel_period").on(table.hotelId, table.periodYear, table.periodMonth),
]);

// ── Invoice Items ──────────────────────────────────────────────────
export const invoiceItems = pgTable("invoice_items", {
  invoiceId: integer("invoice_id").notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  bookingId: integer("booking_id").notNull()
    .references(() => bookings.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  commission: numeric("commission", { precision: 12, scale: 2 }).notNull(),
}, (table) => [
  primaryKey({ columns: [table.invoiceId, table.bookingId] }),
]);

// ── Hotel Claims ───────────────────────────────────────────────────
export const hotelClaims = pgTable("hotel_claims", {
  id: serial("id").primaryKey(),
  claimantProfileId: integer("claimant_profile_id").notNull()
    .references(() => profiles.id),
  seededHotelId: integer("seeded_hotel_id").notNull()
    .references(() => hotels.id),
  status: claimStatus("status").default("pending").notNull(),
  decidedBy: integer("decided_by")
    .references(() => profiles.id),
  decidedAt: timestamp("decided_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("idx_claims_unique").on(table.claimantProfileId, table.seededHotelId),
]);

// ── Notifications ──────────────────────────────────────────────────
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(),
  data: jsonb("data").notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_notifications_user").on(table.userId, table.createdAt),
]);

// ── Audit Logs ─────────────────────────────────────────────────────
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  actorId: integer("actor_id")
    .references(() => profiles.id),
  action: varchar("action", { length: 100 }).notNull(),
  targetType: varchar("target_type", { length: 50 }),
  targetId: varchar("target_id", { length: 100 }),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Type exports ───────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;
export type Hotel = typeof hotels.$inferSelect;
export type InsertHotel = typeof hotels.$inferInsert;
export type RoomType = typeof roomTypes.$inferSelect;
export type InsertRoomType = typeof roomTypes.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Wilaya = typeof wilayas.$inferSelect;
export type Amenity = typeof amenities.$inferSelect;
export type HotelClaim = typeof hotelClaims.$inferSelect;
export type BusinessDocument = typeof businessDocuments.$inferSelect;
export type PlatformSetting = typeof platformSettings.$inferSelect;
