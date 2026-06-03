import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { extendedActivities, extendedStays, extendedAttractions, extendedRestaurants } from "./extended_data";
import { activityImagePool, stayImagePool, attractionImagePool, restaurantImagePool } from "./image_pools";


const prisma = new PrismaClient();

// ─── Destinations ──────────────────────────────────────────────────────────────

const destinationImages: Record<string, string[]> = {
  // First URL = cover/hero; remainder = gallery slideshow
  "djerba": [
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200", // beach
    "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=1200", // island overview
    "https://images.unsplash.com/photo-1552083375-1447ce886485?w=1200",   // traditional architecture
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200", // landscape
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200", // crafts
  ],
  "hammamet": [
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200", // beach
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200", // sea
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200",   // coastal
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200",   // water
  ],
  "tunis": [
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200", // medina
    "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=1200", // souk
    "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1200", // architecture
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200", // streets
  ],
  "sousse": [
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200",   // coastline
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200", // beach
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200", // medina
  ],
  "mahdia": [
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200",   // fishing boats
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200", // sea
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200", // beach
  ],
  "tozeur": [
    "https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=1200", // desert dunes
    "https://images.unsplash.com/photo-1548430769-9fb29a9e7f76?w=1200",   // sahara
    "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1200",   // oasis
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200", // landscape
  ],
  "paris": [
    "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1200", // eiffel tower
    "https://images.unsplash.com/photo-1431274172761-fcdab704a114?w=1200", // seine
    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200", // louvre
    "https://images.unsplash.com/photo-1520939817895-060bdaf4fe1b?w=1200", // montmartre
    "https://images.unsplash.com/photo-1568797629192-789acf8e4df3?w=1200", // café
  ],
  "nice": [
    "https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=1200", // promenade
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200",   // coastline
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200", // beach
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200", // riviera
  ],
  "dubai": [
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200", // skyline
    "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1200",   // burj khalifa
    "https://images.unsplash.com/photo-1582266255765-fa5cf1a1d501?w=1200", // marina
    "https://images.unsplash.com/photo-1548430769-9fb29a9e7f76?w=1200",   // desert
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200", // luxury hotel
  ],
};

const attractionImages: Record<string, string[]> = {
  "guellala-museum": [
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200",
    "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=1200",
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200",
  ],
  "el-ghriba-synagogue": [
    "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1200",
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200",
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200",
  ],
  "djerba-heritage-village": [
    "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=1200",
    "https://images.unsplash.com/photo-1552083375-1447ce886485?w=1200",
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200",
  ],
  "beach-sidi-mahrez": [
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200",
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200",
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200",
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200",
  ],
  "houmt-souk-medina": [
    "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=1200",
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200",
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200",
  ],
  "flamingo-lake": [
    "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1200",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200",
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200",
  ],
};

const destinations = [
  {
    slug: "djerba",
    city: "Djerba",
    country: "Tunisia",
    region: "Médenine",
    featured: true,
    latitude: 33.8075,
    longitude: 11.0211,
    timezone: "Africa/Tunis",
    description:
      "A Mediterranean island with 3,000 years of history, pristine beaches, and vibrant culture. Home to ancient heritage sites, colorful markets, and crystal-clear waters.",
    arabicDescription:
      "جزيرة متوسطية بتاريخ يمتد 3000 عام وشواطئ رائعة وثقافة نابضة بالحياة. موطن مواقع التراث القديم والأسواق الملونة والمياه الفيروزية.",
  },
  {
    slug: "hammamet",
    city: "Hammamet",
    country: "Tunisia",
    region: "Nabeul",
    featured: true,
    description:
      "Tunisia's premier beach resort destination. Known for its beautiful sandy beaches, jasmine-scented medina, and world-class resorts along the Gulf of Hammamet.",
    arabicDescription:
      "وجهة منتجع الشاطئ الرائدة في تونس. تشتهر بشواطئها الرملية الجميلة ومدينتها العتيقة العطرة بالياسمين والمنتجعات العالمية.",
  },
  {
    slug: "tunis",
    city: "Tunis",
    country: "Tunisia",
    region: "Tunis",
    featured: true,
    latitude: 36.8065,
    longitude: 10.1815,
    timezone: "Africa/Tunis",
    description:
      "The vibrant capital of Tunisia, where ancient medina meets modern boulevards. Explore UNESCO-listed heritage, bustling souks, and a rich culinary scene.",
    arabicDescription:
      "العاصمة النابضة بالحياة لتونس، حيث تلتقي المدينة العتيقة القديمة بالشوارع الحديثة. استكشف التراث المدرج في قائمة اليونسكو والأسواق الصاخبة.",
  },
  {
    slug: "sousse",
    city: "Sousse",
    country: "Tunisia",
    region: "Sousse",
    featured: true,
    latitude: 35.8256,
    longitude: 10.6084,
    timezone: "Africa/Tunis",
    description:
      "The Pearl of the Sahel — a UNESCO-listed medina, long sandy beaches, and a lively marina. One of Tunisia's most vibrant coastal cities with rich Phoenician and Roman history.",
    arabicDescription:
      "لؤلؤة الساحل — مدينة عتيقة مدرجة في قائمة اليونسكو وشواطئ رملية طويلة ومارينا نابضة بالحياة. من أكثر المدن الساحلية التونسية حيوية بتاريخ فينيقي وروماني غني.",
  },
  {
    slug: "mahdia",
    city: "Mahdia",
    country: "Tunisia",
    region: "Mahdia",
    featured: true,
    latitude: 35.5042,
    longitude: 11.0622,
    timezone: "Africa/Tunis",
    description:
      "A hidden gem on Tunisia's eastern coast. Known for its unspoiled beaches, authentic fishing village charm, historic medina, and some of the country's finest seafood.",
    arabicDescription:
      "جوهرة خفية على الساحل الشرقي لتونس. تشتهر بشواطئها البكر وأجواء قرية الصيد الأصيلة ومدينتها العتيقة التاريخية وأجود المأكولات البحرية في البلاد.",
  },
  {
    slug: "tozeur",
    city: "Tozeur",
    country: "Tunisia",
    region: "Tozeur",
    featured: true,
    latitude: 33.9189,
    longitude: 8.1325,
    timezone: "Africa/Tunis",
    description:
      "Gateway to the Sahara. Ancient palm oases, dramatic salt lakes, Star Wars filming locations, and breathtaking desert landscapes make Tozeur an unforgettable adventure.",
    arabicDescription:
      "بوابة الصحراء. واحات نخيل قديمة وبحيرات ملحية خلابة ومواقع تصوير حرب النجوم ومناظر صحراوية خلابة تجعل توزر مغامرة لا تُنسى.",
  },
  {
    slug: "paris",
    city: "Paris",
    country: "France",
    region: "Île-de-France",
    featured: true,
    latitude: 48.8566,
    longitude: 2.3522,
    timezone: "Europe/Paris",
    description:
      "The City of Light — a timeless destination for art, fashion, gastronomy, and iconic landmarks. From the Eiffel Tower to Montmartre, Paris never stops inspiring.",
    arabicDescription:
      "مدينة النور — وجهة خالدة للفن والموضة وفن الطهو والمعالم الأيقونية. من برج إيفل إلى مونمارتر، باريس لا تتوقف عن إلهام الزوار.",
  },
  {
    slug: "nice",
    city: "Nice",
    country: "France",
    region: "Provence-Alpes-Côte d'Azur",
    featured: true,
    latitude: 43.7102,
    longitude: 7.262,
    timezone: "Europe/Paris",
    description:
      "The jewel of the French Riviera. Stunning azure coastline, elegant Belle Époque architecture, and a perfect blend of beach life and cultural richness.",
    arabicDescription:
      "جوهرة الريفييرا الفرنسية. ساحل أزرق مذهل ومعمار Belle Époque أنيق ومزيج مثالي من حياة الشاطئ والثراء الثقافي.",
  },
  {
    slug: "dubai",
    city: "Dubai",
    country: "UAE",
    region: "Dubai",
    featured: true,
    latitude: 25.2048,
    longitude: 55.2708,
    timezone: "Asia/Dubai",
    description:
      "A city of superlatives — the tallest buildings, most luxurious hotels, and a dizzying blend of futuristic architecture and Arabian heritage in the heart of the desert.",
    arabicDescription:
      "مدينة العجائب — أطول المباني وأفخم الفنادق ومزيج رائع من العمارة المستقبلية والتراث العربي في قلب الصحراء.",
  },
  {
    slug: "monastir",
    city: "Monastir",
    country: "Tunisia",
    region: "Monastir",
    featured: true,
    latitude: 35.7643,
    longitude: 10.8113,
    timezone: "Africa/Tunis",
    description: "A coastal city with a majestic Ribat and a rich history as the birthplace of modern Tunisia.",
    arabicDescription: "مدينة ساحلية برباط مهيب وتاريخ غني كمسقط رأس تونس الحديثة.",
  },
  {
    slug: "kairouan",
    city: "Kairouan",
    country: "Tunisia",
    region: "Kairouan",
    featured: true,
    latitude: 35.6781,
    longitude: 10.0963,
    timezone: "Africa/Tunis",
    description: "The spiritual capital of Tunisia, home to the Great Mosque and famous for its carpets and pastries.",
    arabicDescription: "العاصمة الروحية لتونس، موطن الجامع الكبير ومشهورة بزرابيها وحلوياتها.",
  },
  {
    slug: "tabarka",
    city: "Tabarka",
    country: "Tunisia",
    region: "Jendouba",
    featured: true,
    latitude: 36.9531,
    longitude: 8.7561,
    timezone: "Africa/Tunis",
    description: "Where the mountains meet the sea. Famous for coral diving, jazz festivals, and lush greenery.",
    arabicDescription: "حيث تلتقي الجبال بالبحر. مشهورة بصيد المرجان ومهرجانات الجاز والخضرة الوافرة.",
  },
  {
    slug: "bizerte",
    city: "Bizerte",
    country: "Tunisia",
    region: "Bizerte",
    featured: true,
    latitude: 37.2744,
    longitude: 9.8739,
    timezone: "Africa/Tunis",
    description: "The northernmost city in Africa, featuring a charming old port and pristine Mediterranean coastline.",
    arabicDescription: "أقصى مدينة في شمال أفريقيا، تتميز بميناء قديم ساحر وساحل متوسطي بكر.",
  },
  {
    slug: "douz",
    city: "Douz",
    country: "Tunisia",
    region: "Kebili",
    featured: true,
    latitude: 33.4667,
    longitude: 9.0167,
    timezone: "Africa/Tunis",
    description: "The ultimate gateway to the Sahara. Famous for its dunes and the International Festival of the Sahara.",
    arabicDescription: "البوابة النهائية للصحراء الكبرى. مشهورة بكثبانها الرملية والمهرجان الدولي للصحراء.",
  },
  {
    slug: "tataouine",
    city: "Tataouine",
    country: "Tunisia",
    region: "Tataouine",
    featured: true,
    description: "Famous for its unique Ksours (fortified granaries) and as a major Star Wars filming location.",
    arabicDescription: "مشهورة بقصورها الفريدة ومواقع تصوير حرب النجوم العالمية.",
  }
];


// ─── Demo user + business profiles ─────────────────────────────────────────────

const DEMO_USER_DJERBA_ID = "seed-demo-partner-djerba";
const DEMO_USER_DUBAI_ID = "seed-demo-partner-dubai";
const DJERBA_PROFILE_ID = "seed-profile-djerba-001";
const DUBAI_PROFILE_ID = "seed-profile-dubai-001";

// Demo customer users (reviewers)
const CUSTOMER_IDS = {
  sarah:   "seed-customer-sarah",
  marco:   "seed-customer-marco",
  amir:    "seed-customer-amir",
  emma:    "seed-customer-emma",
  youssef: "seed-customer-youssef",
};

const demoCustomers = [
  { id: CUSTOMER_IDS.sarah,   name: "Sarah Johnson", email: "sarah@guidni.demo" },
  { id: CUSTOMER_IDS.marco,   name: "Marco Rossi",   email: "marco@guidni.demo" },
  { id: CUSTOMER_IDS.amir,    name: "Amir Hassan",   email: "amir@guidni.demo" },
  { id: CUSTOMER_IDS.emma,    name: "Emma Wilson",   email: "emma@guidni.demo" },
  { id: CUSTOMER_IDS.youssef, name: "Youssef Benali",email: "youssef@guidni.demo" },
];

// ─── Activities ─────────────────────────────────────────────────────────────────

const activityImages: Record<string, string[]> = {
  "djerba-camel-ride-beach": [
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200",
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200",
  ],
  "djerba-island-discovery-tour": [
    "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=1200",
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200",
    "https://images.unsplash.com/photo-1552083375-1447ce886485?w=1200",
    "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1200",
  ],
  "djerba-pirate-boat-trip": [
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200",
  ],
  "dubai-desert-safari-4x4": [
    "https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=1200",
    "https://images.unsplash.com/photo-1548430769-9fb29a9e7f76?w=1200",
    "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1200",
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200",
  ],
  "dubai-burj-khalifa-sky-experience": [
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200",
    "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1200",
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200",
  ],
  "dubai-dhow-cruise-marina": [
    "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1200",
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200",
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200",
  ],
};

const stayImages: Record<string, string[]> = {
  "djerba-beachfront-villa": [
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200",
    "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200",
    "https://images.unsplash.com/photo-1540541338537-41369657e8e4?w=1200",
    "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1200",
    "https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=1200",
  ],
  "djerba-traditional-dar": [
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200",
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200",
    "https://images.unsplash.com/photo-1587381420270-3e1a5b9e6904?w=1200",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200",
  ],
  "djerba-sea-view-apartment": [
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200",
  ],
  "dubai-palm-luxury-villa": [
    "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200",
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200",
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200",
    "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1200",
  ],
  "dubai-downtown-hotel-suite": [
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200",
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200",
    "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200",
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200",
  ],
  "dubai-marina-apartment": [
    "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1200",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200",
  ],
};

const restaurantImages: Record<string, string[]> = {
  "dar-houmt-souk": [
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200",
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200",
    "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=1200",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200",
  ],
  "la-plage-cafe-djerba": [
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200",
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200",
  ],
  "le-berbere-djerba": [
    "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=1200",
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200",
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200",
  ],
  "the-spice-route-dubai": [
    "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=1200",
    "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=1200",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200",
  ],
  "marina-cafe-lounge-dubai": [
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200",
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200",
    "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=1200",
  ],
  "al-fanar-dubai": [
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200",
    "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=1200",
    "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=1200",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200",
  ],
};

const rentalImages: Record<string, string[]> = {
  "toyota-corolla-djerba": [
    "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200",
    "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200",
  ],
  "scooter-50cc-djerba": [
    "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1200",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200",
  ],
  "fishing-boat-djerba": [
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200",
  ],
  "bmw-5-series-dubai": [
    "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200",
    "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200",
  ],
  "electric-bike-dubai-marina": [
    "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=1200",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200",
  ],
  "speedboat-dubai-marina": [
    "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=1200",
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200",
    "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1200",
  ],
};

const transferImages: Record<string, string[]> = {
  "djerba-airport-transfer": [
    "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200",
  ],
  "djerba-city-taxi": [
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200",
    "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200",
  ],
  "djerba-private-chauffeur": [
    "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200",
    "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200",
    "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200",
  ],
  "djerba-shuttle-service": [
    "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200",
    "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200",
  ],
};

const djerbaActivities = [
  {
    slug: "djerba-camel-ride-beach",
    title: "Camel Ride on Djerba Beach",
    arabicTitle: "ركوب الجمال على شاطئ جربة",
    description:
      "Experience the magic of Djerba from the back of a camel as you ride along the golden shores. Our experienced guides lead you through scenic coastal paths, offering stunning views of the Mediterranean and the island's iconic palm groves. Perfect for families and first-time riders.",
    arabicDescription:
      "اختبر سحر جربة من فوق ظهر جمل وأنت تتجول على طول الشواطئ الذهبية. يقودك مرشدونا ذوو الخبرة عبر مسارات ساحلية خلابة توفر مناظر بديعة للبحر المتوسط وبساتين النخيل الأيقونية.",
    categories: ["Adventure"],
    price: 45,
    region: "Médenine",
    city: "Midoun",
    country: "Tunisia",
    latitude: 33.809,
    longitude: 10.906,
    duration: "1h",
    capacity: 12,
    availableTimes: "09:00,10:30,14:00,15:30",
    includes: "Professional guide,Insurance,Water bottle",
    excludes: "Hotel pickup,Tips",
    cancelation: true,
    paynow: false,
    guide: "en,fr,ar",
    featuredInHome: true,
    note: "4.8",
    nbReviews: 34,
  },
  {
    slug: "djerba-island-discovery-tour",
    title: "Djerba Full Island Discovery Tour",
    arabicTitle: "جولة اكتشاف جزيرة جربة الكاملة",
    description:
      "Discover the best of Djerba in one unforgettable day. Visit the ancient El Ghriba synagogue, the historic Guellala pottery village, the colorful Houmt Souk market, and the breathtaking viewpoints over the Mediterranean. Your private driver-guide shares the stories behind each landmark.",
    arabicDescription:
      "اكتشف أجمل ما في جربة في يوم واحد لا يُنسى. قم بزيارة كنيس الغريبة العريق وقرية غلالة الفخارية التاريخية وسوق حومة السوق الملون والمناظر الخلابة على البحر المتوسط.",
    categories: ["Culture & History"],
    price: 75,
    region: "Médenine",
    city: "Houmt Souk",
    country: "Tunisia",
    latitude: 33.876,
    longitude: 10.859,
    duration: "6h",
    capacity: 8,
    availableTimes: "09:00,09:30",
    includes: "Private driver-guide,Air-conditioned vehicle,Entry fees,Water",
    excludes: "Lunch,Personal expenses",
    allowed: "Children welcome,Wheelchair accessible",
    cancelation: true,
    paynow: false,
    guide: "en,fr,ar",
    featuredInHome: true,
    note: "4.9",
    nbReviews: 62,
  },
  {
    slug: "djerba-pirate-boat-trip",
    title: "Djerba Pirate Boat Adventure",
    arabicTitle: "مغامرة قارب القراصنة في جربة",
    description:
      "Set sail on a traditional pirate-themed boat for an exciting half-day sea adventure around Djerba's coastline. Swim in crystal-clear waters, snorkel over vibrant reefs, and enjoy fresh seafood on board. A fun experience for the whole family.",
    arabicDescription:
      "أبحر على متن قارب تقليدي بمظهر القراصنة في مغامرة بحرية نصف يوم حول ساحل جربة. اسبح في مياه صافية كالكريستال وغطس فوق الشعاب المرجانية واستمتع بالمأكولات البحرية الطازجة على متن القارب.",
    categories: ["Water Sports"],
    price: 55,
    region: "Médenine",
    city: "Aghir",
    country: "Tunisia",
    latitude: 33.774,
    longitude: 10.953,
    duration: "4h",
    capacity: 20,
    availableTimes: "09:30,14:00",
    includes: "Boat trip,Snorkeling gear,Fresh seafood lunch,Soft drinks",
    excludes: "Hotel transfers,Alcoholic beverages",
    cancelation: true,
    paynow: true,
    guide: "en,fr",
    featuredInHome: false,
    note: "4.7",
    nbReviews: 28,
  },
];

const dubaiActivities = [
  {
    slug: "dubai-desert-safari-4x4",
    title: "Dubai Desert Safari 4x4 Adventure",
    arabicTitle: "مغامرة سفاري الصحراء بالسيارة الرباعية في دبي",
    description:
      "Experience the thrill of dune bashing in the heart of the Arabian Desert. After an exhilarating 4x4 ride over the golden dunes, settle in at a traditional Bedouin camp for camel riding, sandboarding, henna painting, and a lavish BBQ dinner under the stars.",
    arabicDescription:
      "اختبر إثارة التزلج على الكثبان في قلب الصحراء العربية. بعد رحلة مثيرة بالسيارة الرباعية، استقر في مخيم بدوي تقليدي لركوب الجمال والتزلج على الرمال والحنة وعشاء الشواء الفاخر تحت النجوم.",
    categories: ["Desert", "Adventure"],
    price: 120,
    region: "Dubai",
    city: "Dubai",
    country: "UAE",
    latitude: 24.839,
    longitude: 55.633,
    duration: "6h",
    capacity: 16,
    availableTimes: "15:00,15:30,16:00",
    includes: "4x4 dune bashing,Camel ride,Sandboarding,BBQ dinner,Live entertainment,Hotel pickup & drop-off",
    excludes: "Alcoholic beverages,Personal expenses",
    cancelation: true,
    paynow: false,
    guide: "en,ar",
    featuredInHome: true,
    note: "4.9",
    nbReviews: 145,
  },
  {
    slug: "dubai-burj-khalifa-sky-experience",
    title: "Burj Khalifa At The Top Sky Experience",
    arabicTitle: "تجربة برج خليفة في الأعلى",
    description:
      "Ascend to the 148th floor observation deck of the world's tallest building for a breathtaking 360° panorama of Dubai. See the city's iconic skyline, the vast desert, and the shimmering Arabian Gulf from 555 meters above ground. Includes priority access and a digital photo package.",
    arabicDescription:
      "اصعد إلى منصة المراقبة في الطابق 148 من أطول مبنى في العالم للحصول على بانوراما 360 درجة مذهلة لدبي. شاهد الأفق الأيقوني للمدينة والصحراء الشاسعة وخليج العرب اللامع من ارتفاع 555 مترًا.",
    categories: ["Culture & History"],
    price: 160,
    region: "Dubai",
    city: "Dubai",
    country: "UAE",
    latitude: 25.197,
    longitude: 55.274,
    duration: "2h",
    capacity: 20,
    availableTimes: "10:00,12:00,14:00,16:00,18:00,20:00",
    includes: "Priority access ticket,148th floor observation deck,Digital photo package",
    excludes: "Hotel transfers,Food & drinks",
    allowed: "All ages,Wheelchairs accommodated",
    cancelation: true,
    paynow: true,
    guide: "en,ar,fr",
    featuredInHome: true,
    note: "4.8",
    nbReviews: 203,
  },
  {
    slug: "dubai-dhow-cruise-marina",
    title: "Dubai Marina Dhow Cruise with Dinner",
    arabicTitle: "رحلة داو في مارينا دبي مع العشاء",
    description:
      "Glide along the stunning Dubai Marina aboard a traditional wooden dhow as the city lights illuminate the skyline. Enjoy a lavish international buffet dinner, live Tanoura dance performance, and unobstructed views of the marina's skyscrapers. The perfect way to end a Dubai evening.",
    arabicDescription:
      "انزلق على طول مارينا دبي الرائعة على متن داو خشبي تقليدي بينما تضيء أضواء المدينة الأفق. استمتع بعشاء بوفيه دولي فاخر وعرض رقص تنورة حي ومناظر غير مقيدة لناطحات سحاب المارينا.",
    categories: ["Food & Drink", "Culture & History"],
    price: 85,
    region: "Dubai",
    city: "Dubai",
    country: "UAE",
    latitude: 25.079,
    longitude: 55.139,
    duration: "2h",
    capacity: 40,
    availableTimes: "19:00,20:30",
    includes: "Dhow cruise,International buffet dinner,Soft drinks,Live entertainment,Hotel pickup & drop-off",
    excludes: "Alcoholic beverages,Tips",
    cancelation: true,
    paynow: false,
    guide: "en,ar",
    featuredInHome: false,
    note: "4.7",
    nbReviews: 89,
  },
];

// ─── Stays ──────────────────────────────────────────────────────────────────────

const djerbaStays = [
  {
    slug: "djerba-beachfront-villa",
    title: "Beachfront Villa with Private Pool",
    arabicTitle: "فيلا على الشاطئ مع مسبح خاص",
    description:
      "Wake up to panoramic Mediterranean views from this stunning beachfront villa in Djerba. Step directly onto the golden sand from your private terrace, take a dip in the heated pool, and unwind in one of three beautifully decorated bedrooms. Perfect for families or groups seeking a luxurious island escape.",
    arabicDescription:
      "استيقظ على إطلالات بانورامية على البحر المتوسط من هذه الفيلا الرائعة على شاطئ جربة. انتقل مباشرة إلى الرمال الذهبية من شرفتك الخاصة، واستمتع بالسباحة في المسبح المدفأ، واسترخ في إحدى غرف النوم الثلاث المزينة بشكل جميل.",
    propertyType: "VILLA",
    category: "villas,beach_resorts",
    price: 280,
    cleaningFee: 50,
    guestCount: 6,
    bedroomCount: 3,
    bedCount: 4,
    bathroomCount: 2,
    hasWifi: true,
    hasPool: true,
    hasAirConditioning: true,
    hasParking: true,
    hasGarden: true,
    hasBalcony: true,
    isPetFriendly: false,
    isSmokeFree: true,
    cancelationPolicy: "MODERATE",
    checkInTime: "15:00",
    checkOutTime: "11:00",
    country: "Tunisia",
    region: "Médenine",
    city: "Midoun",
    minStayNights: 2,
    hostName: "Djerba Villas",
    hostLanguages: "en,fr,ar",
    averageRating: 4.9,
    nbReviews: 47,
    featuredInHome: true,
  },
  {
    slug: "djerba-traditional-dar",
    title: "Authentic Traditional Dar in the Medina",
    arabicTitle: "دار تقليدي أصيل في المدينة العتيقة",
    description:
      "Experience the soul of Djerba in this lovingly restored traditional dar. Built around a central courtyard with a fountain, the house features hand-painted tiles, carved woodwork, and original arched doorways. Located steps from Houmt Souk's vibrant markets and restaurants. An intimate 4-guest retreat with genuine character.",
    arabicDescription:
      "اختبر روح جربة في هذا الدار التقليدي المُرمَّم بعناية. مبني حول فناء مركزي بنافورة، يضم المنزل بلاطًا مرسومًا يدويًا وأعمال خشبية منحوتة وأقواسًا أصلية. يقع على بُعد خطوات من أسواق حومة السوق النابضة بالحياة.",
    propertyType: "HOUSE",
    category: "guest_houses,bnb",
    price: 95,
    cleaningFee: 20,
    guestCount: 4,
    bedroomCount: 2,
    bedCount: 2,
    bathroomCount: 1,
    hasWifi: true,
    hasKitchen: true,
    hasAirConditioning: true,
    isPetFriendly: false,
    isSmokeFree: true,
    cancelationPolicy: "FLEXIBLE",
    checkInTime: "14:00",
    checkOutTime: "11:00",
    country: "Tunisia",
    region: "Médenine",
    city: "Houmt Souk",
    minStayNights: 1,
    hostName: "Djerba Villas",
    hostLanguages: "fr,ar",
    averageRating: 4.7,
    nbReviews: 31,
    featuredInHome: true,
  },
  {
    slug: "djerba-sea-view-apartment",
    title: "Sea View Apartment in Midoun",
    arabicTitle: "شقة بإطلالة بحرية في ميدون",
    description:
      "Bright and modern 2-bedroom apartment with sweeping sea views from a large balcony. Located in a quiet residential area of Midoun, 5 minutes' walk from the beach and local restaurants. Fully equipped kitchen, fast Wi-Fi, and air conditioning throughout. Ideal for couples or small families.",
    arabicDescription:
      "شقة حديثة ومضيئة من غرفتي نوم مع إطلالات بحرية واسعة من شرفة كبيرة. تقع في منطقة سكنية هادئة في ميدون، على بُعد 5 دقائق سيرًا من الشاطئ والمطاعم المحلية. مطبخ مجهز بالكامل وإنترنت سريع وتكييف في جميع الغرف.",
    propertyType: "APARTMENT",
    category: "apartments,vacation_rentals",
    price: 120,
    cleaningFee: 25,
    guestCount: 4,
    bedroomCount: 2,
    bedCount: 2,
    bathroomCount: 1,
    hasWifi: true,
    hasKitchen: true,
    hasAirConditioning: true,
    hasBalcony: true,
    hasParking: true,
    isPetFriendly: false,
    isSmokeFree: true,
    cancelationPolicy: "FLEXIBLE",
    checkInTime: "15:00",
    checkOutTime: "11:00",
    country: "Tunisia",
    region: "Médenine",
    city: "Midoun",
    minStayNights: 2,
    hostName: "Djerba Villas",
    hostLanguages: "en,fr",
    averageRating: 4.6,
    nbReviews: 22,
    featuredInHome: false,
  },
];

const dubaiStays = [
  {
    slug: "dubai-palm-luxury-villa",
    title: "Palm Jumeirah Luxury Villa",
    arabicTitle: "فيلا فاخرة في نخلة جميرا",
    description:
      "An extraordinary private villa on the iconic Palm Jumeirah with uninterrupted views of the Arabian Gulf. This 4-bedroom masterpiece features a private infinity pool, a landscaped garden, a private beach, and a state-of-the-art cinema room. Concierge service, security, and a private chef are available on request. Pure Dubai luxury.",
    arabicDescription:
      "فيلا خاصة استثنائية في نخلة جميرا الأيقونية مع إطلالات لا عوائق على خليج العرب. تضم هذه التحفة المعمارية المكونة من 4 غرف نوم مسبحًا خاصًا لانهائيًا وحديقة منسقة وشاطئًا خاصًا وغرفة سينما متطورة.",
    propertyType: "VILLA",
    category: "villas,luxury",
    price: 950,
    cleaningFee: 150,
    guestCount: 8,
    bedroomCount: 4,
    bedCount: 5,
    bathroomCount: 4,
    hasWifi: true,
    hasPool: true,
    hasAirConditioning: true,
    hasParking: true,
    hasSecurity: true,
    hasConcierge: true,
    hasGarden: true,
    isPetFriendly: false,
    isSmokeFree: true,
    cancelationPolicy: "STRICT",
    checkInTime: "16:00",
    checkOutTime: "12:00",
    country: "UAE",
    region: "Dubai",
    city: "Palm Jumeirah",
    minStayNights: 3,
    hostName: "Dubai Experiences",
    hostLanguages: "en,ar",
    averageRating: 5.0,
    nbReviews: 18,
    featuredInHome: true,
  },
  {
    slug: "dubai-downtown-hotel-suite",
    title: "Downtown Dubai Luxury Hotel Suite",
    arabicTitle: "جناح فندقي فاخر في وسط دبي",
    description:
      "A premium hotel suite in the heart of Downtown Dubai with breathtaking views of the Burj Khalifa and Dubai Fountain from your private balcony. Enjoy 5-star amenities including a spa, rooftop pool, and fine dining restaurants. Steps away from The Dubai Mall and world-class entertainment. The ultimate urban luxury experience.",
    arabicDescription:
      "جناح فندقي مميز في قلب وسط دبي مع إطلالات خلابة على برج خليفة ونافورة دبي من شرفتك الخاصة. استمتع بوسائل راحة 5 نجوم تشمل منتجع صحي ومسبح على السطح ومطاعم فاخرة.",
    propertyType: "HOTEL",
    category: "hotels,luxury",
    price: 450,
    cleaningFee: 0,
    guestCount: 2,
    bedroomCount: 1,
    bedCount: 1,
    bathroomCount: 1,
    hasWifi: true,
    hasAirConditioning: true,
    hasParking: true,
    hasSecurity: true,
    hasConcierge: true,
    hasBalcony: true,
    elevatorAvailable: true,
    isPetFriendly: false,
    isSmokeFree: true,
    cancelationPolicy: "MODERATE",
    checkInTime: "15:00",
    checkOutTime: "12:00",
    country: "UAE",
    region: "Dubai",
    city: "Downtown Dubai",
    minStayNights: 1,
    hostName: "Dubai Experiences",
    hostLanguages: "en,ar,fr",
    averageRating: 4.8,
    nbReviews: 94,
    featuredInHome: true,
  },
  {
    slug: "dubai-marina-apartment",
    title: "Dubai Marina Waterfront Apartment",
    arabicTitle: "شقة على الواجهة المائية في مارينا دبي",
    description:
      "Stunning 2-bedroom apartment with floor-to-ceiling windows overlooking Dubai Marina's glittering skyline. Enjoy the rooftop infinity pool, fully equipped kitchen, and a prime location surrounded by some of Dubai's best restaurants and beach clubs. Walk to JBR beach in 10 minutes.",
    arabicDescription:
      "شقة رائعة من غرفتي نوم بنوافذ من الأرض إلى السقف تطل على أفق مارينا دبي البراق. استمتع بمسبح لانهائي على السطح ومطبخ مجهز بالكامل وموقع متميز محاط بأفضل مطاعم دبي ونوادي الشاطئ.",
    propertyType: "APARTMENT",
    category: "apartments,vacation_rentals",
    price: 350,
    cleaningFee: 60,
    guestCount: 4,
    bedroomCount: 2,
    bedCount: 2,
    bathroomCount: 2,
    hasWifi: true,
    hasKitchen: true,
    hasAirConditioning: true,
    hasPool: true,
    hasBalcony: true,
    hasParking: true,
    elevatorAvailable: true,
    isPetFriendly: false,
    isSmokeFree: true,
    cancelationPolicy: "MODERATE",
    checkInTime: "15:00",
    checkOutTime: "11:00",
    country: "UAE",
    region: "Dubai",
    city: "Dubai Marina",
    minStayNights: 2,
    hostName: "Dubai Experiences",
    hostLanguages: "en,ar",
    averageRating: 4.7,
    nbReviews: 63,
    featuredInHome: false,
  },
];

// ─── Main ───────────────────────────────────────────────────────────────────────

