import { closeDb, getDb } from "../src/db/mongoClient.js";
import { giftIdeas } from "../src/data/giftIdeas.js";

async function seed() {
  const db = await getDb();
  const collection = db.collection("giftIdeas");

  await collection.createIndex({ id: 1 }, { unique: true });

  for (const giftIdea of giftIdeas) {
    await collection.replaceOne({ id: giftIdea.id }, giftIdea, { upsert: true });
  }

  const count = await collection.countDocuments();
  console.log(`Seeded ${giftIdeas.length} gift ideas (collection now has ${count} documents).`);
}

seed()
  .catch((error) => {
    console.error("Seeding failed:", error.message);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
