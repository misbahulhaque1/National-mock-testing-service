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

dotenv.config();

const app = express();
app.use(express.json({ limit: "20mb" }));

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "nmts_db.json");

// Define Storage Interface
interface LocalDatabase {
  users: User[];
  exams: Exam[];
  questions: Question[];
  examAttempts: ExamAttempt[];
  certificates: Certificate[];
  notices: Notice[];
  downloads: DownloadItem[];
  auditLogs: AuditLog[];
  notifications: SystemNotification[];
  settings: SystemSettings;
}

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

// Initial Premium Seed Data for NMTS
const initialSeedData = (): LocalDatabase => {
  const users: User[] = [
    {
      id: "admin-1",
      name: "Portal Administrator",
      email: "admin@nmts-portal.org",
      role: UserRole.SUPER_ADMIN,
      cnic: "37405-1234567-1",
      registrationDate: "2026-01-01T09:00:00Z"
    },
    {
      id: "candidate-1",
      name: "Ali Ahmed Khan",
      email: "candidate@nmts-portal.org",
      role: UserRole.CANDIDATE,
      cnic: "35201-9876543-1",
      registrationDate: "2026-06-15T10:30:00Z"
    }
  ];

  const exams: Exam[] = [
    {
      id: "exam-css-2026",
      title: "CSS CSS-MPT (Preliminary Test) Mock Examination",
      description: "Official pattern-based screening test for Central Superior Services (CSS) recruitment. Includes General Knowledge, English grammar, Pakistan Affairs, and Mental Ability.",
      category: ExamCategory.PUBLIC_SERVICE,
      duration: 30, // minutes (for demonstration)
      totalQuestions: 10,
      totalMarks: 100,
      passingScore: 50,
      negativeMarkingValue: 0.25,
      status: "published",
      difficulty: "Hard",
      subjects: ["English Language", "General Knowledge", "Pakistan Affairs", "Aptitude"],
      scheduledAt: "2026-07-10T10:00:00Z"
    },
    {
      id: "exam-mdcat-2026",
      title: "MDCAT Biology & Chemistry Mock Simulator",
      description: "University Entry Test mock series for admissions to Medical & Dental Colleges. Strictly adheres to PMDC curriculum standards.",
      category: ExamCategory.UNIVERSITY_ENTRY,
      duration: 25,
      totalQuestions: 8,
      totalMarks: 80,
      passingScore: 45,
      negativeMarkingValue: 0,
      status: "published",
      difficulty: "Medium",
      subjects: ["Biology", "Chemistry"],
      scheduledAt: "2026-07-12T14:00:00Z"
    },
    {
      id: "exam-govt-assistant",
      title: "Federal Secretariat Assistant Recruitment Mock Exam",
      description: "General recruitment test layout containing Basic Computer Literacy, Office Procedures, and Arithmetic Skills.",
      category: ExamCategory.GOVERNMENT_JOB,
      duration: 20,
      totalQuestions: 6,
      totalMarks: 60,
      passingScore: 30,
      negativeMarkingValue: 0.25,
      status: "published",
      difficulty: "Medium",
      subjects: ["IT Fundamentals", "English Literature", "Arithmetic"],
      scheduledAt: "2026-07-20T11:00:00Z"
    },
    ntsExam
  ];

  const questions: Question[] = [
    // CSS-MPT questions
    {
      id: "q-css-1",
      examId: "exam-css-2026",
      type: QuestionType.SINGLE_CORRECT,
      text: "Who was the first Prime Minister of Pakistan?",
      options: ["Liaquat Ali Khan", "Muhammad Ali Jinnah", "Khawaja Nazimuddin", "Chaudhry Muhammad Ali"],
      correctAnswer: "0", // 0-indexed index of options
      explanation: "Liaquat Ali Khan was appointed as the first Prime Minister of Pakistan on August 15, 1947.",
      subject: "Pakistan Affairs",
      topic: "Post-Independence History",
      difficulty: "Medium",
      estimatedSolveTime: 30
    },
    {
      id: "q-css-2",
      examId: "exam-css-2026",
      type: QuestionType.SINGLE_CORRECT,
      text: "Identify the antonym of the word: 'METICULOUS'.",
      options: ["Careful", "Careless", "Methodical", "Painstaking"],
      correctAnswer: "1",
      explanation: "'Meticulous' means showing great attention to detail; very careful and precise. The opposite is 'Careless'.",
      subject: "English Language",
      topic: "Antonyms & Synonyms",
      difficulty: "Medium",
      estimatedSolveTime: 25
    },
    {
      id: "q-css-3",
      examId: "exam-css-2026",
      type: QuestionType.SINGLE_CORRECT,
      text: "The largest lake in Pakistan is:",
      options: ["Keenjhar Lake", "Manchar Lake", "Saif-ul-Muluk", "Hanna Lake"],
      correctAnswer: "1",
      explanation: "Manchar Lake is the largest natural freshwater lake in Pakistan and one of the largest in South Asia, located in Jamshoro District, Sindh.",
      subject: "General Knowledge",
      topic: "Geography",
      difficulty: "Easy",
      estimatedSolveTime: 20
    },
    {
      id: "q-css-4",
      examId: "exam-css-2026",
      type: QuestionType.SINGLE_CORRECT,
      text: "If 5 workers can build a wall in 12 days, how many days will it take 10 workers to build the same wall?",
      options: ["24 days", "6 days", "8 days", "15 days"],
      correctAnswer: "1",
      explanation: "Using inverse proportion: Workers × Days = Constant. 5 × 12 = 60. Therefore, 10 × Days = 60 => Days = 6.",
      subject: "Aptitude",
      topic: "Work and Time",
      difficulty: "Medium",
      estimatedSolveTime: 45
    },
    {
      id: "q-css-5",
      examId: "exam-css-2026",
      type: QuestionType.TRUE_FALSE,
      text: "The state of Pakistan was established based on the 'Two-Nation Theory'.",
      options: ["True", "False"],
      correctAnswer: "0",
      explanation: "The ideological foundation of Pakistan is the Two-Nation Theory, which asserts that Muslims and Hindus are two distinct nations.",
      subject: "Pakistan Affairs",
      topic: "Ideology",
      difficulty: "Easy",
      estimatedSolveTime: 15
    },
    {
      id: "q-css-6",
      examId: "exam-css-2026",
      type: QuestionType.FILL_BLANK,
      text: "Pakistan's highest peak is K2, which stands at an elevation of _______ meters.",
      correctAnswer: "8611",
      explanation: "K2 is the second-highest mountain in the world, standing at 8,611 meters (28,251 feet) above sea level.",
      subject: "General Knowledge",
      topic: "Geography",
      difficulty: "Medium",
      estimatedSolveTime: 30
    },
    {
      id: "q-css-7",
      examId: "exam-css-2026",
      type: QuestionType.SHORT_ANSWER,
      text: "Name the highest civil award of Pakistan.",
      correctAnswer: "Nishan-e-Pakistan",
      explanation: "Nishan-e-Pakistan is the highest civilian award conferred by the Government of Pakistan.",
      subject: "General Knowledge",
      topic: "National Honors",
      difficulty: "Easy",
      estimatedSolveTime: 20
    },
    {
      id: "q-css-8",
      examId: "exam-css-2026",
      type: QuestionType.MULTIPLE_CORRECT,
      text: "Which of the following rivers flow through Pakistan? (Select ALL correct answers)",
      options: ["Indus River", "Ganges River", "Jhelum River", "Chenab River"],
      correctAnswer: JSON.stringify(["0", "2", "3"]),
      explanation: "Indus, Jhelum, and Chenab flow extensively through Pakistan, while the Ganges flows through India and Bangladesh.",
      subject: "General Knowledge",
      topic: "Geography",
      difficulty: "Medium",
      estimatedSolveTime: 40
    },
    {
      id: "q-css-9",
      examId: "exam-css-2026",
      type: QuestionType.ESSAY,
      text: "Discuss the socio-economic challenges of water scarcity in Pakistan and suggest three actionable remedies.",
      correctAnswer: "",
      explanation: "Grading is based on structured parameters like introduction of water issues, agricultural damage, storage options, and conservation techniques.",
      subject: "Pakistan Affairs",
      topic: "Current Challenges",
      difficulty: "Hard",
      estimatedSolveTime: 180
    },
    {
      id: "q-css-10",
      examId: "exam-css-2026",
      type: QuestionType.CODING,
      text: "Write a JavaScript function `isPrime(n)` that returns `true` if a number is prime, and `false` otherwise. Optimize for time complexity.",
      correctAnswer: "function isPrime(n) { if (n <= 1) return false; if (n <= 3) return true; if (n % 2 === 0 || n % 3 === 0) return false; for (let i = 5; i * i <= n; i += 6) { if (n % i === 0 || n % (i + 2) === 0) return false; } return true; }",
      explanation: "Standard optimized primality testing loops up to the square root of n, skipping multiples of 2 and 3.",
      subject: "Aptitude",
      topic: "Programming Skills",
      difficulty: "Hard",
      estimatedSolveTime: 150
    },

    // MDCAT questions
    {
      id: "q-md-1",
      examId: "exam-mdcat-2026",
      type: QuestionType.SINGLE_CORRECT,
      text: "Which cell organelle is known as the powerhouse of the cell?",
      options: ["Nucleus", "Mitochondria", "Ribosome", "Golgi Apparatus"],
      correctAnswer: "1",
      explanation: "Mitochondria are membrane-bound cell organelles that generate most of the chemical energy needed to power the cell's biochemical reactions.",
      subject: "Biology",
      topic: "Cell Structure",
      difficulty: "Easy",
      estimatedSolveTime: 20
    },
    {
      id: "q-md-2",
      examId: "exam-mdcat-2026",
      type: QuestionType.SINGLE_CORRECT,
      text: "What is the pH of a neutral aqueous solution at 25°C?",
      options: ["5.0", "7.0", "9.0", "14.0"],
      correctAnswer: "1",
      explanation: "At 25°C, pure water has a neutral pH value of exactly 7.0.",
      subject: "Chemistry",
      topic: "Acids and Bases",
      difficulty: "Easy",
      estimatedSolveTime: 15
    },
    {
      id: "q-md-3",
      examId: "exam-mdcat-2026",
      type: QuestionType.SINGLE_CORRECT,
      text: "The main structural component of plant cell walls is:",
      options: ["Chitin", "Glycogen", "Cellulose", "Peptidoglycan"],
      correctAnswer: "2",
      explanation: "Cellulose is an insoluble polysaccharide consisting of a linear chain of glucose units, forming the chief structural component of green plant cell walls.",
      subject: "Biology",
      topic: "Cell Wall",
      difficulty: "Medium",
      estimatedSolveTime: 20
    },
    {
      id: "q-md-4",
      examId: "exam-mdcat-2026",
      type: QuestionType.TRUE_FALSE,
      text: "Enzymes speed up chemical reactions by lowering the activation energy barrier.",
      options: ["True", "False"],
      correctAnswer: "0",
      explanation: "By binding substrates, enzymes stabilize the transition state and lower the energy required to activate the reaction.",
      subject: "Biology",
      topic: "Enzymology",
      difficulty: "Easy",
      estimatedSolveTime: 15
    },
    ...ntsQuestions
  ];

  const notices: Notice[] = [];

  const downloads: DownloadItem[] = [];

  const auditLogs: AuditLog[] = [
    {
      id: "log-1",
      userId: "admin-1",
      userName: "Super Admin",
      userRole: UserRole.SUPER_ADMIN,
      action: "System Initialized",
      timestamp: "2026-07-04T08:00:00Z",
      ipAddress: "127.0.0.1",
      browser: "Chrome 144.0",
      device: "Desktop / Linux",
      details: "Seed database generated with official Federal mockup models."
    }
  ];

  return {
    users,
    exams,
    questions,
    examAttempts: [],
    certificates: [],
    notices,
    downloads,
    auditLogs,
    notifications: [],
    settings: defaultSettings
  };
};

