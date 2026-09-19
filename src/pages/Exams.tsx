import { useEffect, useMemo, useRef, useState } from 'react';
import { href, go } from '../lib/router';
import { actions, useProgress } from '../lib/progress';
import { MID_TOPICS, FINAL_TOPICS, topicById } from '../content/topics';
import { problemsForTopic } from '../content/problems';
import { EXAM_SETS, examSetById, resolveProblems, scoreAnswer, type Answer, type QuestionScore } from '../content/exams';
import type { Problem } from '../content/model';
import { ProblemHeader, ProblemStatement } from '../components/ProblemView';
import { CodeEditor } from '../components/LazyEditor';
import { TraceTable, OutputAnswer, emptyTrace } from '../components/TraceTable';
import { Visualizer } from '../components/Visualizer';
import { LESSONS } from '../lessons';

const BLUEPRINT = {
  mid: {
    title: 'Midterm', lede: 'A three-question paper. Every mock here follows that exact structure.',
    parts: [
      ['Q1 · Flowchart → Java', '10 marks', 'Implement a complete program from a flowchart: declarations, nested if/else, exact output.', 'flowcharts'],
      ['Q2 · Digit problem', '10 marks', 'Read a number and compute a checksum or property with % and /, usually without Strings or arrays.', 'digits'],
      ['Q3 · Trace table', '10 marks', 'Trace a loop with ++/--, a flag or a modulus and fill every row plus the output.', 'tracing'],
    ],
  },
  final: {
    title: 'Final', lede: 'Longer programs on arrays and Strings, plus recursion tracing. Mocks mix the three.',
    parts: [
      ['Array building', '10 marks', 'Create a new array by filtering, partitioning, rotating or de-duplicating — keeping order.', 'array-build'],
      ['String processing', '10 marks', 'Walk a String character by character: embedded numbers, keepers, simplification.', 'strings'],
      ['Recursion tracing', '10 marks', 'Write the exact output of a recursive program, including lines printed on the way back.', 'recursion'],
    ],
  },
} as const;

export function PrepPage({ exam }: { exam: 'mid' | 'final' }) {
  const p = useProgress();
  const b = BLUEPRINT[exam];
  const topics = exam === 'mid' ? MID_TOPICS : FINAL_TOPICS;
  const sets = EXAM_SETS.filter(s => s.kind === exam);
  const history = p.exams.filter(e => e.kind === exam).slice(-5).reverse();
  return (
    <main className="wrap">
      <span className="eyebrow">{b.title} path</span>
      <h1>{b.title} preparation</h1>
      <p className="lede">{b.lede}</p>

      <h3 className="rule">What the paper looks like</h3>
      <div className="stack">
        {b.parts.map(([name, marks, what, topic]) => (
          <div className="card tight" key={name}>
            <div className="spread"><h4 style={{ margin: 0 }}>{name}</h4><span className="tag amber">{marks}</span></div>
            <p className="small" style={{ margin: '6px 0 8px' }}>{what}</p>
            <div className="row"><a className="btn quiet sm" href={href('learn', topic)}>Lesson</a><a className="btn quiet sm" href={href('practice', topic)}>Practice ({problemsForTopic(topic).length})</a></div>
          </div>
        ))}
      </div>

      <h3 className="rule">Readiness by topic</h3>
      <div className="table-wrap"><table>
        <thead><tr><th>Topic</th><th>Lesson</th><th>Problems solved</th></tr></thead>
        <tbody>{topics.map(t => {
          const probs = problemsForTopic(t.id), s = probs.filter(q => p.solved[q.id]).length;
          const ls = (p.sections[t.id] ?? []).length, lt = LESSONS[t.id].sections.length;
          return (
            <tr key={t.id}>
              <td><a href={href('learn', t.id)}>{t.title}</a></td>
              <td className="num">{ls}/{lt}</td>
              <td><div className="row" style={{ flexWrap: 'nowrap' }}><div className="meter green" style={{ flex: 1, minWidth: 60 }}><i style={{ width: `${(s / Math.max(1, probs.length)) * 100}%` }} /></div><span className="mono tiny">{s}/{probs.length}</span></div></td>
            </tr>
          );
        })}</tbody>
      </table></div>

      <h3 className="rule">Mock papers</h3>
      <ExamList sets={sets} />
      {history.length > 0 && <><h3 className="rule">Your recent attempts</h3><History exams={history} /></>}
    </main>
  );
}

function ExamList({ sets }: { sets: typeof EXAM_SETS }) {
  const p = useProgress();
  return (
    <div className="list">
      {sets.map(s => {
        const best = p.exams.filter(e => e.id.startsWith(s.id + '@')).reduce<number | null>((m, e) => Math.max(m ?? 0, Math.round((e.score / e.total) * 100)), null);
        return (
          <a key={s.id} href={href('exam', s.id)}>
            <span className="mono tiny muted">{s.minutes}′</span>
            <span><span className="title">{s.title}</span><br /><span className="sub">{s.blurb}</span></span>
            <span className="end">{best !== null ? <span className={`tag ${best >= 70 ? 'green' : best >= 40 ? 'amber' : 'red'}`}>best {best}%</span> : <span className="tag">not taken</span>}</span>
          </a>
        );
      })}
    </div>
  );
}

