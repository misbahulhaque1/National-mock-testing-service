/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { 
  User, UserRole, Exam, Question, ExamAttempt, Certificate, 
  Notice, DownloadItem, AuditLog, SystemNotification, SystemSettings, ExamCategory, QuestionType 
} from "./src/types";
import { ntsExam, ntsQuestions } from "./src/nts_exam_data";
import bcryptjs from "bcryptjs";
import { db } from "./src/db/index.ts";
import * as schema from "./src/db/schema.ts";
import { eq, and, or, like, desc, asc } from "drizzle-orm";

dotenv.config();

const app = express();
app.use(express.json({ limit: "20mb" }));

const PORT = 3000;

// Global default settings
const defaultSettings: SystemSettings = {
  siteName: "National Mock Testing Service (NMTS)",
  maintenanceMode: false,
  allowSelfRegistration: true,
  antiCheatingStrictness: "high",
  autoSubmitOnViolations: true,
  maxViolationsAllowed: 3,
  allowAIGeneration: true,
  contactEmail: "contact@nmts-portal.org",
  contactPhone: "+92 51 0000000",
  contactAddress: "Contact info will be provided by the administrator.",
  footerText: "This platform is intended for mock examinations and practice tests.",
  orgName: "National Mock Testing Service (NMTS)",
  facebookUrl: "https://facebook.com",
  twitterUrl: "https://twitter.com",
  linkedinUrl: "https://linkedin.com",
  youtubeUrl: "https://youtube.com",
  heroTitle: "National Mock Testing Service (NMTS)",
  heroSubtitle: "Standardized diagnostic simulator portal for examinations and mock practice tests.",
  seoDescription: "Standardized diagnostic simulator portal for examinations and mock practice tests.",
  seoKeywords: "mock test, exams, assessment, exam simulator, practice test",
  statExamsCount: 5,
  statAspirantsCount: 1500,
  statCitiesCount: 12,
  statCentersCount: 20
};

// Helper to log audit actions
const logAudit = async (userId: string, action: string, details: string, req: Request) => {
  try {
    const user = userId ? (await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1))[0] : null;
    await db.insert(schema.auditLogs).values({
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: userId || "anonymous",
      userName: user ? user.name : "Anonymous",
      userRole: user ? user.role : UserRole.CANDIDATE,
      action,
      timestamp: new Date().toISOString(),
      ipAddress: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1",
      browser: req.headers["user-agent"] || "Unknown Browser",
      device: req.headers["sec-ch-ua-platform"] ? `${req.headers["sec-ch-ua-platform"]}` : "Unknown Device",
      details
    });
  } catch (err) {
    console.error("Failed to log audit action", err);
  }
};

// ==========================================
// REST APIs
// ==========================================

