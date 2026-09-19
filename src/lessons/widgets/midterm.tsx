import { useMemo, useState } from 'react';
import { runJava } from '../../engine/java';
import { Parser } from '../../engine/java/parser';
import type { Expr } from '../../engine/java/ast';
import { javaFloatingToString } from '../../engine/java/values';
import { JavaLine } from '../../components/Code';

// ====================================================================== flowchart shapes
const SHAPES: { id: string; name: string; use: string; java: string }[] = [
  { id: 'term', name: 'Ellipse', use: 'START and END of the program.', java: 'The opening and closing braces of main.' },
  { id: 'io', name: 'Parallelogram', use: 'Input (READ / PROMPT) and output (PRINT).', java: 'sc.nextInt() … or System.out.println(…)' },
  { id: 'proc', name: 'Rectangle', use: 'Calculations and giving variables values.', java: 'double cost = price * qty;' },
  { id: 'dec', name: 'Diamond', use: 'A yes/no question: if/else, or the condition of a loop.', java: 'if (cost <= budget) { … } else { … }' },
  { id: 'conn', name: 'Circle', use: 'A connector where branches join again.', java: 'The point after the if/else block ends.' },
  { id: 'arrow', name: 'Arrow', use: 'The order in which boxes run.', java: 'The top-to-bottom order of statements.' },
];
export function FlowShapes() {
  const [sel, setSel] = useState('dec');
  const s = SHAPES.find(x => x.id === sel)!;
  const draw = (id: string) => {
    switch (id) {
      case 'term': return <rect x="6" y="14" width="68" height="28" rx="14" />;
      case 'io': return <polygon points="16,12 76,12 64,44 4,44" />;
      case 'proc': return <rect x="6" y="12" width="68" height="32" rx="2" />;
      case 'dec': return <polygon points="40,4 76,28 40,52 4,28" />;
      case 'conn': return <circle cx="40" cy="28" r="12" />;
      default: return <><line x1="8" y1="28" x2="66" y2="28" style={{ stroke: 'currentColor', strokeWidth: 2 }} /><polygon points="66,22 76,28 66,34" style={{ fill: 'currentColor', stroke: 'none' }} /></>;
    }
  };
  return (
    <div className="widget">
      <div className="widget-title"><span>Flowchart shapes</span><span className="muted">click a shape</span></div>
      <div className="row">
        {SHAPES.map(x => (
          <button key={x.id} onClick={() => setSel(x.id)} aria-pressed={sel === x.id} className="chip" style={{ padding: 4, borderColor: sel === x.id ? 'var(--pen)' : undefined, color: sel === x.id ? 'var(--pen)' : 'var(--muted)' }}>
            <svg width="80" height="56" viewBox="0 0 80 56" style={{ display: 'block', fill: 'var(--surface)', stroke: 'currentColor', strokeWidth: 1.6 }} aria-label={x.name}>{draw(x.id)}</svg>
          </button>
        ))}
      </div>
      <div className="fb info" style={{ marginTop: 12 }}><span className="verdict">{s.name}</span>{s.use}<br /><span className="mono small">Java: {s.java}</span></div>
    </div>
  );
}

// ====================================================================== names
const KEYWORDS = new Set('abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while true false null var'.split(' '));
export function checkName(n: string): [boolean, string] {
  if (!n) return [false, 'Type a name to check it.'];
  if (/\s/.test(n)) return [false, 'A name cannot contain spaces.'];
  if (/^[0-9]/.test(n)) return [false, 'A name cannot start with a digit.'];
  const bad = n.match(/[^A-Za-z0-9_$]/);
  if (bad) return [false, `The character '${bad[0]}' is not allowed — only letters, digits, _ and $.`];
  if (KEYWORDS.has(n)) return [false, `'${n}' is a reserved word in Java.`];
  if (n.length === 1) return [true, 'Valid — but a one-letter name is not meaningful. Prefer something descriptive.'];
  if (/^[A-Z]/.test(n)) return [true, 'Valid. By convention variable names start with a lower-case letter (class names start with upper case).'];
  return [true, 'Valid variable name.'];
}
export function NameCheck() {
  const [n, setN] = useState('2ndPlace');
  const [ok, msg] = checkName(n);
  return (
    <div className="widget">
      <div className="widget-title"><span>Is this a valid name?</span></div>
      <input type="text" value={n} onChange={e => setN(e.target.value)} aria-label="Variable name" style={{ fontFamily: 'var(--mono)', width: '100%' }} />
      <div className="row" style={{ marginTop: 8 }}>{['first_name', 'firstName', 'num 2', 'class', 'Class', '$ami', '_ami', 'ab.cd', 'import1', 'first-name'].map(x => <button key={x} className="chip" onClick={() => setN(x)}>{x}</button>)}</div>
      <div className={`fb ${ok ? 'ok' : 'bad'}`} style={{ marginTop: 10 }}><span className="verdict">{ok ? 'Valid' : 'Invalid'}</span>{msg}</div>
    </div>
  );
}

