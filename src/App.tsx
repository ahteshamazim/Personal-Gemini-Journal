import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import {
  signInWithGoogle,
  signOutUser,
  subscribeToAuth,
  subscribeToUserEntries,
  deleteJournalEntry,
  updateJournalEntry,
} from "./services/firebase";
import { JournalEntry, UserProfile } from "./types";
import { Navbar } from "./components/Navbar";
import { AuthLanding } from "./components/AuthLanding";
import { EntryEditor } from "./components/EntryEditor";
import { HistoryView } from "./components/HistoryView";
import { InsightsStats } from "./components/InsightsStats";
import { SecurityBadgeModal } from "./components/SecurityBadgeModal";
import { ExportModal } from "./components/ExportModal";

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // App navigation & data state
  const [currentTab, setCurrentTab] = useState<"editor" | "history" | "insights">("editor");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);
  const [exportTargetEntry, setExportTargetEntry] = useState<JournalEntry | null>(null);
  const [savingStatus, setSavingStatus] = useState<"saved" | "saving" | "error" | "idle">("saved");

  // Subscribe to Firebase Auth state
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setFirebaseUser(user);
      setAuthLoading(false);
      if (!user) {
        setEntries([]);
        setActiveEntry(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to user-isolated Firestore entries when authenticated
  useEffect(() => {
    if (!firebaseUser?.uid) return;

    const unsubscribe = subscribeToUserEntries(
      firebaseUser.uid,
      (fetchedEntries) => {
        setEntries(fetchedEntries);
        // If activeEntry exists, update its reference from latest snapshot
        if (activeEntry) {
          const matched = fetchedEntries.find((e) => e.id === activeEntry.id);
          if (matched) {
            setActiveEntry(matched);
          }
        }
      },
      (error) => {
        console.error("User entries snapshot error:", error);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser?.uid, activeEntry?.id]);

  const handleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Sign-in failed:", err);
      setAuthError(
        err?.message || "Failed to complete Google Sign-In. Please try again."
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setCurrentTab("editor");
    } catch (err) {
      console.error("Sign-out failed:", err);
    }
  };

  const handleSelectEntry = (entry: JournalEntry) => {
    setActiveEntry(entry);
    setCurrentTab("editor");
  };

  const handleNewEntry = () => {
    setActiveEntry(null);
    setCurrentTab("editor");
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!firebaseUser?.uid) return;
    try {
      await deleteJournalEntry(firebaseUser.uid, entryId);
      if (activeEntry?.id === entryId) {
        setActiveEntry(null);
      }
    } catch (err) {
      console.error("Delete entry failed:", err);
    }
  };

  const handleToggleFavorite = async (entryId: string, current: boolean) => {
    if (!firebaseUser?.uid) return;
    try {
      await updateJournalEntry(firebaseUser.uid, entryId, {
        isFavorite: !current,
      });
    } catch (err) {
      console.error("Toggle favorite failed:", err);
    }
  };

  // Loading initial auth state
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-[#e0e0e0]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-xs text-white/40">Verifying session...</p>
        </div>
      </div>
    );
  }

  // Not authenticated: Show Landing / Sign-in prompt
  if (!firebaseUser) {
    return (
      <AuthLanding
        onSignIn={handleSignIn}
        isLoading={authLoading}
        error={authError}
      />
    );
  }

  const userProfile: UserProfile = {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
    photoURL: firebaseUser.photoURL,
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#050505] text-[#e0e0e0] antialiased selection:bg-indigo-600 selection:text-white font-sans">
      {/* Top Application Bar */}
      <Navbar
        user={userProfile}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onNewEntry={handleNewEntry}
        onSignOut={handleSignOut}
        onOpenSecurity={() => setIsSecurityModalOpen(true)}
        savingStatus={savingStatus}
      />

      {/* Main Content Areas */}
      <main className="flex flex-1 flex-col">
        {currentTab === "editor" && (
          <EntryEditor
            userId={firebaseUser.uid}
            activeEntry={activeEntry}
            onEntrySaved={(saved) => {
              setActiveEntry(saved);
              setSavingStatus("saved");
            }}
            onDeleteEntry={handleDeleteEntry}
            onExportEntry={(e) => setExportTargetEntry(e)}
            onNewEntry={handleNewEntry}
          />
        )}

        {currentTab === "history" && (
          <HistoryView
            entries={entries}
            onSelectEntry={handleSelectEntry}
            onDeleteEntry={handleDeleteEntry}
            onToggleFavorite={handleToggleFavorite}
            onExportEntry={(e) => setExportTargetEntry(e)}
            onNewEntry={handleNewEntry}
          />
        )}

        {currentTab === "insights" && (
          <InsightsStats
            entries={entries}
            onSelectEntry={handleSelectEntry}
            onNewEntry={handleNewEntry}
          />
        )}
      </main>

      {/* Modals */}
      <SecurityBadgeModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        userId={firebaseUser.uid}
      />

      <ExportModal
        isOpen={Boolean(exportTargetEntry)}
        onClose={() => setExportTargetEntry(null)}
        entry={exportTargetEntry}
      />
    </div>
  );
}