// Auth Endpoint: Login
app.post("/api/auth/login", async (req: Request, res: Response) => {
  const { email, password, requestedRole, name, cnic } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  try {
    const systemSettings = (await db.select().from(schema.settings).where(eq(schema.settings.id, "system_config")).limit(1))[0] || defaultSettings;

    // Find user by email
    let user = (await db.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase())).limit(1))[0];

    // Support OTP simulation / self-registration
    if (!user) {
      if (systemSettings.allowSelfRegistration) {
        const newRole = requestedRole === "SUPER_ADMIN" ? UserRole.SUPER_ADMIN : (requestedRole === "ADMIN" ? UserRole.ADMIN : UserRole.CANDIDATE);
        const defaultPassword = password || "123456";
        const passwordHash = bcryptjs.hashSync(defaultPassword, 10);
        
        user = {
          id: `user-${Date.now()}`,
          name: name || email.split("@")[0].toUpperCase().replace(".", " "),
          email: email.toLowerCase(),
          role: newRole,
          cnic: cnic || `35201-${Math.floor(Math.random() * 10000000)}-1`,
          registrationDate: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          ipAddress: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1",
          browser: req.headers["user-agent"] || "Generic Agent",
          device: "Web Application Client",
          passwordHash,
        };
        await db.insert(schema.users).values({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          cnic: user.cnic || null,
          registrationDate: user.registrationDate,
          lastLogin: user.lastLogin,
          ipAddress: user.ipAddress,
          browser: user.browser,
          device: user.device,
          passwordHash: user.passwordHash,
        });
      } else {
        return res.status(403).json({ error: "Registration is restricted by policy." });
      }
    } else {
      // User exists, check password if provided
      if (password) {
        if (user.passwordHash && !bcryptjs.compareSync(password, user.passwordHash)) {
          return res.status(401).json({ error: "Incorrect password. Verification failed." });
        }
      }
      
      user.lastLogin = new Date().toISOString();
      user.ipAddress = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";
      user.browser = req.headers["user-agent"] || "Generic Agent";
      user.device = "Web Application Client";
      
      await db.update(schema.users).set({
        lastLogin: user.lastLogin,
        ipAddress: user.ipAddress,
        browser: user.browser,
        device: user.device
      }).where(eq(schema.users.id, user.id));
    }

    await logAudit(user.id, "User Login", `Authenticated via OTP session key. Role: ${user.role}`, req);

    res.json({ success: true, user });
  } catch (err: any) {
    console.error("Login endpoint error:", err);
    res.status(500).json({ error: "Authentication transaction failed." });
  }
});

// Notice Board search & fetch
app.get("/api/notices", async (req: Request, res: Response) => {
  const { search, category } = req.query;
  try {
    let list = await db.select().from(schema.notices);

    if (category && category !== "All") {
      list = list.filter(n => n.category.toLowerCase() === String(category).toLowerCase());
    }
    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
    }

    res.json(list);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notices." });
  }
});

// Downloads Center search & fetch
app.get("/api/downloads", async (req: Request, res: Response) => {
  const { search, category } = req.query;
  try {
    let list = await db.select().from(schema.downloads);

    if (category && category !== "All") {
      list = list.filter(d => d.category.toLowerCase() === String(category).toLowerCase());
    }
    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(d => d.title.toLowerCase().includes(q) || d.description.toLowerCase().includes(q));
    }

    res.json(list);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch downloads." });
  }
});

// Public Stats for Landing Page Ribbon
app.get("/api/public-stats", async (req: Request, res: Response) => {
  try {
    const usersCount = (await db.select().from(schema.users)).length;
    const examsCount = (await db.select().from(schema.exams)).length;
    const certsCount = (await db.select().from(schema.certificates)).length;
    res.json({
      totalUsers: usersCount,
      totalExams: examsCount,
      totalCertificates: certsCount,
      uptime: "100%"
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stats." });
  }
});

// Browse exams
app.get("/api/exams", async (req: Request, res: Response) => {
  const { search, category } = req.query;
  try {
    let list = await db.select().from(schema.exams).where(eq(schema.exams.status, "published"));

    if (category && category !== "All") {
      list = list.filter(e => e.category === category);
    }
    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(e => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q));
    }

    res.json(list);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch exams." });
  }
});

// Get Exam along with scrambled questions (Anti-Cheating layout)
app.get("/api/exams/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { randomize } = req.query;

  try {
    const exam = (await db.select().from(schema.exams).where(eq(schema.exams.id, id)).limit(1))[0];
    if (!exam) {
      return res.status(404).json({ error: "Mock exam not found." });
    }

    let examQuestions = await db.select().from(schema.questions).where(eq(schema.questions.examId, id));

    if (randomize === "true") {
      examQuestions = [...examQuestions].sort(() => Math.random() - 0.5);
    }

    res.json({ exam, questions: examQuestions });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch exam details." });
  }
});