// ====================================================================== casting
const LADDER = ['byte', 'short', 'int', 'long', 'float', 'double'];
export function CastLab() {
  const [val, setVal] = useState('10.99');
  const [from, setFrom] = useState('double');
  const [to, setTo] = useState('int');
  const lit = (t: string, v: string) => t === 'char' ? (/^'.'$/.test(v) ? v : `'${v[0] ?? 'A'}'`) : t === 'float' && !/[fF]$/.test(v) ? v + 'f' : t === 'long' && /^-?\d+$/.test(v) ? v + 'L' : v;
  const code = `${from} x = ${lit(from, val)};\n${to} y = (${to}) x;\nSystem.out.println(x);\nSystem.out.println(y);`;
  const r = useMemo(() => runJava(code), [code]);
  const auto = useMemo(() => runJava(`${from} x = ${lit(from, val)};\n${to} y = x;`), [from, to, val]);
  const fi = LADDER.indexOf(from), ti = LADDER.indexOf(to);
  const widening = from === to || (fi >= 0 && ti >= 0 && ti > fi) || (from === 'char' && ti >= 2);
  const lines = r.output.trim().split('\n');
  return (
    <div className="widget">
      <div className="widget-title"><span>Casting lab</span><span className="muted">runs real Java rules</span></div>
      <div className="row">
        <label className="field">value<input type="text" value={val} onChange={e => setVal(e.target.value)} style={{ width: 110, fontFamily: 'var(--mono)' }} /></label>
        <label className="field">from<select value={from} onChange={e => setFrom(e.target.value)}>{[...LADDER, 'char'].map(t => <option key={t}>{t}</option>)}</select></label>
        <label className="field">to<select value={to} onChange={e => setTo(e.target.value)}>{[...LADDER, 'char'].map(t => <option key={t}>{t}</option>)}</select></label>
      </div>
      <div className="row" style={{ margin: '12px 0' }} aria-label="Widening order">
        {LADDER.map((t, k) => <span key={t} className="row" style={{ gap: 4 }}><span className={`tag${t === from ? ' pen' : t === to ? ' violet' : ''}`}>{t}</span>{k < LADDER.length - 1 && <span className="muted">→</span>}</span>)}
      </div>
      <pre className="code" style={{ marginBottom: 8 }}>{code.split('\n').map((l, k) => <span key={k}><JavaLine text={l} />{'\n'}</span>)}</pre>
      {r.error ? <div className="fb bad"><span className="verdict">{r.error.kind === 'compile' ? 'Does not compile' : 'Error'}</span>{r.error.message}</div> : (
        <div className={`fb ${widening ? 'ok' : 'info'}`}>
          <span className="verdict">{widening ? 'Widening — automatic' : 'Narrowing — needs a cast'}</span>
          x prints <code>{lines[0]}</code>, y prints <code>{lines[1]}</code>.
          {lines[0] !== lines[1] && <> The value changed: {!widening ? 'narrowing can lose data (decimals are cut off, big values wrap around).' : 'only its format changed.'}</>}
          <div className="tiny" style={{ marginTop: 6 }}>Without the cast, <code>{to} y = x;</code> {auto.ok ? 'also compiles — this is widening.' : <>is a compile error: <em>{auto.error?.message}</em></>}</div>
        </div>
      )}
    </div>
  );
}