// Database Access Methods
const readDb = (): LocalDatabase => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const data = initialSeedData();
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
      return data;
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const data = JSON.parse(raw);
    
    // Auto-migrate: check if nts-joa exam is present in the database file
    if (data && data.exams && !data.exams.some((e: any) => e.id === "exam-nts-joa")) {
      data.exams.push(ntsExam);
      if (!data.questions) {
        data.questions = [];
      }
      data.questions.push(...ntsQuestions);
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    }
    
    return data;
  } catch (err) {
    console.error("Error reading db file, falling back to seed", err);
    return initialSeedData();
  }
};

const writeDb = (data: LocalDatabase) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Failed to write to database file", err);
  }
};

// Initialize DB on Startup
readDb();

// Helper to log audit actions
const logAudit = (userId: string, action: string, details: string, req: Request) => {
  const db = readDb();
  const user = db.users.find(u => u.id === userId);
  const newLog: AuditLog = {
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
  };
  db.auditLogs.unshift(newLog);
  writeDb(db);
};

// ==========================================
// REST APIs
// ==========================================

// Auth Endpoint: Login
app.post("/api/auth/login", (req: Request, res: Response) => {
  const { email, password, requestedRole } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  const db = readDb();
  // Find user by email
  let user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  // Support OTP simulation: if user doesn't exist, allow self-registration or login
  if (!user) {
    if (db.settings.allowSelfRegistration) {
      const newRole = requestedRole === "ADMIN" ? UserRole.ADMIN : UserRole.CANDIDATE;
      user = {
        id: `user-${Date.now()}`,
        name: email.split("@")[0].toUpperCase().replace(".", " "),
        email: email.toLowerCase(),
        role: newRole,
        cnic: `35201-${Math.floor(Math.random() * 10000000)}-1`,
        registrationDate: new Date().toISOString()
      };
      db.users.push(user);
      writeDb(db);
    } else {
      return res.status(403).json({ error: "Registration is restricted by policy." });
    }
  }

  // Record Last Login Info
  user.lastLogin = new Date().toISOString();
  user.ipAddress = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";
  user.browser = req.headers["user-agent"] || "Generic Agent";
  user.device = "Web Application Client";
  writeDb(db);

  logAudit(user.id, "User Login", `Authenticated via OTP session key. Role: ${user.role}`, req);

  res.json({ success: true, user });
});

