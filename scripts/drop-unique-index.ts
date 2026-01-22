const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in .env.local");
  process.exit(1);
}

async function dropUniqueIndex() {
  const client = await MongoClient.connect(MONGODB_URI);

  try {
    const db = client.db();
    const collection = db.collection("projectionapprovals");

    
    // Check if collection exists
    const collections = await db
      .listCollections({ name: "projectionapprovals" })
      .toArray();

    if (collections.length === 0) {
     
      return;
    }

    const indexes = await collection.indexes();
    
    // Drop the unique index if it exists
    try {
      await collection.dropIndex("projectionId_1_userId_1");
    } catch (error: any) {
      if (error.codeName === "IndexNotFound") {
        } else {
        console.error("Error dropping index:", error);
      }
    }

    // Recreate the non-unique index
    await collection.createIndex(
      { projectionId: 1, userId: 1 },
      { unique: false }
    );
    const finalIndexes = await collection.indexes();
    } finally {
    await client.close();
  }
}

dropUniqueIndex()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  });
