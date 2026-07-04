import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  int,
  bigint,
  decimal,
  boolean,
  json,
  date,
  uniqueIndex,
  index,
  primaryKey,
} from "drizzle-orm/mysql-core";

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

// ── Users (OAuth-linked) ────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", userRoleEnum).default("agency").notNull(),
  status: mysqlEnum("status", accountStatusEnum).default("awaiting_review").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

// ── Profiles (extended user data) ──────────────────────────────────
export const profiles = mysqlTable("profiles", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  legalName: varchar("legal_name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  wilayaCode: int("wilaya_code"),
  taxId: varchar("tax_id", { length: 100 }),
  licenseNumber: varchar("license_number", { length: 100 }),
  preferredLocale: varchar("preferred_locale", { length: 2 }).default("fr").notNull(),
  rejectionReason: text("rejection_reason"),
  reviewedBy: bigint("reviewed_by", { mode: "number", unsigned: true }),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

// ── Business Documents ─────────────────────────────────────────────
export const businessDocuments = mysqlTable("business_documents", {
  id: serial("id").primaryKey(),
  profileId: bigint("profile_id", { mode: "number", unsigned: true }).notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", docTypeEnum).notNull(),
  storagePath: text("storage_path").notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// ── Wilayas (Algerian provinces) ───────────────────────────────────
export const wilayas = mysqlTable("wilayas", {
  code: int("code").primaryKey(),
  nameFr: varchar("name_fr", { length: 100 }).notNull(),
  nameAr: varchar("name_ar", { length: 100 }).notNull(),
  nameEn: varchar("name_en", { length: 100 }).notNull(),
  lat: decimal("lat", { precision: 10, scale: 6 }),
  lng: decimal("lng", { precision: 10, scale: 6 }),
});

// ── Amenities ──────────────────────────────────────────────────────
export const amenities = mysqlTable("amenities", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 50 }).notNull().unique(),
  lucideIcon: varchar("lucide_icon", { length: 50 }).notNull(),
  labelAr: varchar("label_ar", { length: 100 }).notNull(),
  labelFr: varchar("label_fr", { length: 100 }).notNull(),
  labelEn: varchar("label_en", { length: 100 }).notNull(),
});

// ── Platform Settings ──────────────────────────────────────────────
export const platformSettings = mysqlTable("platform_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: varchar("value", { length: 255 }).notNull(),
});

