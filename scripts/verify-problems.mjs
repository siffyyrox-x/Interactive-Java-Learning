/**
 * Verifies every problem in the bank against the real JDK:
 *  - the reference solution compiles in the browser engine and in javac
 *  - for every sample and hidden-test input, browser-engine output == JDK output
 *  - every sample output copied from the course material matches the reference solution
 *  - flowchart nodes point at code that exists; trace tables have their variables
 *  - starter code compiles
 * Usage: node scripts/verify-problems.mjs [problem-id-filter]
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { bundleModule } from './lib/bundle.mjs';

const root = process.cwd();
const filter = process.argv[2] ?? '';
const hasJdk = (() => { try { execFileSync('javac', ['-version'], { stdio: 'pipe' }); return true; } catch { return false; } })();
const engine = await bundleModule(root, 'src/engine/java/index.ts');
const { checkRules } = await bundleModule(root, 'src/engine/rules.ts');
const { PROBLEMS } = await bundleModule(root, 'src/content/problems/index.ts');
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'cse110-prob-'));
const compiled = new Map();

function jdkRun(src, stdin) {
  let dir = compiled.get(src);
  if (!dir) {
    const cls = (/public\s+class\s+(\w+)/.exec(src) ?? /class\s+(\w+)/.exec(src))[1];
    dir = fs.mkdtempSync(path.join(work, 'p-'));
    fs.writeFileSync(path.join(dir, cls + '.java'), src);
    const c = spawnSync('javac', ['-nowarn', cls + '.java'], { cwd: dir, encoding: 'utf8' });
    if (c.status !== 0) return { compileError: c.stderr.split('\n').filter(l => l && !l.startsWith('Picked up')).slice(0, 3).join(' | ') };
    dir = { dir, cls };
    compiled.set(src, dir);
  }
  const r = spawnSync('java', ['-Xss16m', dir.cls], { cwd: dir.dir, input: stdin, encoding: 'utf8', timeout: 20000 });
  const exc = (r.stderr || '').split('\n').find(l => l.startsWith('Exception in thread'));
  return { out: r.stdout, exc };
}

let fails = 0, checks = 0;
const fail = (p, msg) => { fails++; console.log(`✗ ${p.id}: ${msg}`); };
const ids = new Set();
for (const p of PROBLEMS) {
  if (ids.has(p.id)) fail(p, 'duplicate id');
  ids.add(p.id);
  if (filter && !p.id.includes(filter)) continue;
  const c = engine.compileJava(p.solution);
  if (!c.ok) { fail(p, `reference does not compile in the engine: line ${c.error.line}: ${c.error.message}`); continue; }
  if (p.starter) { const s = engine.compileJava(p.starter); if (!s.ok) fail(p, `starter does not compile: ${s.error.message}`); }
  if (!p.hints?.length) fail(p, 'no hints');
  if (p.rules) {
    const v = checkRules(p.solution, p.rules);
    if (v.length) fail(p, 'reference solution breaks its own rules: ' + v.join(' / '));
  }
  if (p.restrictions?.length && !p.rules) console.log(`  note: ${p.id} lists restrictions but enforces no rules`);

  const inputs = p.kind === 'code' ? [...(p.samples ?? []).map(s => s.input), ...(p.tests ?? [])] : [p.samples?.[0]?.input ?? ''];
  if (p.kind === 'code' && inputs.length < 3) fail(p, `only ${inputs.length} test inputs`);
  for (const [i, input] of inputs.entries()) {
    const ours = engine.runJava(p.solution, { stdin: input });
    checks++;
    if (!ours.ok) { fail(p, `reference crashed on input ${JSON.stringify(input)}: ${ours.error.message}`); continue; }
    if (hasJdk) {
      const jdk = jdkRun(p.solution, input);
      if (jdk.compileError) { fail(p, 'javac rejected the reference: ' + jdk.compileError); break; }
      if (jdk.out !== ours.output) fail(p, `engine/JDK differ on input ${JSON.stringify(input)}:\n   JDK:  ${JSON.stringify(jdk.out)}\n   ours: ${JSON.stringify(ours.output)}`);
    }
    const sample = p.kind === 'code' ? p.samples?.[i] : p.samples?.[0];
    if (sample?.output !== undefined) {
      const chk = engine.checkOutput(ours.output, sample.output, true);
      if (!chk.pass) fail(p, `sample ${i + 1} from the material does not match the reference:\n   expected: ${JSON.stringify(sample.output)}\n   reference: ${JSON.stringify(ours.output)}`);
    }
  }

  if (p.kind === 'flowchart' && p.flowchart) {
    const lines = p.solution.split('\n');
    const walk = (items) => items.forEach(it => {
      for (const ref of it.code ?? []) {
        const [frag, nth] = ref.split('#');
        const hits = lines.filter(l => l.includes(frag)).length;
        if (hits < (nth ? +nth : 1)) fail(p, `flowchart node "${it.text.split('\n')[0]}" refers to "${ref}" but it occurs ${hits} time(s) in the solution`);
      }
      if (it.kind === 'decision') { walk(it.yes); walk(it.no); }
      if (it.kind === 'loop') walk(it.body);
    });
    walk(p.flowchart);
  }
  if (p.kind === 'trace-table') {
    const r = engine.runJava(p.solution, { trace: true });
    const top = r.iterations.filter(x => x.depth === 1);
    const loopId = top[0]?.loopId;
    const rows = top.filter(x => x.loopId === loopId);
    if (!rows.length) fail(p, 'no loop iterations recorded for the trace table');
    for (const v of p.traceVars ?? []) if (!rows.every(row => v in row.vars)) fail(p, `trace variable ${v} missing from iteration records`);
  }
}
fs.rmSync(work, { recursive: true, force: true });
console.log(`\n${PROBLEMS.length} problems, ${checks} runs checked${hasJdk ? ' against the JDK' : ' (no JDK: engine only)'}, ${fails} failure(s)`);
process.exit(fails ? 1 : 0);
