import { closeDb, getDb } from "../src/db/mongoClient.js";

async function reset() {
  const db = await getDb();
  const { deletedCount } = await db.collection("giftIdeas").deleteMany({});
  console.log(`Removed ${deletedCount} gift ideas.`);
}

reset()
  .catch((error) => {
    console.error("Reset failed:", error.message);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
