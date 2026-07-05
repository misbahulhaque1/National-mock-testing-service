/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Building2, Plus, ShieldCheck, AlertTriangle, FileText, Database, 
  Settings, UserCheck, BarChart2, CheckCircle, BrainCircuit, Sparkles, 
  Trash2, Edit3, Eye, FileDown 
} from "lucide-react";
import { AuditLog, SystemSettings, ExamCategory, QuestionType } from "../types";

export default function AdminPanel() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [activeAdminTab, setActiveAdminTab] = useState<"dashboard" | "create-exam" | "smart-import" | "ai-generator" | "logs" | "settings">("dashboard");

  // Manual exam creation state
  const [examTitle, setExamTitle] = useState("");
  const [examDesc, setExamDesc] = useState("");
  const [examCategory, setExamCategory] = useState<ExamCategory>(ExamCategory.APTITUDE_TEST);
  const [examDuration, setExamDuration] = useState("30");
  const [examPassScore, setExamPassScore] = useState("50");
  const [examNegValue, setExamNegValue] = useState("0.25");
  const [examDifficulty, setExamDifficulty] = useState("Medium");
  const [manualQuestions, setManualQuestions] = useState<any[]>([
    { text: "", type: "single_correct", options: ["", "", "", ""], correctAnswer: "0", explanation: "" }
  ]);

  // AI Generator state
  const [aiTopic, setAiTopic] = useState("Pakistan Affairs & History");
  const [aiCategory, setAiCategory] = useState("Government Job");
  const [aiCount, setAiCount] = useState("5");
  const [aiDifficulty, setAiDifficulty] = useState("Medium");
  const [aiGeneratedList, setAiGeneratedList] = useState<any[]>([]);
  const [generatingAI, setGeneratingAI] = useState(false);

  // Smart PDF Import state
  const [pdfTextContent, setPdfTextContent] = useState("");
  const [pdfExamTitle, setPdfExamTitle] = useState("Syllabus MCQ Entry Exam");
  const [importedQuestionsList, setImportedQuestionsList] = useState<any[]>([]);
  const [importingPDF, setImportingPDF] = useState(false);
  const [importStatus, setImportStatus] = useState<any>(null);

  useEffect(() => {
    fetchAdminData();
  }, [activeAdminTab]);

  const fetchAdminData = async () => {
    try {
      const analyticsRes = await fetch("/api/admin/analytics");
      const analyticsData = await analyticsRes.json();
      setAnalytics(analyticsData);
      setSettings(analyticsData.settings);

      const logsRes = await fetch("/api/admin/logs");
      const logsData = await logsRes.json();
      setLogs(logsData);
    } catch (err) {
      console.error("Error fetching admin statistics", err);
    }
  };

  const handleUpdateSettings = async (updatedFields: Partial<SystemSettings>) => {
    if (!settings) return;
    const nextSettings = { ...settings, ...updatedFields };
    setSettings(nextSettings);

    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextSettings)
      });
      fetchAdminData();
    } catch (err) {
      console.error("Failed to update global rules", err);
    }
  };

  const handleAddManualQuestion = () => {
    setManualQuestions([
      ...manualQuestions,
      { text: "", type: "single_correct", options: ["", "", "", ""], correctAnswer: "0", explanation: "" }
    ]);
  };

  const handleRemoveManualQuestion = (idx: number) => {
    setManualQuestions(manualQuestions.filter((_, i) => i !== idx));
  };

  const handleUpdateManualQuestion = (idx: number, field: string, value: any) => {
    const list = [...manualQuestions];
    list[idx][field] = value;
    setManualQuestions(list);
  };

  const handleUpdateManualOption = (qIdx: number, optIdx: number, value: string) => {
    const list = [...manualQuestions];
    list[qIdx].options[optIdx] = value;
    setManualQuestions(list);
  };

  const handleCreateExamSubmit = async (e: React.FormEvent, questionsListSource: any[] = manualQuestions, customTitle: string = examTitle) => {
    e.preventDefault();

    if (!customTitle) {
      alert("Please provide a valid exam title.");
      return;
    }

    try {
      const res = await fetch("/api/admin/exams/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: customTitle,
          description: examDesc || `Diagnostic mock test series for ${customTitle}`,
          category: examCategory,
          duration: examDuration,
          passingScore: examPassScore,
          negativeMarkingValue: examNegValue,
          difficulty: examDifficulty,
          questions: questionsListSource
        })
      });

      if (res.ok) {
        alert("Exam & Question Schema Published Successfully into NMTS Registry!");
        // reset form
        setExamTitle("");
        setExamDesc("");
        setManualQuestions([{ text: "", type: "single_correct", options: ["", "", "", ""], correctAnswer: "0", explanation: "" }]);
        setActiveAdminTab("dashboard");
      } else {
        alert("Publishing failed.");
      }
    } catch (err) {
      console.error("Failed to upload manual exam", err);
    }
  };

  // AI Generator trigger
  const triggerAIGeneration = async () => {
    setGeneratingAI(true);
    setAiGeneratedList([]);
    try {
      const res = await fetch("/api/admin/questions/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiTopic,
          category: aiCategory,
          count: aiCount,
          difficulty: aiDifficulty
        })
      });
      const data = await res.json();
      if (res.ok && data.questions) {
        setAiGeneratedList(data.questions);
      } else {
        alert(data.error || "AI generation failed.");
      }
    } catch (err) {
      alert("Handshake with Gemini server failed.");
    } finally {
      setGeneratingAI(false);
    }
  };

  // Smart PDF Import Trigger
  const triggerPDFImport = async () => {
    if (!pdfTextContent.trim()) {
      alert("Please paste text containing MCQ transcripts from your PDF document.");
      return;
    }

    setImportingPDF(true);
    setImportedQuestionsList([]);
    setImportStatus(null);

    try {
      const res = await fetch("/api/admin/smart-pdf-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfTextContent,
          examTitle: pdfExamTitle
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setImportedQuestionsList(data.questions);
        setImportStatus(data.metadata);
      } else {
        alert(data.error || "Smart Import parsing failed.");
      }
    } catch (err) {
      alert("Smart PDF importer communication failed.");
    } finally {
      setImportingPDF(false);
    }
  };

  const handlePublishImportedExam = (e: React.FormEvent) => {
    handleCreateExamSubmit(e, importedQuestionsList, pdfExamTitle);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 select-none">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left sidebar: Admin Tab controls */}
        <div className="bg-[#003366] text-white p-5 rounded-lg border border-slate-700 shadow-lg space-y-4 self-start">
          <div className="flex items-center gap-2 border-b border-blue-900 pb-3">
            <Building2 className="h-5 w-5 text-[#0F8B4C]" />
            <span className="font-bold text-sm uppercase tracking-wider">Instructor Control</span>
          </div>
          <nav className="flex flex-col gap-1.5 text-xs font-semibold">
            <button
              id="admin-tab-dashboard"
              onClick={() => setActiveAdminTab("dashboard")}
              className={`w-full text-left px-3 py-2.5 rounded transition cursor-pointer flex items-center gap-2 ${
                activeAdminTab === "dashboard" ? "bg-[#005A9C] text-white" : "text-blue-100 hover:bg-slate-800"
              }`}
            >
              <BarChart2 className="h-4 w-4" />
              <span>Metrics & Analytics</span>
            </button>
            <button
              id="admin-tab-create"
              onClick={() => setActiveAdminTab("create-exam")}
              className={`w-full text-left px-3 py-2.5 rounded transition cursor-pointer flex items-center gap-2 ${
                activeAdminTab === "create-exam" ? "bg-[#005A9C] text-white" : "text-blue-100 hover:bg-slate-800"
              }`}
            >
              <Plus className="h-4 w-4" />
              <span>Create Custom Mock Test</span>
            </button>
            <button
              id="admin-tab-smart-import"
              onClick={() => setActiveAdminTab("smart-import")}
              className={`w-full text-left px-3 py-2.5 rounded transition cursor-pointer flex items-center gap-2 ${
                activeAdminTab === "smart-import" ? "bg-[#005A9C] text-white" : "text-blue-100 hover:bg-slate-800"
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Smart PDF MCQ Importer</span>
            </button>
            <button
              id="admin-tab-ai"
              onClick={() => setActiveAdminTab("ai-generator")}
              className={`w-full text-left px-3 py-2.5 rounded transition cursor-pointer flex items-center gap-2 ${
                activeAdminTab === "ai-generator" ? "bg-[#005A9C] text-white" : "text-blue-100 hover:bg-slate-800"
              }`}
            >
              <BrainCircuit className="h-4 w-4" />
              <span>AI Question Builder</span>
            </button>
            <button
              id="admin-tab-logs"
              onClick={() => setActiveAdminTab("logs")}
              className={`w-full text-left px-3 py-2.5 rounded transition cursor-pointer flex items-center gap-2 ${
                activeAdminTab === "logs" ? "bg-[#005A9C] text-white" : "text-blue-100 hover:bg-slate-800"
              }`}
            >
              <Database className="h-4 w-4" />
              <span>National Audit Trails</span>
            </button>
            <button
              id="admin-tab-settings"
              onClick={() => setActiveAdminTab("settings")}
              className={`w-full text-left px-3 py-2.5 rounded transition cursor-pointer flex items-center gap-2 ${
                activeAdminTab === "settings" ? "bg-[#005A9C] text-white" : "text-blue-100 hover:bg-slate-800"
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>CBT Exam Security Config</span>
            </button>
          </nav>
        </div>

        {/* Right workspace panel */}
        <div className="lg:col-span-3">
          
          {/* Tabs Workspace 1: Metrics & General statistics */}
          {activeAdminTab === "dashboard" && analytics && (
            <div className="space-y-6">
              
              {/* Analytics Badges */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-lg border border-[#D8DEE9] shadow-sm text-center">
                  <UserCheck className="h-6 w-6 text-[#003366] mx-auto mb-1.5" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Registered</p>
                  <h4 className="text-xl font-black text-[#003366] mt-0.5">{analytics.totalUsers} Candidates</h4>
                </div>
                <div className="bg-white p-5 rounded-lg border border-[#D8DEE9] shadow-sm text-center">
                  <FileText className="h-6 w-6 text-[#0F8B4C] mx-auto mb-1.5" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Mocks</p>
                  <h4 className="text-xl font-black text-[#0F8B4C] mt-0.5">{analytics.totalExams} Mocks</h4>
                </div>
                <div className="bg-white p-5 rounded-lg border border-[#D8DEE9] shadow-sm text-center">
                  <Sparkles className="h-6 w-6 text-[#F9A825] mx-auto mb-1.5" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg Percentile</p>
                  <h4 className="text-xl font-black text-[#F9A825] mt-0.5">{analytics.averageScore} points</h4>
                </div>
                <div className="bg-white p-5 rounded-lg border border-[#D8DEE9] shadow-sm text-center">
                  <ShieldCheck className="h-6 w-6 text-[#C62828] mx-auto mb-1.5" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Qualify Rate</p>
                  <h4 className="text-xl font-black text-[#C62828] mt-0.5">{analytics.passRate}% Passed</h4>
                </div>
              </div>

              {/* Security Audit logs summaries */}
              <div className="bg-white p-6 rounded-lg border border-[#D8DEE9] shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-slate-900 border-l-4 border-[#C62828] pl-2.5 uppercase tracking-wider">
                  Live CBT Security Audit Trails
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 text-xs text-left">
                    <thead>
                      <tr className="bg-slate-50 font-bold text-slate-600">
                        <th className="px-4 py-3">Timestamp</th>
                        <th className="px-4 py-3">Identity Context</th>
                        <th className="px-4 py-3">Logged Actions</th>
                        <th className="px-4 py-3">Sub-Elements Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {analytics.recentLogs.map((log: any) => (
                        <tr id={`admin-dashboard-log-row-${log.id}`} key={log.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-mono text-slate-400">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-700">
                            {log.userName}
                            <span className="block text-[10px] font-normal font-mono text-slate-400 uppercase">{log.userRole}</span>
                          </td>
                          <td className="px-4 py-3 font-bold text-[#005A9C]">
                            {log.action}
                          </td>
                          <td className="px-4 py-3 text-slate-500 leading-snug">
                            {log.details}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tabs Workspace 2: Create Custom Mock Test form */}
          {activeAdminTab === "create-exam" && (
            <form onSubmit={handleCreateExamSubmit} className="bg-white p-6 rounded-lg border border-[#D8DEE9] shadow-sm space-y-6">
              <h3 className="text-base font-bold text-[#003366] border-b border-slate-100 pb-3 uppercase tracking-wider">
                Exam Blueprint Configurator
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mock Exam Title</label>
                  <input
                    id="new-exam-title-input"
                    type="text"
                    required
                    placeholder="e.g. CSS-MPT English Grammar"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    className="w-full text-xs rounded border border-slate-300 p-2.5 focus:border-[#003366] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category Domain</label>
                  <select
                    id="new-exam-category-select"
                    value={examCategory}
                    onChange={(e) => setExamCategory(e.target.value as ExamCategory)}
                    className="w-full text-xs rounded border border-slate-300 p-2.5 bg-slate-50 focus:outline-none"
                  >
                    <option value={ExamCategory.GOVERNMENT_JOB}>Government Job Mock Exams</option>
                    <option value={ExamCategory.UNIVERSITY_ENTRY}>University Entry Test Preparation</option>
                    <option value={ExamCategory.PUBLIC_SERVICE}>Public Service Commission</option>
                    <option value={ExamCategory.SCHOLARSHIP}>Scholarship Exams</option>
                    <option value={ExamCategory.APTITUDE_TEST}>General Aptitude Tests</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Duration (Min)</label>
                  <input
                    id="new-exam-duration-input"
                    type="number"
                    value={examDuration}
                    onChange={(e) => setExamDuration(e.target.value)}
                    className="w-full text-xs rounded border border-slate-300 p-2.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Passing Mark pts</label>
                  <input
                    id="new-exam-passing-input"
                    type="number"
                    value={examPassScore}
                    onChange={(e) => setExamPassScore(e.target.value)}
                    className="w-full text-xs rounded border border-slate-300 p-2.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Negative Marking / Wrong</label>
                  <input
                    id="new-exam-negative-input"
                    type="text"
                    value={examNegValue}
                    onChange={(e) => setExamNegValue(e.target.value)}
                    className="w-full text-xs rounded border border-slate-300 p-2.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Difficulty level</label>
                  <select
                    id="new-exam-difficulty-select"
                    value={examDifficulty}
                    onChange={(e) => setExamDifficulty(e.target.value)}
                    className="w-full text-xs rounded border border-slate-300 p-2.5 bg-slate-50 focus:outline-none"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* Questions elements lists builder */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-t border-slate-100 pt-5">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Exam Questions Lists
                  </h4>
                  <button
                    id="add-question-btn"
                    type="button"
                    onClick={handleAddManualQuestion}
                    className="bg-[#0F8B4C] hover:bg-green-700 text-white font-bold py-1.5 px-3 rounded text-[10px] uppercase cursor-pointer"
                  >
                    Add Question Item
                  </button>
                </div>

                {manualQuestions.map((q, idx) => (
                  <div 
                    id={`manual-question-form-${idx}`}
                    key={idx} 
                    className="border border-[#D8DEE9] bg-slate-50/50 rounded-lg p-5 space-y-4 relative"
                  >
                    <button
                      id={`remove-question-btn-${idx}`}
                      type="button"
                      onClick={() => handleRemoveManualQuestion(idx)}
                      disabled={manualQuestions.length === 1}
                      className="absolute top-4 right-4 text-[#C62828] hover:underline text-xs cursor-pointer disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <span className="font-bold text-[#003366] text-xs">Question {idx + 1} Statement</span>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Question Text</label>
                      <input
                        id={`q-text-input-${idx}`}
                        type="text"
                        required
                        placeholder="e.g. What is the molecular formula of water?"
                        value={q.text}
                        onChange={(e) => handleUpdateManualQuestion(idx, "text", e.target.value)}
                        className="w-full text-xs rounded border border-slate-300 p-2 bg-white focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Question Type</label>
                        <select
                          id={`q-type-select-${idx}`}
                          value={q.type}
                          onChange={(e) => handleUpdateManualQuestion(idx, "type", e.target.value)}
                          className="w-full text-xs rounded border border-slate-300 p-2 bg-white focus:outline-none"
                        >
                          <option value="single_correct">Single MCQ (4 Options)</option>
                          <option value="true_false">True / False</option>
                          <option value="fill_blank">Fill In Blanks</option>
                          <option value="short_answer">Short Answers</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Correct Answer Index / Exact String</label>
                        <input
                          id={`q-correct-input-${idx}`}
                          type="text"
                          required
                          placeholder="e.g. '0' for Option A, or 'H2O' for Blanks"
                          value={q.correctAnswer}
                          onChange={(e) => handleUpdateManualQuestion(idx, "correctAnswer", e.target.value)}
                          className="w-full text-xs rounded border border-slate-300 p-2 bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {q.type === "single_correct" && (
                      <div className="grid grid-cols-2 gap-3">
                        {q.options.map((opt: string, oIdx: number) => (
                          <div id={`option-form-container-${idx}-${oIdx}`} key={oIdx}>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Option {oIdx + 1}</label>
                            <input
                              id={`q-option-input-${idx}-${oIdx}`}
                              type="text"
                              required
                              placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                              value={opt}
                              onChange={(e) => handleUpdateManualOption(idx, oIdx, e.target.value)}
                              className="w-full text-xs rounded border border-slate-200 p-1.5 bg-white focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                id="publish-exam-btn"
                type="submit"
                className="w-full bg-[#003366] hover:bg-blue-900 text-white font-bold py-3 rounded text-xs tracking-wider uppercase transition shadow border border-blue-900 cursor-pointer"
              >
                Publish Exam Blueprint & Deploy Online
              </button>
            </form>
          )}

          {/* Tabs Workspace 3: Smart PDF MCQ Importer */}
          {activeAdminTab === "smart-import" && (
            <div className="bg-white p-6 rounded-lg border border-[#D8DEE9] shadow-sm space-y-6">
              <div className="flex gap-2 items-center border-b border-slate-100 pb-3">
                <BrainCircuit className="h-5 w-5 text-[#003366]" />
                <h3 className="text-base font-bold text-[#003366] uppercase tracking-wider">
                  Smart PDF MCQ Importer (Gemini AI Validated)
                </h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Paste raw textual content containing exam MCQs extracted from a document. The Gemini parser will automatically extract questions, compile structured options, deduce correct answer indices, assign difficulty levels, and output a draft preview.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Exam Title</label>
                  <input
                    id="smart-import-exam-title-input"
                    type="text"
                    value={pdfExamTitle}
                    onChange={(e) => setPdfExamTitle(e.target.value)}
                    className="w-full text-xs rounded border border-slate-300 p-2.5 focus:border-[#003366] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Paste PDF Text Content</label>
                  <textarea
                    id="smart-import-pdf-textarea"
                    rows={8}
                    placeholder="Example:
1. What is Pakistan's national flower?
A) Jasmine B) Rose C) Tulip D) Lotus
Correct: A
Explanation: Jasmine is the national flower."
                    value={pdfTextContent}
                    onChange={(e) => setPdfTextContent(e.target.value)}
                    className="w-full text-xs rounded border border-slate-300 p-3 bg-slate-50 font-mono focus:outline-none"
                  />
                </div>

                <button
                  id="trigger-pdf-import-btn"
                  onClick={triggerPDFImport}
                  disabled={importingPDF}
                  className="w-full bg-[#0F8B4C] hover:bg-green-700 text-white font-bold py-2.5 rounded text-xs tracking-wider uppercase transition cursor-pointer flex justify-center items-center gap-1.5"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{importingPDF ? "Gemini parsing and structuring data..." : "Trigger AI Smart PDF Import"}</span>
                </button>
              </div>

              {/* Parsed Output Preview */}
              {importedQuestionsList.length > 0 && (
                <div className="border-t border-slate-200 pt-6 space-y-6">
                  <div className="flex justify-between items-center bg-green-50 p-4 rounded-lg border border-green-200">
                    <div>
                      <h4 className="font-bold text-[#0F8B4C] text-xs uppercase">AI Extraction Sandbox Preview</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Parsed {importedQuestionsList.length} Questions successfully. Verify options below.</p>
                    </div>
                    <button
                      id="save-smart-import-btn"
                      onClick={handlePublishImportedExam}
                      className="bg-[#003366] hover:bg-blue-900 text-white font-bold py-2 px-4 rounded text-xs transition uppercase tracking-wider cursor-pointer"
                    >
                      Publish Exam Draft
                    </button>
                  </div>

                  <div className="space-y-4">
                    {importedQuestionsList.map((q, qIdx) => (
                      <div 
                        id={`imported-question-card-${qIdx}`}
                        key={qIdx} 
                        className="border border-slate-200 rounded p-4 space-y-3 bg-slate-50/50"
                      >
                        <p className="font-bold text-slate-800 text-xs">{qIdx + 1}. {q.text}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pl-3">
                          {q.options.map((opt: string, oIdx: number) => (
                            <span key={oIdx} className={String(oIdx) === String(q.correctAnswer) ? "text-[#0F8B4C] font-bold" : ""}>
                              {String.fromCharCode(65 + oIdx)}) {opt}
                            </span>
                          ))}
                        </div>
                        <p className="text-[10px] text-[#005A9C] font-semibold">Subject: {q.subject} • Topic: {q.topic} • Solve Time: {q.estimatedSolveTime}s</p>
                        <p className="text-[10px] text-slate-400 italic">Explanation: {q.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tabs Workspace 4: AI Question Builder */}
          {activeAdminTab === "ai-generator" && (
            <div className="bg-white p-6 rounded-lg border border-[#D8DEE9] shadow-sm space-y-6">
              <div className="flex gap-2 items-center border-b border-slate-100 pb-3">
                <BrainCircuit className="h-5 w-5 text-[#003366]" />
                <h3 className="text-base font-bold text-[#003366] uppercase tracking-wider">
                  AI Question Builder (Powered by Gemini 3.5 Flash)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Subject Topic</label>
                  <input
                    id="ai-topic-input"
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    className="w-full text-xs rounded border border-slate-300 p-2.5 focus:border-[#003366] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Number of Questions</label>
                  <select
                    id="ai-count-select"
                    value={aiCount}
                    onChange={(e) => setAiCount(e.target.value)}
                    className="w-full text-xs rounded border border-slate-300 p-2.5 bg-slate-50 focus:outline-none"
                  >
                    <option value="3">3 Questions</option>
                    <option value="5">5 Questions</option>
                    <option value="8">8 Questions</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Domain Category</label>
                  <select
                    id="ai-category-select"
                    value={aiCategory}
                    onChange={(e) => setAiCategory(e.target.value)}
                    className="w-full text-xs rounded border border-slate-300 p-2.5 bg-slate-50 focus:outline-none"
                  >
                    <option value="Government Job">Government Job Mock</option>
                    <option value="University Entry">University Entry Tests</option>
                    <option value="Aptitude Exams">General Aptitude Mock</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Difficulty classification</label>
                  <select
                    id="ai-difficulty-select"
                    value={aiDifficulty}
                    onChange={(e) => setAiDifficulty(e.target.value)}
                    className="w-full text-xs rounded border border-slate-300 p-2.5 bg-slate-50 focus:outline-none"
                  >
                    <option value="Easy">Easy Level</option>
                    <option value="Medium">Medium Level</option>
                    <option value="Hard">Hard Level</option>
                  </select>
                </div>
              </div>

              <button
                id="generate-ai-btn"
                onClick={triggerAIGeneration}
                disabled={generatingAI}
                className="w-full bg-[#003366] hover:bg-blue-900 text-white font-bold py-2.5 rounded text-xs tracking-wider uppercase transition cursor-pointer flex justify-center items-center gap-1.5"
              >
                <Sparkles className="h-4 w-4" />
                <span>{generatingAI ? "Formulating questions using Gemini API..." : "Trigger AI Generation"}</span>
              </button>

              {/* AI outputs layout */}
              {aiGeneratedList.length > 0 && (
                <div className="border-t border-slate-200 pt-6 space-y-6">
                  <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div>
                      <h4 className="font-bold text-[#003366] text-xs uppercase">AI Generated Sandbox Draft</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Vetted {aiGeneratedList.length} Questions perfectly structured.</p>
                    </div>
                    <button
                      id="save-ai-generated-exam-btn"
                      onClick={(e) => handleCreateExamSubmit(e, aiGeneratedList, `AI Generated ${aiTopic}`)}
                      className="bg-[#0F8B4C] hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-xs transition uppercase tracking-wider cursor-pointer"
                    >
                      Publish Exam Schema
                    </button>
                  </div>

                  <div className="space-y-4">
                    {aiGeneratedList.map((q, qIdx) => (
                      <div 
                        id={`ai-question-card-${qIdx}`}
                        key={qIdx} 
                        className="border border-slate-200 rounded p-4 space-y-3 bg-slate-50/50"
                      >
                        <p className="font-bold text-slate-800 text-xs">{qIdx + 1}. {q.text}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pl-3">
                          {q.options.map((opt: string, oIdx: number) => (
                            <span key={oIdx} className={String(oIdx) === String(q.correctAnswer) ? "text-[#0F8B4C] font-bold" : ""}>
                              {String.fromCharCode(65 + oIdx)}) {opt}
                            </span>
                          ))}
                        </div>
                        <p className="text-[10px] text-[#005A9C] font-semibold">Subject: {q.subject} • Topic: {q.topic} • Difficulty: {q.difficulty}</p>
                        <p className="text-[10px] text-slate-400 italic">Explanation: {q.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tabs Workspace 5: Audit logs exploration list */}
          {activeAdminTab === "logs" && (
            <div className="bg-white p-6 rounded-lg border border-[#D8DEE9] shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#003366] border-b border-slate-100 pb-3 uppercase tracking-wider">
                CBT Security Registry Logs
              </h3>
              <div className="space-y-3">
                {logs.map(log => (
                  <div 
                    id={`audit-log-item-${log.id}`}
                    key={log.id} 
                    className="border border-slate-150 rounded p-4 bg-slate-50/50 text-xs space-y-2 flex justify-between items-start gap-4"
                  >
                    <div>
                      <div className="flex gap-2 items-center text-[#005A9C] font-bold">
                        <span>{log.action}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-400 font-mono font-normal">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-600 font-medium mt-1">Operator: {log.userName} ({log.userRole})</p>
                      <p className="text-slate-500 mt-1 leading-relaxed">Details: {log.details}</p>
                    </div>
                    <div className="text-right text-[10px] font-mono text-slate-400">
                      <span>IP: {log.ipAddress}</span> <br />
                      <span>{log.browser.substring(0, 30)}...</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabs Workspace 6: Security rules settings config */}
          {activeAdminTab === "settings" && settings && (
            <div className="bg-white p-6 rounded-lg border border-[#D8DEE9] shadow-sm space-y-6">
              <h3 className="text-base font-bold text-[#003366] border-b border-slate-100 pb-3 uppercase tracking-wider">
                Exam Security & Control Configurator
              </h3>

              <div className="space-y-4 text-xs">
                <div className="flex justify-between items-center border-b pb-4">
                  <div>
                    <h5 className="font-bold text-slate-800">High-Stakes Anti-Cheat strictness level</h5>
                    <p className="text-slate-500 mt-0.5">Controls frequency of window blurs logging and browser checks.</p>
                  </div>
                  <select
                    id="settings-strictness-select"
                    value={settings.antiCheatingStrictness}
                    onChange={(e) => handleUpdateSettings({ antiCheatingStrictness: e.target.value as any })}
                    className="rounded border p-2 bg-slate-50 font-bold focus:outline-none"
                  >
                    <option value="low">Low Strictness</option>
                    <option value="medium">Medium Strictness</option>
                    <option value="high">High Strictness (Aggressive Logging)</option>
                  </select>
                </div>

                <div className="flex justify-between items-center border-b pb-4">
                  <div>
                    <h5 className="font-bold text-slate-800">Auto-Submit Paper on Security Violations</h5>
                    <p className="text-slate-500 mt-0.5">Enforces automatic submissions when candidate switches tabs exceeds limit.</p>
                  </div>
                  <input
                    id="settings-auto-submit-checkbox"
                    type="checkbox"
                    checked={settings.autoSubmitOnViolations}
                    onChange={(e) => handleUpdateSettings({ autoSubmitOnViolations: e.target.checked })}
                    className="h-4.5 w-4.5 rounded border-slate-300 text-[#003366]"
                  />
                </div>

                <div className="flex justify-between items-center border-b pb-4">
                  <div>
                    <h5 className="font-bold text-slate-800">Maximum Allowed Violations</h5>
                    <p className="text-slate-500 mt-0.5">Total tab shifts allowed before automatic submitting triggers.</p>
                  </div>
                  <input
                    id="settings-max-violations-input"
                    type="number"
                    value={settings.maxViolationsAllowed}
                    onChange={(e) => handleUpdateSettings({ maxViolationsAllowed: parseInt(e.target.value) })}
                    className="rounded border p-2 bg-slate-50 font-bold w-20 focus:outline-none"
                  />
                </div>

                <div className="flex justify-between items-center pb-2">
                  <div>
                    <h5 className="font-bold text-slate-800">Allow Self-Registration Console</h5>
                    <p className="text-slate-500 mt-0.5">Allows new candidate profiles to register instantly via OTP handshakes.</p>
                  </div>
                  <input
                    id="settings-self-registration-checkbox"
                    type="checkbox"
                    checked={settings.allowSelfRegistration}
                    onChange={(e) => handleUpdateSettings({ allowSelfRegistration: e.target.checked })}
                    className="h-4.5 w-4.5 rounded border-slate-300 text-[#003366]"
                  />
                </div>
              </div>

              <h3 className="text-base font-bold text-[#003366] border-b border-slate-100 pb-3 uppercase tracking-wider mt-8">
                Public CMS Website Management
              </h3>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Website Site Name</label>
                    <input
                      id="settings-site-name-input"
                      type="text"
                      value={settings.siteName || ""}
                      onChange={(e) => handleUpdateSettings({ siteName: e.target.value })}
                      className="w-full rounded border p-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#003366]"
                      placeholder="e.g. NATIONAL MOCK TESTING SERVICE (NMTS)"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Organization Name</label>
                    <input
                      id="settings-org-name-input"
                      type="text"
                      value={settings.orgName || ""}
                      onChange={(e) => handleUpdateSettings({ orgName: e.target.value })}
                      className="w-full rounded border p-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#003366]"
                      placeholder="e.g. National Mock Testing Service"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Footer Copyright Notice</label>
                  <input
                    id="settings-footer-text-input"
                    type="text"
                    value={settings.footerText || ""}
                    onChange={(e) => handleUpdateSettings({ footerText: e.target.value })}
                    className="w-full rounded border p-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#003366]"
                    placeholder="e.g. This platform is intended for mock examinations and practice tests."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Support Email Address</label>
                    <input
                      id="settings-contact-email-input"
                      type="email"
                      value={settings.contactEmail || ""}
                      onChange={(e) => handleUpdateSettings({ contactEmail: e.target.value })}
                      className="w-full rounded border p-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#003366]"
                      placeholder="e.g. contact@nmts-portal.org"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Support Helpline Phone</label>
                    <input
                      id="settings-contact-phone-input"
                      type="text"
                      value={settings.contactPhone || ""}
                      onChange={(e) => handleUpdateSettings({ contactPhone: e.target.value })}
                      className="w-full rounded border p-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#003366]"
                      placeholder="e.g. +92 51 0000000"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Physical Office Address</label>
                    <input
                      id="settings-contact-address-input"
                      type="text"
                      value={settings.contactAddress || ""}
                      onChange={(e) => handleUpdateSettings({ contactAddress: e.target.value })}
                      className="w-full rounded border p-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#003366]"
                      placeholder="e.g. Sector H-8, Islamabad"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Homepage Hero Banner Title</label>
                    <input
                      id="settings-hero-title-input"
                      type="text"
                      value={settings.heroTitle || ""}
                      onChange={(e) => handleUpdateSettings({ heroTitle: e.target.value })}
                      className="w-full rounded border p-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#003366]"
                      placeholder="e.g. NATIONAL DIAGNOSTIC PORTAL"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wide">Homepage Hero Banner Subtitle</label>
                    <input
                      id="settings-hero-subtitle-input"
                      type="text"
                      value={settings.heroSubtitle || ""}
                      onChange={(e) => handleUpdateSettings({ heroSubtitle: e.target.value })}
                      className="w-full rounded border p-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#003366]"
                      placeholder="e.g. Welcome to the Mock Examination Simulator."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
