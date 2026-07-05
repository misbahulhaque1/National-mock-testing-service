/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Exam, Question, ExamAttempt, QuestionType } from "../types";
import { 
  Clock, ShieldAlert, CheckCircle, Save, ArrowLeft, ArrowRight, 
  HelpCircle, Flag, RotateCcw, Monitor, FileText 
} from "lucide-react";

interface ExamEngineProps {
  exam: Exam;
  questions: Question[];
  initialAttempt: ExamAttempt;
  onFinishExam: (attemptId: string) => void;
  onExit: () => void;
}

export default function ExamEngine({ 
  exam, questions, initialAttempt, onFinishExam, onExit 
}: ExamEngineProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(initialAttempt.answers || {});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>(initialAttempt.markedForReview || {});
  const [warningCount, setWarningCount] = useState(initialAttempt.warningCount || 0);
  const [timeLeft, setTimeLeft] = useState(exam.duration * 60); // Convert min to seconds
  const [submitting, setSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  // Anti-Cheating Event Listeners: Focus/Blur & Visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation("Tab Switched");
      }
    };

    const handleWindowBlur = () => {
      triggerViolation("Window Unfocused");
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    // Countdown Timer Loop
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          autoSubmitExam("Timer Expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [warningCount]);

  // Handle auto-save whenever answers or review states alter
  useEffect(() => {
    saveExamState();
  }, [answers, markedForReview, warningCount]);

  const triggerViolation = (reason: string) => {
    const nextWarnings = warningCount + 1;
    setWarningCount(nextWarnings);
    alert(`SECURITY ALERT: ${reason} event detected!\nThis is an official NMTS examination session. Multiple violations will cause automatic submission of your paper. (Warnings: ${nextWarnings}/3)`);

    if (nextWarnings >= 3) {
      autoSubmitExam("Security Violations Exceeded");
    }
  };

  const saveExamState = async () => {
    try {
      await fetch(`/api/attempts/${initialAttempt.id}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          markedForReview,
          warningCount,
          userId: initialAttempt.userId
        })
      });
    } catch (err) {
      console.error("Auto-save sync failed", err);
    }
  };

  const autoSubmitExam = async (reason: string) => {
    if (submitting) return;
    setSubmitting(true);

    // Stop timer immediately
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (reason !== "Candidate Submitted Manual") {
      alert(`Auto-submitting examination paper. Reason: ${reason}`);
    }
    
    try {
      // First save latest answers
      await fetch(`/api/attempts/${initialAttempt.id}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, markedForReview, warningCount, userId: initialAttempt.userId })
      });

      // Submit
      const res = await fetch(`/api/attempts/${initialAttempt.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        onFinishExam(initialAttempt.id);
      }
    } catch (err) {
      console.error("Auto-submit failed", err);
    } finally {
      setSubmitting(false);
    }
  };

  const manualSubmitExam = () => {
    setShowSubmitConfirm(true);
  };

  // Helper selectors
  const handleAnswerSelect = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  // Checkbox answers for multi MCQs
  const handleMultiAnswerSelect = (optionIdx: string) => {
    const currentListStr = answers[currentQuestion.id];
    let list: string[] = [];
    if (currentListStr) {
      try {
        list = JSON.parse(currentListStr);
      } catch {
        list = [currentListStr];
      }
    }

    if (list.includes(optionIdx)) {
      list = list.filter(v => v !== optionIdx);
    } else {
      list.push(optionIdx);
    }

    handleAnswerSelect(JSON.stringify(list));
  };

  const handleMarkReview = () => {
    setMarkedForReview(prev => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id]
    }));
  };

  const handleClearResponse = () => {
    setAnswers(prev => {
      const copy = { ...prev };
      delete copy[currentQuestion.id];
      return copy;
    });
  };

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatTime = (secs: number) => {
    const min = Math.floor(secs / 60);
    const sec = secs % 60;
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const answeredCount = Object.keys(answers).filter(k => answers[k] !== undefined && answers[k] !== "").length;
  const unansweredCount = totalQuestions - answeredCount;
  const markedReviewCount = Object.keys(markedForReview).filter(k => markedForReview[k] === true).length;
  const progressCount = answeredCount;
  const isTimeLow = timeLeft < 120; // under 2 mins

  return (
    <div className="bg-[#F5F7FA] min-h-screen pb-12 select-none">
      {/* Upper Security Panel Bar */}
      <div className="bg-slate-900 text-white px-4 py-3 flex flex-wrap justify-between items-center border-b-4 border-[#C62828] font-sans">
        <div className="flex items-center gap-3">
          <span className="bg-[#C62828] text-[10px] px-2.5 py-1 rounded font-bold uppercase tracking-widest animate-pulse">
            High Stakes Session
          </span>
          <h2 className="font-bold text-xs sm:text-sm tracking-wide text-slate-200">
            {exam.title}
          </h2>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1 text-red-400 font-bold bg-slate-800 px-3 py-1.5 rounded border border-red-950">
            <ShieldAlert className="h-4 w-4" />
            <span>Violations Warning: {warningCount}/3</span>
          </div>
          <button
            id="fullscreen-toggle-btn"
            onClick={handleFullscreenToggle}
            className="hidden sm:flex items-center gap-1 bg-slate-800 hover:bg-slate-700 p-1.5 rounded border border-slate-700 cursor-pointer"
          >
            <Monitor className="h-4 w-4" />
            <span>Fullscreen Mode</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Main Component: Current Question view */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-lg border border-[#D8DEE9] shadow-md p-6 sm:p-8 space-y-6">
              
              {/* Question Header & Points Details */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <span className="text-[#003366] font-bold text-sm uppercase tracking-wider">
                  Question {currentIndex + 1} of {totalQuestions}
                </span>
                <div className="flex gap-4 text-[11px] font-mono text-slate-500 font-bold">
                  <span>Difficulty: <b className="text-[#005A9C]">{currentQuestion.difficulty.toUpperCase()}</b></span>
                  <span>Marks: <b className="text-[#0F8B4C]">+10.0</b></span>
                  {exam.negativeMarkingValue > 0 && (
                    <span className="text-[#C62828]">Penalty: -{exam.negativeMarkingValue * 10}</span>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <div className="text-slate-800 text-base sm:text-lg font-bold leading-relaxed">
                {currentQuestion.text}
              </div>

              {/* Input Answers Renderers according to exact type */}
              <div className="pt-2">
                {currentQuestion.type === QuestionType.SINGLE_CORRECT && currentQuestion.options && (
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, idx) => {
                      const valueStr = String(idx);
                      const isSelected = answers[currentQuestion.id] === valueStr;
                      return (
                        <div 
                          id={`option-single-${idx}`}
                          key={idx}
                          onClick={() => handleAnswerSelect(valueStr)}
                          className={`flex items-center gap-3 p-4 rounded border cursor-pointer transition ${
                            isSelected 
                              ? "bg-blue-50/50 border-[#005A9C] font-semibold text-[#005A9C]" 
                              : "border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${currentQuestion.id}`}
                            value={valueStr}
                            checked={isSelected}
                            readOnly
                            className="h-4 w-4 text-[#003366] focus:ring-[#003366]"
                          />
                          <span className="text-sm">{option}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {currentQuestion.type === QuestionType.MULTIPLE_CORRECT && currentQuestion.options && (
                  <div className="space-y-3">
                    <p className="text-[11px] font-mono font-bold text-amber-700 mb-2 uppercase tracking-wide">
                      Select ALL options that are correct:
                    </p>
                    {currentQuestion.options.map((option, idx) => {
                      const valueStr = String(idx);
                      let isChecked = false;
                      try {
                        const parsed = JSON.parse(answers[currentQuestion.id] || "[]");
                        isChecked = parsed.includes(valueStr);
                      } catch {
                        isChecked = answers[currentQuestion.id] === valueStr;
                      }

                      return (
                        <div 
                          id={`option-multi-${idx}`}
                          key={idx}
                          onClick={() => handleMultiAnswerSelect(valueStr)}
                          className={`flex items-center gap-3 p-4 rounded border cursor-pointer transition ${
                            isChecked 
                              ? "bg-blue-50/50 border-[#005A9C] font-semibold text-[#005A9C]" 
                              : "border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            value={valueStr}
                            checked={isChecked}
                            readOnly
                            className="h-4 w-4 rounded border-slate-300 text-[#003366] focus:ring-[#003366]"
                          />
                          <span className="text-sm">{option}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {currentQuestion.type === QuestionType.TRUE_FALSE && (
                  <div className="flex gap-4">
                    {["True", "False"].map((val, idx) => {
                      const isSelected = answers[currentQuestion.id] === String(idx);
                      return (
                        <button
                          id={`btn-tf-${idx}`}
                          key={idx}
                          type="button"
                          onClick={() => handleAnswerSelect(String(idx))}
                          className={`flex-1 py-4 border rounded font-bold text-sm transition cursor-pointer ${
                            isSelected 
                              ? "bg-blue-50 text-[#005A9C] border-[#005A9C]" 
                              : "bg-white border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                )}

                {(currentQuestion.type === QuestionType.FILL_BLANK || currentQuestion.type === QuestionType.SHORT_ANSWER) && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Type Your Correct Response:
                    </label>
                    <input
                      id="cbt-text-answer-input"
                      type="text"
                      placeholder="Type answer here..."
                      value={answers[currentQuestion.id] || ""}
                      onChange={(e) => handleAnswerSelect(e.target.value)}
                      className="w-full text-sm rounded border border-slate-300 p-3 bg-slate-50 focus:border-[#003366] focus:outline-none focus:ring-1 focus:ring-[#003366]"
                    />
                  </div>
                )}

                {currentQuestion.type === QuestionType.ESSAY && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide flex justify-between">
                      <span>Structured Essay Writing Block</span>
                      <span className="text-slate-400">Word Count: {(answers[currentQuestion.id] || "").trim().split(/\s+/).filter(Boolean).length} words</span>
                    </label>
                    <textarea
                      id="cbt-essay-textarea"
                      rows={8}
                      placeholder="Draft your analysis essays here. NMTS auto-submission logs will retain this statement."
                      value={answers[currentQuestion.id] || ""}
                      onChange={(e) => handleAnswerSelect(e.target.value)}
                      className="w-full text-sm rounded border border-slate-300 p-4 bg-slate-50 font-sans focus:border-[#003366] focus:outline-none"
                    />
                  </div>
                )}

                {currentQuestion.type === QuestionType.CODING && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                      NMTS Computer Programming Editor
                    </label>
                    <textarea
                      id="cbt-code-textarea"
                      rows={10}
                      placeholder="// Write code here..."
                      value={answers[currentQuestion.id] || ""}
                      onChange={(e) => handleAnswerSelect(e.target.value)}
                      className="w-full text-xs rounded border border-slate-300 p-4 bg-slate-900 text-green-400 font-mono focus:outline-none focus:ring-1 focus:ring-green-400"
                    />
                  </div>
                )}
              </div>

              {/* Save, Review, Navigation Buttons footer */}
              <div className="flex flex-wrap gap-3 justify-between items-center border-t border-slate-100 pt-6">
                <div className="flex gap-2">
                  <button
                    id="cbt-clear-btn"
                    onClick={handleClearResponse}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded text-xs transition uppercase tracking-wider cursor-pointer border"
                  >
                    Clear Answers
                  </button>
                  <button
                    id="cbt-review-btn"
                    onClick={handleMarkReview}
                    className={`font-bold py-2.5 px-4 rounded text-xs transition uppercase tracking-wider cursor-pointer border flex items-center gap-1.5 ${
                      markedForReview[currentQuestion.id]
                        ? "bg-[#F9A825] text-white border-[#F9A825]"
                        : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                    }`}
                  >
                    <Flag className="h-3.5 w-3.5" />
                    <span>{markedForReview[currentQuestion.id] ? "Marked for Review" : "Mark for Review"}</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    id="cbt-prev-btn"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex(currentIndex - 1)}
                    className="bg-white hover:bg-slate-50 text-[#003366] font-bold py-2.5 px-4 rounded text-xs transition uppercase tracking-wider cursor-pointer border border-[#003366] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Prev</span>
                  </button>
                  <button
                    id="cbt-next-btn"
                    disabled={currentIndex === totalQuestions - 1}
                    onClick={() => setCurrentIndex(currentIndex + 1)}
                    className="bg-white hover:bg-slate-50 text-[#003366] font-bold py-2.5 px-4 rounded text-xs transition uppercase tracking-wider cursor-pointer border border-[#003366] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <span>Next</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Right Main Component: Candidate Status, Timer & Question Palette */}
          <div className="space-y-6">
            
            {/* Visual ticking Timer countdown */}
            <div className={`bg-white p-5 rounded-lg border shadow-sm text-center ${isTimeLow ? "border-[#C62828] bg-red-50/20" : "border-[#D8DEE9]"}`}>
              <Clock className={`h-8 w-8 mx-auto mb-1 ${isTimeLow ? "text-[#C62828] animate-pulse" : "text-[#003366]"}`} />
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Time Remaining</p>
              <h3 className={`text-2xl font-extrabold tracking-widest mt-1 font-mono ${isTimeLow ? "text-[#C62828]" : "text-[#003366]"}`}>
                {formatTime(timeLeft)}
              </h3>
            </div>

            {/* Question Palette panel */}
            <div className="bg-white p-5 rounded-lg border border-[#D8DEE9] shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase border-b border-slate-100 pb-2.5 tracking-wider flex justify-between items-center">
                <span>Question Palette</span>
                <span className="text-[10px] font-mono text-slate-400">{progressCount}/{totalQuestions} Answered</span>
              </h4>

              {/* Grid palette keys */}
              <div className="grid grid-cols-5 gap-2.5">
                {questions.map((q, idx) => {
                  const isAnswered = answers[q.id] !== undefined && answers[q.id] !== "";
                  const isMarked = markedForReview[q.id];
                  const isCurrent = idx === currentIndex;

                  let styleClass = "bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200";
                  if (isAnswered) styleClass = "bg-[#0F8B4C] text-white hover:bg-green-700";
                  if (isMarked) styleClass = "bg-[#F9A825] text-white hover:bg-yellow-600";
                  if (isCurrent) styleClass = "border-2 border-[#003366] ring-2 ring-blue-100 text-[#003366] font-bold";

                  return (
                    <button
                      id={`palette-btn-${idx}`}
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-9 w-9 text-xs rounded font-bold transition flex items-center justify-center cursor-pointer ${styleClass}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Palette Color Codes explanation */}
              <div className="border-t border-slate-100 pt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 grid grid-cols-2 gap-2 mt-4">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 bg-[#0F8B4C] rounded inline-block"></span>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 bg-[#F9A825] rounded inline-block"></span>
                  <span>Marked</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 bg-slate-50 border border-slate-300 rounded inline-block"></span>
                  <span>Not Answered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 border-2 border-[#003366] rounded inline-block"></span>
                  <span>Current</span>
                </div>
              </div>
            </div>

            {/* Manual submission trigger button */}
            <button
              id="cbt-manual-submit-btn"
              onClick={manualSubmitExam}
              disabled={submitting}
              className="w-full bg-[#0F8B4C] hover:bg-green-700 text-white font-bold py-3 rounded text-xs tracking-wider uppercase shadow hover:shadow-lg transition cursor-pointer border border-green-800 flex justify-center items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Submit Examination Paper</span>
            </button>

          </div>

        </div>
      </div>

      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#003366] to-[#005A9C] text-white p-5 flex items-center gap-3 border-b-4 border-[#0F8B4C]">
              <ShieldAlert className="h-6 w-6 text-amber-400 shrink-0" />
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider">Confirm Final Submission</h3>
                <p className="text-blue-100 text-[10px] uppercase font-bold tracking-widest">National Mock Testing Service</p>
              </div>
            </div>

            {/* Body Metrics Grid */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-3.5 text-center">
                <div className="bg-slate-50 border p-3.5 rounded-lg">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Items</span>
                  <span className="text-lg font-black text-slate-800 block mt-0.5">{totalQuestions}</span>
                </div>
                <div className="bg-green-50/40 border border-green-100 p-3.5 rounded-lg">
                  <span className="text-[10px] text-green-600 font-bold uppercase tracking-wider block">Answered</span>
                  <span className="text-lg font-black text-[#0F8B4C] block mt-0.5">{answeredCount}</span>
                </div>
                <div className="bg-red-50/40 border border-red-100 p-3.5 rounded-lg">
                  <span className="text-[10px] text-red-600 font-bold uppercase tracking-wider block">Unanswered</span>
                  <span className="text-lg font-black text-red-600 block mt-0.5">{unansweredCount}</span>
                </div>
                <div className="bg-amber-50/40 border border-amber-100 p-3.5 rounded-lg">
                  <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block">Marked for Review</span>
                  <span className="text-lg font-black text-[#F9A825] block mt-0.5">{markedReviewCount}</span>
                </div>
              </div>

              {/* Remaining Time Ribbon */}
              <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#003366]">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider">Remaining Time</span>
                </div>
                <span className="text-sm font-extrabold text-[#003366] font-mono tracking-widest bg-white py-1 px-3 rounded border">
                  {formatTime(timeLeft)}
                </span>
              </div>

              {/* Requirement Text block */}
              <div className="space-y-2 border-t pt-4">
                <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                  You have answered: <span className="text-[#0F8B4C] font-extrabold">{answeredCount} of {totalQuestions}</span> questions. <br />
                  <span className="text-red-600 font-extrabold">{unansweredCount}</span> questions are still unanswered.
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to submit your exam? Once submitted, your responses will be locked and cannot be edited.
                </p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex gap-3.5 justify-end">
              <button
                id="cbt-confirm-cancel-btn"
                onClick={() => setShowSubmitConfirm(false)}
                className="bg-white hover:bg-slate-100 text-slate-700 font-bold py-2.5 px-4 rounded text-xs transition uppercase tracking-wider border cursor-pointer"
              >
                Continue Exam
              </button>
              <button
                id="cbt-confirm-submit-btn"
                onClick={() => {
                  setShowSubmitConfirm(false);
                  autoSubmitExam("Candidate Submitted Manual");
                }}
                className="bg-[#0F8B4C] hover:bg-green-700 text-white font-extrabold py-2.5 px-6 rounded text-xs transition uppercase tracking-widest border border-green-800 shadow cursor-pointer"
              >
                Submit Anyway
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
