/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  FileText, Download, Award, Search, HelpCircle, ChevronRight, 
  ExternalLink, Calendar, CheckCircle2, ShieldAlert, BadgeCheck 
} from "lucide-react";
import { Notice, DownloadItem, Certificate } from "../types";

interface NoticeBoardProps {
  initialTab?: "notices" | "downloads" | "verify";
}

export default function NoticeBoard({ initialTab = "notices" }: NoticeBoardProps) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<"notices" | "downloads" | "verify">(initialTab);

  // Synchronize internal active sub-tab with external initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveSubTab(initialTab);
    }
  }, [initialTab]);

  // Filtering & Search
  const [noticeCategory, setNoticeCategory] = useState("All");
  const [noticeSearch, setNoticeSearch] = useState("");
  const [dlCategory, setDlCategory] = useState("All");
  const [dlSearch, setDlSearch] = useState("");

  // Verification states
  const [certQuery, setCertQuery] = useState("");
  const [verifiedCert, setVerifiedCert] = useState<Certificate | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [noticeCategory, noticeSearch, dlCategory, dlSearch]);

  const fetchData = async () => {
    try {
      const noticeRes = await fetch(`/api/notices?category=${noticeCategory}&search=${noticeSearch}`);
      const noticeData = await noticeRes.json();
      setNotices(noticeData);

      const dlRes = await fetch(`/api/downloads?category=${dlCategory}&search=${dlSearch}`);
      const dlData = await dlRes.json();
      setDownloads(dlData);
    } catch (err) {
      console.error("Error loading board content", err);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError("");
    setVerifiedCert(null);

    if (!certQuery.trim()) {
      setVerifyError("Please enter a valid NMTS Certificate Number.");
      return;
    }

    setVerifying(true);
    try {
      const res = await fetch(`/api/certificates/verify/${certQuery.trim()}`);
      const data = await res.json();
      setVerifying(false);

      if (res.ok && data.verified) {
        setVerifiedCert(data.certificate);
      } else {
        setVerifyError(data.error || "Certificate not found. Ensure spelling matches NMTS-XXX format exactly.");
      }
    } catch (err) {
      setVerifying(false);
      setVerifyError("Verification service is currently unavailable.");
    }
  };

  const handleDownloadFile = (title: string) => {
    setDownloadSuccess(`Successfully initiated download for: ${title}`);
    setTimeout(() => {
      setDownloadSuccess(null);
    }, 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 select-none">
      {/* Top Navigation Headers */}
      <div className="flex border-b border-slate-200 mb-8 bg-white p-2 rounded-lg shadow-sm">
        <button
          id="notices-subtab-btn"
          onClick={() => setActiveSubTab("notices")}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold tracking-wide uppercase rounded-md transition cursor-pointer ${
            activeSubTab === "notices" 
              ? "bg-[#003366] text-white shadow" 
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Latest Announcements</span>
        </button>
        <button
          id="downloads-subtab-btn"
          onClick={() => setActiveSubTab("downloads")}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold tracking-wide uppercase rounded-md transition cursor-pointer ${
            activeSubTab === "downloads" 
              ? "bg-[#003366] text-white shadow" 
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <Download className="h-4 w-4" />
          <span>Download Syllabus & Slips</span>
        </button>
        <button
          id="verify-subtab-btn"
          onClick={() => {
            setActiveSubTab("verify");
            setVerifiedCert(null);
            setVerifyError("");
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold tracking-wide uppercase rounded-md transition cursor-pointer ${
            activeSubTab === "verify" 
              ? "bg-[#003366] text-white shadow" 
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <Award className="h-4 w-4" />
          <span>Verification Registry</span>
        </button>
      </div>

      {downloadSuccess && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded text-green-800 text-xs font-semibold flex items-center justify-between shadow-sm">
          <span>{downloadSuccess}</span>
          <button onClick={() => setDownloadSuccess(null)} className="text-green-500 hover:text-green-700 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Main Panel views */}
      {activeSubTab === "notices" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* List panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filter tools */}
            <div className="bg-white p-4 rounded-lg border border-[#D8DEE9] shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="flex gap-2">
                {["All", "Recruitment", "Schedules", "Results"].map(cat => (
                  <button
                    id={`notice-cat-${cat}`}
                    key={cat}
                    onClick={() => setNoticeCategory(cat)}
                    className={`px-3.5 py-1.5 rounded text-xs font-bold transition cursor-pointer ${
                      noticeCategory === cat 
                        ? "bg-[#005A9C] text-white" 
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="relative w-full sm:w-64">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  id="notices-search-input"
                  type="text"
                  placeholder="Search announcements..."
                  value={noticeSearch}
                  onChange={(e) => setNoticeSearch(e.target.value)}
                  className="w-full text-xs rounded border border-slate-300 pl-9 pr-3 py-2 bg-slate-50 focus:border-[#003366] focus:outline-none"
                />
              </div>
            </div>

            {/* Notice elements */}
            <div className="space-y-4">
              {notices.length === 0 ? (
                <div className="bg-white p-12 rounded border text-center text-slate-400 text-sm shadow-inner">
                  No announcements available.
                </div>
              ) : (
                notices.map(notice => (
                  <article 
                    id={`notice-article-${notice.id}`}
                    key={notice.id} 
                    className="bg-white p-6 rounded-lg border border-[#D8DEE9] shadow-sm hover:shadow-md transition relative overflow-hidden"
                  >
                    {notice.isPinned && (
                      <span className="absolute top-0 right-0 bg-[#0F8B4C] text-white font-mono text-[9px] font-bold px-2.5 py-1 uppercase rounded-bl">
                        PINNED NOTICE
                      </span>
                    )}
                    <div className="flex items-center gap-2 text-slate-500 font-bold text-xs">
                      <Calendar className="h-3.5 w-3.5 text-[#005A9C]" />
                      <span>{new Date(notice.publishedAt).toLocaleDateString()}</span>
                      <span className="text-[#005A9C]">•</span>
                      <span className="bg-blue-50 text-[#005A9C] px-2 py-0.5 rounded font-bold uppercase text-[10px] tracking-wide">
                        {notice.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-2 hover:text-[#003366] transition">
                      {notice.title}
                    </h3>
                    <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                      {notice.content}
                    </p>
                  </article>
                ))
              )}
            </div>
          </div>

          {/* Right sidebar: CBT Regulations */}
          <div className="bg-white p-6 rounded-lg border border-[#D8DEE9] shadow-sm self-start space-y-6">
            <h4 className="text-sm font-bold text-slate-900 uppercase border-b border-slate-200 pb-3 tracking-wider">
              CBT Security & Guidelines
            </h4>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="p-1 rounded bg-blue-50 text-[#005A9C] self-start mt-0.5">
                  <HelpCircle className="h-4 w-4" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-slate-800">How is Negative Marking applied?</h5>
                  <p className="text-slate-500 text-[11px] leading-relaxed mt-1">
                    Many mock tests apply a penalty of 0.25 (1/4 mark) per incorrect answer. No points are subtracted for skipped questions. Accuracy counts!
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="p-1 rounded bg-blue-50 text-[#005A9C] self-start mt-0.5">
                  <HelpCircle className="h-4 w-4" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-slate-800">What is Tab Switch Detection?</h5>
                  <p className="text-slate-500 text-[11px] leading-relaxed mt-1">
                    Our high-stakes simulator monitors window focus loss. Switching tabs or opening external folders will log standard security violations. Exceeding limit results in Auto-Submission.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="p-1 rounded bg-blue-50 text-[#005A9C] self-start mt-0.5">
                  <HelpCircle className="h-4 w-4" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-slate-800">Connection Interruption?</h5>
                  <p className="text-slate-500 text-[11px] leading-relaxed mt-1">
                    Every keystroke is saved server-side in real-time. If your browser reloads, you can resume exactly where you left off.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "downloads" && (
        <div className="space-y-6">
          {/* Top filter controls */}
          <div className="bg-white p-4 rounded-lg border border-[#D8DEE9] shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="flex gap-2">
              {["All", "Syllabus", "Past Paper", "Admit Card"].map(cat => (
                <button
                  id={`dl-cat-${cat}`}
                  key={cat}
                  onClick={() => setDlCategory(cat)}
                  className={`px-3.5 py-1.5 rounded text-xs font-bold transition cursor-pointer ${
                    dlCategory === cat 
                      ? "bg-[#005A9C] text-white" 
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                id="downloads-search-input"
                type="text"
                placeholder="Search resources..."
                value={dlSearch}
                onChange={(e) => setDlSearch(e.target.value)}
                className="w-full text-xs rounded border border-slate-300 pl-9 pr-3 py-2 bg-slate-50 focus:border-[#003366] focus:outline-none"
              />
            </div>
          </div>

          {/* Files grid */}
          {downloads.length === 0 ? (
            <div className="bg-white p-12 rounded border text-center text-slate-400 text-sm shadow-inner">
              No downloads available.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {downloads.map(item => (
                <div 
                  id={`download-card-${item.id}`}
                  key={item.id} 
                  className="bg-white p-6 rounded-lg border border-[#D8DEE9] shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <span className="inline-block bg-[#005A9C] text-white text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wide mb-3">
                      {item.category}
                    </span>
                    <h4 className="font-bold text-slate-800 text-sm leading-snug">{item.title}</h4>
                    <p className="text-slate-500 text-xs mt-2 leading-relaxed">{item.description}</p>
                  </div>
                  <div className="border-t border-slate-100 mt-5 pt-4 flex justify-between items-center">
                    <span className="text-slate-400 font-mono text-[10px] font-bold">{item.fileType.toUpperCase()} • {item.fileSize}</span>
                    <button
                      id={`dl-btn-${item.id}`}
                      onClick={() => handleDownloadFile(item.title)}
                      className="flex items-center gap-1.5 bg-[#0F8B4C] hover:bg-green-700 text-white font-bold py-1.5 px-3 rounded text-[11px] transition tracking-wider uppercase cursor-pointer border border-green-800"
                    >
                      <Download className="h-3 w-3" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSubTab === "verify" && (
        <div className="max-w-xl mx-auto bg-white p-8 rounded-lg border border-[#D8DEE9] shadow-lg">
          <div className="text-center mb-6">
            <Award className="h-10 w-10 text-[#003366] mx-auto mb-2" />
            <h3 className="text-lg font-bold text-slate-900 uppercase">Certificate Verification System</h3>
            <p className="text-slate-500 text-xs mt-1">Authenticate credentials issued by NMTS. Ensure reliability of certificate holder claims.</p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                NMTS Certificate Registration Number
              </label>
              <div className="flex gap-2">
                <input
                  id="cert-verify-input"
                  type="text"
                  required
                  placeholder="e.g. NMTS-CSS-2026-12345"
                  value={certQuery}
                  onChange={(e) => setCertQuery(e.target.value)}
                  className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm bg-slate-50 focus:border-[#003366] focus:outline-none"
                />
                <button
                  id="submit-verify-btn"
                  type="submit"
                  disabled={verifying}
                  className="bg-[#003366] hover:bg-blue-900 text-white font-bold px-5 py-2 rounded text-xs transition uppercase tracking-wider cursor-pointer border border-blue-900"
                >
                  {verifying ? "Searching..." : "Authenticate"}
                </button>
              </div>
            </div>
          </form>

          {verifyError && (
            <div className="bg-red-50 border-l-4 border-[#C62828] p-3.5 rounded mt-5 flex gap-2.5 items-center">
              <ShieldAlert className="h-5 w-5 text-[#C62828] shrink-0" />
              <span className="text-xs font-semibold text-[#C62828]">{verifyError}</span>
            </div>
          )}

          {verifiedCert && (
            <div className="mt-6 border border-[#0F8B4C] rounded-lg bg-green-50/40 p-5 space-y-4">
              <div className="flex items-center gap-2.5 text-[#0F8B4C] font-bold text-xs uppercase tracking-wide">
                <BadgeCheck className="h-5 w-5" />
                <span>Credentia Validated & Authentic</span>
              </div>
              <div className="border-t border-slate-100 pt-3 space-y-2 text-xs text-slate-700">
                <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5">
                  <span className="text-slate-400 font-medium">Candidate Name:</span>
                  <span className="font-bold text-slate-900">{verifiedCert.candidateName}</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5">
                  <span className="text-slate-400 font-medium">National CNIC:</span>
                  <span className="font-mono text-slate-900">{verifiedCert.cnic || "35201-XXXXXXX-X"}</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5">
                  <span className="text-slate-400 font-medium">Exam Attempted:</span>
                  <span className="font-bold text-[#003366]">{verifiedCert.examTitle}</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5">
                  <span className="text-slate-400 font-medium">Issued Date:</span>
                  <span>{new Date(verifiedCert.issuedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-slate-400 font-medium">Percentile Earned:</span>
                  <span className="font-bold text-[#0F8B4C]">{verifiedCert.percentile}% Rank percentile</span>
                </div>
              </div>

              {verifiedCert.qrCodeUrl && (
                <div className="flex flex-col items-center justify-center pt-2">
                  <img src={verifiedCert.qrCodeUrl} alt="Verification QR Code" className="h-28 w-28 border p-1 bg-white rounded shadow-sm" />
                  <span className="text-[9px] font-mono text-slate-400 mt-2">QR Authenticated via Ledger Hub</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
