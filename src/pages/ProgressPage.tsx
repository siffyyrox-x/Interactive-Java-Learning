import { useRef, useState } from 'react';
import { href } from '../lib/router';
import { actions, update, useProgress, storageAvailable, type Progress } from '../lib/progress';
import { TOPICS } from '../content/topics';
import { problemsForTopic, problemById } from '../content/problems';
import { LESSONS } from '../lessons';
import { overallProgress } from '../components/Shell';

export function ProgressPage() {
  const p = useProgress();
  const o = overallProgress(p);
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const weak = TOPICS.map(t => {
    const probs = problemsForTopic(t.id);
    const tried = probs.filter(q => p.tries[q.id]);
    const failed = tried.filter(q => !p.solved[q.id]).length;
    return { t, failed, rate: probs.filter(q => p.solved[q.id]).length / Math.max(1, probs.length) };
  }).filter(x => x.failed > 0).sort((a, b) => b.failed - a.failed).slice(0, 3);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cse110-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const importJson = async (f: File) => {
    try {
      const data = JSON.parse(await f.text()) as Progress;
      if (!data || data.version !== 2 || typeof data.solved !== 'object') throw new Error('not a progress file');
      update(() => ({ ...data, exams: Array.isArray(data.exams) ? data.exams : [], bookmarks: Array.isArray(data.bookmarks) ? data.bookmarks : [] }));
      setMsg('Progress imported.');
    } catch { setMsg('That file is not a progress export from this site.'); }
  };

  return (
    <main className="wrap">
      <span className="eyebrow">Progress</span>
      <h1>Your progress</h1>
      <p className="lede">Stored only in this browser. Export it to move to another device.</p>
      {!storageAvailable() && <div className="warn"><span className="callout-label">Storage unavailable</span>This browser is blocking local storage (private mode?), so progress will be lost when you close the tab.</div>}

      <div className="grid3">
        <div className="card tight"><span className="eyebrow">Overall</span><div className="stat">{o.pct}%</div></div>
        <div className="card tight"><span className="eyebrow">Problems</span><div className="stat">{o.solved}<span className="muted small"> / {o.total}</span></div></div>
        <div className="card tight"><span className="eyebrow">Streak</span><div className="stat">{p.streak.days}<span className="muted small"> days</span></div></div>
      </div>

      {weak.length > 0 && (
        <div className="note" style={{ marginTop: 18 }}><span className="callout-label">Focus next</span>
          {weak.map(w => <div key={w.t.id}><a href={href('practice', w.t.id)}>{w.t.title}</a> — {w.failed} attempted but not yet solved</div>)}
        </div>
      )}

      <h3 className="rule">Mastery by topic</h3>
      <div className="table-wrap"><table>
        <thead><tr><th>Topic</th><th className="num">Lesson</th><th>Solved</th></tr></thead>
        <tbody>{TOPICS.map(t => {
          const probs = problemsForTopic(t.id), s = probs.filter(q => p.solved[q.id]).length;
          return (
            <tr key={t.id}>
              <td><a href={href('learn', t.id)}>{t.title}</a> <span className="tag" style={{ marginLeft: 4 }}>{t.exam === 'mid' ? 'mid' : 'final'}</span></td>
              <td className="num">{(p.sections[t.id] ?? []).length}/{LESSONS[t.id].sections.length}</td>
              <td><div className="row" style={{ flexWrap: 'nowrap' }}><div className="meter green" style={{ flex: 1, minWidth: 60 }}><i style={{ width: `${(s / Math.max(1, probs.length)) * 100}%` }} /></div><span className="mono tiny">{s}/{probs.length}</span></div></td>
            </tr>
          );
        })}</tbody>
      </table></div>

      {p.bookmarks.length > 0 && <>
        <h3 className="rule">Saved problems</h3>
        <div className="chips">{p.bookmarks.map(id => { const q = problemById(id); return q ? <a key={id} className="chip" href={href('problem', id)}>★ {q.title}</a> : null; })}</div>
      </>}

      {p.exams.length > 0 && <>
        <h3 className="rule">Mock papers taken</h3>
        <div className="table-wrap"><table>
          <thead><tr><th>Paper</th><th className="num">Score</th><th>When</th></tr></thead>
          <tbody>{[...p.exams].reverse().map(e => <tr key={e.id}><td>{e.title}</td><td className="num">{e.score}/{e.total}</td><td className="small">{new Date(e.at).toLocaleString()}</td></tr>)}</tbody>
        </table></div>
      </>}

      <h3 className="rule">Your data</h3>
      <div className="row">
        <button className="btn quiet" onClick={exportJson}>Export progress (.json)</button>
        <button className="btn quiet" onClick={() => file.current?.click()}>Import…</button>
        <input ref={file} type="file" accept="application/json,.json" hidden onChange={e => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = ''; }} />
        <button className="btn quiet" style={{ color: 'var(--red)' }} onClick={() => { if (confirm('Erase all progress, drafts and exam history on this device? This cannot be undone.')) { actions.reset(); setMsg('Progress reset.'); } }}>Reset everything</button>
      </div>
      {msg && <p className="small" style={{ marginTop: 10 }}>{msg}</p>}
      <p className="tiny muted" style={{ marginTop: 14 }}>Clearing site data, using a private window or switching browser separates progress. Nothing is ever sent to a server.</p>
    </main>
  );
}
