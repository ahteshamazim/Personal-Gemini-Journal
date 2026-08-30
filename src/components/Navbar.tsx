import React from "react";
import { Sparkles, BookOpen, History, BarChart3, LogOut, ShieldCheck, Plus, BrainCircuit } from "lucide-react";
import { UserProfile } from "../types";

interface NavbarProps {
  user: UserProfile;
  currentTab: "editor" | "history" | "insights";
  onTabChange: (tab: "editor" | "history" | "insights") => void;
  onNewEntry: () => void;
  onSignOut: () => void;
  onOpenSecurity: () => void;
  savingStatus?: "saved" | "saving" | "error" | "idle";
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentTab,
  onTabChange,
  onNewEntry,
  onSignOut,
  onOpenSecurity,
  savingStatus = "idle",
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0a0a0a]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            id="nav-brand-btn"
            onClick={() => onTabChange("editor")}
            className="flex items-center gap-3 text-left focus:outline-none group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
              <div className="w-4 h-4 border-2 border-white rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 font-bold tracking-tight text-white text-base leading-none">
                <span>Gemini Reflection</span>
                <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-indigo-400 border border-white/10 uppercase">
                  3.6 Flash
                </span>
              </div>
              <p className="text-[11px] text-white/40 leading-tight mt-0.5 tracking-wide">
                Private Journal & Synthesis
              </p>
            </div>
          </button>

          {/* Cloud Firestore sync state */}
          <div className="hidden md:flex items-center ml-4 pl-4 border-l border-white/10">
            {savingStatus === "saving" && (
              <span className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
                Syncing with Firestore...
              </span>
            )}
            {savingStatus === "saved" && (
              <span className="flex items-center gap-1.5 text-xs text-white/40">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Firestore Isolated
              </span>
            )}
            {savingStatus === "error" && (
              <span className="flex items-center gap-1.5 text-xs text-rose-400">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                Sync Error
              </span>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-[#111111] p-1 rounded-xl border border-white/10">
          <button
            id="nav-tab-editor"
            onClick={() => onTabChange("editor")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
              currentTab === "editor"
                ? "bg-white/10 text-white shadow-sm border border-white/10"
                : "text-white/40 hover:text-white hover:bg-white/5"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
            <span>Reflect</span>
          </button>

          <button
            id="nav-tab-history"
            onClick={() => onTabChange("history")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
              currentTab === "history"
                ? "bg-white/10 text-white shadow-sm border border-white/10"
                : "text-white/40 hover:text-white hover:bg-white/5"
            }`}
          >
            <History className="h-3.5 w-3.5 text-indigo-400" />
            <span>Vault</span>
          </button>

          <button
            id="nav-tab-insights"
            onClick={() => onTabChange("insights")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
              currentTab === "insights"
                ? "bg-white/10 text-white shadow-sm border border-white/10"
                : "text-white/40 hover:text-white hover:bg-white/5"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Insights</span>
          </button>
        </nav>

        {/* Action Controls & User Identity */}
        <div className="flex items-center gap-3">
          <button
            id="btn-new-reflection"
            onClick={onNewEntry}
            className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 bg-white text-black text-xs font-bold uppercase tracking-widest rounded-full hover:bg-indigo-50 hover:shadow-lg transition-all"
          >
            <Plus className="h-3.5 w-3.5 text-black stroke-[3]" />
            <span>New Session</span>
          </button>

          <button
            id="btn-security-rules"
            onClick={onOpenSecurity}
            title="View Security & Isolation Architecture"
            className="flex items-center justify-center h-8 w-8 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ShieldCheck className="h-4 w-4" />
          </button>

          {/* User Profile avatar & Sign out */}
          <div className="flex items-center gap-2.5 pl-2.5 border-l border-white/10">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "User"}
                referrerPolicy="no-referrer"
                className="h-8 w-8 rounded-full border border-white/20 object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border border-white/20 text-xs font-semibold text-white">
                {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
              </div>
            )}

            <button
              id="btn-signout"
              onClick={onSignOut}
              title="Sign Out"
              className="flex items-center justify-center h-8 w-8 rounded-lg text-white/40 hover:text-rose-400 hover:bg-white/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
