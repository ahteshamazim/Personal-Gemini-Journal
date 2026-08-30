import React, { useState } from "react";
import { Download, Copy, Check, X, FileCode, FileText } from "lucide-react";
import { JournalEntry } from "../types";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: JournalEntry | null;
  allEntries?: JournalEntry[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  entry,
  allEntries,
}) => {
  const [format, setFormat] = useState<"markdown" | "json">("markdown");
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen || (!entry && !allEntries)) return null;

  const targetEntry = entry || allEntries?.[0];

  const generateMarkdown = (e: JournalEntry): string => {
    let md = `# ${e.title}\n\n`;
    md += `**Date:** ${new Date(e.updatedAt).toLocaleString()}\n`;
    md += `**Category:** ${e.category}\n`;
    if (e.sentiment) md += `**Sentiment:** ${e.sentiment}\n`;
    if (e.tags?.length) md += `**Tags:** ${e.tags.map((t) => `#${t}`).join(" ")}\n`;
    if (e.summary) md += `\n## Executive Summary\n${e.summary}\n`;
    if (e.keyInsight) md += `\n> **Key Insight:** ${e.keyInsight}\n`;

    md += `\n## Reflection Dialogue\n\n`;
    e.messages.forEach((msg) => {
      const sender = msg.role === "user" ? "You" : "Gemini 3.6 Flash";
      md += `### ${sender} (${new Date(msg.timestamp).toLocaleTimeString()})\n\n${msg.content}\n\n`;
    });

    return md;
  };

  const contentToExport =
    format === "markdown"
      ? targetEntry
        ? generateMarkdown(targetEntry)
        : ""
      : JSON.stringify(entry || allEntries, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(contentToExport);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = `${(targetEntry?.title || "reflection")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")}.${format === "markdown" ? "md" : "json"}`;
    const blob = new Blob([contentToExport], {
      type: format === "markdown" ? "text/markdown" : "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5 text-white font-bold text-sm">
            <Download className="h-4 w-4 text-indigo-400" />
            <span>Export Reflection: {targetEntry?.title}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 bg-[#111111] p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setFormat("markdown")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                format === "markdown"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-white/40 hover:text-white"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Markdown</span>
            </button>
            <button
              onClick={() => setFormat("json")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                format === "json"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-white/40 hover:text-white"
              }`}
            >
              <FileCode className="h-3.5 w-3.5" />
              <span>JSON</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#111111] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-white/5 transition-colors"
            >
              {isCopied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-white/60" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-black hover:bg-indigo-50 shadow-lg transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto rounded-xl border border-white/10 bg-[#111111] p-4 font-mono text-xs text-white/80 whitespace-pre-wrap select-all">
          {contentToExport}
        </div>
      </div>
    </div>
  );
};
