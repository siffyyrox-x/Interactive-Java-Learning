import { useMemo, useState } from 'react';
import { runJava } from '../../engine/java';

const clampInt = (v: string, lo: number, hi: number, d: number) => { const n = Math.trunc(+v); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d; };
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

// ====================================================================== String lab
type SOp = 'length' | 'charAt' | 'indexOf' | 'substring' | 'toUpperCase' | 'contains' | 'replace' | 'charMath';
const OPS: { id: SOp; label: string }[] = [
  { id: 'length', label: 'length()' }, { id: 'charAt', label: 'charAt(i)' }, { id: 'indexOf', label: 'indexOf(x)' },
  { id: 'substring', label: 'substring(a, b)' }, { id: 'toUpperCase', label: 'toUpperCase()' }, { id: 'contains', label: 'contains(x)' },
  { id: 'replace', label: 'replace(x, y)' }, { id: 'charMath', label: "charAt(i) - '0'" },
];
/** Every result is produced by actually running the Java expression in the interpreter. */
export function StringLab({ initial = 'Hello World' }: { initial?: string }) {
  const [s, setS] = useState(initial);
  const [op, setOp] = useState<SOp>('substring');
  const [a, setA] = useState(2), [b, setB] = useState(7);
  const [x, setX] = useState('o'), [y, setY] = useState('0');
  const expr = {
    length: 's.length()', charAt: `s.charAt(${a})`, indexOf: `s.indexOf("${esc(x)}")`, substring: `s.substring(${a}, ${b})`,
    toUpperCase: 's.toUpperCase()', contains: `s.contains("${esc(x)}")`, replace: `s.replace("${esc(x)}", "${esc(y)}")`, charMath: `s.charAt(${a}) - '0'`,
  }[op];
  const r = useMemo(() => runJava(`String s = "${esc(s)}";\nSystem.out.println(${expr});`), [s, expr]);
  const idx = r.ok && op === 'indexOf' ? +r.output.trim() : -1;
  const on = (i: number) => {
    if (op === 'charAt' || op === 'charMath') return i === a;
    if (op === 'substring') return i >= a && i < b;
    if (op === 'indexOf') return idx >= 0 && i >= idx && i < idx + x.length;
    return false;
  };
  return (
    <div className="widget">
      <div className="widget-title"><span>String lab</span><span className="muted">indexes start at 0</span></div>
      <input value={s} onChange={e => setS(e.target.value.slice(0, 24))} aria-label="String value" style={{ width: '100%', fontFamily: 'var(--mono)' }} />
      <div className="tiles" style={{ margin: '12px 0', display: 'flex', flexWrap: 'wrap' }}>
        {[...s].map((c, i) => <div key={i} className={`tile${on(i) ? (op === 'substring' ? ' range' : ' on') : ''}${c === ' ' ? ' space' : ''}`}><span className="c">{c === ' ' ? '␣' : c}</span><span className="i">{i}</span></div>)}
        {op === 'substring' && <div className="tile" style={{ opacity: .4 }}><span className="c">·</span><span className="i">{s.length}</span></div>}
      </div>
      <div className="row">
        <select value={op} onChange={e => setOp(e.target.value as SOp)} aria-label="Method">{OPS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</select>
        {['charAt', 'substring', 'charMath'].includes(op) && <label className="field" style={{ flexDirection: 'row', alignItems: 'center' }}>{op === 'substring' ? 'a' : 'i'} <input type="number" value={a} onChange={e => setA(clampInt(e.target.value, -2, 30, 0))} style={{ width: 64 }} /></label>}
        {op === 'substring' && <label className="field" style={{ flexDirection: 'row', alignItems: 'center' }}>b <input type="number" value={b} onChange={e => setB(clampInt(e.target.value, -2, 30, 0))} style={{ width: 64 }} /></label>}
        {['indexOf', 'contains', 'replace'].includes(op) && <input value={x} onChange={e => setX(e.target.value.slice(0, 8))} aria-label="x" style={{ width: 80, fontFamily: 'var(--mono)' }} />}
        {op === 'replace' && <input value={y} onChange={e => setY(e.target.value.slice(0, 8))} aria-label="y" style={{ width: 80, fontFamily: 'var(--mono)' }} />}
      </div>
      <div className="syntax" style={{ marginTop: 10 }}><span className="mono">{expr}</span> → {r.ok ? <b className="mono">{JSON.stringify(r.output.replace(/\n$/, ''))}</b> : <span style={{ color: 'var(--red)' }}>{r.error?.name}: {r.error?.friendly ?? r.error?.message}</span>}</div>
      <p className="tiny muted">substring(a, b) includes index a and stops <b>before</b> b, so its length is b − a. An index outside 0 … length−1 throws an exception — try it.</p>
    </div>
  );
}

// ====================================================================== == vs equals
export function PoolDemo() {
  const [mode, setMode] = useState<'literal' | 'new' | 'concat'>('literal');
  const code = {
    literal: 'String a = "java";\nString b = "java";',
    new: 'String a = "java";\nString b = new String("java");',
    concat: 'String a = "java";\nString part = "ja";\nString b = part + "va";',
  }[mode];
  const r = useMemo(() => runJava(`${code}\nSystem.out.println(a == b);\nSystem.out.println(a.equals(b));`), [code]);
  const [same, eq] = r.output.trim().split('\n');
  const shared = same === 'true';
  return (
    <div className="widget">
      <div className="widget-title"><span>== compares arrows, equals compares text</span></div>
      <div className="tabgroup" style={{ marginBottom: 10 }}>
        {(['literal', 'new', 'concat'] as const).map(m => <button key={m} className={`tab${mode === m ? ' active' : ''}`} style={{ border: 0 }} onClick={() => setMode(m)}>{m === 'literal' ? 'two literals' : m === 'new' ? 'new String' : 'built at run time'}</button>)}
      </div>
      <pre className="code">{code}</pre>
      <svg viewBox="0 0 420 130" style={{ width: '100%', maxWidth: 520, display: 'block', margin: '8px 0' }} role="img" aria-label={shared ? 'a and b point to the same object' : 'a and b point to different objects'}>
        <defs><marker id="pd-ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--pen)" /></marker></defs>
        {[['a', 30], ['b', 90]].map(([n, yy]) => <g key={n}><rect x="10" y={+yy - 16} width="46" height="32" rx="4" fill="var(--surface-2)" stroke="var(--line)" /><text x="33" y={+yy + 5} textAnchor="middle" fontFamily="var(--mono)" fontSize="14" fill="var(--ink)">{n}</text></g>)}
        <rect x="250" y={shared ? 44 : 12} width="150" height="36" rx="6" fill="var(--pen-soft)" stroke="var(--pen)" />
        <text x="325" y={shared ? 67 : 35} textAnchor="middle" fontFamily="var(--mono)" fontSize="14" fill="var(--ink)">"java"</text>
        {!shared && <><rect x="250" y="82" width="150" height="36" rx="6" fill="var(--amber-soft)" stroke="var(--amber)" /><text x="325" y="105" textAnchor="middle" fontFamily="var(--mono)" fontSize="14" fill="var(--ink)">"java"</text></>}
        <line x1="58" y1="30" x2="246" y2={shared ? 58 : 30} stroke="var(--pen)" strokeWidth="1.8" markerEnd="url(#pd-ar)" />
        <line x1="58" y1="90" x2="246" y2={shared ? 66 : 100} stroke="var(--pen)" strokeWidth="1.8" markerEnd="url(#pd-ar)" />
      </svg>
      <div className="grid2">
        <div className="membox"><span className="lbl">a == b</span><div className="stat" style={{ color: shared ? 'var(--green)' : 'var(--red)', fontSize: 26 }}>{same}</div></div>
        <div className="membox"><span className="lbl">a.equals(b)</span><div className="stat" style={{ color: 'var(--green)', fontSize: 26 }}>{eq}</div></div>
      </div>
      <p className="tiny muted" style={{ marginTop: 8 }}>Always compare String contents with <code>.equals</code>. <code>==</code> only asks "same object?", which depends on how the String was made.</p>
    </div>
  );
}

// ====================================================================== array references
export function ArrayRef() {
  const [copy, setCopy] = useState(false);
  const code = copy
    ? 'int[] a = {4, 7, 1};\nint[] b = new int[a.length];\nfor (int i = 0; i < a.length; i++) b[i] = a[i];\nb[0] = 99;'
    : 'int[] a = {4, 7, 1};\nint[] b = a;\nb[0] = 99;';
  const r = useMemo(() => runJava(`${code}\nSystem.out.println(a[0] + " " + b[0]);`), [code]);
  const [a0, b0] = r.output.trim().split(' ');
  const box = (vals: string[], y: number, color: string) => vals.map((v, i) => <g key={i}><rect x={230 + i * 46} y={y} width="46" height="34" fill={color} stroke="var(--line)" /><text x={253 + i * 46} y={y + 22} textAnchor="middle" fontFamily="var(--mono)" fontSize="14" fill="var(--ink)">{v}</text></g>);
  return (
    <div className="widget">
      <div className="widget-title"><span>An array variable holds an arrow</span></div>
      <div className="tabgroup" style={{ marginBottom: 10 }}>
        <button className={`tab${!copy ? ' active' : ''}`} style={{ border: 0 }} onClick={() => setCopy(false)}>b = a</button>
        <button className={`tab${copy ? ' active' : ''}`} style={{ border: 0 }} onClick={() => setCopy(true)}>copy element by element</button>
      </div>
      <pre className="code">{code}</pre>
      <svg viewBox="0 0 400 130" style={{ width: '100%', maxWidth: 520, display: 'block' }} role="img" aria-label={copy ? 'a and b point to two separate arrays' : 'a and b point to the same array'}>
        <defs><marker id="ar-ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--pen)" /></marker></defs>
        {[['a', 30], ['b', 95]].map(([n, yy]) => <g key={n}><rect x="10" y={+yy - 16} width="46" height="32" rx="4" fill="var(--surface-2)" stroke="var(--line)" /><text x="33" y={+yy + 5} textAnchor="middle" fontFamily="var(--mono)" fontSize="14" fill="var(--ink)">{n}</text></g>)}
        {copy ? <>{box(['4', '7', '1'], 12, 'var(--surface)')}{box(['99', '7', '1'], 80, 'var(--green-soft)')}</> : box(['99', '7', '1'], 45, 'var(--green-soft)')}
        <line x1="58" y1="30" x2="226" y2={copy ? 29 : 58} stroke="var(--pen)" strokeWidth="1.8" markerEnd="url(#ar-ar)" />
        <line x1="58" y1="95" x2="226" y2={copy ? 97 : 66} stroke="var(--pen)" strokeWidth="1.8" markerEnd="url(#ar-ar)" />
      </svg>
      <div className="fb info"><span className="verdict">a[0] = {a0}, b[0] = {b0}</span>{copy ? 'Two separate arrays: changing b leaves a alone.' : 'One array, two names: writing through b changes what a sees too. The same happens when you pass an array to a method.'}</div>
    </div>
  );
}

// ====================================================================== building a new array with k
type BuildMode = 'even' | 'positive' | 'reverse' | 'unique';
export function BuildArray() {
  const [src, setSrc] = useState('3 -8 6 6 -1 9 4 3');
  const [mode, setMode] = useState<BuildMode>('even');
  const [k0, setK0] = useState(0);
  const a = useMemo(() => src.trim().split(/[\s,]+/).map(Number).filter(Number.isFinite).map(Math.trunc).slice(0, 10), [src]);
  const plan = useMemo(() => {
    const out: { i: number; take: boolean; k: number; note: string }[] = [];
    let k = 0;
    const seen: number[] = [];
    a.forEach((v, i) => {
      let take = false, note = '';
      if (mode === 'even') { take = v % 2 === 0; note = `${v} % 2 == 0 → ${take}`; }
      if (mode === 'positive') { take = v > 0; note = `${v} > 0 → ${take}`; }
      if (mode === 'unique') { take = !seen.includes(v); note = take ? `${v} not seen before → keep` : `${v} already in the result → skip`; if (take) seen.push(v); }
      if (mode === 'reverse') { take = true; note = `result[${k}] = a[${a.length - 1 - i}]`; }
      out.push({ i: mode === 'reverse' ? a.length - 1 - i : i, take, k, note });
      if (take) k++;
    });
    return { out, size: k };
  }, [a, mode]);
  const step = Math.min(k0, plan.out.length);
  const done = plan.out.slice(0, step);
  const result: (number | null)[] = Array(mode === 'reverse' ? a.length : plan.size).fill(null);
  done.forEach(d => { if (d.take) result[d.k] = a[d.i]; });
  const cur = plan.out[step - 1];
  const cond = { even: 'a[i] % 2 == 0', positive: 'a[i] > 0', unique: 'value not already in result', reverse: '' }[mode];
  return (
    <div className="widget">
      <div className="widget-title"><span>Two indexes: i reads, k writes</span><span className="muted">the core final-exam pattern</span></div>
      <div className="row">
        <input value={src} onChange={e => { setSrc(e.target.value); setK0(0); }} aria-label="Array values" style={{ flex: 1, minWidth: 180, fontFamily: 'var(--mono)' }} />
        <select value={mode} onChange={e => { setMode(e.target.value as BuildMode); setK0(0); }} aria-label="Pattern">
          <option value="even">keep evens</option><option value="positive">keep positives</option><option value="unique">remove duplicates</option><option value="reverse">reverse into new</option>
        </select>
      </div>
      <p className="small muted" style={{ margin: '8px 0' }}>{mode === 'reverse' ? 'Size is known: new int[a.length]. k counts up while i counts down.' : `Pass 1 counts how many pass (${cond}) → new int[${plan.size}]. Pass 2 copies them, and k moves only when something is written.`}</p>
      <span className="arr-label mono tiny muted">a</span>
      <div className="cells">{a.map((v, i) => <div key={i} className={`cell${cur && cur.i === i ? ' read' : ''}${done.some(d => d.i === i && !d.take) ? ' dim' : ''}`}><span className="v">{v}</span><span className="i">{i}</span></div>)}</div>
      <span className="arr-label mono tiny muted">result (length {result.length})</span>
      <div className="cells">{result.length ? result.map((v, i) => <div key={i} className={`cell${cur && cur.take && cur.k === i ? ' write' : ''}`}><span className="v">{v ?? ''}</span><span className="i">{i}</span></div>) : <span className="empty-hint">empty array — nothing passes</span>}</div>
      <div className="syntax" style={{ marginTop: 8 }}>{cur ? <>i = {cur.i} · {cur.note}{cur.take ? ` · write result[${cur.k}], then k = ${cur.k + 1}` : ' · k stays ' + cur.k}</> : 'Press › to walk through pass 2.'}</div>
      <div className="row">
        <button className="icon-btn" onClick={() => setK0(Math.max(0, step - 1))} aria-label="Previous">‹</button>
        <button className="icon-btn" onClick={() => setK0(Math.min(plan.out.length, step + 1))} aria-label="Next">›</button>
        <button className="btn sm quiet" onClick={() => setK0(0)}>Restart</button>
        <span className="mono tiny muted">{step}/{plan.out.length}</span>
      </div>
    </div>
  );
}

// ====================================================================== sorting
interface SortFrame { arr: number[]; cmp: number[]; swp: number[]; done: number[]; min?: number; note: string; pass: number }
function selectionFrames(a0: number[]): SortFrame[] {
  const a = [...a0], f: SortFrame[] = [], done: number[] = [];
  f.push({ arr: [...a], cmp: [], swp: [], done: [], note: 'Start. Each pass finds the smallest remaining value and swaps it to the front.', pass: 0 });
  for (let i = 0; i < a.length - 1; i++) {
    let m = i;
    for (let j = i + 1; j < a.length; j++) {
      const smaller = a[j] < a[m];
      f.push({ arr: [...a], cmp: [j, m], swp: [], done: [...done], min: m, note: `pass ${i + 1}: is a[${j}]=${a[j]} < a[min]=${a[m]}? ${smaller ? 'yes → min = ' + j : 'no'}`, pass: i + 1 });
      if (smaller) m = j;
    }
    [a[i], a[m]] = [a[m], a[i]];
    done.push(i);
    f.push({ arr: [...a], cmp: [], swp: m === i ? [i] : [i, m], done: [...done], note: m === i ? `a[${i}] is already the smallest — swap with itself` : `swap a[${i}] and a[${m}] → a[${i}] is now final`, pass: i + 1 });
  }
  f.push({ arr: [...a], cmp: [], swp: [], done: a.map((_, i) => i), note: 'Sorted.', pass: a.length - 1 });
  return f;
}
function bubbleFrames(a0: number[]): SortFrame[] {
  const a = [...a0], f: SortFrame[] = [], done: number[] = [];
  let swaps = 0;
  f.push({ arr: [...a], cmp: [], swp: [], done: [], note: 'Start. Neighbours swap when out of order; the largest value bubbles to the end each pass.', pass: 0 });
  for (let i = 0; i < a.length - 1; i++) {
    for (let j = 0; j < a.length - 1 - i; j++) {
      const out = a[j] > a[j + 1];
      if (out) { [a[j], a[j + 1]] = [a[j + 1], a[j]]; swaps++; }
      f.push({ arr: [...a], cmp: out ? [] : [j, j + 1], swp: out ? [j, j + 1] : [], done: [...done], note: `pass ${i + 1}: compare positions ${j} and ${j + 1} → ${out ? `swap (swaps so far: ${swaps})` : 'in order'}`, pass: i + 1 });
    }
    done.push(a.length - 1 - i);
    f.push({ arr: [...a], cmp: [], swp: [], done: [...done], note: `end of pass ${i + 1}: a[${a.length - 1 - i}] = ${a[a.length - 1 - i]} is final`, pass: i + 1 });
  }
  f.push({ arr: [...a], cmp: [], swp: [], done: a.map((_, i) => i), note: `Sorted with ${swaps} swaps.`, pass: a.length - 1 });
  return f;
}
export function SortAnim({ initial = '29 10 14 37 13 5' }: { initial?: string }) {
  const [src, setSrc] = useState(initial);
  const [algo, setAlgo] = useState<'selection' | 'bubble'>('selection');
  const [k, setK] = useState(0);
  const a = useMemo(() => src.trim().split(/[\s,]+/).map(Number).filter(Number.isFinite).map(Math.trunc).slice(0, 9), [src]);
  const frames = useMemo(() => (algo === 'selection' ? selectionFrames(a) : bubbleFrames(a)), [a, algo]);
  const fr = frames[Math.min(k, frames.length - 1)];
  const max = Math.max(1, ...a.map(Math.abs));
  const passEnds = frames.map((f, i) => ({ f, i })).filter(({ f }, i) => f.note.startsWith('swap') || f.note.startsWith('end of') || f.note.includes('swap with itself') || i === 0);
  return (
    <div className="widget">
      <div className="widget-title"><span>Sorting, one comparison at a time</span><span className="muted">amber = compare · green = swap · blue = final</span></div>
      <div className="row">
        <input value={src} onChange={e => { setSrc(e.target.value); setK(0); }} aria-label="Values" style={{ flex: 1, minWidth: 160, fontFamily: 'var(--mono)' }} />
        <div className="tabgroup">
          <button className={`tab${algo === 'selection' ? ' active' : ''}`} style={{ border: 0 }} onClick={() => { setAlgo('selection'); setK(0); }}>selection</button>
          <button className={`tab${algo === 'bubble' ? ' active' : ''}`} style={{ border: 0 }} onClick={() => { setAlgo('bubble'); setK(0); }}>bubble</button>
        </div>
      </div>
      <div className="bar-chart" style={{ margin: '28px 0 26px' }}>
        {fr.arr.map((v, i) => <div key={i} className={`bar${fr.swp.includes(i) ? ' swp' : fr.cmp.includes(i) ? (fr.min === i ? ' min' : ' cmp') : fr.done.includes(i) ? ' done' : ''}`} style={{ height: `${12 + (Math.abs(v) / max) * 82}%` }}><b>{v}</b><span>{i}</span></div>)}
      </div>
      <div className="syntax">{fr.note}</div>
      <div className="row">
        <button className="icon-btn" onClick={() => setK(Math.max(0, k - 1))} aria-label="Previous">‹</button>
        <button className="icon-btn" onClick={() => setK(Math.min(frames.length - 1, k + 1))} aria-label="Next">›</button>
        <button className="btn sm quiet" onClick={() => { const nx = passEnds.find(p => p.i > k); setK(nx ? nx.i : frames.length - 1); }}>Jump to next {algo === 'selection' ? 'swap' : 'pass end'}</button>
        <input type="range" min={0} max={frames.length - 1} value={Math.min(k, frames.length - 1)} onChange={e => setK(+e.target.value)} aria-label="Step" style={{ flex: 1, minWidth: 100 }} />
      </div>
      <p className="tiny muted">Exams often ask for "the array after each pass" — the rows you get by pressing <i>Jump</i>.</p>
    </div>
  );
}

// ====================================================================== recursion stack
const REC: Record<string, { code: string; call: (n: number) => string; max: number }> = {
  factorial: { code: 'public static int fact(int n) {\n    if (n <= 1) return 1;\n    return n * fact(n - 1);\n}', call: n => `fact(${n})`, max: 7 },
  'sum of digits': { code: 'public static int sumDigits(int n) {\n    if (n == 0) return 0;\n    return n % 10 + sumDigits(n / 10);\n}', call: n => `sumDigits(${n})`, max: 99999 },
  'print before/after': { code: 'public static void show(int n) {\n    if (n == 0) return;\n    System.out.println("down " + n);\n    show(n - 1);\n    System.out.println("up " + n);\n}', call: n => `show(${n})`, max: 5 },
};
/** Frames pushed on the way down, results handed back on the way up — computed by the real interpreter. */
export function RecursionStack() {
  const [fn, setFn] = useState('factorial');
  const d = REC[fn];
  const [n, setN] = useState(4);
  const nn = Math.min(n, d.max);
  const src = `public class Main {\n    public static void main(String[] args) {\n        ${fn === 'print before/after' ? '' : 'System.out.println('}${d.call(nn)}${fn === 'print before/after' ? '' : ')'};\n    }\n${d.code.split('\n').map(l => '    ' + l).join('\n')}\n}`;
  const r = useMemo(() => runJava(src, { trace: true }), [src]);
  const events = useMemo(() => r.steps.filter(s => s.kind === 'call' || s.kind === 'return'), [r]);
  const [k, setK] = useState(0);
  const i = Math.min(k, events.length - 1);
  const ev = events[i];
  const frames = ev ? ev.frames.filter(f => f.method !== 'main') : [];
  const out = r.output.slice(0, ev?.outLen ?? 0);
  return (
    <div className="widget">
      <div className="widget-title"><span>Call stack</span><span className="muted">down to the base case, then back up</span></div>
      <div className="row">
        <select value={fn} onChange={e => { setFn(e.target.value); setK(0); setN(e.target.value === 'sum of digits' ? 472 : 4); }} aria-label="Function">{Object.keys(REC).map(x => <option key={x}>{x}</option>)}</select>
        <label className="field" style={{ flexDirection: 'row', alignItems: 'center' }}>n <input type="number" value={n} min={0} max={d.max} onChange={e => { setN(clampInt(e.target.value, 0, d.max, 0)); setK(0); }} style={{ width: 90 }} /></label>
      </div>
      <pre className="code" style={{ margin: '10px 0' }}>{d.code}</pre>
      <div className="grid2">
        <div>
          <span className="pane-title">stack (top = running now)</span>
          <div className="stack" style={{ display: 'flex', flexDirection: 'column-reverse', gap: 4 }}>
            {frames.map((f, j) => {
              const top = j === frames.length - 1;
              const vars = f.vars.map(v => `${v.name}=${v.display}`).join(', ');
              return <div key={j} className="membox" style={{ marginTop: 0, borderColor: top ? 'var(--pen)' : undefined, background: top ? 'var(--pen-soft)' : undefined }}><span className="mono small">{f.method}({vars})</span></div>;
            })}
            {!frames.length && <span className="empty-hint">empty — back in main</span>}
          </div>
        </div>
        <div>
          <span className="pane-title">what just happened</span>
          <div className="syntax" style={{ minHeight: 60 }}>{ev ? ev.desc : r.error?.message}</div>
          <span className="pane-title">output so far</span>
          <pre className="console" style={{ minHeight: 40 }}>{out || ' '}</pre>
        </div>
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        <button className="icon-btn" onClick={() => setK(Math.max(0, i - 1))} aria-label="Previous">‹</button>
        <button className="icon-btn" onClick={() => setK(Math.min(events.length - 1, i + 1))} aria-label="Next">›</button>
        <button className="btn sm quiet" onClick={() => setK(0)}>Restart</button>
        <span className="mono tiny muted">event {i + 1}/{events.length} · depth {frames.length}</span>
      </div>
    </div>
  );
}

// ====================================================================== pass by value
export function PassByValue() {
  const r = useMemo(() => runJava(`public class Main {
    public static void main(String[] args) {
        int x = 5;
        int[] arr = {5, 5};
        change(x, arr);
        System.out.println("x = " + x);
        System.out.println("arr[0] = " + arr[0]);
    }
    public static void change(int x, int[] a) {
        x = 100;
        a[0] = 100;
    }
}`), []);
  return (
    <div className="widget">
      <div className="widget-title"><span>What a method can change</span></div>
      <div className="grid2">
        <div className="membox"><span className="lbl">int parameter</span><p className="small" style={{ margin: '6px 0 0' }}>The method gets a <b>copy</b> of the number. Changing its copy does nothing to the caller's variable.</p></div>
        <div className="membox"><span className="lbl">array parameter</span><p className="small" style={{ margin: '6px 0 0' }}>The method gets a copy of the <b>arrow</b>. Both arrows reach the same array, so element changes are seen by the caller.</p></div>
      </div>
      <pre className="console" style={{ marginTop: 10 }}>{r.output}</pre>
    </div>
  );
}
