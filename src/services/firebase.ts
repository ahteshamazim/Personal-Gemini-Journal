import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { JournalEntry, UserProfile } from "../types";

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export const signInWithGoogle = async (): Promise<User> => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  // Persist user profile node in Firestore with strict isolation
  try {
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(
      userDocRef,
      sanitizePayload({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastLoginAt: Date.now(),
      }),
      { merge: true }
    );
  } catch (err) {
    console.warn("Could not sync user profile to firestore:", err);
  }

  return user;
};

export const signOutUser = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

export const subscribeToAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Strict Undefined-Stripping (Zero-Crash Payload Hygiene as mandated in Directives)
export function sanitizePayload<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) => (value === undefined ? null : value))
  );
}

// User-isolated collection path: /users/{userId}/interactions
const getInteractionsCol = (userId: string) => {
  if (!userId) throw new Error("userId is required to access interactions");
  return collection(db, "users", userId, "interactions");
};

export const saveJournalEntry = async (
  userId: string,
  entry: Omit<JournalEntry, "id">,
  entryId?: string
): Promise<string> => {
  if (!userId) throw new Error("Authenticated userId is required to save entries");

  const interactionsRef = getInteractionsCol(userId);
  const docRef = entryId ? doc(interactionsRef, entryId) : doc(interactionsRef);

  const cleanData = sanitizePayload({
    ...entry,
    id: docRef.id,
    userId,
    updatedAt: Date.now(),
  });

  await setDoc(docRef, cleanData, { merge: true });
  return docRef.id;
};

export const updateJournalEntry = async (
  userId: string,
  entryId: string,
  updates: Partial<JournalEntry>
): Promise<void> => {
  if (!userId || !entryId) throw new Error("userId and entryId are required");
  const docRef = doc(db, "users", userId, "interactions", entryId);
  const cleanUpdates = sanitizePayload({
    ...updates,
    updatedAt: Date.now(),
  });
  await updateDoc(docRef, cleanUpdates);
};

export const deleteJournalEntry = async (
  userId: string,
  entryId: string
): Promise<void> => {
  if (!userId || !entryId) throw new Error("userId and entryId are required");
  const docRef = doc(db, "users", userId, "interactions", entryId);
  await deleteDoc(docRef);
};

export const subscribeToUserEntries = (
  userId: string,
  onData: (entries: JournalEntry[]) => void,
  onError: (err: any) => void
) => {
  if (!userId) {
    onData([]);
    return () => {};
  }

  const interactionsRef = getInteractionsCol(userId);
  const q = query(interactionsRef, orderBy("updatedAt", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const entries: JournalEntry[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          userId: data.userId || userId,
          title: data.title || "Untitled Reflection",
          category: data.category || "General",
          messages: Array.isArray(data.messages) ? data.messages : [],
          summary: data.summary || "",
          tags: Array.isArray(data.tags) ? data.tags : [],
          sentiment: data.sentiment || "Balanced",
          keyInsight: data.keyInsight || "",
          isFavorite: Boolean(data.isFavorite),
          wordCount: typeof data.wordCount === "number" ? data.wordCount : 0,
          createdAt: typeof data.createdAt === "number" ? data.createdAt : Date.now(),
          updatedAt: typeof data.updatedAt === "number" ? data.updatedAt : Date.now(),
        };
      });
      onData(entries);
    },
    (error) => {
      console.error("Firestore subscription error:", error);
      onError(error);
    }
  );
};