// ====================================================================== expression stepper
type V = { t: 'int' | 'double' | 'boolean' | 'String'; v: number | boolean | string };
const PREC: Record<string, number> = { '||': 1, '&&': 2, '==': 6, '!=': 6, '<': 7, '>': 7, '<=': 7, '>=': 7, '+': 9, '-': 9, '*': 10, '/': 10, '%': 10 };
function show(v: V): string { return v.t === 'double' ? javaFloatingToString(v.v as number) : v.t === 'String' ? JSON.stringify(v.v) : String(v.v); }
type N = { id: number; e: Expr | null; val?: V; kids: N[]; op?: string; cast?: string };
function build(e: Expr, id = { n: 0 }): N {
  const me = id.n++;
  if (e.kind === 'lit') {
    const t = e.litType.k === 'prim' ? e.litType.n : 'String';
    return { id: me, e, kids: [], val: { t: t === 'boolean' ? 'boolean' : t === 'double' ? 'double' : t === 'int' ? 'int' : 'String', v: e.value as number } as V };
  }
  if (e.kind === 'bin') return { id: me, e, op: e.op, kids: [build(e.l, id), build(e.r, id)] };
  if (e.kind === 'unary') return { id: me, e, op: 'u' + e.op, kids: [build(e.e, id)] };
  if (e.kind === 'cast') return { id: me, e, cast: e.type.base, kids: [build(e.e, id)] };
  throw new Error('Only numbers, true/false, "text", + - * / % comparisons, && || ! and (int)/(double) casts are supported here.');
}
function apply(n: N): V {
  const [a, b] = n.kids.map(k => k.val!);
  if (n.cast) {
    if (n.cast === 'int') return { t: 'int', v: Math.trunc(a.v as number) };
    return { t: 'double', v: a.v as number };
  }
  if (n.op === 'u-') return { t: a.t, v: -(a.v as number) };
  if (n.op === 'u!') return { t: 'boolean', v: !a.v };
  const op = n.op!;
  if (op === '+' && (a.t === 'String' || b.t === 'String')) return { t: 'String', v: (a.t === 'String' ? a.v : show(a)) + '' + (b.t === 'String' ? b.v : show(b)) };
  if (op === '&&') return { t: 'boolean', v: (a.v as boolean) && (b.v as boolean) };
  if (op === '||') return { t: 'boolean', v: (a.v as boolean) || (b.v as boolean) };
  const x = a.v as number, y = b.v as number;
  const dbl = a.t === 'double' || b.t === 'double';
  switch (op) {
    case '<': return { t: 'boolean', v: x < y }; case '>': return { t: 'boolean', v: x > y };
    case '<=': return { t: 'boolean', v: x <= y }; case '>=': return { t: 'boolean', v: x >= y };
    case '==': return { t: 'boolean', v: a.v === b.v }; case '!=': return { t: 'boolean', v: a.v !== b.v };
  }
  if (!dbl && (op === '/' || op === '%') && y === 0) throw new Error('Integer division by zero — Java throws ArithmeticException here.');
  const r = op === '+' ? x + y : op === '-' ? x - y : op === '*' ? x * y : op === '/' ? x / y : x % y;
  return dbl ? { t: 'double', v: r } : { t: 'int', v: op === '*' ? Math.imul(x, y) : r | 0 };
}
function render(n: N, target: number, parentPrec = 0, right = false): React.ReactNode {
  if (n.val) return <span className={n.id === target ? '' : undefined}>{show(n.val)}</span>;
  let inner: React.ReactNode;
  let prec = 12;
  if (n.cast) inner = <>({n.cast}) {render(n.kids[0], target, 11)}</>;
  else if (n.op?.startsWith('u')) inner = <>{n.op.slice(1)}{render(n.kids[0], target, 11)}</>;
  else { prec = PREC[n.op!] ?? 5; inner = <>{render(n.kids[0], target, prec)} {n.op} {render(n.kids[1], target, prec, true)}</>; }
  const needParen = prec < parentPrec || (right && prec === parentPrec);
  const body = needParen ? <>({inner})</> : inner;
  return n.id === target ? <mark style={{ background: 'var(--amber-soft)', color: 'var(--amber)', borderRadius: 3, padding: '0 2px', outline: '1px solid var(--amber)' }}>{body}</mark> : body;
}
function nextTarget(n: N): N | null {
  if (n.val) return null;
  for (const k of n.kids) { const t = nextTarget(k); if (t) return t; }
  return n;
}
export function ExprStepper({ initial = '7 + 17 / 5 * 2 - 17 % 5' }: { initial?: string }) {
  const [src, setSrc] = useState(initial);
  const [k, setK] = useState(0);
  const sim = useMemo(() => {
    try {
      const e = new Parser(src).parseExpr();
      const root = build(e);
      const frames: { node: React.ReactNode; note: string }[] = [];
      for (let guard = 0; guard < 60; guard++) {
        const t = nextTarget(root);
        if (!t) { frames.push({ node: render(root, -1), note: `Result: ${show(root.val!)} (${root.val!.t})` }); break; }
        const before = render(root, t.id);
        const v = apply(t);
        const [a, b] = t.kids.map(x => x.val!);
        const note = t.cast ? `Cast ${show(a)} to ${t.cast}: ${show(v)}` : t.op?.startsWith('u') ? `${t.op.slice(1)}${show(a)} = ${show(v)}` :
          `${show(a)} ${t.op} ${show(b)} = ${show(v)}${t.op === '/' && v.t === 'int' ? ' (integer division drops the decimals)' : t.op === '%' ? ' (the remainder)' : a.t !== b.t && v.t === 'double' ? ' (int is promoted to double)' : ''}`;
        frames.push({ node: before, note });
        t.val = v; t.kids = [];
      }
      return { frames, err: '' };
    } catch (err) { return { frames: [], err: err instanceof Error ? err.message : String(err) }; }
  }, [src]);
  const f = sim.frames[Math.min(k, sim.frames.length - 1)];
  return (
    <div className="widget">
      <div className="widget-title"><span>Evaluate step by step</span><span className="muted">precedence, left to right</span></div>
      <input type="text" value={src} onChange={e => { setSrc(e.target.value); setK(0); }} aria-label="Expression" style={{ width: '100%', fontFamily: 'var(--mono)' }} />
      <div className="row" style={{ margin: '8px 0' }}>{['7 + 17 / 5 * 2 - 17 % 5', '(double) 7 / 2 + 7 / 2', '1 + 2 + "3" + 4 + 5', '10 - 4 - 3', '-7 / 2 + -7 % 2', '5 > 3 && 2 > 4 || !(1 == 2)'].map(x => <button key={x} className="chip" onClick={() => { setSrc(x); setK(0); }}>{x}</button>)}</div>
      {sim.err ? <div className="fb bad"><span className="verdict">Can't evaluate</span>{sim.err}</div> : f && (
        <>
          <div className="syntax" style={{ fontSize: 16 }}>{f.node}</div>
          <div className="spread"><span className="mono small">{f.note}</span><span className="row">
            <button className="icon-btn" onClick={() => setK(Math.max(0, k - 1))} aria-label="Previous step">‹</button>
            <span className="mono tiny muted">{Math.min(k, sim.frames.length - 1) + 1}/{sim.frames.length}</span>
            <button className="icon-btn" onClick={() => setK(Math.min(sim.frames.length - 1, k + 1))} aria-label="Next step">›</button>
          </span></div>
        </>
      )}
    </div>
  );
}

