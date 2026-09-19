import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { runJava, type RunResult, type Step, type FrameView, type ArrView } from '../engine/java';
import { JavaLine } from './Code';
import { FlowchartView, flowLineMap, withIds } from './Flowchart';
import type { FlowItem } from '../content/model';

export interface VisualizerProps {
  source: string;
  stdin?: string;
  title?: string;
  flowchart?: FlowItem[];
  /** Start at the end of the run instead of the beginning. */
  startAtEnd?: boolean;
  /** Hide panels that are irrelevant for small lesson examples. */
  compact?: boolean;
  /** Pre-computed result (to avoid running twice). */
  result?: RunResult;
  footer?: ReactNode;
}

const KIND_LABEL: Record<string, [string, string]> = {
  start: ['start', 'pen'], stmt: ['run', 'pen'], decl: ['declare', 'violet'], cond: ['decide', 'amber'], 'loop-check': ['check', 'amber'],
  'loop-update': ['update', 'violet'], call: ['call', 'pen'], return: ['return', 'green'], break: ['break', 'red'], continue: ['continue', 'amber'],
  switch: ['switch', 'amber'], end: ['end', 'green'], error: ['error', 'red'],
};

function useSteps(source: string, stdin: string | undefined, pre?: RunResult) {
  return useMemo(() => pre ?? runJava(source, { stdin, trace: true }), [source, stdin, pre]);
}

