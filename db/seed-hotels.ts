import { getDb } from "../server/queries/connection";
import { hotels, roomTypes, hotelAmenities } from "./schema";

const demoHotels = [
  {
    name: "Hotel El Aurassi",
    description: "Luxury 5-star hotel in the heart of Algiers with panoramic Mediterranean views, multiple restaurants, and a full-service spa.",
    wilayaCode: 16,
    address: "2 Boulevard Mohamed VI, Alger Centre",
    starRating: 5,
    phone: "+21323848484",
    email: "reservations@elaurassi.com",
    websiteUrl: "https://www.elaurassi.com",
    lat: "36.7538",
    lng: "3.0588",
    amenities: [1, 3, 4, 5, 7, 10], // wifi, gym, restaurant, parking, spa, ac
    rooms: [
      { name: "Chambre Deluxe Single", totalCapacity: 10, b2bRate: 8500 },
      { name: "Chambre Deluxe Double", totalCapacity: 15, b2bRate: 12000 },
      { name: "Suite Junior", totalCapacity: 5, b2bRate: 18000 },
      { name: "Suite Présidentielle", totalCapacity: 2, b2bRate: 35000 },
    ],
  },
  {
    name: "Hotel Sofitel Algiers Hamma Garden",
    description: "French elegance meets Algerian hospitality. Lush garden setting near the Botanical Garden.",
    wilayaCode: 16,
    address: "Route de Ouled Fayet, Hamma",
    starRating: 5,
    phone: "+21321440440",
    email: "info@sofitel-algiers.com",
    websiteUrl: "https://www.sofitel-algiers.com",
    lat: "36.7450",
    lng: "3.0700",
    amenities: [1, 2, 3, 4, 5, 7, 10],
    rooms: [
      { name: "Luxury Room", totalCapacity: 20, b2bRate: 9500 },
      { name: "Prestige Suite", totalCapacity: 8, b2bRate: 15000 },
      { name: "Opera Suite", totalCapacity: 3, b2bRate: 22000 },
    ],
  },
  {
    name: "Hotel Continental",
    description: "Historic hotel in Oran with stunning sea views, located near the city center and main attractions.",
    wilayaCode: 31,
    address: "11 Boulevard Mohamed VI, Oran",
    starRating: 4,
    phone: "+21341423333",
    email: "contact@hotelcontinental.dz",
    websiteUrl: "https://www.hotelcontinental.dz",
    lat: "35.6971",
    lng: "-0.6308",
    amenities: [1, 4, 5, 10],
    rooms: [
      { name: "Standard Single", totalCapacity: 12, b2bRate: 4500 },
      { name: "Standard Double", totalCapacity: 18, b2bRate: 6500 },
      { name: "Sea View Double", totalCapacity: 10, b2bRate: 8500 },
    ],
  },
  {
    name: "Hotel Méridien Oran",
    description: "Modern luxury hotel with a private beach, multiple pools, and world-class conference facilities.",
    wilayaCode: 31,
    address: "Les Andalouses, Oran",
    starRating: 5,
    phone: "+21341412222",
    email: "reservations@meridien-oran.com",
    websiteUrl: "https://www.meridien-oran.com",
    lat: "35.7100",
    lng: "-0.6500",
    amenities: [1, 2, 3, 4, 5, 6, 7, 10],
    rooms: [
      { name: "Classic Room", totalCapacity: 30, b2bRate: 7500 },
      { name: "Deluxe Sea View", totalCapacity: 15, b2bRate: 11000 },
      { name: "Executive Suite", totalCapacity: 5, b2bRate: 20000 },
    ],
  },
  {
    name: "Hotel Cirta Constantine",
    description: "Elegant hotel overlooking the dramatic gorges of Constantine. Perfect for cultural tourism.",
    wilayaCode: 25,
    address: "1 Rue des Frères Bouadou, Constantine",
    starRating: 4,
    phone: "+21331500000",
    email: "info@hotelcirta.dz",
    websiteUrl: "https://www.hotelcirta.dz",
    lat: "36.3650",
    lng: "6.6147",
    amenities: [1, 4, 5, 6, 10],
    rooms: [
      { name: "Standard", totalCapacity: 15, b2bRate: 4000 },
      { name: "Superior", totalCapacity: 10, b2bRate: 6000 },
      { name: "Suite", totalCapacity: 3, b2bRate: 10000 },
    ],
  },
  {
    name: "Hotel Sheraton Annaba",
    description: "Beachfront hotel in Annaba with modern amenities and easy access to historic sites.",
    wilayaCode: 23,
    address: "Route de Chétaïbi, Annaba",
    starRating: 5,
    phone: "+21338500000",
    email: "sheraton.annaba@sheraton.com",
    websiteUrl: "https://www.sheraton-annaba.com",
    lat: "36.9000",
    lng: "7.7667",
    amenities: [1, 2, 4, 5, 7, 8, 10],
    rooms: [
      { name: "Garden View", totalCapacity: 20, b2bRate: 8000 },
      { name: "Sea View", totalCapacity: 15, b2bRate: 10500 },
      { name: "Club Suite", totalCapacity: 5, b2bRate: 16000 },
    ],
  },
  {
    name: "Hotel Liberte Béjaïa",
    description: "Charming hotel in Béjaïa with Mediterranean views, perfect for exploring the Kabylie region.",
    wilayaCode: 6,
    address: "Route de Tichy, Béjaïa",
    starRating: 3,
    phone: "+21334321000",
    email: "contact@hotelliberte.dz",
    lat: "36.7517",
    lng: "5.0556",
    amenities: [1, 4, 5, 10],
    rooms: [
      { name: "Single", totalCapacity: 8, b2bRate: 3000 },
      { name: "Double", totalCapacity: 12, b2bRate: 4500 },
      { name: "Triple", totalCapacity: 6, b2bRate: 6000 },
    ],
  },
  {
    name: "Hotel Oasis Tamanrasset",
    description: "Comfortable base for exploring the Sahara desert and Hoggar mountains.",
    wilayaCode: 11,
    address: "Centre-ville, Tamanrasset",
    starRating: 3,
    phone: "+21329340000",
    email: "oasis@tamanrasset.dz",
    lat: "22.7850",
    lng: "5.5228",
    amenities: [1, 4, 5, 10],
    rooms: [
      { name: "Standard", totalCapacity: 10, b2bRate: 3500 },
      { name: "Double", totalCapacity: 8, b2bRate: 5000 },
    ],
  },
];

