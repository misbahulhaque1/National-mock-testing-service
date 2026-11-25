CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"user_name" text NOT NULL,
	"user_role" text NOT NULL,
	"action" text NOT NULL,
	"timestamp" text NOT NULL,
	"ip_address" text NOT NULL,
	"browser" text NOT NULL,
	"device" text NOT NULL,
	"details" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" text PRIMARY KEY NOT NULL,
	"attempt_id" text NOT NULL,
	"user_id" text NOT NULL,
	"candidate_name" text NOT NULL,
	"cnic" text,
	"exam_id" text NOT NULL,
	"exam_title" text NOT NULL,
	"score" real NOT NULL,
	"total_marks" real NOT NULL,
	"percentile" real NOT NULL,
	"certificate_number" text NOT NULL,
	"issued_at" text NOT NULL,
	"qr_code_url" text NOT NULL,
	CONSTRAINT "certificates_certificate_number_unique" UNIQUE("certificate_number")
);
--> statement-breakpoint
CREATE TABLE "downloads" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"file_size" text NOT NULL,
	"file_type" text NOT NULL,
	"category" text NOT NULL,
	"published_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"exam_id" text NOT NULL,
	"started_at" text NOT NULL,
	"submitted_at" text,
	"answers" jsonb NOT NULL,
	"marked_for_review" jsonb NOT NULL,
	"status" text NOT NULL,
	"score" real,
	"correct_count" integer,
	"incorrect_count" integer,
	"skipped_count" integer,
	"negative_marks_applied" real,
	"warning_count" integer NOT NULL,
	"percentile" real,
	"rank" integer,
	"time_spent_seconds" integer
);
--> statement-breakpoint
CREATE TABLE "exams" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"duration" integer NOT NULL,
	"total_questions" integer NOT NULL,
	"total_marks" integer NOT NULL,
	"passing_score" integer NOT NULL,
	"negative_marking_value" real NOT NULL,
	"status" text NOT NULL,
	"scheduled_at" text,
	"subjects" jsonb NOT NULL,
	"difficulty" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notices" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"category" text NOT NULL,
	"published_at" text NOT NULL,
	"attachment_url" text,
	"is_pinned" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" text PRIMARY KEY NOT NULL,
	"exam_id" text NOT NULL,
	"type" text NOT NULL,
	"text" text NOT NULL,
	"options" jsonb,
	"correct_answer" jsonb NOT NULL,
	"explanation" text,
	"subject" text NOT NULL,
	"topic" text NOT NULL,
	"difficulty" text NOT NULL,
	"estimated_solve_time" integer
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" text PRIMARY KEY DEFAULT 'system_config' NOT NULL,
	"site_name" text NOT NULL,
	"maintenance_mode" boolean NOT NULL,
	"allow_self_registration" boolean NOT NULL,
	"anti_cheating_strictness" text NOT NULL,
	"auto_submit_on_violations" boolean NOT NULL,
	"max_violations_allowed" integer NOT NULL,
	"allow_ai_generation" boolean NOT NULL,
	"contact_email" text,
	"contact_phone" text,
	"contact_address" text,
	"footer_text" text,
	"org_name" text,
	"facebook_url" text,
	"twitter_url" text,
	"linkedin_url" text,
	"youtube_url" text,
	"hero_title" text,
	"hero_subtitle" text,
	"seo_description" text,
	"seo_keywords" text,
	"stat_exams_count" integer,
	"stat_aspirants_count" integer,
	"stat_cities_count" integer,
	"stat_centers_count" integer
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"cnic" text,
	"registration_date" text NOT NULL,
	"last_login" text,
	"ip_address" text,
	"browser" text,
	"device" text,
	"password_hash" text,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_attempt_id_exam_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."exam_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;