export function Visualizer({ source, stdin, title = 'Execution', flowchart, startAtEnd, compact, result: pre, footer }: VisualizerProps) {
  const result = useSteps(source, stdin, pre);
  const steps = result.steps;
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(700);
  const rootRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLDivElement>(null);
  const lines = useMemo(() => source.replace(/\n$/, '').split('\n'), [source]);

  useEffect(() => { setI(startAtEnd && steps.length ? steps.length - 1 : 0); setPlaying(false); }, [steps, startAtEnd]);
  useEffect(() => {
    if (!playing) return;
    if (i >= steps.length - 1) { setPlaying(false); return; }
    const t = setTimeout(() => setI(x => Math.min(steps.length - 1, x + 1)), speed);
    return () => clearTimeout(t);
  }, [playing, i, steps.length, speed]);

  const step: Step | undefined = steps[Math.min(i, steps.length - 1)];
  const prev: Step | undefined = i > 0 ? steps[i - 1] : undefined;

  // keep the current line visible inside the code pane without scrolling the page
  useEffect(() => {
    const box = codeRef.current; if (!box || !step) return;
    const el = box.querySelector<HTMLElement>(`[data-line="${step.line}"]`);
    if (!el) return;
    const top = el.offsetTop - box.offsetTop;
    if (top < box.scrollTop + 20 || top > box.scrollTop + box.clientHeight - 40) box.scrollTop = Math.max(0, top - box.clientHeight / 2);
  }, [step]);

  const seenLines = useMemo(() => { const s = new Set<number>(); for (let k = 0; k <= i && k < steps.length; k++) s.add(steps[k].line); return s; }, [i, steps]);
  const output = result.output.slice(0, step?.outLen ?? 0);
  const newOut = prev ? result.output.slice(prev.outLen, step?.outLen ?? 0) : '';

  const flow = useMemo(() => flowchart ? withIds(flowchart) : null, [flowchart]);
  const fmap = useMemo(() => flow ? flowLineMap(flow, source) : null, [flow, source]);
  const flowSeen = useMemo(() => { const s = new Set<string>(); if (fmap) for (let k = 0; k <= i && k < steps.length; k++) { const id = fmap.get(steps[k].line); if (id) s.add(id); } return s; }, [fmap, i, steps]);

  const hasLoops = steps.some(s => s.loops.length);
  const recursive = useMemo(() => steps.some(s => { const names = s.frames.filter(f => f.method !== 'static').map(f => f.sig); return new Set(names).size < names.length; }), [steps]);

  const move = useCallback((d: number) => { setPlaying(false); setI(x => Math.max(0, Math.min(steps.length - 1, x + d))); }, [steps.length]);
  const onKey = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).tagName === 'INPUT' && (e.target as HTMLInputElement).type !== 'range') return;
    if (e.key === 'ArrowRight') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); }
    else if (e.key === ' ' && (e.target as HTMLElement).tagName !== 'BUTTON') { e.preventDefault(); setPlaying(p => !p); }
    else if (e.key === 'Home') { e.preventDefault(); setI(0); }
    else if (e.key === 'End') { e.preventDefault(); setI(steps.length - 1); }
  };

  if (result.error?.kind === 'compile') {
    return (
      <div className="viz"><div className="viz-head"><span className="t">{title}</span><span className="tag red">does not compile</span></div>
        <div style={{ padding: 14 }}><div className="fb bad"><span className="verdict">Compile error · line {result.error.line}</span>{result.error.message}</div></div>
      </div>
    );
  }
  if (!step) return null;
  const [kLabel, kColor] = KIND_LABEL[step.kind] ?? ['step', 'pen'];
  const topFrame = step.frames[step.frames.length - 1];
  const prevVars = new Map<string, string>();
  const prevTop = prev?.frames[prev.frames.length - 1];
  if (prevTop && topFrame && prevTop.sig === topFrame.sig && prev!.frames.length === step.frames.length) prevTop.vars.forEach(v => prevVars.set(v.name, v.display));

  return (
    <div className="viz" ref={rootRef} tabIndex={0} onKeyDown={onKey} aria-label={`${title} — use the left and right arrow keys to step`}>
      <div className="viz-head">
        <span className="t">{title}</span>
        <span className="row">
          {result.truncated && <span className="tag amber" title="Only the first steps are recorded for very long runs">first {steps.length} steps</span>}
          {result.error && <span className="tag red">{(result.error.kind as string) === 'limit' ? 'stopped' : 'exception'}</span>}
          <span className={`tag ${kColor}`}>{kLabel}</span>
        </span>
      </div>

      {flow && (
        <div style={{ padding: 12, borderBottom: '1px solid var(--line-soft)' }}>
          <FlowchartView items={flow} active={fmap?.get(step.line) ?? null} seen={flowSeen} />
        </div>
      )}

      <div className="viz-code" ref={codeRef} aria-hidden="true">
        {lines.map((l, k) => {
          const n = k + 1;
          const cur = n === step.line;
          return <div key={k} data-line={n} className={`l${cur ? ' cur' : ''}${seenLines.has(n) ? ' seen' : ''}`}><span className="arrow">{cur ? '▶' : ''}</span><span className="no">{n}</span><span><JavaLine text={l} /></span></div>;
        })}
      </div>

      <div className="viz-controls">
        <button className="icon-btn" onClick={() => { setPlaying(false); setI(0); }} aria-label="Restart" title="Restart (Home)">⟲</button>
        <button className="icon-btn" onClick={() => move(-1)} disabled={i === 0} aria-label="Previous step" title="Previous (←)">‹</button>
        <button className="btn sm" onClick={() => { if (i >= steps.length - 1) setI(0); setPlaying(p => !p); }} aria-label={playing ? 'Pause' : 'Play'}>{playing ? 'Pause' : 'Play'}</button>
        <button className="icon-btn" onClick={() => move(1)} disabled={i >= steps.length - 1} aria-label="Next step" title="Next (→)">›</button>
        <input type="range" min={0} max={Math.max(0, steps.length - 1)} value={i} onChange={e => { setPlaying(false); setI(+e.target.value); }} aria-label="Execution timeline" />
        <select value={speed} onChange={e => setSpeed(+e.target.value)} aria-label="Playback speed" style={{ padding: '4px 6px', fontSize: 13 }}>
          <option value={1200}>slow</option><option value={700}>normal</option><option value={300}>fast</option>
        </select>
        <span className="stepno">step {i + 1}/{steps.length}</span>
      </div>

      <div className="viz-why" aria-live="polite">
        <span className="kind mono small muted">line {step.line}</span>
        <span>{step.desc}{step.kind === 'error' && result.error ? <><br /><code>{result.error.message}</code></> : null}</span>
      </div>

      <div className="viz-body">
        <div>
          <div className="pane-title"><span>Variables</span><span>{step.frames.filter(f => f.method !== 'static').length > 1 ? 'call stack · top = running' : ''}</span></div>
          <Frames frames={step.frames} prevVars={prevVars} />
        </div>
        <div>
          <div className="pane-title"><span>Output</span>{stdin ? <span>input read: {step.inPos}/{stdin.length} chars</span> : null}</div>
          <pre className="console" aria-label="Program output">{output ? <>{output.slice(0, output.length - newOut.length)}<mark>{newOut}</mark></> : <span className="dim">nothing printed yet</span>}</pre>
          {stdin !== undefined && stdin !== '' && <StdinView stdin={stdin} pos={step.inPos} />}
        </div>

        {step.arrays.length > 0 && <div className="full"><div className="pane-title"><span>Arrays (objects in memory)</span></div><Arrays step={step} /></div>}
        {step.hl.some(h => h.str !== undefined) && <div className="full"><div className="pane-title"><span>String characters</span></div><StrTiles step={step} /></div>}
        {!compact && hasLoops && step.loops.length > 0 && <div className="full"><div className="pane-title"><span>Loop</span></div><LoopCycle step={step} source={lines} /></div>}
        {!compact && <IterTable result={result} upto={i} />}
        {!compact && recursive && <div className="full"><div className="pane-title"><span>Call tree</span><span>blue = running · green = returned</span></div><CallTree steps={steps} upto={i} /></div>}
      </div>
      {footer}
    </div>
  );
}

