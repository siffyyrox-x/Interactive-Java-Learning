import { useEffect, useMemo, useState } from 'react';
import type { Problem } from '../content/model';
import { topicById } from '../content/topics';
import { Md } from '../lib/markdown';
import { Code } from './Code';
import { CodeEditor } from './LazyEditor';
import { Visualizer, RunOutput } from './Visualizer';
import { FlowchartView, withIds } from './Flowchart';
import { TraceTable, OutputAnswer, scoreTrace, emptyTrace, type TraceAnswers } from './TraceTable';
import { gradeCode, expectedOutput, gradeOutput, type Grade } from '../lib/grading';
import { runJava } from '../engine/java';
import { actions, useProgress } from '../lib/progress';
import { href } from '../lib/router';

export const KIND_NAME: Record<Problem['kind'], string> = { code: 'Write a program', flowchart: 'Flowchart → Java', 'trace-table': 'Trace table', 'trace-output': 'Exact output' };
export const DIFF_TAG: Record<Problem['difficulty'], string> = { 'Warm-up': 'green', Practice: 'pen', Exam: 'amber', Challenge: 'red' };

export function ProblemHeader({ p, index }: { p: Problem; index?: string }) {
  const t = topicById(p.topic);
  return (
    <>
      <span className="eyebrow">{index ? `${index} · ` : ''}{t.exam === 'mid' ? 'Midterm' : 'Final'} · {t.short} · {KIND_NAME[p.kind]}</span>
      <h1 style={{ fontSize: 32 }}>{p.title}</h1>
      <div className="row" style={{ marginBottom: 14 }}>
        <span className={`tag ${DIFF_TAG[p.difficulty]}`}>{p.difficulty}</span>
        <span className="tag">{p.marks} marks</span>
        {(p.tags ?? []).slice(0, 4).map(tg => <span key={tg} className="tag">{tg}</span>)}
      </div>
    </>
  );
}

export function ProblemStatement({ p }: { p: Problem }) {
  const flow = useMemo(() => p.flowchart ? withIds(p.flowchart) : null, [p.flowchart]);
  const samples = p.kind === 'code' ? (p.samples ?? []) : [];
  return (
    <>
      <Md text={p.statement} />
      {p.restrictions?.length ? <div className="note"><span className="callout-label">Restrictions</span><ul className="dots" style={{ margin: 0 }}>{p.restrictions.map(r => <li key={r}>{r}</li>)}</ul>{p.rules && <div className="tiny muted" style={{ marginTop: 6 }}>These are checked on your code, not just its output.</div>}</div> : null}
      {flow && <div style={{ margin: '0 0 1em' }}><FlowchartView items={flow} label={`Flowchart for ${p.title}`} /></div>}
      {samples.length > 0 && (
        <>
          <h3>Sample input and output</h3>
          <div className="samples">
            {samples.map((s, k) => (
              <div className="sample" key={k}>
                <div><div className="h">Input {samples.length > 1 ? k + 1 : ''}</div><pre>{s.input || '(none)'}</pre></div>
                <div><div className="h">Expected output</div><pre>{expectedOutput(p, s.input)}</pre></div>
                {s.note && <div className="note-row">{s.note}</div>}
              </div>
            ))}
          </div>
        </>
      )}
      {(p.kind === 'trace-table' || p.kind === 'trace-output') && (
        <>
          {p.samples?.[0]?.input ? <div className="syntax"><span className="callout-label">Input typed by the user</span><pre style={{ margin: 0 }}>{p.samples[0].input}</pre></div> : null}
          <Code code={p.solution} numbers />
        </>
      )}
    </>
  );
}

