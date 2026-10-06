// Fake data for the LOCAL test database only. Refuses to run against anything
// but localhost so it can never write to the Replit database.
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

const url = process.env.DATABASE_URL || "";
if (!/@localhost:5433\//.test(url)) {
  console.error("seed:local only runs against the local test database (localhost:5433).");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: url });
const db = drizzle(pool, { schema });
const { users, artworks, charities } = schema;

const inDays = (d: number) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);
const img = (name: string) => `/src/assets/images/${name}.png`;

async function main() {
  await db.insert(users).values([
    {
      id: "local-maya", email: "maya@example.test", firstName: "Maya", lastName: "Okafor", role: "artist",
      bio: "Senior at a Brooklyn high school. Watercolor and ink.", hasCompletedOnboarding: new Date(),
      dateOfBirth: "2000-04-12", payoutMethod: "paypal", payoutHandle: "maya@example.test",
      shipFromStreet: "1 Main St", shipFromCity: "Brooklyn", shipFromState: "NY", shipFromZip: "11201",
    },
    {
      id: "local-leo", email: "leo@example.test", firstName: "Leo", lastName: "Martinez", role: "artist",
      bio: "Tenth grader who paints cities at night.", hasCompletedOnboarding: new Date(),
      dateOfBirth: "2010-09-03", parentGuardianEmail: "parent@example.test", parentPayoutMethod: "venmo",
      parentPayoutHandle: "@parent-test", parentTermsAcceptedAt: new Date(),
      shipFromStreet: "2 Park Ave", shipFromCity: "New York", shipFromState: "NY", shipFromZip: "10016",
    },
    {
      id: "local-noname", email: "noname@example.test", role: "artist", hasCompletedOnboarding: new Date(),
      bio: "Artist account with no name, to test the name prompt.",
    },
  ]).onConflictDoNothing();

  const [charity] = await db.insert(charities).values({
    name: "Test Charity", description: "Placeholder charity for local testing.", category: "global",
  }).returning();

  await db.insert(artworks).values([
    { title: "Harbor at Dusk", description: "Watercolor on cold-press paper.", imageUrl: img("art-ocean-watercolor"),
      artistId: "local-maya", status: "approved", price: "180.00", buyNowPrice: "320.00", endTime: inDays(5),
      dimensions: "16 x 12 inches", weightOz: 24, charityId: charity.id },
    { title: "Midtown, 2am", description: "Acrylic on canvas.", imageUrl: img("art-urban-cityscape"),
      artistId: "local-leo", status: "approved", price: "240.00", buyNowPrice: "450.00", endTime: inDays(3),
      dimensions: "24 x 18 inches", weightOz: 48, charityId: charity.id },
    { title: "Flower Study", description: "Oil on panel.", imageUrl: img("art-floral-still-life"),
      artistId: "local-noname", status: "approved", price: "1200.00", buyNowPrice: "1500.00", endTime: inDays(7),
      dimensions: "36 x 30 inches", weightOz: 160, charityId: charity.id },
  ]);

  console.log("Seeded 3 fake artists (one adult, one minor, one without a name) and 3 artworks.");
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
