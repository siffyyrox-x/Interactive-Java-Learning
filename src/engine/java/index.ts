import { parse } from './parser';
import { Checker } from './checker';
import { CompileError } from './lexer';
import { Interpreter, type RunOptions, type RunResult, type RunError } from './interpreter';

export type { RunResult, RunError, Step, VarView, FrameView, ArrView, LoopView, Highlight, IterRecord } from './interpreter';

export interface CompileResult { ok: boolean; error?: RunError }

function compileError(err: unknown): RunError {
  if (err instanceof CompileError) {
    return { kind: 'compile', name: 'CompileError', message: err.message, line: err.line, col: err.col, friendly: err.message };
  }
  const msg = err instanceof Error ? err.message : String(err);
  return { kind: 'compile', name: 'CompileError', message: msg, line: 1, friendly: msg };
}

/** Parse and type-check only. */
export function compileJava(source: string): CompileResult {
  try {
    const prog = parse(source);
    new Checker(prog).check();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: compileError(err) };
  }
}

/**
 * Compile and run a Java program (or snippet) entirely in the browser.
 * Execution is bounded: infinite loops stop after `maxOps`, deep recursion raises StackOverflowError.
 */
export function runJava(source: string, opts: RunOptions = {}): RunResult {
  let prog;
  try {
    prog = parse(source);
    new Checker(prog).check();
  } catch (err) {
    return { ok: false, output: '', error: compileError(err), steps: [], iterations: [], truncated: false, ops: 0 };
  }
  const rt = new Interpreter(prog, opts);
  const r = rt.run();
  return { ok: r.ok, output: rt.output, error: r.error, steps: rt.steps, iterations: rt.iterations, truncated: rt.truncated, ops: 0 };
}

/** Normalise program output for comparison: unify newlines, trim trailing spaces on each line and trailing blank lines. */
export function normalizeOutput(s: string): string {
  return s.replace(/\r\n?/g, '\n').split('\n').map(l => l.replace(/[ \t]+$/, '')).join('\n').replace(/\n+$/, '');
}

export interface OutputCheck { pass: boolean; missing?: string; unexpected?: string; firstDiffLine?: number }

const squash = (l: string) => l.replace(/\s+/g, ' ').trim();
/** A line that only asks the user for input, e.g. "Enter a number:" — tolerated in lenient mode. */
const isPrompt = (l: string) => l === '' || /[:?>]$/.test(l) || /\b(enter|input|type)\b/i.test(l);
const NUM = /-?\d+(?:\.\d+)?(?:E-?\d+)?/g;
/**
 * Equal text, where numbers may differ by floating-point noise or int/double formatting
 * (10580 vs 10580.0 vs 10580.000000000002). Wording and every other character must match.
 */
function sameWithNumbers(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.replace(NUM, '#') !== b.replace(NUM, '#')) return false;
  const na = a.match(NUM) ?? [], nb = b.match(NUM) ?? [];
  return na.every((x, i) => {
    const p = parseFloat(x), q = parseFloat(nb[i]);
    return Math.abs(p - q) <= 1e-6 * Math.max(1, Math.abs(p), Math.abs(q));
  });
}
/** The learner line equals the expected line, or is "<prompt>: <expected>" on one line. */
const lineMatches = (al: string, want: string) => {
  if (sameWithNumbers(al, want)) return true;
  // prompt on the same line: find a split point where the tail matches and the head ends like a prompt
  for (let k = al.length - 1; k > 0; k--) {
    const head = al.slice(0, k);
    if (/[:?>]\s?$/.test(head) && sameWithNumbers(al.slice(k).trim(), want)) return true;
  }
  return false;
};

/**
 * Compare a learner's output against the expected output.
 * Lenient (default): every expected line must appear in order; the only extra text allowed is
 * input prompts ("Enter a number:"), either on their own line or in front of an answer on the
 * same line. Spacing is normalised; letter case and wording must match exactly.
 * Strict: outputs must be identical apart from trailing whitespace.
 */
export function checkOutput(actual: string, expected: string, strict = false): OutputCheck {
  if (strict) {
    const na = normalizeOutput(actual), ne = normalizeOutput(expected);
    if (na === ne) return { pass: true };
    const al = na.split('\n'), el = ne.split('\n');
    let i = 0; while (i < al.length && i < el.length && al[i] === el[i]) i++;
    return { pass: false, missing: el[i], unexpected: al[i], firstDiffLine: i + 1 };
  }
  const a = normalizeOutput(actual).split('\n').map(squash);
  const e = normalizeOutput(expected).split('\n').map(squash).filter(l => l !== '');
  let p = 0;
  for (let k = 0; k < e.length; k++) {
    const want = e[k];
    let found = false;
    while (p < a.length) {
      const al = a[p++];
      if (lineMatches(al, want)) { found = true; break; }
      if (!isPrompt(al)) return { pass: false, missing: want, unexpected: al, firstDiffLine: k + 1 };
    }
    if (!found) return { pass: false, missing: want, firstDiffLine: k + 1 };
  }
  while (p < a.length) {
    const al = a[p++];
    if (!isPrompt(al)) return { pass: false, unexpected: al };
  }
  return { pass: true };
}
