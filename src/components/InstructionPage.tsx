/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Exam } from "../types";
import { 
  ShieldAlert, Clock, AlertCircle, CheckCircle, ArrowLeft, 
  Play, Check, HelpCircle, FileText, ListOrdered, Award, Landmark
} from "lucide-react";

interface InstructionPageProps {
  exam: Exam;
  onCancel: () => void;
  onStart: () => void;
  loading: boolean;
}

export default function InstructionPage({ exam, onCancel, onStart, loading }: InstructionPageProps) {
  const [declared, setDeclared] = useState(false);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 select-none">
      <div className="bg-white rounded-lg border border-[#D8DEE9] shadow-lg overflow-hidden">
        
        {/* Government Header Banner */}
        <div className="bg-gradient-to-r from-[#003366] to-[#005A9C] text-white p-6 sm:p-8 border-b-4 border-[#0F8B4C] relative">
          <div className="absolute top-4 right-4 opacity-10">
            <Landmark className="h-24 w-24 text-white" />
          </div>
          <div className="relative z-10 space-y-2">
            <span className="bg-[#0F8B4C] text-white text-[10px] font-mono px-2.5 py-1 rounded font-bold uppercase tracking-widest">
              Candidate Gateway Console
            </span>
            <h1 className="text-2xl sm:text-3xl font-black font-sans uppercase tracking-tight">
              Computer-Based Test (CBT) Instructions
            </h1>
            <p className="text-blue-100 text-sm max-w-2xl font-medium">
              Please read the official examination directives carefully before launching your secure simulation terminal.
            </p>
          </div>
        </div>

        {/* Exam Summary Header Ribbon */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 sm:px-8 py-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="border-r border-slate-200 last:border-0 pr-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Exam Subject</span>
            <span className="text-xs font-extrabold text-[#003366] truncate block mt-0.5">{exam.title}</span>
          </div>
          <div className="border-r border-slate-200 last:border-0 pr-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Duration Allowed</span>
            <span className="text-xs font-extrabold text-[#003366] block mt-0.5">{exam.duration} Minutes</span>
          </div>
          <div className="border-r border-slate-200 last:border-0 pr-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Items</span>
            <span className="text-xs font-extrabold text-[#003366] block mt-0.5">{exam.totalQuestions} Questions</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Passing Score</span>
            <span className="text-xs font-extrabold text-[#0F8B4C] block mt-0.5">{exam.passingScore}% (Min)</span>
          </div>
        </div>

        {/* Detailed Instructions List */}
        <div className="p-6 sm:p-8 space-y-8">
          
          {/* Section 1: Crucial Warnings (Anti-Cheating) */}
          <div className="bg-red-50/50 border border-red-200 rounded-lg p-5 space-y-3">
            <div className="flex items-center gap-2.5 text-[#C62828]">
              <ShieldAlert className="h-5.5 w-5.5 shrink-0" />
              <h3 className="font-extrabold text-sm uppercase tracking-wider">Strict Security Protocol</h3>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              This simulator enforces high-stakes recruitment examination integrity rules. The following events are logged in real-time as **Security Violations**:
            </p>
            <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <li>
                <b>Switching Tabs:</b> Opening another tab or browser window will trigger an immediate popup warning.
              </li>
              <li>
                <b>Losing Window Focus:</b> Minimizing, resizing, or clicking outside the exam browser viewports.
              </li>
              <li>
                <b>System Penalties:</b> Exceeding <b>3 security violations</b> will trigger an <b>automatic submission</b> of your answers, immediately grading whatever is completed.
              </li>
            </ul>
          </div>

          {/* Section 2: Core CBT Guidelines */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-l-4 border-[#003366] pl-2">
              Standard Testing Directives
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="border border-slate-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-[#005A9C]">
                  <Clock className="h-4 w-4 shrink-0" />
                  <h4 className="font-bold text-xs uppercase tracking-wide">Automatic Time Control</h4>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  A countdown timer is displayed. When the time hits zero, your paper is instantly captured and submitted for grading.
                </p>
              </div>

              <div className="border border-slate-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-[#0F8B4C]">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <h4 className="font-bold text-xs uppercase tracking-wide">Real-time Auto-Save</h4>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Every answer click is synchronized directly with the database. In case of browser crash or network drop, you can safely log back in and resume.
                </p>
              </div>

              <div className="border border-slate-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-[#F9A825]">
                  <ListOrdered className="h-4 w-4 shrink-0" />
                  <h4 className="font-bold text-xs uppercase tracking-wide">Question Navigation Palette</h4>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  You can jump to any question using the grid palette. You may also "Mark for Review" if you wish to analyze a question later.
                </p>
              </div>

              <div className="border border-slate-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-purple-700">
                  <Award className="h-4 w-4 shrink-0" />
                  <h4 className="font-bold text-xs uppercase tracking-wide">Conferred Certification</h4>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Scoring above the passing threshold immediately generates a verifiable completion certificate with a QR verification code.
                </p>
              </div>

            </div>
          </div>

          {/* Section 3: Exam Structure Details */}
          {exam.subjects && exam.subjects.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-l-4 border-[#0F8B4C] pl-2">
                Subject-Wise Blueprint Coverage
              </h3>
              <p className="text-xs text-slate-500">
                This mock test includes specialized questions distributed across the following disciplines:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {exam.subjects.map((sub, i) => (
                  <span key={i} className="bg-slate-100 border text-slate-700 text-[10px] font-mono font-bold px-3 py-1.5 rounded uppercase tracking-wide">
                    {sub}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Declaration Statement Checkbox */}
          <div className="border-t border-slate-200 pt-6 space-y-4">
            <label className="relative flex items-start gap-3 bg-slate-50 p-4 rounded border border-slate-200 cursor-pointer hover:bg-slate-100/50 transition">
              <div className="flex items-center h-5">
                <input
                  id="instructions-declared-checkbox"
                  type="checkbox"
                  checked={declared}
                  onChange={(e) => setDeclared(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-slate-300 text-[#003366] focus:ring-[#003366] cursor-pointer"
                />
              </div>
              <div className="text-xs leading-normal">
                <span className="font-extrabold text-slate-800 uppercase tracking-wide block mb-1">Honor Code Confirmation</span>
                <span className="text-slate-500">
                  I hereby declare that I will complete this assessment independently and without reference to external materials, internet searches, or unauthorized assistance. I understand that my window interactions and focus events are audited for platform compliance.
                </span>
              </div>
            </label>
          </div>

        </div>

        {/* Footer Actions Panel */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 sm:px-8 py-4.5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <button
            id="instructions-cancel-btn"
            onClick={onCancel}
            className="w-full sm:w-auto text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-wider py-2.5 px-5 flex items-center justify-center gap-2 cursor-pointer transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Cancel and Return</span>
          </button>

          <button
            id="instructions-begin-btn"
            onClick={onStart}
            disabled={!declared || loading}
            className={`w-full sm:w-auto text-xs font-extrabold text-white uppercase tracking-widest py-3 px-8 rounded shadow transition flex items-center justify-center gap-2 cursor-pointer ${
              declared && !loading
                ? "bg-[#0F8B4C] hover:bg-green-700 border border-green-800"
                : "bg-slate-300 border border-slate-300 cursor-not-allowed text-slate-500"
            }`}
          >
            {loading ? (
              <span>Initializing secure tunnel...</span>
            ) : (
              <>
                <span>Begin Examination Console</span>
                <Play className="h-3.5 w-3.5 fill-current" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
