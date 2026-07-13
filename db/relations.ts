import { relations } from "drizzle-orm";
import {
  users,
  profiles,
  businessDocuments,
  hotels,
  hotelPhotos,
  hotelAmenities,
  roomTypes,
  bookings,
  payments,
  invoices,
  invoiceItems,
  hotelClaims,
  notifications,
  countries,
  wilayas,
  amenities,
} from "./schema";

export const usersRelations = relations(users, ({ one }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.id],
  }),
}));

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user: one(users, {
    fields: [profiles.id],
    references: [users.id],
  }),
  wilaya: one(wilayas, {
    fields: [profiles.wilayaCode],
    references: [wilayas.code],
  }),
  country: one(countries, {
    fields: [profiles.countryCode],
    references: [countries.code],
  }),
  documents: many(businessDocuments),
  bookingsAsAgency: many(bookings, { relationName: "agencyBookings" }),
  hotel: one(hotels, {
    fields: [profiles.id],
    references: [hotels.ownerProfileId],
  }),
  notifications: many(notifications),
}));

export const businessDocumentsRelations = relations(businessDocuments, ({ one }) => ({
  profile: one(profiles, {
    fields: [businessDocuments.profileId],
    references: [profiles.id],
  }),
}));

export const countriesRelations = relations(countries, ({ many }) => ({
  regions: many(wilayas),
  profiles: many(profiles),
  hotels: many(hotels),
}));

export const wilayasRelations = relations(wilayas, ({ one, many }) => ({
  country: one(countries, {
    fields: [wilayas.countryCode],
    references: [countries.code],
  }),
  profiles: many(profiles),
  hotels: many(hotels),
}));

export const amenitiesRelations = relations(amenities, ({ many }) => ({
  hotelAmenities: many(hotelAmenities),
}));

export const hotelsRelations = relations(hotels, ({ one, many }) => ({
  owner: one(profiles, {
    fields: [hotels.ownerProfileId],
    references: [profiles.id],
  }),
  wilaya: one(wilayas, {
    fields: [hotels.wilayaCode],
    references: [wilayas.code],
  }),
  country: one(countries, {
    fields: [hotels.countryCode],
    references: [countries.code],
  }),
  photos: many(hotelPhotos),
  amenities: many(hotelAmenities),
  rooms: many(roomTypes),
  bookings: many(bookings),
  invoices: many(invoices),
}));

export const hotelPhotosRelations = relations(hotelPhotos, ({ one }) => ({
  hotel: one(hotels, {
    fields: [hotelPhotos.hotelId],
    references: [hotels.id],
  }),
}));

export const hotelAmenitiesRelations = relations(hotelAmenities, ({ one }) => ({
  hotel: one(hotels, {
    fields: [hotelAmenities.hotelId],
    references: [hotels.id],
  }),
  amenity: one(amenities, {
    fields: [hotelAmenities.amenityId],
    references: [amenities.id],
  }),
}));

export const roomTypesRelations = relations(roomTypes, ({ one, many }) => ({
  hotel: one(hotels, {
    fields: [roomTypes.hotelId],
    references: [hotels.id],
  }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  agency: one(profiles, {
    fields: [bookings.agencyId],
    references: [profiles.id],
    relationName: "agencyBookings",
  }),
  hotel: one(hotels, {
    fields: [bookings.hotelId],
    references: [hotels.id],
  }),
  roomType: one(roomTypes, {
    fields: [bookings.roomTypeId],
    references: [roomTypes.id],
  }),
  payments: many(payments),
  invoice: one(invoices, {
    fields: [bookings.invoiceId],
    references: [invoices.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, {
    fields: [payments.bookingId],
    references: [bookings.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  hotel: one(hotels, {
    fields: [invoices.hotelId],
    references: [hotels.id],
  }),
  items: many(invoiceItems),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  booking: one(bookings, {
    fields: [invoiceItems.bookingId],
    references: [bookings.id],
  }),
}));

export const hotelClaimsRelations = relations(hotelClaims, ({ one }) => ({
  claimant: one(profiles, {
    fields: [hotelClaims.claimantProfileId],
    references: [profiles.id],
  }),
  seededHotel: one(hotels, {
    fields: [hotelClaims.seededHotelId],
    references: [hotels.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(profiles, {
    fields: [notifications.userId],
    references: [profiles.id],
  }),
}));
