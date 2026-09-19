/**
 * Integrity tests run by `npm test` and by the GitHub Pages workflow before every deploy.
 * Needs no JDK and no network. (The JDK comparison lives in `npm run verify:java`.)
 *
 *  1. Problem bank: unique ids, valid topics, reference solutions compile and run on every
 *     sample/test input, samples copied from the material match, trace tables have rows.
 *  2. Grading: every reference solution earns full marks through the same code path learners use.
 *  3. Lessons: every section renders its tree, and every program a lesson runs compiles and runs.
 *  4. Exams: every mock paper resolves to real problems.
 *  5. Engine smoke tests on Java semantics that are easy to break.
 *  6. Shipped identity: credit present, no institutional branding or source filenames.
 */
import fs from 'node:fs';
import path from 'node:path';
import { bundleModule, bundleJsx, collectLessonSnippets } from './lib/bundle.mjs';

const root = process.cwd();
let fails = 0, checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) { fails++; console.log('✗ ' + msg); } };

const engine = await bundleModule(root, 'src/engine/java/index.ts');
const { PROBLEMS } = await bundleModule(root, 'src/content/problems/index.ts');
const { TOPICS } = await bundleModule(root, 'src/content/topics.ts');
const exams = await bundleJsx(root, 'src/content/exams.ts');
const { LESSONS } = await bundleJsx(root, 'src/lessons/index.ts');
const topicIds = new Set(TOPICS.map(t => t.id));

// ------------------------------------------------------------------ 1 + 2 · problems and grading
const ids = new Set();
for (const p of PROBLEMS) {
  ok(!ids.has(p.id), `${p.id}: duplicate id`); ids.add(p.id);
  ok(topicIds.has(p.topic), `${p.id}: unknown topic ${p.topic}`);
  ok(p.title && p.statement && p.hints?.length, `${p.id}: missing title, statement or hints`);
  const c = engine.compileJava(p.solution);
  ok(c.ok, `${p.id}: reference does not compile — ${c.error?.message}`);
  if (!c.ok) continue;
  if (p.starter) ok(engine.compileJava(p.starter).ok, `${p.id}: starter does not compile`);
  const inputs = p.kind === 'code' || p.kind === 'flowchart' ? [...(p.samples ?? []).map(s => s.input), ...(p.tests ?? [])] : [p.samples?.[0]?.input ?? ''];
  if (!inputs.length) inputs.push('');
  inputs.forEach((input, i) => {
    const r = engine.runJava(p.solution, { stdin: input });
    ok(r.ok, `${p.id}: reference crashed on ${JSON.stringify(input)} — ${r.error?.message}`);
    const s = p.samples?.[i];
    if (r.ok && s?.output !== undefined && (p.kind === 'code' || i === 0)) ok(engine.checkOutput(r.output, s.output, true).pass, `${p.id}: sample ${i + 1} does not match the reference`);
  });
  if (p.kind === 'trace-table') {
    const r = engine.runJava(p.solution, { trace: true });
    const rows = r.iterations.filter(x => x.depth === 1);
    ok(rows.length > 0, `${p.id}: trace table has no iterations`);
    for (const v of p.traceVars ?? []) ok(rows.some(x => v in x.vars), `${p.id}: trace variable ${v} never appears`);
  }
  // the learner's grading path gives the reference full marks
  const perfect = p.kind === 'trace-table'
    ? { trace: fullTrace(p) }
    : p.kind === 'trace-output' ? { output: engine.runJava(p.solution, { stdin: p.samples?.[0]?.input ?? '' }).output } : { code: p.solution };
  const sc = exams.scoreAnswer(p, perfect);
  ok(sc.score === sc.marks, `${p.id}: reference answer scores ${sc.score}/${sc.marks} (${sc.detail})`);
}
function fullTrace(p) {
  const r = engine.runJava(p.solution, { trace: true });
  const top = r.iterations.filter(x => x.depth === 1);
  const loopId = top[0]?.loopId;
  const cells = {};
  top.filter(x => x.loopId === loopId).forEach((x, i) => {
    (p.traceVars ?? []).forEach((v, c) => { cells[`${i}:${c}`] = x.vars[v] ?? ''; });
    cells[`${i}:out`] = x.out.replace(/\n$/, '').split('\n').filter(Boolean).join(', ');
  });
  return { cells, output: r.output };
}
for (const t of TOPICS) ok(PROBLEMS.filter(p => p.topic === t.id).length >= 3, `topic ${t.id} has fewer than 3 practice problems`);

