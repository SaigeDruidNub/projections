const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in .env.local");
  process.exit(1);
}

async function dropUniqueIndex() {
  console.log("Connecting to MongoDB...");
  const client = await MongoClient.connect(MONGODB_URI);

  try {
    const db = client.db();
    const collection = db.collection("projectionapprovals");

    console.log("Checking existing indexes...");

    // Check if collection exists
    const collections = await db
      .listCollections({ name: "projectionapprovals" })
      .toArray();

    if (collections.length === 0) {
      console.log(
        "ℹ️  Collection 'projectionapprovals' doesn't exist yet. No migration needed."
      );
      console.log(
        "   The correct schema will be applied when the first approval is created."
      );
      return;
    }

    const indexes = await collection.indexes();
    console.log("Current indexes:", JSON.stringify(indexes, null, 2));

    // Drop the unique index if it exists
    try {
      await collection.dropIndex("projectionId_1_userId_1");
      console.log("✅ Successfully dropped unique index");
    } catch (error) {
      if (error.codeName === "IndexNotFound") {
        console.log(
          "ℹ️  Unique index not found (already removed or never existed)"
        );
      } else {
        console.error("Error dropping index:", error);
      }
    }

    // Recreate the non-unique index
    await collection.createIndex(
      { projectionId: 1, userId: 1 },
      { unique: false }
    );
    console.log("✅ Created non-unique index");

    console.log("\nFinal indexes:");
    const finalIndexes = await collection.indexes();
    console.log(JSON.stringify(finalIndexes, null, 2));
  } finally {
    await client.close();
  }
}

dropUniqueIndex()
  .then(() => {
    console.log("\n✅ Migration complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  });