function Frames({ frames, prevVars }: { frames: FrameView[]; prevVars: Map<string, string> }) {
  const shown = frames.filter(f => f.method !== 'static' || f.vars.length);
  if (!shown.length) return <div className="empty-hint">No variables yet.</div>;
  return (
    <div className="frames">
      {[...shown].reverse().map((f, k) => {
        const top = k === 0 && f.method !== 'static';
        return (
          <div key={k} className={`frame${top ? ' top' : ''}`}>
            <div className="frame-h"><span>{f.method === 'static' ? 'static fields' : f.sig}</span>{f.method !== 'static' && <span>line {f.line}</span>}</div>
            {f.vars.length ? f.vars.map(v => {
              const old = top && v.changed ? prevVars.get(v.name) : undefined;
              return (
                <div key={v.name} className={`var${top && v.changed ? ' changed' : ''}`}>
                  <span className="nm"><small>{v.type}</small>{v.name}</span>
                  <span className="vl">{old !== undefined && old !== v.display && old !== '?' ? <span className="old">{old}</span> : null}{v.display}</span>
                </div>
              );
            }) : <div className="empty-hint">no variables</div>}
          </div>
        );
      })}
    </div>
  );
}

function StdinView({ stdin, pos }: { stdin: string; pos: number }) {
  return (
    <div style={{ marginTop: 8 }}>
      <div className="pane-title"><span>Input buffer</span><span>grey = already read</span></div>
      <pre className="console" style={{ minHeight: 0 }}><span className="dim">{stdin.slice(0, pos)}</span><mark style={{ background: 'var(--pen-soft)', color: 'var(--pen)' }}>{stdin.slice(pos, pos + 1) || ' '}</mark>{stdin.slice(pos + 1)}</pre>
    </div>
  );
}

