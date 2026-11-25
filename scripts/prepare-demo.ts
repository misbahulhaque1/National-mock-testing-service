import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { exams, questions } from '../src/db/schema';
import { ntsExam, ntsQuestions } from '../src/nts_exam_data';

if (process.env.VERCEL_ENV === 'production') {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for production');
  const client = new Client({ connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query('SELECT pg_advisory_lock(620083)');
    const db = drizzle(client);
    await migrate(db, { migrationsFolder: './drizzle' });
    await db.transaction(async tx => {
      await tx.insert(exams).values(ntsExam).onConflictDoNothing();
      await tx.insert(questions).values(ntsQuestions).onConflictDoNothing();
    });
  } finally {
    await client.end();
  }
}