// Notice Board search & fetch
app.get("/api/notices", (req: Request, res: Response) => {
  const { search, category } = req.query;
  const db = readDb();
  let list = db.notices;

  if (category && category !== "All") {
    list = list.filter(n => n.category.toLowerCase() === String(category).toLowerCase());
  }
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
  }

  res.json(list);
});

// Downloads Center search & fetch
app.get("/api/downloads", (req: Request, res: Response) => {
  const { search, category } = req.query;
  const db = readDb();
  let list = db.downloads;

  if (category && category !== "All") {
    list = list.filter(d => d.category.toLowerCase() === String(category).toLowerCase());
  }
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(d => d.title.toLowerCase().includes(q) || d.description.toLowerCase().includes(q));
  }

  res.json(list);
});

// Public Stats for Landing Page Ribbon
app.get("/api/public-stats", (req: Request, res: Response) => {
  const db = readDb();
  res.json({
    totalUsers: db.users.length,
    totalExams: db.exams.length,
    totalCertificates: db.certificates.length,
    uptime: "100%"
  });
});

// Browse exams
app.get("/api/exams", (req: Request, res: Response) => {
  const { search, category } = req.query;
  const db = readDb();
  let list = db.exams.filter(e => e.status === "published");

  if (category && category !== "All") {
    list = list.filter(e => e.category === category);
  }
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(e => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q));
  }

  res.json(list);
});

