import { getDb } from "../../db/mongoClient.js";

async function getCollection() {
  const db = await getDb();
  return db.collection("giftIdeas");
}

export const giftIdeasRepository = {
  async list() {
    const collection = await getCollection();
    return collection.find({}, { projection: { _id: 0 } }).sort({ id: 1 }).toArray();
  },

  async getById(id) {
    const collection = await getCollection();
    return collection.findOne({ id }, { projection: { _id: 0 } });
  },

  async create({ idea, price, type }) {
    const collection = await getCollection();
    const [latest] = await collection.find().sort({ id: -1 }).limit(1).toArray();
    const giftIdea = { id: (latest?.id ?? 0) + 1, idea, price, type };
    await collection.insertOne({ ...giftIdea });
    return giftIdea;
  },

  async update(id, { idea, price, type }) {
    const collection = await getCollection();
    return collection.findOneAndUpdate(
      { id },
      { $set: { idea, price, type } },
      { returnDocument: "after", projection: { _id: 0 } }
    );
  },

  async remove(id) {
    const collection = await getCollection();
    const { deletedCount } = await collection.deleteOne({ id });
    return deletedCount === 1;
  }
};