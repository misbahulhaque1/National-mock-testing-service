import pg from 'pg';

const pool = new pg.Pool(process.env.DATABASE_URL ? {
  connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 4000, max: 2
} : {
  host: process.env.SQL_HOST, database: process.env.SQL_DB_NAME,
  user: process.env.SQL_USER, password: process.env.SQL_PASSWORD,
  connectionTimeoutMillis: 4000, max: 2
});

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.setHeader('Allow', 'GET').status(405).end();
  if (!process.env.DATABASE_URL && !process.env.SQL_HOST) {
    return res.status(503).json({ error: 'Statistics database unavailable' });
  }
  try {
    const { rows } = await pool.query('SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM exams) AS exams, (SELECT COUNT(*) FROM certificates) AS certificates');
    const counts = rows[0];
    return res.status(200).json({ totalUsers: Number(counts.users), totalExams: Number(counts.exams), totalCertificates: Number(counts.certificates), uptime: 'ONLINE' });
  } catch {
    return res.status(503).json({ error: 'Statistics database unavailable' });
  }
}
