import React, { useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  Brain,
  Sparkles,
  Flame,
  Award,
  BookOpen,
  MessageSquare,
  Compass,
  CheckCircle2,
} from "lucide-react";
import { JournalEntry } from "../types";

interface InsightsStatsProps {
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
}

export const InsightsStats: React.FC<InsightsStatsProps> = ({
  entries,
  onSelectEntry,
  onNewEntry,
}) => {
  const stats = useMemo(() => {
    const totalEntries = entries.length;
    const totalMessages = entries.reduce(
      (sum, e) => sum + (e.messages?.length || 0),
      0
    );
    const totalWords = entries.reduce((sum, e) => sum + (e.wordCount || 0), 0);
    const favoritesCount = entries.filter((e) => e.isFavorite).length;

    // Categories breakdown
    const catMap: Record<string, number> = {};
    entries.forEach((e) => {
      catMap[e.category] = (catMap[e.category] || 0) + 1;
    });

    // Sentiment breakdown
    const sentimentMap: Record<string, number> = {};
    entries.forEach((e) => {
      if (e.sentiment) {
        sentimentMap[e.sentiment] = (sentimentMap[e.sentiment] || 0) + 1;
      }
    });

    // Extract all key insights
    const allInsights = entries
      .filter((e) => Boolean(e.keyInsight))
      .map((e) => ({
        entryId: e.id,
        title: e.title,
        insight: e.keyInsight!,
        date: e.updatedAt,
      }))
      .slice(0, 6);

    return {
      totalEntries,
      totalMessages,
      totalWords,
      favoritesCount,
      catMap,
      sentimentMap,
      allInsights,
    };
  }, [entries]);

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header */}
      <div className="border-b border-white/10 pb-6">
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Reflection Analytics & Insights
        </h2>
        <p className="text-xs text-white/40 mt-1">
          High-level synthesis of your journaling patterns and Gemini 3.6 Flash collaborative breakthroughs.
        </p>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 shadow-xl">
          <div className="flex items-center justify-between text-white/40 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Reflections</span>
            <BookOpen className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalEntries}</p>
          <p className="text-[10px] text-white/30 font-mono mt-1">Stored in Firestore</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 shadow-xl">
          <div className="flex items-center justify-between text-white/40 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Dialogue Turns</span>
            <MessageSquare className="h-4 w-4 text-violet-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalMessages}</p>
          <p className="text-[10px] text-white/30 font-mono mt-1">Gemini exchanges</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 shadow-xl">
          <div className="flex items-center justify-between text-white/40 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Words Explored</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalWords.toLocaleString()}</p>
          <p className="text-[10px] text-white/30 font-mono mt-1">Total word count</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 shadow-xl">
          <div className="flex items-center justify-between text-white/40 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Breakthroughs</span>
            <Sparkles className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.allInsights.length}</p>
          <p className="text-[10px] text-white/30 font-mono mt-1">Extracted key insights</p>
        </div>
      </div>

      {/* Breakdowns & Themes */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Category distribution */}
        <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-xl">
          <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
            <Compass className="h-4 w-4 text-indigo-400" />
            <span>Focus Areas & Themes</span>
          </h3>
          {Object.keys(stats.catMap).length === 0 ? (
            <p className="text-xs text-white/30 py-4">No categories recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats.catMap).map(([cat, countVal]) => {
                const count = countVal as number;
                const pct = Math.round((count / (stats.totalEntries || 1)) * 100);
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex justify-between text-xs text-white/80">
                      <span className="font-medium">{cat}</span>
                      <span className="text-white/40 font-mono">{count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sentiment tone overview */}
        <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-xl">
          <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
            <Brain className="h-4 w-4 text-emerald-400" />
            <span>Emotional & Reflective Tone</span>
          </h3>
          {Object.keys(stats.sentimentMap).length === 0 ? (
            <p className="text-xs text-white/30 py-4">No tone data analyzed yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {Object.entries(stats.sentimentMap).map(([tone, count]) => (
                <div
                  key={tone}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#111111] px-3.5 py-2 text-xs"
                >
                  <span className="font-medium text-white/80">{tone}</span>
                  <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] text-indigo-300 font-mono">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Key Insights Stream */}
      <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>Key Breakthroughs & Realizations</span>
          </h3>
        </div>

        {stats.allInsights.length === 0 ? (
          <div className="text-center py-6 text-xs text-white/30">
            <p>Start reflecting with Gemini to distill your first key realization.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {stats.allInsights.map((item, idx) => {
              const matchedEntry = entries.find((e) => e.id === item.entryId);
              return (
                <div
                  key={idx}
                  onClick={() => matchedEntry && onSelectEntry(matchedEntry)}
                  className="rounded-2xl border border-white/10 bg-[#111111] p-4 hover:border-white/20 hover:bg-white/[0.02] cursor-pointer transition-all flex flex-col justify-between shadow-md"
                >
                  <div>
                    <p className="text-xs font-bold text-indigo-300 line-clamp-1">
                      {item.title}
                    </p>
                    <p className="text-xs text-white/80 mt-2 font-normal leading-relaxed italic">
                      "{item.insight}"
                    </p>
                  </div>
                  <div className="mt-4 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] text-white/40">
                    <span>
                      {new Date(item.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="text-indigo-400 font-semibold hover:underline">
                      View Entry →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
