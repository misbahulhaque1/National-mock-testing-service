import { pgTable, text, integer, boolean, real, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(), // We use the user's string ID (can be Firebase Auth UID or initial seeded ID)
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull(),
  cnic: text("cnic"),
  registrationDate: text("registration_date").notNull(),
  lastLogin: text("last_login"),
  ipAddress: text("ip_address"),
  browser: text("browser"),
  device: text("device"),
  passwordHash: text("password_hash"),
});

export const exams = pgTable("exams", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  duration: integer("duration").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  totalMarks: integer("total_marks").notNull(),
  passingScore: integer("passing_score").notNull(),
  negativeMarkingValue: real("negative_marking_value").notNull(),
  status: text("status").notNull(),
  scheduledAt: text("scheduled_at"),
  subjects: jsonb("subjects").notNull(), // text array representing subjects
  difficulty: text("difficulty").notNull(),
});

export const questions = pgTable("questions", {
  id: text("id").primaryKey(),
  examId: text("exam_id")
    .references(() => exams.id, { onDelete: "cascade" })
    .notNull(),
  type: text("type").notNull(),
  text: text("text").notNull(),
  options: jsonb("options"), // MCQ options array
  correctAnswer: jsonb("correct_answer").notNull(), // Single answer string or multiple correct answers array/string
  explanation: text("explanation"),
  subject: text("subject").notNull(),
  topic: text("topic").notNull(),
  difficulty: text("difficulty").notNull(),
  estimatedSolveTime: integer("estimated_solve_time"),
});

export const examAttempts = pgTable("exam_attempts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  examId: text("exam_id")
    .references(() => exams.id, { onDelete: "cascade" })
    .notNull(),
  startedAt: text("started_at").notNull(),
  submittedAt: text("submitted_at"),
  answers: jsonb("answers").notNull(), // Map from questionId -> answered value
  markedForReview: jsonb("marked_for_review").notNull(), // Map from questionId -> boolean
  status: text("status").notNull(),
  score: real("score"),
  correctCount: integer("correct_count"),
  incorrectCount: integer("incorrect_count"),
  skippedCount: integer("skipped_count"),
  negativeMarksApplied: real("negative_marks_applied"),
  warningCount: integer("warning_count").notNull(),
  percentile: real("percentile"),
  rank: integer("rank"),
  timeSpentSeconds: integer("time_spent_seconds"),
});

export const certificates = pgTable("certificates", {
  id: text("id").primaryKey(),
  attemptId: text("attempt_id")
    .references(() => examAttempts.id, { onDelete: "cascade" })
    .notNull(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  candidateName: text("candidate_name").notNull(),
  cnic: text("cnic"),
  examId: text("exam_id")
    .references(() => exams.id, { onDelete: "cascade" })
    .notNull(),
  examTitle: text("exam_title").notNull(),
  score: real("score").notNull(),
  totalMarks: real("total_marks").notNull(),
  percentile: real("percentile").notNull(),
  certificateNumber: text("certificate_number").notNull().unique(),
  issuedAt: text("issued_at").notNull(),
  qrCodeUrl: text("qr_code_url").notNull(),
});

export const notices = pgTable("notices", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  publishedAt: text("published_at").notNull(),
  attachmentUrl: text("attachment_url"),
  isPinned: boolean("is_pinned").notNull(),
});

export const downloads = pgTable("downloads", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  fileSize: text("file_size").notNull(),
  fileType: text("file_type").notNull(),
  category: text("category").notNull(),
  publishedAt: text("published_at").notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  userRole: text("user_role").notNull(),
  action: text("action").notNull(),
  timestamp: text("timestamp").notNull(),
  ipAddress: text("ip_address").notNull(),
  browser: text("browser").notNull(),
  device: text("device").notNull(),
  details: text("details").notNull(),
});

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export const settings = pgTable("settings", {
  id: text("id").primaryKey().default("system_config"),
  siteName: text("site_name").notNull(),
  maintenanceMode: boolean("maintenance_mode").notNull(),
  allowSelfRegistration: boolean("allow_self_registration").notNull(),
  antiCheatingStrictness: text("anti_cheating_strictness").notNull(),
  autoSubmitOnViolations: boolean("auto_submit_on_violations").notNull(),
  maxViolationsAllowed: integer("max_violations_allowed").notNull(),
  allowAIGeneration: boolean("allow_ai_generation").notNull(),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  contactAddress: text("contact_address"),
  footerText: text("footer_text"),
  orgName: text("org_name"),
  facebookUrl: text("facebook_url"),
  twitterUrl: text("twitter_url"),
  linkedinUrl: text("linkedin_url"),
  youtubeUrl: text("youtube_url"),
  heroTitle: text("hero_title"),
  heroSubtitle: text("hero_subtitle"),
  seoDescription: text("seo_description"),
  seoKeywords: text("seo_keywords"),
  statExamsCount: integer("stat_exams_count"),
  statAspirantsCount: integer("stat_aspirants_count"),
  statCitiesCount: integer("stat_cities_count"),
  statCentersCount: integer("stat_centers_count"),
});