// Create exam attempt
app.post("/api/exams/:id/start", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "User ID required to initialize attempt." });
  }

  try {
    const exam = (await db.select().from(schema.exams).where(eq(schema.exams.id, id)).limit(1))[0];
    if (!exam) {
      return res.status(404).json({ error: "Exam not found." });
    }

    const attemptId = `attempt-${Date.now()}`;
    const newAttempt = {
      id: attemptId,
      userId,
      examId: id,
      startedAt: new Date().toISOString(),
      answers: {},
      markedForReview: {},
      status: "ongoing",
      warningCount: 0
    };

    await db.insert(schema.examAttempts).values(newAttempt);
    await logAudit(userId, "Started Exam", `Began attempt ${attemptId} for exam: ${exam.title}`, req);

    res.json(newAttempt);
  } catch (error) {
    console.error("Start exam error:", error);
    res.status(500).json({ error: "Failed to start exam attempt." });
  }
});

// Sync answers & warning log in real-time (Auto-Save, connection loss recovery)
app.post("/api/attempts/:attemptId/save", async (req: Request, res: Response) => {
  const { attemptId } = req.params;
  const { answers, markedForReview, warningCount, userId } = req.body;

  try {
    const attempt = (await db.select().from(schema.examAttempts).where(eq(schema.examAttempts.id, attemptId)).limit(1))[0];
    if (!attempt) {
      return res.status(404).json({ error: "Attempt session not found." });
    }

    if (attempt.status === "submitted") {
      return res.status(400).json({ error: "Cannot sync. Exam already submitted." });
    }

    const updatedAnswers = answers || attempt.answers;
    const updatedMarkedForReview = markedForReview || attempt.markedForReview;
    const updatedWarningCount = warningCount !== undefined ? warningCount : attempt.warningCount;

    await db.update(schema.examAttempts)
      .set({
        answers: updatedAnswers,
        markedForReview: updatedMarkedForReview,
        warningCount: updatedWarningCount
      })
      .where(eq(schema.examAttempts.id, attemptId));

    if (warningCount !== undefined && warningCount > attempt.warningCount) {
      await logAudit(userId || attempt.userId, "Integrity Violation Warning", `Tab switch or blur event detected. Warning count updated to ${warningCount}.`, req);
    }

    res.json({ 
      success: true, 
      attempt: { 
        ...attempt, 
        answers: updatedAnswers, 
        markedForReview: updatedMarkedForReview, 
        warningCount: updatedWarningCount 
      } 
    });
  } catch (error) {
    console.error("Save attempt error:", error);
    res.status(500).json({ error: "Failed to save attempt state." });
  }
});

