import { getDb } from "../server/queries/connection";
import { wilayas, amenities, platformSettings } from "./schema";

const wilayaData = [
  { code: 1, nameFr: "Adrar", nameAr: "أدرار", nameEn: "Adrar", lat: "27.9767", lng: "-0.2036" },
  { code: 2, nameFr: "Chlef", nameAr: "الشلف", nameEn: "Chlef", lat: "36.1647", lng: "1.3315" },
  { code: 3, nameFr: "Laghouat", nameAr: "الأغواط", nameEn: "Laghouat", lat: "33.8000", lng: "2.8833" },
  { code: 4, nameFr: "Oum El Bouaghi", nameAr: "أم البواقي", nameEn: "Oum El Bouaghi", lat: "35.8775", lng: "7.1136" },
  { code: 5, nameFr: "Batna", nameAr: "باتنة", nameEn: "Batna", lat: "35.5559", lng: "6.1744" },
  { code: 6, nameFr: "Béjaïa", nameAr: "بجاية", nameEn: "Bejaia", lat: "36.7517", lng: "5.0556" },
  { code: 7, nameFr: "Biskra", nameAr: "بسكرة", nameEn: "Biskra", lat: "34.8500", lng: "5.7333" },
  { code: 8, nameFr: "Béchar", nameAr: "بشار", nameEn: "Bechar", lat: "31.6167", lng: "-2.2167" },
  { code: 9, nameFr: "Blida", nameAr: "البليدة", nameEn: "Blida", lat: "36.4700", lng: "2.8333" },
  { code: 10, nameFr: "Bouira", nameAr: "البويرة", nameEn: "Bouira", lat: "36.3800", lng: "3.9000" },
  { code: 11, nameFr: "Tamanrasset", nameAr: "تمنراست", nameEn: "Tamanrasset", lat: "22.7850", lng: "5.5228" },
  { code: 12, nameFr: "Tébessa", nameAr: "تبسة", nameEn: "Tebessa", lat: "35.4000", lng: "8.1167" },
  { code: 13, nameFr: "Tlemcen", nameAr: "تلمسان", nameEn: "Tlemcen", lat: "34.8783", lng: "-1.3150" },
  { code: 14, nameFr: "Tiaret", nameAr: "تيارت", nameEn: "Tiaret", lat: "35.3667", lng: "1.3167" },
  { code: 15, nameFr: "Tizi Ouzou", nameAr: "تيزي وزو", nameEn: "Tizi Ouzou", lat: "36.7167", lng: "4.0500" },
  { code: 16, nameFr: "Alger", nameAr: "الجزائر", nameEn: "Algiers", lat: "36.7538", lng: "3.0588" },
  { code: 17, nameFr: "Djelfa", nameAr: "الجلفة", nameEn: "Djelfa", lat: "34.6667", lng: "3.2500" },
  { code: 18, nameFr: "Jijel", nameAr: "جيجل", nameEn: "Jijel", lat: "36.8167", lng: "5.7667" },
  { code: 19, nameFr: "Sétif", nameAr: "سطيف", nameEn: "Setif", lat: "36.1917", lng: "5.4139" },
  { code: 20, nameFr: "Saïda", nameAr: "سعيدة", nameEn: "Saida", lat: "34.8333", lng: "0.1500" },
  { code: 21, nameFr: "Skikda", nameAr: "سكيكدة", nameEn: "Skikda", lat: "36.8667", lng: "6.9000" },
  { code: 22, nameFr: "Sidi Bel Abbès", nameAr: "سيدي بلعباس", nameEn: "Sidi Bel Abbes", lat: "35.2000", lng: "-0.6333" },
  { code: 23, nameFr: "Annaba", nameAr: "عنابة", nameEn: "Annaba", lat: "36.9000", lng: "7.7667" },
  { code: 24, nameFr: "Guelma", nameAr: "قالمة", nameEn: "Guelma", lat: "36.4667", lng: "7.4333" },
  { code: 25, nameFr: "Constantine", nameAr: "قسنطينة", nameEn: "Constantine", lat: "36.3650", lng: "6.6147" },
  { code: 26, nameFr: "Médéa", nameAr: "المدية", nameEn: "Medea", lat: "36.2667", lng: "2.7500" },
  { code: 27, nameFr: "Mostaganem", nameAr: "مستغانم", nameEn: "Mostaganem", lat: "35.9333", lng: "0.0833" },
  { code: 28, nameFr: "M'Sila", nameAr: "المسيلة", nameEn: "MSila", lat: "35.7000", lng: "4.5333" },
  { code: 29, nameFr: "Mascara", nameAr: "معسكر", nameEn: "Mascara", lat: "35.4000", lng: "0.2000" },
  { code: 30, nameFr: "Ouargla", nameAr: "ورقلة", nameEn: "Ouargla", lat: "31.9500", lng: "5.3167" },
  { code: 31, nameFr: "Oran", nameAr: "وهران", nameEn: "Oran", lat: "35.6971", lng: "-0.6308" },
  { code: 32, nameFr: "El Bayadh", nameAr: "البيض", nameEn: "El Bayadh", lat: "33.6833", lng: "1.0167" },
  { code: 33, nameFr: "Illizi", nameAr: "إليزي", nameEn: "Illizi", lat: "26.4833", lng: "8.4667" },
  { code: 34, nameFr: "Bordj Bou Arréridj", nameAr: "برج بوعريريج", nameEn: "Bordj Bou Arreridj", lat: "36.0667", lng: "4.7667" },
  { code: 35, nameFr: "Boumerdès", nameAr: "بومرداس", nameEn: "Boumerdes", lat: "36.7667", lng: "3.4772" },
  { code: 36, nameFr: "El Tarf", nameAr: "الطارف", nameEn: "El Tarf", lat: "36.7672", lng: "8.3138" },
  { code: 37, nameFr: "Tindouf", nameAr: "تندوف", nameEn: "Tindouf", lat: "27.6753", lng: "-8.1286" },
  { code: 38, nameFr: "Tissemsilt", nameAr: "تيسمسيلت", nameEn: "Tissemsilt", lat: "35.6000", lng: "1.8167" },
  { code: 39, nameFr: "El Oued", nameAr: "الوادي", nameEn: "El Oued", lat: "33.3500", lng: "6.8500" },
  { code: 40, nameFr: "Khenchela", nameAr: "خنشلة", nameEn: "Khenchela", lat: "35.4333", lng: "7.1433" },
  { code: 41, nameFr: "Souk Ahras", nameAr: "سوق أهراس", nameEn: "Souk Ahras", lat: "36.2833", lng: "7.9500" },
  { code: 42, nameFr: "Tipaza", nameAr: "تيبازة", nameEn: "Tipaza", lat: "36.5833", lng: "2.4500" },
  { code: 43, nameFr: "Mila", nameAr: "ميلة", nameEn: "Mila", lat: "36.4500", lng: "6.2500" },
  { code: 44, nameFr: "Aïn Defla", nameAr: "عين الدفلى", nameEn: "Ain Defla", lat: "36.2667", lng: "1.9667" },
  { code: 45, nameFr: "Naâma", nameAr: "النعامة", nameEn: "Naama", lat: "33.2667", lng: "-0.3167" },
  { code: 46, nameFr: "Aïn Témouchent", nameAr: "عين تموشنت", nameEn: "Ain Temouchent", lat: "35.3000", lng: "-1.1333" },
  { code: 47, nameFr: "Ghardaïa", nameAr: "غرداية", nameEn: "Ghardaia", lat: "32.4833", lng: "3.6667" },
  { code: 48, nameFr: "Relizane", nameAr: "غليزان", nameEn: "Relizane", lat: "35.7333", lng: "0.5500" },
  { code: 49, nameFr: "Timimoun", nameAr: "تيميمون", nameEn: "Timimoun", lat: "29.2583", lng: "0.2306" },
  { code: 50, nameFr: "Bordj Badji Mokhtar", nameAr: "برج باجي مختار", nameEn: "Bordj Badji Mokhtar", lat: "21.3333", lng: "0.9500" },
  { code: 51, nameFr: "Ouled Djellal", nameAr: "أولاد جلال", nameEn: "Ouled Djellal", lat: "34.4333", lng: "5.0667" },
  { code: 52, nameFr: "Béni Abbès", nameAr: "بني عباس", nameEn: "Beni Abbes", lat: "30.1333", lng: "-2.1667" },
  { code: 53, nameFr: "In Salah", nameAr: "عين صالح", nameEn: "In Salah", lat: "27.2000", lng: "2.4833" },
  { code: 54, nameFr: "In Guezzam", nameAr: "عين قزام", nameEn: "In Guezzam", lat: "19.6500", lng: "5.7667" },
  { code: 55, nameFr: "Touggourt", nameAr: "تقرت", nameEn: "Touggourt", lat: "33.1000", lng: "6.0667" },
  { code: 56, nameFr: "Djanet", nameAr: "جانت", nameEn: "Djanet", lat: "24.5500", lng: "9.4833" },
  { code: 57, nameFr: "El M'Ghair", nameAr: "المغير", nameEn: "El M'Ghair", lat: "33.9500", lng: "5.9167" },
  { code: 58, nameFr: "El Meniaa", nameAr: "المنيعة", nameEn: "El Meniaa", lat: "30.5833", lng: "2.8833" },
];

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

  // Seed wilayas
  console.log("Seeding 58 wilayas...");
  for (const w of wilayaData) {
    await db.insert(wilayas).values(w).onConflictDoUpdate({
      target: wilayas.code,
      set: { nameFr: w.nameFr, nameAr: w.nameAr, nameEn: w.nameEn },
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
