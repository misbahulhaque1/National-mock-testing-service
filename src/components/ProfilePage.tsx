/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { User, ExamAttempt, Certificate } from "../types";
import { 
  User as UserIcon, Award, Clock, CheckCircle2, AlertTriangle, 
  BookOpen, Eye, ShieldCheck, ClipboardList, Target, BarChart2 
} from "lucide-react";

interface ProfilePageProps {
  currentUser: User;
  onViewResult: (attemptId: string) => void;
  onNavigate: (tab: string) => void;
}

export default function ProfilePage({ currentUser, onViewResult, onNavigate }: ProfilePageProps) {
  const [profileData, setProfileData] = useState<{
    user: User;
    attempts: ExamAttempt[];
    certificates: Certificate[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [currentUser.id]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/profile/${currentUser.id}`);
      const data = await res.json();
      setProfileData(data);
    } catch (err) {
      console.error("Error fetching candidate statistics", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !profileData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500 text-sm">
        Loading profile statistics... Please wait.
      </div>
    );
  }

  const { user, attempts, certificates } = profileData;

  // Analytical math calculations
  const totalMocks = attempts.length;
  const completedMocks = attempts.filter(a => a.status === "submitted").length;
  
  const avgAccuracy = completedMocks > 0
    ? Math.round(
        (attempts.reduce((acc, curr) => acc + (curr.correctCount || 0), 0) /
         (attempts.reduce((acc, curr) => acc + ((curr.correctCount || 0) + (curr.incorrectCount || 0)), 0) || 1)) * 100
      )
    : 0;

  const totalWarnings = attempts.reduce((acc, curr) => acc + curr.warningCount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 select-none">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Card: Personal Registry info */}
        <div className="bg-white p-6 rounded-lg border border-[#D8DEE9] shadow-sm self-start space-y-6">
          <div className="text-center pb-4 border-b border-slate-100">
            <div className="bg-[#003366] text-white p-4 inline-block rounded-full shadow-inner border-2 border-slate-200">
              <UserIcon className="h-12 w-12" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-3">{user.name}</h3>
            <p className="text-xs text-[#0F8B4C] font-bold uppercase tracking-widest mt-1">
              Registered Candidate
            </p>
          </div>

          <div className="space-y-3.5 text-xs text-slate-700">
            <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-400 font-medium">National CNIC:</span>
              <span className="font-mono font-bold text-slate-900">{user.cnic || "35201-9876543-1"}</span>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-400 font-medium">Primary Email:</span>
              <span className="font-semibold text-slate-900">{user.email}</span>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-400 font-medium">Registration Date:</span>
              <span>{new Date(user.registrationDate).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-400 font-medium">Portal Security Group:</span>
              <span className="bg-blue-50 text-[#005A9C] font-mono px-2 py-0.5 rounded uppercase font-bold text-[10px]">
                {user.role}
              </span>
            </div>
            {user.lastLogin && (
              <div className="flex flex-col gap-1 pt-1">
                <span className="text-slate-400 font-medium">Recorded Device:</span>
                <span className="text-[10px] bg-slate-50 p-1.5 rounded text-slate-500 font-mono leading-relaxed">
                  IP: {user.ipAddress} <br />
                  UA: {user.browser?.substring(0, 45)}...
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebars: Analytics grid, Mocks history, Certificates lockers */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Diagnostic Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-[#D8DEE9] shadow-sm text-center">
              <ClipboardList className="h-6 w-6 text-[#003366] mx-auto mb-2" />
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Mocks Attempted</p>
              <h4 className="text-xl font-extrabold text-[#003366] mt-1">{totalMocks}</h4>
            </div>
            <div className="bg-white p-4 rounded-lg border border-[#D8DEE9] shadow-sm text-center">
              <Target className="h-6 w-6 text-[#0F8B4C] mx-auto mb-2" />
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Avg Accuracy</p>
              <h4 className="text-xl font-extrabold text-[#0F8B4C] mt-1">{avgAccuracy}%</h4>
            </div>
            <div className="bg-white p-4 rounded-lg border border-[#D8DEE9] shadow-sm text-center">
              <Award className="h-6 w-6 text-[#F9A825] mx-auto mb-2" />
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Certs Earned</p>
              <h4 className="text-xl font-extrabold text-[#F9A825] mt-1">{certificates.length}</h4>
            </div>
            <div className="bg-white p-4 rounded-lg border border-[#D8DEE9] shadow-sm text-center">
              <AlertTriangle className="h-6 w-6 text-[#C62828] mx-auto mb-2" />
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Integrity Flags</p>
              <h4 className="text-xl font-extrabold text-[#C62828] mt-1">{totalWarnings}</h4>
            </div>
          </div>

          {/* Earned Certificates Lockers */}
          {certificates.length > 0 && (
            <div className="bg-white p-6 rounded-lg border border-[#D8DEE9] shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-900 border-l-4 border-[#F9A825] pl-2.5 uppercase tracking-wider">
                Verifiable Certificates Vault
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {certificates.map(cert => (
                  <div 
                    id={`cert-card-${cert.id}`}
                    key={cert.id} 
                    className="border border-[#D8DEE9] rounded-lg p-4 bg-slate-50/50 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-mono text-[9px] font-bold bg-[#F9A825] text-white px-2 py-0.5 rounded">
                          {cert.certificateNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{new Date(cert.issuedAt).toLocaleDateString()}</span>
                      </div>
                      <h5 className="font-bold text-slate-800 text-xs mt-2.5 leading-snug">{cert.examTitle}</h5>
                      <p className="text-[11px] text-[#0F8B4C] font-semibold mt-1">Score: {cert.score}/{cert.totalMarks} ({cert.percentile} Percentile)</p>
                    </div>
                    <div className="border-t border-slate-200 mt-4 pt-3 flex items-center justify-between">
                      <button
                        id={`verify-cert-${cert.id}`}
                        onClick={() => onNavigate("verify")}
                        className="flex items-center gap-1 text-[#005A9C] font-bold text-[11px] hover:underline cursor-pointer"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Online Verification Registry</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attempts History table */}
          <div className="bg-white p-6 rounded-lg border border-[#D8DEE9] shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-900 border-l-4 border-[#003366] pl-2.5 uppercase tracking-wider">
              Computer-Based Diagnostic Log
            </h4>
            
            {attempts.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded text-slate-400 text-xs">
                You have not attempted any mock exams yet. Visit the Dashboard to begin practice.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 font-bold text-slate-600">
                      <th className="px-4 py-3">Exams Tried</th>
                      <th className="px-4 py-3">Duration</th>
                      <th className="px-4 py-3">Score & Negative Markings</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attempts.map(att => (
                      <tr id={`attempt-row-${att.id}`} key={att.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {att.examId.replace("exam-", "").toUpperCase()} Exam Session
                          <span className="block text-[10px] font-normal text-slate-400 mt-0.5">ID: {att.id}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono">
                          {att.timeSpentSeconds ? `${Math.round(att.timeSpentSeconds / 60)} min` : "N/A"}
                        </td>
                        <td className="px-4 py-3">
                          {att.status === "submitted" ? (
                            <div>
                              <span className="font-bold text-slate-800">{att.score} points</span>
                              <span className="block text-[10px] text-[#C62828]">Penalty: {att.negativeMarksApplied || 0}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Incomplete</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            att.status === "submitted" 
                              ? "bg-green-50 text-[#0F8B4C]" 
                              : "bg-amber-50 text-amber-700 animate-pulse"
                          }`}>
                            {att.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {att.status === "submitted" ? (
                            <button
                              id={`view-result-btn-${att.id}`}
                              onClick={() => onViewResult(att.id)}
                              className="flex items-center gap-1 text-[#005A9C] font-bold hover:underline cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Scorecard</span>
                            </button>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
