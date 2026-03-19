import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';

// ─── Questions ────────────────────────────────────────────────────────────────

/** Default blank question object */
export const blankQuestion = () => ({ text: '', type: 'textarea', options: [] });

/**
 * Normalize questions from Firestore: converts legacy string[] to object[].
 * @param {Array} raw
 * @returns {{ text: string, type: string, options: string[] }[]}
 */
function normalizeQuestions(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return Array(5).fill(null).map(blankQuestion);
  return raw.map((q) =>
    typeof q === 'string'
      ? { text: q, type: 'textarea', options: [] }
      : { text: q.text || '', type: q.type || 'textarea', options: q.options || [] }
  );
}

/**
 * Fetch admin-defined questions from Firestore.
 * Returns an array of normalized question objects.
 */
export async function getQuestions() {
  const ref = doc(db, 'questions', 'config');
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return normalizeQuestions(snap.data().questions);
  }
  return Array(5).fill(null).map(blankQuestion);
}

/**
 * Save / overwrite the 5 questions in Firestore.
 * @param {string[]} questions - Array of 5 question strings
 */
export async function saveQuestions(questions) {
  const ref = doc(db, 'questions', 'config');
  await setDoc(ref, { questions, updatedAt: serverTimestamp() });
}

// ─── Submissions ──────────────────────────────────────────────────────────────

/**
 * Check if a user has already submitted for a given week number.
 * @param {string} userName
 * @param {number} weekNumber
 * @returns {boolean}
 */
export async function hasSubmittedThisWeek(userName, weekNumber) {
  const q = query(
    collection(db, 'submissions'),
    where('userName', '==', userName),
    where('weekNumber', '==', weekNumber)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

/**
 * Submit a user's answers for the week.
 * @param {{ userName: string, answers: object, weekNumber: number }} data
 */
export async function submitAnswers({ userName, answers, weekNumber }) {
  await addDoc(collection(db, 'submissions'), {
    userName,
    answers,
    weekNumber,
    createdAt: serverTimestamp(),
  });
}

/**
 * Fetch all submissions for the admin table.
 * Returns an array of submission objects with id.
 */
export async function getAllSubmissions() {
  const q = query(collection(db, 'submissions'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
