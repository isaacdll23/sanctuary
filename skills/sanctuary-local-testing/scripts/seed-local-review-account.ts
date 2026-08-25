import { hash } from "argon2";
import { Client } from "pg";

const databaseUrl = process.env.DATABASE_URL;
const reviewUsername = "test";
const reviewEmail = "test@sanctuary.local";
const reviewPassword = "test";
const expectedDatabaseUrl =
  "postgresql://sanctuary:sanctuary_local_review_2026@127.0.0.1:5434/sanctuary_local";

if (databaseUrl !== expectedDatabaseUrl) {
  throw new Error("Refusing to seed an account outside Sanctuary's local test database.");
}

const client = new Client({ connectionString: databaseUrl });

try {
  await client.connect();
  const passwordHash = await hash(reviewPassword);

  await client.query(
    `INSERT INTO users (username, email, "passwordHash", role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (username)
     DO UPDATE SET
       email = EXCLUDED.email,
       "passwordHash" = EXCLUDED."passwordHash",
       role = 'admin'`,
    [reviewUsername, reviewEmail, passwordHash]
  );

  console.log(`Ensured local admin review account: ${reviewUsername}`);
} finally {
  await client.end();
}
