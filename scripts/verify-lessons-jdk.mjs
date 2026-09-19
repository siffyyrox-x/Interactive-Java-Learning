/** Every program a lesson runs must print exactly what the real JDK prints. Development tool; needs javac. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { bundleEngine, bundleJsx, collectLessonSnippets } from './lib/bundle.mjs';

const root = process.cwd();
try { execFileSync('javac', ['-version'], { stdio: 'pipe' }); } catch { console.log('Skipping: javac not found.'); process.exit(0); }
const engine = await bundleEngine(root);
const { LESSONS } = await bundleJsx(root, 'src/lessons/index.ts');
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'cse110-lessons-'));
let fails = 0, n = 0;
for (const s of collectLessonSnippets(LESSONS)) {
  if (!s.code) continue;
  n++;
  let src = s.code;
  if (!/\bclass\s+\w+/.test(src)) {
    const imports = (src.match(/^import .*;$/gm) ?? []).join('\n');
    src = `import java.util.Scanner;\n${imports}\npublic class Main {\n    public static void main(String[] args) {\n${src.replace(/^import .*;$/gm, '')}\n    }\n}\n`;
  }
  const cls = /public\s+class\s+(\w+)/.exec(src)[1];
  const dir = fs.mkdtempSync(path.join(work, 'l-'));
  fs.writeFileSync(path.join(dir, cls + '.java'), src);
  const c = spawnSync('javac', ['-nowarn', cls + '.java'], { cwd: dir, encoding: 'utf8' });
  if (c.status !== 0) { fails++; console.log(`✗ ${s.where} (${s.kind}): javac rejected it\n${c.stderr}`); continue; }
  const r = spawnSync('java', [cls], { cwd: dir, input: s.stdin ?? '', encoding: 'utf8' });
  const ours = engine.runJava(s.code, { stdin: s.stdin ?? '' });
  if (r.stdout !== ours.output) { fails++; console.log(`✗ ${s.where} (${s.kind}) differs\n JDK:  ${JSON.stringify(r.stdout)}\n ours: ${JSON.stringify(ours.output)}`); }
}
console.log(`${n} lesson programs checked against the JDK, ${fails} failure(s)`);
process.exit(fails ? 1 : 0);
