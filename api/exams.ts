import { eq } from "drizzle-orm";
import { db } from "../src/db/index.js";
import { exams } from "../src/db/schema.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.setHeader("Allow", "GET").status(405).end();
  const category = String(req.query.category || "All");
  const search = String(req.query.search || "").toLowerCase();
  try {
    const published = await db.select().from(exams).where(eq(exams.status, "published"));
    return res.json(published.filter(exam => (category === "All" || exam.category === category) &&
      (exam.title.toLowerCase().includes(search) || exam.description.toLowerCase().includes(search))));
  } catch {
    return res.status(503).json({error:"Exam catalog unavailable"});
  }
}
