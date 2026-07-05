/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Landmark, Mail, ShieldCheck, UserCheck, AlertCircle, Eye, ArrowRight } from "lucide-react";
import { User, UserRole } from "../types";

interface AuthPageProps {
  onLoginSuccess: (user: User) => void;
}

export default function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.CANDIDATE);
  const [cnic, setCnic] = useState("");
  const [name, setName] = useState("");
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [otpCode, setOtpCode] = useState("");
  const [userOtpInput, setUserOtpInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Dynamic CNIC Formatter: 12345-1234567-1
  const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 13) val = val.substring(0, 13);
    
    let formatted = val;
    if (val.length > 5 && val.length <= 12) {
      formatted = `${val.substring(0, 5)}-${val.substring(5)}`;
    } else if (val.length > 12) {
      formatted = `${val.substring(0, 5)}-${val.substring(5, 12)}-${val.substring(12, 13)}`;
    }
    setCnic(formatted);
  };

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please input a valid candidate email.");
      return;
    }

    // Basic email check
    if (!email.includes("@")) {
      setError("Please provide a well-formed email (e.g., candidate@nmts-portal.org).");
      return;
    }

    if (role === UserRole.CANDIDATE && name && cnic.length < 15) {
      setError("Please enter a valid National CNIC number (13 digits: XXXXX-XXXXXXX-X).");
      return;
    }

    setLoading(true);
    // Simulate generation of OTP
    setTimeout(() => {
      const generated = Math.floor(1000 + Math.random() * 9000).toString();
      setOtpCode(generated);
      setStep("otp");
      setLoading(false);
    }, 800);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (userOtpInput !== otpCode && userOtpInput !== "1234") { // Allow 1234 as universal bypass
      setError("The verification OTP entered is incorrect or expired. Please recheck.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          requestedRole: role,
          name: name || undefined,
          cnic: cnic || undefined
        })
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok && data.success) {
        onLoginSuccess(data.user);
      } else {
        setError(data.error || "Authentication failed.");
      }
    } catch (err) {
      setLoading(false);
      setError("Could not establish secure communication with testing server.");
    }
  };

  // Quick preset logger for effortless demo auditing
  const loginWithPreset = async (presetRole: UserRole) => {
    setError("");
    setLoading(true);
    let presetEmail = "candidate@nmts-portal.org";
    let presetName = "Ali Ahmed Khan";
    let presetCnic = "35201-9876543-1";

    if (presetRole === UserRole.SUPER_ADMIN) {
      presetEmail = "director@nmts-portal.org";
      presetName = "Portal Director NMTS";
      presetCnic = "37405-1234567-1";
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: presetEmail,
          requestedRole: presetRole,
          name: presetName,
          cnic: presetCnic
        })
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok && data.success) {
        onLoginSuccess(data.user);
      } else {
        setError(data.error || "Preset login failed.");
      }
    } catch (err) {
      setLoading(false);
      setError("Preset logging failed.");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#F5F7FA] py-12 px-4 sm:px-6 lg:px-8 select-none">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg border border-[#D8DEE9] shadow-xl">
        <div className="text-center">
          <div className="mx-auto bg-[#003366] p-4 rounded-full w-20 h-20 flex items-center justify-center border-4 border-slate-100 shadow-lg">
            <Landmark className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-[#003366]">
            NMTS CANDIDATE PORTAL
          </h2>
          <p className="mt-2 text-xs text-slate-500 uppercase tracking-widest font-mono">
            Secure Multi-Factor Entrance Console
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-[#C62828] p-3 rounded flex gap-2.5 items-center">
            <AlertCircle className="h-5 w-5 text-[#C62828] shrink-0" />
            <span className="text-xs font-semibold text-[#C62828]">{error}</span>
          </div>
        )}

        {step === "credentials" ? (
          <form className="mt-8 space-y-4" onSubmit={requestOtp}>
            {/* Identity Role */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Access Workspace Group
              </label>
              <select
                id="auth-role-select"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="block w-full rounded border border-slate-300 px-3 py-2 text-sm bg-slate-50 focus:border-[#003366] focus:outline-none focus:ring-1 focus:ring-[#003366] font-bold"
              >
                <option value={UserRole.CANDIDATE}>CANDIDATE (Student / Job Seeker)</option>
                <option value={UserRole.ADMIN}>NMTS INSTRUCTOR / REGULATORY AUDITOR</option>
                <option value={UserRole.SUPER_ADMIN}>NMTS SUPER ADMINISTRATOR</option>
              </select>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Registered Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  placeholder="candidate@nmts-portal.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded border border-slate-300 pl-10 pr-3 py-2 text-sm bg-white focus:border-[#003366] focus:outline-none focus:ring-1 focus:ring-[#003366]"
                />
              </div>
            </div>

            {role === UserRole.CANDIDATE && (
              <>
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Candidate Full Name <span className="text-slate-400 font-normal">(For Certificates)</span>
                  </label>
                  <input
                    id="auth-name-input"
                    type="text"
                    placeholder="e.g. Ali Ahmed"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded border border-slate-300 px-3 py-2 text-sm bg-white focus:border-[#003366] focus:outline-none"
                  />
                </div>

                {/* CNIC */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    National ID (CNIC)
                  </label>
                  <input
                    id="auth-cnic-input"
                    type="text"
                    placeholder="35201-XXXXXXX-X"
                    value={cnic}
                    onChange={handleCnicChange}
                    className="block w-full rounded border border-slate-300 px-3 py-2 text-sm bg-white font-mono tracking-widest focus:border-[#003366] focus:outline-none"
                  />
                </div>
              </>
            )}

            <button
              id="request-otp-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-[#003366] hover:bg-blue-900 text-white font-bold py-2.5 rounded text-sm transition tracking-wider uppercase shadow hover:shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loading ? "Establishing handshake..." : "Generate Authentication OTP"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={handleVerifyOtp}>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded text-center">
              <p className="text-xs font-bold text-blue-800">SIMULATED SMS/EMAIL SECURITY CODE SENT</p>
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="text-xs text-slate-600">Verification Token is:</span>
                <span className="bg-[#0F8B4C] text-white px-2.5 py-1 rounded font-mono font-bold text-sm tracking-widest animate-pulse">
                  {otpCode}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5">Enter this simulated OTP below to securely verify your identity.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Enter 4-Digit OTP Code
              </label>
              <input
                id="auth-otp-input"
                type="text"
                required
                maxLength={4}
                placeholder="XXXX"
                value={userOtpInput}
                onChange={(e) => setUserOtpInput(e.target.value.replace(/\D/g, ""))}
                className="block w-full rounded border border-slate-300 text-center py-2.5 text-lg font-mono font-bold tracking-widest focus:border-[#003366] focus:outline-none"
              />
            </div>

            <div className="flex justify-between items-center text-xs">
              <button 
                type="button" 
                onClick={() => setStep("credentials")} 
                className="text-[#005A9C] font-bold hover:underline cursor-pointer"
              >
                Change Credentials
              </button>
              <span className="text-slate-400">Resend OTP in 30s</span>
            </div>

            <button
              id="verify-otp-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-[#0F8B4C] hover:bg-green-700 text-white font-bold py-2.5 rounded text-sm transition tracking-wider uppercase shadow flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4" />
              {loading ? "Verifying..." : "Verify OTP & Access System"}
            </button>
          </form>
        )}

        {/* Quick Auditing Tool */}
        <div className="border-t border-slate-200 mt-8 pt-6">
          <p className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-3">
            Officer Demonstration Workspace
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              id="demo-candidate-btn"
              type="button"
              onClick={() => loginWithPreset(UserRole.CANDIDATE)}
              className="bg-slate-100 hover:bg-[#005A9C] hover:text-white text-slate-800 font-bold py-2 px-3 rounded text-xs transition cursor-pointer flex items-center justify-center gap-1"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Demo Candidate</span>
            </button>
            <button
              id="demo-admin-btn"
              type="button"
              onClick={() => loginWithPreset(UserRole.SUPER_ADMIN)}
              className="bg-slate-100 hover:bg-[#003366] hover:text-white text-slate-800 font-bold py-2 px-3 rounded text-xs transition cursor-pointer flex items-center justify-center gap-1"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Demo Director</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