// ====================================================================== ++ and --
export function IncDec() {
  const [x, setX] = useState(5);
  const rows: [string, number, number][] = [['x++', x, x + 1], ['++x', x + 1, x + 1], ['x--', x, x - 1], ['--x', x - 1, x - 1]];
  return (
    <div className="widget">
      <div className="widget-title"><span>Prefix vs postfix</span></div>
      <label className="field" style={{ maxWidth: 260 }}>x starts at {x}<input type="range" min={-3} max={12} value={x} onChange={e => setX(+e.target.value)} /></label>
      <div className="table-wrap" style={{ marginTop: 10 }}><table>
        <thead><tr><th>expression</th><th className="num">value the expression gives</th><th className="num">x afterwards</th></tr></thead>
        <tbody>{rows.map(([e, used, after]) => <tr key={e}><td className="num">{e}</td><td className="num" style={{ color: used !== x ? 'var(--green)' : undefined }}>{used}</td><td className="num">{after}</td></tr>)}</tbody>
      </table></div>
      <p className="small muted">So <code>int y = x++ * 2;</code> gives y = {x * 2} and x = {x + 1}, but <code>int y = ++x * 2;</code> gives y = {(x + 1) * 2}.</p>
    </div>
  );
}

// ====================================================================== / and %
export function DivMod() {
  const [a, setA] = useState(17), [b, setB] = useState(5);
  const q = b === 0 ? NaN : Math.trunc(a / b), r = b === 0 ? NaN : a % b;
  const groups = b > 0 && a >= 0 && a <= 60 ? Array.from({ length: a }, (_, i) => Math.floor(i / b)) : null;
  return (
    <div className="widget">
      <div className="widget-title"><span>Integer division and remainder</span></div>
      <div className="row">
        <label className="field">a<input type="number" value={a} onChange={e => setA(Math.trunc(+e.target.value))} style={{ width: 90 }} /></label>
        <label className="field">b<input type="number" value={b} onChange={e => setB(Math.trunc(+e.target.value))} style={{ width: 90 }} /></label>
      </div>
      {b === 0 ? <div className="fb bad" style={{ marginTop: 10 }}><span className="verdict">ArithmeticException</span>Dividing an int by zero stops the program.</div> : (
        <div className="grid2" style={{ marginTop: 10 }}>
          <div className="membox"><span className="lbl">a / b</span><div className="stat">{q}</div><div className="tiny muted">how many whole groups of {b} fit (decimals dropped, toward zero)</div></div>
          <div className="membox"><span className="lbl">a % b</span><div className="stat">{r}</div><div className="tiny muted">what is left over — keeps the sign of a</div></div>
        </div>
      )}
      {groups && <div className="dots-line" style={{ marginTop: 10 }} aria-hidden="true">{groups.map((g, i) => <i key={i} className={g < q ? 's' : 't'} title={g < q ? `group ${g + 1}` : 'remainder'} />)}</div>}
      <p className="tiny muted" style={{ marginTop: 8 }}>Check: (a / b) × b + a % b = {b === 0 ? '—' : q * b + r} = a. Try a negative a: Java's −17 % 5 is −2, not 3.</p>
    </div>
  );
}

