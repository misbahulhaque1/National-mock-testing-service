/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Building2, Bell, User as UserIcon, LogOut, ShieldAlert, CheckCircle, 
  Menu, X, Landmark, FileText, Download, Award, Search 
} from "lucide-react";
import { User, UserRole, SystemNotification, SystemSettings } from "../types";

interface HeaderProps {
  currentUser: User | null;
  onLogout: () => void;
  onNavigate: (page: string) => void;
  activeTab: string;
  notifications: SystemNotification[];
  onReadNotification: (id: string) => void;
  settings?: SystemSettings | null;
}

export default function Header({ 
  currentUser, onLogout, onNavigate, activeTab, notifications, onReadNotification, settings 
}: HeaderProps) {
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [fontSize, setFontSize] = useState<"normal" | "large">("normal");

  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleFontSize = () => {
    const nextSize = fontSize === "normal" ? "large" : "normal";
    setFontSize(nextSize);
    if (nextSize === "large") {
      document.documentElement.classList.add("text-lg");
    } else {
      document.documentElement.classList.remove("text-lg");
    }
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Landmark },
    { id: "notices", label: "Notice Board", icon: FileText },
    { id: "downloads", label: "Downloads", icon: Download },
    { id: "verify", label: "Verify Certificate", icon: Award },
  ];

  if (currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.ADMIN) {
    navItems.splice(1, 0, { id: "admin", label: "Admin Console", icon: Building2 });
  }

  return (
    <header className="sticky top-0 z-50 bg-[#003366] text-white shadow-md border-b-4 border-[#0F8B4C] select-none">
      {/* Dynamic Top Strip */}
      <div className="bg-[#0b2447] text-[11px] font-mono py-1 px-4 flex justify-between items-center tracking-wider border-b border-blue-900">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-[#0F8B4C] rounded-full inline-block animate-pulse"></span>
          <span>{settings?.siteName || "National Mock Testing Service (NMTS)"} Assessment Console</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            id="accessibility-font-toggle"
            onClick={toggleFontSize} 
            className="hover:underline bg-slate-800 px-2 py-0.5 rounded cursor-pointer border border-slate-700 hover:bg-slate-700 transition"
          >
            A+ / A- (Size: {fontSize.toUpperCase()})
          </button>
          <span>SERVER TIME: {new Date().getFullYear()}-07-04 UTC</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center min-h-[5rem] py-3 md:py-0 gap-2">
          {/* Logo and Brand Title Grouping */}
          <div className="flex items-center cursor-pointer gap-2 sm:gap-3" onClick={() => onNavigate("dashboard")}>
            <div className="bg-white p-1.5 sm:p-2.5 rounded-full shadow-inner border border-slate-300 shrink-0">
              <Landmark className="h-6 w-6 sm:h-9 sm:w-9 text-[#003366]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-lg md:text-2xl font-bold font-sans tracking-tight uppercase leading-none text-white truncate max-w-[150px] xs:max-w-[200px] sm:max-w-none">
                {settings?.siteName ? settings?.siteName.split(" (")[0] : "NMTS Portal"}
              </h1>
              <p className="text-[8px] sm:text-xs text-[#90CDF4] font-medium tracking-wide mt-1 uppercase truncate max-w-[150px] xs:max-w-[200px] sm:max-w-none">
                {settings?.orgName || "National Mock Testing Service"}
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map(item => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  id={`nav-tab-${item.id}`}
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold tracking-wide transition duration-150 cursor-pointer ${
                    isActive 
                      ? "bg-[#005A9C] text-white shadow-inner border-b-2 border-white" 
                      : "text-blue-100 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <IconComp className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User Operations Drawer / Profile Details */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-4">
                {/* Notifications Panel */}
                <div className="relative">
                  <button 
                    id="notification-bell"
                    onClick={() => setShowNotifDropdown(!showNotifDropdown)} 
                    className="p-2 text-blue-100 hover:bg-slate-800 rounded-full relative cursor-pointer transition focus:outline-none"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 bg-[#C62828] text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center animate-bounce">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Container */}
                  {showNotifDropdown && (
                    <div className="absolute right-0 mt-2.5 w-80 bg-white text-slate-900 rounded-md shadow-2xl border border-slate-200 py-1 overflow-hidden z-50">
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                        <span className="font-bold text-sm text-slate-800 uppercase tracking-wider">System Alerts</span>
                        <span className="text-[10px] font-mono text-slate-500">{unreadCount} unread</span>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-6 text-center text-slate-400 text-xs">
                            No recent notifications or announcements.
                          </div>
                        ) : (
                          notifications.map(n => (
                            <div 
                              id={`notification-${n.id}`}
                              key={n.id} 
                              onClick={() => {
                                onReadNotification(n.id);
                                if (n.title.includes("Conferred") || n.title.includes("passed")) {
                                  onNavigate("verify");
                                }
                              }}
                              className={`px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer flex gap-2.5 ${!n.read ? "bg-blue-50/50" : ""}`}
                            >
                              {n.type === "success" ? (
                                <CheckCircle className="h-5 w-5 text-[#0F8B4C] shrink-0" />
                              ) : (
                                <ShieldAlert className="h-5 w-5 text-[#F9A825] shrink-0" />
                              )}
                              <div className="text-xs">
                                <p className="font-bold text-slate-800">{n.title}</p>
                                <p className="text-slate-600 mt-0.5">{n.message}</p>
                                <span className="text-[10px] text-slate-400 mt-1 block font-mono">{new Date(n.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Badge */}
                <div 
                  id="profile-badge-btn"
                  onClick={() => onNavigate("profile")}
                  className="hidden sm:flex items-center gap-2.5 bg-[#005A9C] hover:bg-blue-700 px-3 py-1.5 rounded-md cursor-pointer border border-blue-400 transition"
                >
                  <UserIcon className="h-4 w-4" />
                  <div className="text-left">
                    <p className="text-xs font-bold leading-none">{currentUser.name}</p>
                    <p className="text-[9px] font-mono text-blue-200 mt-0.5 leading-none uppercase">{currentUser.role}</p>
                  </div>
                </div>

                {/* Logout Button */}
                <button 
                  id="header-logout-btn"
                  onClick={onLogout} 
                  className="bg-[#C62828] hover:bg-red-800 text-white px-2 sm:px-3.5 py-2 rounded text-[10px] sm:text-xs font-bold tracking-wider uppercase transition cursor-pointer flex items-center gap-1.5 border border-red-900 shrink-0"
                  title="Exit Portal"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Exit Portal</span>
                  <span className="sm:hidden">Exit</span>
                </button>
              </div>
            ) : (
              <button
                id="header-sign-in"
                onClick={() => onNavigate("auth")}
                className="bg-[#0F8B4C] hover:bg-green-700 text-white px-3 sm:px-5 py-2.5 rounded font-bold tracking-wide uppercase transition duration-150 cursor-pointer text-xs sm:text-sm shadow border border-green-800 flex items-center gap-1.5 sm:gap-2 shrink-0"
              >
                <UserIcon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Candidate Portal</span>
                <span className="sm:hidden">Login</span>
              </button>
            )}

            {/* Mobile Menu Icon */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-100 hover:text-white hover:bg-[#005A9C] rounded cursor-pointer transition focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#002b55] border-t border-blue-900 px-4 py-3 space-y-1">
          {navItems.map(item => {
            const IconComp = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                id={`nav-tab-mobile-${item.id}`}
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-bold transition ${
                  isActive 
                    ? "bg-[#005A9C] text-white shadow-inner" 
                    : "text-blue-100 hover:bg-[#003366] hover:text-white"
                }`}
              >
                <IconComp className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