function Arrays({ step }: { step: Step }) {
  const owners = new Map<number, string[]>();
  step.frames.forEach(f => f.vars.forEach(v => { if (v.ref !== undefined) owners.set(v.ref, [...(owners.get(v.ref) ?? []), f.method === step.frames[step.frames.length - 1].method ? v.name : `${f.method}.${v.name}`]); }));
  return <>{step.arrays.map((a: ArrView) => {
    const reads = new Set(step.hl.filter(h => h.arr === a.id && !h.write).map(h => h.idx));
    const writes = new Set(step.hl.filter(h => h.arr === a.id && h.write).map(h => h.idx));
    const who = owners.get(a.id);
    return (
      <div key={a.id}>
        <div className="arr-label">#{a.id} · {a.type}{who?.length ? <> · referenced by <b>{who.join(', ')}</b></> : ' · (no variable refers to it now)'}</div>
        <div className="cells">
          {a.values.map((v, idx) => (
            <div key={idx} className={`cell${writes.has(idx) ? ' write' : reads.has(idx) ? ' read' : ''}`}>
              <span className="v">{v}</span><span className="i">{v.startsWith('…') ? '' : idx}</span>
            </div>
          ))}
          {a.values.length === 0 && <span className="empty-hint">empty array (length 0)</span>}
        </div>
      </div>
    );
  })}</>;
}

function StrTiles({ step }: { step: Step }) {
  const h = step.hl.find(x => x.str !== undefined)!;
  const s = h.str!;
  return (
    <div>
      <div className="tiles">{[...s].slice(0, 60).map((c, k) => <div key={k} className={`tile${k === h.strIdx ? ' on' : ''}${c === ' ' ? ' space' : ''}`}><span className="c">{c === ' ' ? '␣' : c}</span><span className="i">{k}</span></div>)}</div>
      <div className="tiny muted" style={{ marginTop: 4 }}>charAt({h.strIdx}) → '{s[h.strIdx!]}' · length() = {s.length}, so the last index is {s.length - 1}</div>
    </div>
  );
}

