import { useMemo, useState, type ReactNode } from 'react';
import { runJava } from '../../engine/java';
import { Visualizer } from '../../components/Visualizer';
import { Code } from '../../components/Code';
import { gradeOutput } from '../../lib/grading';
import { inline, Md } from '../../lib/markdown';
import { problemById } from '../../content/problems';
import { href } from '../../lib/router';
import { FlowchartView, withIds } from '../../components/Flowchart';
import type { FlowItem } from '../../content/model';

/** A visualized example: the code runs in the interpreter and can be stepped. */
export function Watch({ code, stdin, title = 'Watch it run', compact, startAtEnd }: { code: string; stdin?: string; title?: string; compact?: boolean; startAtEnd?: boolean }) {
  return <div style={{ margin: '0 0 1em' }}><Visualizer source={code} stdin={stdin} title={title} compact={compact} startAtEnd={startAtEnd} /></div>;
}

/** Predict the output before running. The answer is whatever the interpreter (JDK-verified) prints. */
export function Predict({ code, prompt = 'What does this print? Type every line.', stdin, why }: { code: string; prompt?: string; stdin?: string; why?: ReactNode }) {
  const expected = useMemo(() => runJava(code, { stdin }).output, [code, stdin]);
  const [val, setVal] = useState('');
  const [checked, setChecked] = useState(false);
  const [watch, setWatch] = useState(false);
  const g = gradeOutput(expected, val);
  const ok = checked && g.correct === g.total;
  return (
    <div className="widget">
      <div className="widget-title"><span>Predict</span><span className="muted">then check</span></div>
      <p style={{ marginBottom: 8 }}>{inline(prompt)}</p>
      <Code code={code} numbers />
      {stdin && <div className="syntax"><span className="callout-label">Input</span>{stdin}</div>}
      <textarea rows={Math.max(2, Math.min(8, expected.split('\n').length))} value={val} onChange={e => { setVal(e.target.value); setChecked(false); }} placeholder="Your prediction…" aria-label="Your predicted output" spellCheck={false} />
      <div className="row" style={{ marginTop: 8 }}>
        <button className="btn sm" onClick={() => setChecked(true)} disabled={!val.trim()}>Check</button>
        <button className="btn ghost sm" onClick={() => setWatch(w => !w)}>{watch ? 'Hide' : 'Watch it run'}</button>
      </div>
      {checked && (
        <div className={`fb ${ok ? 'ok' : 'bad'}`} style={{ marginTop: 10 }}>
          <span className="verdict">{ok ? 'Correct' : `${g.correct}/${g.total} lines right`}</span>
          {!ok && <>Java prints:<pre className="console" style={{ marginTop: 6, minHeight: 0 }}>{expected}</pre></>}
          {why && <div style={{ marginTop: 6 }}>{why}</div>}
        </div>
      )}
      {watch && <div style={{ marginTop: 10 }}><Visualizer source={code} stdin={stdin} title="Step through it" /></div>}
    </div>
  );
}

export interface QuizQ { q: string; options: string[]; answer: number; why: string }

/** Multiple choice, one question at a time, with an explanation after each answer. */
export function Quiz({ items, title = 'Check yourself' }: { items: QuizQ[]; title?: string }) {
  const [k, setK] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const done = k >= items.length;
  if (done) return (
    <div className="widget"><div className="widget-title"><span>{title}</span></div>
      <div className={`fb ${score === items.length ? 'ok' : 'info'}`}><span className="verdict">{score}/{items.length}</span>{score === items.length ? 'All correct.' : 'Review the ones you missed, then try again.'}</div>
      <button className="btn ghost sm" onClick={() => { setK(0); setPicked(null); setScore(0); }}>Try again</button>
    </div>
  );
  const it = items[k];
  return (
    <div className="widget">
      <div className="widget-title"><span>{title}</span><span className="muted">{k + 1}/{items.length}</span></div>
      <p>{inline(it.q)}</p>
      {it.options.map((o, i) => (
        <button key={i} className={`quiz-opt${picked !== null && i === it.answer ? ' right' : ''}${picked === i && i !== it.answer ? ' wrong' : ''}`} disabled={picked !== null} onClick={() => { setPicked(i); if (i === it.answer) setScore(s => s + 1); }}>{o}</button>
      ))}
      {picked !== null && (
        <>
          <div className={`fb ${picked === it.answer ? 'ok' : 'bad'}`}><span className="verdict">{picked === it.answer ? 'Correct' : 'Not quite'}</span>{inline(it.why)}</div>
          <button className="btn sm" onClick={() => { setK(k + 1); setPicked(null); }}>{k + 1 < items.length ? 'Next question' : 'See score'}</button>
        </>
      )}
    </div>
  );
}

/** Small helpers for writing lesson prose. */
export const P = ({ children }: { children: ReactNode }) => <p>{children}</p>;
export const Kid = ({ children }: { children: ReactNode }) => <div className="kid"><span className="callout-label">In plain words</span>{children}</div>;
export const Trap = ({ children, title = 'Exam trap' }: { children: ReactNode; title?: string }) => <div className="note"><span className="callout-label">{title}</span>{children}</div>;
export const Syntax = ({ children }: { children: ReactNode }) => <div className="syntax">{children}</div>;
export const Steps = ({ items }: { items: ReactNode[] }) => <ol className="steps">{items.map((x, i) => <li key={i}>{x}</li>)}</ol>;
export const J = Code;
export function Table({ head, rows, num = [] }: { head: string[]; rows: ReactNode[][]; num?: number[] }) {
  return (
    <div className="table-wrap"><table>
      <thead><tr>{head.map((h, i) => <th key={i} className={num.includes(i) ? 'num' : ''}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={num.includes(j) ? 'num' : ''}>{c}</td>)}</tr>)}</tbody>
    </table></div>
  );
}

/** A real exam-style problem from the practice bank, with its reference solution run step by step. */
export function ExamWalk({ id, input, note }: { id: string; input?: string; note?: ReactNode }) {
  const p = problemById(id);
  const [open, setOpen] = useState(false);
  if (!p) return null;
  const inp = input ?? p.samples?.[0]?.input ?? '';
  return (
    <div className="widget">
      <div className="widget-title"><span>Worked exam problem · {p.title}</span><a className="small" href={href('problem', p.id)}>Try it yourself →</a></div>
      <Md text={p.statement} />
      {note && <div className="kid"><span className="callout-label">How to attack it</span>{note}</div>}
      {p.plan && <Steps items={p.plan.map((x, i) => <span key={i}>{inline(x)}</span>)} />}
      {!open
        ? <button className="btn sm" onClick={() => setOpen(true)}>Show the solution running{inp ? ' on the sample input' : ''}</button>
        : <Visualizer source={p.solution} stdin={inp || undefined} flowchart={p.flowchart} title="Reference solution, step by step" />}
    </div>
  );
}

/** A static flowchart diagram. */
export function Flow({ items, label }: { items: FlowItem[]; label?: string }) {
  const it = useMemo(() => withIds(items), [items]);
  return <div style={{ margin: '0 0 1em' }}><FlowchartView items={it} label={label} /></div>;
}

/** A labelled pair: the idea and what it looks like in Java. */
export function Pattern({ name, children, code }: { name: string; children?: ReactNode; code: string }) {
  return (
    <div className="widget">
      <div className="widget-title"><span>Pattern · {name}</span></div>
      {children}
      <Code code={code} />
    </div>
  );
}