// Get Exam along with scrambled questions (Anti-Cheating layout)
app.get("/api/exams/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const { randomize } = req.query;
  const db = readDb();

  const exam = db.exams.find(e => e.id === id);
  if (!exam) {
    return res.status(404).json({ error: "Mock exam not found." });
  }

  let examQuestions = db.questions.filter(q => q.examId === id);

  // Question/Option Randomization for Integrity checks
  if (randomize === "true") {
    examQuestions = [...examQuestions].sort(() => Math.random() - 0.5);
    examQuestions = examQuestions.map(q => {
      if (q.options && q.type === QuestionType.SINGLE_CORRECT) {
        // Shuffle MCQ options while maintaining logic can be tricky if we don't map indices.
        // Let's preserve original indices by mapping options with tracking, or keeping original options
        // but scrambling them and mapping correctly. For simplicity, we preserve MCQ indices in database
        // but scramble for high stakes. To keep answers valid in our grading, let's keep MCQs ordered but
        // randomize questions index.
      }
      return q;
    });
  }

  res.json({ exam, questions: examQuestions });
});

// Create exam attempt
app.post("/api/exams/:id/start", (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "User ID required to initialize attempt." });
  }

  const db = readDb();
  const exam = db.exams.find(e => e.id === id);
  if (!exam) {
    return res.status(404).json({ error: "Exam not found." });
  }

  // Create standard Attempt record
  const attemptId = `attempt-${Date.now()}`;
  const newAttempt: ExamAttempt = {
    id: attemptId,
    userId,
    examId: id,
    startedAt: new Date().toISOString(),
    answers: {},
    markedForReview: {},
    status: "ongoing",
    warningCount: 0
  };

  db.examAttempts.push(newAttempt);
  writeDb(db);

  logAudit(userId, "Started Exam", `Began attempt ${attemptId} for exam: ${exam.title}`, req);

  res.json(newAttempt);
});