// ── Hotels ─────────────────────────────────────────────────────────
export const hotels = mysqlTable("hotels", {
  id: serial("id").primaryKey(),
  ownerProfileId: bigint("owner_profile_id", { mode: "number", unsigned: true }),
  isSeeded: boolean("is_seeded").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  wilayaCode: int("wilaya_code").notNull(),
  address: text("address"),
  starRating: int("star_rating"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  websiteUrl: text("website_url"),
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  googleMapsUrl: text("google_maps_url"),
  googlePlaceId: varchar("google_place_id", { length: 255 }).unique(),
  lat: decimal("lat", { precision: 10, scale: 6 }),
  lng: decimal("lng", { precision: 10, scale: 6 }),
  offlinePaymentWindowHours: int("offline_payment_window_hours").default(48).notNull(),
  replacedSeededId: bigint("replaced_seeded_id", { mode: "number", unsigned: true }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("one_hotel_per_owner").on(table.ownerProfileId),
]);

// ── Hotel Photos ───────────────────────────────────────────────────
export const hotelPhotos = mysqlTable("hotel_photos", {
  id: serial("id").primaryKey(),
  hotelId: bigint("hotel_id", { mode: "number", unsigned: true }).notNull()
    .references(() => hotels.id, { onDelete: "cascade" }),
  storagePath: text("storage_path").notNull(),
  sortOrder: int("sort_order").default(0).notNull(),
});

// ── Hotel Amenities (junction) ─────────────────────────────────────
export const hotelAmenities = mysqlTable("hotel_amenities", {
  hotelId: bigint("hotel_id", { mode: "number", unsigned: true }).notNull()
    .references(() => hotels.id, { onDelete: "cascade" }),
  amenityId: bigint("amenity_id", { mode: "number", unsigned: true }).notNull()
    .references(() => amenities.id, { onDelete: "cascade" }),
}, (table) => [
  primaryKey({ columns: [table.hotelId, table.amenityId] }),
]);

// ── Room Types ─────────────────────────────────────────────────────
export const roomTypes = mysqlTable("room_types", {
  id: serial("id").primaryKey(),
  hotelId: bigint("hotel_id", { mode: "number", unsigned: true }).notNull()
    .references(() => hotels.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  totalCapacity: int("total_capacity").notNull(),
  availableCount: int("available_count").notNull(),
  b2bRate: decimal("b2b_rate", { precision: 12, scale: 2 }).notNull(),
  thumbnailPath: text("thumbnail_path"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

// ── Bookings ───────────────────────────────────────────────────────
export const bookings = mysqlTable("bookings", {
  id: serial("id").primaryKey(),
  reference: varchar("reference", { length: 50 }).notNull(),
  agencyId: bigint("agency_id", { mode: "number", unsigned: true }).notNull()
    .references(() => profiles.id),
  hotelId: bigint("hotel_id", { mode: "number", unsigned: true }).notNull()
    .references(() => hotels.id),
  roomTypeId: bigint("room_type_id", { mode: "number", unsigned: true }).notNull()
    .references(() => roomTypes.id),
  roomNameSnapshot: varchar("room_name_snapshot", { length: 100 }).notNull(),
  nightlyRateSnapshot: decimal("nightly_rate_snapshot", { precision: 12, scale: 2 }).notNull(),
  roomsCount: int("rooms_count").notNull(),
  checkIn: date("check_in").notNull(),
  checkOut: date("check_out").notNull(),
  nights: int("nights").notNull(),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(),
  commissionAmount: decimal("commission_amount", { precision: 12, scale: 2 }),
  paymentMethod: mysqlEnum("payment_method", paymentMethodEnum).notNull(),
  status: mysqlEnum("status", bookingStatusEnum).notNull(),
  rejectionReason: text("rejection_reason"),
  hotelDeadline: timestamp("hotel_deadline"),
  paymentDeadline: timestamp("payment_deadline"),
  confirmedAt: timestamp("confirmed_at"),
  receivedConfirmedAt: timestamp("received_confirmed_at"),
  voucherPath: text("voucher_path"),
  archivedByAgency: boolean("archived_by_agency").default(false).notNull(),
  invoiceId: bigint("invoice_id", { mode: "number", unsigned: true })
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
export const payments = mysqlTable("payments", {
  id: serial("id").primaryKey(),
  bookingId: bigint("booking_id", { mode: "number", unsigned: true }).notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 50 }).default("chargily").notNull(),
  method: mysqlEnum("method", paymentMethodEnum).notNull(),
  checkoutId: varchar("checkout_id", { length: 255 }).unique(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("status", paymentStatusEnum).default("initiated").notNull(),
  raw: json("raw"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Invoices ───────────────────────────────────────────────────────
export const invoices = mysqlTable("invoices", {
  id: serial("id").primaryKey(),
  hotelId: bigint("hotel_id", { mode: "number", unsigned: true }).notNull()
    .references(() => hotels.id),
  periodYear: int("period_year").notNull(),
  periodMonth: int("period_month").notNull(),
  bookingsTotal: decimal("bookings_total", { precision: 14, scale: 2 }).notNull(),
  commissionDue: decimal("commission_due", { precision: 14, scale: 2 }).notNull(),
  status: mysqlEnum("status", invoiceStatusEnum).default("unpaid").notNull(),
  pdfPath: text("pdf_path"),
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
  dueDate: date("due_date").notNull(),
  paidAt: timestamp("paid_at"),
  paymentReference: varchar("payment_reference", { length: 255 }),
}, (table) => [
  uniqueIndex("idx_invoices_hotel_period").on(table.hotelId, table.periodYear, table.periodMonth),
]);

// ── Invoice Items ──────────────────────────────────────────────────
export const invoiceItems = mysqlTable("invoice_items", {
  invoiceId: bigint("invoice_id", { mode: "number", unsigned: true }).notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  bookingId: bigint("booking_id", { mode: "number", unsigned: true }).notNull()
    .references(() => bookings.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  commission: decimal("commission", { precision: 12, scale: 2 }).notNull(),
}, (table) => [
  primaryKey({ columns: [table.invoiceId, table.bookingId] }),
]);

// ── Hotel Claims ───────────────────────────────────────────────────
export const hotelClaims = mysqlTable("hotel_claims", {
  id: serial("id").primaryKey(),
  claimantProfileId: bigint("claimant_profile_id", { mode: "number", unsigned: true }).notNull()
    .references(() => profiles.id),
  seededHotelId: bigint("seeded_hotel_id", { mode: "number", unsigned: true }).notNull()
    .references(() => hotels.id),
  status: mysqlEnum("status", claimStatusEnum).default("pending").notNull(),
  decidedBy: bigint("decided_by", { mode: "number", unsigned: true })
    .references(() => profiles.id),
  decidedAt: timestamp("decided_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("idx_claims_unique").on(table.claimantProfileId, table.seededHotelId),
]);

// ── Notifications ──────────────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(),
  data: json("data").notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_notifications_user").on(table.userId, table.createdAt),
]);

// ── Audit Logs ─────────────────────────────────────────────────────
export const auditLogs = mysqlTable("audit_logs", {
  id: serial("id").primaryKey(),
  actorId: bigint("actor_id", { mode: "number", unsigned: true })
    .references(() => profiles.id),
  action: varchar("action", { length: 100 }).notNull(),
  targetType: varchar("target_type", { length: 50 }),
  targetId: varchar("target_id", { length: 100 }),
  meta: json("meta"),
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
