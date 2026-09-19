import { useMemo, useState } from 'react';
import { runJava } from '../engine/java';
import { gradeOutput } from '../lib/grading';

export interface TraceAnswers { cells: Record<string, string>; output: string }

export function traceExpected(solution: string, vars: string[]) {
  const r = runJava(solution, { trace: true });
  const top = r.iterations.filter(x => x.depth === 1);
  const loopId = top[0]?.loopId;
  const rows = top.filter(x => x.loopId === loopId).map(x => ({ vars: vars.map(v => x.vars[v] ?? ''), out: x.out.replace(/\n$/, '').split('\n').filter(Boolean) }));
  return { rows, output: r.output, result: r };
}

const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();
const splitOut = (s: string) => s.split(/[,|/\n]+/).map(x => x.trim()).filter(Boolean);

export function scoreTrace(solution: string, vars: string[], a: TraceAnswers) {
  const exp = traceExpected(solution, vars);
  let correct = 0, total = 0;
  exp.rows.forEach((row, r) => {
    row.vars.forEach((v, c) => { total++; if (norm(a.cells[`${r}:${c}`] ?? '') === norm(v)) correct++; });
    total++;
    const got = splitOut(a.cells[`${r}:out`] ?? '');
    if (got.length === row.out.length && got.every((g, k) => norm(g) === norm(row.out[k]))) correct++;
  });
  const o = gradeOutput(exp.output, a.output);
  return { correct, total, outCorrect: o.correct, outTotal: o.total, exp };
}

/** Fill-in trace table: one row per iteration of main's first loop, then the full output. */
export function TraceTable({ solution, vars, value, onChange, reveal = false, checked = false }: {
  solution: string; vars: string[]; value: TraceAnswers; onChange: (a: TraceAnswers) => void; reveal?: boolean; checked?: boolean;
}) {
  const exp = useMemo(() => traceExpected(solution, vars), [solution, vars]);
  const set = (key: string, v: string) => onChange({ ...value, cells: { ...value.cells, [key]: v } });
  const cellState = (r: number, key: string, want: string | string[]) => {
    if (!checked) return '';
    const got = value.cells[`${r}:${key}`] ?? '';
    const ok = Array.isArray(want)
      ? (() => { const g = splitOut(got); return g.length === want.length && g.every((x, k) => norm(x) === norm(want[k])); })()
      : norm(got) === norm(want);
    return ok ? 'okc' : 'badc';
  };
  return (
    <div>
      <div className="table-wrap">
        <table className="tt">
          <thead><tr><th className="num">iter</th>{vars.map(v => <th key={v}>{v}</th>)}<th>printed this iteration</th></tr></thead>
          <tbody>
            {exp.rows.map((row, r) => (
              <tr key={r}>
                <td className="num">{r + 1}</td>
                {vars.map((v, c) => (
                  <td key={v} className={cellState(r, String(c), row.vars[c])}>
                    <input type="text" inputMode="text" aria-label={`iteration ${r + 1}, ${v}`} value={value.cells[`${r}:${c}`] ?? ''} onChange={e => set(`${r}:${c}`, e.target.value)} />
                    {(reveal || (checked && cellState(r, String(c), row.vars[c]) === 'badc')) && reveal && <span className="want">{row.vars[c]}</span>}
                  </td>
                ))}
                <td className={cellState(r, 'out', row.out)}>
                  <input type="text" aria-label={`iteration ${r + 1}, printed output`} placeholder={row.out.length > 1 ? 'a, b' : ''} value={value.cells[`${r}:out`] ?? ''} onChange={e => set(`${r}:out`, e.target.value)} />
                  {reveal && <span className="want">{row.out.join(', ') || '(nothing)'}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="tiny muted">Values are recorded at the end of each iteration's body (before a for-loop's update). If an iteration prints more than one line, separate them with commas. Leave the cell empty if nothing is printed.</p>
      <label className="field">Complete output (every printed line, in order)
        <textarea rows={Math.min(10, Math.max(3, exp.output.split('\n').length))} value={value.output} onChange={e => onChange({ ...value, output: e.target.value })} spellCheck={false} />
      </label>
    </div>
  );
}

/** Exact-output answer box with line-by-line marking. */
export function OutputAnswer({ expected, value, onChange, checked }: { expected: string; value: string; onChange: (v: string) => void; checked: boolean }) {
  const g = gradeOutput(expected, value);
  return (
    <div>
      <label className="field">Your output — one printed line per line
        <textarea rows={Math.min(14, Math.max(4, expected.split('\n').length + 1))} value={value} onChange={e => onChange(e.target.value)} spellCheck={false} aria-label="Your predicted output" />
      </label>
      {checked && (
        <div className="table-wrap" style={{ marginTop: 10 }}>
          <table>
            <thead><tr><th className="num">line</th><th>you wrote</th><th>Java prints</th></tr></thead>
            <tbody>
              {g.lines.map((l, k) => (
                <tr key={k}><td className="num">{k + 1}</td><td className="num" style={{ color: l.ok ? 'var(--green)' : 'var(--red)' }}>{l.got || '—'}</td><td className="num">{l.ok ? '✓' : l.want}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function emptyTrace(): TraceAnswers { return { cells: {}, output: '' }; }
export function useTraceState(): [TraceAnswers, (a: TraceAnswers) => void] { return useState<TraceAnswers>(emptyTrace()); }
