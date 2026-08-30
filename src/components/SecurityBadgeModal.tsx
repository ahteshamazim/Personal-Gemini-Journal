import React from "react";
import { ShieldCheck, Lock, Key, Server, Database, CheckCircle2, X } from "lucide-react";

interface SecurityBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export const SecurityBadgeModal: React.FC<SecurityBadgeModalProps> = ({
  isOpen,
  onClose,
  userId,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5 text-white font-bold text-base tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-emerald-400 border border-white/10">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span>Security & Data Isolation Architecture</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-xs text-white/70">
          {/* Current Auth UID */}
          <div className="rounded-xl border border-white/10 bg-[#111111] p-3.5">
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest font-mono">
              Authenticated Client Token
            </p>
            <p className="mt-1 font-mono text-indigo-300 break-all select-all">
              {userId}
            </p>
          </div>

          {/* Core Guarantees */}
          <div className="space-y-2.5">
            <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
              <Database className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">
                  Owner-Bound Cloud Firestore Isolation
                </p>
                <p className="text-white/50 mt-0.5 leading-relaxed">
                  Interactions are written exclusively to <code className="text-emerald-300 font-mono text-[11px]">/users/{`{userId}`}/interactions/{`{id}`}</code>. Firestore security rules strictly prevent any user from reading or writing documents outside their authenticated UID.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
              <Server className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">
                  Server-Side Gemini 3.6 Flash Isolation
                </p>
                <p className="text-white/50 mt-0.5 leading-relaxed">
                  The <code className="text-indigo-300 font-mono text-[11px]">GEMINI_API_KEY</code> is held exclusively in environment secrets / Secret Manager and never sent to client web browsers.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
              <Lock className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">
                  Zero Plaintext Passwords
                </p>
                <p className="text-white/50 mt-0.5 leading-relaxed">
                  Federated Google OAuth 2.0 authentication ensures credential handling is outsourced safely to Google Identity Services.
                </p>
              </div>
            </div>
          </div>

          {/* Active Rules Snippet */}
          <div className="rounded-xl border border-white/10 bg-[#111111] p-3.5 font-mono text-[11px] text-white/50">
            <p className="text-white/30 mb-1 text-[10px]">// Active firestore.rules</p>
            <p className="text-white/80">match /users/{`{userId}`}/interactions/{`{id}`} &#123;</p>
            <p className="text-emerald-400 pl-3">allow read, write: if request.auth != null && request.auth.uid == userId;</p>
            <p className="text-white/80">&#125;</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-full bg-white px-5 py-2 text-xs font-bold uppercase tracking-widest text-black hover:bg-indigo-50 transition-colors shadow-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
