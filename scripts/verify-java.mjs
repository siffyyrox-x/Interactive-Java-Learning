/** Full JDK verification (development only): interpreter differential tests, the problem bank, and lesson programs. */
import { spawnSync } from 'node:child_process';
let failed = false;
for (const s of ['scripts/diff-jdk.mjs', 'scripts/verify-problems.mjs', 'scripts/verify-lessons-jdk.mjs']) {
  console.log(`\n=== ${s}`);
  const r = spawnSync(process.execPath, [s], { stdio: 'inherit' });
  if (r.status !== 0) failed = true;
}
process.exit(failed ? 1 : 0);