/** INIT → CHECK → BODY → UPDATE, lit according to what the current step is doing inside the innermost loop. */
function LoopCycle({ step, source }: { step: Step; source: string[] }) {
  const loop = step.loops[step.loops.length - 1];
  const header = source[loop.line - 1]?.trim() ?? '';
  const isFor = loop.kind === 'for';
  let phase: 'init' | 'check' | 'body' | 'update' = 'body';
  if (step.kind === 'loop-check') phase = 'check';
  else if (step.kind === 'loop-update') phase = 'update';
  else if (step.line === loop.line && (step.kind === 'decl' || step.kind === 'stmt') && loop.iter === 0) phase = 'init';
  const forParts = isFor ? header.replace(/^for\s*\(/, '').replace(/\)\s*\{?\s*$/, '').split(';').map(s => s.trim()) : [];
  const nodes: [string, string, string][] = isFor
    ? [['init', 'init', forParts[0] || '—'], ['check', 'check', forParts[1] || 'true'], ['body', 'body', 'run the block'], ['update', 'update', forParts[2] || '—']]
    : [['check', 'check', header.replace(/^(while|do)\s*/, '').replace(/\{\s*$/, '') || 'condition'], ['body', 'body', 'run the block'], ['update', 'change', 'inside the body']];
  return (
    <div>
      <div className="loopbox" style={{ marginBottom: 8 }}>
        {step.loops.map((l, k) => <span key={k} className="loop-pill">{k === 0 ? 'outer' : k === step.loops.length - 1 ? 'inner' : 'middle'} {l.kind} · line {l.line} · iteration <b>{l.iter || '—'}</b></span>)}
      </div>
      <div className="cycle" style={{ gridTemplateColumns: `repeat(${nodes.length}, 1fr)` }}>
        {nodes.map(([id, name, detail]) => (
          <div key={id} className={`node${phase === id ? ' on' : ''}${phase === 'check' && id === 'check' && step.cond === false ? ' false' : ''}`}>
            {name}{id === 'check' && phase === 'check' ? (step.cond ? ' → true' : ' → false') : ''}<small title={detail}>{detail}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

interface TNode { id: number; label: string; children: TNode[]; ret?: string; depth: number; parent?: TNode; done: boolean }

/** The recursion tree, rebuilt from the call/return steps up to the current one. */
function CallTree({ steps, upto }: { steps: Step[]; upto: number }) {
  const { root, active, onStack } = useMemo(() => {
    const root: TNode = { id: 0, label: 'main', children: [], depth: 0, done: false };
    let cur = root; let id = 1;
    for (let k = 0; k <= upto && k < steps.length; k++) {
      const s = steps[k];
      if (s.kind === 'call') {
        const top = s.frames[s.frames.length - 1];
        const args = top.vars.map(v => v.display).join(', ');
        const n: TNode = { id: id++, label: `${top.method}(${args})`, children: [], depth: cur.depth + 1, parent: cur, done: false };
        cur.children.push(n); cur = n;
      } else if (s.kind === 'return' && s.desc.startsWith('Back in') && cur.parent) {
        const m = /returned (.+)\.$/.exec(s.desc);
        cur.ret = m ? m[1] : 'done';
        cur.done = true;
        cur = cur.parent;
      }
    }
    const onStack = new Set<number>(); for (let n: TNode | undefined = cur; n; n = n.parent) onStack.add(n.id);
    return { root, active: cur.id, onStack };
  }, [steps, upto]);
  const rows: ReactNode[] = [];
  const walk = (n: TNode, prefix: string, last: boolean) => {
    if (rows.length > 200) return;
    rows.push(
      <div key={n.id} className={`tn${n.id === active ? ' active' : onStack.has(n.id) ? ' onstack' : n.done ? ' done' : ''}`}>
        <span className="guide">{prefix}{n.depth ? (last ? '└─ ' : '├─ ') : ''}</span><span className="box">{n.label}</span>{n.ret !== undefined && <span className="ret">→ {n.ret}</span>}
      </div>,
    );
    n.children.forEach((c, k) => walk(c, prefix + (n.depth ? (last ? '   ' : '│  ') : ''), k === n.children.length - 1));
  };
  walk(root, '', true);
  return <div className="tree">{rows}</div>;
}

/** Run a program once and show its output only (no stepping). */
export function RunOutput({ result }: { result: RunResult }) {
  return (
    <pre className="console">
      {result.output}
      {result.error && <span className="err">{result.output && !result.output.endsWith('\n') ? '\n' : ''}{result.error.kind === 'compile' ? `Compile error (line ${result.error.line}): ${result.error.message}` : `${result.error.message}\n  at line ${result.error.line}\n  → ${result.error.friendly}`}</span>}
      {!result.output && !result.error && <span className="dim">(no output)</span>}
    </pre>
  );
}

/** The paper trace table, built live: one row per completed iteration of main's first top-level loop. */
function IterTable({ result, upto }: { result: RunResult; upto: number }) {
  const top = result.iterations.filter(x => x.depth === 1);
  if (!top.length) return null;
  const loopId = top[0].loopId;
  const rows = top.filter(x => x.loopId === loopId);
  const vars = Object.keys(rows[rows.length - 1].vars);
  const shown = rows.filter(r => r.at <= upto + 1);
  return (
    <div className="full">
      <div className="pane-title"><span>Trace table</span><span>values at the end of each iteration · loop on line {rows[0].line}</span></div>
      <div className="table-wrap"><table className="tt">
        <thead><tr><th className="num">iter</th>{vars.map(v => <th key={v} className="num">{v}</th>)}<th>printed</th></tr></thead>
        <tbody>
          {shown.map((r, k) => <tr key={k} style={k === shown.length - 1 ? { background: 'var(--pen-soft)' } : undefined}><td className="num">{k + 1}</td>{vars.map(v => <td key={v} className="num">{r.vars[v] ?? ''}</td>)}<td className="num">{r.out.replace(/\n$/, '').split('\n').join(', ')}</td></tr>)}
          {shown.length < rows.length && <tr><td className="num muted" colSpan={vars.length + 2}>{rows.length - shown.length} more row{rows.length - shown.length === 1 ? '' : 's'} to come…</td></tr>}
        </tbody>
      </table></div>
    </div>
  );
}
