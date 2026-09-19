/** Bundle TypeScript source modules into a temporary ES module so Node scripts can import them. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

export async function bundleModule(root, entry) {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cse110-bundle-'));
  const outfile = path.join(outDir, path.basename(entry).replace(/\.tsx?$/, '.mjs'));
  await build({ entryPoints: [path.join(root, entry)], bundle: true, format: 'esm', platform: 'node', target: 'node18', outfile, logLevel: 'silent' });
  const mod = await import(pathToFileURL(outfile).href);
  fs.rmSync(outDir, { recursive: true, force: true });
  return mod;
}

export const bundleEngine = (root) => bundleModule(root, 'src/engine/java/index.ts');

/** Bundle a module that contains JSX (lessons). React stays a normal dependency. */
export async function bundleJsx(root, entry) {
  const outDir = fs.mkdtempSync(path.join(root, 'node_modules', '.cse110-'));
  const outfile = path.join(outDir, 'out.mjs');
  await build({
    entryPoints: [path.join(root, entry)], bundle: true, format: 'esm', platform: 'node', target: 'node18', outfile, logLevel: 'silent',
    jsx: 'automatic', loader: { '.css': 'empty' }, external: ['react', 'react-dom', '@codemirror/*', 'codemirror', '@lezer/*'],
  });
  const mod = await import(pathToFileURL(outfile).href);
  fs.rmSync(outDir, { recursive: true, force: true });
  return mod;
}

/**
 * Walk every lesson section's element tree (without rendering) and collect the Java that the
 * learner will see executed: Watch / Predict / BranchExplorer / TraceTry code, Visualizer sources,
 * and ExamWalk problem ids.
 */
export function collectLessonSnippets(LESSONS) {
  const out = [];
  for (const [topic, lesson] of Object.entries(LESSONS)) {
    for (const sec of lesson.sections) {
      const where = `${topic}/${sec.id}`;
      const walk = (node) => {
        if (node == null || typeof node !== 'object') return;
        if (Array.isArray(node)) { node.forEach(walk); return; }
        const t = node.type, pr = node.props ?? {};
        const name = typeof t === 'function' ? t.name : typeof t === 'string' ? t : '';
        if (['Watch', 'Predict', 'TraceTry'].includes(name)) out.push({ where, kind: name, code: pr.code, stdin: pr.stdin });
        if (name === 'Visualizer') out.push({ where, kind: name, code: pr.source, stdin: pr.stdin });
        if (name === 'BranchExplorer') for (const v of [pr.min, pr.init, pr.max]) out.push({ where, kind: name, code: pr.code.replace(/VALUE/g, String(v)) });
        if (name === 'ExamWalk') out.push({ where, kind: name, id: pr.id, stdin: pr.input });
        walk(pr.children);
      };
      walk(sec.body());
    }
  }
  return out;
}