// ====================================================================== Scanner
export function ScannerSim({ initial = '21\nRahim Uddin\n3.5' }: { initial?: string }) {
  const [buf, setBuf] = useState(initial);
  const [pos, setPos] = useState(0);
  const [log, setLog] = useState<{ call: string; got: string; bad?: boolean }[]>([]);
  const act = (m: string) => {
    const src = `Scanner sc = new Scanner(System.in);\n${'sc.nextLine();\n'.repeat(0)}`;
    void src;
    let p = pos;
    const ws = () => { while (p < buf.length && /\s/.test(buf[p])) p++; };
    const tok = () => { ws(); const s = p; while (p < buf.length && !/\s/.test(buf[p])) p++; return buf.slice(s, p); };
    let got = '', bad = false;
    if (m === 'nextLine') {
      if (p >= buf.length) { got = 'NoSuchElementException'; bad = true; }
      else { const nl = buf.indexOf('\n', p); const e = nl < 0 ? buf.length : nl; got = JSON.stringify(buf.slice(p, e)); p = nl < 0 ? buf.length : nl + 1; }
    } else {
      const save = p; const t = tok();
      if (!t) { got = 'NoSuchElementException'; bad = true; p = save; }
      else if (m === 'nextInt' && !/^[+-]?\d+$/.test(t)) { got = `InputMismatchException ("${t}" is not an int)`; bad = true; p = save; }
      else if (m === 'nextDouble' && !/^[+-]?(\d+\.?\d*|\.\d+)$/.test(t)) { got = `InputMismatchException ("${t}" is not a double)`; bad = true; p = save; }
      else got = m === 'next' ? JSON.stringify(t) : m === 'nextDouble' ? javaFloatingToString(parseFloat(t)) : String(parseInt(t, 10));
    }
    setPos(p); setLog(l => [...l, { call: `sc.${m}()`, got, bad }]);
  };
  return (
    <div className="widget">
      <div className="widget-title"><span>Scanner input buffer</span><span className="muted">▌ = where the Scanner is</span></div>
      <label className="field">What the user typed (Enter = new line)
        <textarea rows={3} value={buf} onChange={e => { setBuf(e.target.value); setPos(0); setLog([]); }} spellCheck={false} />
      </label>
      <pre className="console" style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>
        <span className="dim">{buf.slice(0, pos).replace(/\n/g, '↵\n')}</span><mark style={{ background: 'var(--pen)', color: 'var(--on-pen)' }}>▌</mark>{buf.slice(pos).replace(/\n/g, '↵\n')}
      </pre>
      <div className="row" style={{ margin: '8px 0' }}>
        {['nextInt', 'nextDouble', 'next', 'nextLine'].map(m => <button key={m} className="btn sm ghost" onClick={() => act(m)}>{m}()</button>)}
        <button className="btn sm quiet" onClick={() => { setPos(0); setLog([]); }}>Reset</button>
      </div>
      {log.length > 0 && <div className="table-wrap"><table><thead><tr><th>call</th><th>returns</th></tr></thead><tbody>{log.map((l, k) => <tr key={k}><td className="num">{l.call}</td><td className="num" style={{ color: l.bad ? 'var(--red)' : undefined }}>{l.got}</td></tr>)}</tbody></table></div>}
      <p className="tiny muted">Try: nextInt(), then nextLine(). The nextLine returns "" — it only reads the rest of the first line (just the ↵).</p>
    </div>
  );
}