// Sync answers & warning log in real-time (Auto-Save, connection loss recovery)
app.post("/api/attempts/:attemptId/save", (req: Request, res: Response) => {
  const { attemptId } = req.params;
  const { answers, markedForReview, warningCount, userId } = req.body;

  const db = readDb();
  const attempt = db.examAttempts.find(a => a.id === attemptId);
  if (!attempt) {
    return res.status(404).json({ error: "Attempt session not found." });
  }

  if (attempt.status === "submitted") {
    return res.status(400).json({ error: "Cannot sync. Exam already submitted." });
  }

  // Update real-time state
  attempt.answers = answers || attempt.answers;
  attempt.markedForReview = markedForReview || attempt.markedForReview;
  attempt.warningCount = warningCount !== undefined ? warningCount : attempt.warningCount;

  writeDb(db);

  // Log strict violation warnings
  if (warningCount > attempt.warningCount) {
    logAudit(userId || attempt.userId, "Integrity Violation Warning", `Tab switch or blur event detected. Warning count updated to ${warningCount}.`, req);
  }

  res.json({ success: true, attempt });
});

// Submit Exam (Auto-submit on timer or violations, auto-grade scoring)
app.post("/api/attempts/:attemptId/submit", (req: Request, res: Response) => {
  const { attemptId } = req.params;
  const db = readDb();

  const attempt = db.examAttempts.find(a => a.id === attemptId);
  if (!attempt) {
    return res.status(404).json({ error: "Exam attempt session not found." });
  }

  if (attempt.status === "submitted") {
    return res.json(attempt); // Already computed
  }

  const exam = db.exams.find(e => e.id === attempt.examId);
  if (!exam) {
    return res.status(404).json({ error: "Related exam schema missing." });
  }

  const questions = db.questions.filter(q => q.examId === exam.id);

  // Scoring engine
  let score = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let skippedCount = 0;
  let negativeMarksApplied = 0;

  questions.forEach(q => {
    const candidateAnswer = attempt.answers[q.id];

    if (candidateAnswer === undefined || candidateAnswer === "") {
      skippedCount++;
    } else {
      let isCorrect = false;

      if (q.type === QuestionType.SINGLE_CORRECT || q.type === QuestionType.TRUE_FALSE) {
        isCorrect = String(candidateAnswer) === String(q.correctAnswer);
      } else if (q.type === QuestionType.MULTIPLE_CORRECT) {
        try {
          const correctSet: string[] = JSON.parse(q.correctAnswer as string);
          const candidateSet: string[] = JSON.parse(candidateAnswer);
          isCorrect = correctSet.length === candidateSet.length && correctSet.every(v => candidateSet.includes(v));
        } catch {
          isCorrect = String(candidateAnswer) === String(q.correctAnswer);
        }
      } else if (q.type === QuestionType.FILL_BLANK || q.type === QuestionType.SHORT_ANSWER) {
        isCorrect = String(candidateAnswer).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
      } else {
        // Essay/Coding default to AI scoring mockup or automatic match
        isCorrect = candidateAnswer.length > 10; // Simple length validation for essays/coding
      }

      if (isCorrect) {
        correctCount++;
        score += 10; // 10 marks per question
      } else {
        incorrectCount++;
        if (exam.negativeMarkingValue > 0) {
          negativeMarksApplied += exam.negativeMarkingValue * 10;
        }
      }
    }
  });

  const finalScore = Math.max(0, score - negativeMarksApplied);
  const percentage = (finalScore / (questions.length * 10)) * 100;

  attempt.status = "submitted";
  attempt.submittedAt = new Date().toISOString();
  attempt.score = finalScore;
  attempt.correctCount = correctCount;
  attempt.incorrectCount = incorrectCount;
  attempt.skippedCount = skippedCount;
  attempt.negativeMarksApplied = negativeMarksApplied;
  attempt.timeSpentSeconds = Math.round((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);

  // Generate Rank and Percentile compared to past candidates
  const peerAttempts = db.examAttempts.filter(a => a.examId === exam.id && a.status === "submitted" && a.id !== attemptId);
  const allScores = [...peerAttempts.map(p => p.score || 0), finalScore].sort((a, b) => b - a);
  const rank = allScores.indexOf(finalScore) + 1;
  const andBelow = allScores.filter(s => s <= finalScore).length;
  const percentile = Math.round((andBelow / allScores.length) * 100);

  attempt.rank = rank;
  attempt.percentile = percentile;

  // If candidate passed, automatically issue unique Verification Certificate
  if (finalScore >= exam.passingScore) {
    const certId = `cert-${Date.now()}`;
    const certNumber = `NMTS-${exam.id.toUpperCase().replace("EXAM-", "")}-${Math.floor(Math.random() * 89999 + 10000)}`;
    const user = db.users.find(u => u.id === attempt.userId);

    const newCert: Certificate = {
      id: certId,
      attemptId: attempt.id,
      userId: attempt.userId,
      candidateName: user ? user.name : "Ali Ahmed Khan",
      cnic: user?.cnic,
      examId: exam.id,
      examTitle: exam.title,
      score: finalScore,
      totalMarks: questions.length * 10,
      percentile: percentile,
      certificateNumber: certNumber,
      issuedAt: new Date().toISOString(),
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://nmts.gov.pk/verify/${certNumber}`
    };

    db.certificates.push(newCert);

    // In-app success alert
    db.notifications.push({
      id: `notif-${Date.now()}`,
      userId: attempt.userId,
      title: "Exam Certificate Conferred!",
      message: `Congratulations! You passed the ${exam.title} and earned certificate ${certNumber}.`,
      type: "success",
      read: false,
      createdAt: new Date().toISOString()
    });
  }

  writeDb(db);
  logAudit(attempt.userId, "Submitted Exam", `Completed mock testing session for ${exam.title}. Score: ${finalScore}/${questions.length * 10}`, req);

  res.json(attempt);
});

// Get Candidate Attempt Result score analysis
app.get("/api/attempts/:attemptId/result", (req: Request, res: Response) => {
  const { attemptId } = req.params;
  const db = readDb();

  const attempt = db.examAttempts.find(a => a.id === attemptId);
  if (!attempt) {
    return res.status(404).json({ error: "Scorecard record not found." });
  }

  const exam = db.exams.find(e => e.id === attempt.examId);
  const cert = db.certificates.find(c => c.attemptId === attemptId);
  const questions = db.questions.filter(q => q.examId === attempt.examId);

  res.json({
    attempt,
    exam,
    certificate: cert,
    questions
  });
});

// Profile stats
app.get("/api/profile/:userId", (req: Request, res: Response) => {
  const { userId } = req.params;
  const db = readDb();

  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "User profile missing." });
  }

  const attempts = db.examAttempts.filter(a => a.userId === userId);
  const certificates = db.certificates.filter(c => c.userId === userId);
  const notifications = db.notifications.filter(n => n.userId === userId);

  res.json({
    user,
    attempts,
    certificates,
    notifications
  });
});

