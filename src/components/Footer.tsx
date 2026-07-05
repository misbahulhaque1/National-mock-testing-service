/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Landmark, Phone, Mail, MapPin, ShieldCheck, HelpCircle } from "lucide-react";
import { SystemSettings } from "../types";

interface FooterProps {
  settings?: SystemSettings | null;
}

export default function Footer({ settings }: FooterProps) {
  const contactAddress = settings?.contactAddress || "Contact info will be provided by the administrator.";
  const contactPhone = settings?.contactPhone || "+92 51 0000000";
  const contactEmail = settings?.contactEmail || "contact@nmts-portal.org";
  const footerText = settings?.footerText || "This platform is intended for mock examinations and practice tests.";

  return (
    <footer className="bg-[#1A202C] text-slate-300 border-t-8 border-[#0F8B4C] select-none text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Organization details */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="bg-white p-1.5 rounded-full inline-block">
                <Landmark className="h-6 w-6 text-[#003366]" />
              </div>
              <span className="text-sm font-bold tracking-wider text-white uppercase font-sans">
                {settings?.siteName || "NATIONAL MOCK TESTING SERVICE (NMTS)"}
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed pr-6">
              {settings?.heroSubtitle || "Standardized diagnostic simulator portal for examinations and mock practice tests."}
            </p>
            <div className="flex items-center gap-2 text-slate-400">
              <ShieldCheck className="h-4.5 w-4.5 text-[#0F8B4C]" />
              <span>Diagnostic Assessment Platform</span>
            </div>
          </div>

          {/* Quick references */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-l-4 border-[#005A9C] pl-2.5">Quick References</h4>
            <ul className="space-y-2.5 text-slate-400">
              <li>
                <span className="text-slate-400">Online Exam Dashboard</span>
              </li>
              <li>
                <span className="text-slate-400">Latest Announcements</span>
              </li>
              <li>
                <span className="text-slate-400">Resource Downloads</span>
              </li>
              <li>
                <span className="text-slate-400">Verification Registry</span>
              </li>
            </ul>
          </div>

          {/* Support desk */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-l-4 border-[#005A9C] pl-2.5">Portal Help Desk</h4>
            <ul className="space-y-3 text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-[#F9A825] shrink-0 mt-0.5" />
                <span>{contactAddress}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#F9A825]" />
                <span>Phone: {contactPhone}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#F9A825]" />
                <span>Email: {contactEmail}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal and compliance strip */}
        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center text-slate-500 text-[11px] gap-4">
          <p>© {new Date().getFullYear()} {settings?.orgName || "National Mock Testing Service (NMTS)"}. {footerText}</p>
        </div>
      </div>
    </footer>
  );
}
