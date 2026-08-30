import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Sparkles,
  Star,
  Tag,
  Trash2,
  Share2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lightbulb,
  FileText,
  ListTodo,
  Compass,
  Copy,
  Check,
  ChevronRight,
  MapPin,
  Webhook,
} from "lucide-react";
import { JournalEntry, Message, PromptIdea, ReflectionMode, LocationTag } from "../types";
import { requestReflection, fetchPromptIdeas } from "../services/gemini";
import { saveJournalEntry, updateJournalEntry } from "../services/firebase";
import { LocationPickerModal } from "./LocationPickerModal";
import { WebhookModal } from "./WebhookModal";

interface EntryEditorProps {
  userId: string;
  activeEntry: JournalEntry | null;
  onEntrySaved: (entry: JournalEntry) => void;
  onDeleteEntry?: (entryId: string) => void;
  onExportEntry?: (entry: JournalEntry) => void;
  onNewEntry: () => void;
}

const CATEGORIES = [
  "General",
  "Mindfulness",
  "Career & Goals",
  "Personal Growth",
  "Creative Ideas",
  "Gratitude",
  "Problem Solving",
];

const MODES: { key: ReflectionMode; label: string; icon: any; desc: string }[] = [
  {
    key: "reflect",
    label: "Reflect & Inquire",
    icon: Compass,
    desc: "Deep empathetic listening and thought-provoking questions",
  },
  {
    key: "summarize",
    label: "Synthesize",
    icon: FileText,
    desc: "Distill key themes and core realizations",
  },
  {
    key: "brainstorm",
    label: "Brainstorm",
    icon: Lightbulb,
    desc: "Explore divergent angles and creative possibilities",
  },
  {
    key: "action_items",
    label: "Action Items",
    icon: ListTodo,
    desc: "Extract concrete, low-friction next steps",
  },
];

