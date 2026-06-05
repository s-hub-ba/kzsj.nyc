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

async function resetBookedCounts() {
  const termsSnap = await db.collection("terms").get();

  if (termsSnap.empty) {
    console.log("Nema termina u bazi.");
    return;
  }

  const batch = db.batch();
  let count = 0;

  for (const docRef of termsSnap.docs) {
    const data = docRef.data();
    console.log(`  Resetujem: ${data.title_sr ?? docRef.id} (bookedCount: ${data.bookedCount ?? 0} → 0)`);
    batch.update(docRef.ref, { bookedCount: 0 });
    count++;
  }

  await batch.commit();
  console.log(`\n✅ Resetovano ${count} termina.`);
}

resetBookedCounts().catch((err) => {
  console.error("❌ Greška:", err);
  process.exit(1);
});