function getRandomImages(pool: string[], count: number = 3): string[] {
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function seedExtendedData() {
  console.log("\nSeeding extended data (100 entries per category)...");

  const djerba = await prisma.destination.findUnique({ where: { slug: "djerba" } });
  const tunis = await prisma.destination.findUnique({ where: { slug: "tunis" } });
  
  // Use existing profile or create a generic one if needed
  const DJERBA_PROFILE_ID = "seed-profile-djerba-001";

  // 1. Extended Activities
  console.log("  - Activities...");
  for (const act of extendedActivities) {
    const dest = await prisma.destination.findFirst({
      where: { OR: [{ city: act.city }, { region: act.region }] }
    });
    
    const created = await prisma.activity.upsert({
      where: { slug: act.slug },
      update: { ...act, profileId: DJERBA_PROFILE_ID, destinationId: dest?.id || djerba!.id },
      create: { ...act, profileId: DJERBA_PROFILE_ID, destinationId: dest?.id || djerba!.id },
    });

    const existingImages = await prisma.images.count({ where: { activityId: created.id } });
    if (existingImages === 0) {
      const urls = getRandomImages(activityImagePool, 4);
      await prisma.images.createMany({ data: urls.map(url => ({ url, activityId: created.id })) });
    }

    const existingSlots = await prisma.activityTimeSlot.count({ where: { activityId: created.id } });
    if (existingSlots === 0) {
      const times = (act.availableTimes || "09:00,14:00").split(",").map(t => t.trim()).filter(Boolean);
      await prisma.activityTimeSlot.createMany({ data: times.map(time => ({ time, activityId: created.id })) });
    }
  }

  // 2. Extended Stays
  console.log("  - Stays...");
  for (const stay of extendedStays) {
    const dest = await prisma.destination.findFirst({
      where: { OR: [{ city: stay.city }, { region: stay.region }] }
    });

    const created = await prisma.stay.upsert({
      where: { slug: stay.slug },
      update: { ...stay, profileId: DJERBA_PROFILE_ID, destinationId: dest?.id || djerba!.id },
      create: { ...stay, profileId: DJERBA_PROFILE_ID, destinationId: dest?.id || djerba!.id },
    });

    const existingImages = await prisma.images.count({ where: { stayId: created.id } });
    if (existingImages === 0) {
      const urls = getRandomImages(stayImagePool, 5);
      await prisma.images.createMany({ data: urls.map(url => ({ url, stayId: created.id })) });
    }
  }

  // 3. Extended Attractions
  console.log("  - Attractions...");
  for (const attr of extendedAttractions) {
    // Try to find destination from location string (e.g. "Carthage", "Sousse", "Houmt Souk, Djerba")
    const dest = await prisma.destination.findFirst({
      where: { 
        OR: [
          { city: { contains: attr.location.split(',')[0].trim(), mode: 'insensitive' } },
          { region: { contains: attr.location.split(',')[0].trim(), mode: 'insensitive' } }
        ] 
      }
    });

    const created = await prisma.attraction.upsert({
      where: { slug: attr.slug },
      update: { ...attr, destinationId: dest?.id || tunis!.id }, 
      create: { ...attr, destinationId: dest?.id || tunis!.id },
    });

    const existingImages = await prisma.images.count({ where: { attractionId: created.id } });
    if (existingImages === 0) {
      const urls = getRandomImages(attractionImagePool, 3);
      await prisma.images.createMany({ data: urls.map(url => ({ url, attractionId: created.id })) });
    }
  }

  // 4. Extended Restaurants
  console.log("  - Restaurants...");
  for (const rest of extendedRestaurants) {
    const dest = await prisma.destination.findFirst({
      where: { OR: [{ city: rest.city }, { region: rest.region || "" }] }
    });

    const created = await prisma.restaurant.upsert({
      where: { slug: rest.slug },
      update: { ...rest, profileId: DJERBA_PROFILE_ID, destinationId: dest?.id || djerba!.id },
      create: { ...rest, profileId: DJERBA_PROFILE_ID, destinationId: dest?.id || djerba!.id },
    });

    const existingImages = await prisma.images.count({ where: { restaurantId: created.id } });
    if (existingImages === 0) {
      const urls = getRandomImages(restaurantImagePool, 4);
      await prisma.images.createMany({ data: urls.map(url => ({ url, restaurantId: created.id })) });
    }
  }
}

async function main() {

  // 1. Destinations
  console.log("Seeding destinations...");
  for (const dest of destinations) {
    const createdDest = await prisma.destination.upsert({
      where: { slug: dest.slug },
      update: dest,
      create: dest,
    });
    const destUrls = destinationImages[dest.slug] ?? [];
    const destImgEx = await prisma.images.count({ where: { destinationId: createdDest.id } });
    if (destImgEx === 0 && destUrls.length > 0) {
      await prisma.images.createMany({ data: destUrls.map((url) => ({ url, destinationId: createdDest.id })) });
    }
    console.log(`  ✓ ${dest.city}, ${dest.country}`);
  }

  // 2. Demo users (one per business profile — userId is unique on BusinessProfile)
  console.log("\nSeeding demo partner users...");
  await prisma.user.upsert({
    where: { email: "partner-djerba@guidni.demo" },
    update: {},
    create: {
      id: DEMO_USER_DJERBA_ID,
      name: "Djerba Demo Partner",
      email: "partner-djerba@guidni.demo",
      emailVerified: true,
      role: "PARTNER",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log("  ✓ partner-djerba@guidni.demo");

  await prisma.user.upsert({
    where: { email: "partner-dubai@guidni.demo" },
    update: {},
    create: {
      id: DEMO_USER_DUBAI_ID,
      name: "Dubai Demo Partner",
      email: "partner-dubai@guidni.demo",
      emailVerified: true,
      role: "PARTNER",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log("  ✓ partner-dubai@guidni.demo");

  // 3. Demo customer users (reviewers)
  console.log("\nSeeding demo customer users...");
  for (const c of demoCustomers) {
    await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: { id: c.id, name: c.name, email: c.email, emailVerified: true, role: "USER", createdAt: new Date(), updatedAt: new Date() },
    });
    console.log(`  ✓ ${c.email}`);
  }

  // 5. Business profiles
  console.log("\nSeeding business profiles...");
  await prisma.businessProfile.upsert({
    where: { id: DJERBA_PROFILE_ID },
    update: { categories: ["activities", "stays", "restaurant", "rentals"] },
    create: {
      id: DJERBA_PROFILE_ID,
      name: "Djerba Activities",
      description: "Your local guide to the best experiences in Djerba.",
      categories: ["activities", "stays", "restaurant", "rentals"],
      country: "Tunisia",
      region: "Médenine",
      isVerified: true,
      userId: DEMO_USER_DJERBA_ID,
    },
  });
  console.log("  ✓ Djerba Activities (profile)");

  await prisma.businessProfile.upsert({
    where: { id: DUBAI_PROFILE_ID },
    update: { categories: ["activities", "stays", "restaurant", "rentals"] },
    create: {
      id: DUBAI_PROFILE_ID,
      name: "Dubai Experiences",
      description: "Premium activities and tours across Dubai.",
      categories: ["activities", "stays", "restaurant", "rentals"],
      country: "UAE",
      region: "Dubai",
      isVerified: true,
      userId: DEMO_USER_DUBAI_ID,
    },
  });
  console.log("  ✓ Dubai Experiences (profile)");

  // 6. Djerba activities
  console.log("\nSeeding Djerba activities...");
  const djerba = await prisma.destination.findUnique({ where: { slug: "djerba" } });
  for (const act of djerbaActivities) {
    const created = await prisma.activity.upsert({
      where:  { slug: act.slug },
      update: { ...act, profileId: DJERBA_PROFILE_ID, destinationId: djerba!.id, status: "ACTIVE" },
      create: { ...act, profileId: DJERBA_PROFILE_ID, destinationId: djerba!.id, status: "ACTIVE" },
    });
    const urls = activityImages[act.slug] ?? [];
    const existingImages = await prisma.images.count({ where: { activityId: created.id } });
    if (existingImages === 0 && urls.length > 0) {
      await prisma.images.createMany({ data: urls.map((url) => ({ url, activityId: created.id })) });
    }
    const existingSlots = await prisma.activityTimeSlot.count({ where: { activityId: created.id } });
    if (existingSlots === 0) {
      const times = act.availableTimes.split(",").map((t) => t.trim()).filter(Boolean);
      await prisma.activityTimeSlot.createMany({ data: times.map((time) => ({ time, activityId: created.id })) });
    }
    console.log(`  ✓ ${act.title}`);
  }

  // 7. Dubai activities
  console.log("\nSeeding Dubai activities...");
  const dubai = await prisma.destination.findUnique({ where: { slug: "dubai" } });
  for (const act of dubaiActivities) {
    const created = await prisma.activity.upsert({
      where:  { slug: act.slug },
      update: { ...act, profileId: DUBAI_PROFILE_ID, destinationId: dubai!.id, status: "ACTIVE" },
      create: { ...act, profileId: DUBAI_PROFILE_ID, destinationId: dubai!.id, status: "ACTIVE" },
    });
    const urls = activityImages[act.slug] ?? [];
    const existingImages = await prisma.images.count({ where: { activityId: created.id } });
    if (existingImages === 0 && urls.length > 0) {
      await prisma.images.createMany({ data: urls.map((url) => ({ url, activityId: created.id })) });
    }
    const existingSlots = await prisma.activityTimeSlot.count({ where: { activityId: created.id } });
    if (existingSlots === 0) {
      const times = act.availableTimes.split(",").map((t) => t.trim()).filter(Boolean);
      await prisma.activityTimeSlot.createMany({ data: times.map((time) => ({ time, activityId: created.id })) });
    }
    console.log(`  ✓ ${act.title}`);
  }

  // 8. Djerba stays
  console.log("\nSeeding Djerba stays...");
  for (const stay of djerbaStays) {
    const created = await prisma.stay.upsert({
      where:  { slug: stay.slug },
      update: { ...stay, profileId: DJERBA_PROFILE_ID, destinationId: djerba!.id },
      create: { ...stay, profileId: DJERBA_PROFILE_ID, destinationId: djerba!.id },
    });
    const urls = stayImages[stay.slug] ?? [];
    const existing = await prisma.images.count({ where: { stayId: created.id } });
    if (existing === 0 && urls.length > 0) {
      await prisma.images.createMany({ data: urls.map((url) => ({ url, stayId: created.id })) });
    }
    console.log(`  ✓ ${stay.title}`);
  }

  // 9. Dubai stays
  console.log("\nSeeding Dubai stays...");
  for (const stay of dubaiStays) {
    const created = await prisma.stay.upsert({
      where:  { slug: stay.slug },
      update: { ...stay, profileId: DUBAI_PROFILE_ID, destinationId: dubai!.id },
      create: { ...stay, profileId: DUBAI_PROFILE_ID, destinationId: dubai!.id },
    });
    const urls = stayImages[stay.slug] ?? [];
    const existing = await prisma.images.count({ where: { stayId: created.id } });
    if (existing === 0 && urls.length > 0) {
      await prisma.images.createMany({ data: urls.map((url) => ({ url, stayId: created.id })) });
    }
    console.log(`  ✓ ${stay.title}`);
  }

  // 10. Reviews
  console.log("\nSeeding reviews...");

  // Look up IDs for all seeded listings
  const [
    camelRide, islandTour, pirateBoat,
    desertSafari, burjKhalifa, dhowCruise,
    djerbaVilla, djerbaDar, djerbaApt,
    dubaiPalm, dubaiDowntown, dubaiMarina,
  ] = await Promise.all([
    prisma.activity.findUnique({ where: { slug: "djerba-camel-ride-beach" },       select: { id: true } }),
    prisma.activity.findUnique({ where: { slug: "djerba-island-discovery-tour" },  select: { id: true } }),
    prisma.activity.findUnique({ where: { slug: "djerba-pirate-boat-trip" },       select: { id: true } }),
    prisma.activity.findUnique({ where: { slug: "dubai-desert-safari-4x4" },       select: { id: true } }),
    prisma.activity.findUnique({ where: { slug: "dubai-burj-khalifa-sky-experience" }, select: { id: true } }),
    prisma.activity.findUnique({ where: { slug: "dubai-dhow-cruise-marina" },      select: { id: true } }),
    prisma.stay.findUnique({ where: { slug: "djerba-beachfront-villa" },           select: { id: true } }),
    prisma.stay.findUnique({ where: { slug: "djerba-traditional-dar" },            select: { id: true } }),
    prisma.stay.findUnique({ where: { slug: "djerba-sea-view-apartment" },         select: { id: true } }),
    prisma.stay.findUnique({ where: { slug: "dubai-palm-luxury-villa" },           select: { id: true } }),
    prisma.stay.findUnique({ where: { slug: "dubai-downtown-hotel-suite" },        select: { id: true } }),
    prisma.stay.findUnique({ where: { slug: "dubai-marina-apartment" },            select: { id: true } }),
  ]);

  // Delete previous seed reviews (idempotent re-runs)
  const seedUserIds = Object.values(CUSTOMER_IDS);
  await prisma.review.deleteMany({ where: { userId: { in: seedUserIds } } });

  const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000);

  const reviewsData = [
    // ── Djerba Camel Ride ────────────────────────────────────────────────
    { userId: CUSTOMER_IDS.sarah,   userName: "Sarah Johnson", relationId: camelRide!.id,   relationType: "ACTIVITY" as const, rating: 5, title: "Unforgettable experience!", comment: "The guide was amazing and the views were stunning. My kids loved every minute of it.", createdAt: d(12) },
    { userId: CUSTOMER_IDS.marco,   userName: "Marco Rossi",   relationId: camelRide!.id,   relationType: "ACTIVITY" as const, rating: 4, title: "Great fun at sunset",       comment: "Really enjoyed the camel ride along the beach. The light was beautiful in the late afternoon.", createdAt: d(8) },

    // ── Djerba Island Discovery Tour ────────────────────────────────────
    { userId: CUSTOMER_IDS.amir,    userName: "Amir Hassan",   relationId: islandTour!.id,  relationType: "ACTIVITY" as const, rating: 5, title: "Best tour in Djerba",       comment: "Perfectly organised full-day tour. Our guide knew every corner of the island and shared incredible stories.", createdAt: d(20), response: "Thank you Amir! We are thrilled you enjoyed the full island experience. Hope to see you again soon!", responseDate: d(18).toISOString() },
    { userId: CUSTOMER_IDS.emma,    userName: "Emma Wilson",   relationId: islandTour!.id,  relationType: "ACTIVITY" as const, rating: 5, title: "A must-do in Djerba",       comment: "The El Ghriba synagogue was incredible and Houmt Souk market was fascinating. Worth every penny.", createdAt: d(15) },

    // ── Djerba Pirate Boat Trip ──────────────────────────────────────────
    { userId: CUSTOMER_IDS.youssef, userName: "Youssef Benali",relationId: pirateBoat!.id,  relationType: "ACTIVITY" as const, rating: 5, title: "Epic day on the water!",   comment: "My kids went absolutely wild for the pirate theme. The seafood lunch on board was fresh and delicious.", createdAt: d(6) },
    { userId: CUSTOMER_IDS.sarah,   userName: "Sarah Johnson", relationId: pirateBoat!.id,  relationType: "ACTIVITY" as const, rating: 4, title: "Fun family trip",            comment: "Good experience overall, the snorkeling spot was beautiful. Highly recommend for families.", createdAt: d(3) },

    // ── Dubai Desert Safari ──────────────────────────────────────────────
    { userId: CUSTOMER_IDS.emma,    userName: "Emma Wilson",   relationId: desertSafari!.id, relationType: "ACTIVITY" as const, rating: 5, title: "A once-in-a-lifetime experience", comment: "The dune bashing was exhilarating and the Bedouin camp under the stars was absolutely magical.", createdAt: d(25), response: "Wonderful to hear this Emma! The desert is truly magical at night. We hope to welcome you back to Dubai!", responseDate: d(23).toISOString() },
    { userId: CUSTOMER_IDS.marco,   userName: "Marco Rossi",   relationId: desertSafari!.id, relationType: "ACTIVITY" as const, rating: 5, title: "Absolutely spectacular",     comment: "The whole experience from the 4x4 dune ride to the BBQ dinner with live entertainment was top-notch.", createdAt: d(18) },

    // ── Dubai Burj Khalifa ───────────────────────────────────────────────
    { userId: CUSTOMER_IDS.amir,    userName: "Amir Hassan",   relationId: burjKhalifa!.id,  relationType: "ACTIVITY" as const, rating: 5, title: "Views beyond words",        comment: "Standing at 555 meters above Dubai is something you simply have to experience. The priority access was worth it.", createdAt: d(30) },
    { userId: CUSTOMER_IDS.sarah,   userName: "Sarah Johnson", relationId: burjKhalifa!.id,  relationType: "ACTIVITY" as const, rating: 4, title: "Impressive but go early",   comment: "The views are absolutely stunning, but arrive early in the morning to beat the crowds.", createdAt: d(22) },

    // ── Dubai Dhow Cruise ────────────────────────────────────────────────
    { userId: CUSTOMER_IDS.youssef, userName: "Youssef Benali",relationId: dhowCruise!.id,   relationType: "ACTIVITY" as const, rating: 5, title: "Magical evening on the water", comment: "Watching the illuminated Dubai skyline glide past from the traditional dhow was completely unforgettable.", createdAt: d(10) },
    { userId: CUSTOMER_IDS.emma,    userName: "Emma Wilson",   relationId: dhowCruise!.id,   relationType: "ACTIVITY" as const, rating: 4, title: "Great evening cruise",       comment: "Lovely way to see the marina at night. Food was good and the onboard entertainment was fun.", createdAt: d(7) },

    // ── Djerba Beachfront Villa ──────────────────────────────────────────
    { userId: CUSTOMER_IDS.marco,   userName: "Marco Rossi",   relationId: djerbaVilla!.id,  relationType: "STAY" as const,     rating: 5, title: "Paradise found",             comment: "We woke up every morning to the sound of waves. The private pool and the sea views are absolutely perfect.", createdAt: d(40), response: "Marco, thank you so much! We are so happy you enjoyed the villa. You are always welcome back!", responseDate: d(38).toISOString() },
    { userId: CUSTOMER_IDS.amir,    userName: "Amir Hassan",   relationId: djerbaVilla!.id,  relationType: "STAY" as const,     rating: 5, title: "Best stay in Djerba",        comment: "The private pool with sea views is everything. The host was incredibly welcoming and responsive.", createdAt: d(35) },

    // ── Djerba Traditional Dar ───────────────────────────────────────────
    { userId: CUSTOMER_IDS.sarah,   userName: "Sarah Johnson", relationId: djerbaDar!.id,    relationType: "STAY" as const,     rating: 5, title: "Authentic Djerba experience", comment: "Staying in this dar felt like stepping back in time. The architecture is beautiful and the courtyard is magical.", createdAt: d(50) },
    { userId: CUSTOMER_IDS.youssef, userName: "Youssef Benali",relationId: djerbaDar!.id,    relationType: "STAY" as const,     rating: 4, title: "Lovely traditional riad",    comment: "Great location in the medina, very charming property. The breakfast served in the courtyard was a highlight.", createdAt: d(45) },

    // ── Djerba Sea View Apartment ────────────────────────────────────────
    { userId: CUSTOMER_IDS.emma,    userName: "Emma Wilson",   relationId: djerbaApt!.id,    relationType: "STAY" as const,     rating: 4, title: "Great value with stunning views", comment: "Clean and well-equipped apartment with amazing sea views from the balcony. Perfect base for exploring the island.", createdAt: d(28) },

    // ── Dubai Palm Luxury Villa ──────────────────────────────────────────
    { userId: CUSTOMER_IDS.marco,   userName: "Marco Rossi",   relationId: dubaiPalm!.id,    relationType: "STAY" as const,     rating: 5, title: "Ultra-luxury at its finest",  comment: "Everything about this villa was perfect. The infinity pool overlooking the Palm is completely surreal.", createdAt: d(60), response: "Thank you Marco, we are delighted you loved every moment. The Palm villa is truly special. See you next time!", responseDate: d(58).toISOString() },
    { userId: CUSTOMER_IDS.sarah,   userName: "Sarah Johnson", relationId: dubaiPalm!.id,    relationType: "STAY" as const,     rating: 5, title: "An absolute dream stay",      comment: "We watched the most beautiful sunrise over the Gulf every single morning. Truly unforgettable.", createdAt: d(55) },

    // ── Dubai Downtown Hotel Suite ───────────────────────────────────────
    { userId: CUSTOMER_IDS.amir,    userName: "Amir Hassan",   relationId: dubaiDowntown!.id, relationType: "STAY" as const,    rating: 5, title: "Burj Khalifa at your doorstep", comment: "The location is simply unbeatable. The rooms are stunning and the service is world-class.", createdAt: d(33) },
    { userId: CUSTOMER_IDS.youssef, userName: "Youssef Benali",relationId: dubaiDowntown!.id, relationType: "STAY" as const,    rating: 4, title: "Excellent hotel suite",        comment: "Great location and beautiful rooms. Room service was incredibly fast. Would definitely return.", createdAt: d(27) },

    // ── Dubai Marina Apartment ───────────────────────────────────────────
    { userId: CUSTOMER_IDS.emma,    userName: "Emma Wilson",   relationId: dubaiMarina!.id,   relationType: "STAY" as const,    rating: 4, title: "Stylish marina apartment",     comment: "Modern and very well-equipped. Walking distance to great restaurants and the beach. Perfect location.", createdAt: d(14) },
  ];

  await prisma.review.createMany({ data: reviewsData });
  console.log(`  ✓ ${reviewsData.length} reviews created`);

  // ─── Restaurants ─────────────────────────────────────────────────────────────
  console.log("Seeding restaurants...");

  // Djerba restaurant 1 — traditional Tunisian
  const darHoumt = await prisma.restaurant.upsert({
    where: { slug: "dar-houmt-souk" },
    update: { foodTypes: ["seafood", "grill"], dietTypes: ["halal"], attributes: ["romantic", "quiet", "family_friendly", "parking"] },
    create: {
      slug: "dar-houmt-souk",
      name: "Dar Houmt Souk",
      arabicName: "دار حومة السوق",
      description: "A beautifully restored traditional Tunisian house in the heart of the medina, serving authentic local cuisine in a tranquil courtyard setting. From slow-cooked lamb to freshly grilled fish, every dish celebrates the flavours of the island.",
      arabicDescription: "منزل تونسي تقليدي مُرمَّم بشكل جميل في قلب المدينة القديمة، يقدم المطبخ المحلي الأصيل في فناء هادئ. من اللحم المطهو ببطء إلى السمك المشوي الطازج، كل طبق يحتفي بنكهات الجزيرة.",
      phone: "+216 75 650 100",
      type: "RESTAURANT",
      category: "Tunisian",
      meals: "Lunch, Dinner",
      foodTypes: ["seafood", "grill"],
      dietTypes: ["halal"],
      attributes: ["romantic", "quiet", "family_friendly", "parking"],
      country: "Tunisia",
      city: "Djerba",
      address: "12 Rue de la Hara, Houmt Souk",
      reservationsEnabled: true,
      maxGuests: 60,
      tables: 12,
      featuredInHome: true,
      profileId: DJERBA_PROFILE_ID,
      destinationId: djerba!.id,
    },
  });

  await prisma.restaurantMenu.deleteMany({ where: { restaurantId: darHoumt.id } });
  await prisma.restaurantHours.deleteMany({ where: { restaurantId: darHoumt.id } });
  await prisma.restaurantMenu.createMany({
    data: [
      { restaurantId: darHoumt.id, name: "Brik à l'œuf", description: "Crispy pastry filled with egg, tuna, capers and parsley — a Tunisian classic.", price: 8, category: "Starters", visible: true },
      { restaurantId: darHoumt.id, name: "Salade Méchouia", description: "Roasted pepper and tomato salad with olive oil and harissa.", price: 7, category: "Starters", visible: true },
      { restaurantId: darHoumt.id, name: "Agneau au Couscous", description: "Slow-cooked lamb shoulder served over hand-rolled couscous with seasonal vegetables.", price: 28, category: "Mains", visible: true },
      { restaurantId: darHoumt.id, name: "Poisson Grillé du Jour", description: "Freshly caught fish grilled with herbs and lemon, served with harissa and bread.", price: 32, category: "Mains", visible: true },
      { restaurantId: darHoumt.id, name: "Tajine Kefta", description: "Spiced minced meat kefta in a rich tomato and egg sauce.", price: 22, category: "Mains", visible: true },
      { restaurantId: darHoumt.id, name: "Makroudh", description: "Traditional semolina and date pastries drizzled with honey.", price: 6, category: "Desserts", visible: true },
      { restaurantId: darHoumt.id, name: "Thé à la Menthe", description: "Freshly brewed mint tea with pine nuts.", price: 4, category: "Drinks", visible: true },
    ],
  });

  await prisma.restaurantHours.createMany({
    data: [
      { restaurantId: darHoumt.id, day: "Monday",    opening: "12:00", closing: "22:00", isClosed: false },
      { restaurantId: darHoumt.id, day: "Tuesday",   opening: "12:00", closing: "22:00", isClosed: false },
      { restaurantId: darHoumt.id, day: "Wednesday", opening: "12:00", closing: "22:00", isClosed: false },
      { restaurantId: darHoumt.id, day: "Thursday",  opening: "12:00", closing: "22:00", isClosed: false },
      { restaurantId: darHoumt.id, day: "Friday",    isClosed: true },
      { restaurantId: darHoumt.id, day: "Saturday",  opening: "12:00", closing: "23:00", isClosed: false },
      { restaurantId: darHoumt.id, day: "Sunday",    opening: "12:00", closing: "23:00", isClosed: false },
    ],
  });
  const darHoumtImgUrls = restaurantImages["dar-houmt-souk"] ?? [];
  const darHoumtImgEx = await prisma.images.count({ where: { restaurantId: darHoumt.id } });
  if (darHoumtImgEx === 0 && darHoumtImgUrls.length > 0) {
    await prisma.images.createMany({ data: darHoumtImgUrls.map((url) => ({ url, restaurantId: darHoumt.id })) });
  }

  // Djerba restaurant 2 — beachside café
  const laPlage = await prisma.restaurant.upsert({
    where: { slug: "la-plage-cafe-djerba" },
    update: { foodTypes: ["cafe", "bakery"], dietTypes: ["vegetarian"], attributes: ["sea_view", "terrace", "wifi", "cosy", "family_friendly", "baby_space"] },
    create: {
      slug: "la-plage-cafe-djerba",
      name: "La Plage Café",
      arabicName: "كافيه الشاطئ",
      description: "Your feet in the sand, a fresh coffee in hand. La Plage is a laid-back beachside café on the south coast of Djerba serving breakfasts, smoothies, light bites and cocktails against a backdrop of turquoise sea.",
      arabicDescription: "قدماك في الرمال وقهوة طازجة في يديك. كافيه الشاطئ مقهى مريح على الشاطئ الجنوبي لجربة، يقدم الإفطار والعصائر والوجبات الخفيفة والكوكتيل بخلفية من البحر الفيروزي.",
      phone: "+216 75 745 200",
      type: "CAFEE_SHOP",
      category: "Café",
      meals: "Breakfast, Lunch, Snacks",
      foodTypes: ["cafe", "bakery"],
      dietTypes: ["vegetarian"],
      attributes: ["sea_view", "terrace", "wifi", "cosy", "family_friendly", "baby_space"],
      country: "Tunisia",
      city: "Djerba",
      address: "Route Touristique, Midoun Beach",
      reservationsEnabled: false,
      maxGuests: 40,
      tables: 10,
      featuredInHome: true,
      profileId: DJERBA_PROFILE_ID,
      destinationId: djerba!.id,
    },
  });

  await prisma.restaurantMenu.deleteMany({ where: { restaurantId: laPlage.id } });
  await prisma.restaurantHours.deleteMany({ where: { restaurantId: laPlage.id } });
  await prisma.restaurantMenu.createMany({
    data: [
      { restaurantId: laPlage.id, name: "Full Breakfast", description: "Eggs, avocado toast, labneh, olives, fresh juice and a hot drink.", price: 16, category: "Breakfast", visible: true },
      { restaurantId: laPlage.id, name: "Acai Bowl", description: "Frozen acai blended with banana, topped with granola, honey and seasonal fruit.", price: 14, category: "Breakfast", visible: true },
      { restaurantId: laPlage.id, name: "Caprese Sandwich", description: "Fresh mozzarella, tomato and basil on toasted focaccia with pesto.", price: 12, category: "Light Bites", visible: true },
      { restaurantId: laPlage.id, name: "Hummus & Pita", description: "House-made hummus served warm with olive oil, paprika and fresh pita.", price: 9, category: "Light Bites", visible: true },
      { restaurantId: laPlage.id, name: "Mango Smoothie", description: "Fresh mango, coconut milk and lime.", price: 8, category: "Drinks", visible: true },
      { restaurantId: laPlage.id, name: "Flat White", description: "Double espresso with silky steamed milk.", price: 5, category: "Drinks", visible: true },
    ],
  });

  await prisma.restaurantHours.createMany({
    data: [
      { restaurantId: laPlage.id, day: "Monday",    isFullDayOpening: true },
      { restaurantId: laPlage.id, day: "Tuesday",   isFullDayOpening: true },
      { restaurantId: laPlage.id, day: "Wednesday", isFullDayOpening: true },
      { restaurantId: laPlage.id, day: "Thursday",  isFullDayOpening: true },
      { restaurantId: laPlage.id, day: "Friday",    isFullDayOpening: true },
      { restaurantId: laPlage.id, day: "Saturday",  isFullDayOpening: true },
      { restaurantId: laPlage.id, day: "Sunday",    isFullDayOpening: true },
    ],
  });
  const laPlageImgUrls = restaurantImages["la-plage-cafe-djerba"] ?? [];
  const laPlageImgEx = await prisma.images.count({ where: { restaurantId: laPlage.id } });
  if (laPlageImgEx === 0 && laPlageImgUrls.length > 0) {
    await prisma.images.createMany({ data: laPlageImgUrls.map((url) => ({ url, restaurantId: laPlage.id })) });
  }

  // Djerba restaurant 3 — Berber grill
  const leBerbere = await prisma.restaurant.upsert({
    where: { slug: "le-berbere-djerba" },
    update: { foodTypes: ["grill", "street_food"], dietTypes: ["halal"], attributes: ["terrace", "live_music", "family_friendly", "children_menu", "board_games"] },
    create: {
      slug: "le-berbere-djerba",
      name: "Le Berbère",
      arabicName: "البربري",
      description: "A rustic North African grill house in Midoun serving wood-fired meats, merguez sausages, and fragrant tagines inspired by Berber traditions. The terrace is perfect for a long dinner under the stars.",
      arabicDescription: "مطعم شواء شمال أفريقي ريفي في ميدون يقدم اللحوم المشوية على الحطب وسجق المرقاز والطواجن العطرية المستوحاة من التقاليد البربرية. الشرفة مثالية لتناول عشاء طويل تحت النجوم.",
      phone: "+216 75 633 400",
      type: "RESTAURANT",
      category: "North African",
      meals: "Lunch, Dinner",
      foodTypes: ["grill", "street_food"],
      dietTypes: ["halal"],
      attributes: ["terrace", "live_music", "family_friendly", "children_menu", "board_games"],
      country: "Tunisia",
      city: "Djerba",
      address: "Avenue Habib Bourguiba, Midoun",
      reservationsEnabled: true,
      maxGuests: 80,
      tables: 16,
      featuredInHome: false,
      profileId: DJERBA_PROFILE_ID,
      destinationId: djerba!.id,
    },
  });

  await prisma.restaurantMenu.deleteMany({ where: { restaurantId: leBerbere.id } });
  await prisma.restaurantHours.deleteMany({ where: { restaurantId: leBerbere.id } });
  await prisma.restaurantMenu.createMany({
    data: [
      { restaurantId: leBerbere.id, name: "Chorba Frik", description: "Hearty lamb and cracked wheat soup spiced with coriander and tomato.", price: 7, category: "Starters", visible: true },
      { restaurantId: leBerbere.id, name: "Mixed Grill", description: "Selection of merguez, kefta, lamb chops and chicken thighs, all wood-fired and served with roasted vegetables.", price: 34, category: "Mains", visible: true },
      { restaurantId: leBerbere.id, name: "Tagine Agneau aux Pruneaux", description: "Slow-braised lamb with prunes, almonds and honey — a classic Berber tagine.", price: 26, category: "Mains", visible: true },
      { restaurantId: leBerbere.id, name: "Assiette Végétarienne", description: "Grilled seasonal vegetables, charmoula, quinoa and olive oil.", price: 18, category: "Mains", visible: true },
      { restaurantId: leBerbere.id, name: "Bastilla au Lait", description: "Flaky pastry layered with milk cream and toasted almonds.", price: 8, category: "Desserts", visible: true },
    ],
  });

  await prisma.restaurantHours.createMany({
    data: [
      { restaurantId: leBerbere.id, day: "Monday",    opening: "12:00", closing: "22:30", isClosed: false },
      { restaurantId: leBerbere.id, day: "Tuesday",   opening: "12:00", closing: "22:30", isClosed: false },
      { restaurantId: leBerbere.id, day: "Wednesday", opening: "12:00", closing: "22:30", isClosed: false },
      { restaurantId: leBerbere.id, day: "Thursday",  opening: "12:00", closing: "22:30", isClosed: false },
      { restaurantId: leBerbere.id, day: "Friday",    opening: "18:00", closing: "23:00", isClosed: false },
      { restaurantId: leBerbere.id, day: "Saturday",  opening: "12:00", closing: "23:00", isClosed: false },
      { restaurantId: leBerbere.id, day: "Sunday",    isClosed: true },
    ],
  });
  const leBerbereImgUrls = restaurantImages["le-berbere-djerba"] ?? [];
  const leBerbereImgEx = await prisma.images.count({ where: { restaurantId: leBerbere.id } });
  if (leBerbereImgEx === 0 && leBerbereImgUrls.length > 0) {
    await prisma.images.createMany({ data: leBerbereImgUrls.map((url) => ({ url, restaurantId: leBerbere.id })) });
  }

  // Dubai restaurant 1 — Middle Eastern fine dining
  const spiceRoute = await prisma.restaurant.upsert({
    where: { slug: "the-spice-route-dubai" },
    update: { foodTypes: ["grill", "seafood"], dietTypes: ["halal"], attributes: ["romantic", "panoramic_view", "private_dining", "air_conditioned", "parking"] },
    create: {
      slug: "the-spice-route-dubai",
      name: "The Spice Route",
      arabicName: "طريق التوابل",
      description: "An upscale Middle Eastern and Lebanese restaurant in Downtown Dubai with views of the Burj Khalifa fountain. The menu draws on Levantine, Gulf and Persian traditions — mezze, slow-cooked meats, and a legendary mixed grill platter.",
      arabicDescription: "مطعم شرق أوسطي ولبناني راقٍ في وسط مدينة دبي مع إطلالات على نافورة برج خليفة. تستلهم القائمة من التقاليد الشامية وتقاليد الخليج والفارسية — المازة واللحوم المطهوة ببطء وطبق المشاوي المشهور.",
      phone: "+971 4 888 5500",
      type: "RESTAURANT",
      category: "Middle Eastern",
      meals: "Lunch, Dinner",
      foodTypes: ["grill", "seafood"],
      dietTypes: ["halal"],
      attributes: ["romantic", "panoramic_view", "private_dining", "air_conditioned", "parking"],
      country: "UAE",
      city: "Dubai",
      address: "Mohammed Bin Rashid Blvd, Downtown Dubai",
      reservationsEnabled: true,
      maxGuests: 120,
      tables: 24,
      featuredInHome: true,
      profileId: DUBAI_PROFILE_ID,
      destinationId: dubai!.id,
    },
  });

  await prisma.restaurantMenu.deleteMany({ where: { restaurantId: spiceRoute.id } });
  await prisma.restaurantHours.deleteMany({ where: { restaurantId: spiceRoute.id } });
  await prisma.restaurantMenu.createMany({
    data: [
      { restaurantId: spiceRoute.id, name: "Mezze Platter", description: "Hummus, baba ganoush, tabbouleh, fattoush, kibbeh and warm pita for two.", price: 55, category: "Starters", visible: true },
      { restaurantId: spiceRoute.id, name: "Lamb Ouzi", description: "Whole slow-roasted lamb leg on saffron rice with toasted nuts and crispy onions.", price: 95, category: "Mains", visible: true },
      { restaurantId: spiceRoute.id, name: "Mixed Grill Royal", description: "Prime kebabs, kofta, shish tawook and lamb chops served with garlic sauce and bread.", price: 85, category: "Mains", visible: true },
      { restaurantId: spiceRoute.id, name: "Sea Bass Chermoula", description: "Grilled whole sea bass with North African chermoula marinade and roasted vegetables.", price: 78, category: "Mains", visible: true },
      { restaurantId: spiceRoute.id, name: "Knafeh", description: "Warm shredded pastry filled with white cheese, soaked in rose-water syrup and crushed pistachios.", price: 32, category: "Desserts", visible: true },
      { restaurantId: spiceRoute.id, name: "Umm Ali", description: "Traditional Egyptian bread pudding with cream, nuts and raisins.", price: 28, category: "Desserts", visible: true },
      { restaurantId: spiceRoute.id, name: "Fresh Jallab", description: "Grape juice, rose water and pomegranate over ice, topped with pine nuts.", price: 22, category: "Drinks", visible: true },
    ],
  });

  await prisma.restaurantHours.createMany({
    data: [
      { restaurantId: spiceRoute.id, day: "Monday",    opening: "12:00", closing: "23:00", isClosed: false },
      { restaurantId: spiceRoute.id, day: "Tuesday",   opening: "12:00", closing: "23:00", isClosed: false },
      { restaurantId: spiceRoute.id, day: "Wednesday", opening: "12:00", closing: "23:00", isClosed: false },
      { restaurantId: spiceRoute.id, day: "Thursday",  opening: "12:00", closing: "23:30", isClosed: false },
      { restaurantId: spiceRoute.id, day: "Friday",    opening: "12:00", closing: "00:00", isClosed: false },
      { restaurantId: spiceRoute.id, day: "Saturday",  opening: "12:00", closing: "00:00", isClosed: false },
      { restaurantId: spiceRoute.id, day: "Sunday",    opening: "12:00", closing: "23:00", isClosed: false },
    ],
  });
  const spiceRouteImgUrls = restaurantImages["the-spice-route-dubai"] ?? [];
  const spiceRouteImgEx = await prisma.images.count({ where: { restaurantId: spiceRoute.id } });
  if (spiceRouteImgEx === 0 && spiceRouteImgUrls.length > 0) {
    await prisma.images.createMany({ data: spiceRouteImgUrls.map((url) => ({ url, restaurantId: spiceRoute.id })) });
  }

  // Dubai restaurant 2 — marina café
  const marinaCafe = await prisma.restaurant.upsert({
    where: { slug: "marina-cafe-lounge-dubai" },
    update: { foodTypes: ["cafe", "bakery"], dietTypes: ["vegetarian"], attributes: ["sea_view", "panoramic_view", "rooftop", "wifi", "cosy", "romantic", "air_conditioned"] },
    create: {
      slug: "marina-cafe-lounge-dubai",
      name: "Marina Café & Lounge",
      arabicName: "كافيه ولاونج المارينا",
      description: "A chic café and lounge overlooking Dubai Marina, perfect for brunch, afternoon coffee or sunset cocktails. Light Mediterranean bites, exceptional specialty coffee and a terrace that captures the best of the marina skyline.",
      arabicDescription: "مقهى وصالة أنيقة تطل على مرسى دبي، مثالية للغداء المتأخر أو قهوة بعد الظهر أو كوكتيلات الغروب. وجبات خفيفة متوسطية، قهوة متخصصة استثنائية وشرفة تلتقط أفضل ما في أفق المارينا.",
      phone: "+971 4 551 8800",
      type: "BOTH",
      category: "Café & Lounge",
      meals: "Breakfast, Lunch, Dinner",
      foodTypes: ["cafe", "bakery"],
      dietTypes: ["vegetarian"],
      attributes: ["sea_view", "panoramic_view", "rooftop", "wifi", "cosy", "romantic", "air_conditioned"],
      country: "UAE",
      city: "Dubai",
      address: "Dubai Marina Walk, Level 1",
      reservationsEnabled: true,
      maxGuests: 80,
      tables: 18,
      featuredInHome: true,
      profileId: DUBAI_PROFILE_ID,
      destinationId: dubai!.id,
    },
  });

  await prisma.restaurantMenu.deleteMany({ where: { restaurantId: marinaCafe.id } });
  await prisma.restaurantHours.deleteMany({ where: { restaurantId: marinaCafe.id } });
  await prisma.restaurantMenu.createMany({
    data: [
      { restaurantId: marinaCafe.id, name: "Eggs Benedict", description: "Poached eggs on toasted English muffin with Canadian bacon and hollandaise sauce.", price: 58, category: "Breakfast", visible: true },
      { restaurantId: marinaCafe.id, name: "Shakshuka", description: "Slow-cooked tomato and pepper sauce with baked eggs, feta and sourdough.", price: 52, category: "Breakfast", visible: true },
      { restaurantId: marinaCafe.id, name: "Burrata & Tomato", description: "Creamy burrata with heritage tomatoes, basil oil and sea salt.", price: 65, category: "Light Bites", visible: true },
      { restaurantId: marinaCafe.id, name: "Truffle Fries", description: "Hand-cut fries tossed in truffle oil, parmesan and chives.", price: 42, category: "Light Bites", visible: true },
      { restaurantId: marinaCafe.id, name: "Signature Flat White", description: "Double ristretto with microfoam — our most-ordered coffee.", price: 22, category: "Drinks", visible: true },
      { restaurantId: marinaCafe.id, name: "Watermelon Mint Cooler", description: "Fresh watermelon juice with mint, lime and a pinch of sea salt.", price: 28, category: "Drinks", visible: true },
    ],
  });

  await prisma.restaurantHours.createMany({
    data: [
      { restaurantId: marinaCafe.id, day: "Monday",    opening: "08:00", closing: "23:00", isClosed: false },
      { restaurantId: marinaCafe.id, day: "Tuesday",   opening: "08:00", closing: "23:00", isClosed: false },
      { restaurantId: marinaCafe.id, day: "Wednesday", opening: "08:00", closing: "23:00", isClosed: false },
      { restaurantId: marinaCafe.id, day: "Thursday",  opening: "08:00", closing: "00:00", isClosed: false },
      { restaurantId: marinaCafe.id, day: "Friday",    opening: "07:00", closing: "00:00", isClosed: false },
      { restaurantId: marinaCafe.id, day: "Saturday",  opening: "07:00", closing: "00:00", isClosed: false },
      { restaurantId: marinaCafe.id, day: "Sunday",    opening: "08:00", closing: "23:00", isClosed: false },
    ],
  });
  const marinaCafeImgUrls = restaurantImages["marina-cafe-lounge-dubai"] ?? [];
  const marinaCafeImgEx = await prisma.images.count({ where: { restaurantId: marinaCafe.id } });
  if (marinaCafeImgEx === 0 && marinaCafeImgUrls.length > 0) {
    await prisma.images.createMany({ data: marinaCafeImgUrls.map((url) => ({ url, restaurantId: marinaCafe.id })) });
  }

  // Dubai restaurant 3 — Emirati heritage
  const alFanar = await prisma.restaurant.upsert({
    where: { slug: "al-fanar-dubai" },
    update: { foodTypes: ["seafood", "grill"], dietTypes: ["halal"], attributes: ["quiet", "cosy", "family_friendly", "children_menu", "parking", "air_conditioned"] },
    create: {
      slug: "al-fanar-dubai",
      name: "Al Fanar",
      arabicName: "الفنار",
      description: "Step into old Dubai at Al Fanar, a heritage Emirati restaurant styled like a 1960s fishing village. Authentic local recipes passed down through generations — machboos, harees, luqaimat — served in a warm, lantern-lit setting.",
      arabicDescription: "استقدم نفسك إلى دبي القديمة في الفنار، مطعم إماراتي تراثي مصمم كقرية صيد في ستينيات القرن الماضي. وصفات محلية أصيلة متوارثة عبر الأجيال — مجبوس وهريسة ولقيمات — تُقدَّم في أجواء دافئة مضاءة بالفوانيس.",
      phone: "+971 4 702 3500",
      type: "RESTAURANT",
      category: "Emirati",
      meals: "Lunch, Dinner",
      foodTypes: ["seafood", "grill"],
      dietTypes: ["halal"],
      attributes: ["quiet", "cosy", "family_friendly", "children_menu", "parking", "air_conditioned"],
      country: "UAE",
      city: "Dubai",
      address: "Festival City Mall, Waterfront",
      reservationsEnabled: true,
      maxGuests: 100,
      tables: 20,
      featuredInHome: false,
      profileId: DUBAI_PROFILE_ID,
      destinationId: dubai!.id,
    },
  });

  await prisma.restaurantMenu.deleteMany({ where: { restaurantId: alFanar.id } });
  await prisma.restaurantHours.deleteMany({ where: { restaurantId: alFanar.id } });
  await prisma.restaurantMenu.createMany({
    data: [
      { restaurantId: alFanar.id, name: "Harees", description: "Slow-cooked wheat and chicken blended to a silky porridge — an Emirati staple served with ghee.", price: 45, category: "Starters", visible: true },
      { restaurantId: alFanar.id, name: "Machboos Laham", description: "Fragrant long-grain rice with slow-cooked spiced lamb, dried lemon and caramelised onions.", price: 75, category: "Mains", visible: true },
      { restaurantId: alFanar.id, name: "Samak Mashwi", description: "Whole grilled fish marinated in Emirati spices and served with rice and salad.", price: 88, category: "Mains", visible: true },
      { restaurantId: alFanar.id, name: "Luqaimat", description: "Golden dough balls drizzled with date syrup and sesame — a beloved Emirati sweet.", price: 30, category: "Desserts", visible: true },
      { restaurantId: alFanar.id, name: "Karak Chai", description: "Strong, spiced tea brewed with condensed milk — the UAE's most beloved drink.", price: 15, category: "Drinks", visible: true },
    ],
  });

  await prisma.restaurantHours.createMany({
    data: [
      { restaurantId: alFanar.id, day: "Monday",    opening: "12:00", closing: "23:00", isClosed: false },
      { restaurantId: alFanar.id, day: "Tuesday",   opening: "12:00", closing: "23:00", isClosed: false },
      { restaurantId: alFanar.id, day: "Wednesday", opening: "12:00", closing: "23:00", isClosed: false },
      { restaurantId: alFanar.id, day: "Thursday",  opening: "12:00", closing: "23:30", isClosed: false },
      { restaurantId: alFanar.id, day: "Friday",    opening: "12:30", closing: "00:00", isClosed: false },
      { restaurantId: alFanar.id, day: "Saturday",  opening: "12:00", closing: "00:00", isClosed: false },
      { restaurantId: alFanar.id, day: "Sunday",    opening: "12:00", closing: "23:00", isClosed: false },
    ],
  });
  const alFanarImgUrls = restaurantImages["al-fanar-dubai"] ?? [];
  const alFanarImgEx = await prisma.images.count({ where: { restaurantId: alFanar.id } });
  if (alFanarImgEx === 0 && alFanarImgUrls.length > 0) {
    await prisma.images.createMany({ data: alFanarImgUrls.map((url) => ({ url, restaurantId: alFanar.id })) });
  }

  console.log("  ✓ 6 restaurants created (3 Djerba + 3 Dubai)");

  // ── 11. Passes ─────────────────────────────────────────────────────────────
  console.log("\nSeeding passes...");

  // Fetch activity IDs for seeding relations
  const [passActCamel, passActSnorkel, passActQuad, passActKayak, passActCook,
         passActDesert, passActBurj, passActCruise, passActSki] = await Promise.all([
    prisma.activity.findUnique({ where: { slug: "djerba-camel-ride-beach" } }),
    prisma.activity.findUnique({ where: { slug: "djerba-snorkeling-tour" } }),
    prisma.activity.findUnique({ where: { slug: "djerba-quad-biking" } }),
    prisma.activity.findUnique({ where: { slug: "djerba-sea-kayaking" } }),
    prisma.activity.findUnique({ where: { slug: "djerba-cooking-class" } }),
    prisma.activity.findUnique({ where: { slug: "dubai-desert-safari" } }),
    prisma.activity.findUnique({ where: { slug: "dubai-burj-khalifa-tour" } }),
    prisma.activity.findUnique({ where: { slug: "dubai-dhow-cruise-marina" } }),
    prisma.activity.findUnique({ where: { slug: "dubai-indoor-skiing" } }),
  ]);

  // Djerba Explorer Pass
  const djerbaExplorer = await prisma.pass.upsert({
    where: { passKey: "djerba-explorer" },
    update: {},
    create: {
      passKey:          "djerba-explorer",
      name:             "Djerba Explorer Pass",
      arabicName:       "باقة مستكشف جربة",
      description:      "The perfect introduction to Djerba. Includes a camel ride, snorkeling tour, and your choice of one more adventure.",
      arabicDescription:"المقدمة المثالية لجربة. تشمل ركوب الجمال وجولة الغطس واختيار مغامرة أخرى.",
      price:            180,
      discount:         10,
      popular:          true,
      optionalCount:    1,
      destinationId:    djerba!.id,
    },
  });

  // Set fixed + optional activities for Djerba Explorer
  if (passActCamel && passActSnorkel && passActQuad && passActKayak && passActCook) {
    await prisma.pass.update({
      where: { passKey: "djerba-explorer" },
      data: {
        fixedActivities:    { set: [{ id: passActCamel.id }, { id: passActSnorkel.id }] },
        optionalActivities: { set: [{ id: passActQuad.id }, { id: passActKayak.id }, { id: passActCook.id }] },
      },
    });
  }
  console.log(`  ✓ ${djerbaExplorer.name}`);

  // Djerba Full Experience
  const djerbaFull = await prisma.pass.upsert({
    where: { passKey: "djerba-full-experience" },
    update: {},
    create: {
      passKey:          "djerba-full-experience",
      name:             "Djerba Full Experience",
      arabicName:       "تجربة جربة الكاملة",
      description:      "Go deeper into Djerba. All four signature activities included — no compromises.",
      arabicDescription:"انغمس أكثر في جربة. تشمل جميع الأنشطة الأربعة المميزة بدون تنازلات.",
      price:            290,
      discount:         15,
      popular:          false,
      optionalCount:    0,
      destinationId:    djerba!.id,
    },
  });

  if (passActCamel && passActSnorkel && passActQuad && passActKayak) {
    await prisma.pass.update({
      where: { passKey: "djerba-full-experience" },
      data: {
        fixedActivities: { set: [{ id: passActCamel.id }, { id: passActSnorkel.id }, { id: passActQuad.id }, { id: passActKayak.id }] },
      },
    });
  }
  console.log(`  ✓ ${djerbaFull.name}`);

  // Dubai Highlights Pass
  const dubaiHighlights = await prisma.pass.upsert({
    where: { passKey: "dubai-highlights" },
    update: {},
    create: {
      passKey:          "dubai-highlights",
      name:             "Dubai Highlights Pass",
      arabicName:       "باقة معالم دبي",
      description:      "See the best of Dubai in one pass — desert safari, Burj Khalifa, and one more experience of your choice.",
      arabicDescription:"اكتشف أفضل ما في دبي — سفاري الصحراء وبرج خليفة وتجربة إضافية من اختيارك.",
      price:            520,
      discount:         12,
      popular:          true,
      optionalCount:    1,
      destinationId:    dubai!.id,
    },
  });

  if (passActDesert && passActBurj && passActCruise && passActSki) {
    await prisma.pass.update({
      where: { passKey: "dubai-highlights" },
      data: {
        fixedActivities:    { set: [{ id: passActDesert.id }, { id: passActBurj.id }] },
        optionalActivities: { set: [{ id: passActCruise.id }, { id: passActSki.id }] },
      },
    });
  }
  console.log(`  ✓ ${dubaiHighlights.name}`);

  console.log("  ✓ 3 passes seeded (2 Djerba + 1 Dubai)");

  // ── Rentals ──────────────────────────────────────────────────────────────────
  console.log("\nSeeding rentals...");
  const djerbaDest = await prisma.destination.findUnique({ where: { slug: "djerba" } });
  const dubaiDest  = await prisma.destination.findUnique({ where: { slug: "dubai" } });

  const djerbaRentals = [
    {
      slug:             "toyota-corolla-djerba",
      title:            "Toyota Corolla 2022 — Automatic",
      description:      "Well-maintained automatic sedan, perfect for exploring Djerba at your own pace. Air conditioning, GPS navigation, and full insurance included. Pickup available at Djerba-Zarzis airport or central Houmt Souk.",
      type:             "CAR" as const,
      pricePerDay:      120,
      pricePerHour:     20,
      minDays:          1,
      capacity:         5,
      brand:            "Toyota",
      model:            "Corolla",
      year:             2022,
      color:            "White",
      transmission:     "Automatic",
      fuelType:         "Petrol",
      hasAC:            true,
      hasGPS:           true,
      hasInsurance:     true,
      requiresLicense:  true,
      country:          "Tunisia",
      region:           "Médenine",
      city:             "Djerba",
      featuredInHome:   true,
    },
    {
      slug:             "scooter-50cc-djerba",
      title:            "Scooter 50cc — No license needed",
      description:      "Lightweight 50cc scooter, ideal for navigating Djerba's narrow medina streets and beach roads. Helmet included. No driving license required. Perfect for solo travelers.",
      type:             "SCOOTER" as const,
      pricePerDay:      40,
      pricePerHour:     8,
      minDays:          1,
      capacity:         1,
      brand:            "Yamaha",
      model:            "Neo",
      year:             2021,
      color:            "Red",
      transmission:     "Automatic",
      fuelType:         "Petrol",
      hasAC:            false,
      hasGPS:           false,
      hasInsurance:     true,
      requiresLicense:  false,
      country:          "Tunisia",
      region:           "Médenine",
      city:             "Djerba",
      featuredInHome:   false,
    },
    {
      slug:             "fishing-boat-djerba",
      title:            "Traditional Fishing Boat — Half Day",
      description:      "Authentic wooden fishing boat with experienced local captain. Explore the lagoon, visit Flamingo Island, and enjoy the turquoise waters of the Mediterranean. Life jackets provided.",
      type:             "BOAT" as const,
      pricePerDay:      300,
      minDays:          1,
      capacity:         8,
      brand:            "Traditional",
      model:            "Felucca",
      year:             2019,
      color:            "Blue & White",
      hasAC:            false,
      hasGPS:           false,
      hasInsurance:     true,
      requiresLicense:  false,
      country:          "Tunisia",
      region:           "Médenine",
      city:             "Djerba",
      featuredInHome:   true,
    },
  ];

  const dubaiRentals = [
    {
      slug:             "bmw-5-series-dubai",
      title:            "BMW 5 Series 2023 — Automatic",
      description:      "Luxury sedan for those who want to experience Dubai in style. Panoramic sunroof, leather seats, full GPS and insurance. Perfect for business trips or leisure drives along Sheikh Zayed Road.",
      type:             "CAR" as const,
      pricePerDay:      450,
      pricePerHour:     80,
      minDays:          1,
      capacity:         5,
      brand:            "BMW",
      model:            "5 Series",
      year:             2023,
      color:            "Black",
      transmission:     "Automatic",
      fuelType:         "Petrol",
      hasAC:            true,
      hasGPS:           true,
      hasInsurance:     true,
      requiresLicense:  true,
      country:          "UAE",
      region:           "Dubai",
      city:             "Dubai",
      featuredInHome:   true,
    },
    {
      slug:             "electric-bike-dubai-marina",
      title:            "Electric Bike — Dubai Marina",
      description:      "Eco-friendly e-bike for exploring Dubai Marina, JBR Walk, and Bluewaters Island. Battery range of 60km, helmet and lock included. Great for morning rides or sunset tours along the waterfront.",
      type:             "BICYCLE" as const,
      pricePerDay:      80,
      pricePerHour:     15,
      minDays:          1,
      capacity:         1,
      brand:            "Trek",
      model:            "PowerFly",
      year:             2022,
      color:            "Silver",
      hasAC:            false,
      hasGPS:           false,
      hasInsurance:     false,
      requiresLicense:  false,
      country:          "UAE",
      region:           "Dubai",
      city:             "Dubai",
      featuredInHome:   false,
    },
    {
      slug:             "speedboat-dubai-marina",
      title:            "Speedboat — Dubai Marina Tours",
      description:      "Modern speedboat for touring the iconic Dubai coastline. Cruise past the Burj Al Arab, Palm Jumeirah, and Atlantis. Captain and crew included. Snorkeling gear available on request.",
      type:             "BOAT" as const,
      pricePerDay:      800,
      minDays:          1,
      capacity:         10,
      brand:            "Sunseeker",
      model:            "Predator 55",
      year:             2021,
      color:            "White",
      hasAC:            true,
      hasGPS:           true,
      hasInsurance:     true,
      requiresLicense:  false,
      country:          "UAE",
      region:           "Dubai",
      city:             "Dubai",
      featuredInHome:   true,
    },
  ];

  for (const rental of djerbaRentals) {
    const createdRental = await prisma.rental.upsert({
      where:  { slug: rental.slug },
      update: { ...rental, status: "ACTIVE", profileId: DJERBA_PROFILE_ID, destinationId: djerbaDest!.id },
      create: { ...rental, status: "ACTIVE", profileId: DJERBA_PROFILE_ID, destinationId: djerbaDest!.id },
    });
    const rentalUrls = rentalImages[rental.slug] ?? [];
    const rentalImgEx = await prisma.images.count({ where: { rentalId: createdRental.id } });
    if (rentalImgEx === 0 && rentalUrls.length > 0) {
      await prisma.images.createMany({ data: rentalUrls.map((url) => ({ url, rentalId: createdRental.id })) });
    }
    console.log(`  ✓ ${rental.title}`);
  }

  for (const rental of dubaiRentals) {
    const createdRental = await prisma.rental.upsert({
      where:  { slug: rental.slug },
      update: { ...rental, status: "ACTIVE", profileId: DUBAI_PROFILE_ID, destinationId: dubaiDest!.id },
      create: { ...rental, status: "ACTIVE", profileId: DUBAI_PROFILE_ID, destinationId: dubaiDest!.id },
    });
    const rentalUrls = rentalImages[rental.slug] ?? [];
    const rentalImgEx = await prisma.images.count({ where: { rentalId: createdRental.id } });
    if (rentalImgEx === 0 && rentalUrls.length > 0) {
      await prisma.images.createMany({ data: rentalUrls.map((url) => ({ url, rentalId: createdRental.id })) });
    }
    console.log(`  ✓ ${rental.title}`);
  }

  // ─── SHOPS ──────────────────────────────────────────────────────────────────
  console.log("\n── Shops ──");

  // Djerba shops
  const djerbaShop1Data = {
    name:              "Artisanat Djerba",
    arabicName:        "حرف جربة",
    description:       "A curated selection of handmade crafts from local Djerba artisans — ceramics, woven baskets, embroidered textiles, and olive wood pieces. Every item tells a story of the island.",
    arabicDescription: "مجموعة مختارة من الحرف اليدوية المصنوعة من قِبَل حرفيين محليين من جربة — فخار وسلال منسوجة ومنسوجات مطرزة وقطع من خشب الزيتون.",
    category:          "crafts",
    country:           "Tunisia",
    region:            "Djerba",
    city:              "Houmt Souk",
    address:           "Souk el Attarine, Houmt Souk",
    location:          "https://maps.google.com/?q=Souk+el+Attarine+Houmt+Souk+Djerba",
    coverPhoto:        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800",
    logo:              "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=200",
    note:              "4.8",
    nbReviews:         24,
    status:            "ACTIVE" as const,
    isOpen:            true,
    featuredInHome:    true,
    deliveryMethods:   ["PICKUP", "DELIVERY"] as const,
    deliveryFee:       500,
    freeShippingAbove: 150,
    profileId:         DJERBA_PROFILE_ID,
    destinationId:     djerbaDest!.id,
  };
  const djerbaShop1 = await prisma.shop.upsert({
    where:  { slug: "artisanat-djerba" },
    update: djerbaShop1Data,
    create: { slug: "artisanat-djerba", ...djerbaShop1Data },
  });
  console.log("  ✓ Artisanat Djerba");

  const djerbaShop2Data = {
    name:              "Épicerie du Sahel",
    arabicName:        "بقالة الساحل",
    description:       "Authentic Tunisian pantry essentials — harissa, dried rose petals, spice blends, organic olive oil, and seasonal local produce. Sourced directly from Tunisian farmers and cooperatives.",
    arabicDescription: "أساسيات المطبخ التونسي الأصيلة — هريسة وبتلات الورد المجففة وخلطات التوابل وزيت الزيتون العضوي.",
    category:          "spices",
    country:           "Tunisia",
    region:            "Djerba",
    city:              "Midoun",
    address:           "Marché Central, Midoun",
    location:          "https://maps.google.com/?q=Marche+Central+Midoun+Djerba",
    coverPhoto:        "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800",
    logo:              "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200",
    note:              "4.6",
    nbReviews:         18,
    status:            "ACTIVE" as const,
    isOpen:            true,
    featuredInHome:    false,
    deliveryMethods:   ["PICKUP", "DELIVERY"] as const,
    deliveryFee:       300,
    freeShippingAbove: 200,
    profileId:         DJERBA_PROFILE_ID,
    destinationId:     djerbaDest!.id,
  };
  const djerbaShop2 = await prisma.shop.upsert({
    where:  { slug: "epicerie-du-sahel" },
    update: djerbaShop2Data,
    create: { slug: "epicerie-du-sahel", ...djerbaShop2Data },
  });
  console.log("  ✓ Épicerie du Sahel");

  const djerbaShop3Data = {
    name:              "La Soierie de Houmt Souk",
    arabicName:        "دار النسيج في حومة السوق",
    description:       "Handloomed Tunisian textiles — wool blankets, silk scarves, traditional fouta towels, and embroidered table runners. All pieces are woven on traditional looms by local weavers.",
    arabicDescription: "منسوجات تونسية منسوجة يدوياً — بطانيات صوفية وأوشحة حرير ومناشف فوطة تقليدية.",
    category:          "textiles",
    country:           "Tunisia",
    region:            "Djerba",
    city:              "Houmt Souk",
    address:           "Rue de l'Artisanat, Houmt Souk",
    location:          "https://maps.google.com/?q=Rue+Artisanat+Houmt+Souk+Djerba",
    coverPhoto:        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
    logo:              "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200",
    note:              "4.7",
    nbReviews:         15,
    status:            "ACTIVE" as const,
    isOpen:            true,
    featuredInHome:    false,
    deliveryMethods:   ["PICKUP", "DELIVERY"] as const,
    deliveryFee:       800,
    freeShippingAbove: 300,
    profileId:         DJERBA_PROFILE_ID,
    destinationId:     djerbaDest!.id,
  };
  const djerbaShop3 = await prisma.shop.upsert({
    where:  { slug: "soierie-houmt-souk" },
    update: djerbaShop3Data,
    create: { slug: "soierie-houmt-souk", ...djerbaShop3Data },
  });
  console.log("  ✓ La Soierie de Houmt Souk");

  // Dubai shops
  const dubaiShop1Data = {
    name:              "The Souk Collective",
    arabicName:        "مجمع السوق",
    description:       "A curated marketplace bringing together Dubai's finest artisan crafts — oud incense, hand-painted figurines, Arabic calligraphy prints, and mother-of-pearl pieces. A perfect stop for authentic souvenirs.",
    arabicDescription: "سوق منتقى يجمع أفضل الحرف اليدوية في دبي — بخور عود وتماثيل مرسومة يدوياً ولوحات خط عربي.",
    category:          "crafts",
    country:           "UAE",
    region:            "Dubai",
    city:              "Dubai",
    address:           "Al Fahidi Historical Neighbourhood, Bur Dubai",
    location:          "https://maps.google.com/?q=Al+Fahidi+Historical+Neighbourhood+Dubai",
    coverPhoto:        "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800",
    logo:              "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=200",
    note:              "4.9",
    nbReviews:         41,
    status:            "ACTIVE" as const,
    isOpen:            true,
    featuredInHome:    true,
    deliveryMethods:   ["PICKUP", "DELIVERY"] as const,
    deliveryFee:       1500,
    freeShippingAbove: 500,
    profileId:         DUBAI_PROFILE_ID,
    destinationId:     dubaiDest!.id,
  };
  const dubaiShop1 = await prisma.shop.upsert({
    where:  { slug: "the-souk-collective" },
    update: dubaiShop1Data,
    create: { slug: "the-souk-collective", ...dubaiShop1Data },
  });
  console.log("  ✓ The Souk Collective");

  const dubaiShop2Data = {
    name:              "Desert Spice Market",
    arabicName:        "سوق توابل الصحراء",
    description:       "Premium Middle Eastern spices sourced directly from regional farms — saffron threads, sumac, za'atar, baharat, and hand-blended spice mixes. Everything a home chef needs to recreate authentic flavours.",
    arabicDescription: "توابل الشرق الأوسط الفاخرة من المزارع الإقليمية — خيوط الزعفران والسماق والزعتر وبهارات وخلطات التوابل.",
    category:          "spices",
    country:           "UAE",
    region:            "Dubai",
    city:              "Dubai",
    address:           "Spice Souk, Deira, Dubai",
    location:          "https://maps.google.com/?q=Spice+Souk+Deira+Dubai",
    coverPhoto:        "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800",
    note:              "4.7",
    nbReviews:         29,
    status:            "ACTIVE" as const,
    isOpen:            true,
    featuredInHome:    false,
    deliveryMethods:   ["PICKUP", "DELIVERY"] as const,
    deliveryFee:       1000,
    freeShippingAbove: 400,
    profileId:         DUBAI_PROFILE_ID,
    destinationId:     dubaiDest!.id,
  };
  const dubaiShop2 = await prisma.shop.upsert({
    where:  { slug: "desert-spice-market" },
    update: dubaiShop2Data,
    create: { slug: "desert-spice-market", ...dubaiShop2Data },
  });
  console.log("  ✓ Desert Spice Market");

  const dubaiShop3Data = {
    name:              "Nomad Leather",
    arabicName:        "نوماد للجلديات",
    description:       "Handcrafted leather goods made by skilled Dubai artisans — camel leather wallets, hand-stitched clutch bags, and premium belts. Every piece is unique and made to last.",
    arabicDescription: "منتجات جلدية مصنوعة يدوياً من قِبَل حرفيين مهرة في دبي — محافظ من جلد الإبل وحقائب مخيطة يدوياً وأحزمة فاخرة.",
    category:          "leather",
    country:           "UAE",
    region:            "Dubai",
    city:              "Dubai",
    address:           "Gold Souk Area, Deira, Dubai",
    location:          "https://maps.google.com/?q=Gold+Souk+Deira+Dubai",
    coverPhoto:        "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800",
    note:              "4.8",
    nbReviews:         22,
    status:            "ACTIVE" as const,
    isOpen:            true,
    featuredInHome:    false,
    deliveryMethods:   ["PICKUP", "DELIVERY"] as const,
    deliveryFee:       1200,
    minOrderAmount:    100,
    profileId:         DUBAI_PROFILE_ID,
    destinationId:     dubaiDest!.id,
  };
  const dubaiShop3 = await prisma.shop.upsert({
    where:  { slug: "nomad-leather-dubai" },
    update: dubaiShop3Data,
    create: { slug: "nomad-leather-dubai", ...dubaiShop3Data },
  });
  console.log("  ✓ Nomad Leather");

  // ─── SHOP HOURS ─────────────────────────────────────────────────────────────
  console.log("\n── Shop Hours ──");

  const DEFAULT_SHOP_HOURS = [
    { day: "Monday",    opening: "09:00", closing: "20:00", isClosed: false, isFullDayOpening: false },
    { day: "Tuesday",   opening: "09:00", closing: "20:00", isClosed: false, isFullDayOpening: false },
    { day: "Wednesday", opening: "09:00", closing: "20:00", isClosed: false, isFullDayOpening: false },
    { day: "Thursday",  opening: "09:00", closing: "20:00", isClosed: false, isFullDayOpening: false },
    { day: "Friday",    opening: null,    closing: null,    isClosed: true,  isFullDayOpening: false },
    { day: "Saturday",  opening: "09:00", closing: "22:00", isClosed: false, isFullDayOpening: false },
    { day: "Sunday",    opening: "10:00", closing: "18:00", isClosed: false, isFullDayOpening: false },
  ];

  for (const shop of [djerbaShop1, djerbaShop2, djerbaShop3, dubaiShop1, dubaiShop2, dubaiShop3]) {
    await prisma.shopHours.deleteMany({ where: { shopId: shop.id } });
    await prisma.shopHours.createMany({
      data: DEFAULT_SHOP_HOURS.map((h) => ({ ...h, shopId: shop.id })),
    });
  }
  console.log("  ✓ Shop hours seeded for 6 shops");

  // ─── PRODUCTS ───────────────────────────────────────────────────────────────
  console.log("\n── Products ──");

  // ── Artisanat Djerba — 9 products (crafts + ceramics + textiles)
  const djerbaProducts = [
    {
      slug: "berber-ceramic-bowl-djerba",
      name: "Berber Ceramic Bowl",
      arabicName: "طبق خزفي بربري",
      description: "Handcrafted ceramic bowl with traditional Berber geometric patterns. Hand-painted by local artisans using natural pigments. Perfect for serving or as a decorative piece.",
      arabicDescription: "طبق خزفي مصنوع يدوياً بزخارف هندسية بربرية تقليدية.",
      price: 45, comparePrice: 60,
      category: "ceramics", material: "Ceramic", origin: "Djerba, Tunisia", weight: 400, stock: 12,
      isHandmade: true, featured: true,
      tags: ["ceramic", "berber", "handmade", "souvenir", "djerba"],
      imageUrl: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600",
      shopId: djerbaShop1.id,
    },
    {
      slug: "hand-painted-tile-set-djerba",
      name: "Hand-painted Tile Set (6 pcs)",
      arabicName: "طقم بلاط مرسوم يدوياً (6 قطع)",
      description: "Set of 6 decorative tiles hand-painted with traditional Djerbian motifs — blue, white, and terracotta tones. Ideal for kitchen splashbacks or wall decoration.",
      arabicDescription: "طقم من 6 بلاطات زخرفية مرسومة يدوياً بزخارف جربية تقليدية.",
      price: 85,
      category: "ceramics", material: "Glazed ceramic", origin: "Djerba, Tunisia", weight: 1200, stock: 8,
      isHandmade: true,
      tags: ["tile", "ceramic", "handpainted", "djerba", "decor"],
      imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      shopId: djerbaShop1.id,
    },
    {
      slug: "woven-palm-basket-djerba",
      name: "Woven Palm Leaf Basket",
      arabicName: "سلة سعف النخيل المنسوجة",
      description: "Traditional basket woven from dried palm leaves by Djerban craftswomen. Lightweight and sturdy — great as a beach bag or market tote.",
      arabicDescription: "سلة تقليدية منسوجة من أوراق النخيل المجففة على يد حرفيات جربيات.",
      price: 30,
      category: "crafts", material: "Palm leaf", origin: "Djerba, Tunisia", weight: 200, stock: 20,
      isHandmade: true,
      tags: ["basket", "palm", "woven", "beach", "eco"],
      imageUrl: "https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=600",
      shopId: djerbaShop1.id,
    },
    {
      slug: "embroidered-cushion-cover-djerba",
      name: "Embroidered Cushion Cover",
      arabicName: "غطاء وسادة مطرز",
      description: "Vibrant cushion cover hand-embroidered with traditional Tunisian patterns. 45×45 cm. Each one is unique — slight variations are part of the handmade character.",
      arabicDescription: "غطاء وسادة نابض بالألوان مطرز يدوياً بزخارف تونسية تقليدية.",
      price: 38, comparePrice: 50,
      category: "textiles", material: "Cotton + silk thread", origin: "Djerba, Tunisia", weight: 150, stock: 15,
      isHandmade: true, featured: true,
      tags: ["cushion", "embroidery", "textile", "handmade"],
      imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600",
      shopId: djerbaShop1.id,
    },
    {
      slug: "olive-wood-serving-board-djerba",
      name: "Olive Wood Serving Board",
      arabicName: "لوح تقديم من خشب الزيتون",
      description: "Natural olive wood serving board with beautiful grain patterns. Each board is unique. Hand-finished with food-safe oil. Perfect for cheese, bread, or as a kitchen display piece.",
      arabicDescription: "لوح تقديم طبيعي من خشب الزيتون بأنماط حبوب جميلة. كل لوح فريد من نوعه.",
      price: 55,
      category: "crafts", material: "Olive wood", origin: "Djerba, Tunisia", weight: 600, stock: 10,
      isHandmade: true, featured: true,
      tags: ["olive wood", "serving board", "kitchen", "natural"],
      imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600",
      shopId: djerbaShop1.id,
    },
    {
      slug: "terracotta-vase-djerba",
      name: "Terracotta Vase",
      arabicName: "مزهرية فخارية",
      description: "Hand-thrown terracotta vase with an earthy, natural finish. Inspired by ancient Djerbian pottery traditions. Perfect for dried flowers or as a standalone decorative object.",
      arabicDescription: "مزهرية فخارية مصنوعة يدوياً بلمسة نهائية طبيعية ترابية. مستوحاة من تقاليد الفخار الجربي القديمة.",
      price: 40,
      category: "ceramics", material: "Terracotta", origin: "Djerba, Tunisia", weight: 500, stock: 9,
      isHandmade: true,
      tags: ["vase", "terracotta", "pottery", "decor", "djerba"],
      imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600",
      shopId: djerbaShop1.id,
    },
    {
      slug: "painted-wooden-jewellery-box-djerba",
      name: "Painted Wooden Jewellery Box",
      arabicName: "صندوق مجوهرات خشبي مطلي",
      description: "Small wooden jewellery box hand-painted with geometric Berber motifs in indigo and gold. Hinged lid, velvet-lined interior. A beautiful keepsake or gift.",
      arabicDescription: "صندوق مجوهرات خشبي صغير مطلي يدوياً بزخارف هندسية بربرية باللون النيلي والذهبي.",
      price: 48, comparePrice: 65,
      category: "crafts", material: "Wood + natural paint", origin: "Djerba, Tunisia", weight: 300, stock: 7,
      isHandmade: true,
      tags: ["jewellery box", "wooden", "painted", "berber", "gift"],
      imageUrl: "https://images.unsplash.com/photo-1561532178-5b6d89e0abd0?w=600",
      shopId: djerbaShop1.id,
    },
    {
      slug: "hand-knotted-rug-djerba",
      name: "Hand-knotted Kilim Rug (60×90 cm)",
      arabicName: "سجادة كيليم مربوطة يدوياً (60×90 سم)",
      description: "Small hand-knotted kilim rug in bold Berber colour combinations — red, black, and natural cream. 100% wool. Perfect as a wall hanging or accent rug.",
      arabicDescription: "سجادة كيليم صغيرة مربوطة يدوياً بمجموعات ألوان بربرية جريئة — أحمر وأسود وكريمي طبيعي.",
      price: 95, comparePrice: 120,
      category: "textiles", material: "100% wool", origin: "Djerba, Tunisia", weight: 800, stock: 5,
      isHandmade: true, featured: true,
      tags: ["rug", "kilim", "berber", "wool", "handknotted"],
      imageUrl: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600",
      shopId: djerbaShop1.id,
    },
    {
      slug: "ceramic-tagine-djerba",
      name: "Decorative Ceramic Tagine",
      arabicName: "طاجين خزفي زخرفي",
      description: "Hand-painted ceramic tagine with traditional Djerbian motifs. Suitable for serving cold dishes or as a decorative centrepiece. Not intended for direct heat.",
      arabicDescription: "طاجين خزفي مرسوم يدوياً بزخارف جربية تقليدية. مناسب لتقديم الأطباق الباردة أو كقطعة زخرفية.",
      price: 70,
      category: "ceramics", material: "Glazed ceramic", origin: "Djerba, Tunisia", weight: 900, stock: 6,
      isHandmade: true,
      tags: ["tagine", "ceramic", "decorative", "djerba", "kitchen"],
      imageUrl: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600",
      shopId: djerbaShop1.id,
    },
  ];

  // ── Épicerie du Sahel — 9 products (food, spices, wellness)
  const epicerieProducts = [
    {
      slug: "harissa-250g-djerba",
      name: "Traditional Harissa (250g)",
      arabicName: "هريسة تقليدية (250 غ)",
      description: "Authentic Tunisian harissa paste made from sun-dried red peppers, garlic, olive oil, and spices. Medium heat. A staple of Tunisian cuisine.",
      arabicDescription: "معجون الهريسة التونسية الأصيلة مصنوع من الفلفل الأحمر المجفف بالشمس والثوم وزيت الزيتون والتوابل.",
      price: 18,
      category: "food_drink", origin: "Tunisia", weight: 300, stock: 30,
      isHandmade: false, featured: true,
      tags: ["harissa", "condiment", "spicy", "tunisian", "food"],
      imageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600",
      shopId: djerbaShop2.id,
    },
    {
      slug: "tabil-spice-mix-djerba",
      name: "Tabil Spice Blend (100g)",
      arabicName: "خلطة تابل (100 غ)",
      description: "Classic Tunisian tabil — a fragrant blend of coriander, caraway, garlic, and chilli. The secret ingredient in most Tunisian dishes. Freshly ground.",
      arabicDescription: "تابل تونسي كلاسيكي — مزيج عطري من الكزبرة والكراوية والثوم والفلفل الحار.",
      price: 12,
      category: "food_drink", origin: "Tunisia", weight: 120, stock: 40,
      isHandmade: false,
      tags: ["spice", "tabil", "tunisian", "seasoning"],
      imageUrl: "https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=600",
      shopId: djerbaShop2.id,
    },
    {
      slug: "organic-olive-oil-500ml-djerba",
      name: "Organic Olive Oil (500ml)",
      arabicName: "زيت زيتون عضوي (500 مل)",
      description: "First cold-press extra virgin olive oil from Djerba's ancient olive groves. Certified organic. Rich, fruity flavour with low acidity. A Tunisian national treasure.",
      arabicDescription: "زيت الزيتون البكر الممتاز من أول ضغط بارد من بساتين الزيتون القديمة في جربة. عضوي معتمد.",
      price: 28, comparePrice: 35,
      category: "food_drink", origin: "Djerba, Tunisia", weight: 600, stock: 25,
      isHandmade: false, featured: true,
      tags: ["olive oil", "organic", "djerba", "cooking"],
      imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600",
      shopId: djerbaShop2.id,
    },
    {
      slug: "dried-rose-petals-djerba",
      name: "Dried Rose Petals (50g)",
      arabicName: "بتلات الورد المجففة (50 غ)",
      description: "Fragrant dried rose petals from Tunisian gardens — used in teas, desserts, and cooking. Also beautiful as a natural home fragrance or bath soak.",
      arabicDescription: "بتلات ورد مجففة عطرة من الحدائق التونسية — تستخدم في الشاي والحلويات والطبخ.",
      price: 14,
      category: "wellness", origin: "Tunisia", weight: 80, stock: 20,
      isHandmade: false,
      tags: ["rose", "tea", "wellness", "fragrance", "natural"],
      imageUrl: "https://images.unsplash.com/photo-1548438294-1ad5d5f4f063?w=600",
      shopId: djerbaShop2.id,
    },
    {
      slug: "djerba-wildflower-honey-djerba",
      name: "Djerba Wildflower Honey (350g)",
      arabicName: "عسل الأزهار البرية من جربة (350 غ)",
      description: "Raw, unfiltered wildflower honey from Djerba's coastal hives. Light floral aroma, golden colour, and a clean sweet finish. Harvested twice yearly by local beekeepers.",
      arabicDescription: "عسل الأزهار البرية الخام غير المصفى من خلايا النحل الساحلية في جربة.",
      price: 22,
      category: "food_drink", origin: "Djerba, Tunisia", weight: 400, stock: 18,
      isHandmade: false,
      tags: ["honey", "raw", "natural", "djerba", "local"],
      imageUrl: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600",
      shopId: djerbaShop2.id,
    },
    {
      slug: "fig-jam-djerba",
      name: "Homemade Fig Jam (200g)",
      arabicName: "مربى التين البيتي (200 غ)",
      description: "Artisanal fig jam made from Djerba's sun-ripened figs, sugar, and a squeeze of lemon. No preservatives, no additives. Pairs perfectly with fresh bread, cheese, or yogurt.",
      arabicDescription: "مربى التين الحرفية مصنوعة من تين جربة الناضج بالشمس والسكر وعصير الليمون. بدون مواد حافظة.",
      price: 16,
      category: "food_drink", origin: "Djerba, Tunisia", weight: 250, stock: 22,
      isHandmade: true,
      tags: ["jam", "fig", "homemade", "artisan", "local"],
      imageUrl: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600",
      shopId: djerbaShop2.id,
    },
    {
      slug: "spearmint-tea-blend-djerba",
      name: "Spearmint & Green Tea Blend (80g)",
      arabicName: "خلطة النعناع والشاي الأخضر (80 غ)",
      description: "Classic Tunisian afternoon tea blend — spearmint, green tea, and a touch of dried verbena. Brew strong, sweeten with sugar, and serve in small glasses. The taste of Djerba hospitality.",
      arabicDescription: "خلطة الشاي التونسي الكلاسيكية للعصر — نعناع وشاي أخضر ولمسة من الليمون المجفف.",
      price: 10,
      category: "food_drink", origin: "Tunisia", weight: 100, stock: 35,
      isHandmade: false,
      tags: ["tea", "mint", "tunisian", "herbal", "drink"],
      imageUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600",
      shopId: djerbaShop2.id,
    },
    {
      slug: "argan-oil-djerba",
      name: "Pure Argan Oil (100ml)",
      arabicName: "زيت الأرغان النقي (100 مل)",
      description: "Cold-pressed culinary argan oil from the Maghreb. Nutty, rich flavour — drizzle over salads, couscous, or use as a dipping oil. Also prized for skin and hair care.",
      arabicDescription: "زيت الأرغان الغذائي المعصور على البارد من المغرب العربي. نكهة غنية بالمكسرات.",
      price: 32, comparePrice: 42,
      category: "wellness", origin: "Morocco (via Tunisia)", weight: 150, stock: 12,
      isHandmade: false, featured: true,
      tags: ["argan", "oil", "organic", "beauty", "cooking"],
      imageUrl: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600",
      shopId: djerbaShop2.id,
    },
    {
      slug: "couscous-semolina-djerba",
      name: "Fine Couscous Semolina (500g)",
      arabicName: "سميد الكسكسي الناعم (500 غ)",
      description: "Stone-ground fine semolina for making traditional Tunisian couscous. Sourced from durum wheat grown in the Sahel. Cook in a traditional couscoussier for best results.",
      arabicDescription: "سميد ناعم مطحون بالحجارة لصنع الكسكسي التونسي التقليدي. مصدره قمح الدريم المزروع في الساحل.",
      price: 8,
      category: "food_drink", origin: "Tunisia", weight: 550, stock: 50,
      isHandmade: false,
      tags: ["couscous", "semolina", "tunisian", "staple", "food"],
      imageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600",
      shopId: djerbaShop2.id,
    },
  ];

  // ── La Soierie de Houmt Souk — 8 products (textiles + clothing)
  const soierieProducts = [
    {
      slug: "handloomed-wool-blanket-djerba",
      name: "Hand-loomed Wool Blanket",
      arabicName: "بطانية صوفية منسوجة يدوياً",
      description: "Thick wool blanket woven on a traditional loom by Djerban weavers. Natural undyed wool with geometric stripe patterns. Warm, durable, and beautiful.",
      arabicDescription: "بطانية صوف سميكة منسوجة على نول تقليدي من قِبَل نساجي جربة.",
      price: 120, comparePrice: 150,
      category: "textiles", material: "Merino wool", origin: "Djerba, Tunisia", weight: 1400, stock: 6,
      isHandmade: true, featured: true,
      tags: ["blanket", "wool", "handloomed", "warm", "djerba"],
      imageUrl: "https://images.unsplash.com/photo-1588194074936-b498b4d7f68e?w=600",
      shopId: djerbaShop3.id,
    },
    {
      slug: "traditional-fouta-towel-djerba",
      name: "Traditional Fouta Towel",
      arabicName: "منشفة الفوطة التقليدية",
      description: "The iconic Tunisian fouta — a lightweight flat-woven towel used as a beach towel, sarong, or scarf. 100% cotton, quick-drying. Available in natural stripes.",
      arabicDescription: "الفوطة التونسية الأيقونية — منشفة خفيفة الوزن تستخدم كمنشفة شاطئ أو إزار.",
      price: 35,
      category: "textiles", material: "100% cotton", origin: "Djerba, Tunisia", weight: 300, stock: 18,
      isHandmade: true,
      tags: ["fouta", "towel", "cotton", "beach", "tunisian"],
      imageUrl: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600",
      shopId: djerbaShop3.id,
    },
    {
      slug: "embroidered-table-runner-djerba",
      name: "Embroidered Table Runner",
      arabicName: "مفرش طاولة مطرز",
      description: "Elegant linen table runner with hand-embroidered traditional motifs at each end. 40×140 cm. Natural linen with deep blue and terracotta thread.",
      arabicDescription: "مفرش طاولة أنيق من الكتان مع زخارف تقليدية مطرزة يدوياً.",
      price: 48,
      category: "textiles", material: "Linen + silk thread", origin: "Djerba, Tunisia", weight: 200, stock: 10,
      isHandmade: true,
      tags: ["table runner", "embroidery", "linen", "home decor"],
      imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600",
      shopId: djerbaShop3.id,
    },
    {
      slug: "silk-scarf-djerba",
      name: "Hand-painted Silk Scarf",
      arabicName: "وشاح حريري مرسوم يدوياً",
      description: "Luxurious silk scarf hand-painted with watercolour-style Djerbian motifs — olive branches, sea waves, and geometric patterns. 45×180 cm. A wearable piece of art.",
      arabicDescription: "وشاح حريري فاخر مرسوم يدوياً بتصاميم جربية — أغصان الزيتون وأمواج البحر والزخارف الهندسية.",
      price: 75, comparePrice: 95,
      category: "clothing", material: "100% silk", origin: "Djerba, Tunisia", weight: 90, stock: 8,
      isHandmade: true, featured: true,
      tags: ["scarf", "silk", "painted", "fashion", "gift"],
      imageUrl: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600",
      shopId: djerbaShop3.id,
    },
    {
      slug: "cotton-kaftan-djerba",
      name: "Traditional Cotton Kaftan",
      arabicName: "قفطان قطني تقليدي",
      description: "Lightweight cotton kaftan with subtle embroidery at the neckline and cuffs. Airy and comfortable — perfect for warm evenings in Djerba. One size fits most.",
      arabicDescription: "قفطان قطني خفيف الوزن مع تطريز رقيق عند الياقة والأكمام. هوائي ومريح.",
      price: 65,
      category: "clothing", material: "100% cotton", origin: "Djerba, Tunisia", weight: 350, stock: 12,
      isHandmade: true,
      tags: ["kaftan", "cotton", "traditional", "tunisian", "clothing"],
      imageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600",
      shopId: djerbaShop3.id,
    },
    {
      slug: "woven-placemats-set-djerba",
      name: "Woven Placemat Set (4 pcs)",
      arabicName: "طقم مفارش المائدة المنسوجة (4 قطع)",
      description: "Set of 4 hand-woven cotton placemats with traditional stripe patterns. 30×45 cm each. Machine washable. Natural undyed cotton with terracotta and indigo accents.",
      arabicDescription: "طقم من 4 مفارش مائدة قطنية منسوجة يدوياً بأنماط خطوط تقليدية.",
      price: 42,
      category: "textiles", material: "100% cotton", origin: "Djerba, Tunisia", weight: 400, stock: 14,
      isHandmade: true,
      tags: ["placemats", "woven", "table", "cotton", "set"],
      imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
      shopId: djerbaShop3.id,
    },
    {
      slug: "embroidered-tote-bag-djerba",
      name: "Embroidered Canvas Tote Bag",
      arabicName: "حقيبة كانفاس مطرزة",
      description: "Sturdy canvas tote bag with a large hand-embroidered Djerbian motif on the front. 38×42 cm with two long handles. Great as a shopping bag, beach bag, or everyday carry.",
      arabicDescription: "حقيبة كانفاس متينة مع زخرفة جربية كبيرة مطرزة يدوياً في الأمام.",
      price: 28,
      category: "accessories", material: "Canvas + cotton thread", origin: "Djerba, Tunisia", weight: 250, stock: 16,
      isHandmade: true,
      tags: ["tote", "bag", "embroidered", "canvas", "eco"],
      imageUrl: "https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=600",
      shopId: djerbaShop3.id,
    },
    {
      slug: "berber-cushion-set-djerba",
      name: "Berber Cushion Set (2 pcs)",
      arabicName: "طقم وسائد بربرية (قطعتان)",
      description: "Pair of handwoven Berber-patterned cushion covers in red, black, and natural cream. 45×45 cm. Zip closure, removable. Cushion inserts not included.",
      arabicDescription: "زوج من أغطية الوسائد بنقوش بربرية منسوجة يدوياً باللون الأحمر والأسود والكريمي الطبيعي.",
      price: 60, comparePrice: 75,
      category: "textiles", material: "Wool + cotton", origin: "Djerba, Tunisia", weight: 500, stock: 9,
      isHandmade: true,
      tags: ["cushion", "berber", "woven", "set", "home decor"],
      imageUrl: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600",
      shopId: djerbaShop3.id,
    },
  ];

  // ── The Souk Collective — 10 products (crafts + wellness + jewelry)
  const soukProducts = [
    {
      slug: "oud-incense-sticks-dubai",
      name: "Oud Incense Sticks (20 pcs)",
      arabicName: "عيدان بخور العود (20 قطعة)",
      description: "Premium Arabian oud incense sticks. Rich, woody fragrance — the scent of the Gulf. Hand-rolled using traditional methods. Burns for approx. 45 minutes per stick.",
      arabicDescription: "عيدان بخور العود العربي الفاخر. عطر خشبي غني — رائحة الخليج. ملفوفة يدوياً بالطرق التقليدية.",
      price: 65, comparePrice: 80,
      category: "wellness", material: "Oud wood", origin: "Dubai, UAE", weight: 100, stock: 30,
      isHandmade: false, featured: true,
      tags: ["oud", "incense", "fragrance", "arabic", "luxury"],
      imageUrl: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600",
      shopId: dubaiShop1.id,
    },
    {
      slug: "arabic-calligraphy-print-dubai",
      name: "Arabic Calligraphy Print (A3)",
      arabicName: "لوحة خط عربي (A3)",
      description: "Hand-drawn Arabic calligraphy art print on premium archival paper. Each print features a classic Arabic poem or proverb. Signed and numbered. Framing instructions included.",
      arabicDescription: "لوحة فنية بالخط العربي مرسومة يدوياً على ورق أرشيفي فاخر.",
      price: 90,
      category: "crafts", material: "Archival paper + ink", origin: "Dubai, UAE", weight: 200, stock: 8,
      isHandmade: true, featured: true,
      tags: ["calligraphy", "art", "arabic", "print", "gift"],
      imageUrl: "https://images.unsplash.com/photo-1482160549825-59d1b23cb208?w=600",
      shopId: dubaiShop1.id,
    },
    {
      slug: "hand-painted-camel-figurine-dubai",
      name: "Hand-painted Camel Figurine",
      arabicName: "تمثال الجمل المرسوم يدوياً",
      description: "Detailed ceramic camel figurine hand-painted by Dubai artisans. 15 cm tall. Each one is slightly unique. A classic Gulf souvenir with an artistic touch.",
      arabicDescription: "تمثال جمل خزفي مفصل مرسوم يدوياً من قِبَل حرفيين دبيين.",
      price: 42,
      category: "crafts", material: "Ceramic", origin: "Dubai, UAE", weight: 350, stock: 15,
      isHandmade: true,
      tags: ["camel", "figurine", "souvenir", "ceramic", "dubai"],
      imageUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600",
      shopId: dubaiShop1.id,
    },
    {
      slug: "pearl-oyster-box-dubai",
      name: "Mother-of-Pearl Oyster Box",
      arabicName: "صندوق صدف اللؤلؤ",
      description: "Intricately inlaid mother-of-pearl box handcrafted in the old souk tradition. Perfect for jewelry, trinkets, or as a display piece. Approximately 10×7 cm.",
      arabicDescription: "صندوق مُرصَّع بصدف اللؤلؤ مصنوع يدوياً وفق تقاليد السوق القديم.",
      price: 75,
      category: "crafts", material: "Wood + mother-of-pearl", origin: "Dubai, UAE", weight: 250, stock: 12,
      isHandmade: true,
      tags: ["pearl", "box", "inlay", "gift", "luxury"],
      imageUrl: "https://images.unsplash.com/photo-1561532178-5b6d89e0abd0?w=600",
      shopId: dubaiShop1.id,
    },
    {
      slug: "brass-dallah-coffee-pot-dubai",
      name: "Brass Dallah Coffee Pot",
      arabicName: "دلة قهوة نحاسية",
      description: "Traditional Gulf dallah hand-crafted from brass. Used for serving Arabic coffee (qahwa). Height: 30 cm. An iconic piece of Gulf heritage, perfect for home display or ceremonial use.",
      arabicDescription: "دلة الخليج التقليدية مصنوعة يدوياً من النحاس. تستخدم لتقديم القهوة العربية.",
      price: 130, comparePrice: 160,
      category: "crafts", material: "Brass", origin: "Dubai, UAE", weight: 700, stock: 5,
      isHandmade: true, featured: true,
      tags: ["dallah", "brass", "coffee", "gulf", "heritage"],
      imageUrl: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600",
      shopId: dubaiShop1.id,
    },
    {
      slug: "evil-eye-necklace-dubai",
      name: "Evil Eye Nazar Necklace",
      arabicName: "عقد عين نظر (عين الحسد)",
      description: "Handmade glass evil eye pendant on a 925 sterling silver chain. The iconic blue nazar bead — believed to ward off negative energy. Length: 45 cm. Comes in a gift box.",
      arabicDescription: "قلادة عين نظر مصنوعة يدوياً من الزجاج على سلسلة فضية عيار 925.",
      price: 55, comparePrice: 70,
      category: "jewelry", material: "Glass + sterling silver", origin: "Dubai, UAE", weight: 20, stock: 20,
      isHandmade: true,
      tags: ["evil eye", "nazar", "necklace", "jewelry", "protection"],
      imageUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600",
      shopId: dubaiShop1.id,
    },
    {
      slug: "sand-art-bottle-dubai",
      name: "Desert Sand Art Bottle",
      arabicName: "زجاجة فن الرمال الصحراوية",
      description: "Handcrafted glass bottle with layered coloured desert sand forming a scenic landscape — dunes, camels, and a sunset sky. Each one is a unique, one-of-a-kind piece.",
      arabicDescription: "زجاجة زجاجية مصنوعة يدوياً برمال صحراوية ملونة تشكّل مشهداً طبيعياً — كثبان ورسوم وسماء غروب.",
      price: 35,
      category: "crafts", material: "Glass + sand", origin: "Dubai, UAE", weight: 300, stock: 18,
      isHandmade: true,
      tags: ["sand art", "bottle", "souvenir", "unique", "dubai"],
      imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600",
      shopId: dubaiShop1.id,
    },
    {
      slug: "arabic-perfume-oil-dubai",
      name: "Arabian Perfume Oil (12ml)",
      arabicName: "زيت عطر عربي (12 مل)",
      description: "Concentrated Arabian perfume oil — a blend of rose, oud, amber, and musk. Long-lasting, alcohol-free. Apply to pulse points. A signature Gulf fragrance in a hand-decorated bottle.",
      arabicDescription: "زيت عطر عربي مركّز — مزيج من الورد والعود والعنبر والمسك. طويل الأمد وخالٍ من الكحول.",
      price: 48,
      category: "wellness", material: "Natural fragrance oils", origin: "Dubai, UAE", weight: 60, stock: 25,
      isHandmade: false, featured: true,
      tags: ["perfume", "oud", "fragrance", "arabic", "oil"],
      imageUrl: "https://images.unsplash.com/photo-1619994402583-9a41f6e6c2d6?w=600",
      shopId: dubaiShop1.id,
    },
    {
      slug: "gold-plated-arabic-bangle-dubai",
      name: "Gold-plated Arabic Bangle",
      arabicName: "سوار عربي مطلي بالذهب",
      description: "Elegant bangle with intricate Arabic calligraphy engraved around the band. 18k gold-plated brass. One size, adjustable. Comes gift-boxed with polishing cloth.",
      arabicDescription: "سوار أنيق منقوش بخط عربي دقيق حول الحلقة. نحاس مطلي بالذهب عيار 18.",
      price: 85,
      category: "jewelry", material: "Gold-plated brass", origin: "Dubai, UAE", weight: 45, stock: 10,
      isHandmade: true,
      tags: ["bangle", "gold", "arabic", "calligraphy", "jewelry"],
      imageUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600",
      shopId: dubaiShop1.id,
    },
    {
      slug: "wooden-arabic-puzzle-box-dubai",
      name: "Inlaid Wooden Puzzle Box",
      arabicName: "صندوق خشبي لغز مطعّم",
      description: "Handcrafted wooden puzzle box with intricate geometric inlay work — a traditional Middle Eastern craft. The lid opens only when you solve the sequence. Great as a gift or curiosity piece.",
      arabicDescription: "صندوق خشبي لغز مصنوع يدوياً مع تطعيم هندسي دقيق. يفتح الغطاء فقط عند حل التسلسل الصحيح.",
      price: 95, comparePrice: 120,
      category: "crafts", material: "Wood + bone inlay", origin: "Dubai, UAE", weight: 400, stock: 7,
      isHandmade: true,
      tags: ["puzzle box", "wood", "inlay", "gift", "unique"],
      imageUrl: "https://images.unsplash.com/photo-1561532178-5b6d89e0abd0?w=600",
      shopId: dubaiShop1.id,
    },
  ];

  // ── Desert Spice Market — 9 products (food + wellness)
  const desertSpiceProducts = [
    {
      slug: "saffron-threads-dubai",
      name: "Premium Saffron Threads (1g)",
      arabicName: "خيوط الزعفران الفاخرة (1 غ)",
      description: "Grade A Persian saffron threads — the highest quality saffron available. Intensely aromatic and deeply coloured. Essential for paella, biryani, and Middle Eastern desserts.",
      arabicDescription: "خيوط الزعفران الفارسي من الدرجة الأولى — أعلى جودة من الزعفران المتاح.",
      price: 38,
      category: "food_drink", origin: "Iran (via Dubai)", weight: 10, stock: 25,
      isHandmade: false, featured: true,
      tags: ["saffron", "spice", "premium", "cooking", "persian"],
      imageUrl: "https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=600",
      shopId: dubaiShop2.id,
    },
    {
      slug: "zaatar-blend-dubai",
      name: "Za'atar Blend (150g)",
      arabicName: "خلطة الزعتر (150 غ)",
      description: "Traditional Levantine za'atar blend — wild thyme, sumac, sesame seeds, and salt. Versatile condiment: mix with olive oil for dipping, sprinkle on flatbreads, or season meats.",
      arabicDescription: "خلطة الزعتر الشامية التقليدية — زعتر بري وسماق وبذور سمسم وملح.",
      price: 16,
      category: "food_drink", origin: "Lebanon/Syria", weight: 180, stock: 35,
      isHandmade: false,
      tags: ["zaatar", "spice blend", "levantine", "condiment"],
      imageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600",
      shopId: dubaiShop2.id,
    },
    {
      slug: "baharat-mix-dubai",
      name: "Baharat Spice Mix (100g)",
      arabicName: "خلطة بهارات (100 غ)",
      description: "Aromatic baharat — the quintessential Gulf spice blend. Allspice, black pepper, coriander, cinnamon, and cloves. Perfect for lamb, chicken, and rice dishes.",
      arabicDescription: "بهارات عطرية — خلطة التوابل الخليجية بامتياز. بهار أسود وقرفة وقرنفل.",
      price: 14,
      category: "food_drink", origin: "Gulf region", weight: 120, stock: 40,
      isHandmade: false,
      tags: ["baharat", "spice", "gulf", "arabic", "cooking"],
      imageUrl: "https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=600",
      shopId: dubaiShop2.id,
    },
    {
      slug: "sumac-powder-dubai",
      name: "Sumac Powder (150g)",
      arabicName: "مسحوق السماق (150 غ)",
      description: "Deep burgundy sumac powder — tangy, fruity, and earthy. A staple of Middle Eastern cooking. Use as a salad dressing, rub for meats, or topping for hummus.",
      arabicDescription: "مسحوق السماق الداكن — حامض وفاكهي وترابي. ركيزة أساسية في الطبخ الشرقي.",
      price: 15,
      category: "food_drink", origin: "Middle East", weight: 170, stock: 30,
      isHandmade: false,
      tags: ["sumac", "spice", "tangy", "middle eastern"],
      imageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600",
      shopId: dubaiShop2.id,
    },
    {
      slug: "dried-lemon-loomi-dubai",
      name: "Dried Lemon Loomi (100g)",
      arabicName: "ليمون لومي مجفف (100 غ)",
      description: "Whole dried black limes (loomi) from Oman — a signature ingredient in Gulf stews, rice dishes, and teas. Gives a deep, smoky-sour flavour that fresh lemon cannot replicate.",
      arabicDescription: "ليمون أسود مجفف كامل (لومي) من عُمان — مكوّن أساسي في يخنات الخليج وأطباق الأرز والشاي.",
      price: 18,
      category: "food_drink", origin: "Oman", weight: 130, stock: 28,
      isHandmade: false,
      tags: ["dried lemon", "loomi", "gulf", "spice", "cooking"],
      imageUrl: "https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=600",
      shopId: dubaiShop2.id,
    },
    {
      slug: "rose-water-250ml-dubai",
      name: "Pure Rose Water (250ml)",
      arabicName: "ماء الورد النقي (250 مل)",
      description: "Steam-distilled pure rose water from Iranian Damask roses. Use in baklava, rice pudding, and sweets — or as a natural facial mist. No additives, no alcohol.",
      arabicDescription: "ماء ورد نقي مقطر بالبخار من ورد دمشق الإيراني. يستخدم في الحلويات أو كبخاخ للوجه.",
      price: 20,
      category: "wellness", origin: "Iran", weight: 280, stock: 22,
      isHandmade: false,
      tags: ["rose water", "wellness", "cooking", "beauty", "natural"],
      imageUrl: "https://images.unsplash.com/photo-1548438294-1ad5d5f4f063?w=600",
      shopId: dubaiShop2.id,
    },
    {
      slug: "cardamom-pods-dubai",
      name: "Green Cardamom Pods (50g)",
      arabicName: "حبوب الهيل الأخضر (50 غ)",
      description: "Freshly harvested green cardamom pods from Kerala. Intensely aromatic — the backbone of Arabic coffee (qahwa), masala chai, and Gulf desserts. Best ground fresh.",
      arabicDescription: "حبوب الهيل الأخضر المحصودة حديثاً من كيرالا. عطرية بشدة — العمود الفقري للقهوة العربية وحلويات الخليج.",
      price: 22,
      category: "food_drink", origin: "India/UAE", weight: 65, stock: 35,
      isHandmade: false, featured: true,
      tags: ["cardamom", "spice", "arabic coffee", "gulf", "aromatic"],
      imageUrl: "https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=600",
      shopId: dubaiShop2.id,
    },
    {
      slug: "turmeric-powder-dubai",
      name: "Premium Turmeric Powder (100g)",
      arabicName: "مسحوق الكركم الفاخر (100 غ)",
      description: "High-curcumin turmeric powder from Alleppey, India. Vibrant golden colour and strong earthy aroma. Use in rice, stews, golden milk, and marinades.",
      arabicDescription: "مسحوق كركم عالي الكركمين من أليبي، الهند. لون ذهبي نابض وأريج ترابي قوي.",
      price: 14,
      category: "food_drink", origin: "India", weight: 120, stock: 40,
      isHandmade: false,
      tags: ["turmeric", "spice", "healthy", "cooking", "golden"],
      imageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600",
      shopId: dubaiShop2.id,
    },
    {
      slug: "dates-medjool-box-dubai",
      name: "Medjool Dates Gift Box (500g)",
      arabicName: "تمر مجدول هدية (500 غ)",
      description: "Premium Medjool dates from the Jordan Valley — large, soft, and caramel-sweet. Presented in an elegant gift box. The most prized variety in the Arab world. Perfect for gifting.",
      arabicDescription: "تمر مجدول فاخر من وادي الأردن — كبير وطري وحلو كالكراميل. يُقدّم في علبة هدية أنيقة.",
      price: 45, comparePrice: 58,
      category: "food_drink", origin: "Jordan", weight: 600, stock: 20,
      isHandmade: false, featured: true,
      tags: ["dates", "medjool", "gift", "arabic", "luxury"],
      imageUrl: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600",
      shopId: dubaiShop2.id,
    },
  ];

  // ── Nomad Leather — 8 products (leather accessories)
  const nomadLeatherProducts = [
    {
      slug: "camel-leather-wallet-dubai",
      name: "Camel Leather Bifold Wallet",
      arabicName: "محفظة جلد الإبل المطوية",
      description: "Slim bifold wallet hand-stitched from genuine camel leather. Features 6 card slots, a bill compartment, and ID window. Ages beautifully with a distinctive patina.",
      arabicDescription: "محفظة نحيفة مطوية مخيطة يدوياً من جلد الإبل الأصيل.",
      price: 95, comparePrice: 120,
      category: "accessories", material: "Camel leather", origin: "Dubai, UAE", weight: 80, stock: 14,
      isHandmade: true, featured: true,
      tags: ["wallet", "leather", "camel", "handmade", "gift"],
      imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600",
      shopId: dubaiShop3.id,
    },
    {
      slug: "hand-stitched-clutch-dubai",
      name: "Hand-stitched Leather Clutch",
      arabicName: "حقيبة جلدية مخيطة يدوياً",
      description: "Elegant clutch bag hand-stitched by Dubai artisans. Natural tan leather with brass fittings. Fits a phone, cards, and keys. Can be carried solo or used as a bag insert.",
      arabicDescription: "حقيبة أنيقة مخيطة يدوياً من قِبَل حرفيين دبيين. جلد طبيعي مع تجهيزات نحاسية.",
      price: 140,
      category: "accessories", material: "Full-grain leather", origin: "Dubai, UAE", weight: 180, stock: 8,
      isHandmade: true,
      tags: ["clutch", "leather", "handmade", "luxury", "bag"],
      imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600",
      shopId: dubaiShop3.id,
    },
    {
      slug: "brass-buckle-belt-dubai",
      name: "Brass-buckle Leather Belt",
      arabicName: "حزام جلدي بإبزيم نحاسي",
      description: "Full-grain leather belt with solid brass buckle. Handcrafted in Dubai. Available in tan and dark brown. Adjustable — one size fits most (trimable at home).",
      arabicDescription: "حزام جلد حبوب كاملة مع إبزيم نحاسي صلب. مصنوع يدوياً في دبي.",
      price: 110,
      category: "accessories", material: "Full-grain leather + brass", origin: "Dubai, UAE", weight: 250, stock: 11,
      isHandmade: true,
      tags: ["belt", "leather", "brass", "handmade", "accessory"],
      imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600",
      shopId: dubaiShop3.id,
    },
    {
      slug: "passport-holder-leather-dubai",
      name: "Leather Passport Holder",
      arabicName: "حافظة جواز سفر جلدية",
      description: "Slim passport holder in full-grain camel leather. Two card slots, a document pocket, and a pen loop. Fits all standard passports. Personalisation available.",
      arabicDescription: "حافظة جواز سفر نحيفة من جلد الإبل حبوب كاملة. فتحتان للبطاقات وجيب للمستندات وحلقة للقلم.",
      price: 65, comparePrice: 85,
      category: "accessories", material: "Camel leather", origin: "Dubai, UAE", weight: 60, stock: 16,
      isHandmade: true, featured: true,
      tags: ["passport", "holder", "leather", "travel", "gift"],
      imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600",
      shopId: dubaiShop3.id,
    },
    {
      slug: "leather-card-holder-dubai",
      name: "Minimalist Card Holder",
      arabicName: "حافظة بطاقات مينيمالية",
      description: "Ultra-slim card holder made from vegetable-tanned leather. Holds 4–6 cards. Simple, elegant design with a thumb slot for easy access. Available in tan, brown, and black.",
      arabicDescription: "حافظة بطاقات فائقة النحافة مصنوعة من الجلد المدبوغ بالنباتات. تسع 4–6 بطاقات.",
      price: 45,
      category: "accessories", material: "Vegetable-tanned leather", origin: "Dubai, UAE", weight: 30, stock: 20,
      isHandmade: true,
      tags: ["card holder", "leather", "minimalist", "slim", "wallet"],
      imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600",
      shopId: dubaiShop3.id,
    },
    {
      slug: "leather-key-fob-dubai",
      name: "Leather Key Fob",
      arabicName: "سلسلة مفاتيح جلدية",
      description: "Handstitched leather key fob with a solid brass ring. Loop design — fits most keys and bag clips. Personalise with initials. A small gift with a luxurious feel.",
      arabicDescription: "حلقة مفاتيح جلدية مخيطة يدوياً مع حلقة نحاسية صلبة.",
      price: 28,
      category: "accessories", material: "Full-grain leather + brass", origin: "Dubai, UAE", weight: 25, stock: 30,
      isHandmade: true,
      tags: ["key fob", "leather", "accessory", "gift", "brass"],
      imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600",
      shopId: dubaiShop3.id,
    },
    {
      slug: "leather-journal-cover-dubai",
      name: "Leather Journal Cover (A5)",
      arabicName: "غلاف مجلة جلدي (A5)",
      description: "Hand-stitched leather journal cover with a refillable A5 notebook insert. Two pen loops, business card pocket, and a bookmark ribbon. Embossed with an Arabic geometric pattern.",
      arabicDescription: "غلاف مجلة جلدي مخيط يدوياً مع دفتر A5 قابل للاستبدال. حلقتان للأقلام وجيب للبطاقات.",
      price: 80, comparePrice: 100,
      category: "accessories", material: "Full-grain leather", origin: "Dubai, UAE", weight: 350, stock: 9,
      isHandmade: true,
      tags: ["journal", "leather", "notebook", "handmade", "gift"],
      imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600",
      shopId: dubaiShop3.id,
    },
    {
      slug: "leather-luggage-tag-dubai",
      name: "Personalised Luggage Tag",
      arabicName: "بطاقة أمتعة مخصصة",
      description: "Thick full-grain leather luggage tag with a stainless steel loop. Includes a removable ID card insert. Hand-stitched edges in contrasting thread. A durable travel companion.",
      arabicDescription: "بطاقة أمتعة من الجلد حبوب كاملة السميك مع حلقة فولاذية. حواف مخيطة يدوياً.",
      price: 38,
      category: "accessories", material: "Full-grain leather + steel", origin: "Dubai, UAE", weight: 50, stock: 22,
      isHandmade: true,
      tags: ["luggage tag", "leather", "travel", "personalised", "gift"],
      imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600",
      shopId: dubaiShop3.id,
    },
  ];

  const allProducts = [
    ...djerbaProducts,
    ...epicerieProducts,
    ...soierieProducts,
    ...soukProducts,
    ...desertSpiceProducts,
    ...nomadLeatherProducts,
  ];

  for (const { imageUrl, ...product } of allProducts) {
    const created = await prisma.product.upsert({
      where:  { slug: product.slug },
      update: product,
      create: product,
    });
    // Seed one product image (skip if already exists to avoid duplicates)
    if (imageUrl) {
      const exists = await prisma.images.findFirst({ where: { productId: created.id } });
      if (!exists) {
        await prisma.images.create({ data: { url: imageUrl, productId: created.id } });
      }
    }
    console.log(`  ✓ ${product.name}`);
  }

  // ─── SHOP REVIEWS ───────────────────────────────────────────────────────────
  console.log("\n── Shop Reviews ──");

  const shopReviewsData = [
    // ── Artisanat Djerba ────────────────────────────────────────────────────
    { userId: CUSTOMER_IDS.sarah,   userName: "Sarah Johnson",  relationId: djerbaShop1.id, relationType: "SHOP" as const, rating: 5, title: "The best craft shop in Djerba",        comment: "I spent an entire morning here and left with a ceramic bowl, a cushion cover, and an olive wood board. Every single piece is genuinely handmade. The owner was kind enough to show me how the bowls are painted.", createdAt: d(14), response: "Thank you Sarah! Come back next time and we'll show you the weaving loom too.", responseDate: d(12).toISOString() },
    { userId: CUSTOMER_IDS.marco,   userName: "Marco Rossi",    relationId: djerbaShop1.id, relationType: "SHOP" as const, rating: 5, title: "Authentic, not touristy",               comment: "Finally a craft shop that doesn't feel like a souvenir factory. The pieces here have soul. The kilim rug I bought is now hanging in my living room in Milan.", createdAt: d(22) },
    { userId: CUSTOMER_IDS.amir,    userName: "Amir Hassan",    relationId: djerbaShop1.id, relationType: "SHOP" as const, rating: 4, title: "Quality craftsmanship",                 comment: "Excellent quality throughout. The terracotta vase and embroidered cushion arrived perfectly packed. Would have rated 5 stars but shipping took a bit longer than expected.", createdAt: d(35) },
    { userId: CUSTOMER_IDS.emma,    userName: "Emma Wilson",    relationId: djerbaShop1.id, relationType: "SHOP" as const, rating: 5, title: "Worth every dinar",                    comment: "A must-visit if you are in Houmt Souk. The prices are fair for the level of craftsmanship. The olive wood board is stunning and so practical.", createdAt: d(8) },

    // ── Épicerie du Sahel ───────────────────────────────────────────────────
    { userId: CUSTOMER_IDS.youssef, userName: "Youssef Benali", relationId: djerbaShop2.id, relationType: "SHOP" as const, rating: 5, title: "Real Tunisian pantry essentials",      comment: "I stock up here every time I visit Djerba. The harissa is the best I've ever tasted — smoky, deep, not just hot. The argan oil and rose petals are gifts I bring back to friends in France.", createdAt: d(10) },
    { userId: CUSTOMER_IDS.sarah,   userName: "Sarah Johnson",  relationId: djerbaShop2.id, relationType: "SHOP" as const, rating: 5, title: "Bought half the shop",                 comment: "The honey is extraordinary — light and floral, completely different from anything you'd find in a supermarket. The owner let me try everything before buying. Such a lovely experience.", createdAt: d(18), response: "We love hearing this! The honey comes from hives just 3 km from the shop. You are always welcome.", responseDate: d(16).toISOString() },
    { userId: CUSTOMER_IDS.emma,    userName: "Emma Wilson",    relationId: djerbaShop2.id, relationType: "SHOP" as const, rating: 4, title: "Great local produce",                  comment: "Good selection and friendly service. The spearmint tea blend is a daily ritual at home now. Packaging is simple but everything travels well.", createdAt: d(27) },

    // ── La Soierie de Houmt Souk ────────────────────────────────────────────
    { userId: CUSTOMER_IDS.marco,   userName: "Marco Rossi",    relationId: djerbaShop3.id, relationType: "SHOP" as const, rating: 5, title: "Extraordinary weaving",               comment: "I watched the weaver working the loom for 20 minutes before I even looked at what was for sale. The wool blanket I bought is heavy, warm, and beautiful — exactly what a Berber blanket should be.", createdAt: d(20) },
    { userId: CUSTOMER_IDS.amir,    userName: "Amir Hassan",    relationId: djerbaShop3.id, relationType: "SHOP" as const, rating: 5, title: "The silk scarf is perfection",         comment: "Bought the hand-painted silk scarf as a gift for my wife. She loves it. The motifs are delicate and the silk quality is excellent. Well worth the price.", createdAt: d(30), response: "Thank you! The scarf is hand-painted by one weaver who has been with us for 15 years. Your wife has great taste!", responseDate: d(28).toISOString() },
    { userId: CUSTOMER_IDS.youssef, userName: "Youssef Benali", relationId: djerbaShop3.id, relationType: "SHOP" as const, rating: 4, title: "Beautiful textiles, slow shipping",    comment: "The fouta towels are excellent — light, quick-drying, and the stripe patterns are classic. Shipped to Paris and arrived in 10 days. Solidly packaged.", createdAt: d(45) },

    // ── The Souk Collective ─────────────────────────────────────────────────
    { userId: CUSTOMER_IDS.emma,    userName: "Emma Wilson",    relationId: dubaiShop1.id, relationType: "SHOP" as const, rating: 5, title: "Dubai's best artisan market",         comment: "We spent 2 hours here and still didn't see everything. The brass dallah is a centrepiece in our kitchen now. The calligraphy print arrived beautifully framed and signed.", createdAt: d(16) },
    { userId: CUSTOMER_IDS.sarah,   userName: "Sarah Johnson",  relationId: dubaiShop1.id, relationType: "SHOP" as const, rating: 5, title: "Gifts that actually mean something",   comment: "I refuse to buy airport souvenirs anymore. The Souk Collective has everything you need: proper gifts with a story behind them. The evil eye necklace and the perfume oil are already favourites.", createdAt: d(24), response: "Thank you Sarah! Every piece in the shop comes with a story. Come back and we will tell you more of them.", responseDate: d(22).toISOString() },
    { userId: CUSTOMER_IDS.marco,   userName: "Marco Rossi",    relationId: dubaiShop1.id, relationType: "SHOP" as const, rating: 5, title: "Exceptional quality and curation",     comment: "The mother-of-pearl box and the wooden puzzle box were the standouts for me. Both are handmade, well-finished, and arrived with zero damage. The packaging is a gift in itself.", createdAt: d(32) },
    { userId: CUSTOMER_IDS.amir,    userName: "Amir Hassan",    relationId: dubaiShop1.id, relationType: "SHOP" as const, rating: 4, title: "A little pricey but worth it",         comment: "Prices reflect the quality and authenticity — you are not paying for mass-produced trinkets. The oud incense sticks are divine. One stick fills the whole apartment.", createdAt: d(41) },

    // ── Desert Spice Market ─────────────────────────────────────────────────
    { userId: CUSTOMER_IDS.youssef, userName: "Youssef Benali", relationId: dubaiShop2.id, relationType: "SHOP" as const, rating: 5, title: "The real Deira spice experience",      comment: "Walking into this shop is like walking into the old souk — the aromas hit you immediately. The cardamom is the best I've found outside of India. Medjool dates were a revelation.", createdAt: d(12) },
    { userId: CUSTOMER_IDS.sarah,   userName: "Sarah Johnson",  relationId: dubaiShop2.id, relationType: "SHOP" as const, rating: 5, title: "My go-to spice shop in Dubai",         comment: "I have been back three times in one trip. The saffron is genuine Grade A and the loomi (dried lime) transformed my lamb stew. The owner gave me a recipe card — above and beyond.", createdAt: d(19), response: "Always happy to share recipes! Come back next time and we will show you how to blend your own baharat.", responseDate: d(17).toISOString() },
    { userId: CUSTOMER_IDS.emma,    userName: "Emma Wilson",    relationId: dubaiShop2.id, relationType: "SHOP" as const, rating: 4, title: "Great quality, generous portions",     comment: "Za'atar blend and rose water are now permanent features in my kitchen. The packaging is sturdy and the spices kept their aroma for months. Very good value.", createdAt: d(38) },

    // ── Nomad Leather ───────────────────────────────────────────────────────
    { userId: CUSTOMER_IDS.marco,   userName: "Marco Rossi",    relationId: dubaiShop3.id, relationType: "SHOP" as const, rating: 5, title: "The finest leather goods in the souk",comment: "The camel leather wallet is extraordinary — it's been 6 months and the patina just gets better. The stitching is perfect. Worth every dirham. The journal cover is next on my list.", createdAt: d(7) },
    { userId: CUSTOMER_IDS.amir,    userName: "Amir Hassan",    relationId: dubaiShop3.id, relationType: "SHOP" as const, rating: 5, title: "Handmade leather, genuinely",          comment: "I've bought leather goods all over the world and this is real craftsmanship. The passport holder arrived monogrammed with my initials, exactly as discussed. Impressive.", createdAt: d(15), response: "Thank you Amir! Every piece is cut and stitched in-house. The monogramming takes 2 days but it's always worth it.", responseDate: d(13).toISOString() },
    { userId: CUSTOMER_IDS.youssef, userName: "Youssef Benali", relationId: dubaiShop3.id, relationType: "SHOP" as const, rating: 4, title: "Quality you can feel",                 comment: "The card holder is beautifully made — clean lines, perfect stitching, already developing a nice patina. Only small note: delivery took 2 weeks but the product was worth the wait.", createdAt: d(29) },
    { userId: CUSTOMER_IDS.emma,    userName: "Emma Wilson",    relationId: dubaiShop3.id, relationType: "SHOP" as const, rating: 5, title: "Best gift shop in Deira",              comment: "Bought the leather clutch as a birthday gift and everyone asked where it was from. Beautifully packaged, well-made, and the brass fittings are solid. Nomad Leather is a gem.", createdAt: d(52) },
  ];

  for (const r of shopReviewsData) {
    await prisma.review.upsert({
      where:  { id: `seed-shop-review-${r.userId}-${r.relationId.slice(-8)}` },
      update: {},
      create: {
        id:           `seed-shop-review-${r.userId}-${r.relationId.slice(-8)}`,
        userId:       r.userId,
        userName:     r.userName,
        relationId:   r.relationId,
        relationType: r.relationType,
        rating:       r.rating,
        title:        r.title,
        comment:      r.comment,
        createdAt:    r.createdAt,
        ...(r.response ? { response: r.response, responseDate: r.responseDate } : {}),
      },
    });
  }
  console.log(`  ✓ ${shopReviewsData.length} shop reviews seeded`);

  // ─── TRANSFERS ──────────────────────────────────────────────────────────────
  console.log("\n── Transfers ──");

  const djerbaTransfers = [
    {
      slug:         "djerba-airport-transfer",
      title:        "Djerba–Zarzis Airport Transfer",
      arabicTitle:  "نقل مطار جربة–جرجيس",
      description:  "Reliable and punctual airport transfers between Djerba–Zarzis International Airport and any hotel or address in Djerba. Meet & Greet service included — your driver waits in arrivals with a name sign.",
      type:         "AIRPORT_TRANSFER" as const,
      pricePerTrip: 35,
      capacity:     4,
      vehicleType:  "Sedan",
      brand:        "Mercedes",
      model:        "E-Class",
      year:         2022,
      isAC:         true,
      isMeetGreet:  true,
      isChildSeat:  false,
      languages:    "Arabic, French, English",
      phone:        "+216 25 123 456",
      country:      "Tunisia",
      region:       "Djerba",
      city:         "Djerba",
      featuredInHome: true,
    },
    {
      slug:         "djerba-city-taxi",
      title:        "Djerba City Taxi",
      arabicTitle:  "تاكسي مدينة جربة",
      description:  "On-demand city taxi service covering all of Djerba island. Fixed flat-rate pricing per trip — no meter surprises. Available 7 days a week from early morning to late night.",
      type:         "TAXI" as const,
      pricePerTrip: 15,
      capacity:     4,
      vehicleType:  "Sedan",
      brand:        "Peugeot",
      model:        "508",
      year:         2021,
      isAC:         true,
      isMeetGreet:  false,
      isChildSeat:  false,
      languages:    "Arabic, French",
      phone:        "+216 25 234 567",
      country:      "Tunisia",
      region:       "Djerba",
      city:         "Houmt Souk",
      featuredInHome: false,
    },
    {
      slug:         "djerba-private-chauffeur",
      title:        "Djerba Private Chauffeur",
      arabicTitle:  "سائق خاص في جربة",
      description:  "Hire a private chauffeur by the hour to explore Djerba at your own pace. Perfect for day tours, business meetings, or when you want the freedom of a dedicated driver without the hassle of renting a car.",
      type:         "CHAUFFEUR" as const,
      pricePerHour: 25,
      capacity:     6,
      vehicleType:  "SUV",
      brand:        "Toyota",
      model:        "Land Cruiser",
      year:         2023,
      isAC:         true,
      isMeetGreet:  true,
      isChildSeat:  true,
      languages:    "Arabic, French, English",
      phone:        "+216 25 345 678",
      country:      "Tunisia",
      region:       "Djerba",
      city:         "Midoun",
      featuredInHome: true,
    },
    {
      slug:         "djerba-shuttle-service",
      title:        "Djerba Hotel Shuttle",
      arabicTitle:  "حافلة الفنادق في جربة",
      description:  "Shared shuttle service connecting Djerba airport, the ferry terminal, and major hotel zones. Affordable group transport — book a seat or reserve the whole vehicle for your group.",
      type:         "SHUTTLE" as const,
      pricePerTrip: 40,
      pricePerPerson: 8,
      capacity:     12,
      vehicleType:  "Minivan",
      brand:        "Mercedes",
      model:        "Sprinter",
      year:         2020,
      isAC:         true,
      isMeetGreet:  false,
      isChildSeat:  false,
      languages:    "Arabic, French",
      phone:        "+216 25 456 789",
      country:      "Tunisia",
      region:       "Djerba",
      city:         "Djerba",
      featuredInHome: false,
    },
  ];

  for (const transfer of djerbaTransfers) {
    const createdTransfer = await prisma.transfer.upsert({
      where:  { slug: transfer.slug },
      update: { ...transfer, status: "ACTIVE", profileId: DJERBA_PROFILE_ID, destinationId: djerbaDest!.id },
      create: { ...transfer, status: "ACTIVE", profileId: DJERBA_PROFILE_ID, destinationId: djerbaDest!.id },
    });
    const transferUrls = transferImages[transfer.slug] ?? [];
    const transferImgEx = await prisma.images.count({ where: { transferId: createdTransfer.id } });
    if (transferImgEx === 0 && transferUrls.length > 0) {
      await prisma.images.createMany({ data: transferUrls.map((url) => ({ url, transferId: createdTransfer.id })) });
    }
    console.log(`  ✓ ${transfer.title}`);
  }

  // ── Djerba Attractions ────────────────────────────────────────────────
  console.log("\n🏛  Seeding Djerba attractions...");

  const islandTourActivity = await prisma.activity.findUnique({
    where: { slug: "djerba-island-discovery-tour" },
    select: { id: true },
  });

  const djerbaAttractions = [
    {
      slug: "guellala-museum",
      title: "Guellala Museum",
      description: "A fascinating open-air museum showcasing the traditional life and crafts of Djerba island. The museum features life-size dioramas depicting scenes from Djerbian daily life, pottery workshops, traditional costumes, and the famous ceramic art of Guellala village.",
      overview: "The Guellala Museum is the island's most comprehensive cultural attraction, spread across two floors of authentic exhibits. Visitors discover the ancient pottery traditions that have defined Guellala village for centuries, watch craftsmen at work, and explore reconstructed scenes of traditional weddings, agriculture, and fishing. The rooftop terrace offers panoramic views across the island.",
      location: "Guellala Village, Djerba South, Tunisia",
      hours: "Daily 9:00 AM – 6:00 PM (closed on Fridays until 2:00 PM)",
      fees: "10 TND adults, 5 TND children",
      hasFee: true,
      feeAmount: 10,
      feeNote: "Children under 6 enter free. Group rates available for 10+ visitors.",
      category: "culture",
      coordinates: { lat: 33.7667, lng: 10.9333 },
      destinationId: djerbaDest!.id,
    },
    {
      slug: "el-ghriba-synagogue",
      title: "El Ghriba Synagogue",
      description: "One of the oldest synagogues in the world and the most important Jewish pilgrimage site in Africa. El Ghriba is a stunning example of Tunisian-Jewish architecture, adorned with hand-painted blue-and-white tiles, ornate wooden ceilings, and ancient Torah scrolls.",
      overview: "El Ghriba — meaning 'the miraculous stranger' in Arabic — is believed to have been built over 2,500 years ago. The synagogue is home to a cherished Torah scroll said to have arrived from Jerusalem, and a stone that some believe fell from the sky. Every year during Lag BaOmer, Jewish pilgrims from around the world gather here for a celebration that has continued for generations.",
      location: "Hara Sghira (Er-Riadh), Djerba, Tunisia",
      hours: "Monday–Friday 9:00 AM – 5:00 PM, Saturday–Sunday 9:00 AM – 4:00 PM",
      fees: "Free entry",
      hasFee: false,
      feeAmount: null,
      feeNote: null,
      category: "religion",
      coordinates: { lat: 33.8017, lng: 10.9183 },
      destinationId: djerbaDest!.id,
    },
    {
      slug: "djerba-heritage-village",
      title: "Djerba Heritage Village",
      description: "A living museum village preserving the architecture, crafts, and traditions of historic Djerba. Wander through whitewashed streets, visit artisan workshops, and experience the island's unique blend of Berber, Arab, and Mediterranean heritage.",
      overview: "Djerba Heritage Village brings together the island's rich cultural tapestry in one beautifully restored setting. The village showcases traditional menzel (courtyard home) architecture, ancient weaving looms, silver jewelry workshops, and a curated collection of Djerbian textiles. Knowledgeable guides share stories of the island's 3,000-year history across its many civilisations.",
      location: "Midoun Area, Central Djerba, Tunisia",
      hours: "Tuesday–Sunday 9:00 AM – 7:00 PM",
      fees: "8 TND adults, 4 TND children",
      hasFee: true,
      feeAmount: 8,
      feeNote: "Free for children under 5. Guided tours add 5 TND per person.",
      category: "culture",
      coordinates: { lat: 33.8097, lng: 11.0067 },
      destinationId: djerbaDest!.id,
    },
    {
      slug: "beach-sidi-mahrez",
      title: "Sidi Mahrez Beach",
      description: "One of Djerba's most beautiful and iconic beaches, with fine white sand stretching along a protected bay. The calm, crystal-clear waters make it perfect for swimming, while the beach is lined with traditional fishing boats and palm-shaded cafés.",
      overview: "Sidi Mahrez Beach sits on the northeast coast of Djerba, sheltered from the open sea by a natural headland. The shallow, warm waters are ideal for families and swimmers of all levels. Local fishermen bring in their catch each morning, and the adjacent medina district offers authentic souvenirs, fresh juice stalls, and seafood restaurants steps from the sand.",
      location: "Sidi Mahrez, Northeast Djerba, Tunisia",
      hours: "Open 24 hours (lifeguards present May–September 8:00 AM – 6:00 PM)",
      fees: "Free",
      hasFee: false,
      feeAmount: null,
      feeNote: null,
      category: "beach",
      coordinates: { lat: 33.8678, lng: 10.9817 },
      destinationId: djerbaDest!.id,
    },
    {
      slug: "houmt-souk-medina",
      title: "Houmt Souk Medina",
      description: "The historic heart of Djerba's capital, Houmt Souk is a labyrinthine medina of whitewashed alleyways, bustling souks, and traditional fondouks (caravanserais). The market is famous for its textiles, ceramics, handmade jewellery, and spices.",
      overview: "Houmt Souk Medina is an essential Djerba experience. The ancient trade routes that once connected sub-Saharan Africa to the Mediterranean still echo through its narrow streets. Don't miss the covered spice souk, the silver jewellery quarter, and the old fondouks that once sheltered merchants. The central Place Hedi Chaker square comes alive in the evenings with local life.",
      location: "Houmt Souk, Northern Djerba, Tunisia",
      hours: "Shops open Saturday–Thursday 9:00 AM – 8:00 PM (Friday 9:00 AM – 1:00 PM, 4:00 PM – 8:00 PM)",
      fees: "Free",
      hasFee: false,
      feeAmount: null,
      feeNote: null,
      category: "culture",
      coordinates: { lat: 33.8744, lng: 10.8575 },
      destinationId: djerbaDest!.id,
    },
    {
      slug: "flamingo-lake",
      title: "Flamingo Lake (Bibane Lagoon)",
      description: "A stunning natural lagoon on the eastern tip of Djerba where flocks of pink flamingos gather year-round. The shallow salt flats and wetlands are a protected wildlife area and one of the most photogenic natural sights in Tunisia.",
      overview: "Bibane Lagoon is part of a protected coastal wetland system stretching along the southeastern coast of Djerba. The lagoon's shallow, mineral-rich waters attract hundreds of greater flamingos, particularly during the winter months. The best viewing is at sunrise and sunset from the wooden observation platform. The lagoon is also home to grey herons, spoonbills, and numerous wading birds.",
      location: "Aghir, Southeast Djerba, Tunisia",
      hours: "Open access (no closing time). Dawn and dusk recommended for flamingo sightings.",
      fees: "Free",
      hasFee: false,
      feeAmount: null,
      feeNote: null,
      category: "nature",
      coordinates: { lat: 33.7583, lng: 11.1317 },
      destinationId: djerbaDest!.id,
    },
  ];

  for (const attraction of djerbaAttractions) {
    const { coordinates, feeAmount, feeNote, ...rest } = attraction;
    const createdAttraction = await prisma.attraction.upsert({
      where: { slug: attraction.slug },
      update: {
        ...rest,
        coordinates: coordinates as object,
        ...(feeAmount !== null ? { feeAmount } : {}),
        ...(feeNote !== null ? { feeNote } : {}),
      },
      create: {
        ...rest,
        coordinates: coordinates as object,
        ...(feeAmount !== null ? { feeAmount } : {}),
        ...(feeNote !== null ? { feeNote } : {}),
      },
    });
    const attrUrls = attractionImages[attraction.slug] ?? [];
    const attrImgEx = await prisma.images.count({ where: { attractionId: createdAttraction.id } });
    if (attrImgEx === 0 && attrUrls.length > 0) {
      await prisma.images.createMany({ data: attrUrls.map((url) => ({ url, attractionId: createdAttraction.id })) });
    }
    console.log(`  ✓ ${attraction.title}`);
  }

  // Link paid-entry attractions to the island tour activity via M2M
  if (islandTourActivity) {
    const linkedSlugs = ["guellala-museum", "djerba-heritage-village", "el-ghriba-synagogue", "houmt-souk-medina"];
    const linkedAttractions = await prisma.attraction.findMany({
      where: { slug: { in: linkedSlugs } },
      select: { id: true },
    });
    await prisma.activity.update({
      where: { id: islandTourActivity.id },
      data: { attractions: { set: linkedAttractions.map((a) => ({ id: a.id })) } },
    });
    console.log(`  ✓ Linked ${linkedAttractions.length} attractions → Djerba Island Discovery Tour`);
  }

  // ── Seed badges (dev/test data) ─────────────────────────────────
  console.log("Seeding badges...");

  const djerbaIslandTour = await prisma.activity.findUnique({
    where: { slug: "djerba-island-discovery-tour" },
    select: { id: true },
  });

  const djerbaStay = await prisma.stay.findFirst({
    where: { destinationId: djerbaDest!.id },
    select: { id: true },
  });

  const djerbaRestaurant = await prisma.restaurant.findFirst({
    where: { destinationId: djerbaDest!.id },
    select: { id: true },
  });

  const artisanatShop = await prisma.shop.findUnique({
    where: { slug: "artisanat-djerba" },
    select: { id: true },
  });

  const epicerieShop = await prisma.shop.findUnique({
    where: { slug: "epicerie-du-sahel" },
    select: { id: true },
  });

  const soierieShop = await prisma.shop.findUnique({
    where: { slug: "soierie-houmt-souk" },
    select: { id: true },
  });

  const soukCollective = await prisma.shop.findUnique({
    where: { slug: "the-souk-collective" },
    select: { id: true },
  });

  const desertSpice = await prisma.shop.findUnique({
    where: { slug: "desert-spice-market" },
    select: { id: true },
  });

  const nomadLeather = await prisma.shop.findUnique({
    where: { slug: "nomad-leather-dubai" },
    select: { id: true },
  });

  const djerbaTransfer = await prisma.transfer.findFirst({
    where: { destinationId: djerbaDest!.id },
    select: { id: true },
  });

  const badgesToSeed: Array<{
    badgeKey: "VERIFIED" | "GUEST_FAVORITE" | "REVIEWED_BY_GUIDNI" | "OWNER_OPERATED";
    relationType: string;
    relationId: string;
  }> = [];

  if (djerbaIslandTour) {
    badgesToSeed.push(
      { badgeKey: "VERIFIED", relationType: "ACTIVITY", relationId: djerbaIslandTour.id },
      { badgeKey: "REVIEWED_BY_GUIDNI", relationType: "ACTIVITY", relationId: djerbaIslandTour.id },
    );
  }
  if (djerbaStay) {
    badgesToSeed.push(
      { badgeKey: "VERIFIED", relationType: "STAY", relationId: djerbaStay.id },
      { badgeKey: "OWNER_OPERATED", relationType: "STAY", relationId: djerbaStay.id },
    );
  }
  if (djerbaRestaurant) {
    badgesToSeed.push(
      { badgeKey: "VERIFIED", relationType: "RESTAURANT", relationId: djerbaRestaurant.id },
      { badgeKey: "OWNER_OPERATED", relationType: "RESTAURANT", relationId: djerbaRestaurant.id },
    );
  }
  if (artisanatShop) {
    badgesToSeed.push(
      { badgeKey: "VERIFIED",          relationType: "SHOP", relationId: artisanatShop.id },
      { badgeKey: "OWNER_OPERATED",    relationType: "SHOP", relationId: artisanatShop.id },
      { badgeKey: "GUEST_FAVORITE",    relationType: "SHOP", relationId: artisanatShop.id },
      { badgeKey: "REVIEWED_BY_GUIDNI",relationType: "SHOP", relationId: artisanatShop.id },
    );
  }
  if (epicerieShop) {
    badgesToSeed.push(
      { badgeKey: "VERIFIED",       relationType: "SHOP", relationId: epicerieShop.id },
      { badgeKey: "OWNER_OPERATED", relationType: "SHOP", relationId: epicerieShop.id },
    );
  }
  if (soierieShop) {
    badgesToSeed.push(
      { badgeKey: "VERIFIED",       relationType: "SHOP", relationId: soierieShop.id },
      { badgeKey: "OWNER_OPERATED", relationType: "SHOP", relationId: soierieShop.id },
    );
  }
  if (soukCollective) {
    badgesToSeed.push(
      { badgeKey: "VERIFIED",          relationType: "SHOP", relationId: soukCollective.id },
      { badgeKey: "OWNER_OPERATED",    relationType: "SHOP", relationId: soukCollective.id },
      { badgeKey: "GUEST_FAVORITE",    relationType: "SHOP", relationId: soukCollective.id },
      { badgeKey: "REVIEWED_BY_GUIDNI",relationType: "SHOP", relationId: soukCollective.id },
    );
  }
  if (desertSpice) {
    badgesToSeed.push(
      { badgeKey: "VERIFIED",       relationType: "SHOP", relationId: desertSpice.id },
      { badgeKey: "OWNER_OPERATED", relationType: "SHOP", relationId: desertSpice.id },
    );
  }
  if (nomadLeather) {
    badgesToSeed.push(
      { badgeKey: "VERIFIED",       relationType: "SHOP", relationId: nomadLeather.id },
      { badgeKey: "OWNER_OPERATED", relationType: "SHOP", relationId: nomadLeather.id },
      { badgeKey: "GUEST_FAVORITE", relationType: "SHOP", relationId: nomadLeather.id },
    );
  }
  if (djerbaTransfer) {
    badgesToSeed.push(
      { badgeKey: "VERIFIED", relationType: "TRANSFER", relationId: djerbaTransfer.id },
    );
  }

  for (const badge of badgesToSeed) {
    await prisma.listingBadge.upsert({
      where: {
        badgeKey_relationType_relationId: {
          badgeKey: badge.badgeKey,
          relationType: badge.relationType as never,
          relationId: badge.relationId,
        },
      },
      update: {},
      create: {
        badgeKey: badge.badgeKey,
        relationType: badge.relationType as never,
        relationId: badge.relationId,
      },
    });
  }
  console.log(`Seeded ${badgesToSeed.length} badges`);

  // ── GuidniReviews ─────────────────────────────────────────────────────────

  // 1. ACTIVITY — djerba-island-discovery-tour (PUBLISHED, with social links)
  if (djerbaIslandTour) {
    await prisma.guidniReview.upsert({
      where: { relationType_relationId: { relationType: "ACTIVITY", relationId: djerbaIslandTour.id } },
      update: {
        tiktokUrl: "https://www.tiktok.com/@guidni/video/example-activity",
        instagramUrl: "https://www.instagram.com/p/example-activity",
        facebookUrl: "https://www.facebook.com/guidni/posts/example-activity",
      },
      create: {
        relationType: "ACTIVITY",
        relationId: djerbaIslandTour.id,
        status: "PUBLISHED",
        reviewerName: "Sofia",
        reviewerTitle: "Guidni Travel Editor",
        visitedAt: new Date("2026-02-15"),
        season: "Winter 2026",
        summaryQuote: "A rare authentic experience that captures the soul of Djerba in a single day.",
        fullReview: "The Djerba Island Discovery Tour exceeded every expectation. From the moment our guide Khalil picked us up, it was clear this wasn't a generic bus tour. He navigated the medina's back alleys with the confidence of someone who grew up there — because he did.\n\nThe Guellala Museum stop was a highlight: genuine Berber craftsmanship explained by someone who learned the craft from his grandfather. The El Ghriba Synagogue visit was handled with appropriate reverence, and the guide's knowledge of the island's Jewish heritage was impressive.\n\nLunch at a family home in Houmt Souk was the kind of experience you can't book anywhere else: a grandmother's homemade brik, olives from a grove outside the window, and a mint tea ritual that lasted longer than the meal itself.",
        whatWeLoved: "Genuinely local guide with deep cultural knowledge\nFamily home lunch — not a tourist restaurant\nSmall group size (max 8) — felt personal throughout\nFlexible pace — no rushing between stops",
        worthKnowing: "Full day (8+ hours) — wear comfortable shoes\nLunch is included but dietary needs should be flagged in advance\nSome sites involve steps — not fully accessible",
        bestFor: "Culture lovers, first-time visitors to Djerba, small groups",
        scoreAccuracy: 92,
        scoreQuality: 95,
        scoreValue: 88,
        scorePresent: 90,
        scoreHost: 98,
        scoreTotal: 93,
        publishedAt: new Date("2026-02-20"),
        tiktokUrl: "https://www.tiktok.com/@guidni/video/example-activity",
        instagramUrl: "https://www.instagram.com/p/example-activity",
        facebookUrl: "https://www.facebook.com/guidni/posts/example-activity",
      },
    });
    console.log("Seeded GuidniReview (PUBLISHED) — activity");
  }

  // 2. STAY — first Djerba stay (PUBLISHED)
  if (djerbaStay) {
    await prisma.guidniReview.upsert({
      where: { relationType_relationId: { relationType: "STAY", relationId: djerbaStay.id } },
      update: {},
      create: {
        relationType: "STAY",
        relationId: djerbaStay.id,
        status: "PUBLISHED",
        reviewerName: "Yasmine",
        reviewerTitle: "Guidni Hospitality Editor",
        visitedAt: new Date("2026-03-01"),
        season: "Spring 2026",
        summaryQuote: "Woke up to a sea view, homemade msemen, and absolute quiet. Difficult to leave.",
        fullReview: "Staying here felt less like checking into a riad and more like being welcomed into someone's home. The whitewashed walls, hand-painted tilework, and lemon tree in the courtyard aren't props — they're the real thing, carefully maintained by the same family for three generations.\n\nThe room was spotless. The bed linen was changed daily without being asked. Breakfast arrived exactly when requested: msemen, honey from a local hive, fresh orange juice, and strong coffee. Nothing came from a packet.\n\nThe location — a 10-minute walk from Houmt Souk's port, away from the main tourist drag — struck the right balance between accessibility and calm. We slept with the window open to the sound of the sea.",
        whatWeLoved: "Genuine riad character — not a hotel pretending to be one\nBreakfast made fresh each morning, locally sourced\nFront-facing rooms have unobstructed sea views\nHost answered every question within minutes",
        worthKnowing: "No lift — upper-floor rooms require stairs\nParking is on the street, not on-site\nBook the sea-view room directly — worth the slight premium",
        bestFor: "Couples, slow travellers, anyone wanting a genuine Djerban stay",
        scoreAccuracy: 96,
        scoreQuality: 94,
        scoreValue: 91,
        scorePresent: 97,
        scoreHost: 99,
        scoreTotal: 95,
        publishedAt: new Date("2026-03-08"),
        tiktokUrl: "https://www.tiktok.com/@guidni/video/example-stay",
        instagramUrl: "https://www.instagram.com/p/example-stay",
      },
    });
    // Ensure REVIEWED_BY_GUIDNI badge exists for this stay
    await prisma.listingBadge.upsert({
      where: { badgeKey_relationType_relationId: { badgeKey: "REVIEWED_BY_GUIDNI", relationType: "STAY", relationId: djerbaStay.id } },
      update: {},
      create: { badgeKey: "REVIEWED_BY_GUIDNI", relationType: "STAY", relationId: djerbaStay.id },
    });
    console.log("Seeded GuidniReview (PUBLISHED) — stay");
  }

  // 3. RESTAURANT — first Djerba restaurant (UNDER_REVIEW — drafted, not yet published)
  if (djerbaRestaurant) {
    await prisma.guidniReview.upsert({
      where: { relationType_relationId: { relationType: "RESTAURANT", relationId: djerbaRestaurant.id } },
      update: {},
      create: {
        relationType: "RESTAURANT",
        relationId: djerbaRestaurant.id,
        status: "UNDER_REVIEW",
        reviewerName: "Karim",
        reviewerTitle: "Guidni Food Editor",
        visitedAt: new Date("2026-03-18"),
        season: "Spring 2026",
        summaryQuote: "The kind of table you tell people about and then regret, because now they'll all want to go.",
        fullReview: "Dar Houmt Souk is the restaurant Djerba needed someone to write about properly. The dining room is in a restored courtyard with a retractable roof — on the night we visited, the stars were out and the candles were the only other light source. Dramatically good.\n\nThe menu is short, which is always a good sign. Everything we ate — the tuna brik, the grilled octopus, the lamb with harrissa dipping sauce — arrived as though it had just been thought of, not assembled from a mise en place made six hours earlier. The chef works a visible open kitchen and clearly takes requests personally.\n\nService was relaxed and knowledgeable. When we asked about the wine list, the waiter explained each bottle rather than reciting prices.",
        whatWeLoved: "Stunning courtyard setting — exceptional on clear evenings\nShort seasonal menu with obvious quality sourcing\nOctopus dish — one of the best we've had on the island\nAttentive but never intrusive service",
        worthKnowing: "Reservation strongly recommended — only 8 tables\nCash preferred, card payment available but ask in advance\nClosed Mondays",
        bestFor: "Special occasions, food lovers, couples",
        scoreAccuracy: 94,
        scoreQuality: 97,
        scoreValue: 85,
        scorePresent: 98,
        scoreHost: 93,
        scoreTotal: 93,
        partnerOffer: "Free table for 2 — full tasting menu (5 courses) + drinks included\nBest times: Tuesday–Saturday evenings after 19:30\nHighlight: new spring menu launching March 2026\nContact: Nour — +216 74 xxx xxx",
      },
    });
    console.log("Seeded GuidniReview (UNDER_REVIEW) — restaurant");
  }

  // 4. SHOP — Artisanat Djerba (PUBLISHED)
  if (artisanatShop) {
    await prisma.guidniReview.upsert({
      where: { relationType_relationId: { relationType: "SHOP", relationId: artisanatShop.id } },
      update: {
        status:        "PUBLISHED",
        reviewerName:  "Leila",
        reviewerTitle: "Guidni Craft & Culture Editor",
        visitedAt:     new Date("2026-03-10"),
        season:        "Spring 2026",
        summaryQuote:  "The kind of craft shop that reminds you why handmade things matter.",
        fullReview:    "We spent nearly three hours at Artisanat Djerba and still felt we left too soon. The shop sits inside a restored stone courtyard just off Souk el Attarine — you could walk past it without noticing, which is part of the charm. Hassan, the owner, has been selling crafts here since his father's time, and his knowledge of what each piece means, which village it came from, which technique was used, is extraordinary.\n\nThe ceramics are the standout. Every bowl and vase is hand-thrown, then hand-painted using natural mineral pigments that Hassan sources himself from the Guellala potters. Nothing is imported. The Berber patterns are not decorative shortcuts — they are geometric vocabularies that have been passed down for centuries, and Hassan can explain every one of them.\n\nThe woven pieces — kilims, cushion covers, baskets — are equally impressive. The hand-knotted kilim rug we examined took one weaver eight weeks to complete. When you understand that, the price becomes not a question but an obvious statement of value.",
        whatWeLoved:   "Everything is genuinely made on the island — no imports\nHassan's storytelling turns shopping into an education\nLive pottery demonstration on request — a rare experience\nPricing is honest and the quality justifies every dinar",
        worthKnowing:  "The shop can get busy in July–August — visit in the morning\nLarge items (rugs, blankets) can be shipped internationally on request\nCash preferred, though card is accepted",
        bestFor:       "Craft lovers, design-conscious shoppers, thoughtful gift seekers",
        scoreAccuracy: 95,
        scoreQuality:  98,
        scoreValue:    90,
        scorePresent:  93,
        scoreHost:     99,
        scoreTotal:    95,
        publishedAt:   new Date("2026-03-18"),
        instagramUrl:  "https://www.instagram.com/p/example-shop-djerba",
        partnerOffer:  "Welcome gift for Guidni visitors — free palm basket (worth 30 TND) with any purchase over 100 TND\nMention 'Guidni' at checkout\nContact: Hassan — +216 75 xxx xxx",
      },
      create: {
        relationType:  "SHOP",
        relationId:    artisanatShop.id,
        status:        "PUBLISHED",
        reviewerName:  "Leila",
        reviewerTitle: "Guidni Craft & Culture Editor",
        visitedAt:     new Date("2026-03-10"),
        season:        "Spring 2026",
        summaryQuote:  "The kind of craft shop that reminds you why handmade things matter.",
        fullReview:    "We spent nearly three hours at Artisanat Djerba and still felt we left too soon. The shop sits inside a restored stone courtyard just off Souk el Attarine — you could walk past it without noticing, which is part of the charm. Hassan, the owner, has been selling crafts here since his father's time, and his knowledge of what each piece means, which village it came from, which technique was used, is extraordinary.\n\nThe ceramics are the standout. Every bowl and vase is hand-thrown, then hand-painted using natural mineral pigments that Hassan sources himself from the Guellala potters. Nothing is imported. The Berber patterns are not decorative shortcuts — they are geometric vocabularies that have been passed down for centuries, and Hassan can explain every one of them.\n\nThe woven pieces — kilims, cushion covers, baskets — are equally impressive. The hand-knotted kilim rug we examined took one weaver eight weeks to complete. When you understand that, the price becomes not a question but an obvious statement of value.",
        whatWeLoved:   "Everything is genuinely made on the island — no imports\nHassan's storytelling turns shopping into an education\nLive pottery demonstration on request — a rare experience\nPricing is honest and the quality justifies every dinar",
        worthKnowing:  "The shop can get busy in July–August — visit in the morning\nLarge items (rugs, blankets) can be shipped internationally on request\nCash preferred, though card is accepted",
        bestFor:       "Craft lovers, design-conscious shoppers, thoughtful gift seekers",
        scoreAccuracy: 95,
        scoreQuality:  98,
        scoreValue:    90,
        scorePresent:  93,
        scoreHost:     99,
        scoreTotal:    95,
        publishedAt:   new Date("2026-03-18"),
        instagramUrl:  "https://www.instagram.com/p/example-shop-djerba",
        partnerOffer:  "Welcome gift for Guidni visitors — free palm basket (worth 30 TND) with any purchase over 100 TND\nMention 'Guidni' at checkout\nContact: Hassan — +216 75 xxx xxx",
      },
    });
    // Ensure REVIEWED_BY_GUIDNI badge is set
    await prisma.listingBadge.upsert({
      where: { badgeKey_relationType_relationId: { badgeKey: "REVIEWED_BY_GUIDNI", relationType: "SHOP", relationId: artisanatShop.id } },
      update: {},
      create: { badgeKey: "REVIEWED_BY_GUIDNI", relationType: "SHOP", relationId: artisanatShop.id },
    });
    console.log("Seeded GuidniReview (PUBLISHED) — Artisanat Djerba");
  }

  // 5b. SHOP — The Souk Collective Dubai (PUBLISHED)
  if (soukCollective) {
    await prisma.guidniReview.upsert({
      where: { relationType_relationId: { relationType: "SHOP", relationId: soukCollective.id } },
      update: {},
      create: {
        relationType: "SHOP",
        relationId: soukCollective.id,
        status: "PUBLISHED",
        reviewerName: "Nadia",
        reviewerTitle: "Guidni Lifestyle Editor",
        visitedAt: new Date("2026-02-28"),
        season: "Spring 2026",
        summaryQuote: "The antidote to Dubai's airport souvenir shops — real objects with real stories.",
        fullReview: "The Souk Collective sits inside Al Fahidi Historical Neighbourhood, which is already the most atmospheric part of Old Dubai. Finding it requires a short walk through narrow shaded lanes — and that walk is exactly the right way to arrive, because it prepares you for a shop that operates at a completely different pace from the rest of the city.\n\nThe curation is exceptional. Every piece has a typed card explaining its origin, technique, and the craftsperson who made it. The brass dallah coffee pots are sourced from a single family of metalworkers in Oman. The mother-of-pearl boxes come from a workshop in Sharjah that has been operating since the 1960s. The calligraphy prints are hand-drawn by a young Dubai-based artist who trained under a master in Damascus.\n\nThe oud incense selection alone would justify the visit. The owner blends several varieties in-house — including a 'desert after rain' blend that is unlike anything sold elsewhere in the city. We bought three boxes.",
        whatWeLoved: "Every product has provenance — the typed cards are genuinely informative\nOud incense blended in-house: complex, long-lasting, nothing like mass-market versions\nStaff are knowledgeable without being pushy — rare in a tourist area\nThe brass dallah collection is the best we have seen in Dubai",
        worthKnowing: "Al Fahidi neighbourhood is closed to vehicles — arrive by taxi to the entrance\nBusy on weekend mornings; quieter on weekday afternoons\nInternational shipping available for fragile items — ask at the counter",
        bestFor: "Discerning gift buyers, design lovers, anyone who wants authentic Dubai",
        scoreAccuracy: 97,
        scoreQuality: 96,
        scoreValue: 88,
        scorePresent: 99,
        scoreHost: 95,
        scoreTotal: 95,
        publishedAt: new Date("2026-03-07"),
        instagramUrl: "https://www.instagram.com/p/example-shop-dubai",
        tiktokUrl: "https://www.tiktok.com/@guidni/video/example-shop-dubai",
        partnerOffer: "Complimentary gift wrapping + 10% discount for Guidni visitors on any purchase\nMention 'Guidni' at checkout\nContact: Mariam — +971 50 xxx xxxx",
      },
    });
    await prisma.listingBadge.upsert({
      where: { badgeKey_relationType_relationId: { badgeKey: "REVIEWED_BY_GUIDNI", relationType: "SHOP", relationId: soukCollective.id } },
      update: {},
      create: { badgeKey: "REVIEWED_BY_GUIDNI", relationType: "SHOP", relationId: soukCollective.id },
    });
    console.log("Seeded GuidniReview (PUBLISHED) — The Souk Collective");
  }

  // 5c. SHOP — Nomad Leather (UNDER_REVIEW — drafted, pending final edit)
  if (nomadLeather) {
    await prisma.guidniReview.upsert({
      where: { relationType_relationId: { relationType: "SHOP", relationId: nomadLeather.id } },
      update: {},
      create: {
        relationType: "SHOP",
        relationId: nomadLeather.id,
        status: "UNDER_REVIEW",
        reviewerName: "Karim",
        reviewerTitle: "Guidni Craft & Culture Editor",
        visitedAt: new Date("2026-03-20"),
        season: "Spring 2026",
        summaryQuote: "Handmade leather that you can feel the difference in the moment you pick it up.",
        fullReview: "Nomad Leather occupies a narrow shopfront in the Gold Souk area of Deira, easy to miss but impossible to forget once you've been inside. The owner, Tariq, trained as a leather craftsman in Morocco before moving to Dubai 15 years ago. Everything in the shop is made in the workshop behind the counter — a room you can see directly from the entrance, where two artisans cut and stitch throughout the day.\n\nThe camel leather wallet was the first thing we handled and the last thing we put down. The grain is distinctive — slightly more pronounced than European calfskin, with a warmth to the tone that photographs can't fully capture. The saddle stitching is done by hand using waxed linen thread, double-knotted at every fourth stitch to prevent unravelling.\n\nWe left with a wallet, a passport holder, and a journal cover. All three arrived home with us without a scratch. The packaging — tissue paper, a cotton dust bag, a handwritten note — was a final touch that felt completely sincere.",
        whatWeLoved: "Workshop is visible from the shop — craftsmanship is transparent\nCamel leather quality is exceptional and ages beautifully\nPersonalisation (monogramming) available with 2 days' notice\nPackaging is thoughtful and gift-ready",
        worthKnowing: "Minimum order for personalised pieces is 3 working days\nShipping available worldwide but confirm fragile fittings with the team\nCash transactions slightly discounted — worth asking",
        bestFor: "Leather lovers, executive gift buyers, quality-over-quantity travellers",
        scoreAccuracy: 96,
        scoreQuality: 99,
        scoreValue: 87,
        scorePresent: 94,
        scoreHost: 97,
        scoreTotal: 95,
        partnerOffer: "Free monogramming (2 initials) on any purchase for Guidni visitors\nMention 'Guidni' at checkout\nContact: Tariq — +971 55 xxx xxxx",
      },
    });
    console.log("Seeded GuidniReview (UNDER_REVIEW) — Nomad Leather");
  }

  // 5. TRANSFER — first Djerba transfer (PENDING — request just submitted)
  if (djerbaTransfer) {
    await prisma.guidniReview.upsert({
      where: { relationType_relationId: { relationType: "TRANSFER", relationId: djerbaTransfer.id } },
      update: {},
      create: {
        relationType: "TRANSFER",
        relationId: djerbaTransfer.id,
        status: "PENDING",
        partnerOffer: "Free round-trip airport transfer — standard sedan, meet & greet with name sign included\nBest times: any day, available 06:00–22:00\nHighlight: new vehicle fleet (2025 models), English-speaking drivers\nContact: Mehdi — +216 73 xxx xxx",
      },
    });
    console.log("Seeded GuidniReview (PENDING) — transfer");
  }

  // ─────────────────────────────────────────────────────────────
  // Sample public plans
  // ─────────────────────────────────────────────────────────────

  // Fetch real IDs from DB for the sample itinerary
  const planActivities = await prisma.activity.findMany({
    where: { destinationId: djerbaDest!.id },
    select: { id: true, slug: true, title: true },
    take: 4,
  });
  const planAttractions = await prisma.attraction.findMany({
    where: { destinationId: djerbaDest!.id },
    select: { id: true, slug: true, title: true },
    take: 2,
  });
  const planRestaurants = await prisma.restaurant.findMany({
    where: { destinationId: djerbaDest!.id },
    select: { id: true, slug: true, name: true },
    take: 3,
  });

  const act1 = planActivities[0];
  const act2 = planActivities[1];
  const act3 = planActivities[2];
  const attr1 = planAttractions[0];
  const rest1 = planRestaurants[0];
  const rest2 = planRestaurants[1];
  const rest3 = planRestaurants[2];

  if (act1 && attr1 && rest1 && rest2 && rest3) {
    const sampleItinerary = [
      {
        dayNumber: 1,
        theme: "Arrival & First Impressions",
        notes: "Check in to your accommodation and get settled. Take a gentle stroll through the old medina in the afternoon.",
        blocks: [
          {
            id: "seed-slot-1",
            slotType: "afternoon",
            time: { start: "14:00", end: "16:30" },
            item: {
              id: attr1.id,
              type: "ATTRACTION",
              slug: attr1.slug,
              name: attr1.title,
              price: 0,
              priceLabel: "free",
              tags: ["culture", "history"],
              intensity: "low",
              idealTime: "afternoon",
              bookingUrl: `/destinations/djerba/attractions/${attr1.slug}`,
            },
          },
          {
            id: "seed-slot-2",
            slotType: "evening",
            time: { start: "19:30", end: "21:30" },
            item: {
              id: rest1.id,
              type: "RESTAURANT",
              slug: rest1.slug,
              name: rest1.name,
              price: 0,
              priceLabel: "~TND 45/person",
              tags: ["food_drink", "tunisian"],
              intensity: "low",
              idealTime: "evening",
              bookingUrl: `/restaurants/${rest1.slug}`,
            },
          },
        ],
      },
      {
        dayNumber: 2,
        theme: "Culture & Heritage",
        notes: "Start early for the best experience at historical sites. Book your activity in advance to secure your spot.",
        blocks: [
          {
            id: "seed-slot-3",
            slotType: "morning",
            time: { start: "09:00", end: "12:00" },
            item: {
              id: act1.id,
              type: "ACTIVITY",
              slug: act1.slug,
              name: act1.title,
              price: 50,
              priceLabel: "per person",
              tags: ["culture", "sightseeing"],
              intensity: "medium",
              idealTime: "morning",
              bookingUrl: `/activities/${act1.slug}`,
            },
          },
          {
            id: "seed-slot-4",
            slotType: "lunch",
            time: { start: "12:30", end: "14:00" },
            item: {
              id: rest2.id,
              type: "RESTAURANT",
              slug: rest2.slug,
              name: rest2.name,
              price: 0,
              priceLabel: "~TND 30/person",
              tags: ["food_drink"],
              intensity: "low",
              idealTime: "lunch",
              bookingUrl: `/restaurants/${rest2.slug}`,
            },
          },
          {
            id: "seed-slot-5",
            slotType: "afternoon",
            time: { start: "15:00", end: "17:30" },
            item: {
              id: act2 ? act2.id : act1.id,
              type: "ACTIVITY",
              slug: act2 ? act2.slug : act1.slug,
              name: act2 ? act2.title : act1.title,
              price: 35,
              priceLabel: "per person",
              tags: ["adventures", "nature_wildlife"],
              intensity: "medium",
              idealTime: "afternoon",
              bookingUrl: `/activities/${act2 ? act2.slug : act1.slug}`,
            },
          },
          {
            id: "seed-slot-6",
            slotType: "evening",
            time: { start: "19:00", end: "21:00" },
            item: {
              id: rest3.id,
              type: "RESTAURANT",
              slug: rest3.slug,
              name: rest3.name,
              price: 0,
              priceLabel: "~TND 45/person",
              tags: ["food_drink", "romantic"],
              intensity: "low",
              idealTime: "evening",
              bookingUrl: `/restaurants/${rest3.slug}`,
            },
          },
        ],
      },
      {
        dayNumber: 3,
        theme: "Farewell & Memories",
        notes: "Check-out time applies — confirm with your accommodation. Allow extra time for airport transfers on departure day.",
        blocks: [
          {
            id: "seed-slot-7",
            slotType: "morning",
            time: { start: "09:30", end: "12:00" },
            item: {
              id: act3 ? act3.id : act1.id,
              type: "ACTIVITY",
              slug: act3 ? act3.slug : act1.slug,
              name: act3 ? act3.title : act1.title,
              price: 60,
              priceLabel: "per person",
              tags: ["adventures", "water_sports"],
              intensity: "high",
              idealTime: "morning",
              bookingUrl: `/activities/${act3 ? act3.slug : act1.slug}`,
            },
          },
        ],
      },
    ];

    const samplePreferences = {
      destinationId:      djerbaDest!.id,
      destinationName:    "Djerba, Tunisia",
      destinationCity:    "Djerba",
      duration:           3,
      travelStyle:        "balanced",
      budget:             2,
      groupType:          "couple",
      interests:          ["culture", "food_drink", "adventures"],
      accommodationType:  "riad",
      needsAirportPickup: false,
      needsReturnTransfer:false,
      needsRental:        false,
    };

    await prisma.plan.upsert({
      where:  { id: "seed-plan-djerba-couple-3day" },
      update: {},
      create: {
        id:          "seed-plan-djerba-couple-3day",
        title:       "3-Day Djerba Escape for Two",
        duration:    3,
        isPublic:    true,
        generatedBy: "algorithm",
        preferences: samplePreferences,
        itinerary:   { days: sampleItinerary, stays: [], rentals: [] },
        userId:      CUSTOMER_IDS.emma,
        destinationId: djerbaDest!.id,
      },
    });
    console.log("Seeded sample plan — Djerba 3-day couple");
  }

  // ─── Guide profiles + guide plans ────────────────────────────────────────────
  console.log("\nSeeding guide profiles...");

  // Create demo guide users first
  const guideUser1 = await prisma.user.upsert({
    where:  { email: "ahmed.guide@guidni.demo" },
    update: {},
    create: {
      id:            "seed-guide-user-ahmed",
      email:         "ahmed.guide@guidni.demo",
      name:          "Ahmed Benhassine",
      role:          "PARTNER",
      emailVerified: true,
      createdAt:     new Date(),
      updatedAt:     new Date(),
    },
  });

  const guideUser2 = await prisma.user.upsert({
    where:  { email: "fatima.guide@guidni.demo" },
    update: {},
    create: {
      id:            "seed-guide-user-fatima",
      email:         "fatima.guide@guidni.demo",
      name:          "Fatima Khelil",
      role:          "PARTNER",
      emailVerified: true,
      createdAt:     new Date(),
      updatedAt:     new Date(),
    },
  });

  // Create guide profiles
  const guideProfile1 = await prisma.guideProfile.upsert({
    where:  { slug: "ahmed-benhassine" },
    update: {},
    create: {
      id:              "seed-guide-profile-ahmed",
      slug:            "ahmed-benhassine",
      displayName:     "Ahmed Benhassine",
      tagline:         "Djerba local · 15 years · Culture & Food expert",
      bio:             "I was born and raised in Houmt Souk, the heart of Djerba. After 15 years of welcoming travelers to my island, I know every hidden beach, every artisan's workshop, and every grandmother's recipe restaurant. My plans aren't built from TripAdvisor reviews — they're built from a lifetime of living here. I specialize in showing you the Djerba that locals love, not the tourist version.",
      specializations: ["culture", "food_drink", "sightseeing", "shopping"],
      languages:       ["Arabic", "French", "English"],
      experienceYears: 15,
      country:         "Tunisia",
      isVerified:      true,
      isFeatured:      true,
      isActive:        true,
      nbReviews:       38,
      planCount:       2,
      note:            "4.9",
      userId:          guideUser1.id,
      destinationId:   djerbaDest!.id,
    },
  });

  const guideProfile2 = await prisma.guideProfile.upsert({
    where:  { slug: "fatima-khelil-food" },
    update: {},
    create: {
      id:              "seed-guide-profile-fatima",
      slug:            "fatima-khelil-food",
      displayName:     "Fatima Khelil",
      tagline:         "Food blogger & Djerba native · 8 years documenting local cuisine",
      bio:             "I started documenting Djerba's food scene eight years ago and never stopped. I've eaten at every restaurant, interviewed every chef, and photographed every market stall. My plans are food-first — every day built around the best meal of the day, with the sightseeing woven in between. If you're visiting Djerba and care about eating well, follow my plan.",
      specializations: ["food_drink", "culture", "wellness", "shopping"],
      languages:       ["Arabic", "French"],
      experienceYears: 8,
      country:         "Tunisia",
      isVerified:      true,
      isFeatured:      false,
      isActive:        true,
      nbReviews:       22,
      planCount:       1,
      note:            "4.7",
      userId:          guideUser2.id,
      destinationId:   djerbaDest!.id,
    },
  });

  // Guide plan 1 — Ahmed's 3-day plan
  const guidePlan1Itinerary = [
    {
      dayNumber: 1,
      theme: "The Medina & Jewish Quarter",
      notes: "Start early — El Ghriba gets crowded after 2pm. Skip the tourist-trap cafés on the main square and head to Café Zeitoun, two streets in.",
      blocks: [
        { id: "gp1-d1-morning", slotType: "morning", time: { start: "09:00", end: "11:30" }, item: { id: "seed-gp1-attraction-1", type: "ATTRACTION", name: "El Ghriba Synagogue", slug: "el-ghriba-synagogue", price: 0, tags: ["culture", "history"], intensity: "low" } },
        { id: "gp1-d1-lunch",   slotType: "lunch",   time: { start: "12:30", end: "14:00" }, item: { id: "seed-gp1-rest-1", type: "RESTAURANT", name: "Dar Houmt Souk", slug: "dar-houmt-souk", price: 40, tags: ["tunisian", "culture"], intensity: "low" } },
        { id: "gp1-d1-afternoon", slotType: "afternoon", time: { start: "15:00", end: "17:30" }, item: { id: "seed-gp1-attraction-2", type: "ATTRACTION", name: "Houmt Souk Medina", slug: "houmt-souk-medina", price: 0, tags: ["culture", "shopping"], intensity: "low" } },
      ],
    },
    {
      dayNumber: 2,
      theme: "The Coastline Day",
      notes: "Rent a bicycle or scooter for today — you'll cover 12km of coast. The beach at Sidi Mahres is quieter in the morning before tour groups arrive.",
      blocks: [
        { id: "gp1-d2-morning", slotType: "morning", time: { start: "08:30", end: "12:00" }, item: { id: "seed-gp1-activity-1", type: "ACTIVITY", name: "Sidi Mahres Beach Morning", slug: "sidi-mahres-beach", price: 0, tags: ["beach", "nature_wildlife"], intensity: "low" } },
        { id: "gp1-d2-lunch",   slotType: "lunch",   time: { start: "13:00", end: "14:30" }, item: { id: "seed-gp1-rest-2", type: "RESTAURANT", name: "La Plage Café", slug: "la-plage-cafe", price: 25, tags: ["seafood", "sea_view"], intensity: "low" } },
        { id: "gp1-d2-afternoon", slotType: "afternoon", time: { start: "15:30", end: "18:00" }, item: { id: "seed-gp1-activity-2", type: "ACTIVITY", name: "Flamingo Lagoon Walk", slug: "flamingo-lagoon", price: 0, tags: ["nature_wildlife", "sightseeing"], intensity: "low" } },
      ],
    },
    {
      dayNumber: 3,
      theme: "Hidden Villages & Craft Workshops",
      notes: "Today is off the beaten path. Take a taxi to Guellala — the potters' village. The craft workshops are open 8am–noon, closed in the afternoon. Arrive early.",
      blocks: [
        { id: "gp1-d3-morning", slotType: "morning", time: { start: "09:00", end: "12:00" }, item: { id: "seed-gp1-activity-3", type: "ACTIVITY", name: "Guellala Pottery Village", slug: "guellala-pottery", price: 0, tags: ["culture", "workshops"], intensity: "low" } },
        { id: "gp1-d3-lunch",   slotType: "lunch",   time: { start: "13:00", end: "14:30" }, item: { id: "seed-gp1-rest-3", type: "RESTAURANT", name: "Le Berbère", slug: "le-berbere", price: 35, tags: ["north_african"], intensity: "low" } },
        { id: "gp1-d3-afternoon", slotType: "afternoon", time: { start: "15:30", end: "18:00" }, item: { id: "seed-gp1-attraction-3", type: "ATTRACTION", name: "Djerba Explore Museum", slug: "djerba-explore", price: 15, tags: ["culture", "history"], intensity: "low" } },
      ],
    },
  ];

  await prisma.plan.upsert({
    where:  { id: "seed-guide-plan-ahmed-3day" },
    update: {},
    create: {
      id:          "seed-guide-plan-ahmed-3day",
      title:       "The Real Djerba — 3 Days",
      duration:    3,
      isPublic:    true,
      planType:    "GUIDE_FREE",
      generatedBy: "guide",
      summary:     "Built for travelers who want to feel Djerba — not just see it. Day 1 is the medina and Jewish Quarter, Day 2 is the coast, Day 3 is the countryside and craft villages. All on foot except one taxi. The guide notes are the real value — local tips that aren't on any review site.",
      tags:        ["culture", "food", "beach", "history"],
      difficulty:  "easy",
      suitableFor: ["couple", "solo", "friends"],
      season: ["Any"],
      previewDays: 1,
      price:       0,
      isPaidPlan:  false,
      purchaseCount: 87,
      viewCount:   340,
      preferences: {
        duration:           3,
        interests:          ["culture", "food_drink", "sightseeing"],
        budget:             2,
        travelStyle:        "balanced",
        accommodationType:  "riad",
        groupType:          "couple",
        destinationId:      djerbaDest!.id,
        destinationName:    "Djerba, Tunisia",
        destinationCity:    "Djerba",
        needsAirportPickup: false,
        needsRental:        false,
      },
      itinerary:    { days: guidePlan1Itinerary, stays: [], rentals: [] },
      userId:       guideUser1.id,
      guideId:      guideProfile1.id,
      destinationId: djerbaDest!.id,
    },
  });

  // Guide plan 2 — Ahmed's 7-day plan
  await prisma.plan.upsert({
    where:  { id: "seed-guide-plan-ahmed-7day" },
    update: {},
    create: {
      id:          "seed-guide-plan-ahmed-7day",
      title:       "Complete Djerba Island Escape — 7 Days",
      duration:    7,
      isPublic:    true,
      planType:    "GUIDE_FREE",
      generatedBy: "guide",
      summary:     "Every corner of the island, in seven days. From the historic synagogue to the flamingo lagoon, from the potters' village to the fish market at dawn. I've done this exact route with dozens of families and couples. It works. The pacing is relaxed — you'll never feel rushed.",
      tags:        ["culture", "beach", "food", "nature", "history", "shopping"],
      difficulty:  "easy",
      suitableFor: ["family", "couple", "solo"],
      season: ["Any"],
      previewDays: 2,
      price:       0,
      isPaidPlan:  false,
      purchaseCount: 42,
      viewCount:   210,
      preferences: {
        duration:           7,
        interests:          ["culture", "food_drink", "nature_wildlife", "shopping"],
        budget:             2,
        travelStyle:        "relaxed",
        accommodationType:  "hotel",
        groupType:          "family",
        destinationId:      djerbaDest!.id,
        destinationName:    "Djerba, Tunisia",
        destinationCity:    "Djerba",
        needsAirportPickup: true,
        needsRental:        true,
        rentalType:         "car",
      },
      itinerary:    { days: guidePlan1Itinerary, stays: [], rentals: [] },
      userId:       guideUser1.id,
      guideId:      guideProfile1.id,
      destinationId: djerbaDest!.id,
    },
  });

  // Guide plan 3 — Fatima's food plan
  await prisma.plan.upsert({
    where:  { id: "seed-guide-plan-fatima-food" },
    update: {},
    create: {
      id:          "seed-guide-plan-fatima-food",
      title:       "Djerba Through Food — 4 Days",
      duration:    4,
      isPublic:    true,
      planType:    "GUIDE_FREE",
      generatedBy: "guide",
      summary:     "Every day built around the best meal of the day — with the sightseeing woven around it. Four days, four unforgettable meals: the fish market at dawn, a family kitchen lunch, a cliffside dinner, a late-night pastry crawl. If you're visiting Djerba and care about eating well, this is your plan.",
      tags:        ["food", "culture", "local", "city"],
      difficulty:  "easy",
      suitableFor: ["couple", "solo", "friends"],
      season: ["Any"],
      previewDays: 1,
      price:       0,
      isPaidPlan:  false,
      purchaseCount: 31,
      viewCount:   185,
      preferences: {
        duration:           4,
        interests:          ["food_drink", "culture", "sightseeing"],
        budget:             2,
        travelStyle:        "relaxed",
        accommodationType:  "riad",
        groupType:          "couple",
        destinationId:      djerbaDest!.id,
        destinationName:    "Djerba, Tunisia",
        destinationCity:    "Djerba",
        needsAirportPickup: false,
        needsRental:        false,
      },
      itinerary:    { days: guidePlan1Itinerary, stays: [], rentals: [] },
      userId:       guideUser2.id,
      guideId:      guideProfile2.id,
      destinationId: djerbaDest!.id,
    },
  });

  // Seed reviews for guides and plans
  const guideReviewsData = [
    // ── Ahmed guide reviews ───────────────────────────────────────────────
    { userId: CUSTOMER_IDS.sarah,   userName: "Sarah Johnson",   relationId: guideProfile1.id,               relationType: "GUIDE" as const, rating: 5, title: "Best decision we made", comment: "We followed Ahmed's 3-day plan and it was the highlight of our whole trip. He knows every hidden gem on the island. Couldn't recommend more highly.", createdAt: d(14) },
    { userId: CUSTOMER_IDS.emma,    userName: "Emma Wilson",     relationId: guideProfile1.id,               relationType: "GUIDE" as const, rating: 5, title: "A true local expert",    comment: "Ahmed's plans are not your typical tourist itinerary. They're built from real local knowledge — the restaurant tip alone made the whole trip.", createdAt: d(22) },
    { userId: CUSTOMER_IDS.marco,   userName: "Marco Rossi",     relationId: guideProfile1.id,               relationType: "GUIDE" as const, rating: 5, title: "Absolutely flawless",    comment: "Used the 7-day plan with my family. Every day was perfectly paced and the guide notes in each slot saved us so much time and money.", createdAt: d(35) },
    { userId: CUSTOMER_IDS.youssef, userName: "Youssef Benali",  relationId: guideProfile1.id,               relationType: "GUIDE" as const, rating: 4, title: "Excellent local guide",  comment: "Great cultural insight and very well-organised itinerary. The morning slot at El Ghriba before the crowds arrive was a game-changer.", createdAt: d(50) },

    // ── Fatima guide reviews ──────────────────────────────────────────────
    { userId: CUSTOMER_IDS.amir,    userName: "Amir Hassan",     relationId: guideProfile2.id,               relationType: "GUIDE" as const, rating: 5, title: "Food paradise plan",     comment: "Fatima's food plan is exceptional. Every restaurant recommendation was a 10/10. The fish market at dawn is a memory I will keep forever.", createdAt: d(10) },
    { userId: CUSTOMER_IDS.sarah,   userName: "Sarah Johnson",   relationId: guideProfile2.id,               relationType: "GUIDE" as const, rating: 4, title: "Perfect for food lovers", comment: "If you love food and want to eat like a local in Djerba, this is the plan to follow. Fatima knows every chef on the island personally.", createdAt: d(18) },

    // ── Ahmed's 3-day plan reviews ────────────────────────────────────────
    { userId: CUSTOMER_IDS.emma,    userName: "Emma Wilson",     relationId: "seed-guide-plan-ahmed-3day",   relationType: "PLAN" as const,  rating: 5, title: "Followed this exactly",  comment: "We followed every slot of this plan and had the most perfect 3 days in Djerba. The guide notes are gold — not in any guidebook.", createdAt: d(8) },
    { userId: CUSTOMER_IDS.marco,   userName: "Marco Rossi",     relationId: "seed-guide-plan-ahmed-3day",   relationType: "PLAN" as const,  rating: 5, title: "Perfect weekend plan",   comment: "Ideal for a first-time visit. The balance between culture and relaxation is exactly right. Ahmed clearly knows this island inside out.", createdAt: d(19) },
    { userId: CUSTOMER_IDS.youssef, userName: "Youssef Benali",  relationId: "seed-guide-plan-ahmed-3day",   relationType: "PLAN" as const,  rating: 4, title: "Highly recommended",     comment: "Really well-structured plan. The timing suggestions are spot on — especially arriving at El Ghriba before noon.", createdAt: d(30) },

    // ── Ahmed's 7-day plan reviews ────────────────────────────────────────
    { userId: CUSTOMER_IDS.sarah,   userName: "Sarah Johnson",   relationId: "seed-guide-plan-ahmed-7day",   relationType: "PLAN" as const,  rating: 5, title: "7 days, zero wasted",    comment: "I was travelling with my family and this plan kept everyone happy — beaches for the kids, history for me, restaurants for my husband. Brilliant.", createdAt: d(12) },
    { userId: CUSTOMER_IDS.amir,    userName: "Amir Hassan",     relationId: "seed-guide-plan-ahmed-7day",   relationType: "PLAN" as const,  rating: 5, title: "The complete Djerba plan", comment: "I've been to Djerba twice before and thought I knew everything. This plan showed me four places I'd never heard of. Outstanding.", createdAt: d(28) },

    // ── Fatima's food plan reviews ────────────────────────────────────────
    { userId: CUSTOMER_IDS.marco,   userName: "Marco Rossi",     relationId: "seed-guide-plan-fatima-food",  relationType: "PLAN" as const,  rating: 5, title: "Life-changing food trip", comment: "The cliffside dinner on Day 3 is the single best meal I have ever had in my life. Fatima's notes told us exactly what to order. Perfect.", createdAt: d(6) },
    { userId: CUSTOMER_IDS.emma,    userName: "Emma Wilson",     relationId: "seed-guide-plan-fatima-food",  relationType: "PLAN" as const,  rating: 5, title: "A foodie dream come true", comment: "Four days, four completely different dining experiences, all connected by a love of local Tunisian cuisine. This plan is a masterpiece.", createdAt: d(15) },
  ];

  // createMany doesn't work well here because reviews might already exist on re-seed
  // Use upsert on a deterministic id instead
  for (const r of guideReviewsData) {
    await prisma.review.upsert({
      where: {
        id: `seed-review-${r.userId}-${r.relationId.slice(-8)}`,
      },
      update: {},
      create: {
        id:           `seed-review-${r.userId}-${r.relationId.slice(-8)}`,
        userId:       r.userId,
        userName:     r.userName,
        relationId:   r.relationId,
        relationType: r.relationType,
        rating:       r.rating,
        title:        r.title,
        comment:      r.comment,
        createdAt:    r.createdAt,
      },
    });
  }
  console.log(`  ✓ ${guideReviewsData.length} guide/plan reviews seeded`);

  console.log("Seeded 2 guide profiles + 3 guide plans");

  // ── Phase 27A — Local Agent seed ──────────────────────────────────────────

  // 1. Enable agent commission on 3 Djerba activities
  await prisma.activity.updateMany({
    where: { slug: { in: ["djerba-camel-ride-beach", "djerba-island-discovery-tour", "djerba-pirate-boat-trip"] } },
    data:  { agentCommissionEnabled: true, agentCommissionRate: 0.05 },
  });
  console.log("  ✓ Agent commission enabled on 3 Djerba activities (5%)");

  // 2. Seed demo agent user
  const AGENT_USER_ID = "seed-agent-fares";
  await prisma.user.upsert({
    where:  { id: AGENT_USER_ID },
    update: {},
    create: {
      id:            AGENT_USER_ID,
      name:          "Fares Benhassine",
      email:         "fares.agent@guidni.demo",
      emailVerified: true,
      role:          "AGENT",
      createdAt:     new Date(),
      updatedAt:     new Date(),
    },
  });

  // 3. Seed AgentProfile
  await prisma.agentProfile.upsert({
    where:  { slug: "fares-benhassine" },
    update: {},
    create: {
      id:          "seed-agent-profile-fares",
      slug:        "fares-benhassine",
      displayName: "Fares Benhassine",
      pseudonym:   "local_fares",
      phone:       "+216 98 765 432",
      country:     "Tunisia",
      city:        "Djerba",
      bio:         "Beach club host and local Djerba expert. I help tourists discover the best of the island every day.\n\n[How I meet tourists]: I work at a beach club in Djerba and interact with 20–30 tourists daily.",
      tier:        "STARTER",
      points:      45,
      totalEarned: 37.50,
      isVerified:  true,
      isActive:    true,
      verifiedAt:  new Date(),
      userId:      AGENT_USER_ID,
      destinationId: djerbaDest?.id ?? undefined,
    },
  });
  console.log("  ✓ Agent profile seeded: local_fares (Djerba, Starter, verified)");

  // 4. Seed 2 demo invitations (BOOKED — to show populated dashboard in dev)
  const camelRideForSeed = await prisma.activity.findUnique({
    where:  { slug: "djerba-camel-ride-beach" },
    select: { id: true },
  });
  const islandTourForSeed = await prisma.activity.findUnique({
    where:  { slug: "djerba-island-discovery-tour" },
    select: { id: true },
  });

  if (camelRideForSeed) {
    await prisma.agentInvitation.upsert({
      where:  { token: "seed-invite-token-camel-001" },
      update: {},
      create: {
        token:        "seed-invite-token-camel-001",
        agentId:      "seed-agent-profile-fares",
        listingType:  "ACTIVITY",
        listingId:    camelRideForSeed.id,
        touristEmail: "sarah@guidni.demo",
        adults:       2,
        children:     1,
        date:         "2026-04-15",
        timeSlot:     "09:00",
        status:       "BOOKED",
        expiresAt:    new Date("2026-04-20"),
        bookedAt:     new Date("2026-04-05"),
      },
    });
  }

  if (islandTourForSeed) {
    await prisma.agentInvitation.upsert({
      where:  { token: "seed-invite-token-tour-001" },
      update: {},
      create: {
        token:        "seed-invite-token-tour-001",
        agentId:      "seed-agent-profile-fares",
        listingType:  "ACTIVITY",
        listingId:    islandTourForSeed.id,
        touristPhone: "+33 6 12 34 56 78",
        adults:       3,
        children:     0,
        date:         "2026-04-18",
        timeSlot:     "10:00",
        status:       "PENDING",
        expiresAt:    new Date("2026-04-25"),
      },
    });
  }

  // 5. Seed 1 AgentEarning (for the booked invitation)
  if (camelRideForSeed) {
    await prisma.agentEarning.upsert({
      where:  { id: "seed-earning-fares-001" },
      update: {},
      create: {
        id:               "seed-earning-fares-001",
        agentId:          "seed-agent-profile-fares",
        bookingRef:       "GDN-SEED-001",
        listingType:      "ACTIVITY",
        listingId:        camelRideForSeed.id,
        commissionRate:   0.05,
        bookingAmount:    150,
        commissionAmount: 7.50,
        status:           "CONFIRMED",
        confirmedAt:      new Date(),
      },
    });
  }
  console.log("  ✓ 2 demo invitations + 1 earning seeded for local_fares");

  // ─────────────────────────────────────────────────────────────────────────
  // Local Guides — seed data (Phase 26A)
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\nSeeding guide profiles & plans...");

  // Guide user accounts
  const GUIDE_DJERBA_USER_ID = "seed-guide-user-amira";
  const GUIDE_DUBAI_USER_ID  = "seed-guide-user-khalid";

  await prisma.user.upsert({
    where:  { email: "amira.guide@guidni.demo" },
    update: {},
    create: {
      id:            GUIDE_DJERBA_USER_ID,
      name:          "Amira Chaari",
      email:         "amira.guide@guidni.demo",
      emailVerified: true,
      role:          "PARTNER",
      createdAt:     new Date(),
      updatedAt:     new Date(),
    },
  });

  await prisma.user.upsert({
    where:  { email: "khalid.guide@guidni.demo" },
    update: {},
    create: {
      id:            GUIDE_DUBAI_USER_ID,
      name:          "Khalid Al Mansoori",
      email:         "khalid.guide@guidni.demo",
      emailVerified: true,
      role:          "PARTNER",
      createdAt:     new Date(),
      updatedAt:     new Date(),
    },
  });

  // Destinations
  const djerbaForGuide = await prisma.destination.findUnique({ where: { slug: "djerba" } });
  const dubaiForGuide  = await prisma.destination.findUnique({ where: { slug: "dubai"  } });

  // ── Amira Chaari — Djerba guide ───────────────────────────────────────────
  const guideAmira = await prisma.guideProfile.upsert({
    where:  { slug: "amira-chaari-djerba" },
    update: {
      planCount:   3,
      nbReviews:   14,
      note:        "4.9",
      isFeatured:  true,
      isVerified:  true,
    },
    create: {
      slug:            "amira-chaari-djerba",
      displayName:     "Amira Chaari",
      tagline:         "Your insider guide to Djerba's hidden soul",
      bio:             "Born and raised in Houmt Souk, I've spent 12 years guiding travellers through Djerba's layered history — Phoenician ruins, Jewish heritage, Berber traditions, and the island's incredible food scene. My plans are designed to go beyond the postcard and show you the real island, from secret beaches to family-run pottery workshops that no tour bus will take you to.",
      arabicBio:       "وُلدت ونشأت في حومة السوق، وقضيت 12 عاماً في إرشاد المسافرين عبر تاريخ جربة المتعدد الطبقات — الآثار الفينيقية والتراث اليهودي والتقاليد البربرية والمشهد الغذائي الرائع للجزيرة. مخططاتي مصممة لتتجاوز ما هو مألوف وتريك الجزيرة الحقيقية.",
      avatarUrl:       "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
      coverUrl:        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200",
      specializations: ["culture", "food", "beaches", "history"],
      languages:       ["English", "French", "Arabic"],
      experienceYears: 12,
      country:         "Tunisia",
      destinationId:   djerbaForGuide?.id,
      userId:          GUIDE_DJERBA_USER_ID,
      note:            "4.9",
      nbReviews:       14,
      planCount:       3,
      isVerified:      true,
      isFeatured:      true,
      instagram:       "amira.djerba",
      website:         "https://amira-djerba.guidni.demo",
    },
  });

  // ── Khalid Al Mansoori — Dubai guide ─────────────────────────────────────
  const guideKhalid = await prisma.guideProfile.upsert({
    where:  { slug: "khalid-al-mansoori-dubai" },
    update: {
      planCount:   3,
      nbReviews:   22,
      note:        "4.8",
      isFeatured:  true,
      isVerified:  true,
    },
    create: {
      slug:            "khalid-al-mansoori-dubai",
      displayName:     "Khalid Al Mansoori",
      tagline:         "Dubai's urban explorer — luxury to local",
      bio:             "Dubai native, third-generation Emirati, and passionate advocate for authentic local experiences in a city often seen only through the lens of luxury hotels and malls. I've built itineraries that combine the best of modern Dubai with Old Town heritage, authentic Emirati cuisine, and desert culture that most visitors never find. Whether you're coming for 3 days or 2 weeks, I know exactly how to make every hour count.",
      arabicBio:       "مواطن دبيّ من الجيل الثالث الإماراتي ومدافع شغوف عن التجارب المحلية الأصيلة في مدينة كثيراً ما يُنظر إليها من خلال عدسة فنادق الفخامة والمجمعات التجارية. لقد بنيت مسارات تجمع بين أفضل ما في دبي الحديثة وتراث المدينة القديمة.",
      avatarUrl:       "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
      coverUrl:        "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200",
      specializations: ["adventure", "culture", "food", "luxury"],
      languages:       ["English", "Arabic"],
      experienceYears: 8,
      country:         "UAE",
      destinationId:   dubaiForGuide?.id,
      userId:          GUIDE_DUBAI_USER_ID,
      note:            "4.8",
      nbReviews:       22,
      planCount:       3,
      isVerified:      true,
      isFeatured:      true,
      instagram:       "khalid.dubai.guide",
      tiktok:          "khalid.dubai",
    },
  });

  // ── Djerba Plan 1 — 3-Day Cultural Immersion (FREE) ──────────────────────
  const djerbaItinerary1 = [
    {
      dayNumber: 1,
      theme: "Houmt Souk & Ancient Heritage",
      notes: "Start in the heart of the island — the medina and its surrounding souks tell 3,000 years of layered history.",
      blocks: [
        {
          id: "gp-d1-s1", slotType: "morning",
          item: { id: "gp-attr-ghriba", type: "ATTRACTION", slug: "el-ghriba-synagogue", name: "El Ghriba Synagogue", imageUrl: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800", location: "Erriadh, Djerba", price: 3, priceLabel: "entry fee", durationMinutes: 75, intensity: "low", tags: ["history", "heritage", "culture"], idealTime: "morning", familyFriendly: true, bookingUrl: "/destinations/el-ghriba-synagogue" },
          guideNote: "Arrive before 10am to avoid tour groups. The mosaic floor is best seen in the morning light. Don't miss the silver votive plaques on the east wall."
        },
        {
          id: "gp-d1-s2", slotType: "lunch",
          item: { id: "gp-rest-barbecue", type: "RESTAURANT", slug: "la-table-djerbi", name: "La Table Djerbi", imageUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800", location: "Houmt Souk", price: 0, priceLabel: "estimated per person", durationMinutes: 75, intensity: "low", tags: ["tunisian", "seafood", "local"], idealTime: "any", familyFriendly: true, bookingUrl: "/restaurants/la-table-djerbi" },
          guideNote: "Ask for the off-menu 'mechouia grillée' — the owner makes it fresh when the peppers are right. Pair with local palm wine if you're adventurous."
        },
        {
          id: "gp-d1-s3", slotType: "afternoon",
          item: { id: "gp-attr-medina", type: "ATTRACTION", slug: "houmt-souk-medina", name: "Houmt Souk Medina", imageUrl: "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=800", location: "Houmt Souk", price: 0, priceLabel: "free", durationMinutes: 120, intensity: "low", tags: ["shopping", "culture", "crafts"], idealTime: "morning", familyFriendly: true, bookingUrl: "/destinations/houmt-souk-medina" },
          guideNote: "Skip Rue de la République (tourist prices). Turn left at the blue door on Rue Taieb Mehiri and you'll find three family-run pottery stalls with genuine pieces at honest prices."
        },
        {
          id: "gp-d1-s4", slotType: "evening",
          item: { id: "gp-attr-port", type: "ATTRACTION", slug: "houmt-souk-medina", name: "Houmt Souk Harbour", imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800", location: "Houmt Souk Port", price: 0, priceLabel: "free", durationMinutes: 60, intensity: "low", tags: ["sunset", "local"], idealTime: "evening", familyFriendly: true, bookingUrl: "/destinations/houmt-souk-medina" },
          guideNote: "The old harbour is where local fishermen return around 6pm. Grab a mint tea at the café on the quay and watch — it's the best free show in Djerba."
        },
      ],
    },
    {
      dayNumber: 2,
      theme: "Beach Day & Artisan Villages",
      notes: "Djerba's interior villages hold the island's craft secrets. Pair with the finest beach on the island.",
      blocks: [
        {
          id: "gp-d2-s1", slotType: "morning",
          item: { id: "gp-attr-beach", type: "ATTRACTION", slug: "beach-sidi-mahrez", name: "Sidi Mahrez Beach", imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800", location: "Sidi Mahrez, Djerba", price: 0, priceLabel: "free", durationMinutes: 150, intensity: "low", tags: ["beach", "swimming", "relaxation"], idealTime: "morning", familyFriendly: true, bookingUrl: "/destinations/beach-sidi-mahrez" },
          guideNote: "Take the unmarked track 400m east of the main parking — it leads to a quieter cove that stays empty until noon. Bring shade; there are no umbrellas here."
        },
        {
          id: "gp-d2-s2", slotType: "lunch",
          item: { id: "gp-rest-guellala", type: "RESTAURANT", slug: "chez-slima-guellala", name: "Chez Slima", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800", location: "Guellala", price: 0, priceLabel: "estimated per person", durationMinutes: 60, intensity: "low", tags: ["tunisian", "homestyle", "local"], idealTime: "any", familyFriendly: true, bookingUrl: "/restaurants/chez-slima-guellala" },
          guideNote: "A home kitchen that seats 12. No menu — you eat whatever Slima cooked that morning. Call ahead: +216 75 xxx xxx. Best couscous on the island, full stop."
        },
        {
          id: "gp-d2-s3", slotType: "afternoon",
          item: { id: "gp-attr-guellala", type: "ATTRACTION", slug: "guellala-museum", name: "Guellala Pottery Village", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800", location: "Guellala", price: 2, priceLabel: "entry fee", durationMinutes: 90, intensity: "low", tags: ["crafts", "culture", "pottery"], idealTime: "morning", familyFriendly: true, bookingUrl: "/destinations/guellala-museum" },
          guideNote: "Visit the working workshop behind the museum — they let you try the wheel for free on Tuesday and Thursday afternoons. Ask for Tarek."
        },
        {
          id: "gp-d2-s4", slotType: "evening",
          item: { id: "gp-act-sunset", type: "ACTIVITY", slug: "djerba-quad-beach", name: "Sunset Quad on the Dunes", imageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800", location: "Aghir, Djerba", price: 45, priceLabel: "per person", durationMinutes: 90, intensity: "high", tags: ["adventure", "sunset", "outdoor"], idealTime: "evening", familyFriendly: false, bookingUrl: "/activities/djerba-quad-beach" },
          guideNote: "Book the 5:30pm slot — the dune lighting at that hour is spectacular. The operators give you 15 extra minutes if the group is small."
        },
      ],
    },
    {
      dayNumber: 3,
      theme: "South Island: Flamingos, Salt Lakes & Berber Culture",
      notes: "The south of the island is barely touched by tourism — and it's the most beautiful part.",
      blocks: [
        {
          id: "gp-d3-s1", slotType: "morning",
          item: { id: "gp-attr-flamingo", type: "ATTRACTION", slug: "flamingo-lake", name: "Flamingo Lagoon", imageUrl: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800", location: "Southern Djerba", price: 0, priceLabel: "free", durationMinutes: 90, intensity: "low", tags: ["nature", "wildlife", "photography"], idealTime: "morning", familyFriendly: true, bookingUrl: "/destinations/flamingo-lake" },
          guideNote: "The flamingos feed near the salt flat edge between 7am and 9:30am. Wear muted colours and approach from the east with the sun behind you — you'll get within 30 metres."
        },
        {
          id: "gp-d3-s2", slotType: "lunch",
          item: { id: "gp-rest-ajim", type: "RESTAURANT", slug: "port-dajim-grillades", name: "Ajim Ferry Port Grillades", imageUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800", location: "Ajim", price: 0, priceLabel: "estimated per person", durationMinutes: 60, intensity: "low", tags: ["seafood", "local", "grilled"], idealTime: "any", familyFriendly: true, bookingUrl: "/restaurants/port-dajim-grillades" },
          guideNote: "The three grill stalls by the ferry dock look rough but serve the freshest fish on the island — caught that morning by the ferry operators' families. Order by weight."
        },
        {
          id: "gp-d3-s3", slotType: "afternoon",
          item: { id: "gp-attr-heritage", type: "ATTRACTION", slug: "djerba-heritage-village", name: "Berber Heritage Village", imageUrl: "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=800", location: "Midoun Area", price: 0, priceLabel: "free", durationMinutes: 120, intensity: "low", tags: ["culture", "berber", "history"], idealTime: "afternoon", familyFriendly: true, bookingUrl: "/destinations/djerba-heritage-village" },
          guideNote: "The weaving demonstration happens in the building with the green door, not the tourist-signposted one. Genuinely free, genuinely authentic."
        },
        {
          id: "gp-d3-s4", slotType: "evening",
          item: { id: "gp-act-camelride", type: "ACTIVITY", slug: "djerba-camel-ride", name: "Sunset Camel Ride", imageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800", location: "Aghir Beach", price: 35, priceLabel: "per person", durationMinutes: 60, intensity: "low", tags: ["sunset", "outdoor", "family"], idealTime: "evening", familyFriendly: true, bookingUrl: "/activities/djerba-camel-ride" },
          guideNote: "End your Djerba trip on this beach — it's the best sunset view on the island. I always recommend this as the final memory to take home."
        },
      ],
    },
  ];

  const djerba3DayFree = await prisma.plan.upsert({
    where:  { id: "seed-guide-plan-djerba-3day-free" },
    update: {
      itinerary:   { days: djerbaItinerary1, stays: [], rentals: [] },
      isPublic:    true,
      planType:    "GUIDE_FREE",
      viewCount:   87,
    },
    create: {
      id:           "seed-guide-plan-djerba-3day-free",
      title:        "3 Days in Djerba: Culture, Craft & Hidden Beaches",
      duration:     3,
      planType:     "GUIDE_FREE",
      isPublic:     true,
      generatedBy:  "guide",
      summary:      "A carefully curated 3-day itinerary that takes you beyond the tourist trail — Djerba's ancient synagogue, artisan pottery villages, flamingo lagoons, and the freshest seafood you'll ever eat. No hotel lobbies, no postcard stops.",
      tags:         ["culture", "beaches", "food", "local", "heritage"],
      difficulty:   "easy",
      suitableFor:  ["solo", "couple", "friends"],
      season: ["year-round"],
      viewCount:    87,
      preferences:  { destination: "djerba", duration: 3, travelStyle: "balanced", groupType: "couple", budget: 2, interests: ["culture", "food", "beaches"] },
      itinerary:    { days: djerbaItinerary1, stays: [], rentals: [] },
      guideId:      guideAmira.id,
      userId:       GUIDE_DJERBA_USER_ID,
      destinationId: djerbaForGuide?.id,
    },
  });

  // ── Djerba Plan 2 — 5-Day Full Island (FREE) ─────────────────────────────
  const djerba5DayFree = await prisma.plan.upsert({
    where:  { id: "seed-guide-plan-djerba-5day-free" },
    update: { isPublic: true, viewCount: 54 },
    create: {
      id:           "seed-guide-plan-djerba-5day-free",
      title:        "5 Days on Djerba Island: The Complete Experience",
      duration:     5,
      planType:     "GUIDE_FREE",
      isPublic:     true,
      generatedBy:  "guide",
      summary:      "Five days to truly decompress and immerse in Djerba — from the medina's labyrinthine alleys to remote salt flats, Berber weaving villages, island seafood feasts, and the most relaxed pace the Mediterranean can offer.",
      tags:         ["culture", "beaches", "food", "relaxation", "nature"],
      difficulty:   "easy",
      suitableFor:  ["solo", "couple", "family"],
      season: ["april-october"],
      viewCount:    54,
      preferences:  { destination: "djerba", duration: 5, travelStyle: "relaxed", groupType: "couple", budget: 2, interests: ["culture", "food", "beaches", "wellness"] },
      itinerary:    { days: djerbaItinerary1.slice(0, 3).map((d, i) => ({ ...d, dayNumber: i + 1 })), stays: [], rentals: [] },
      guideId:      guideAmira.id,
      userId:       GUIDE_DJERBA_USER_ID,
      destinationId: djerbaForGuide?.id,
    },
  });

  // ── Djerba Plan 3 — Private Island Week (PAID) ───────────────────────────
  const djerba7DayPaid = await prisma.plan.upsert({
    where:  { id: "seed-guide-plan-djerba-7day-paid" },
    update: { isPublic: true, viewCount: 31, purchaseCount: 4 },
    create: {
      id:           "seed-guide-plan-djerba-7day-paid",
      title:        "7-Day Private Djerba: Exclusive Access & Hidden Gems",
      duration:     7,
      planType:     "GUIDE_PAID",
      isPaidPlan:   true,
      price:        2900,
      previewDays:  2,
      isPublic:     true,
      generatedBy:  "guide",
      summary:      "My premium 7-day plan unlocks private family homes for dinner, a dawn fishing trip with local fishermen, exclusive pottery workshop sessions, private flamingo-watching with a naturalist, and the island's best hidden hammam. Everything that can't be Googled.",
      tags:         ["exclusive", "private", "culture", "food", "nature", "luxury"],
      difficulty:   "easy",
      suitableFor:  ["couple", "solo"],
      season: ["march-november"],
      viewCount:    31,
      purchaseCount: 4,
      preferences:  { destination: "djerba", duration: 7, travelStyle: "relaxed", groupType: "couple", budget: 3, interests: ["culture", "food", "beaches", "wellness"] },
      itinerary:    { days: djerbaItinerary1, stays: [], rentals: [] },
      guideId:      guideAmira.id,
      userId:       GUIDE_DJERBA_USER_ID,
      destinationId: djerbaForGuide?.id,
    },
  });

  // ── Dubai Plan 1 — 4-Day First-Timer (FREE) ──────────────────────────────
  const dubaiItinerary1 = [
    {
      dayNumber: 1,
      theme: "Old Dubai & Emirati Heritage",
      notes: "Most visitors skip Old Dubai entirely. That's their loss — it's the most fascinating part of the city.",
      blocks: [
        {
          id: "gp-db-d1-s1", slotType: "morning",
          item: { id: "gp-db-attr-creek", type: "ATTRACTION", slug: "dubai-creek-old-town", name: "Dubai Creek & Al Fahidi", imageUrl: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800", location: "Al Fahidi, Dubai", price: 0, priceLabel: "free", durationMinutes: 120, intensity: "low", tags: ["history", "heritage", "culture"], idealTime: "morning", familyFriendly: true, bookingUrl: "/destinations/dubai-creek" },
          guideNote: "Start at the Heritage House on Al Fahidi Street — it's free and gives you the context for everything else you'll see. Then cross the creek on an abra (1 AED) for the best skyline shot in Dubai."
        },
        {
          id: "gp-db-d1-s2", slotType: "lunch",
          item: { id: "gp-db-rest-arabian", type: "RESTAURANT", slug: "logma-dubai", name: "Logma Emirati Kitchen", imageUrl: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800", location: "Boxpark, Dubai", price: 0, priceLabel: "estimated per person", durationMinutes: 75, intensity: "low", tags: ["emirati", "local", "authentic"], idealTime: "any", familyFriendly: true, bookingUrl: "/restaurants/logma-dubai" },
          guideNote: "Order the lgaimat (honey dumplings) and chebab (Emirati pancakes) — you won't find these at hotel brunches. Arrive by 12:30 to beat the queue."
        },
        {
          id: "gp-db-d1-s3", slotType: "afternoon",
          item: { id: "gp-db-attr-spice", type: "ATTRACTION", slug: "deira-gold-spice-souk", name: "Deira Gold & Spice Souks", imageUrl: "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=800", location: "Deira, Dubai", price: 0, priceLabel: "free", durationMinutes: 90, intensity: "low", tags: ["shopping", "culture", "spices"], idealTime: "afternoon", familyFriendly: true, bookingUrl: "/destinations/deira-souks" },
          guideNote: "In the spice souk, buy from the stalls at the back — they have the genuine saffron and dried limes. The ones near the entrance are tourist-grade. Bargain on everything except saffron."
        },
        {
          id: "gp-db-d1-s4", slotType: "evening",
          item: { id: "gp-db-act-dhow", type: "ACTIVITY", slug: "dubai-dhow-cruise", name: "Dubai Creek Dhow Cruise", imageUrl: "https://images.unsplash.com/photo-1582266255765-fa5cf1a1d501?w=800", location: "Old Dubai Creek", price: 75, priceLabel: "per person", durationMinutes: 120, intensity: "low", tags: ["cruise", "dinner", "sunset"], idealTime: "evening", familyFriendly: true, bookingUrl: "/activities/dubai-dhow-cruise" },
          guideNote: "Book the Creek cruise, not the Marina cruise — the Creek lights are more authentic and the crowd is more local. Sit on the upper deck; the buffet below is forgettable."
        },
      ],
    },
    {
      dayNumber: 2,
      theme: "Modern Dubai & The Skyline",
      notes: "Today you tackle the icons — but on local terms, not tourist ones.",
      blocks: [
        {
          id: "gp-db-d2-s1", slotType: "morning",
          item: { id: "gp-db-act-burj", type: "ACTIVITY", slug: "burj-khalifa-at-the-top", name: "Burj Khalifa At The Top", imageUrl: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800", location: "Downtown Dubai", price: 149, priceLabel: "per person", durationMinutes: 90, intensity: "low", tags: ["landmark", "views", "photography"], idealTime: "morning", familyFriendly: true, bookingUrl: "/activities/burj-khalifa-at-the-top" },
          guideNote: "Book the 8:30am slot — you'll have the observation deck almost entirely to yourself and the morning haze gives the city a dreamlike quality. The 9:30am slot is already crowded."
        },
        {
          id: "gp-db-d2-s2", slotType: "lunch",
          item: { id: "gp-db-rest-downtown", type: "RESTAURANT", slug: "graze-burj-khalifa", name: "Graze by Gordon Ramsay", imageUrl: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800", location: "Downtown Dubai", price: 0, priceLabel: "estimated per person", durationMinutes: 90, intensity: "low", tags: ["international", "fine-dining", "views"], idealTime: "any", familyFriendly: false, bookingUrl: "/restaurants/graze-dubai" },
          guideNote: "If budget allows, the window table at level 3 looks straight up the Burj. Reserve 3 days ahead. Otherwise, the food court in Dubai Mall is genuinely excellent — try Eataly."
        },
        {
          id: "gp-db-d2-s3", slotType: "afternoon",
          item: { id: "gp-db-attr-mall", type: "ATTRACTION", slug: "dubai-mall-aquarium", name: "Dubai Mall & Aquarium", imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800", location: "Downtown Dubai", price: 0, priceLabel: "free", durationMinutes: 120, intensity: "low", tags: ["shopping", "family", "aquarium"], idealTime: "afternoon", familyFriendly: true, bookingUrl: "/destinations/dubai-mall" },
          guideNote: "The aquarium viewing panel is free from the mall side — you don't need to pay for the tunnel unless you have young children. Skip the ice rink queue; the skating here is not better than anywhere else."
        },
        {
          id: "gp-db-d2-s4", slotType: "evening",
          item: { id: "gp-db-attr-fountain", type: "ATTRACTION", slug: "dubai-fountain", name: "Dubai Fountain Show", imageUrl: "https://images.unsplash.com/photo-1582266255765-fa5cf1a1d501?w=800", location: "Downtown Dubai", price: 0, priceLabel: "free", durationMinutes: 30, intensity: "low", tags: ["entertainment", "landmark", "free"], idealTime: "evening", familyFriendly: true, bookingUrl: "/destinations/dubai-fountain" },
          guideNote: "The 9pm show is the best. Watch from the bridge, not the mall terrace — the angle is better and you can see the full arc. Arrive 20 minutes early for a front-row spot."
        },
      ],
    },
    {
      dayNumber: 3,
      theme: "Desert Safari & Bedouin Camp",
      notes: "The desert is Dubai's soul. Don't leave without experiencing it properly.",
      blocks: [
        {
          id: "gp-db-d3-s1", slotType: "morning",
          item: { id: "gp-db-act-safari", type: "ACTIVITY", slug: "dubai-desert-safari", name: "Desert Safari at Al Marmoom", imageUrl: "https://images.unsplash.com/photo-1548430769-9fb29a9e7f76?w=800", location: "Al Marmoom Desert", price: 180, priceLabel: "per person", durationMinutes: 480, intensity: "medium", tags: ["desert", "adventure", "culture", "bedouin"], idealTime: "afternoon", familyFriendly: true, bookingUrl: "/activities/dubai-desert-safari" },
          guideNote: "Specify Al Marmoom reserve (not the cheaper Lahbab road tour) — it's a protected conservation area and the dunes are significantly more dramatic. The operators who access it are listed. Book the evening departure at 3pm."
        },
        {
          id: "gp-db-d3-s2", slotType: "lunch",
          item: { id: "gp-db-rest-marina", type: "RESTAURANT", slug: "marina-market-dubai", name: "Dubai Marina Market", imageUrl: "https://images.unsplash.com/photo-1582266255765-fa5cf1a1d501?w=800", location: "Dubai Marina", price: 0, priceLabel: "estimated per person", durationMinutes: 60, intensity: "low", tags: ["casual", "outdoor", "market"], idealTime: "any", familyFriendly: true, bookingUrl: "/restaurants/marina-market" },
          guideNote: "Have a light lunch here before the afternoon desert trip. The shakshuka at the Lebanese corner stall is the best pre-safari meal — filling but not heavy."
        },
        {
          id: "gp-db-d3-s3", slotType: "afternoon",
          item: { id: "gp-db-act-camp", type: "ACTIVITY", slug: "bedouin-camp-dinner", name: "Bedouin Camp & BBQ Dinner", imageUrl: "https://images.unsplash.com/photo-1548430769-9fb29a9e7f76?w=800", location: "Al Marmoom Desert", price: 0, priceLabel: "included", durationMinutes: 180, intensity: "low", tags: ["culture", "dinner", "bedouin", "stargazing"], idealTime: "evening", familyFriendly: true, bookingUrl: "/activities/dubai-desert-safari" },
          guideNote: "After the dune bashing, ask your guide to take you 500m north of the main camp to the quieter fire pit — less crowded and better stargazing. The camel milk is the real deal; try it."
        },
      ],
    },
    {
      dayNumber: 4,
      theme: "Dubai Marina & JBR Beach",
      notes: "End on a relaxed note — Dubai's best beach neighbourhood.",
      blocks: [
        {
          id: "gp-db-d4-s1", slotType: "morning",
          item: { id: "gp-db-attr-jbr", type: "ATTRACTION", slug: "jbr-beach-dubai", name: "JBR The Walk & Beach", imageUrl: "https://images.unsplash.com/photo-1582266255765-fa5cf1a1d501?w=800", location: "Jumeirah Beach Residences", price: 0, priceLabel: "free", durationMinutes: 120, intensity: "low", tags: ["beach", "relaxation", "walking"], idealTime: "morning", familyFriendly: true, bookingUrl: "/destinations/jbr-beach" },
          guideNote: "JBR is actually the best free beach in Dubai — better sand than any hotel beach and no day-pass fee. Arrive by 9am before the sun gets intense. The lifeguards here are attentive."
        },
        {
          id: "gp-db-d4-s2", slotType: "lunch",
          item: { id: "gp-db-rest-seafood", type: "RESTAURANT", slug: "sea-fu-dubai", name: "Sea Fu at Westin", imageUrl: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800", location: "JBR, Dubai", price: 0, priceLabel: "estimated per person", durationMinutes: 90, intensity: "low", tags: ["seafood", "modern", "views"], idealTime: "any", familyFriendly: false, bookingUrl: "/restaurants/sea-fu-dubai" },
          guideNote: "The best farewell lunch in Dubai — sea views, excellent hammour (local fish), and a dessert list that takes 10 minutes to read. Worth every dirham."
        },
        {
          id: "gp-db-d4-s3", slotType: "afternoon",
          item: { id: "gp-db-act-cruise", type: "ACTIVITY", slug: "dubai-yacht-cruise", name: "Marina Yacht Cruise", imageUrl: "https://images.unsplash.com/photo-1582266255765-fa5cf1a1d501?w=800", location: "Dubai Marina", price: 120, priceLabel: "per person", durationMinutes: 90, intensity: "low", tags: ["cruise", "marina", "luxury"], idealTime: "afternoon", familyFriendly: true, bookingUrl: "/activities/dubai-yacht-cruise" },
          guideNote: "Book the 2-hour afternoon slot — the afternoon light on the Marina towers is extraordinary for photography. Evening sunset cruises are romantic but more expensive; afternoon gives better value."
        },
      ],
    },
  ];

  const dubai4DayFree = await prisma.plan.upsert({
    where:  { id: "seed-guide-plan-dubai-4day-free" },
    update: { isPublic: true, viewCount: 143 },
    create: {
      id:           "seed-guide-plan-dubai-4day-free",
      title:        "4 Days in Dubai: First-Timer's Real Guide",
      duration:     4,
      planType:     "GUIDE_FREE",
      isPublic:     true,
      generatedBy:  "guide",
      summary:      "The tourist guide gets you the Burj Khalifa photo. My guide gets you the dhow captain who has crossed the Creek every day for 40 years. Four days that cover the icons — but always from a local angle, with insider tips at every stop.",
      tags:         ["city", "culture", "food", "desert", "first-timer"],
      difficulty:   "easy",
      suitableFor:  ["solo", "couple", "friends"],
      season: ["october-april"],
      viewCount:    143,
      preferences:  { destination: "dubai", duration: 4, travelStyle: "balanced", groupType: "couple", budget: 2, interests: ["culture", "food", "adventure"] },
      itinerary:    { days: dubaiItinerary1, stays: [], rentals: [] },
      guideId:      guideKhalid.id,
      userId:       GUIDE_DUBAI_USER_ID,
      destinationId: dubaiForGuide?.id,
    },
  });

  // ── Dubai Plan 2 — 2-Day Weekend Flash (FREE) ─────────────────────────────
  const dubai2DayFree = await prisma.plan.upsert({
    where:  { id: "seed-guide-plan-dubai-2day-free" },
    update: { isPublic: true, viewCount: 209 },
    create: {
      id:           "seed-guide-plan-dubai-2day-free",
      title:        "Dubai in 48 Hours: The Essential Weekend Plan",
      duration:     2,
      planType:     "GUIDE_FREE",
      isPublic:     true,
      generatedBy:  "guide",
      summary:      "48 hours to see the best of Dubai without the fuss. Old Town in the morning, Burj Khalifa at golden hour, desert dinner under the stars, and a proper Emirati breakfast before you fly. Tight, efficient, and memorable.",
      tags:         ["weekend", "fast", "city", "desert", "essentials"],
      difficulty:   "moderate",
      suitableFor:  ["solo", "couple", "friends"],
      season: ["october-april"],
      viewCount:    209,
      preferences:  { destination: "dubai", duration: 2, travelStyle: "active", groupType: "friends", budget: 2, interests: ["culture", "adventure"] },
      itinerary:    { days: dubaiItinerary1.slice(0, 2).map((d, i) => ({ ...d, dayNumber: i + 1 })), stays: [], rentals: [] },
      guideId:      guideKhalid.id,
      userId:       GUIDE_DUBAI_USER_ID,
      destinationId: dubaiForGuide?.id,
    },
  });

  // ── Dubai Plan 3 — 7-Day Luxury Insider (PAID) ────────────────────────────
  const dubai7DayPaid = await prisma.plan.upsert({
    where:  { id: "seed-guide-plan-dubai-7day-paid" },
    update: { isPublic: true, viewCount: 67, purchaseCount: 9 },
    create: {
      id:           "seed-guide-plan-dubai-7day-paid",
      title:        "7-Day Dubai Luxury Insider: Access Beyond the Guide Books",
      duration:     7,
      planType:     "GUIDE_PAID",
      isPaidPlan:   true,
      price:        4900,
      previewDays:  2,
      isPublic:     true,
      generatedBy:  "guide",
      summary:      "Seven days unlocking the Dubai that doesn't exist on TripAdvisor — a private falconry session with an Emirati family, sunrise camel trek through the Empty Quarter fringes, a private gallery dinner with an Emirati artist, helicopter sunrise over The Palm, a behind-the-scenes Burj Al Arab kitchen tour, and two private chef dinners in Emirati homes. This is Dubai as it lives, not as it's sold.",
      tags:         ["luxury", "exclusive", "private", "emirati", "culture"],
      difficulty:   "easy",
      suitableFor:  ["couple", "solo"],
      season: ["october-march"],
      viewCount:    67,
      purchaseCount: 9,
      preferences:  { destination: "dubai", duration: 7, travelStyle: "relaxed", groupType: "couple", budget: 3, interests: ["culture", "food", "adventure", "luxury"] },
      itinerary:    { days: dubaiItinerary1, stays: [], rentals: [] },
      guideId:      guideKhalid.id,
      userId:       GUIDE_DUBAI_USER_ID,
      destinationId: dubaiForGuide?.id,
    },
  });

  // ── Guide reviews ─────────────────────────────────────────────────────────
  const newGuideReviewsData = [
    // Amira reviews
    { userId: CUSTOMER_IDS.sarah,   userName: "Sarah Johnson",  relationType: "GUIDE" as const, relationId: guideAmira.id, rating: 5, title: "Best investment of our Djerba trip", comment: "Amira's plan saved us from spending 3 days at the resort pool. Every single recommendation was perfect — the flamingo lagoon at 7am with nobody else there was a moment I'll remember forever. The Chez Slima lunch felt like eating at a friend's home.", createdAt: d(8)  },
    { userId: CUSTOMER_IDS.marco,   userName: "Marco Rossi",    relationType: "GUIDE" as const, relationId: guideAmira.id, rating: 5, title: "Djerba through local eyes",            comment: "I've been to Tunisia three times and Amira's plan showed me things I had never found on my own. The pottery workshop behind the museum was extraordinary — 40 minutes of hands-on experience for free.", createdAt: d(22) },
    { userId: CUSTOMER_IDS.emma,    userName: "Emma Wilson",    relationType: "GUIDE" as const, relationId: guideAmira.id, rating: 5, title: "Worth every penny and then some",       comment: "The guide notes on every slot are gold. 'Turn left at the blue door' — that sentence saved us from 45 minutes of tourist shops and led us to one of the best craft purchases of our lives.", createdAt: d(34) },
    { userId: CUSTOMER_IDS.amir,    userName: "Amir Hassan",    relationType: "GUIDE" as const, relationId: guideAmira.id, rating: 5, title: "Amira knows her island",               comment: "As a Tunisian living abroad, I was sceptical that a guide plan could show me anything new. I was completely wrong. The south island day was a revelation — I had never seen the flamingos from that side.", createdAt: d(45) },
    { userId: CUSTOMER_IDS.youssef, userName: "Youssef Benali", relationType: "GUIDE" as const, relationId: guideAmira.id, rating: 4, title: "Excellent for culture lovers",          comment: "Four stars only because Day 2 felt slightly rushed on the pottery village visit. The rest was absolutely outstanding — the harbour evening was the highlight of our trip.", createdAt: d(12) },
    // Khalid reviews
    { userId: CUSTOMER_IDS.emma,    userName: "Emma Wilson",    relationType: "GUIDE" as const, relationId: guideKhalid.id, rating: 5, title: "The only Dubai guide you need",       comment: "Khalid's 4-day plan was the most efficient use of time in any city I've ever visited. Old Dubai in the morning followed by the evening dhow cruise is the perfect first day structure. The Burj Khalifa tip about the 8:30am slot is genuinely game-changing.", createdAt: d(5)  },
    { userId: CUSTOMER_IDS.sarah,   userName: "Sarah Johnson",  relationType: "GUIDE" as const, relationId: guideKhalid.id, rating: 5, title: "Finally! A non-mall Dubai itinerary", comment: "Every Dubai itinerary I had found online was basically 'go to the mall'. Khalid's plan puts the real city first. The abra ride across the Creek for 1 AED and the spice souk tips were exactly what I had been hoping to find.", createdAt: d(18) },
    { userId: CUSTOMER_IDS.marco,   userName: "Marco Rossi",    relationType: "GUIDE" as const, relationId: guideKhalid.id, rating: 5, title: "Exceptional local knowledge",         comment: "The insider notes at every stop are worth the price alone. 'Arrive by 9am', 'sit on the upper deck', 'buy from the stalls at the back' — three pieces of advice that transformed three different experiences.", createdAt: d(27) },
    { userId: CUSTOMER_IDS.amir,    userName: "Amir Hassan",    relationType: "GUIDE" as const, relationId: guideKhalid.id, rating: 5, title: "Perfect for first-timers",             comment: "Brought my wife to Dubai for the first time and Khalid's plan made us feel like regulars within 24 hours. The Logma restaurant for Emirati breakfast was an incredible discovery.", createdAt: d(38) },
    { userId: CUSTOMER_IDS.youssef, userName: "Youssef Benali", relationType: "GUIDE" as const, relationId: guideKhalid.id, rating: 4, title: "Great but Day 3 is very ambitious",    comment: "The desert day is genuinely outstanding but fitting the Marina lunch between the beach morning and the desert afternoon pickup was tight. Everything else is perfectly calibrated.", createdAt: d(14) },
  ];

  for (const rev of newGuideReviewsData) {
    await prisma.review.upsert({
      where:  { id: `seed-guide-review-${rev.userId.slice(-6)}-${rev.relationId.slice(-6)}` },
      update: {},
      create: {
        id:           `seed-guide-review-${rev.userId.slice(-6)}-${rev.relationId.slice(-6)}`,
        userId:       rev.userId,
        userName:     rev.userName,
        relationType: rev.relationType,
        relationId:   rev.relationId,
        rating:       rev.rating,
        title:        rev.title,
        comment:      rev.comment,
        createdAt:    rev.createdAt,
      },
    });
  }

  // Update planCount on guide profiles
  await prisma.guideProfile.update({ where: { id: guideAmira.id  }, data: { planCount: 3 } });
  await prisma.guideProfile.update({ where: { id: guideKhalid.id }, data: { planCount: 3 } });

  console.log(`  ✓ 2 guide profiles (Amira Djerba + Khalid Dubai)`);
  console.log(`  ✓ 6 guide plans (3 Djerba + 3 Dubai — 4 free, 2 paid)`);
  console.log(`  ✓ ${newGuideReviewsData.length} guide reviews`);

  // ─────────────────────────────────────────────────────────────────────────

  await seedExtendedData();
  await seedTripadvisorData();

  console.log(`
Done.
  ${destinations.length} destinations
  2 business profiles + 5 demo customers
  ${djerbaActivities.length} Djerba activities + ${extendedActivities.length} extended
  ${dubaiActivities.length} Dubai activities
  ${djerbaStays.length} Djerba stays + ${extendedStays.length} extended
  ${dubaiStays.length} Dubai stays
  6 restaurants (3 Djerba + 3 Dubai) + ${extendedRestaurants.length} extended
  3 passes (2 Djerba + 1 Dubai)
  6 rentals (3 Djerba + 3 Dubai)
  6 shops (3 Djerba + 3 Dubai)
  ${allProducts.length} products
  4 transfers (Djerba)
  6 attractions (Djerba) + ${extendedAttractions.length} extended
  ${reviewsData.length} reviews
  1 local agent (local_fares, Djerba)
  2 guide profiles + 6 guide plans + ${newGuideReviewsData.length} guide reviews
`);
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function seedTripadvisorData() {
  console.log("\nSeeding TripAdvisor data...");

  const djerbaDest = await prisma.destination.findUnique({ where: { slug: "djerba" } });
  if (!djerbaDest) {
    throw new Error("Djerba destination not found in DB! Please seed destinations first.");
  }

  // 1. Attractions -> Activity model
  console.log("  - Seeding TripAdvisor Attractions as Activities...");
  try {
    const filePath = path.join(process.cwd(), "prisma", "attraction_data .json");
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      console.log(`    Read ${data.length} attractions from ${filePath}`);
      for (const item of data) {
        if (!item.name) continue;
        const slug = `${slugify(item.name)}-${item.id}`;

        let price = 0;
        if (item.offerGroup?.lowestPrice) {
          const match = item.offerGroup.lowestPrice.replace(/[^0-9.]/g, "");
          if (match) price = Math.round(parseFloat(match));
        }
        if (price === 0) {
          price = Math.floor(Math.random() * (140 - 40 + 1)) + 40;
        }

        const rawImages = [item.image, ...(item.photos || [])];
        const uniqueImages = [...new Set(rawImages.filter(url => url && typeof url === "string" && url.trim().length > 0))];

        const created = await prisma.activity.upsert({
          where: { slug },
          update: {
            title: item.name,
            arabicTitle: item.localName || null,
            description: item.description || `Experience ${item.name} in Djerba.`,
            arabicDescription: item.localName ? `تجربة ${item.localName} في جربة.` : null,
            categories: item.subcategories || ["Attraction"],
            price,
            phone: item.phone || null,
            country: item.addressObj?.country || "Tunisia",
            region: item.addressObj?.state || "Medenine",
            city: item.addressObj?.city || "Djerba",
            address: item.address || null,
            location: item.locationString || null,
            note: item.rating ? String(item.rating) : "4.0",
            nbReviews: item.numberOfReviews || 0,
            duration: "2h",
            capacity: 50,
            availableTimes: "09:00,14:00",
            cancelation: item.booking ? true : false,
            paynow: item.booking ? true : false,
            guide: "en,fr,ar",
            latitude: item.latitude ? parseFloat(item.latitude) : null,
            longitude: item.longitude ? parseFloat(item.longitude) : null,
            status: "ACTIVE",
            profileId: DJERBA_PROFILE_ID,
            destinationId: djerbaDest.id,
          },
          create: {
            slug,
            title: item.name,
            arabicTitle: item.localName || null,
            description: item.description || `Experience ${item.name} in Djerba.`,
            arabicDescription: item.localName ? `تجربة ${item.localName} في جربة.` : null,
            categories: item.subcategories || ["Attraction"],
            price,
            phone: item.phone || null,
            country: item.addressObj?.country || "Tunisia",
            region: item.addressObj?.state || "Medenine",
            city: item.addressObj?.city || "Djerba",
            address: item.address || null,
            location: item.locationString || null,
            note: item.rating ? String(item.rating) : "4.0",
            nbReviews: item.numberOfReviews || 0,
            duration: "2h",
            capacity: 50,
            availableTimes: "09:00,14:00",
            cancelation: item.booking ? true : false,
            paynow: item.booking ? true : false,
            guide: "en,fr,ar",
            latitude: item.latitude ? parseFloat(item.latitude) : null,
            longitude: item.longitude ? parseFloat(item.longitude) : null,
            status: "ACTIVE",
            profileId: DJERBA_PROFILE_ID,
            destinationId: djerbaDest.id,
          },
        });

        if (uniqueImages.length > 0) {
          await prisma.images.deleteMany({ where: { activityId: created.id } });
          await prisma.images.createMany({
            data: uniqueImages.map((url, index) => ({
              url,
              activityId: created.id,
              order: index,
              alt: item.name,
            })),
          });
        }
      }
      console.log(`    ✓ Successfully seeded ${data.length} attractions as Activities.`);
    } else {
      console.warn(`    ⚠️ File not found: ${filePath}`);
    }
  } catch (err) {
    console.error("    ❌ Error seeding TripAdvisor Attractions:", err);
  }

  // 2. Hotels -> Stay model
  console.log("  - Seeding TripAdvisor Hotels as Stays...");
  try {
    const filePath = path.join(process.cwd(), "prisma", "hotel_data.json");
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      console.log(`    Read ${data.length} hotels from ${filePath}`);
      for (const item of data) {
        if (!item.name) continue;
        const slug = `${slugify(item.name)}-${item.id}`;

        let price = 0;
        if (item.priceRange) {
          const match = item.priceRange.replace(/[^0-9.-]/g, "").split("-")[0];
          if (match) price = Math.round(parseFloat(match));
        } else if (item.priceLevel) {
          price = item.priceLevel.length * 40;
        }
        if (price === 0) {
          price = Math.floor(Math.random() * (140 - 40 + 1)) + 40;
        }

        const amenitiesList = item.amenities || [];
        const hasWifi = amenitiesList.some((a: string) => /wifi|internet/i.test(a));
        const hasPool = amenitiesList.some((a: string) => /pool/i.test(a));
        const hasAirConditioning = amenitiesList.some((a: string) => /air conditioning/i.test(a));
        const hasParking = amenitiesList.some((a: string) => /parking/i.test(a));
        const hasGarden = amenitiesList.some((a: string) => /garden/i.test(a));
        const hasBalcony = amenitiesList.some((a: string) => /balcony/i.test(a));
        const hasKitchen = amenitiesList.some((a: string) => /kitchen/i.test(a));
        const elevatorAvailable = amenitiesList.some((a: string) => /elevator/i.test(a));
        const wheelchairAccessible = amenitiesList.some((a: string) => /wheelchair/i.test(a));

        const rawImages = [item.image, ...(item.photos || [])];
        const uniqueImages = [...new Set(rawImages.filter(url => url && typeof url === "string" && url.trim().length > 0))];

        const created = await prisma.stay.upsert({
          where: { slug },
          update: {
            title: item.name,
            arabicTitle: item.localName || null,
            description: item.description || `A comfortable stay at ${item.name} in Djerba.`,
            arabicDescription: item.localName ? `إقامة مريحة في ${item.localName} في جربة.` : null,
            propertyType: "HOTEL",
            category: "hotel",
            price,
            country: item.addressObj?.country || "Tunisia",
            region: item.addressObj?.state || "Medenine",
            city: item.addressObj?.city || "Djerba",
            address: item.address || null,
            latitude: item.latitude ? parseFloat(item.latitude) : null,
            longitude: item.longitude ? parseFloat(item.longitude) : null,
            phone: item.phone || null,
            averageRating: item.rating ? parseFloat(item.rating) : 4.0,
            nbReviews: item.numberOfReviews || 0,
            approvalStatus: "APPROVED",
            profileId: DJERBA_PROFILE_ID,
            destinationId: djerbaDest.id,
            hostName: "Djerba Villas",
            hostLanguages: "en,fr,ar",
            guestCount: 2,
            bedroomCount: 1,
            bedCount: 1,
            bathroomCount: 1,
            hasWifi,
            hasPool,
            hasAirConditioning,
            hasParking,
            hasGarden,
            hasBalcony,
            hasKitchen,
            elevatorAvailable,
            wheelchairAccessible,
          },
          create: {
            slug,
            title: item.name,
            arabicTitle: item.localName || null,
            description: item.description || `A comfortable stay at ${item.name} in Djerba.`,
            arabicDescription: item.localName ? `إقامة مريحة في ${item.localName} في جربة.` : null,
            propertyType: "HOTEL",
            category: "hotel",
            price,
            country: item.addressObj?.country || "Tunisia",
            region: item.addressObj?.state || "Medenine",
            city: item.addressObj?.city || "Djerba",
            address: item.address || null,
            latitude: item.latitude ? parseFloat(item.latitude) : null,
            longitude: item.longitude ? parseFloat(item.longitude) : null,
            phone: item.phone || null,
            averageRating: item.rating ? parseFloat(item.rating) : 4.0,
            nbReviews: item.numberOfReviews || 0,
            approvalStatus: "APPROVED",
            profileId: DJERBA_PROFILE_ID,
            destinationId: djerbaDest.id,
            hostName: "Djerba Villas",
            hostLanguages: "en,fr,ar",
            guestCount: 2,
            bedroomCount: 1,
            bedCount: 1,
            bathroomCount: 1,
            hasWifi,
            hasPool,
            hasAirConditioning,
            hasParking,
            hasGarden,
            hasBalcony,
            hasKitchen,
            elevatorAvailable,
            wheelchairAccessible,
          },
        });

        if (uniqueImages.length > 0) {
          await prisma.images.deleteMany({ where: { stayId: created.id } });
          await prisma.images.createMany({
            data: uniqueImages.map((url, index) => ({
              url,
              stayId: created.id,
              order: index,
              alt: item.name,
            })),
          });
        }
      }
      console.log(`    ✓ Successfully seeded ${data.length} hotels as Stays.`);
    } else {
      console.warn(`    ⚠️ File not found: ${filePath}`);
    }
  } catch (err) {
    console.error("    ❌ Error seeding TripAdvisor Stays:", err);
  }

  // 3. Restaurants -> Restaurant model
  console.log("  - Seeding TripAdvisor Restaurants...");
  try {
    const filePath = path.join(process.cwd(), "prisma", "restaurant_data.json");
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      console.log(`    Read ${data.length} restaurants from ${filePath}`);
      for (const item of data) {
        if (!item.name) continue;
        const slug = `${slugify(item.name)}-${item.id}`;

        const rawImages = [item.image, ...(item.photos || [])];
        const uniqueImages = [...new Set(rawImages.filter(url => url && typeof url === "string" && url.trim().length > 0))];

        const type = item.subcategories?.some((s: string) => /cafe|coffee/i.test(s)) ? "CAFEE_SHOP" : "RESTAURANT";
        const reservationsEnabled = item.features?.some((f: string) => /reservations/i.test(f)) || false;

        const created = await prisma.restaurant.upsert({
          where: { slug },
          update: {
            name: item.name,
            arabicName: item.localName || null,
            description: item.description || `Dine at ${item.name} in Djerba.`,
            arabicDescription: item.localName ? `تناول الطعام في ${item.localName} في جربة.` : null,
            phone: item.phone || null,
            type,
            category: item.category || "Restaurant",
            meals: item.meals?.join(", ") || "Lunch, Dinner",
            foodTypes: item.cuisines || [],
            dietTypes: item.dietaryRestrictions || [],
            attributes: item.features || [],
            country: item.addressObj?.country || "Tunisia",
            city: item.addressObj?.city || "Djerba",
            address: item.address || null,
            reservationsEnabled,
            approvalStatus: "APPROVED",
            profileId: DJERBA_PROFILE_ID,
            destinationId: djerbaDest.id,
            website: item.website || item.webUrl || null,
            note: item.rating ? String(item.rating) : "4.0",
            nbReviews: item.numberOfReviews || 0,
            maxGuests: 60,
            tables: 15,
          },
          create: {
            slug,
            name: item.name,
            arabicName: item.localName || null,
            description: item.description || `Dine at ${item.name} in Djerba.`,
            arabicDescription: item.localName ? `تناول الطعام في ${item.localName} في جربة.` : null,
            phone: item.phone || null,
            type,
            category: item.category || "Restaurant",
            meals: item.meals?.join(", ") || "Lunch, Dinner",
            foodTypes: item.cuisines || [],
            dietTypes: item.dietaryRestrictions || [],
            attributes: item.features || [],
            country: item.addressObj?.country || "Tunisia",
            city: item.addressObj?.city || "Djerba",
            address: item.address || null,
            reservationsEnabled,
            approvalStatus: "APPROVED",
            profileId: DJERBA_PROFILE_ID,
            destinationId: djerbaDest.id,
            website: item.website || item.webUrl || null,
            note: item.rating ? String(item.rating) : "4.0",
            nbReviews: item.numberOfReviews || 0,
            maxGuests: 60,
            tables: 15,
          },
        });

        if (uniqueImages.length > 0) {
          await prisma.images.deleteMany({ where: { restaurantId: created.id } });
          await prisma.images.createMany({
            data: uniqueImages.map((url, index) => ({
              url,
              restaurantId: created.id,
              order: index,
              alt: item.name,
            })),
          });
        }
      }
      console.log(`    ✓ Successfully seeded ${data.length} restaurants.`);
    } else {
      console.warn(`    ⚠️ File not found: ${filePath}`);
    }
  } catch (err) {
    console.error("    ❌ Error seeding TripAdvisor Restaurants:", err);
  }

  console.log("TripAdvisor Data Seeding Completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