// Submit Exam (Auto-submit on timer or violations, auto-grade scoring)
app.post("/api/attempts/:attemptId/submit", async (req: Request, res: Response) => {
  const { attemptId } = req.params;

  try {
    const attempt = (await db.select().from(schema.examAttempts).where(eq(schema.examAttempts.id, attemptId)).limit(1))[0];
    if (!attempt) {
      return res.status(404).json({ error: "Exam attempt session not found." });
    }

    if (attempt.status === "submitted") {
      return res.json(attempt);
    }

    const exam = (await db.select().from(schema.exams).where(eq(schema.exams.id, attempt.examId)).limit(1))[0];
    if (!exam) {
      return res.status(404).json({ error: "Related exam schema missing." });
    }

    const questions = await db.select().from(schema.questions).where(eq(schema.questions.examId, exam.id));

    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;
    let negativeMarksApplied = 0;

    questions.forEach(q => {
      const candidateAnswer = (attempt.answers as any)[q.id];

      if (candidateAnswer === undefined || candidateAnswer === "") {
        skippedCount++;
      } else {
        let isCorrect = false;

        if (q.type === QuestionType.SINGLE_CORRECT || q.type === QuestionType.TRUE_FALSE) {
          isCorrect = String(candidateAnswer) === String(q.correctAnswer);
        } else if (q.type === QuestionType.MULTIPLE_CORRECT) {
          try {
            const correctSet: string[] = typeof q.correctAnswer === "string" ? JSON.parse(q.correctAnswer) : q.correctAnswer as string[];
            const candidateSet: string[] = typeof candidateAnswer === "string" ? JSON.parse(candidateAnswer) : candidateAnswer as string[];
            isCorrect = correctSet.length === candidateSet.length && correctSet.every(v => candidateSet.includes(v));
          } catch {
            isCorrect = String(candidateAnswer) === String(q.correctAnswer);
          }
        } else if (q.type === QuestionType.FILL_BLANK || q.type === QuestionType.SHORT_ANSWER) {
          isCorrect = String(candidateAnswer).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
        } else {
          isCorrect = candidateAnswer.length > 10;
        }

        if (isCorrect) {
          correctCount++;
          score += 10;
        } else {
          incorrectCount++;
          if (exam.negativeMarkingValue > 0) {
            negativeMarksApplied += exam.negativeMarkingValue * 10;
          }
        }
      }
    });

    const finalScore = Math.max(0, score - negativeMarksApplied);

    // Get peer attempts
    const peerAttempts = await db.select().from(schema.examAttempts)
      .where(and(eq(schema.examAttempts.examId, exam.id), eq(schema.examAttempts.status, "submitted")));
    const otherScores = peerAttempts.filter(a => a.id !== attemptId).map(p => p.score || 0);
    const allScores = [...otherScores, finalScore].sort((a, b) => b - a);
    const rank = allScores.indexOf(finalScore) + 1;
    const andBelow = allScores.filter(s => s <= finalScore).length;
    const percentile = Math.round((andBelow / allScores.length) * 100);

    const submittedAt = new Date().toISOString();
    const timeSpentSeconds = Math.round((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);

    await db.update(schema.examAttempts)
      .set({
        status: "submitted",
        submittedAt,
        score: finalScore,
        correctCount,
        incorrectCount,
        skippedCount,
        negativeMarksApplied,
        timeSpentSeconds,
        rank,
        percentile
      })
      .where(eq(schema.examAttempts.id, attemptId));

    if (finalScore >= exam.passingScore) {
      const certId = `cert-${Date.now()}`;
      const certNumber = `NMTS-${exam.id.toUpperCase().replace("EXAM-", "")}-${Math.floor(Math.random() * 89999 + 10000)}`;
      const user = (await db.select().from(schema.users).where(eq(schema.users.id, attempt.userId)).limit(1))[0];

      await db.insert(schema.certificates).values({
        id: certId,
        attemptId: attempt.id,
        userId: attempt.userId,
        candidateName: user ? user.name : "Ali Ahmed Khan",
        cnic: user?.cnic || null,
        examId: exam.id,
        examTitle: exam.title,
        score: finalScore,
        totalMarks: questions.length * 10,
        percentile: percentile,
        certificateNumber: certNumber,
        issuedAt: new Date().toISOString(),
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://nmts.gov.pk/verify/${certNumber}`
      });

      await db.insert(schema.notifications).values({
        id: `notif-${Date.now()}`,
        userId: attempt.userId,
        title: "Exam Certificate Conferred!",
        message: `Congratulations! You passed the ${exam.title} and earned certificate ${certNumber}.`,
        type: "success",
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    await logAudit(attempt.userId, "Submitted Exam", `Completed mock testing session for ${exam.title}. Score: ${finalScore}/${questions.length * 10}`, req);

    const finalAttempt = (await db.select().from(schema.examAttempts).where(eq(schema.examAttempts.id, attemptId)).limit(1))[0];
    res.json(finalAttempt);
  } catch (error) {
    console.error("Submit exam error:", error);
    res.status(500).json({ error: "Failed to submit exam attempt." });
  }
});

// Get Candidate Attempt Result score analysis
app.get("/api/attempts/:attemptId/result", async (req: Request, res: Response) => {
  const { attemptId } = req.params;

  try {
    const attempt = (await db.select().from(schema.examAttempts).where(eq(schema.examAttempts.id, attemptId)).limit(1))[0];
    if (!attempt) {
      return res.status(404).json({ error: "Scorecard record not found." });
    }

    const exam = (await db.select().from(schema.exams).where(eq(schema.exams.id, attempt.examId)).limit(1))[0];
    const cert = (await db.select().from(schema.certificates).where(eq(schema.certificates.attemptId, attemptId)).limit(1))[0] || null;
    const questions = await db.select().from(schema.questions).where(eq(schema.questions.examId, attempt.examId));

    res.json({
      attempt,
      exam,
      certificate: cert,
      questions
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch result details." });
  }
});

// Profile stats
app.get("/api/profile/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const user = (await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1))[0];
    if (!user) {
      return res.status(404).json({ error: "User profile missing." });
    }

    const attempts = await db.select().from(schema.examAttempts).where(eq(schema.examAttempts.userId, userId));
    const certificates = await db.select().from(schema.certificates).where(eq(schema.certificates.userId, userId));
    const notifications = await db.select().from(schema.notifications).where(eq(schema.notifications.userId, userId));

    res.json({
      user,
      attempts,
      certificates,
      notifications
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile stats." });
  }
});

// Online Certificate Verification
app.get("/api/certificates/verify/:certNo", async (req: Request, res: Response) => {
  const { certNo } = req.params;

  try {
    const cert = (await db.select().from(schema.certificates).where(eq(schema.certificates.certificateNumber, certNo)).limit(1))[0];
    if (!cert) {
      return res.status(404).json({ error: "Certificate verification failed. Record not authentic." });
    }

    const user = (await db.select().from(schema.users).where(eq(schema.users.id, cert.userId)).limit(1))[0];
    res.json({
      verified: true,
      certificate: cert,
      user
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to verify certificate." });
  }
});

// ==========================================
// ADMIN DASHBOARD & ANALYTICS APIs
// ==========================================

app.get("/api/admin/analytics", async (req: Request, res: Response) => {
  try {
    const totalUsers = (await db.select().from(schema.users)).length;
    const totalExams = (await db.select().from(schema.exams)).length;
    const examAttempts = await db.select().from(schema.examAttempts);
    const completedAttempts = examAttempts.filter(a => a.status === "submitted");
    const totalAttemptsCount = examAttempts.length;

    let averageScore = 0;
    let passCount = 0;
    if (completedAttempts.length > 0) {
      const sum = completedAttempts.reduce((acc, curr) => acc + (curr.score || 0), 0);
      averageScore = parseFloat((sum / completedAttempts.length).toFixed(1));

      const examsList = await db.select().from(schema.exams);
      completedAttempts.forEach(a => {
        const exam = examsList.find(e => e.id === a.examId);
        if (exam && (a.score || 0) >= exam.passingScore) {
          passCount++;
        }
      });
    }

    const passRate = completedAttempts.length > 0 
      ? parseFloat(((passCount / completedAttempts.length) * 100).toFixed(1)) 
      : 0;

    const allQuestions = await db.select().from(schema.questions);
    const difficultyCounts = allQuestions.reduce((acc: Record<string, number>, q) => {
      acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
      return acc;
    }, {});

    const recentLogs = await db.select().from(schema.auditLogs).orderBy(desc(schema.auditLogs.timestamp)).limit(8);
    const systemSettings = (await db.select().from(schema.settings).where(eq(schema.settings.id, "system_config")).limit(1))[0] || defaultSettings;

    res.json({
      totalUsers,
      totalExams,
      totalAttemptsCount,
      completedAttemptsCount: completedAttempts.length,
      averageScore,
      passRate,
      difficultyCounts,
      recentLogs,
      settings: systemSettings
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: "Failed to load analytics." });
  }
});

app.get("/api/admin/logs", async (req: Request, res: Response) => {
  try {
    const logs = await db.select().from(schema.auditLogs).orderBy(desc(schema.auditLogs.timestamp));
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch logs." });
  }
});

app.get("/api/settings", async (req: Request, res: Response) => {
  try {
    const config = (await db.select().from(schema.settings).where(eq(schema.settings.id, "system_config")).limit(1))[0];
    res.json(config || defaultSettings);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch settings." });
  }
});

app.post("/api/admin/settings", async (req: Request, res: Response) => {
  try {
    await db.insert(schema.settings)
      .values({
        id: "system_config",
        siteName: req.body.siteName,
        maintenanceMode: !!req.body.maintenanceMode,
        allowSelfRegistration: !!req.body.allowSelfRegistration,
        antiCheatingStrictness: req.body.antiCheatingStrictness,
        autoSubmitOnViolations: !!req.body.autoSubmitOnViolations,
        maxViolationsAllowed: req.body.maxViolationsAllowed,
        allowAIGeneration: !!req.body.allowAIGeneration,
        contactEmail: req.body.contactEmail || null,
        contactPhone: req.body.contactPhone || null,
        contactAddress: req.body.contactAddress || null,
        footerText: req.body.footerText || null,
        orgName: req.body.orgName || null,
        facebookUrl: req.body.facebookUrl || null,
        twitterUrl: req.body.twitterUrl || null,
        linkedinUrl: req.body.linkedinUrl || null,
        youtubeUrl: req.body.youtubeUrl || null,
        heroTitle: req.body.heroTitle || null,
        heroSubtitle: req.body.heroSubtitle || null,
        seoDescription: req.body.seoDescription || null,
        seoKeywords: req.body.seoKeywords || null,
        statExamsCount: req.body.statExamsCount || null,
        statAspirantsCount: req.body.statAspirantsCount || null,
        statCitiesCount: req.body.statCitiesCount || null,
        statCentersCount: req.body.statCentersCount || null,
      })
      .onConflictDoUpdate({
        target: schema.settings.id,
        set: {
          siteName: req.body.siteName,
          maintenanceMode: !!req.body.maintenanceMode,
          allowSelfRegistration: !!req.body.allowSelfRegistration,
          antiCheatingStrictness: req.body.antiCheatingStrictness,
          autoSubmitOnViolations: !!req.body.autoSubmitOnViolations,
          maxViolationsAllowed: req.body.maxViolationsAllowed,
          allowAIGeneration: !!req.body.allowAIGeneration,
          contactEmail: req.body.contactEmail || null,
          contactPhone: req.body.contactPhone || null,
          contactAddress: req.body.contactAddress || null,
          footerText: req.body.footerText || null,
          orgName: req.body.orgName || null,
          facebookUrl: req.body.facebookUrl || null,
          twitterUrl: req.body.twitterUrl || null,
          linkedinUrl: req.body.linkedinUrl || null,
          youtubeUrl: req.body.youtubeUrl || null,
          heroTitle: req.body.heroTitle || null,
          heroSubtitle: req.body.heroSubtitle || null,
          seoDescription: req.body.seoDescription || null,
          seoKeywords: req.body.seoKeywords || null,
          statExamsCount: req.body.statExamsCount || null,
          statAspirantsCount: req.body.statAspirantsCount || null,
          statCitiesCount: req.body.statCitiesCount || null,
          statCentersCount: req.body.statCentersCount || null,
        }
      });

    const finalSettings = (await db.select().from(schema.settings).where(eq(schema.settings.id, "system_config")).limit(1))[0];
    res.json(finalSettings);
  } catch (error) {
    res.status(500).json({ error: "Failed to save settings." });
  }
});

// Admin creates a notice/announcement
app.post("/api/admin/notices/create", async (req: Request, res: Response) => {
  const { title, content, category, isPinned } = req.body;
  const newNotice = {
    id: `notice-${Date.now()}`,
    title,
    content,
    category: category || "General",
    publishedAt: new Date().toISOString(),
    isPinned: !!isPinned
  };

  try {
    await db.insert(schema.notices).values(newNotice);
    await logAudit("admin-1", "Created Notice", `Published announcement: ${title}`, req);
    res.json({ success: true, notice: newNotice });
  } catch (error) {
    res.status(500).json({ error: "Failed to create notice." });
  }
});

// Admin deletes a notice/announcement
app.delete("/api/admin/notices/:id", async (req: Request, res: Response) => {
  const noticeId = req.params.id;

  try {
    const existing = (await db.select().from(schema.notices).where(eq(schema.notices.id, noticeId)).limit(1))[0];
    if (existing) {
      await db.delete(schema.notices).where(eq(schema.notices.id, noticeId));
      await logAudit("admin-1", "Deleted Notice", `Removed notice: ${noticeId}`, req);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Notice not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to delete notice." });
  }
});

// Admin creates a download
app.post("/api/admin/downloads/create", async (req: Request, res: Response) => {
  const { title, description, fileSize, fileType, category } = req.body;
  const newDownload = {
    id: `download-${Date.now()}`,
    title,
    description,
    fileSize: fileSize || "1.0 MB",
    fileType: fileType || "pdf",
    category: category || "Syllabus",
    publishedAt: new Date().toISOString()
  };

  try {
    await db.insert(schema.downloads).values(newDownload);
    await logAudit("admin-1", "Created Download", `Published resource: ${title}`, req);
    res.json({ success: true, download: newDownload });
  } catch (error) {
    res.status(500).json({ error: "Failed to create download." });
  }
});

// Admin deletes a download
app.delete("/api/admin/downloads/:id", async (req: Request, res: Response) => {
  const downloadId = req.params.id;

  try {
    const existing = (await db.select().from(schema.downloads).where(eq(schema.downloads.id, downloadId)).limit(1))[0];
    if (existing) {
      await db.delete(schema.downloads).where(eq(schema.downloads.id, downloadId));
      await logAudit("admin-1", "Deleted Download", `Removed download: ${downloadId}`, req);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Download not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to delete download." });
  }
});

// Admin manually creates an exam
app.post("/api/admin/exams/create", async (req: Request, res: Response) => {
  const { title, description, category, duration, passingScore, negativeMarkingValue, difficulty, questions } = req.body;

  try {
    const examId = `exam-${Date.now()}`;
    const newExam = {
      id: examId,
      title,
      description,
      category: category || ExamCategory.APTITUDE_TEST,
      duration: parseInt(duration) || 30,
      totalQuestions: Array.isArray(questions) ? questions.length : 0,
      totalMarks: Array.isArray(questions) ? questions.length * 10 : 0,
      passingScore: parseInt(passingScore) || 50,
      negativeMarkingValue: parseFloat(negativeMarkingValue) || 0,
      status: "published",
      subjects: ["General Assessment"],
      difficulty: difficulty || "Medium"
    };

    await db.insert(schema.exams).values(newExam);

    if (Array.isArray(questions)) {
      for (let idx = 0; idx < questions.length; idx++) {
        const q = questions[idx];
        const newQuestion = {
          id: `q-${examId}-${idx}`,
          examId: examId,
          type: q.type || QuestionType.SINGLE_CORRECT,
          text: q.text,
          options: q.options || [],
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || "No explanation provided.",
          subject: q.subject || "General",
          topic: q.topic || "Topic",
          difficulty: q.difficulty || "Medium",
          estimatedSolveTime: 30
        };
        await db.insert(schema.questions).values(newQuestion);
      }
    }

    await logAudit("admin-1", "Created Exam", `Manually published a mock test titled: ${title}`, req);
    res.json({ success: true, exam: newExam });
  } catch (error) {
    console.error("Create exam error:", error);
    res.status(500).json({ error: "Failed to create exam." });
  }
});

// ==========================================
// AI-POWERED MOCK TEST AND PDF GENERATORS (GEMINI SDK)
// ==========================================

// Server-side AI questions generator
app.post("/api/admin/questions/ai-generate", async (req: Request, res: Response) => {
  const { topic, category, count, difficulty } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured in environment." });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const prompt = `Generate ${count || 5} premium exam questions with answers on the topic of "${topic || "Pakistan Affairs"}".
The difficulty level is "${difficulty || "Medium"}". Categorized as "${category || "Government Job"}".

Generate a JSON array of questions, adhering exactly to the following properties:
- text: String (the exam question)
- type: String (MUST be "single_correct")
- options: Array of 4 strings
- correctAnswer: String (MUST be the 0-indexed index of options, e.g., "0", "1", "2", "3")
- explanation: String (brief high-quality textbook style explanation)
- subject: String (e.g., General Knowledge)
- topic: String
- difficulty: String (Easy, Medium, or Hard)

Return ONLY valid pure JSON array output, with no markdown styling wrappers or backticks.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              type: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctAnswer: { type: Type.STRING },
              explanation: { type: Type.STRING },
              subject: { type: Type.STRING },
              topic: { type: Type.STRING },
              difficulty: { type: Type.STRING }
            },
            required: ["text", "type", "options", "correctAnswer", "explanation", "subject", "topic", "difficulty"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response content from Gemini.");
    }

    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const questionsList = JSON.parse(cleanedText);

    res.json({ questions: questionsList });
  } catch (err: any) {
    console.error("Gemini AI question generation error:", err);
    res.status(500).json({ error: `AI Generation failed: ${err.message}` });
  }
});

// Smart PDF Parser simulating scanning & AI MCQ structure validation
app.post("/api/admin/smart-pdf-import", async (req: Request, res: Response) => {
  const { pdfTextContent, examTitle } = req.body;

  if (!pdfTextContent) {
    return res.status(400).json({ error: "No PDF text content received." });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured in environment." });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const prompt = `Analyze and extract exam-level MCQs from this uploaded document text:
"${pdfTextContent}"

Your goal is to parse, fix any typos, and structure the data into high-quality MCQ objects.
For each extracted question, determine:
1. text: The question statement.
2. options: An array of 4 multiple-choice answers.
3. correctAnswer: The correct option index (e.g., "0", "1", "2" or "3"). If correct answer is not explicitly mentioned, logically deduce it and explain.
4. explanation: The logical justification.
5. subject: Auto-detect the educational field (e.g. Physics, Chemistry, Public Policy).
6. topic: Auto-detect chapter/topic (e.g. Thermodynamics, Constitutional History).
7. difficulty: Auto-classify (Easy, Medium, or Hard).
8. estimatedSolveTime: integer seconds.

Return ONLY a valid JSON array matching this schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctAnswer: { type: Type.STRING },
              explanation: { type: Type.STRING },
              subject: { type: Type.STRING },
              topic: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              estimatedSolveTime: { type: Type.INTEGER }
            },
            required: ["text", "options", "correctAnswer", "explanation", "subject", "topic", "difficulty", "estimatedSolveTime"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response content from Gemini PDF Parser.");
    }

    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const extractedMcqs = JSON.parse(cleanedText);

    res.json({
      success: true,
      questions: extractedMcqs,
      metadata: {
        detectedFileFormat: "Text PDF Document",
        ocrPerformed: false,
        totalQuestionsParsed: extractedMcqs.length,
        autoExamTitle: examTitle || "Extracted PDF Exam"
      }
    });
  } catch (err: any) {
    console.error("Gemini AI PDF parse error:", err);
    res.status(500).json({ error: `AI Smart Import failed: ${err.message}` });
  }
});



// ==========================================
// BOOTSTRAP EXTRAS & VITE MIDDLEWARE SETUP
// ==========================================

// Vite and static build routes
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware mounted in Development mode.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production assets from /dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`National Mock Testing Service running successfully on http://0.0.0.0:${PORT}`);
  });
}

startServer();
