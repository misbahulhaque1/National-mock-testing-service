/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Exam, Question, ExamAttempt, Certificate } from "../types";
import { 
  Award, ShieldCheck, Printer, CheckCircle, XCircle, AlertTriangle, 
  Clock, Award as AwardIcon, Share2, ClipboardList, HelpCircle, ArrowRight 
} from "lucide-react";

interface ResultsPageProps {
  attemptId: string;
  onNavigate: (tab: string) => void;
}

export default function ResultsPage({ attemptId, onNavigate }: ResultsPageProps) {
  const [result, setResult] = useState<{
    attempt: ExamAttempt;
    exam: Exam;
    certificate: Certificate | null;
    questions: Question[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResult();
  }, [attemptId]);

  const fetchResult = async () => {
    try {
      const res = await fetch(`/api/attempts/${attemptId}/result`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Error fetching exam results", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  if (loading || !result) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500 text-sm">
        Formulating scorecard analytics... Please wait.
      </div>
    );
  }

  const { attempt, exam, certificate, questions } = result;

  const totalPossibleScore = questions.length * 10;
  const isPassed = (attempt.score || 0) >= exam.passingScore;
  const accuracyPercent = attempt.correctCount !== undefined && attempt.incorrectCount !== undefined
    ? Math.round((attempt.correctCount / ((attempt.correctCount + attempt.incorrectCount) || 1)) * 100)
    : 0;

  const formatDuration = (totalSeconds: number) => {
    if (!totalSeconds) return "0s";
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const attemptedCount = questions.length - (attempt.skippedCount || 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 select-none">
      
      {/* Top Header Alert Card */}
      <div className={`p-6 rounded-lg border shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 ${
        isPassed ? "bg-green-50/50 border-[#0F8B4C]" : "bg-red-50/50 border-[#C62828]"
      }`}>
        <div className="flex items-center gap-3.5">
          <div className={`p-3.5 rounded-full inline-block ${isPassed ? "bg-[#0F8B4C] text-white" : "bg-[#C62828] text-white"}`}>
            {isPassed ? <CheckCircle className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 leading-snug">
              {isPassed ? "EXAMINATION STATUS: QUALIFIED" : "EXAMINATION STATUS: UNQUALIFIED"}
            </h2>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">
              Mock Test Diagnostic: {exam.title}
            </p>
          </div>
        </div>
        <div className="text-center sm:text-right">
          <p className="text-xs text-slate-400 font-bold uppercase">Candidate Points</p>
          <h3 className={`text-2xl font-black mt-1 ${isPassed ? "text-[#0F8B4C]" : "text-[#C62828]"}`}>
            {attempt.score} / {totalPossibleScore} pts
          </h3>
        </div>
      </div>

      {/* Analytical Badges metrics block */}
      <div className="mt-8 space-y-4">
        <h4 className="text-sm font-bold text-slate-900 border-l-4 border-[#0F8B4C] pl-2.5 uppercase tracking-wider">
          Official Assessment Scorecard
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-9 gap-4">
          <div className="bg-white p-4 rounded border text-center shadow-sm">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Total Items</p>
            <h4 className="text-lg font-black text-slate-800 mt-1">{questions.length}</h4>
          </div>
          <div className="bg-white p-4 rounded border text-center shadow-sm">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Attempted</p>
            <h4 className="text-lg font-black text-[#005A9C] mt-1">{attemptedCount}</h4>
          </div>
          <div className="bg-white p-4 rounded border text-center shadow-sm">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Unattempted</p>
            <h4 className="text-lg font-black text-slate-500 mt-1">{attempt.skippedCount || 0}</h4>
          </div>
          <div className="bg-white p-4 rounded border text-center shadow-sm">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Correct</p>
            <h4 className="text-lg font-black text-[#0F8B4C] mt-1">{attempt.correctCount}</h4>
          </div>
          <div className="bg-white p-4 rounded border text-center shadow-sm">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Wrong</p>
            <h4 className="text-lg font-black text-[#C62828] mt-1">{attempt.incorrectCount}</h4>
          </div>
          <div className="bg-white p-4 rounded border text-center shadow-sm">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Final Score</p>
            <h4 className="text-lg font-black text-slate-800 mt-1">{attempt.score}</h4>
          </div>
          <div className="bg-white p-4 rounded border text-center shadow-sm">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Percentage</p>
            <h4 className="text-lg font-black text-[#005A9C] mt-1">
              {Math.round(((attempt.score || 0) / totalPossibleScore) * 100)}%
            </h4>
          </div>
          <div className="bg-white p-4 rounded border text-center shadow-sm">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Merit Rank</p>
            <h4 className="text-lg font-black text-purple-700 mt-1"># {attempt.rank || 1}</h4>
          </div>
          <div className="bg-white p-4 rounded border text-center shadow-sm">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Time Taken</p>
            <h4 className="text-lg font-black text-[#F9A825] mt-1 font-mono truncate">
              {formatDuration(attempt.timeSpentSeconds || 0)}
            </h4>
          </div>
        </div>
      </div>

      {/* Structured results breakdown split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        
        {/* Left main: Question feedback checklist with explanations */}
        <div className="lg:col-span-2 space-y-6">
          <h4 className="text-sm font-bold text-slate-900 border-l-4 border-[#003366] pl-2.5 uppercase tracking-wider mb-2">
            Detailed Answers Analysis
          </h4>

          <div className="space-y-4">
            {questions.map((q, idx) => {
              const candidateAns = attempt.answers[q.id];
              const correctAns = q.correctAnswer;
              const isSkipped = candidateAns === undefined || candidateAns === "";
              
              let isCorrect = false;
              if (!isSkipped) {
                if (q.type === "single_correct" || q.type === "true_false") {
                  isCorrect = String(candidateAns) === String(correctAns);
                } else if (q.type === "multiple_correct") {
                  try {
                    const correctSet: string[] = JSON.parse(correctAns as string);
                    const candidateSet: string[] = JSON.parse(candidateAns);
                    isCorrect = correctSet.length === candidateSet.length && correctSet.every(v => candidateSet.includes(v));
                  } catch {
                    isCorrect = String(candidateAns) === String(correctAns);
                  }
                } else if (q.type === "fill_blank" || q.type === "short_answer") {
                  isCorrect = String(candidateAns).trim().toLowerCase() === String(correctAns).trim().toLowerCase();
                } else {
                  isCorrect = (candidateAns || "").length > 10;
                }
              }

              return (
                <div 
                  id={`review-question-card-${q.id}`}
                  key={q.id} 
                  className={`p-5 rounded-lg border bg-white shadow-sm space-y-3.5 relative`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <span className="bg-slate-100 text-[#003366] text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase tracking-wide">
                      Q {idx + 1} • {q.subject}
                    </span>
                    {isSkipped ? (
                      <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">SKIPPED</span>
                    ) : isCorrect ? (
                      <span className="text-[#0F8B4C] font-semibold text-xs uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" /> Correct
                      </span>
                    ) : (
                      <span className="text-[#C62828] font-semibold text-xs uppercase tracking-wider flex items-center gap-1">
                        <XCircle className="h-4 w-4" /> Incorrect
                      </span>
                    )}
                  </div>

                  <p className="font-bold text-slate-800 text-sm leading-relaxed">{q.text}</p>

                  <div className="bg-slate-50 p-3 rounded text-xs space-y-2 text-slate-700">
                    <div className="flex gap-2">
                      <span className="font-bold text-slate-400 min-w-[100px]">Chosen Response:</span>
                      {(() => {
                        if (isSkipped) return <span className="text-slate-500 italic">No answer submitted</span>;
                        try {
                          const parsedArr = JSON.parse(candidateAns);
                          if (Array.isArray(parsedArr)) {
                            return (
                              <span className="text-slate-800 font-semibold">
                                {parsedArr.map(val => q.options && q.options[parseInt(val)] ? q.options[parseInt(val)] : val).join(", ")}
                              </span>
                            );
                          }
                        } catch {}
                        if (q.options && q.options[parseInt(candidateAns)]) {
                          return <span className="text-slate-800 font-semibold">{q.options[parseInt(candidateAns)]}</span>;
                        }
                        return <span className="text-slate-800 font-semibold">{candidateAns}</span>;
                      })()}
                    </div>
                    {!isCorrect && (
                      <div className="flex gap-2">
                        <span className="font-bold text-[#0F8B4C] min-w-[100px]">Correct Key:</span>
                        {(() => {
                          try {
                            const parsedArr = JSON.parse(correctAns as string);
                            if (Array.isArray(parsedArr)) {
                              return (
                                <span className="text-[#0F8B4C] font-bold">
                                  {parsedArr.map(val => q.options && q.options[parseInt(val)] ? q.options[parseInt(val)] : val).join(", ")}
                                </span>
                              );
                            }
                          } catch {}
                          if (q.options && q.options[parseInt(correctAns as string)]) {
                            return <span className="text-[#0F8B4C] font-bold">{q.options[parseInt(correctAns as string)]}</span>;
                          }
                          return <span className="text-[#0F8B4C] font-bold">{String(correctAns)}</span>;
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Textbook explanation */}
                  {q.explanation && (
                    <div className="border-t border-slate-100 pt-3 flex gap-2.5 items-start">
                      <HelpCircle className="h-4 w-4 text-[#005A9C] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Textbook Explanation</p>
                        <p className="text-slate-600 text-xs mt-1 leading-relaxed font-sans">{q.explanation}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right main: Verification certificates printable panel */}
        <div className="space-y-6">
          {certificate ? (
            <div className="bg-white rounded-lg border border-[#D8DEE9] shadow-md p-6 space-y-5">
              <h4 className="text-sm font-bold text-slate-900 border-l-4 border-[#F9A825] pl-2.5 uppercase tracking-wider pb-1">
                Verifiable Mock Certificate
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Congratulations on passing this mock test. You have been awarded a verifiable completion certificate from the National Mock Testing Service (NMTS).
              </p>

              {/* Printable Certificate Template */}
              <div 
                id="printable-certificate"
                className="border-8 border-[#003366] rounded p-4 bg-white space-y-4 shadow-sm text-center relative font-serif select-text"
              >
                {/* Official Crest Border */}
                <div className="border border-[#0F8B4C] p-3 text-center space-y-3.5">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
                    NATIONAL MOCK TESTING SERVICE BOARD
                  </span>
                  
                  <div className="space-y-1">
                    <h3 className="text-[#003366] font-bold text-lg uppercase tracking-tight">NMTS CERTIFICATE</h3>
                    <p className="text-[9px] text-[#0F8B4C] font-semibold tracking-wider font-sans uppercase">OF EXCELLENCE & SUCCESS</p>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-snug">
                    This is to verify and certify that the candidate:
                  </p>

                  <div className="space-y-0.5">
                    <h2 className="text-base font-black text-slate-900 underline uppercase tracking-wide font-sans">{certificate.candidateName}</h2>
                    <p className="text-[10px] text-slate-400 font-mono font-bold">CNIC ID: {certificate.cnic || "35201-9876543-1"}</p>
                  </div>

                  <p className="text-[10px] text-slate-500 px-2 leading-relaxed">
                    has successfully qualified the high stakes Computer-Based Simulator Mocks for <b>{certificate.examTitle}</b> scoring a final merit percentile of:
                  </p>

                  <h3 className="text-[#003366] font-extrabold text-xl tracking-wider font-sans">{certificate.percentile}th PERCENTILE</h3>

                  <div className="border-t border-slate-200 pt-3 text-[9px] text-slate-400 font-mono flex justify-between items-center text-left">
                    <div>
                      <span>REG: {certificate.certificateNumber}</span> <br />
                      <span>ISSUED: {new Date(certificate.issuedAt).toLocaleDateString()}</span>
                    </div>
                    {certificate.qrCodeUrl && (
                      <img src={certificate.qrCodeUrl} alt="Certificate QR verification URL" className="h-12 w-12 border bg-white p-0.5" />
                    )}
                  </div>
                </div>
              </div>

              {/* Certificate triggers */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  id="print-cert-btn"
                  onClick={handlePrintCertificate}
                  className="bg-slate-800 hover:bg-black text-white font-bold py-2 px-3 rounded text-[11px] transition uppercase tracking-wider flex justify-center items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print PDF</span>
                </button>
                <button
                  id="nav-verify-from-result-btn"
                  onClick={() => onNavigate("verify")}
                  className="bg-[#005A9C] hover:bg-blue-800 text-white font-bold py-2 px-3 rounded text-[11px] transition uppercase tracking-wider flex justify-center items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Online Registry</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-[#D8DEE9] shadow-sm p-6 text-center space-y-4">
              <AwardIcon className="h-10 w-10 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">Certificate Conferred Limit</h4>
              <p className="text-slate-500 text-xs leading-relaxed">
                Completion certificates are only conferred upon candidates who achieve or exceed the official passing score limit ({exam.passingScore} points). Re-study topics and try again!
              </p>
            </div>
          )}

          {/* Quick recommendations */}
          <div className="bg-white rounded-lg border border-[#D8DEE9] shadow-sm p-6 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b pb-2">What next?</h4>
            <div className="space-y-2 text-xs text-slate-600">
              <button
                onClick={() => onNavigate("dashboard")}
                className="w-full text-left py-1.5 px-2.5 rounded hover:bg-slate-50 text-[#005A9C] font-semibold flex justify-between items-center cursor-pointer transition border"
              >
                <span>Take Another Mock Exam</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onNavigate("profile")}
                className="w-full text-left py-1.5 px-2.5 rounded hover:bg-slate-50 text-[#005A9C] font-semibold flex justify-between items-center cursor-pointer transition border"
              >
                <span>View My Analytics Workspace</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
