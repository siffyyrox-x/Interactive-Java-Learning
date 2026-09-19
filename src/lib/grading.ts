import { runJava, checkOutput, compileJava, type RunError } from '../engine/java';
import { checkRules } from '../engine/rules';
import type { Problem } from '../content/model';

export interface TestResult { input: string; expected: string; actual: string; pass: boolean; sample: boolean; missing?: string; unexpected?: string; error?: RunError }
export interface Grade { compileError?: RunError; rules: string[]; results: TestResult[]; passed: number; total: number; allPass: boolean }

const expectedCache = new Map<string, string>();
/** The expected output for an input is whatever the (JDK-verified) reference solution prints. */
export function expectedOutput(p: Problem, input: string): string {
  const key = p.id + '\u0000' + input;
  let v = expectedCache.get(key);
  if (v === undefined) { v = runJava(p.solution, { stdin: input }).output; expectedCache.set(key, v); }
  return v;
}

export function testInputs(p: Problem): { input: string; sample: boolean }[] {
  if (p.kind !== 'code') return [{ input: p.samples?.[0]?.input ?? '', sample: true }];
  return [...(p.samples ?? []).map(s => ({ input: s.input, sample: true })), ...(p.tests ?? []).map(t => ({ input: t, sample: false }))];
}

export function gradeCode(p: Problem, code: string): Grade {
  const c = compileJava(code);
  if (!c.ok) return { compileError: c.error, rules: [], results: [], passed: 0, total: testInputs(p).length, allPass: false };
  const results: TestResult[] = testInputs(p).map(({ input, sample }) => {
    const expected = expectedOutput(p, input);
    const r = runJava(code, { stdin: input });
    const chk = r.ok ? checkOutput(r.output, expected, !!p.strict) : { pass: false };
    return { input, expected, actual: r.output, pass: r.ok && chk.pass, sample, missing: 'missing' in chk ? chk.missing : undefined, unexpected: 'unexpected' in chk ? chk.unexpected : undefined, error: r.error };
  });
  const rules = checkRules(code, p.rules);
  const passed = results.filter(r => r.pass).length;
  return { rules, results, passed, total: results.length, allPass: passed === results.length && rules.length === 0 };
}

/** Line-by-line score for an exact-output answer. */
export function gradeOutput(expected: string, given: string): { correct: number; total: number; lines: { want: string; got: string; ok: boolean }[] } {
  const norm = (s: string) => s.replace(/\r/g, '').split('\n').map(l => l.replace(/\s+$/, '')).join('\n').replace(/\n+$/, '').split('\n');
  const w = norm(expected), g = norm(given.trim() ? given : '');
  const lines = w.map((want, i) => ({ want, got: g[i] ?? '', ok: (g[i] ?? '').trim() === want.trim() }));
  const extra = Math.max(0, g.length - w.length);
  return { correct: lines.filter(l => l.ok).length, total: w.length + extra, lines };
}
