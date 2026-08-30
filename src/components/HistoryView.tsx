import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Star,
  Calendar,
  Sparkles,
  ChevronRight,
  Trash2,
  Share2,
  BookOpen,
  MessageSquare,
  Tag,
  ArrowUpDown,
  FileText,
  MapPin,
  Webhook,
} from "lucide-react";
import { JournalEntry } from "../types";
import { WebhookModal } from "./WebhookModal";

interface HistoryViewProps {
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  onToggleFavorite: (entryId: string, current: boolean) => void;
  onExportEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  entries,
  onSelectEntry,
  onDeleteEntry,
  onToggleFavorite,
  onExportEntry,
  onNewEntry,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSentiment, setSelectedSentiment] = useState("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "messages">("newest");
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);
  const [webhookTargetEntry, setWebhookTargetEntry] = useState<JournalEntry | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => {
      if (e.category) set.add(e.category);
    });
    return ["all", ...Array.from(set)];
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries
      .filter((entry) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = entry.title?.toLowerCase().includes(q);
          const matchSummary = entry.summary?.toLowerCase().includes(q);
          const matchTags = entry.tags?.some((t) => t.toLowerCase().includes(q));
          const matchLocation = entry.location?.placeName?.toLowerCase().includes(q);
          const matchMessages = entry.messages?.some((m) =>
            m.content.toLowerCase().includes(q)
          );
          if (!matchTitle && !matchSummary && !matchTags && !matchLocation && !matchMessages) {
            return false;
          }
        }

        // Category filter
        if (selectedCategory !== "all" && entry.category !== selectedCategory) {
          return false;
        }

        // Sentiment filter
        if (
          selectedSentiment !== "all" &&
          entry.sentiment?.toLowerCase() !== selectedSentiment.toLowerCase()
        ) {
          return false;
        }

        // Favorites filter
        if (favoritesOnly && !entry.isFavorite) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") return b.updatedAt - a.updatedAt;
        if (sortBy === "oldest") return a.updatedAt - b.updatedAt;
        if (sortBy === "messages") return (b.messages?.length || 0) - (a.messages?.length || 0);
        return 0;
      });
  }, [entries, searchQuery, selectedCategory, selectedSentiment, favoritesOnly, sortBy]);

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Search & Filtering Controls */}
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Reflection Vault
            </h2>
            <p className="text-xs text-white/40 mt-1">
              Encrypted and user-isolated Firestore document repository ({entries.length} reflections stored)
            </p>
          </div>

          <button
            onClick={onNewEntry}
            className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-black hover:bg-indigo-50 transition-all shadow-lg"
          >
            <span>Start New Session</span>
          </button>
        </div>

        {/* Search input & Filter row */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reflections, places, tags..."
              className="w-full rounded-xl border border-white/10 bg-[#0a0a0a] pl-10 pr-4 py-2 text-xs text-white placeholder-white/30 focus:border-indigo-500/50 focus:outline-none"
            />
          </div>

          {/* Category filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-3.5 py-2 text-xs text-white/80 focus:border-indigo-500/50 focus:outline-none capitalize"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  Category: {c === "all" ? "All Categories" : c}
                </option>
              ))}
            </select>
          </div>

          {/* Sentiment filter */}
          <div className="relative">
            <select
              value={selectedSentiment}
              onChange={(e) => setSelectedSentiment(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-3.5 py-2 text-xs text-white/80 focus:border-indigo-500/50 focus:outline-none capitalize"
            >
              <option value="all">Tone: All Sentiments</option>
              <option value="balanced">Balanced</option>
              <option value="energized">Energized</option>
              <option value="contemplative">Contemplative</option>
              <option value="analytical">Analytical</option>
              <option value="creative">Creative</option>
            </select>
          </div>

          {/* Sort & Favorites */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFavoritesOnly(!favoritesOnly)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                favoritesOnly
                  ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
                  : "border-white/10 bg-[#0a0a0a] text-white/50 hover:text-white"
              }`}
            >
              <Star className={`h-3.5 w-3.5 ${favoritesOnly ? "fill-current text-amber-400" : ""}`} />
              <span>Favorites</span>
            </button>

            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="rounded-xl border border-white/10 bg-[#0a0a0a] px-3 py-2 text-xs text-white/80 focus:border-indigo-500/50 focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="messages">Most Turns</option>
            </select>
          </div>
        </div>
      </div>

      {/* Entries List or Empty State */}
      <div className="pt-6">
        {filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#0a0a0a] p-12 text-center">
            <div className="h-12 w-12 rounded-2xl bg-white/5 text-indigo-400 flex items-center justify-center mb-3">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-white text-base">
              {searchQuery || selectedCategory !== "all" || favoritesOnly
                ? "No matching reflections found"
                : "Your Vault is Empty"}
            </h3>
            <p className="max-w-sm text-xs text-white/40 mt-1.5 leading-relaxed">
              {searchQuery || selectedCategory !== "all" || favoritesOnly
                ? "Try adjusting your search query, category filter, or reset favorites filter."
                : "Begin your first conversational journal entry with Gemini 3.6 Flash. All reflections are isolated and protected by Cloud Firestore rules."}
            </p>
            {!searchQuery && selectedCategory === "all" && (
              <button
                onClick={onNewEntry}
                className="mt-5 flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors shadow-lg"
              >
                <span>Write First Reflection</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 hover:border-white/20 hover:bg-white/[0.02] transition-all shadow-xl"
              >
                <div>
                  {/* Card Header: Category, Date, Favorite */}
                  <div className="flex items-center justify-between gap-2 text-[11px] text-white/40 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="rounded-md bg-white/5 px-2 py-0.5 font-semibold text-[10px] uppercase tracking-wider text-indigo-400 border border-white/10">
                        {entry.category}
                      </span>
                      {entry.sentiment && (
                        <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-white/40 border border-white/5">
                          {entry.sentiment}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(entry.id, entry.isFavorite);
                        }}
                        className={`p-1 rounded transition-colors ${
                          entry.isFavorite
                            ? "text-amber-400"
                            : "text-white/20 hover:text-white/60"
                        }`}
                        title={entry.isFavorite ? "Unfavorite" : "Favorite"}
                      >
                        <Star className={`h-3.5 w-3.5 ${entry.isFavorite ? "fill-current" : ""}`} />
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h3
                    onClick={() => onSelectEntry(entry)}
                    className="font-bold text-white text-base hover:text-indigo-300 cursor-pointer transition-colors line-clamp-1"
                  >
                    {entry.title}
                  </h3>

                  {/* Location badge if tagged */}
                  {entry.location?.placeName && (
                    <div className="mt-1.5 flex items-center gap-1 text-[11px] text-indigo-300/80 font-medium">
                      <MapPin className="h-3 w-3 text-indigo-400 shrink-0" />
                      <span className="truncate">{entry.location.placeName}</span>
                    </div>
                  )}

                  {/* Summary / Excerpt */}
                  <p className="mt-2 text-xs text-white/50 line-clamp-3 leading-relaxed">
                    {entry.summary ||
                      entry.messages?.[0]?.content ||
                      "Empty reflection draft..."}
                  </p>

                  {/* Key insight callout if present */}
                  {entry.keyInsight && (
                    <div className="mt-3.5 rounded-xl bg-white/[0.02] border border-white/10 p-3 text-[11px] text-white/80">
                      <span className="font-semibold text-indigo-400">Insight: </span>
                      {entry.keyInsight}
                    </div>
                  )}

                  {/* Tags */}
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                      {entry.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-lg bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-medium text-white/60"
                        >
                          #{tag}
                        </span>
                      ))}
                      {entry.tags.length > 3 && (
                        <span className="text-[10px] text-white/30 self-center">
                          +{entry.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer metadata & actions */}
                <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between text-[11px] text-white/40">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3 text-white/30" />
                      {entry.messages?.length || 0}
                    </span>
                    <span>
                      {new Date(entry.updatedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Webhook trigger */}
                    <button
                      onClick={() => setWebhookTargetEntry(entry)}
                      className="p-1.5 rounded-lg text-white/30 hover:text-indigo-300 hover:bg-white/5 transition-colors"
                      title="Webhook Schema"
                    >
                      <Webhook className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => onExportEntry(entry)}
                      className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-colors"
                      title="Export"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => setEntryToDelete(entry)}
                      className="p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-white/5 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => onSelectEntry(entry)}
                      className="ml-1 flex items-center gap-0.5 font-semibold text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      <span>Open</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {entryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-2xl space-y-4">
            <h4 className="text-base font-bold text-white">Delete Reflection?</h4>
            <p className="text-xs text-white/60 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-white">"{entryToDelete.title}"</span>? This will permanently remove it from your isolated Firestore repository.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setEntryToDelete(null)}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteEntry(entryToDelete.id);
                  setEntryToDelete(null);
                }}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 shadow-lg"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Webhook Modal */}
      {webhookTargetEntry && (
        <WebhookModal
          entry={webhookTargetEntry}
          userId={webhookTargetEntry.userId}
          onClose={() => setWebhookTargetEntry(null)}
        />
      )}
    </div>
  );
};