// ------------------------------------------------------------------ 3 · lessons
for (const t of TOPICS) {
  const l = LESSONS[t.id];
  ok(l && l.sections.length >= 3, `lesson ${t.id} missing or has fewer than 3 sections`);
  if (l) { const sids = l.sections.map(s => s.id); ok(new Set(sids).size === sids.length, `lesson ${t.id} has duplicate section ids`); }
}
const snippets = collectLessonSnippets(LESSONS);
for (const s of snippets) {
  if (s.kind === 'ExamWalk') { ok(ids.has(s.id), `${s.where}: ExamWalk points at unknown problem ${s.id}`); continue; }
  const r = engine.runJava(s.code, { stdin: s.stdin ?? '' });
  ok(r.ok, `${s.where}: ${s.kind} program fails — line ${r.error?.line}: ${r.error?.message}`);
  if (s.kind === 'Predict') ok(r.output.trim().length > 0, `${s.where}: Predict prints nothing`);
}
ok(snippets.length > 50, `only ${snippets.length} runnable lesson snippets found`);

// ------------------------------------------------------------------ 4 · exams
for (const set of exams.EXAM_SETS) {
  for (let k = 0; k < (typeof set.problems === 'function' ? 5 : 1); k++) {
    const ps = exams.resolveProblems(set);
    ok(ps.length === 3, `${set.id}: resolves to ${ps.length} problems`);
  }
}
for (const t of [...TOPICS.map(t => t.id), 'tracing-mix']) ok(exams.resolveProblems(exams.drillSet(t)).length >= 3, `drill ${t} too small`);

// ------------------------------------------------------------------ 5 · engine smoke tests
const cases = [
  ['System.out.println(7 / 2 + " " + -7 % 3 + " " + 7.0 / 2);', '3 -1 3.5'],
  ['int x = Integer.MAX_VALUE; x++; System.out.println(x);', '-2147483648'],
  ['System.out.println(0.1 + 0.2);', '0.30000000000000004'],
  ['System.out.println((int) -2.7 + " " + (char) (\'A\' + 2));', '-2 C'],
  ['String a = "java"; String b = "ja"; b += "va"; System.out.println((a == b) + " " + a.equals(b));', 'false true'],
  ['System.out.printf("%.2f|%5d|%-3s|%n", 2.675, 42, "a");', '2.68|   42|a  |'],
  ['int i = 5; i = i++ + ++i; System.out.println(i);', '12'],
];
for (const [src, want] of cases) { const r = engine.runJava(src); ok(r.ok && r.output.trim() === want, `engine: ${src} → ${JSON.stringify(r.output.trim())}, want ${want}`); }
{ const r = engine.runJava('import java.util.Scanner;\nScanner sc = new Scanner(System.in);\nint n = sc.nextInt();\nString s = sc.nextLine();\nSystem.out.println("[" + s + "]" + n);', { stdin: '4\nhello' }); ok(r.output.trim() === '[]4', 'engine: nextLine-after-nextInt trap'); }
{ const r = engine.runJava('while (true) { }'); ok(!r.ok && r.error.kind === 'limit', 'engine: infinite loop is stopped'); }
{ const r = engine.runJava('int f(int n) { return f(n + 1); }\nSystem.out.println(f(0));'); ok(!r.ok && /StackOverflow/.test(r.error.name), 'engine: runaway recursion is stopped'); }
{ const r = engine.runJava('int x = 5.0;'); ok(!r.ok && r.error.kind === 'compile', 'engine: lossy conversion is a compile error'); }
ok(engine.checkOutput('Enter n: 12\n', '12\n').pass, 'checker: prompt tolerated');
ok(!engine.checkOutput('Not Leap Year\n', 'Leap Year\n').pass, 'checker: prompt tolerance does not hide wrong answers');

// ------------------------------------------------------------------ 6 · shipped identity
const shipped = [];
const walkDir = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => { const f = path.join(d, e.name); e.isDirectory() ? walkDir(f) : shipped.push(f); });
walkDir(path.join(root, 'src')); walkDir(path.join(root, 'public')); shipped.push(path.join(root, 'index.html'));
const banned = [/\bBRAC\b/i, /BRACU/i, /\b[\w-]+\.(pdf|docx|pptx)\b/i, /official (exam|question)/i];
for (const f of shipped) {
  const text = fs.readFileSync(f, 'utf8');
  for (const b of banned) ok(!b.test(text), `${path.relative(root, f)} contains ${b}`);
}
const shell = fs.readFileSync(path.join(root, 'src/components/Shell.tsx'), 'utf8');
for (const s of ['Sifat Sadakin', 'FYAT Mentor', 'Undergraduate Teaching Assistant', 'Office of Academic Advising', 'https://www.linkedin.com/in/sifat-sadakin-815b82243/']) ok(shell.includes(s), `credit is missing "${s}"`);
const vite = fs.readFileSync(path.join(root, 'vite.config.ts'), 'utf8');
ok(/base:\s*['"]\.\/['"]/.test(vite), "vite base must stay './' for GitHub Pages sub-paths");

console.log(`\n${PROBLEMS.length} problems · ${Object.keys(LESSONS).length} lessons · ${snippets.length} lesson programs · ${checks} checks · ${fails} failure(s)`);
process.exit(fails ? 1 : 0);
