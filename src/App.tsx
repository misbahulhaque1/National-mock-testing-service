/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, Exam, ExamAttempt, SystemNotification, ExamCategory, UserRole, Notice, SystemSettings 
} from "./types";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AuthPage from "./components/AuthPage";
import NoticeBoard from "./components/NoticeBoard";
import ProfilePage from "./components/ProfilePage";
import ExamEngine from "./components/ExamEngine";
import ResultsPage from "./components/ResultsPage";
import AdminPanel from "./components/AdminPanel";
import InstructionPage from "./components/InstructionPage";

import { 
  Landmark, ShieldCheck, ArrowRight, Award, Search, 
  BookOpen, ChevronRight, HelpCircle, PhoneCall, Info, Sparkles 
} from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("nmts_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [exams, setExams] = useState<Exam[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  // Testing states
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<any[]>([]);
  const [activeAttempt, setActiveAttempt] = useState<ExamAttempt | null>(null);
  const [viewingResultAttemptId, setViewingResultAttemptId] = useState<string | null>(null);
  const [selectedExamForInstructions, setSelectedExamForInstructions] = useState<Exam | null>(null);
  const [launchingCBT, setLaunchingCBT] = useState(false);

  // Stats for Landing Page
  const [stats, setStats] = useState({
    users: 0,
    mocks: 0,
    passed: 0,
    uptime: "100%"
  });

  // CMS Settings state
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // --- COMPREHENSIVE SCROLL RESTORATION AND FOCUS-SCROLL PREVENTION ENGINE ---
  const scrollPositionRef = React.useRef(0);
  const isTransitioningRef = React.useRef(false);

  // 1. Scroll to top on intentional navigation (when pages, tabs or attempts change)
  useEffect(() => {
    isTransitioningRef.current = true;
    window.scrollTo(0, 0);
    // Reset the transition flag after a brief timeout to allow layout to settle
    const timer = setTimeout(() => {
      isTransitioningRef.current = false;
      scrollPositionRef.current = 0;
    }, 120);
    return () => clearTimeout(timer);
  }, [activeTab, activeAttempt?.id, viewingResultAttemptId, selectedExamForInstructions?.id]);

  // 2. Lock scroll position on clicks and manual scrolling to prevent layout-induced scroll jumping
  useEffect(() => {
    const handleScroll = () => {
      // If we are not transitioning, remember the last user-initiated scroll position
      if (!isTransitioningRef.current) {
        scrollPositionRef.current = window.scrollY;
      }
    };

    const handleGlobalClick = () => {
      if (!isTransitioningRef.current) {
        scrollPositionRef.current = window.scrollY;
      }
      
      // If any unexpected focus-induced scroll or layout-shift scroll happens, instantly restore it
      requestAnimationFrame(() => {
        if (!isTransitioningRef.current && window.scrollY !== scrollPositionRef.current) {
          window.scrollTo(0, scrollPositionRef.current);
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("click", handleGlobalClick, { capture: true, passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("click", handleGlobalClick);
    };
  }, []);

  // 3. Prevent browser's default focus-scrolling on mouse-clicks for buttons
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest("button, [role='button']");
      if (button) {
        // Prevent default action of mousedown (focusing the element) so we avoid focus-scroll jumps,
        // while still perfectly preserving keyboard accessibility (Tab focus uses keydown) and clicks
        const isEditing = target.closest("input, textarea, select");
        if (!isEditing) {
          e.preventDefault();
        }
      }
    };

    window.addEventListener("mousedown", handleMouseDown, { capture: true });
    return () => {
      window.removeEventListener("mousedown", handleMouseDown, { capture: true });
    };
  }, []);

  useEffect(() => {
    fetchExams();
    fetchPublicStats();
    fetchSettings();
    if (currentUser) {
      fetchUserNotifications();
    }
  }, [currentUser?.id, selectedCategory, searchQuery]);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        if (data.siteName) {
          document.title = data.siteName;
        }
      }
    } catch (err) {
      console.error("Error fetching settings", err);
    }
  };

  const fetchPublicStats = async () => {
    try {
      const res = await fetch("/api/public-stats");
      if (res.ok) {
        const data = await res.json();
        setStats({
          users: data.totalUsers,
          mocks: data.totalExams,
          passed: data.totalCertificates,
          uptime: data.uptime === "100%" ? "ONLINE" : data.uptime
        });
      }
    } catch (err) {
      console.error("Error fetching public stats", err);
    }
  };

  const fetchExams = async () => {
    try {
      const res = await fetch(`/api/exams?category=${selectedCategory}&search=${searchQuery}`);
      const data = await res.json();
      setExams(data);
    } catch (err) {
      console.error("Error fetching exams", err);
    }
  };

  const fetchUserNotifications = async () => {
    try {
      const res = await fetch(`/api/profile/${currentUser?.id}`);
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error("Error fetching alerts", err);
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem("nmts_user", JSON.stringify(user));
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("nmts_user");
    setActiveTab("dashboard");
    setActiveExam(null);
    setActiveAttempt(null);
    setViewingResultAttemptId(null);
  };

  const handleReadNotification = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  // Launch Computer Based Test (CBT) Instructions
  const handleStartExam = (examId: string) => {
    if (!currentUser) {
      setActiveTab("auth");
      alert("Authentication required. Please access candidate gateway via OTP first.");
      return;
    }

    const exam = exams.find(e => e.id === examId);
    if (!exam) {
      alert("Selected exam is not available in the registry.");
      return;
    }

    setSelectedExamForInstructions(exam);
    setActiveTab("instructions");
  };

  // Launch Computer Based Test (CBT) after instructions acceptance
  const handleLaunchCBT = async (examId: string) => {
    setLaunchingCBT(true);
    try {
      // Create attempt
      const startRes = await fetch(`/api/exams/${examId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id })
      });
      
      if (!startRes.ok) {
        throw new Error("Unable to create exam session");
      }
      
      const attemptData = await startRes.json();

      // Fetch questions
      const examRes = await fetch(`/api/exams/${examId}?randomize=true`);
      if (!examRes.ok) {
        throw new Error("Unable to fetch exam questions");
      }
      const examData = await examRes.json();

      if (!examData.questions || examData.questions.length === 0) {
        alert("This exam does not have any questions registered yet. Contact the administrator.");
        setLaunchingCBT(false);
        return;
      }

      setActiveExam(examData.exam);
      setActiveQuestions(examData.questions);
      setActiveAttempt(attemptData);
      setSelectedExamForInstructions(null);
      setViewingResultAttemptId(null);
    } catch (err) {
      alert("CBT initiation handshake failed. Contact regional helpdesk.");
    } finally {
      setLaunchingCBT(false);
    }
  };

  const handleFinishExam = (attemptId: string) => {
    setViewingResultAttemptId(attemptId);
    setActiveExam(null);
    setActiveAttempt(null);
    setActiveTab("result");
  };

  const navigateToTab = (tab: string) => {
    setViewingResultAttemptId(null);
    setActiveTab(tab);
  };

  return (
    <div className="bg-[#F5F7FA] min-h-screen flex flex-col font-sans select-none text-slate-900">
      
      {/* Dynamic Header visibility depending on exam console lock */}
      {!activeAttempt && (
        <Header 
          currentUser={currentUser} 
          onLogout={handleLogout} 
          onNavigate={navigateToTab} 
          activeTab={activeTab}
          notifications={notifications}
          onReadNotification={handleReadNotification}
          settings={settings}
        />
      )}

      {/* Primary Orchestrator Body */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          
          {/* Ongoing active testing screen */}
          {activeAttempt && activeExam && activeQuestions.length > 0 && (
            <motion.div
              key="exam-engine"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ExamEngine
                exam={activeExam}
                questions={activeQuestions}
                initialAttempt={activeAttempt}
                onFinishExam={handleFinishExam}
                onExit={() => {
                  setActiveAttempt(null);
                  setActiveExam(null);
                  setActiveTab("dashboard");
                }}
              />
            </motion.div>
          )}

          {/* Landing page Dashboard containing Mock browse & notices summary */}
          {!activeAttempt && activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-12"
            >
              {/* National Hero Banner */}
              <section className="bg-gradient-to-r from-[#003366] to-[#005A9C] text-white py-16 px-4 text-center border-b-4 border-[#0F8B4C] relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-blue-900 to-black"></div>
                <div className="max-w-4xl mx-auto space-y-6 relative z-10">
                  <div className="inline-flex items-center gap-2 bg-[#0F8B4C] text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase shadow">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>FEDERAL RECRUITMENT SIMULATORS ACTIVE</span>
                  </div>
                  <h2 className="text-3xl sm:text-5xl font-black font-sans uppercase tracking-tight leading-tight">
                    National Mock Testing Service (NMTS)
                  </h2>
                  <p className="text-base sm:text-lg text-blue-100 font-medium max-w-2xl mx-auto leading-relaxed">
                    Pakistan's elite standard diagnostic simulator portal for civil services, military enrollments, university entry tests, and public service commission exams.
                  </p>
                  
                  <div className="flex flex-wrap gap-4 justify-center pt-3 text-xs uppercase tracking-wide font-bold">
                    <button
                      id="hero-candidate-portal-btn"
                      onClick={() => navigateToTab(currentUser ? "profile" : "auth")}
                      className="bg-[#0F8B4C] hover:bg-green-700 text-white px-8 py-3.5 rounded shadow-lg transition flex items-center gap-2 cursor-pointer border border-green-800"
                    >
                      <span>{currentUser ? "My Dashboard Console" : "Access Candidate Portal"}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                      id="hero-verify-certs-btn"
                      onClick={() => navigateToTab("verify")}
                      className="bg-slate-800 hover:bg-black text-white px-8 py-3.5 rounded shadow transition cursor-pointer border border-slate-700"
                    >
                      <span>Verify Certificate Credential</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* Statistical Highlights Ribbon */}
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white border rounded-lg p-6 grid grid-cols-2 md:grid-cols-4 gap-6 shadow-sm text-center">
                  <div>
                    <h3 className="text-2xl font-black text-[#003366]">{stats.users}</h3>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1">Simulated Candidates</p>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[#0F8B4C]">{stats.mocks} Active</h3>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1">Recruitment Mocks</p>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[#F9A825]">{stats.passed}</h3>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1">Conferred Certificates</p>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-red-600">{stats.uptime}</h3>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1">CBT Server Status</p>
                  </div>
                </div>
              </section>

              {/* Browse Tests splits */}
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
                
                {/* Available mock lists */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
                    <h3 className="text-lg font-bold text-slate-900 uppercase border-l-4 border-[#003366] pl-2.5 tracking-wider">
                      Available Diagnostic CBT Mocks
                    </h3>
                    
                    {/* Category filtering */}
                    <div className="flex flex-wrap gap-1 text-[11px] font-bold">
                      {["All", ExamCategory.PUBLIC_SERVICE, ExamCategory.UNIVERSITY_ENTRY, ExamCategory.GOVERNMENT_JOB].map(cat => (
                        <button
                          id={`filter-cat-tab-${cat.replace(/\s+/g, "-")}`}
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3 py-1 rounded transition cursor-pointer ${
                            selectedCategory === cat 
                              ? "bg-[#005A9C] text-white" 
                              : "bg-white border text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {cat === "All" ? "All Domains" : cat.replace(" Exams", "")}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Search box */}
                  <div className="relative w-full">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Search className="h-4.5 w-4.5" />
                    </span>
                    <input
                      id="mock-exams-search-input"
                      type="text"
                      placeholder="Search mock exams by keywords (e.g., CSS, Biology)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-xs rounded border border-slate-300 pl-10 pr-4 py-3 bg-white focus:border-[#003366] focus:outline-none focus:ring-1 focus:ring-[#003366] shadow-inner"
                    />
                  </div>

                  {/* Test Cards List */}
                  <div className="space-y-4">
                    {exams.length === 0 ? (
                      <div className="bg-white p-12 rounded border text-center text-slate-400 text-sm shadow-inner">
                        No active testing schemas match your domain selection.
                      </div>
                    ) : (
                      exams.map(ex => (
                        <div 
                          id={`exam-card-${ex.id}`}
                          key={ex.id} 
                          className="bg-white p-6 rounded-lg border border-[#D8DEE9] shadow-sm hover:shadow-md transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden"
                        >
                          <div className="space-y-2">
                            <span className="inline-block bg-[#005A9C] text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                              {ex.category}
                            </span>
                            <h4 className="text-base font-bold text-slate-900 leading-snug">{ex.title}</h4>
                            <p className="text-slate-500 text-xs pr-4 leading-relaxed">{ex.description}</p>
                            
                            <div className="flex gap-4 text-[11px] text-slate-400 font-mono font-bold pt-1.5">
                              <span>Duration: <b className="text-[#003366]">{ex.duration} mins</b></span>
                              <span>Total Questions: <b>{ex.totalQuestions}</b></span>
                              <span>Difficulty: <b className="text-[#0F8B4C]">{ex.difficulty}</b></span>
                            </div>
                          </div>

                          <button
                            id={`start-mock-btn-${ex.id}`}
                            onClick={() => handleStartExam(ex.id)}
                            className="bg-[#003366] hover:bg-blue-900 text-white font-bold py-2.5 px-5 rounded text-xs tracking-wider uppercase transition cursor-pointer border border-blue-900 shrink-0 shadow flex items-center gap-1.5 self-end sm:self-center"
                          >
                            <span>Enroll Simulator</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Right sidebars: Helpline & Notices previews */}
                <div className="space-y-6">
                  
                  {/* Helpline Banner */}
                  <div className="bg-gradient-to-br from-[#003366] to-blue-950 text-white p-6 rounded-lg border border-blue-900 shadow-sm text-center space-y-4">
                    <PhoneCall className="h-8 w-8 text-[#F9A825] mx-auto" />
                    <div>
                      <h4 className="font-bold text-sm uppercase tracking-wider">Candidate Support</h4>
                      <p className="text-[11px] text-blue-200 mt-1">Need help with roll numbers, schedules, or login warnings?</p>
                    </div>
                    <div className="bg-slate-900/40 p-2.5 rounded text-xs font-bold border border-slate-800">
                      <span>Call: +92 (51) 111-92-NMTS</span>
                    </div>
                  </div>

                  {/* CBT Policy Info */}
                  <div className="bg-white p-6 rounded-lg border border-[#D8DEE9] shadow-sm space-y-4">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b pb-2">Simulator Conduct Code</h4>
                    <div className="space-y-2.5 text-xs text-slate-500 leading-relaxed">
                      <p className="flex items-start gap-2">
                        <span className="bg-red-50 text-[#C62828] h-1.5 w-1.5 rounded-full inline-block mt-1.5 shrink-0"></span>
                        <span><b>No Unfair Means:</b> Window changes or tab switching are strictly audited.</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="bg-[#0F8B4C] text-[#0F8B4C] h-1.5 w-1.5 rounded-full inline-block mt-1.5 shrink-0"></span>
                        <span><b>Auto Save:</b> Progress is saved on every question click. Reloading is safe.</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="bg-[#F9A825] text-[#F9A825] h-1.5 w-1.5 rounded-full inline-block mt-1.5 shrink-0"></span>
                        <span><b>Verifications:</b> Earned credentials have permanent cryptographic QR hashes.</span>
                      </p>
                    </div>
                  </div>

                </div>

              </section>
            </motion.div>
          )}

          {/* Core Notice Board tab */}
          {activeTab === "notices" && (
            <motion.div
              key="notices-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <NoticeBoard initialTab="notices" />
            </motion.div>
          )}

          {/* Core Downloads tab redirects */}
          {activeTab === "downloads" && (
            <motion.div
              key="downloads-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <NoticeBoard initialTab="downloads" />
            </motion.div>
          )}

          {/* Core Verification tab redirects */}
          {activeTab === "verify" && (
            <motion.div
              key="verify-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <NoticeBoard initialTab="verify" />
            </motion.div>
          )}

          {/* Profile cockpits */}
          {activeTab === "profile" && currentUser && (
            <motion.div
              key="profile-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ProfilePage 
                currentUser={currentUser} 
                onViewResult={(id) => {
                  setViewingResultAttemptId(id);
                  setActiveTab("result");
                }}
                onNavigate={navigateToTab}
              />
            </motion.div>
          )}

          {/* Detailed results scorecards viewer */}
          {activeTab === "result" && viewingResultAttemptId && (
            <motion.div
              key="result-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ResultsPage 
                attemptId={viewingResultAttemptId} 
                onNavigate={navigateToTab}
              />
            </motion.div>
          )}

          {/* Administrator Workspace Tab */}
          {activeTab === "admin" && (
            <motion.div
              key="admin-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AdminPanel />
            </motion.div>
          )}

          {/* Candidates secure Gateway authenticator */}
          {activeTab === "auth" && (
            <motion.div
              key="auth-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AuthPage onLoginSuccess={handleLoginSuccess} />
            </motion.div>
          )}

          {/* CBT Instructions Page tab */}
          {activeTab === "instructions" && selectedExamForInstructions && (
            <motion.div
              key="instructions-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <InstructionPage 
                exam={selectedExamForInstructions}
                onCancel={() => {
                  setSelectedExamForInstructions(null);
                  setActiveTab("dashboard");
                }}
                onStart={() => handleLaunchCBT(selectedExamForInstructions.id)}
                loading={launchingCBT}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer layout visibility */}
      {!activeAttempt && <Footer settings={settings} />}

    </div>
  );
}
