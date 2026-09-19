/**
 * Differential test: the in-browser interpreter against the real JDK.
 *
 *   tests/programs/*.java        must produce byte-identical stdout (and the same exception, if any)
 *   tests/compile-errors/*.java  must be rejected by both javac and the interpreter
 *
 * Requires javac/java on PATH. Development tool only — the site never needs Java.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { bundleEngine } from './lib/bundle.mjs';

const root = process.cwd();
try { execFileSync('javac', ['-version'], { stdio: 'pipe' }); }
catch { console.log('Skipping JDK differential test: javac not found.'); process.exit(0); }

const engine = await bundleEngine(root);
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'cse110-diff-'));

function runJdk(src, stdin) {
  const m = /public\s+class\s+(\w+)/.exec(src) ?? /class\s+(\w+)/.exec(src);
  const cls = m ? m[1] : 'Main';
  const dir = fs.mkdtempSync(path.join(work, 'c-'));
  fs.writeFileSync(path.join(dir, cls + '.java'), src);
  const c = spawnSync('javac', ['-nowarn', '-encoding', 'UTF-8', cls + '.java'], { cwd: dir, encoding: 'utf8' });
  if (c.status !== 0) return { compileError: (c.stderr || c.stdout).split('\n').filter(l => l && !l.startsWith('Picked up'))[0] };
  const r = spawnSync('java', ['-Xss16m', cls], { cwd: dir, input: stdin, encoding: 'utf8', timeout: 20000 });
  const stderr = (r.stderr || '').split('\n').filter(l => !l.startsWith('Picked up JAVA_TOOL_OPTIONS'));
  const exc = stderr.find(l => l.startsWith('Exception in thread'));
  return { stdout: r.stdout, exception: exc ?? null };
}

export function diffPrograms(files, dirName) {
  const results = [];
  for (const f of files) {
    const src = fs.readFileSync(path.join(dirName, f), 'utf8');
    const inFile = path.join(dirName, f.replace(/\.java$/, '.in'));
    const stdin = fs.existsSync(inFile) ? fs.readFileSync(inFile, 'utf8') : '';
    const jdk = runJdk(src, stdin);
    const ours = engine.runJava(src, { stdin });
    results.push({ f, jdk, ours });
  }
  return results;
}

let failures = 0, passed = 0;
const progDir = path.join(root, 'tests/programs');
for (const { f, jdk, ours } of diffPrograms(fs.readdirSync(progDir).filter(x => x.endsWith('.java')).sort(), progDir)) {
  if (jdk.compileError) { console.log(`✗ ${f}: JDK failed to compile the test itself: ${jdk.compileError}`); failures++; continue; }
  const problems = [];
  if (ours.error?.kind === 'compile') problems.push(`interpreter rejected valid code: line ${ours.error.line}: ${ours.error.message}`);
  if (ours.output !== jdk.stdout) {
    const a = jdk.stdout.split('\n'), b = ours.output.split('\n');
    let i = 0; while (i < a.length && a[i] === b[i]) i++;
    problems.push(`stdout differs at line ${i + 1}: JDK ${JSON.stringify(a[i])} vs ours ${JSON.stringify(b[i])}`);
  }
  const ourExc = ours.error?.kind === 'runtime' ? ours.error.message : null;
  if ((jdk.exception ?? null) !== ourExc) problems.push(`exception differs: JDK ${JSON.stringify(jdk.exception)} vs ours ${JSON.stringify(ourExc)}`);
  if (problems.length) { failures++; console.log(`✗ ${f}\n   ${problems.join('\n   ')}`); }
  else passed++;
}

const errDir = path.join(root, 'tests/compile-errors');
for (const f of fs.readdirSync(errDir).filter(x => x.endsWith('.java')).sort()) {
  const src = fs.readFileSync(path.join(errDir, f), 'utf8');
  const jdk = runJdk(src, '');
  const ours = engine.runJava(src, {});
  if (!jdk.compileError) { failures++; console.log(`✗ ${f}: javac ACCEPTED this "compile error" test — fix the test`); continue; }
  if (ours.error?.kind !== 'compile') { failures++; console.log(`✗ ${f}: javac rejects it (${jdk.compileError}) but the interpreter ${ours.error ? 'raised ' + ours.error.message : 'accepted it'}`); continue; }
  passed++;
  if (process.env.SHOW) console.log(`  ${f}\n    javac: ${jdk.compileError}\n    ours:  line ${ours.error.line}: ${ours.error.message}`);
}

fs.rmSync(work, { recursive: true, force: true });
console.log(`\n${passed} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
