import { useState } from 'react';
import { href } from '../lib/router';
import { useProgress } from '../lib/progress';
import { TOPICS, topicById } from '../content/topics';
import { PROBLEMS, problemById, problemsForTopic } from '../content/problems';
import type { Problem, TopicId } from '../content/model';
import { ProblemView, KIND_NAME } from '../components/ProblemView';
import { ProblemList } from './Learn';

type Status = 'all' | 'unsolved' | 'solved' | 'tried' | 'saved';

export function PracticePage({ topic }: { topic?: TopicId }) {
  const p = useProgress();
  const [kind, setKind] = useState<Problem['kind'] | 'all'>('all');
  const [diff, setDiff] = useState<Problem['difficulty'] | 'all'>('all');
  const [status, setStatus] = useState<Status>('all');
  const [q, setQ] = useState('');
  const base = topic ? problemsForTopic(topic) : PROBLEMS;
  const list = base.filter(x =>
    (kind === 'all' || x.kind === kind) && (diff === 'all' || x.difficulty === diff) &&
    (status === 'all' || (status === 'solved' ? !!p.solved[x.id] : status === 'unsolved' ? !p.solved[x.id] : status === 'tried' ? !!p.tries[x.id] && !p.solved[x.id] : p.bookmarks.includes(x.id))) &&
    (!q.trim() || (x.title + ' ' + (x.tags ?? []).join(' ')).toLowerCase().includes(q.trim().toLowerCase())));
  const t = topic ? topicById(topic) : null;
  const solvedHere = base.filter(x => p.solved[x.id]).length;
  return (
    <main className="wrap">
      <span className="eyebrow">Practice{t ? ` · ${t.exam === 'mid' ? 'Midterm' : 'Final'}` : ''}</span>
      <h1>{t ? t.title : 'Every exam-style problem'}</h1>
      <p className="lede">{t ? t.goal : 'Full-length questions shaped like the midterm and final: complete programs checked on hidden tests, flowcharts to implement, and trace tables marked cell by cell.'}</p>
      <div className="meter green" style={{ margin: '0 0 6px' }}><i style={{ width: `${(solvedHere / Math.max(1, base.length)) * 100}%` }} /></div>
      <p className="mono tiny muted">{solvedHere}/{base.length} solved{t ? <> · <a href={href('learn', t.id)}>read the lesson first</a></> : null}</p>

      <nav className="chips" aria-label="Topics" style={{ marginTop: 14 }}>
        <a className={`chip${!topic ? ' current' : ''}`} href={href('practice')}>All</a>
        {TOPICS.map(x => {
          const n = problemsForTopic(x.id).length, s = problemsForTopic(x.id).filter(y => p.solved[y.id]).length;
          return <a key={x.id} className={`chip${topic === x.id ? ' current' : ''}${s === n && n ? ' done' : ''}`} href={href('practice', x.id)}>{x.short} <span style={{ opacity: .7 }}>{s}/{n}</span></a>;
        })}
      </nav>

      <div className="row" style={{ marginBottom: 14 }}>
        <select value={kind} onChange={e => setKind(e.target.value as typeof kind)} aria-label="Question type">
          <option value="all">All types</option>
          {(Object.keys(KIND_NAME) as Problem['kind'][]).map(k => <option key={k} value={k}>{KIND_NAME[k]}</option>)}
        </select>
        <select value={diff} onChange={e => setDiff(e.target.value as typeof diff)} aria-label="Difficulty">
          <option value="all">Any difficulty</option>
          {['Warm-up', 'Practice', 'Exam', 'Challenge'].map(d => <option key={d}>{d}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value as Status)} aria-label="Status">
          <option value="all">Any status</option><option value="unsolved">Unsolved</option><option value="tried">Attempted, not solved</option><option value="solved">Solved</option><option value="saved">Saved ★</option>
        </select>
        <input type="text" placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} aria-label="Search problems" style={{ flex: 1, minWidth: 120 }} />
      </div>
      <ProblemList ids={list.map(x => x.id)} />
    </main>
  );
}

export function ProblemPage({ id }: { id: string }) {
  const p = problemById(id);
  if (!p) return <main className="wrap"><div className="card"><h1>Problem not found</h1><a href={href('practice')}>Back to practice</a></div></main>;
  const list = problemsForTopic(p.topic);
  const i = list.findIndex(x => x.id === id);
  return (
    <main className="wrap">
      <ProblemView p={p} nav={{ prev: list[i - 1]?.id, next: list[i + 1]?.id, index: `${i + 1}/${list.length}` }} />
    </main>
  );
}