// ====================================================================== branch explorer
export function BranchExplorer({ code, min, max, init, label = 'value' }: { code: string; min: number; max: number; init: number; label?: string }) {
  const [v, setV] = useState(init);
  const src = code.replace(/VALUE/g, String(v));
  const r = useMemo(() => runJava(src, { trace: true }), [src]);
  const ran = new Set(r.steps.filter(s => s.kind !== 'start' && s.kind !== 'end').map(s => s.line));
  const lines = src.split('\n');
  return (
    <div className="widget">
      <div className="widget-title"><span>Which branch runs?</span><span className="muted">green = executed</span></div>
      <label className="field">{label} = <b className="mono">{v}</b><input type="range" min={min} max={max} value={v} onChange={e => setV(+e.target.value)} /></label>
      <div className="viz-code" style={{ border: '1px solid var(--line)', borderRadius: 8, marginTop: 10, maxHeight: 'none' }}>
        {lines.map((l, k) => <div key={k} className="l" style={{ background: ran.has(k + 1) ? 'var(--green-soft)' : undefined, opacity: ran.has(k + 1) || !l.trim() || /^\s*[{}]\s*$|else\s*\{?\s*$/.test(l) ? 1 : .45 }}><span className="arrow">{ran.has(k + 1) ? '✓' : ''}</span><span className="no">{k + 1}</span><span><JavaLine text={l} /></span></div>)}
      </div>
      <pre className="console" style={{ marginTop: 8 }}>{r.output || r.error?.message || '(no output)'}</pre>
    </div>
  );
}

// ====================================================================== truth table
export function TruthTable() {
  const [a, setA] = useState(true), [b, setB] = useState(false);
  const exprs: [string, (a: boolean, b: boolean) => boolean][] = [['a && b', (a, b) => a && b], ['a || b', (a, b) => a || b], ['!a', a => !a], ['a != b', (a, b) => a !== b], ['!(a && b)', (a, b) => !(a && b)], ['!a || !b', (a, b) => !a || !b]];
  return (
    <div className="widget">
      <div className="widget-title"><span>Logical operators</span><span className="muted">flip a and b</span></div>
      <div className="row">
        <button className={`btn sm ${a ? '' : 'quiet'}`} onClick={() => setA(!a)}>a = {String(a)}</button>
        <button className={`btn sm ${b ? '' : 'quiet'}`} onClick={() => setB(!b)}>b = {String(b)}</button>
      </div>
      <div className="table-wrap" style={{ marginTop: 10 }}><table>
        <thead><tr><th className="num">a</th><th className="num">b</th>{exprs.map(([e]) => <th key={e} className="num">{e}</th>)}</tr></thead>
        <tbody>{[[true, true], [true, false], [false, true], [false, false]].map(([x, y]) => (
          <tr key={`${x}${y}`} style={{ background: x === a && y === b ? 'var(--pen-soft)' : undefined }}>
            <td className="num">{String(x)}</td><td className="num">{String(y)}</td>
            {exprs.map(([e, f]) => <td key={e} className="num" style={{ color: f(x, y) ? 'var(--green)' : 'var(--muted)' }}>{String(f(x, y))}</td>)}
          </tr>
        ))}</tbody>
      </table></div>
      <p className="tiny muted">The last two columns are always equal — that is De Morgan's law. Short-circuit: when a is false, <code>a && b</code> never even looks at b; when a is true, <code>a || b</code> never looks at b.</p>
    </div>
  );
}

// ====================================================================== nested loop grid
export function NestedGrid() {
  const [rows, setRows] = useState(4);
  const [mode, setMode] = useState<'rect' | 'tri' | 'inv'>('tri');
  const cols = mode === 'rect' ? 5 : rows;
  const order = useMemo(() => {
    const o: [number, number][] = [];
    for (let i = 1; i <= rows; i++) for (let j = 1; j <= cols; j++) {
      if (mode === 'tri' && j > i) break;
      if (mode === 'inv' && j > rows - i + 1) break;
      o.push([i, j]);
    }
    return o;
  }, [rows, cols, mode]);
  const [k, setK] = useState(order.length);
  const cur = order[Math.min(k, order.length) - 1];
  const header = mode === 'rect' ? `for (int j = 1; j <= ${cols}; j++)` : mode === 'tri' ? 'for (int j = 1; j <= i; j++)' : `for (int j = 1; j <= ${rows} - i + 1; j++)`;
  const shown = order.slice(0, k);
  const printed = Array.from({ length: rows }, (_, r) => '*'.repeat(shown.filter(([i]) => i === r + 1).length)).filter((_, r) => shown.some(([i]) => i <= r + 1)).join('\n');
  return (
    <div className="widget">
      <div className="widget-title"><span>Nested loop grid</span><span className="muted">each cell = one inner iteration</span></div>
      <div className="row">
        <select value={mode} onChange={e => { setMode(e.target.value as 'rect'); setK(0); }} aria-label="Inner loop"><option value="tri">j ≤ i (triangle)</option><option value="rect">j ≤ 5 (rectangle)</option><option value="inv">j ≤ n − i + 1 (upside down)</option></select>
        <label className="field" style={{ flexDirection: 'row', alignItems: 'center' }}>rows <input type="range" min={2} max={7} value={rows} onChange={e => { setRows(+e.target.value); setK(0); }} /></label>
      </div>
      <pre className="code" style={{ margin: '10px 0' }}><b>for</b> (int i = 1; i &lt;= {rows}; i++) {'{'}{'\n'}    {header.replace('for', '')} {'{'}{'\n'}        System.out.print("*");{'\n'}    {'}'}{'\n'}    System.out.println();{'\n'}{'}'}</pre>
      <div style={{ display: 'grid', gridTemplateColumns: `36px repeat(${cols}, 34px)`, gap: 3, overflowX: 'auto' }}>
        <span />{Array.from({ length: cols }, (_, j) => <span key={j} className="mono tiny muted" style={{ textAlign: 'center' }}>j={j + 1}</span>)}
        {Array.from({ length: rows }, (_, i) => [
          <span key={'r' + i} className="mono tiny muted">i={i + 1}</span>,
          ...Array.from({ length: cols }, (_, j) => {
            const idx = order.findIndex(([a, b]) => a === i + 1 && b === j + 1);
            const done = idx >= 0 && idx < k, isCur = cur && cur[0] === i + 1 && cur[1] === j + 1, never = idx < 0;
            return <span key={i + ':' + j} className="mono tiny" style={{ height: 30, display: 'grid', placeItems: 'center', borderRadius: 4, border: `1px solid ${isCur ? 'var(--pen)' : never ? 'var(--line-soft)' : 'var(--line)'}`, background: isCur ? 'var(--pen-soft)' : done ? 'var(--green-soft)' : 'transparent', color: isCur ? 'var(--pen)' : 'var(--muted)', opacity: never ? .35 : 1 }}>{idx >= 0 ? idx + 1 : ''}</span>;
          }),
        ])}
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        <button className="icon-btn" onClick={() => setK(Math.max(0, k - 1))} aria-label="Previous">‹</button>
        <button className="icon-btn" onClick={() => setK(Math.min(order.length, k + 1))} aria-label="Next">›</button>
        <button className="btn sm quiet" onClick={() => setK(0)}>Restart</button>
        <span className="mono tiny muted">{cur ? `i = ${cur[0]}, j = ${cur[1]} · inner iteration ${k} of ${order.length}` : 'press › to start'}</span>
      </div>
      <pre className="console" style={{ marginTop: 8 }}>{printed || ' '}</pre>
    </div>
  );
}

// ====================================================================== digits
export function DigitPeeler({ initial = 5724 }: { initial?: number }) {
  const [n, setN] = useState(initial);
  const [mode, setMode] = useState<'back' | 'fwd'>('back');
  const [k, setK] = useState(0);
  const steps = useMemo(() => {
    const out: { num: number; d: number; note: string; sum: number; rev: number; hl: number }[] = [];
    if (mode === 'back') {
      let x = n, sum = 0, rev = 0;
      while (x > 0) { const d = x % 10; sum += d; rev = rev * 10 + d; out.push({ num: x, d, note: `d = ${x} % 10 = ${d}  ·  n = ${x} / 10 = ${Math.floor(x / 10)}`, sum, rev, hl: String(x).length - 1 }); x = Math.floor(x / 10); }
    } else {
      let div = 1; while (div * 10 <= n) div *= 10;
      let pos = 0, sum = 0;
      for (let d0 = div; d0 > 0; d0 = Math.floor(d0 / 10)) { const d = Math.floor(n / d0) % 10; sum += d; out.push({ num: n, d, note: `d = (${n} / ${d0}) % 10 = ${d}  ·  div = ${d0} / 10`, sum, rev: 0, hl: pos++ }); }
    }
    return out;
  }, [n, mode]);
  const s = steps[Math.min(k, steps.length - 1)];
  const digits = s ? String(s.num) : String(n);
  return (
    <div className="widget">
      <div className="widget-title"><span>Digit peeler</span><span className="muted">% 10 and / 10</span></div>
      <div className="row">
        <input type="number" value={n} min={1} max={999999999} onChange={e => { setN(Math.max(1, Math.min(999999999, Math.trunc(+e.target.value) || 1))); setK(0); }} aria-label="Number" style={{ width: 150, fontFamily: 'var(--mono)' }} />
        <div className="tabgroup">
          <button className={`tab${mode === 'back' ? ' active' : ''}`} style={{ border: 0 }} onClick={() => { setMode('back'); setK(0); }}>right → left</button>
          <button className={`tab${mode === 'fwd' ? ' active' : ''}`} style={{ border: 0 }} onClick={() => { setMode('fwd'); setK(0); }}>left → right</button>
        </div>
      </div>
      <div className="tiles" style={{ margin: '12px 0' }}>{[...digits].map((c, i) => <div key={i} className={`tile${s && i === s.hl ? ' on' : ''}`} style={{ opacity: mode === 'back' || !s || i >= 0 ? 1 : .5 }}><span className="c">{c}</span><span className="i">{mode === 'back' ? `10^${digits.length - 1 - i}` : `pos ${i + 1}`}</span></div>)}</div>
      {s && <div className="syntax">{s.note}</div>}
      <div className="grid3">
        <div className="membox"><span className="lbl">digit d</span><div className="stat">{s?.d ?? '—'}</div></div>
        <div className="membox"><span className="lbl">running sum</span><div className="stat">{s?.sum ?? 0}</div></div>
        <div className="membox"><span className="lbl">{mode === 'back' ? 'reversed' : 'digits so far'}</span><div className="stat" style={{ fontSize: 24 }}>{mode === 'back' ? s?.rev ?? 0 : steps.slice(0, k + 1).map(x => x.d).join(' ')}</div></div>
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        <button className="icon-btn" onClick={() => setK(Math.max(0, k - 1))} aria-label="Previous">‹</button>
        <button className="icon-btn" onClick={() => setK(Math.min(steps.length - 1, k + 1))} aria-label="Next">›</button>
        <span className="mono tiny muted">step {Math.min(k, steps.length - 1) + 1}/{steps.length}{mode === 'back' && k >= steps.length - 1 ? ' · n is now 0, so the loop stops' : ''}</span>
      </div>
    </div>
  );
}

export function MergeChecksum({ initial = 154897258 }: { initial?: number }) {
  const [n, setN] = useState(initial);
  const [k, setK] = useState(0);
  const steps = useMemo(() => {
    const out: { num: number; a: number; b: number; s: number; next: number }[] = [];
    let x = n;
    while (x >= 10 && out.length < 12) { const a = x % 10, b = Math.floor(x / 10) % 10; let s = a + b; if (s >= 10) s %= 10; const next = Math.floor(x / 100) * 10 + s; out.push({ num: x, a, b, s, next }); x = next; }
    return { out, final: x };
  }, [n]);
  const st = steps.out[k];
  return (
    <div className="widget">
      <div className="widget-title"><span>Merge-last-two checksum</span><span className="muted">the real midterm pattern</span></div>
      <input type="number" value={n} onChange={e => { setN(Math.max(1, Math.min(999999999, Math.trunc(+e.target.value) || 1))); setK(0); }} aria-label="Number" style={{ width: 160, fontFamily: 'var(--mono)' }} />
      {st ? <>
        <div className="tiles" style={{ margin: '12px 0' }}>{[...String(st.num)].map((c, i, arr) => <div key={i} className={`tile${i >= arr.length - 2 ? ' on' : ''}`}><span className="c">{c}</span><span className="i">{i + 1}</span></div>)}</div>
        <div className="syntax">last two: {st.b} + {st.a} = {st.b + st.a}{st.b + st.a >= 10 ? ` → ${st.b + st.a} % 10 = ${st.s}` : ''} · new number = ({st.num} / 100) × 10 + {st.s} = {st.next}</div>
      </> : <div className="fb info" style={{ marginTop: 10 }}><span className="verdict">Single digit</span>Nothing to merge.</div>}
      <div className="row">
        <button className="icon-btn" onClick={() => setK(Math.max(0, k - 1))} aria-label="Previous">‹</button>
        <button className="icon-btn" onClick={() => setK(Math.min(steps.out.length - 1, k + 1))} aria-label="Next">›</button>
        <span className="mono tiny muted">merge {k + 1}/{steps.out.length} · final checksum = {steps.final} ({steps.final % 2 === 0 ? 'even' : 'odd'})</span>
      </div>
    </div>
  );
}
