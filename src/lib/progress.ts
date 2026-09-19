import { useSyncExternalStore } from 'react';
import type { TopicId } from '../content/model';

/**
 * Everything a learner does is stored only in this browser (localStorage), under one
 * versioned key. Unreadable or unavailable storage falls back to a fresh, in-memory state.
 */
export interface ExamRecord { id: string; kind: 'mid' | 'final' | 'drill'; title: string; score: number; total: number; at: string; perTopic: Record<string, [number, number]>; minutes: number }
export interface Progress {
  version: 2;
  solved: Record<string, string>;                         // problemId -> ISO time first solved
  tries: Record<string, { n: number; last: boolean; at: string }>;
  drafts: Record<string, string>;                         // problemId -> code
  sections: Record<string, string[]>;                      // topicId -> completed lesson section ids
  exams: ExamRecord[];
  bookmarks: string[];
  theme: 'dark' | 'light';
  lastLesson?: TopicId;
  lastProblem?: string;
  streak: { last?: string; days: number };
  labCode?: string;
  labInput?: string;
}

const KEY = 'cse110-lab-v2';
const fresh = (): Progress => ({ version: 2, solved: {}, tries: {}, drafts: {}, sections: {}, exams: [], bookmarks: [], theme: 'dark', streak: { days: 0 } });

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const p = JSON.parse(raw);
    if (!p || p.version !== 2 || typeof p !== 'object') return fresh();
    const f = fresh();
    return {
      ...f, ...p,
      solved: obj(p.solved), tries: obj(p.tries), drafts: obj(p.drafts), sections: obj(p.sections),
      exams: Array.isArray(p.exams) ? p.exams : [], bookmarks: Array.isArray(p.bookmarks) ? p.bookmarks : [],
      theme: p.theme === 'light' ? 'light' : 'dark', streak: p.streak && typeof p.streak.days === 'number' ? p.streak : f.streak,
    };
  } catch { return fresh(); }
}
const obj = (x: unknown) => (x && typeof x === 'object' && !Array.isArray(x) ? x as Record<string, never> : {});

let state: Progress = load();
let storageOk = true;
const listeners = new Set<() => void>();

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); storageOk = true; } catch { storageOk = false; }
}

export function update(fn: (p: Progress) => Progress | void) {
  const draft = structuredClone(state);
  const r = fn(draft);
  state = r ?? draft;
  persist();
  listeners.forEach(l => l());
}

function touchStreak(p: Progress) {
  const today = new Date().toISOString().slice(0, 10);
  if (p.streak.last === today) return;
  const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  p.streak = { last: today, days: p.streak.last === y ? p.streak.days + 1 : 1 };
}

export const actions = {
  attempt(id: string, pass: boolean) {
    update(p => {
      const t = p.tries[id] ?? { n: 0, last: false, at: '' };
      p.tries[id] = { n: t.n + 1, last: pass, at: new Date().toISOString() };
      if (pass && !p.solved[id]) p.solved[id] = new Date().toISOString();
      p.lastProblem = id;
      touchStreak(p);
    });
  },
  saveDraft(id: string, code: string) { update(p => { p.drafts[id] = code; }); },
  clearDraft(id: string) { update(p => { delete p.drafts[id]; }); },
  completeSection(topic: TopicId, section: string) {
    update(p => { const s = new Set(p.sections[topic] ?? []); s.add(section); p.sections[topic] = [...s]; p.lastLesson = topic; touchStreak(p); });
  },
  visitLesson(topic: TopicId) { update(p => { p.lastLesson = topic; }); },
  toggleBookmark(id: string) { update(p => { p.bookmarks = p.bookmarks.includes(id) ? p.bookmarks.filter(b => b !== id) : [...p.bookmarks, id]; }); },
  saveExam(r: ExamRecord) { update(p => { p.exams = [...p.exams.filter(e => e.id !== r.id), r].slice(-60); touchStreak(p); }); },
  setTheme(t: 'dark' | 'light') { update(p => { p.theme = t; }); },
  saveLab(code: string, input: string) { update(p => { p.labCode = code; p.labInput = input; }); },
  reset() { try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ } state = fresh(); persist(); listeners.forEach(l => l()); },
};

export function useProgress(): Progress {
  return useSyncExternalStore(cb => { listeners.add(cb); return () => listeners.delete(cb); }, () => state, () => state);
}
export const getProgress = () => state;
export const storageAvailable = () => storageOk;
