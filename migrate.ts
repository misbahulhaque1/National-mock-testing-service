import fs from "fs";
import path from "path";
import bcryptjs from "bcryptjs";
import { db } from "./src/db/index.ts";
import * as schema from "./src/db/schema.ts";

const DB_FILE = path.join(process.cwd(), "nmts_db.json");

async function runMigration() {
  console.log("Starting database migration from nmts_db.json to PostgreSQL...");

  if (!fs.existsSync(DB_FILE)) {
    console.error(`Local database file ${DB_FILE} not found. Cannot migrate!`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(DB_FILE, "utf-8");
  const localDb = JSON.parse(rawData);

  // 1. Migrate Users
  if (localDb.users && localDb.users.length > 0) {
    console.log(`Migrating ${localDb.users.length} users...`);
    const defaultHash = bcryptjs.hashSync("123456", 10);
    
    for (const u of localDb.users) {
      await db.insert(schema.users)
        .values({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          cnic: u.cnic || null,
          registrationDate: u.registrationDate || new Date().toISOString(),
          lastLogin: u.lastLogin || null,
          ipAddress: u.ipAddress || null,
          browser: u.browser || null,
          device: u.device || null,
          passwordHash: defaultHash,
        })
        .onConflictDoNothing();
    }
  }

  // 2. Migrate Exams
  if (localDb.exams && localDb.exams.length > 0) {
    console.log(`Migrating ${localDb.exams.length} exams...`);
    for (const e of localDb.exams) {
      await db.insert(schema.exams)
        .values({
          id: e.id,
          title: e.title,
          description: e.description,
          category: e.category,
          duration: e.duration,
          totalQuestions: e.totalQuestions,
          totalMarks: e.totalMarks,
          passingScore: e.passingScore,
          negativeMarkingValue: parseFloat(e.negativeMarkingValue) || 0,
          status: e.status,
          scheduledAt: e.scheduledAt || null,
          subjects: e.subjects || [],
          difficulty: e.difficulty,
        })
        .onConflictDoNothing();
    }
  }

  // 3. Migrate Questions
  if (localDb.questions && localDb.questions.length > 0) {
    console.log(`Migrating ${localDb.questions.length} questions...`);
    for (const q of localDb.questions) {
      await db.insert(schema.questions)
        .values({
          id: q.id,
          examId: q.examId,
          type: q.type,
          text: q.text,
          options: q.options || null,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || null,
          subject: q.subject,
          topic: q.topic,
          difficulty: q.difficulty,
          estimatedSolveTime: q.estimatedSolveTime || null,
        })
        .onConflictDoNothing();
    }
  }

  // 4. Migrate Exam Attempts
  if (localDb.examAttempts && localDb.examAttempts.length > 0) {
    console.log(`Migrating ${localDb.examAttempts.length} exam attempts...`);
    for (const ea of localDb.examAttempts) {
      await db.insert(schema.examAttempts)
        .values({
          id: ea.id,
          userId: ea.userId,
          examId: ea.examId,
          startedAt: ea.startedAt,
          submittedAt: ea.submittedAt || null,
          answers: ea.answers || {},
          markedForReview: ea.markedForReview || {},
          status: ea.status,
          score: ea.score !== undefined ? parseFloat(ea.score) : null,
          correctCount: ea.correctCount !== undefined ? ea.correctCount : null,
          incorrectCount: ea.incorrectCount !== undefined ? ea.incorrectCount : null,
          skippedCount: ea.skippedCount !== undefined ? ea.skippedCount : null,
          negativeMarksApplied: ea.negativeMarksApplied !== undefined ? parseFloat(ea.negativeMarksApplied) : null,
          warningCount: ea.warningCount || 0,
          percentile: ea.percentile !== undefined ? parseFloat(ea.percentile) : null,
          rank: ea.rank || null,
          timeSpentSeconds: ea.timeSpentSeconds || null,
        })
        .onConflictDoNothing();
    }
  }

  // 5. Migrate Certificates
  if (localDb.certificates && localDb.certificates.length > 0) {
    console.log(`Migrating ${localDb.certificates.length} certificates...`);
    for (const c of localDb.certificates) {
      await db.insert(schema.certificates)
        .values({
          id: c.id,
          attemptId: c.attemptId,
          userId: c.userId,
          candidateName: c.candidateName,
          cnic: c.cnic || null,
          examId: c.examId,
          examTitle: c.examTitle,
          score: parseFloat(c.score) || 0,
          totalMarks: parseFloat(c.totalMarks) || 0,
          percentile: parseFloat(c.percentile) || 0,
          certificateNumber: c.certificateNumber,
          issuedAt: c.issuedAt,
          qrCodeUrl: c.qrCodeUrl,
        })
        .onConflictDoNothing();
    }
  }

  // 6. Migrate Notices
  if (localDb.notices && localDb.notices.length > 0) {
    console.log(`Migrating ${localDb.notices.length} notices...`);
    for (const n of localDb.notices) {
      await db.insert(schema.notices)
        .values({
          id: n.id,
          title: n.title,
          content: n.content,
          category: n.category,
          publishedAt: n.publishedAt,
          attachmentUrl: n.attachmentUrl || null,
          isPinned: !!n.isPinned,
        })
        .onConflictDoNothing();
    }
  }

  // 7. Migrate Downloads
  if (localDb.downloads && localDb.downloads.length > 0) {
    console.log(`Migrating ${localDb.downloads.length} downloads...`);
    for (const d of localDb.downloads) {
      await db.insert(schema.downloads)
        .values({
          id: d.id,
          title: d.title,
          description: d.description,
          fileSize: d.fileSize,
          fileType: d.fileType,
          category: d.category,
          publishedAt: d.publishedAt,
        })
        .onConflictDoNothing();
    }
  }

  // 8. Migrate Audit Logs
  if (localDb.auditLogs && localDb.auditLogs.length > 0) {
    console.log(`Migrating ${localDb.auditLogs.length} audit logs...`);
    for (const al of localDb.auditLogs) {
      await db.insert(schema.auditLogs)
        .values({
          id: al.id,
          userId: al.userId,
          userName: al.userName,
          userRole: al.userRole,
          action: al.action,
          timestamp: al.timestamp,
          ipAddress: al.ipAddress,
          browser: al.browser,
          device: al.device,
          details: al.details,
        })
        .onConflictDoNothing();
    }
  }

  // 9. Migrate Notifications
  if (localDb.notifications && localDb.notifications.length > 0) {
    console.log(`Migrating ${localDb.notifications.length} notifications...`);
    for (const nt of localDb.notifications) {
      await db.insert(schema.notifications)
        .values({
          id: nt.id,
          userId: nt.userId,
          title: nt.title,
          message: nt.message,
          type: nt.type,
          read: !!nt.read,
          createdAt: nt.createdAt,
        })
        .onConflictDoNothing();
    }
  }

  // 10. Migrate Settings
  if (localDb.settings) {
    console.log("Migrating settings...");
    const s = localDb.settings;
    await db.insert(schema.settings)
      .values({
        id: "system_config",
        siteName: s.siteName,
        maintenanceMode: !!s.maintenanceMode,
        allowSelfRegistration: !!s.allowSelfRegistration,
        antiCheatingStrictness: s.antiCheatingStrictness,
        autoSubmitOnViolations: !!s.autoSubmitOnViolations,
        maxViolationsAllowed: s.maxViolationsAllowed,
        allowAIGeneration: !!s.allowAIGeneration,
        contactEmail: s.contactEmail || null,
        contactPhone: s.contactPhone || null,
        contactAddress: s.contactAddress || null,
        footerText: s.footerText || null,
        orgName: s.orgName || null,
        facebookUrl: s.facebookUrl || null,
        twitterUrl: s.twitterUrl || null,
        linkedinUrl: s.linkedinUrl || null,
        youtubeUrl: s.youtubeUrl || null,
        heroTitle: s.heroTitle || null,
        heroSubtitle: s.heroSubtitle || null,
        seoDescription: s.seoDescription || null,
        seoKeywords: s.seoKeywords || null,
        statExamsCount: s.statExamsCount || null,
        statAspirantsCount: s.statAspirantsCount || null,
        statCitiesCount: s.statCitiesCount || null,
        statCentersCount: s.statCentersCount || null,
      })
      .onConflictDoUpdate({
        target: schema.settings.id,
        set: {
          siteName: s.siteName,
          maintenanceMode: !!s.maintenanceMode,
          allowSelfRegistration: !!s.allowSelfRegistration,
          antiCheatingStrictness: s.antiCheatingStrictness,
          autoSubmitOnViolations: !!s.autoSubmitOnViolations,
          maxViolationsAllowed: s.maxViolationsAllowed,
          allowAIGeneration: !!s.allowAIGeneration,
          contactEmail: s.contactEmail || null,
          contactPhone: s.contactPhone || null,
          contactAddress: s.contactAddress || null,
          footerText: s.footerText || null,
          orgName: s.orgName || null,
          facebookUrl: s.facebookUrl || null,
          twitterUrl: s.twitterUrl || null,
          linkedinUrl: s.linkedinUrl || null,
          youtubeUrl: s.youtubeUrl || null,
          heroTitle: s.heroTitle || null,
          heroSubtitle: s.heroSubtitle || null,
          seoDescription: s.seoDescription || null,
          seoKeywords: s.seoKeywords || null,
          statExamsCount: s.statExamsCount || null,
          statAspirantsCount: s.statAspirantsCount || null,
          statCitiesCount: s.statCitiesCount || null,
          statCentersCount: s.statCentersCount || null,
        }
      });
  }

  console.log("Database migration from nmts_db.json finished successfully!");
  process.exit(0);
}

runMigration().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