async function seedHotels() {
  const db = getDb();
  console.log("Seeding demo hotels...");

  for (const h of demoHotels) {
    // Check if hotel already exists
    const existing = await db.query.hotels.findFirst({
      where: (hotels, { eq }) => eq(hotels.name, h.name),
    });
    if (existing) {
      console.log(`  Skipping ${h.name} (already exists)`);
      continue;
    }

    const [createdHotel] = await db.insert(hotels).values({
      isSeeded: false,
      isActive: true,
      name: h.name,
      description: h.description,
      wilayaCode: h.wilayaCode,
      address: h.address,
      starRating: h.starRating,
      phone: h.phone,
      email: h.email,
      websiteUrl: h.websiteUrl,
      lat: h.lat,
      lng: h.lng,
    }).returning({ id: hotels.id });

    if (!createdHotel) {
      throw new Error(`Failed to create hotel: ${h.name}`);
    }
    const hotelId = createdHotel.id;

    // Add amenities
    for (const aid of h.amenities) {
      try {
        await db.insert(hotelAmenities).values({ hotelId, amenityId: aid });
      } catch {
        // ignore duplicate
      }
    }

    // Add rooms
    for (const room of h.rooms) {
      await db.insert(roomTypes).values({
        hotelId,
        name: room.name,
        totalCapacity: room.totalCapacity,
        availableCount: room.totalCapacity,
        b2bRate: String(room.b2bRate),
      });
    }

    console.log(`  Created ${h.name} with ${h.rooms.length} room types`);
  }

  console.log("Hotel seeding complete!");
}

seedHotels().catch(console.error);
