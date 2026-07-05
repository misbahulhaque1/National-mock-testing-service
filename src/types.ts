/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  TEACHER = "TEACHER",
  CANDIDATE = "CANDIDATE"
}

export enum ExamCategory {
  GOVERNMENT_JOB = "Government Job",
  UNIVERSITY_ENTRY = "University Entry",
  PUBLIC_SERVICE = "Public Service Commission",
  SCHOLARSHIP = "Scholarship Exams",
  APTITUDE_TEST = "Aptitude Tests",
  PROFESSIONAL = "Professional Certification"
}

export enum QuestionType {
  SINGLE_CORRECT = "single_correct",
  MULTIPLE_CORRECT = "multiple_correct",
  TRUE_FALSE = "true_false",
  FILL_BLANK = "fill_blank",
  SHORT_ANSWER = "short_answer",
  ESSAY = "essay",
  CODING = "coding"
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  cnic?: string; // National ID number for official feel
  registrationDate: string;
  lastLogin?: string;
  ipAddress?: string;
  browser?: string;
  device?: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  category: ExamCategory;
  duration: number; // in minutes
  totalQuestions: number;
  totalMarks: number;
  passingScore: number;
  negativeMarkingValue: number; // e.g., 0.25 per wrong answer
  status: "draft" | "published" | "scheduled";
  scheduledAt?: string;
  subjects: string[];
  difficulty: "Easy" | "Medium" | "Hard";
}

export interface Question {
  id: string;
  examId: string;
  type: QuestionType;
  text: string;
  options?: string[]; // MCQs
  correctAnswer: string | string[]; // Single or multiple options, or exact matches
  explanation?: string;
  subject: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  estimatedSolveTime?: number; // seconds
}

export interface ExamAttempt {
  id: string;
  userId: string;
  examId: string;
  startedAt: string;
  submittedAt?: string;
  answers: Record<string, string>; // Maps questionId -> answerText/optionIndex
  markedForReview: Record<string, boolean>;
  status: "ongoing" | "submitted";
  score?: number;
  correctCount?: number;
  incorrectCount?: number;
  skippedCount?: number;
  negativeMarksApplied?: number;
  warningCount: number; // For anti-cheating browser focus loss/tab switch
  percentile?: number;
  rank?: number;
  timeSpentSeconds?: number;
}

export interface Certificate {
  id: string;
  attemptId: string;
  userId: string;
  candidateName: string;
  cnic?: string;
  examId: string;
  examTitle: string;
  score: number;
  totalMarks: number;
  percentile: number;
  certificateNumber: string;
  issuedAt: string;
  qrCodeUrl: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  category: "Recruitment" | "Results" | "Schedules" | "General";
  publishedAt: string;
  attachmentUrl?: string;
  isPinned: boolean;
}

export interface DownloadItem {
  id: string;
  title: string;
  description: string;
  fileSize: string;
  fileType: "pdf" | "zip" | "doc";
  category: "Syllabus" | "Past Paper" | "Sample Paper" | "Admit Card";
  publishedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  timestamp: string;
  ipAddress: string;
  browser: string;
  device: string;
  details: string;
}

export interface SystemNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning";
  read: boolean;
  createdAt: string;
}

export interface SystemSettings {
  siteName: string;
  maintenanceMode: boolean;
  allowSelfRegistration: boolean;
  antiCheatingStrictness: "low" | "medium" | "high";
  autoSubmitOnViolations: boolean;
  maxViolationsAllowed: number;
  allowAIGeneration: boolean;

  // CMS configuration fields
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  footerText?: string;
  orgName?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  youtubeUrl?: string;

  heroTitle?: string;
  heroSubtitle?: string;
  seoDescription?: string;
  seoKeywords?: string;

  // Stats override fields
  statExamsCount?: number;
  statAspirantsCount?: number;
  statCitiesCount?: number;
  statCentersCount?: number;
}
