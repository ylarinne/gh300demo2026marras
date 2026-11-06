import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017";
const dbName = process.env.MONGODB_DB ?? "gift_ideas";

let client;

export async function getDb() {
  if (!client) {
    client = new MongoClient(uri, { serverSelectionTimeoutMS: 3000 });
    await client.connect();
  }
  return client.db(dbName);
}

export async function closeDb() {
  if (client) {
    await client.close();
    client = undefined;
  }
}
