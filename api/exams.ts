import pg from "pg";
const pool = new pg.Pool({connectionString: process.env.DATABASE_URL, max: 2, connectionTimeoutMillis: 4000});

export default async function handler(req, res) {
  if (req.method !== "GET") return res.setHeader("Allow", "GET").status(405).end();
  const category = String(req.query.category || "All");
  const search = String(req.query.search || "");
  try {
    const {rows} = await pool.query(`SELECT id, title, description, category, duration, total_questions AS "totalQuestions", total_marks AS "totalMarks", passing_score AS "passingScore", negative_marking_value AS "negativeMarkingValue", status, scheduled_at AS "scheduledAt", subjects, difficulty FROM exams WHERE status='published' AND ($1='All' OR category=$1) AND strpos(lower(title || ' ' || description), lower($2)) > 0 ORDER BY title`, [category, search]);
    return res.json(rows);
  } catch {
    return res.status(503).json({error: "Exam catalog unavailable"});
  }
}
