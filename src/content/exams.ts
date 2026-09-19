import type { Problem, TopicId } from './model';
import { PROBLEMS, problemById } from './problems';
import { TOPICS } from './topics';
import { runJava } from '../engine/java';
import { gradeCode, gradeOutput } from '../lib/grading';
import { scoreTrace, type TraceAnswers } from '../components/TraceTable';

export interface ExamSet { id: string; kind: 'mid' | 'final' | 'drill'; title: string; blurb: string; minutes: number; problems: string[] | (() => string[]) }

const pick = <T,>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)];
const shuffle = <T,>(xs: T[]): T[] => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const ids = (f: (p: Problem) => boolean) => PROBLEMS.filter(f).map(p => p.id);

export const EXAM_SETS: ExamSet[] = [
  { id: 'mid-1', kind: 'mid', title: 'Midterm Mock — Set 1', blurb: 'Laptop flowchart · weighted checksum · flag trace table', minutes: 75, problems: ['fc-laptop', 'dg-weighted-checksum', 'tr-mock-set1'] },
  { id: 'mid-2', kind: 'mid', title: 'Midterm Mock — Set 2', blurb: 'Catering flowchart · pair-difference checksum · do-while trace', minutes: 75, problems: ['fc-catering', 'dg-pair-difference', 'tr-mock-set2'] },
  { id: 'mid-3', kind: 'mid', title: 'Midterm Mock — Set 3', blurb: 'Course bundle flowchart · alternating-sum checksum · even/odd trace', minutes: 75, problems: ['fc-course-bundle', 'dg-alternating-sum', 'tr-mock-set3'] },
  { id: 'mid-4', kind: 'mid', title: 'Midterm Mock — Set 4', blurb: 'Delivery flowchart · square-sum checksum · for-loop trace', minutes: 75, problems: ['fc-delivery', 'dg-square-sum', 'tr-mock-set4'] },
  { id: 'mid-5', kind: 'mid', title: 'Midterm Mock — Set 5', blurb: 'Printing flowchart · product checksum · alternating-mode trace', minutes: 75, problems: ['fc-printing', 'dg-product-checksum', 'tr-mock-set5'] },
  { id: 'mid-past', kind: 'mid', title: 'Midterm — Past-Paper Style', blurb: 'Family trip flowchart · merge-last-two checksum · modulus trace', minutes: 75, problems: ['fc-family-trip', 'dg-merge-checksum', 'tr-real-midterm'] },
  {
    id: 'mid-random', kind: 'mid', title: 'Midterm — Random Paper', blurb: 'A fresh three-question paper drawn from the bank every time', minutes: 75,
    problems: () => [pick(ids(p => p.topic === 'flowcharts')), pick(ids(p => p.topic === 'digits' && p.difficulty === 'Exam')), pick(ids(p => p.kind === 'trace-table'))],
  },
  { id: 'final-1', kind: 'final', title: 'Final Mock — Set 1', blurb: 'Single-occurrence builder · first-and-last keeper · recursion trace', minutes: 90, problems: ['ab-single-occurrence', 'st-first-last-keeper', 'rc-mock1'] },
  { id: 'final-2', kind: 'final', title: 'Final Mock — Set 2', blurb: 'Negatives to the end · signed embedded sum · recursion trace', minutes: 90, problems: ['ab-negatives-last', 'st-signed-sum', 'rc-mock2'] },
  { id: 'final-3', kind: 'final', title: 'Final Mock — Set 3', blurb: 'Closest pair · simplify x-terms · recursion trace', minutes: 90, problems: ['ar-closest-pair', 'st-simplify-terms', 'rc-mock3'] },
  { id: 'final-4', kind: 'final', title: 'Final Mock — Methods Paper', blurb: 'Marks analyzer · rotate right with a method · two-call recursion', minutes: 90, problems: ['me-marks-analyzer', 'me-rotate-right', 'rc-mystery'] },
  {
    id: 'final-random', kind: 'final', title: 'Final — Random Paper', blurb: 'Array building, a String problem and a recursion trace, drawn fresh', minutes: 90,
    problems: () => [pick(ids(p => p.topic === 'array-build')), pick(ids(p => p.topic === 'strings' && p.kind === 'code' && p.difficulty !== 'Warm-up')), pick(ids(p => p.topic === 'recursion' && p.kind !== 'code'))],
  },
];

/** A short drill of one topic (or a mix of tracing questions). */
export function drillSet(topic: TopicId | 'tracing-mix'): ExamSet {
  const pool = topic === 'tracing-mix' ? ids(p => p.kind === 'trace-output') : ids(p => p.topic === topic);
  const n = topic === 'tracing-mix' ? 6 : 3;
  return { id: `drill-${topic}`, kind: 'drill', title: topic === 'tracing-mix' ? 'Quick Drill — Exact Output' : `Topic Drill — ${TOPICS.find(t => t.id === topic)?.title ?? topic}`, blurb: '', minutes: n * 8, problems: () => shuffle(pool).slice(0, n) };
}

export function examSetById(id: string): ExamSet | undefined {
  if (id.startsWith('drill-')) return drillSet(id.slice(6) as TopicId);
  return EXAM_SETS.find(s => s.id === id);
}

export type Answer = { code?: string; trace?: TraceAnswers; output?: string };
export interface QuestionScore { id: string; score: number; marks: number; detail: string }

/** Partial credit, the way a marker would give it: proportion of tests, cells or lines that are right. */
export function scoreAnswer(p: Problem, a: Answer | undefined): QuestionScore {
  const marks = p.marks;
  const round = (x: number) => Math.round(x * 2) / 2;
  if (p.kind === 'trace-table') {
    if (!a?.trace || (!Object.values(a.trace.cells).some(v => v.trim()) && !a.trace.output.trim())) return { id: p.id, score: 0, marks, detail: 'Not answered' };
    const s = scoreTrace(p.solution, p.traceVars ?? [], a.trace);
    const frac = (s.correct + s.outCorrect) / Math.max(1, s.total + s.outTotal);
    return { id: p.id, score: round(frac * marks), marks, detail: `${s.correct}/${s.total} cells · ${s.outCorrect}/${s.outTotal} output lines` };
  }
  if (p.kind === 'trace-output') {
    if (!a?.output?.trim()) return { id: p.id, score: 0, marks, detail: 'Not answered' };
    const expected = runJava(p.solution, { stdin: p.samples?.[0]?.input ?? '' }).output;
    const g = gradeOutput(expected, a.output);
    return { id: p.id, score: round((g.correct / Math.max(1, g.total)) * marks), marks, detail: `${g.correct}/${g.total} lines` };
  }
  const code = a?.code ?? '';
  if (!code.trim() || code.trim() === (p.starter ?? '').trim()) return { id: p.id, score: 0, marks, detail: 'Not answered' };
  const g = gradeCode(p, code);
  if (g.compileError) return { id: p.id, score: round(marks * 0.1), marks, detail: `Does not compile (line ${g.compileError.line}) — structure credit only` };
  let frac = g.passed / Math.max(1, g.total);
  if (g.rules.length) frac *= 0.5;
  return { id: p.id, score: round(frac * marks), marks, detail: `${g.passed}/${g.total} tests${g.rules.length ? ' · restriction broken (half credit)' : ''}` };
}

export const resolveProblems = (set: ExamSet): Problem[] => (typeof set.problems === 'function' ? set.problems() : set.problems).map(id => problemById(id)!).filter(Boolean);
