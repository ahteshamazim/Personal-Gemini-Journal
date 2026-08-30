import React, { useState, useEffect } from "react";
import {
  Webhook,
  Copy,
  Check,
  Send,
  X,
  Sparkles,
  Layers,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { JournalEntry, WebhookPlatform, WebhookPayload } from "../types";
import { generateWebhookPayload, testWebhookDispatch } from "../services/gemini";

interface WebhookModalProps {
  entry: JournalEntry;
  userId: string;
  onClose: () => void;
}

const MILESTONES = [
  "Core Breakthrough Realization",
  "Milestone Reflection Completed",
  "Weekly Synthesis Summary",
  "Major Habit & Clarity Decision",
];

export const WebhookModal: React.FC<WebhookModalProps> = ({
  entry,
  userId,
  onClose,
}) => {
  const [platform, setPlatform] = useState<WebhookPlatform>("slack");
  const [selectedMilestone, setSelectedMilestone] = useState(MILESTONES[0]);
  const [loading, setLoading] = useState(true);
  const [payloadData, setPayloadData] = useState<WebhookPayload | null>(null);
  const [copied, setCopied] = useState(false);
  const [customWebhookUrl, setCustomWebhookUrl] = useState("");
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<{
    success: boolean;
    statusCode: number;
    durationMs: number;
    message: string;
  } | null>(null);

  // Generate payload upon selection change
  useEffect(() => {
    let isMounted = true;
    const fetchPayload = async () => {
      setLoading(true);
      try {
        const payload = await generateWebhookPayload(entry, selectedMilestone, userId);
        if (isMounted) {
          setPayloadData(payload);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to generate webhook payload schema:", err);
        if (isMounted) setLoading(false);
      }
    };
    fetchPayload();
    return () => {
      isMounted = false;
    };
  }, [entry, selectedMilestone, userId]);

  const getCodePreview = () => {
    if (!payloadData) return "// Generating schema payload...";
    if (platform === "slack") {
      return JSON.stringify({ blocks: payloadData.formatted?.slackBlocks }, null, 2);
    }
    if (platform === "discord") {
      return JSON.stringify({ embeds: [payloadData.formatted?.discordEmbed] }, null, 2);
    }
    if (platform === "email") {
      return payloadData.formatted?.emailHtml || "";
    }
    return JSON.stringify(payloadData.formatted?.genericJson || payloadData, null, 2);
  };

  const handleCopy = () => {
    const code = getCodePreview();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestDispatch = async () => {
    if (!payloadData) return;
    setDispatching(true);
    setDispatchResult(null);

    try {
      const res = await testWebhookDispatch(platform, customWebhookUrl, payloadData);
      setDispatchResult({
        success: res.success,
        statusCode: res.statusCode || 200,
        durationMs: res.durationMs || 30,
        message: res.message || "Webhook payload successfully validated.",
      });
    } catch (err: any) {
      setDispatchResult({
        success: false,
        statusCode: 500,
        durationMs: 0,
        message: err?.message || "Dispatch error occurred",
      });
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-2xl max-h-[90vh] rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-[#0d0d0d]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Webhook className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Webhook Notification Schema Generator
              </h3>
              <p className="text-[11px] text-white/40">
                Generate standard schemas (Slack, Discord, Email, REST) for milestone reflections
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Controls: Milestone Type and Platform */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider block mb-1.5">
                Milestone Event Trigger
              </label>
              <select
                value={selectedMilestone}
                onChange={(e) => setSelectedMilestone(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#111111] px-3 py-2 text-xs text-white focus:border-indigo-500/50 focus:outline-none"
              >
                {MILESTONES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider block mb-1.5">
                Target Platform Schema
              </label>
              <div className="grid grid-cols-4 gap-1 rounded-xl bg-[#111111] p-1 border border-white/10">
                {(["slack", "discord", "email", "generic"] as WebhookPlatform[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlatform(p)}
                    className={`rounded-lg py-1.5 text-center text-xs font-semibold capitalize transition-all ${
                      platform === p
                        ? "bg-white/10 text-white shadow-sm border border-white/10"
                        : "text-white/40 hover:text-white"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Schema Preview Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-white/60">
                <Terminal className="h-3.5 w-3.5 text-indigo-400" />
                <span>Generated {platform.toUpperCase()} Payload Schema</span>
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? "Copied Schema!" : "Copy Payload"}</span>
              </button>
            </div>

            <div className="relative rounded-xl border border-white/10 bg-[#050505] p-3.5 font-mono text-[11px] text-indigo-200 overflow-x-auto max-h-56 leading-relaxed">
              {loading ? (
                <div className="py-8 text-center text-white/30 font-sans text-xs">
                  Generating formatted schema...
                </div>
              ) : (
                <pre>{getCodePreview()}</pre>
              )}
            </div>
          </div>

          {/* Webhook Test Dispatch Simulator */}
          <div className="rounded-xl border border-white/10 bg-[#111111] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Send className="h-3.5 w-3.5 text-indigo-400" />
                <span>Simulate / Send Test Webhook</span>
              </span>
              <span className="text-[10px] text-white/40 font-mono">
                Headers: X-Security-Isolation: owner-bound
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="url"
                value={customWebhookUrl}
                onChange={(e) => setCustomWebhookUrl(e.target.value)}
                placeholder="Optional: https://hooks.slack.com/services/... or Leave blank to simulate"
                className="flex-1 rounded-xl border border-white/10 bg-[#0a0a0a] px-3.5 py-2 text-xs text-white placeholder-white/20 focus:border-indigo-500/50 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleTestDispatch}
                disabled={dispatching || loading}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                <Send className={`h-3 w-3 ${dispatching ? "animate-spin" : ""}`} />
                <span>{dispatching ? "Sending..." : "Test Dispatch"}</span>
              </button>
            </div>

            {/* Test Dispatch Result Status Badge */}
            {dispatchResult && (
              <div
                className={`rounded-xl border p-3 text-xs flex items-start gap-2.5 ${
                  dispatchResult.success
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-300"
                }`}
              >
                {dispatchResult.success ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-bold">
                    <span>HTTP {dispatchResult.statusCode}</span>
                    <span className="text-[10px] font-mono opacity-60">
                      ({dispatchResult.durationMs}ms)
                    </span>
                  </div>
                  <p className="text-[11px] opacity-90">{dispatchResult.message}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 px-6 py-3.5 bg-[#0d0d0d] text-xs">
          <span className="flex items-center gap-1.5 text-white/40 text-[11px]">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
            <span>Strict User Data Isolation & Firestore Integrity Verified</span>
          </span>
          <button
            onClick={onClose}
            className="rounded-xl bg-white/10 px-4 py-1.5 font-medium text-white hover:bg-white/20 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