export const EntryEditor: React.FC<EntryEditorProps> = ({
  userId,
  activeEntry,
  onEntrySaved,
  onDeleteEntry,
  onExportEntry,
  onNewEntry,
}) => {
  // Local state for the current reflection entry
  const [entryId, setEntryId] = useState<string>(activeEntry?.id || "");
  const [title, setTitle] = useState<string>(activeEntry?.title || "New Reflection");
  const [category, setCategory] = useState<string>(activeEntry?.category || "General");
  const [messages, setMessages] = useState<Message[]>(activeEntry?.messages || []);
  const [summary, setSummary] = useState<string>(activeEntry?.summary || "");
  const [tags, setTags] = useState<string[]>(activeEntry?.tags || ["Reflection"]);
  const [sentiment, setSentiment] = useState<string>(activeEntry?.sentiment || "Balanced");
  const [keyInsight, setKeyInsight] = useState<string>(activeEntry?.keyInsight || "");
  const [isFavorite, setIsFavorite] = useState<boolean>(activeEntry?.isFavorite || false);
  const [location, setLocation] = useState<LocationTag | undefined>(activeEntry?.location);
  const [createdAt, setCreatedAt] = useState<number>(activeEntry?.createdAt || Date.now());

  // Input & interaction state
  const [inputText, setInputText] = useState<string>("");
  const [selectedMode, setSelectedMode] = useState<ReflectionMode>("reflect");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error" | "idle">("saved");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState<string>("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Modals state
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
  const [showWebhookModal, setShowWebhookModal] = useState<boolean>(false);

  // Prompt seeds drawer state
  const [promptIdeas, setPromptIdeas] = useState<PromptIdea[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState<boolean>(false);
  const [showPromptsDrawer, setShowPromptsDrawer] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync when activeEntry prop changes
  useEffect(() => {
    if (activeEntry) {
      setEntryId(activeEntry.id);
      setTitle(activeEntry.title);
      setCategory(activeEntry.category);
      setMessages(activeEntry.messages || []);
      setSummary(activeEntry.summary || "");
      setTags(activeEntry.tags || ["Reflection"]);
      setSentiment(activeEntry.sentiment || "Balanced");
      setKeyInsight(activeEntry.keyInsight || "");
      setIsFavorite(activeEntry.isFavorite);
      setLocation(activeEntry.location);
      setCreatedAt(activeEntry.createdAt);
      setErrorMessage(null);
    } else {
      // Initialize new fresh reflection
      const now = Date.now();
      setEntryId("");
      setTitle(`Reflection • ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`);
      setCategory("General");
      setMessages([]);
      setSummary("");
      setTags(["Reflection"]);
      setSentiment("Balanced");
      setKeyInsight("");
      setIsFavorite(false);
      setLocation(undefined);
      setCreatedAt(now);
      setInputText("");
      setErrorMessage(null);
    }
  }, [activeEntry?.id]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiLoading]);

  // Load initial prompt ideas
  useEffect(() => {
    loadPrompts(category);
  }, [category]);

  const loadPrompts = async (cat: string) => {
    setIsLoadingPrompts(true);
    try {
      const ideas = await fetchPromptIdeas(cat);
      setPromptIdeas(ideas);
    } catch (err) {
      console.warn("Failed loading prompt ideas:", err);
    } finally {
      setIsLoadingPrompts(false);
    }
  };

  // Helper to persist current state to Firestore
  const persistEntry = async (
    overrideMessages?: Message[],
    overrideAnalysis?: {
      summary?: string;
      tags?: string[];
      sentiment?: string;
      keyInsight?: string;
      title?: string;
      location?: LocationTag;
    }
  ) => {
    if (!userId) return;
    setSaveStatus("saving");

    try {
      const currentMsgs = overrideMessages || messages;
      const totalWords = currentMsgs.reduce(
        (acc, m) => acc + (m.content ? m.content.trim().split(/\s+/).length : 0),
        0
      );

      const entryPayload = {
        userId,
        title: overrideAnalysis?.title || title,
        category,
        messages: currentMsgs,
        summary: overrideAnalysis?.summary ?? summary,
        tags: overrideAnalysis?.tags ?? tags,
        sentiment: overrideAnalysis?.sentiment ?? sentiment,
        keyInsight: overrideAnalysis?.keyInsight ?? keyInsight,
        isFavorite,
        wordCount: totalWords,
        location: overrideAnalysis?.location !== undefined ? overrideAnalysis.location : location,
        createdAt,
        updatedAt: Date.now(),
      };

      const savedId = await saveJournalEntry(userId, entryPayload, entryId || undefined);
      if (!entryId) {
        setEntryId(savedId);
      }
      setSaveStatus("saved");
      setErrorMessage(null);

      onEntrySaved({
        id: savedId,
        ...entryPayload,
      });
    } catch (err: any) {
      console.error("Failed to save entry to Firestore:", err);
      setSaveStatus("error");
      setErrorMessage("Failed to save reflection to Firestore. Click retry below.");
    }
  };

  // Send message to Gemini
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const promptToSend = inputText.trim();
    if (!promptToSend || isAiLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: promptToSend,
      timestamp: Date.now(),
      mode: selectedMode,
    };

    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setInputText("");
    setIsAiLoading(true);
    setErrorMessage(null);

    try {
      // Call server-side Gemini 3.6 Flash endpoint
      const response = await requestReflection({
        prompt: promptToSend,
        history: messages,
        mode: selectedMode,
        title,
      });

      const modelMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: "model",
        content: response.reply,
        timestamp: Date.now(),
        mode: selectedMode,
        modelUsed: response.modelUsed || "gemini-3.6-flash",
      };

      const finalMessages = [...updatedHistory, modelMessage];
      setMessages(finalMessages);

      // Apply analysis from Gemini
      let newTitle = title;
      if (
        response.analysis.suggestedTitle &&
        (title.startsWith("New Reflection") || title.startsWith("Reflection •"))
      ) {
        newTitle = response.analysis.suggestedTitle;
        setTitle(newTitle);
      }

      if (response.analysis.summary) {
        setSummary(response.analysis.summary);
      }
      if (response.analysis.tags && response.analysis.tags.length > 0) {
        const mergedTags = Array.from(new Set([...tags, ...response.analysis.tags]));
        setTags(mergedTags);
      }
      if (response.analysis.sentiment) {
        setSentiment(response.analysis.sentiment);
      }
      if (response.analysis.keyInsight) {
        setKeyInsight(response.analysis.keyInsight);
      }

      // Persist to Cloud Firestore
      await persistEntry(finalMessages, {
        summary: response.analysis.summary,
        tags: Array.from(new Set([...tags, ...(response.analysis.tags || [])])),
        sentiment: response.analysis.sentiment,
        keyInsight: response.analysis.keyInsight,
        title: newTitle,
      });
    } catch (err: any) {
      console.error("Reflection generation error:", err);
      setErrorMessage(
        err?.message || "Gemini processing encountered an error. Please try again."
      );
      setSaveStatus("error");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleApplyPrompt = (question: string) => {
    setInputText((prev) => (prev ? `${prev}\n\n${question}` : question));
    setShowPromptsDrawer(false);
    textareaRef.current?.focus();
  };

  const handleToggleFavorite = async () => {
    const updated = !isFavorite;
    setIsFavorite(updated);
    if (entryId) {
      try {
        await updateJournalEntry(userId, entryId, { isFavorite: updated });
      } catch (e) {
        console.warn("Failed updating favorite:", e);
      }
    }
  };

  const handleSaveLocation = (loc?: LocationTag) => {
    setLocation(loc);
    persistEntry(undefined, { location: loc });
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTagInput.trim()) {
      e.preventDefault();
      const cleanTag = newTagInput.trim().replace(/^#/, "");
      if (!tags.includes(cleanTag)) {
        const updated = [...tags, cleanTag];
        setTags(updated);
        persistEntry(undefined, { tags: updated });
      }
      setNewTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = tags.filter((t) => t !== tagToRemove);
    setTags(updated);
    persistEntry(undefined, { tags: updated });
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="flex flex-1 flex-col h-[calc(100vh-4rem)] max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4">
      {/* Top Header Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5">
        {/* Title & Category */}
        <div className="flex flex-1 items-center gap-2.5 min-w-[240px]">
          <button
            onClick={handleToggleFavorite}
            className={`p-2 rounded-xl transition-colors ${
              isFavorite
                ? "text-amber-400 bg-amber-400/10 border border-amber-400/20"
                : "text-white/40 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
            title={isFavorite ? "Favorited" : "Mark as Favorite"}
          >
            <Star className="h-4 w-4 fill-current" />
          </button>

          <input
            id="entry-title-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => persistEntry()}
            placeholder="Untitled Reflection..."
            className="flex-1 bg-transparent text-lg font-semibold text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 rounded-lg px-2.5 py-1"
          />

          <select
            id="entry-category-select"
            value={category}
            onChange={(e) => {
              const newCat = e.target.value;
              setCategory(newCat);
              persistEntry();
            }}
            className="rounded-xl border border-white/10 bg-[#111111] px-3 py-1.5 text-xs font-medium text-white/80 focus:border-indigo-500/50 focus:outline-none"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Location & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Location Tag Pill */}
          <button
            onClick={() => setShowLocationModal(true)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
              location?.placeName
                ? "border border-indigo-500/40 bg-indigo-600/20 text-indigo-300"
                : "border border-white/10 bg-[#111111] text-white/40 hover:text-white hover:bg-white/5"
            }`}
            title={location ? `Location: ${location.placeName}` : "Add Location Tag"}
          >
            <MapPin className="h-3.5 w-3.5 text-indigo-400" />
            <span className="max-w-[120px] truncate">
              {location?.placeName || "Add Location"}
            </span>
          </button>

          {/* Webhook Schema Generator Button */}
          <button
            onClick={() => setShowWebhookModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#111111] px-3 py-1.5 text-xs font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            title="Generate Webhook Notification Schema"
          >
            <Webhook className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Webhooks</span>
          </button>

          {/* Persistence status */}
          <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-[#111111] border border-white/10">
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Saving to Firestore...</span>
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1.5 text-white/60">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <span className="hidden sm:inline">Persisted</span>
              </span>
            )}
            {saveStatus === "error" && (
              <button
                onClick={() => persistEntry()}
                className="flex items-center gap-1.5 text-rose-400 hover:underline"
              >
                <AlertCircle className="h-3 w-3" />
                <span>Retry Save</span>
              </button>
            )}
          </div>

          <button
            id="btn-prompts-drawer"
            onClick={() => setShowPromptsDrawer(!showPromptsDrawer)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
              showPromptsDrawer
                ? "bg-indigo-600 text-white shadow-lg"
                : "border border-white/10 bg-[#111111] text-indigo-300 hover:bg-white/5"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Prompt Ideas</span>
          </button>

          {onExportEntry && (
            <button
              onClick={() =>
                onExportEntry({
                  id: entryId,
                  userId,
                  title,
                  category,
                  messages,
                  summary,
                  tags,
                  sentiment,
                  keyInsight,
                  isFavorite,
                  location,
                  wordCount: messages.reduce(
                    (a, m) => a + (m.content ? m.content.split(/\s+/).length : 0),
                    0
                  ),
                  createdAt,
                  updatedAt: Date.now(),
                })
              }
              title="Export Entry"
              className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 border border-white/10 transition-colors"
            >
              <Share2 className="h-4 w-4" />
            </button>
          )}

          {entryId && onDeleteEntry && (
            <button
              onClick={() => onDeleteEntry(entryId)}
              title="Delete Entry"
              className="p-2 rounded-xl text-white/30 hover:text-rose-400 hover:bg-white/5 border border-white/10 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Layout: Conversation on Left, Insight & Prompts on Right */}
      <div className="relative flex flex-1 overflow-hidden pt-3 gap-4">
        {/* Left Column: Multi-turn Chat / Reflection Stream */}
        <div className="flex flex-1 flex-col justify-between overflow-hidden bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-2xl">
          {/* Executive Summary & Insight Banner (if available) */}
          {(summary || keyInsight || location?.placeName) && (
            <div className="border-b border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shrink-0 mt-0.5">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="flex-1 text-xs">
                  {summary && (
                    <p className="text-white/80 leading-relaxed font-normal">
                      <span className="font-semibold text-indigo-300">Executive Summary: </span>
                      {summary}
                    </p>
                  )}
                  {keyInsight && (
                    <p className="mt-1.5 text-white/90 leading-relaxed font-medium">
                      <span className="font-semibold text-emerald-400">Core Realization: </span>
                      {keyInsight}
                    </p>
                  )}
                  {location?.placeName && (
                    <p className="mt-1 text-[11px] text-white/50 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-indigo-400 inline" />
                      <span>{location.placeName}</span>
                      {location.latitude !== undefined && location.longitude !== undefined && (
                        <span className="font-mono text-[10px] text-white/30">
                          ({location.latitude.toFixed(2)}°, {location.longitude.toFixed(2)}°)
                        </span>
                      )}
                    </p>
                  )}
                </div>
                {sentiment && (
                  <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/50 border border-white/10 shrink-0">
                    {sentiment}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Conversation Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
                <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 text-indigo-400 flex items-center justify-center mb-4 shadow-xl">
                  <Compass className="h-7 w-7" />
                </div>
                <h3 className="font-bold text-white text-base tracking-tight">
                  Begin Your Reflection
                </h3>
                <p className="max-w-md text-xs text-white/40 mt-1.5 leading-relaxed">
                  Write freely about what is on your mind, a challenge you are navigating, or a decision you are exploring. Gemini 3.6 Flash will reflect back, synthesize themes, and offer thoughtful inquiries.
                </p>

                {/* Quick Starters */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
                  {promptIdeas.slice(0, 4).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleApplyPrompt(p.question)}
                      className="text-left p-3.5 rounded-xl border border-white/10 bg-[#111111]/80 hover:border-indigo-500/40 hover:bg-white/5 transition-all text-xs text-white/70 group shadow-md"
                    >
                      <p className="font-semibold text-indigo-300 group-hover:text-indigo-200">
                        {p.title}
                      </p>
                      <p className="text-[11px] text-white/40 mt-1 line-clamp-2">
                        {p.question}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={msg.id || index}
                  className={`flex flex-col ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  {msg.role === "user" ? (
                    <div className="flex flex-col items-end max-w-2xl w-full">
                      <div className="bg-indigo-600/10 border border-indigo-500/20 px-6 py-4 rounded-2xl rounded-tr-none max-w-[85%] shadow-lg">
                        <p className="text-[15px] leading-relaxed text-indigo-50 whitespace-pre-wrap font-sans">
                          {msg.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-2 mr-2">
                        <span className="text-[10px] uppercase tracking-wider text-white/30 font-mono">
                          Sent at {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <button
                          onClick={() => copyToClipboard(msg.content, index)}
                          className="text-white/30 hover:text-white p-0.5"
                          title="Copy text"
                        >
                          {copiedIndex === index ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-4 max-w-2xl w-full">
                      <div className="w-10 h-10 shrink-0 bg-white/5 rounded-full border border-white/10 flex items-center justify-center mt-1">
                        <Sparkles className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div className="flex flex-col gap-2 max-w-[85%]">
                        <div className="bg-white/5 border border-white/10 px-6 py-5 rounded-2xl rounded-tl-none shadow-xl">
                          <div className="text-[15px] leading-relaxed text-white/80 whitespace-pre-wrap font-sans">
                            {msg.content}
                          </div>
                        </div>
                        <div className="flex items-center justify-between ml-2">
                          <span className="text-[10px] uppercase tracking-wider text-white/30 font-medium">
                            {msg.modelUsed || "Gemini 3.6 Flash"} • {msg.mode || "Insights"}
                          </span>
                          <button
                            onClick={() => copyToClipboard(msg.content, index)}
                            className="text-white/30 hover:text-white p-0.5"
                            title="Copy text"
                          >
                            {copiedIndex === index ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            {/* AI thinking state */}
            {isAiLoading && (
              <div className="flex gap-4 max-w-2xl w-full">
                <div className="w-10 h-10 shrink-0 bg-white/5 rounded-full border border-white/10 flex items-center justify-center animate-pulse">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-2xl rounded-tl-none shadow-xl flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" />
                  <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-xs text-white/40 font-mono tracking-wide ml-1">
                    Gemini 3.6 Flash synthesizing reflection...
                  </span>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-4 text-xs text-rose-300 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
                <button
                  onClick={() => handleSendMessage()}
                  className="rounded-lg bg-rose-600/30 px-3 py-1 font-semibold hover:bg-rose-600/50 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Composer & Interaction Modes */}
          <div className="p-4 sm:p-6 pt-2 border-t border-white/5">
            {/* Mode selection pills */}
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30 mr-1">
                Angle:
              </span>
              {MODES.map((m) => {
                const Icon = m.icon;
                const active = selectedMode === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setSelectedMode(m.key)}
                    title={m.desc}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-medium transition-all ${
                      active
                        ? "bg-indigo-600/20 border border-indigo-500/40 text-indigo-200 shadow-sm"
                        : "border border-white/5 bg-[#111111] text-white/40 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="h-3 w-3 text-indigo-400" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Input Form with Floating Dark Container & Subtle Backdrop Glow */}
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/5 blur-xl rounded-full"></div>
              <form
                onSubmit={handleSendMessage}
                className="relative bg-[#111111] border border-white/10 rounded-2xl p-2.5 shadow-2xl focus-within:border-indigo-500/50 transition-all"
              >
                <textarea
                  ref={textareaRef}
                  id="journal-input-textarea"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Write your reflection... (Cmd+Enter to send)"
                  rows={2}
                  disabled={isAiLoading}
                  className="w-full resize-none bg-transparent border-none outline-none px-4 py-2 text-sm text-white placeholder-white/20 font-sans disabled:opacity-50"
                />

                <div className="flex items-center justify-between pt-2 px-2 border-t border-white/5 text-[10px] text-white/30 font-mono">
                  <div className="flex items-center gap-3">
                    <span>{inputText.trim().split(/\s+/).filter(Boolean).length} words</span>
                    <span className="hidden sm:inline tracking-tight uppercase text-white/20">
                      Context: Gemini 3.6 Flash Active
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {inputText.trim() && (
                      <button
                        type="button"
                        onClick={() => setInputText("")}
                        className="px-2 py-1 text-white/40 hover:text-white font-sans text-xs"
                      >
                        Clear
                      </button>
                    )}

                    <button
                      type="submit"
                      id="btn-send-reflection"
                      disabled={!inputText.trim() || isAiLoading}
                      className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg hover:bg-indigo-500 active:scale-95 transition-all disabled:opacity-30"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </form>
            </div>
            <p className="text-center text-[10px] text-white/20 mt-3 uppercase tracking-[0.25em]">
              Authenticated via Firebase • Data stored in Google Cloud Firestore
            </p>
          </div>
        </div>

        {/* Right Drawer / Sidebar: Prompt Ideas & Tags Management */}
        {showPromptsDrawer && (
          <div className="w-80 flex flex-col rounded-2xl border border-white/10 bg-[#0a0a0a] p-4 shrink-0 shadow-2xl animate-in slide-in-from-right-4 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 font-bold text-white text-xs tracking-tight">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                <span>Reflection Sparks</span>
              </div>
              <button
                onClick={() => loadPrompts(category)}
                disabled={isLoadingPrompts}
                className="p-1 rounded-lg text-white/40 hover:text-indigo-300 hover:bg-white/5"
                title="Regenerate Prompts"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingPrompts ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
              {isLoadingPrompts ? (
                <div className="py-8 text-center text-xs text-white/40">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-400" />
                  <p>Curating thoughtful prompts...</p>
                </div>
              ) : (
                promptIdeas.map((idea) => (
                  <div
                    key={idea.id}
                    className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all text-xs"
                  >
                    <p className="font-semibold text-indigo-300">{idea.title}</p>
                    <p className="text-white/70 mt-1 leading-relaxed">{idea.question}</p>
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="text-[10px] text-white/30 italic">{idea.guidance}</span>
                      <button
                        onClick={() => handleApplyPrompt(idea.question)}
                        className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
                      >
                        <span>Use</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Tags section */}
            <div className="pt-3 border-t border-white/10">
              <p className="text-xs font-semibold text-white mb-2 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-indigo-400" />
                <span>Entry Tags</span>
              </p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-lg bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-medium text-white/80"
                  >
                    #{t}
                    <button
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-rose-400 ml-0.5 text-white/40"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Add tag (Press Enter)..."
                className="w-full rounded-xl border border-white/10 bg-[#111111] px-3 py-1.5 text-xs text-white placeholder-white/20 focus:border-indigo-500/50 focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Location Picker Modal */}
      {showLocationModal && (
        <LocationPickerModal
          initialLocation={location}
          onSave={handleSaveLocation}
          onClose={() => setShowLocationModal(false)}
        />
      )}

      {/* Webhook Notification Schema Generator Modal */}
      {showWebhookModal && (
        <WebhookModal
          entry={{
            id: entryId || `entry-${Date.now()}`,
            userId,
            title,
            category,
            messages,
            summary,
            tags,
            sentiment,
            keyInsight,
            isFavorite,
            location,
            wordCount: messages.reduce(
              (a, m) => a + (m.content ? m.content.split(/\s+/).length : 0),
              0
            ),
            createdAt,
            updatedAt: Date.now(),
          }}
          userId={userId}
          onClose={() => setShowWebhookModal(false)}
        />
      )}
    </div>
  );
};
