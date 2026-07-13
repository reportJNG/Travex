import { getDb } from "../server/queries/connection";
import { countries, wilayas, amenities, platformSettings } from "./schema";
import { countryData, regionData } from "./geo-data";

const amenityData = [
  { key: "wifi", lucideIcon: "Wifi", labelAr: "واي فاي مجاني", labelFr: "Wi-Fi gratuit", labelEn: "Free Wi-Fi" },
  { key: "pool", lucideIcon: "Waves", labelAr: "مسبح", labelFr: "Piscine", labelEn: "Pool" },
  { key: "gym", lucideIcon: "Dumbbell", labelAr: "قاعة رياضة", labelFr: "Salle de sport", labelEn: "Gym" },
  { key: "restaurant", lucideIcon: "UtensilsCrossed", labelAr: "مطعم", labelFr: "Restaurant", labelEn: "Restaurant" },
  { key: "parking", lucideIcon: "SquareParking", labelAr: "موقف سيارات", labelFr: "Parking", labelEn: "Parking" },
  { key: "meeting_rooms", lucideIcon: "Presentation", labelAr: "قاعات اجتماعات", labelFr: "Salles de réunion", labelEn: "Meeting rooms" },
  { key: "spa", lucideIcon: "Sparkles", labelAr: "سبا", labelFr: "Spa", labelEn: "Spa" },
  { key: "beach", lucideIcon: "TreePalm", labelAr: "شاطئ", labelFr: "Plage", labelEn: "Beach" },
  { key: "shuttle", lucideIcon: "Bus", labelAr: "نقل المطار", labelFr: "Navette aéroport", labelEn: "Airport shuttle" },
  { key: "ac", lucideIcon: "AirVent", labelAr: "تكييف", labelFr: "Climatisation", labelEn: "Air conditioning" },
];

const settingsData = [
  { key: "commission_rate", value: "5.00" },
  { key: "invoice_due_day", value: "10" },
  { key: "review_sla_hours", value: "24" },
  { key: "default_payment_window_hours", value: "48" },
  { key: "max_rooms_per_request", value: "20" },
  { key: "min_checkin_notice_days", value: "1" },
];

async function seed() {
  const db = getDb();
  console.log("Seeding TRAVEX reference data...");

  // Seed countries
  console.log("Seeding countries...");
  for (const c of countryData) {
    await db.insert(countries).values(c).onConflictDoUpdate({
      target: countries.code,
      set: {
        iso3: c.iso3,
        nameFr: c.nameFr,
        nameAr: c.nameAr,
        nameEn: c.nameEn,
        currencyCode: c.currencyCode,
        phonePrefix: c.phonePrefix,
        defaultLocale: c.defaultLocale,
        isActive: c.isActive,
      },
    });
  }

  // Seed regions
  console.log("Seeding Algeria wilayas and Tunisia governorates...");
  for (const w of regionData) {
    await db.insert(wilayas).values(w).onConflictDoUpdate({
      target: wilayas.code,
      set: {
        countryCode: w.countryCode,
        regionType: w.regionType,
        nameFr: w.nameFr,
        nameAr: w.nameAr,
        nameEn: w.nameEn,
        lat: w.lat,
        lng: w.lng,
      },
    });
  }

  // Seed amenities
  console.log("Seeding amenities...");
  for (const a of amenityData) {
    await db.insert(amenities).values(a).onConflictDoUpdate({
      target: amenities.key,
      set: { labelAr: a.labelAr, labelFr: a.labelFr, labelEn: a.labelEn },
    });
  }

  // Seed platform settings
  console.log("Seeding platform settings...");
  for (const s of settingsData) {
    await db.insert(platformSettings).values(s).onConflictDoUpdate({
      target: platformSettings.key,
      set: { value: s.value },
    });
  }

  console.log("Seed complete!");
}

seed().catch(console.error);