function Hints({ p }: { p: Problem }) {
  const [n, setN] = useState(0);
  return (
    <div>
      {p.hints.slice(0, n).map((h, k) => <div className="note" key={k}><span className="callout-label">Hint {k + 1}</span>{h}</div>)}
      {n < p.hints.length ? <button className="btn ghost sm" onClick={() => setN(n + 1)}>{n === 0 ? 'Show a hint' : 'Show the next hint'} ({n + 1}/{p.hints.length})</button> : <span className="tiny muted">That's every hint.</span>}
    </div>
  );
}

function Solution({ p }: { p: Problem }) {
  const input = p.kind === 'code' ? p.samples?.[0]?.input ?? '' : p.samples?.[0]?.input ?? '';
  return (
    <div className="stack">
      {p.plan?.length ? <><h3>The approach</h3><ol className="steps">{p.plan.map((s, k) => <li key={k}>{s}</li>)}</ol></> : null}
      {p.kind === 'code' || p.kind === 'flowchart' ? <><h3>Reference solution</h3><Code code={p.solution} numbers /></> : null}
      <h3>Watch it run{input ? ' on the first sample' : ''}</h3>
      <Visualizer source={p.solution} stdin={input} title={p.kind.startsWith('trace') ? 'Trace' : 'Reference solution'} flowchart={p.flowchart} />
    </div>
  );
}

function GradeView({ g }: { g: Grade }) {
  if (g.compileError) return <div className="fb bad"><span className="verdict">Does not compile · line {g.compileError.line}</span>{g.compileError.message}</div>;
  const hidden = g.results.filter(r => !r.sample);
  return (
    <div className="stack">
      <div className={`fb ${g.allPass ? 'ok' : 'bad'}`}>
        <span className="verdict">{g.allPass ? 'Accepted' : g.passed === g.total && g.rules.length ? 'Output correct — rules broken' : 'Not yet'}</span>
        {g.passed}/{g.total} tests passed{hidden.length ? ` (${g.results.filter(r => r.sample && r.pass).length}/${g.results.filter(r => r.sample).length} samples, ${hidden.filter(r => r.pass).length}/${hidden.length} hidden)` : ''}.
        {g.rules.length > 0 && <ul className="dots" style={{ margin: '6px 0 0' }}>{g.rules.map(r => <li key={r}>{r}</li>)}</ul>}
      </div>
      <div className="results">
        {g.results.map((r, k) => (
          <details key={k} className={`result ${r.pass ? 'pass' : 'fail'}`} open={!r.pass && g.results.findIndex(x => !x.pass) === k}>
            <summary><span className="mono small">{r.pass ? '✓' : '✗'}</span><span>{r.sample ? 'Sample' : 'Hidden'} test {k + 1}</span><span className="muted small" style={{ marginLeft: 'auto' }}>{r.error ? r.error.name.replace(/^java\.(lang|util)\./, '') : r.pass ? 'passed' : 'wrong output'}</span></summary>
            <div className="body">
              <div><div className="pane-title">Input</div><pre className="console" style={{ minHeight: 0 }}>{r.input || '(none)'}</pre></div>
              <div><div className="pane-title">Expected</div><pre className="console" style={{ minHeight: 0 }}>{r.expected}</pre></div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div className="pane-title">Your output</div>
                <RunOutput result={{ ok: !r.error, output: r.actual, error: r.error, steps: [], iterations: [], truncated: false, ops: 0 }} />
                {!r.pass && !r.error && (r.missing || r.unexpected) && <p className="small" style={{ marginTop: 6 }}>{r.unexpected ? <>Your program printed <code>{r.unexpected}</code>{r.missing ? <> where the expected line is <code>{r.missing}</code></> : ' which is not expected'}.</> : <>The line <code>{r.missing}</code> is missing.</>}</p>}
              </div>
            </div>
          </details>
        ))}
      </div>
      <p className="tiny muted">Input prompts such as <code>Enter a number:</code> are allowed. Wording, letter case and number values must match; tiny floating-point differences are tolerated.</p>
    </div>
  );
}

function CodeWorkspace({ p }: { p: Problem }) {
  const prog = useProgress();
  const [code, setCode] = useState(() => prog.drafts[p.id] ?? p.starter ?? '');
  const [input, setInput] = useState(p.samples?.[0]?.input ?? '');
  const [grade, setGrade] = useState<Grade | null>(null);
  const [run, setRun] = useState<ReturnType<typeof runJava> | null>(null);
  const [viz, setViz] = useState(false);
  useEffect(() => { const t = setTimeout(() => { if (code !== (p.starter ?? '')) actions.saveDraft(p.id, code); }, 500); return () => clearTimeout(t); }, [code, p.id, p.starter]);
  const errLine = grade?.compileError?.line ?? (run?.error?.kind === 'compile' ? run.error.line : null);
  const submit = () => { const g = gradeCode(p, code); setGrade(g); setRun(null); setViz(false); actions.attempt(p.id, g.allPass); };
  const runOnce = () => { setRun(runJava(code, { stdin: input })); setGrade(null); setViz(false); };
  return (
    <div className="stack">
      <CodeEditor value={code} onChange={setCode} errorLine={errLine} title="Main.java" right={<>
        <button className="btn quiet sm" onClick={() => { if (confirm('Replace your code with the starter template?')) { setCode(p.starter ?? ''); actions.clearDraft(p.id); } }}>Reset</button>
      </>} />
      {p.kind === 'code' && (
        <label className="field">Custom input for Run / Visualize
          <textarea rows={Math.min(6, Math.max(2, input.split('\n').length))} value={input} onChange={e => setInput(e.target.value)} spellCheck={false} />
        </label>
      )}
      <div className="row">
        <button className="btn" onClick={submit}>Submit — run all tests</button>
        <button className="btn ghost" onClick={runOnce}>Run</button>
        <button className="btn ghost" onClick={() => { setViz(v => !v); setGrade(null); setRun(null); }}>{viz ? 'Hide visualizer' : 'Visualize my code'}</button>
      </div>
      {run && <div><div className="pane-title">Output</div><RunOutput result={run} /></div>}
      {grade && <GradeView g={grade} />}
      {viz && <Visualizer source={code} stdin={p.kind === 'code' ? input : ''} title="Your code" flowchart={p.flowchart} />}
    </div>
  );
}

function TraceWorkspace({ p }: { p: Problem }) {
  const [ans, setAns] = useState<TraceAnswers>(emptyTrace());
  const [checked, setChecked] = useState(false);
  const [reveal, setReveal] = useState(false);
  const score = checked ? scoreTrace(p.solution, p.traceVars ?? [], ans) : null;
  return (
    <div className="stack">
      <TraceTable solution={p.solution} vars={p.traceVars ?? []} value={ans} onChange={a => { setAns(a); setChecked(false); }} checked={checked} reveal={reveal} />
      <div className="row">
        <button className="btn" onClick={() => { setChecked(true); const s = scoreTrace(p.solution, p.traceVars ?? [], ans); actions.attempt(p.id, s.correct === s.total && s.outCorrect === s.outTotal); }}>Check my table</button>
        {checked && <button className="btn ghost" onClick={() => setReveal(r => !r)}>{reveal ? 'Hide answers' : 'Show correct values'}</button>}
      </div>
      {score && (
        <div className={`fb ${score.correct === score.total && score.outCorrect === score.outTotal ? 'ok' : 'bad'}`}>
          <span className="verdict">{score.correct === score.total && score.outCorrect === score.outTotal ? 'Every cell correct' : 'Check the red cells'}</span>
          Table: {score.correct}/{score.total} cells · Output: {score.outCorrect}/{score.outTotal} lines. {score.correct < score.total ? 'Open "Watch it run" below the hints to see exactly where your trace went off.' : ''}
        </div>
      )}
    </div>
  );
}

function OutputWorkspace({ p }: { p: Problem }) {
  const [val, setVal] = useState('');
  const [checked, setChecked] = useState(false);
  const expected = useMemo(() => runJava(p.solution, { stdin: p.samples?.[0]?.input ?? '' }).output, [p]);
  const g = gradeOutput(expected, val);
  return (
    <div className="stack">
      <OutputAnswer expected={expected} value={val} onChange={v => { setVal(v); setChecked(false); }} checked={checked} />
      <div className="row"><button className="btn" onClick={() => { setChecked(true); actions.attempt(p.id, g.correct === g.total); }} disabled={!val.trim()}>Check my output</button></div>
      {checked && <div className={`fb ${g.correct === g.total ? 'ok' : 'bad'}`}><span className="verdict">{g.correct === g.total ? 'Exactly right' : `${g.correct}/${g.total} lines correct`}</span>{g.correct === g.total ? 'Every line matches what Java prints.' : 'The table shows the first lines that differ. Use a hint, or watch the program run step by step.'}</div>}
    </div>
  );
}

export function ProblemView({ p, nav }: { p: Problem; nav?: { prev?: string; next?: string; index?: string } }) {
  const prog = useProgress();
  const [showSol, setShowSol] = useState(false);
  useEffect(() => { setShowSol(false); }, [p.id]);
  const solved = !!prog.solved[p.id];
  const bookmarked = prog.bookmarks.includes(p.id);
  return (
    <div className="stack">
      <div className="card">
        <div className="spread" style={{ marginBottom: 6 }}>
          <a className="chip" href={href('practice', p.topic)}>← {topicById(p.topic).title}</a>
          <span className="row">
            {solved && <span className="tag green">solved</span>}
            <button className="btn quiet sm" onClick={() => actions.toggleBookmark(p.id)} aria-pressed={bookmarked}>{bookmarked ? '★ Saved' : '☆ Save'}</button>
          </span>
        </div>
        <ProblemHeader p={p} index={nav?.index} />
        <ProblemStatement p={p} />
        <h3>{p.kind === 'trace-table' ? 'Your trace' : p.kind === 'trace-output' ? 'Your answer' : 'Your solution'}</h3>
        {p.kind === 'trace-table' ? <TraceWorkspace key={p.id} p={p} /> : p.kind === 'trace-output' ? <OutputWorkspace key={p.id} p={p} /> : <CodeWorkspace key={p.id} p={p} />}
        <h3>Hints</h3>
        <Hints key={p.id} p={p} />
        <h3>{p.kind.startsWith('trace') ? 'Watch it run' : 'Solution'}</h3>
        {showSol ? <Solution p={p} /> : (
          <div className="row">
            <button className="btn ghost" onClick={() => { if (solved || p.kind.startsWith('trace') || confirm('Looking at the solution before you have solved it is fine — but try the hints first. Show it now?')) setShowSol(true); }}>
              {p.kind.startsWith('trace') ? 'Step through the program' : 'Show the solution and watch it run'}
            </button>
          </div>
        )}
      </div>
      {nav && (
        <div className="spread">
          {nav.prev ? <a className="btn quiet" href={href('problem', nav.prev)}>← Previous</a> : <span />}
          {nav.next ? <a className="btn quiet" href={href('problem', nav.next)}>Next problem →</a> : <span />}
        </div>
      )}
    </div>
  );
}
