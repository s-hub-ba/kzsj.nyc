#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const keyFileName = process.env.FIREBASE_ADMIN_PRIVATE_KEY_PATH || ".firebase-key.json";
const keyPath = path.resolve(process.cwd(), keyFileName);

let serviceAccount: Record<string, unknown>;

try {
  if (!fs.existsSync(keyPath)) {
    console.error(`❌ Error: Firebase key file not found at ${keyPath}`);
    console.error(`\nPlease follow these steps:`);
    console.error(`1. Go to Firebase Console → kutak-za-srpski project`);
    console.error(`2. Click ⚙️ → Project Settings → Service Accounts tab`);
    console.error(`3. Click "Generate New Private Key"`);
    console.error(`4. Save the file as ".firebase-key.json" in the project root`);
    console.error(`\nCurrent working directory: ${process.cwd()}`);
    console.error(`Expected key file at: ${keyPath}`);
    process.exit(1);
  }

  const keyContent = fs.readFileSync(keyPath, "utf-8");
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  serviceAccount = JSON.parse(keyContent);
} catch (error) {
  console.error(`❌ Error reading Firebase key file:`, error);
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount as Parameters<typeof cert>[0]),
});

const db = getFirestore();

const sampleClasses = [
  {
    id: "class-1",
    title_sr: "Dajmo im reci",
    title_en: "Let's Give Them Words",
    description_sr:
      "Uzrast 1-3 godine. Neophodno je prisustvo jednog roditelja po detetu. Subotom 10:00-11:20, od 5. septembra do 19. decembra 2026. Ukupno 16 casova.",
    description_en:
      "Ages 1-3. One parent per child is required. Saturdays 10:00-11:20, from September 5 to December 19, 2026. Total of 16 classes.",
    ageGroup: "1-3",
    level: "Pocetni",
    price: 24000,
    type: "semester",
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "class-2",
    title_sr: "Pricajmo zajedno",
    title_en: "Let's Speak Together",
    description_sr:
      "Uzrast 3-5 godina. Prisustvo roditelja po dogovoru. Subotom 11:30-12:50, od 5. septembra do 19. decembra 2026. Ukupno 16 casova.",
    description_en:
      "Ages 3-5. Parent attendance is by agreement. Saturdays 11:30-12:50, from September 5 to December 19, 2026. Total of 16 classes.",
    ageGroup: "3-5",
    level: "Srednji",
    price: 24000,
    type: "semester",
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "class-3",
    title_sr: "Nasi skolarci",
    title_en: "Our Young Schoolers",
    description_sr:
      "Uzrast 5-7 godina. Dete pohadja cas samostalno. Subotom 13:00-14:20. Fokus je na govoru, pismenosti i samopouzdanju u jeziku.",
    description_en:
      "Ages 5-7. Children attend independently. Saturdays 13:00-14:20. Focus on speaking, literacy and confidence.",
    ageGroup: "5-7",
    level: "Pripremni",
    price: 24000,
    type: "semester",
    active: true,
    createdAt: new Date().toISOString(),
  },
];

const sampleTerms = [
  {
    id: "term-1",
    classId: "class-1",
    title_sr: "Jesen 2026 - grupa 10:00",
    title_en: "Autumn 2026 - 10:00 Group",
    date: "2026-09-05",
    startTime: "10:00",
    endTime: "11:20",
    capacity: 10,
    overbookLimit: 2,
    bookedCount: 0,
    location: "Ucionica Kutka",
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "term-2",
    classId: "class-2",
    title_sr: "Jesen 2026 - grupa 11:30",
    title_en: "Autumn 2026 - 11:30 Group",
    date: "2026-09-05",
    startTime: "11:30",
    endTime: "12:50",
    capacity: 10,
    overbookLimit: 2,
    bookedCount: 0,
    location: "Ucionica Kutka",
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "term-3",
    classId: "class-3",
    title_sr: "Jesen 2026 - grupa 13:00",
    title_en: "Autumn 2026 - 13:00 Group",
    date: "2026-09-05",
    startTime: "13:00",
    endTime: "14:20",
    capacity: 10,
    overbookLimit: 2,
    bookedCount: 0,
    location: "Ucionica Kutka",
    active: true,
    createdAt: new Date().toISOString(),
  },
];

const sampleBlogPosts = [
  {
    id: "post-1",
    slug: "uskoro-prvi-saveti-za-roditelje",
    title_sr: "Uskoro: prvi saveti za roditelje",
    title_en: "Coming soon: first parent guidance article",
    excerpt_sr:
      "Prvi edukativni tekstovi o razvoju govora i dvojezicnosti stizu sledece nedelje.",
    excerpt_en:
      "Our first educational pieces on speech development and bilingual growth are coming next week.",
    content_sr:
      "Pripremamo kratke, prakticne tekstove za roditelje o tome kako da kod kuce podrze razvoj srpskog jezika.",
    content_en:
      "We are preparing concise, practical articles for families on supporting Serbian language development at home.",
    published: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "post-2",
    slug: "prica-iz-kutka-aktivnosti-i-mali-uspeh",
    title_sr: "Prica iz Kutka: aktivnosti i mali uspeh",
    title_en: "A story from Kutak: activities and a small milestone",
    excerpt_sr:
      "Narativni blog postovi donose price iz svakodnevice Kutka, aktivnosti i napredak djaka.",
    excerpt_en:
      "Narrative blog posts will share everyday moments from Kutak, activities and student milestones.",
    content_sr:
      "Zelimo balans: pola sadrzaja edukativno, pola o zivotu Kutka i iskustvima sa casova.",
    content_en:
      "Our plan is balanced content: half educational guidance, half stories from Kutak and classroom life.",
    published: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function seed() {
  try {
    console.log("🌱 Starting database seed...\n");

    console.log("Adding classes...");
    for (const schoolClass of sampleClasses) {
      await db.collection("classes").doc(schoolClass.id).set(schoolClass);
    }
    console.log(`✓ Added ${sampleClasses.length} classes\n`);

    console.log("Adding terms...");
    for (const term of sampleTerms) {
      await db.collection("terms").doc(term.id).set(term);
    }
    console.log(`✓ Added ${sampleTerms.length} terms\n`);

    console.log("Adding blog posts...");
    for (const post of sampleBlogPosts) {
      await db.collection("blogPosts").doc(post.id).set(post);
    }
    console.log(`✓ Added ${sampleBlogPosts.length} blog posts\n`);

    console.log("✅ Database seed complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

void seed();