// Online Certificate Verification
app.get("/api/certificates/verify/:certNo", (req: Request, res: Response) => {
  const { certNo } = req.params;
  const db = readDb();

  const cert = db.certificates.find(c => c.certificateNumber.toLowerCase() === certNo.toLowerCase());
  if (!cert) {
    return res.status(404).json({ error: "Certificate verification failed. Record not authentic." });
  }

  const user = db.users.find(u => u.id === cert.userId);
  res.json({
    verified: true,
    certificate: cert,
    user
  });
});

// ==========================================
// ADMIN DASHBOARD & ANALYTICS APIs
// ==========================================

app.get("/api/admin/analytics", (req: Request, res: Response) => {
  const db = readDb();

  const totalUsers = db.users.length;
  const totalExams = db.exams.length;
  const completedAttempts = db.examAttempts.filter(a => a.status === "submitted");
  const totalAttemptsCount = db.examAttempts.length;

  let averageScore = 0;
  let passCount = 0;
  if (completedAttempts.length > 0) {
    const sum = completedAttempts.reduce((acc, curr) => acc + (curr.score || 0), 0);
    averageScore = parseFloat((sum / completedAttempts.length).toFixed(1));

    completedAttempts.forEach(a => {
      const exam = db.exams.find(e => e.id === a.examId);
      if (exam && (a.score || 0) >= exam.passingScore) {
        passCount++;
      }
    });
  }

  const passRate = completedAttempts.length > 0 
    ? parseFloat(((passCount / completedAttempts.length) * 100).toFixed(1)) 
    : 0;

  // Map Category difficulty stats
  const difficultyCounts = db.questions.reduce((acc: Record<string, number>, q) => {
    acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
    return acc;
  }, {});

  res.json({
    totalUsers,
    totalExams,
    totalAttemptsCount,
    completedAttemptsCount: completedAttempts.length,
    averageScore,
    passRate,
    difficultyCounts,
    recentLogs: db.auditLogs.slice(0, 8),
    settings: db.settings
  });
});