function History({ exams }: { exams: ReturnType<typeof useProgress>['exams'] }) {
  return (
    <div className="table-wrap"><table>
      <thead><tr><th>Paper</th><th className="num">Score</th><th className="num">Time</th><th>When</th></tr></thead>
      <tbody>{exams.map(e => <tr key={e.id}><td>{e.title}</td><td className="num">{e.score}/{e.total}</td><td className="num">{e.minutes}′</td><td className="small">{new Date(e.at).toLocaleString()}</td></tr>)}</tbody>
    </table></div>
  );
}

export function TestHub() {
  const p = useProgress();
  return (
    <main className="wrap">
      <span className="eyebrow">Test yourself</span>
      <h1>Mock papers and drills</h1>
      <p className="lede">Sit a full paper with a timer, or a short drill on one topic. Answers are marked the way an examiner would: partial marks for each test passed, each table cell and each output line.</p>
      <h3 className="rule">Midterm papers</h3>
      <ExamList sets={EXAM_SETS.filter(s => s.kind === 'mid')} />
      <h3 className="rule">Final papers</h3>
      <ExamList sets={EXAM_SETS.filter(s => s.kind === 'final')} />
      <h3 className="rule">Quick drills</h3>
      <div className="chips">
        <a className="chip" href={href('exam', 'drill-tracing-mix')}>Exact output ×6</a>
        {[...MID_TOPICS, ...FINAL_TOPICS].map(t => <a key={t.id} className="chip" href={href('exam', 'drill-' + t.id)}>{t.short} ×3</a>)}
      </div>
      {p.exams.length > 0 && <><h3 className="rule">History</h3><History exams={p.exams.slice(-10).reverse()} /></>}
    </main>
  );
}

// ====================================================================== exam runner
type Phase = 'intro' | 'running' | 'done';

