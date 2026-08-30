import React from "react";
import { Sparkles, Shield, Lock, Database, BrainCircuit, ArrowRight, CheckCircle2, Bot, Layers } from "lucide-react";

interface AuthLandingProps {
  onSignIn: () => void;
  isLoading: boolean;
  error?: string | null;
}

export const AuthLanding: React.FC<AuthLandingProps> = ({
  onSignIn,
  isLoading,
  error,
}) => {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#050505] text-[#e0e0e0] font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Banner */}
      <header className="border-b border-white/10 bg-[#0a0a0a] px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black font-bold shadow-lg">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-white text-base">
                Reflection
              </span>
              <span className="ml-2.5 text-[10px] uppercase font-mono tracking-wider rounded-full bg-white/5 px-2.5 py-0.5 text-white/50 border border-white/10">
                Firestore Isolated
              </span>
            </div>
          </div>

          <button
            id="header-signin-btn"
            onClick={onSignIn}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-full bg-white px-5 py-2 text-xs font-bold uppercase tracking-widest text-black shadow-lg hover:bg-indigo-50 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-black border-t-transparent" />
                Connecting...
              </span>
            ) : (
              <>
                <span>Sign In with Google</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Hero & Auth Trigger */}
      <main className="mx-auto flex max-w-5xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        {/* Security badge pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-medium text-white/70 shadow-inner mb-8">
          <Lock className="h-3.5 w-3.5 text-indigo-400" />
          <span>Zero-Trust Owner-Bound Firestore Security Active</span>
        </div>

        <h1 className="max-w-3xl text-4xl sm:text-6xl font-bold tracking-tight text-white leading-tight">
          Your Private Reflection Sanctuary with{" "}
          <span className="text-indigo-400">
            Gemini 3.6 Flash
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-base sm:text-lg text-white/50 font-normal leading-relaxed">
          Write multi-turn journal reflections, receive profound AI synthesis and actionable clarity, and safely persist every insight in your private, isolated Cloud Firestore vault.
        </p>

        {error && (
          <div className="mt-6 w-full max-w-md rounded-2xl border border-rose-500/30 bg-rose-950/40 p-4 text-xs text-rose-300 text-left">
            <p className="font-semibold flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              Authentication Notice
            </p>
            <p className="mt-1 text-white/80">{error}</p>
          </div>
        )}

        {/* Primary CTA */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-3.5">
          <button
            id="hero-signin-google-btn"
            onClick={onSignIn}
            disabled={isLoading}
            className="flex items-center justify-center gap-3 rounded-full bg-white px-8 py-4 text-sm font-bold uppercase tracking-wider text-black shadow-2xl hover:bg-indigo-50 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                Signing in...
              </span>
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </div>

        <p className="mt-4 text-xs text-white/30 font-mono">
          Federated OAuth 2.0 • No custom passwords stored
        </p>

        {/* Feature Grid */}
        <div className="mt-16 grid w-full grid-cols-1 gap-5 text-left md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-indigo-400 mb-4 border border-white/10">
              <Bot className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-white text-base">
              Gemini 3.6 Flash Partner
            </h3>
            <p className="mt-2 text-xs text-white/50 leading-relaxed">
              Multi-turn conversational reflections with auto-summaries, key insight distillation, and structured actionable next steps.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-emerald-400 mb-4 border border-white/10">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-white text-base">
              User-Isolated Cloud Firestore
            </h3>
            <p className="mt-2 text-xs text-white/50 leading-relaxed">
              Strict document ownership rules enforce that only your authenticated account can read or write your private journal database.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-violet-400 mb-4 border border-white/10">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-white text-base">
              Zero-Hardcoding Backend
            </h3>
            <p className="mt-2 text-xs text-white/50 leading-relaxed">
              API keys and secrets are secured server-side in Cloud Secret Manager, never exposed to the frontend client.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0a0a0a] px-6 py-5 text-center text-xs text-white/30">
        <p>Reflection • Secured with Firebase Auth & Cloud Firestore • Powered by Gemini 3.6 Flash</p>
      </footer>
    </div>
  );
};
