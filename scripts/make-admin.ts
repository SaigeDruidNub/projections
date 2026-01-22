/**
 * Script to make a user an admin
 * Usage: npx tsx scripts/make-admin.ts <user-email>
 */

// Load environment variables FIRST before any imports that use them
import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local file
const result = config({ path: resolve(process.cwd(), ".env.local") });

if (result.error) {
  console.error("Error loading .env.local:", result.error);
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI not found in .env.local");
  process.exit(1);
}

// Now import modules that depend on environment variables
import dbConnect from "../lib/mongodb";
import { User } from "../lib/models";

async function makeAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error("Please provide a user email as an argument");
    console.error("Usage: npx tsx scripts/make-admin.ts user@example.com");
    process.exit(1);
  }

  try {
   await dbConnect();
    
    const user = await User.findOne({ email });

    if (!user) {
      console.error(`User with email "${email}" not found`);
      process.exit(1);
    }

    user.isAdmin = true;
    await user.save();

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

makeAdmin();