export function ExamPage({ id }: { id: string }) {
  const set = useMemo(() => examSetById(id), [id]);
  const [probs, setProbs] = useState<Problem[]>([]);
  const [phase, setPhase] = useState<Phase>('intro');
  const [timed, setTimed] = useState(true);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [cur, setCur] = useState(0);
  const [start, setStart] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [scores, setScores] = useState<QuestionScore[]>([]);
  const finishRef = useRef<() => void>(() => {});
  const doneRef = useRef(false);

  useEffect(() => {
    if (phase !== 'running') return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'running') return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    addEventListener('beforeunload', warn);
    return () => removeEventListener('beforeunload', warn);
  }, [phase]);

  useEffect(() => {
    if (phase === 'running' && timed && set && now - start >= set.minutes * 60000 && !doneRef.current) finishRef.current();
  }, [now, phase, timed, start, set]);

  if (!set) return <main className="wrap"><div className="card"><h1>Paper not found</h1><a href={href('test')}>All papers</a></div></main>;
  const limit = set.minutes * 60;
  const elapsed = Math.floor((now - start) / 1000);
  const left = limit - elapsed;

  const begin = () => {
    const ps = resolveProblems(set);
    setProbs(ps);
    setAnswers(Object.fromEntries(ps.map(q => [q.id, q.kind === 'trace-table' ? { trace: emptyTrace() } : q.kind === 'trace-output' ? { output: '' } : { code: q.starter ?? '' }])));
    doneRef.current = false;
    setCur(0); setStart(Date.now()); setNow(Date.now()); setPhase('running');
  };
  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    const sc = probs.map(q => scoreAnswer(q, answers[q.id]));
    setScores(sc);
    const perTopic: Record<string, [number, number]> = {};
    sc.forEach((s, k) => { const t = probs[k].topic; const v = perTopic[t] ?? [0, 0]; perTopic[t] = [v[0] + s.score, v[1] + s.marks]; });
    const at = new Date().toISOString();
    actions.saveExam({ id: `${set.id}@${at}`, kind: set.kind, title: set.title, score: sc.reduce((a, s) => a + s.score, 0), total: sc.reduce((a, s) => a + s.marks, 0), at, perTopic, minutes: Math.max(1, Math.round(elapsed / 60)) });
    sc.forEach((s, k) => { if (s.score === s.marks) actions.attempt(probs[k].id, true); });
    setPhase('done');
    scrollTo({ top: 0 });
  };
  finishRef.current = finish;

  if (phase === 'intro') return (
    <main className="wrap">
      <a className="chip" href={href('test')}>← All papers</a>
      <h1 style={{ marginTop: 10 }}>{set.title}</h1>
      <p className="lede">{set.blurb || 'A short randomised drill.'}</p>
      <div className="card">
        <ul className="dots">
          <li>{typeof set.problems === 'function' ? 'Questions are drawn at random when you start.' : `${set.problems.length} questions, ${set.problems.length * 10} marks.`}</li>
          <li>Code answers run against hidden tests. Trace tables are marked cell by cell. You get partial marks.</li>
          <li>No hints or solutions during the paper. After you submit, every question can be replayed step by step.</li>
        </ul>
        <label className="row" style={{ margin: '12px 0' }}><input type="checkbox" checked={timed} onChange={e => setTimed(e.target.checked)} /> Timed — {set.minutes} minutes, submits automatically</label>
        <button className="btn" onClick={begin}>Start the paper</button>
      </div>
    </main>
  );

  if (phase === 'done') {
    const total = scores.reduce((a, s) => a + s.score, 0), max = scores.reduce((a, s) => a + s.marks, 0);
    const pct = Math.round((total / Math.max(1, max)) * 100);
    return (
      <main className="wrap">
        <span className="eyebrow">Result · {set.title}</span>
        <h1>{total} / {max} <span className="muted" style={{ fontSize: '.6em' }}>({pct}%)</span></h1>
        <div className="meter green" style={{ marginBottom: 18 }}><i style={{ width: `${pct}%` }} /></div>
        <div className="stack">
          {probs.map((q, k) => <ReviewCard key={q.id} n={k + 1} p={q} s={scores[k]} />)}
          <div className="row">
            <button className="btn" onClick={() => { setPhase('intro'); setScores([]); }}>Take it again</button>
            <a className="btn quiet" href={href('test')}>All papers</a>
          </div>
        </div>
      </main>
    );
  }

  const q = probs[cur];
  const a = answers[q.id];
  const setA = (v: Answer) => setAnswers(x => ({ ...x, [q.id]: v }));
  const answered = (x: Problem) => { const v = answers[x.id]; return x.kind === 'trace-table' ? Object.values(v?.trace?.cells ?? {}).some(c => c.trim()) : x.kind === 'trace-output' ? !!v?.output?.trim() : (v?.code ?? '').trim() !== (x.starter ?? '').trim(); };
  return (
    <main className="wrap">
      <div className="card tight" style={{ position: 'sticky', top: 96, zIndex: 5, marginBottom: 16 }}>
        <div className="spread">
          <div className="qnav">{probs.map((x, k) => <button key={x.id} className={`chip${k === cur ? ' current' : ''}${answered(x) ? ' done' : ''}`} onClick={() => setCur(k)}>Q{k + 1}</button>)}</div>
          <span className={`timer${timed && left < 300 ? ' low' : ''}`}>{timed ? fmt(Math.max(0, left)) : fmt(elapsed)}</span>
          <button className="btn sm" onClick={() => { if (confirm('Submit the paper for marking?')) finish(); }}>Submit</button>
        </div>
      </div>
      <div className="card" key={q.id}>
        <ProblemHeader p={q} index={`Q${cur + 1} of ${probs.length}`} />
        <ProblemStatement p={q} />
        <h3>Your answer</h3>
        {q.kind === 'trace-table' ? <TraceTable solution={q.solution} vars={q.traceVars ?? []} value={a.trace ?? emptyTrace()} onChange={t => setA({ trace: t })} />
          : q.kind === 'trace-output' ? <OutputAnswer expected="" value={a.output ?? ''} onChange={o => setA({ output: o })} checked={false} />
          : <CodeEditor value={a.code ?? ''} onChange={c => setA({ code: c })} title="Main.java" />}
      </div>
      <div className="spread" style={{ marginTop: 14 }}>
        {cur > 0 ? <button className="btn quiet" onClick={() => setCur(cur - 1)}>← Q{cur}</button> : <span />}
        {cur < probs.length - 1 ? <button className="btn quiet" onClick={() => setCur(cur + 1)}>Q{cur + 2} →</button> : <button className="btn" onClick={() => { if (confirm('Submit the paper for marking?')) finish(); }}>Submit paper</button>}
      </div>
    </main>
  );
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

function ReviewCard({ n, p, s }: { n: number; p: Problem; s: QuestionScore }) {
  const [open, setOpen] = useState(false);
  const full = s.score === s.marks;
  return (
    <div className="card tight">
      <div className="spread">
        <span><span className="mono tiny muted">Q{n} · {topicById(p.topic).short}</span><br /><b>{p.title}</b></span>
        <span className={`tag ${full ? 'green' : s.score > 0 ? 'amber' : 'red'}`}>{s.score}/{s.marks}</span>
      </div>
      <p className="small muted" style={{ margin: '6px 0 10px' }}>{s.detail}</p>
      <div className="row">
        <button className="btn ghost sm" onClick={() => setOpen(o => !o)}>{open ? 'Hide' : 'Watch the model answer run'}</button>
        <a className="btn quiet sm" href={href('problem', p.id)} onClick={e => { e.preventDefault(); go('problem', p.id); }}>Practise this question</a>
      </div>
      {open && <div style={{ marginTop: 12 }}><Visualizer source={p.solution} stdin={p.samples?.[0]?.input} flowchart={p.flowchart} title="Model answer" /></div>}
    </div>
  );
}
