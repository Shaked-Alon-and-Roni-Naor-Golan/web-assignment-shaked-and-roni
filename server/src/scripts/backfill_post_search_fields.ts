import mongoose from "mongoose";
import * as path from "path";
import dotenv from "dotenv";
import { PostModel } from "../models/posts_model";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const cityPool = [
  "tel aviv",
  "jerusalem",
  "haifa",
  "eilat",
  "netanya",
  "tiberias",
  "nazareth",
  "ashdod",
  "beer sheva",
];

const buildExampleValues = (index: number) => {
  const city = cityPool[index % cityPool.length];
  const pricePerNight = 280 + (index % 8) * 120;
  const nights = 1 + (index % 7);

  return { city, pricePerNight, nights };
};

const run = async () => {
  const mongoUri = process.env.DB_CONNECT;
  if (!mongoUri) {
    throw new Error("Missing MongoDB URI. Set DB_CONNECT in server/.env");
  }

  await mongoose.connect(mongoUri);

  const posts = await PostModel.find(
    {
      $or: [
        { city: { $exists: false } },
        { city: null },
        { city: "" },
        { pricePerNight: { $exists: false } },
        { pricePerNight: null },
        { nights: { $exists: false } },
        { nights: null },
      ],
    },
    { _id: 1, city: 1, pricePerNight: 1, nights: 1 }
  ).lean();

  if (posts.length === 0) {
    console.log("No posts need backfill.");
    await mongoose.disconnect();
    return;
  }

  const updates = posts.map((post, index) => {
    const examples = buildExampleValues(index);

    return {
      updateOne: {
        filter: { _id: post._id },
        update: {
          $set: {
            city: post.city && String(post.city).trim() ? post.city : examples.city,
            pricePerNight:
              typeof post.pricePerNight === "number"
                ? post.pricePerNight
                : examples.pricePerNight,
            nights: typeof post.nights === "number" ? post.nights : examples.nights,
          },
        },
      },
    };
  });

  const result = await PostModel.bulkWrite(updates);
  console.log(
    `Backfill complete. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`
  );

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error("Backfill failed:", error);
  await mongoose.disconnect();
  process.exit(1);
});