app.get("/api/admin/logs", (req: Request, res: Response) => {
  const db = readDb();
  res.json(db.auditLogs);
});

app.get("/api/settings", (req: Request, res: Response) => {
  const db = readDb();
  res.json(db.settings || defaultSettings);
});

app.post("/api/admin/settings", (req: Request, res: Response) => {
  const db = readDb();
  db.settings = { ...db.settings, ...req.body };
  writeDb(db);
  res.json(db.settings);
});

// Admin creates a notice/announcement
app.post("/api/admin/notices/create", (req: Request, res: Response) => {
  const db = readDb();
  const { title, content, category, isPinned } = req.body;
  const newNotice: Notice = {
    id: `notice-${Date.now()}`,
    title,
    content,
    category: category || "General",
    publishedAt: new Date().toISOString(),
    isPinned: !!isPinned
  };
  if (!db.notices) db.notices = [];
  db.notices.unshift(newNotice);
  writeDb(db);
  logAudit("admin-1", "Created Notice", `Published announcement: ${title}`, req);
  res.json({ success: true, notice: newNotice });
});

// Admin deletes a notice/announcement
app.delete("/api/admin/notices/:id", (req: Request, res: Response) => {
  const db = readDb();
  const noticeId = req.params.id;
  if (!db.notices) db.notices = [];
  const initialCount = db.notices.length;
  db.notices = db.notices.filter(n => n.id !== noticeId);
  if (db.notices.length < initialCount) {
    writeDb(db);
    logAudit("admin-1", "Deleted Notice", `Removed notice: ${noticeId}`, req);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Notice not found" });
  }
});

// Admin creates a download
app.post("/api/admin/downloads/create", (req: Request, res: Response) => {
  const db = readDb();
  const { title, description, fileSize, fileType, category } = req.body;
  const newDownload: DownloadItem = {
    id: `download-${Date.now()}`,
    title,
    description,
    fileSize: fileSize || "1.0 MB",
    fileType: fileType || "pdf",
    category: category || "Syllabus",
    publishedAt: new Date().toISOString()
  };
  if (!db.downloads) db.downloads = [];
  db.downloads.unshift(newDownload);
  writeDb(db);
  logAudit("admin-1", "Created Download", `Published resource: ${title}`, req);
  res.json({ success: true, download: newDownload });
});

// Admin deletes a download
app.delete("/api/admin/downloads/:id", (req: Request, res: Response) => {
  const db = readDb();
  const downloadId = req.params.id;
  if (!db.downloads) db.downloads = [];
  const initialCount = db.downloads.length;
  db.downloads = db.downloads.filter(d => d.id !== downloadId);
  if (db.downloads.length < initialCount) {
    writeDb(db);
    logAudit("admin-1", "Deleted Download", `Removed download: ${downloadId}`, req);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Download not found" });
  }
});

// Admin manually creates an exam
app.post("/api/admin/exams/create", (req: Request, res: Response) => {
  const { title, description, category, duration, passingScore, negativeMarkingValue, difficulty, questions } = req.body;
  const db = readDb();

  const examId = `exam-${Date.now()}`;
  const newExam: Exam = {
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

  db.exams.push(newExam);

  if (Array.isArray(questions)) {
    questions.forEach((q, idx) => {
      const newQuestion: Question = {
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
      db.questions.push(newQuestion);
    });
  }

  writeDb(db);
  logAudit("admin-1", "Created Exam", `Manually published a mock test titled: ${title}`, req);

  res.json({ success: true, exam: newExam });
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
