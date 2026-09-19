import { useEffect } from 'react';
import { href, go } from '../lib/router';
import { actions, useProgress } from '../lib/progress';
import { TOPICS, MID_TOPICS, FINAL_TOPICS, topicById } from '../content/topics';
import { problemsForTopic, problemById } from '../content/problems';
import { LESSONS } from '../lessons';
import type { TopicId } from '../content/model';
import { TopicCard } from './Home';
import { KIND_NAME, DIFF_TAG } from '../components/ProblemView';

export function LearnIndex() {
  return (
    <main className="wrap">
      <span className="eyebrow">Learn</span>
      <h1>The whole syllabus, one topic at a time</h1>
      <p className="lede">Work through the topics in order. Each one is split into short sections, and every section has something to play with — then a worked exam problem and practice questions of the same kind.</p>
      <h3 className="rule">Midterm · topics 1–9</h3>
      <div className="grid2">{MID_TOPICS.map(t => <TopicCard key={t.id} t={t} />)}</div>
      <h3 className="rule">Final · topics 10–15</h3>
      <div className="grid2">{FINAL_TOPICS.map(t => <TopicCard key={t.id} t={t} />)}</div>
    </main>
  );
}

export function LessonPage({ topic, section }: { topic: TopicId; section?: string }) {
  const p = useProgress();
  const t = topicById(topic);
  const lesson = LESSONS[topic];
  const idx = Math.max(0, lesson.sections.findIndex(s => s.id === section));
  const sec = lesson.sections[idx];
  const done = new Set(p.sections[topic] ?? []);
  const tIdx = TOPICS.findIndex(x => x.id === topic);
  const nextTopic = TOPICS[tIdx + 1];
  const prevTopic = TOPICS[tIdx - 1];
  useEffect(() => { actions.visitLesson(topic); }, [topic]);
  const last = idx === lesson.sections.length - 1;
  const advance = () => {
    actions.completeSection(topic, sec.id);
    if (!last) go('learn', topic, lesson.sections[idx + 1].id);
    else document.getElementById('practice-list')?.scrollIntoView({ behavior: 'smooth' });
  };
  const probs = problemsForTopic(topic);
  return (
    <main className="wrap">
      <div className="spread" style={{ marginBottom: 6 }}>
        <a className="chip" href={href('learn')}>← All topics</a>
        <span className="mono tiny muted">Topic {t.order} of {TOPICS.length} · {t.exam === 'mid' ? 'Midterm' : 'Final'}</span>
      </div>
      <h1>{t.title}</h1>
      <p className="lede">{t.goal}</p>
      {idx === 0 && <p>{lesson.intro}</p>}

      <nav className="chips" aria-label="Sections">
        {lesson.sections.map((s, k) => (
          <a key={s.id} href={href('learn', topic, s.id)} className={`chip${k === idx ? ' current' : ''}${done.has(s.id) ? ' done' : ''}`} aria-current={k === idx ? 'step' : undefined}>{k + 1}. {s.title}</a>
        ))}
      </nav>

      <article className="card">
        <span className="eyebrow">Section {idx + 1} of {lesson.sections.length}</span>
        <h2>{sec.title}</h2>
        {sec.body()}
        <hr className="divider" />
        <div className="spread">
          {idx > 0 ? <a className="btn quiet" href={href('learn', topic, lesson.sections[idx - 1].id)}>← {lesson.sections[idx - 1].title}</a> : <span />}
          <button className="btn" onClick={advance}>{done.has(sec.id) ? '✓ ' : ''}{last ? 'Finish topic → practice' : `Done — next: ${lesson.sections[idx + 1].title}`}</button>
        </div>
      </article>

      <section id="practice-list" style={{ marginTop: 28 }}>
        <div className="spread">
          <h3 className="rule first" style={{ margin: 0 }}>Practice · {t.short}</h3>
          <a className="small" href={href('practice', topic)}>Open with filters →</a>
        </div>
        <p className="small muted" style={{ marginTop: 8 }}>{probs.length} problems in the style of the {t.exam === 'mid' ? 'midterm' : 'final'} paper.</p>
        <ProblemList ids={probs.map(q => q.id)} />
        <div className="spread" style={{ marginTop: 18 }}>
          {prevTopic ? <a className="btn quiet sm" href={href('learn', prevTopic.id)}>← {prevTopic.title}</a> : <span />}
          {nextTopic ? <a className="btn quiet sm" href={href('learn', nextTopic.id)}>{nextTopic.title} →</a> : <a className="btn quiet sm" href={href('final')}>Final exam prep →</a>}
        </div>
      </section>
    </main>
  );
}

export function ProblemList({ ids }: { ids: string[] }) {
  const p = useProgress();
  const probs = ids.map(id => problemById(id)).filter((q): q is NonNullable<typeof q> => !!q);
  if (!probs.length) return <div className="card tight muted">No problems match these filters.</div>;
  return (
    <div className="list">
      {probs.map((q, k) => (
        <a key={q.id} href={href('problem', q.id)}>
          <span className={`status-dot${p.solved[q.id] ? ' solved' : p.tries[q.id] ? ' tried' : ''}`} title={p.solved[q.id] ? 'solved' : p.tries[q.id] ? 'attempted' : 'not attempted'} />
          <span>
            <span className="title">{k + 1}. {q.title}{p.bookmarks.includes(q.id) ? ' ★' : ''}</span><br />
            <span className="sub">{KIND_NAME[q.kind]} · {q.marks} marks</span>
          </span>
          <span className="end"><span className={`tag ${DIFF_TAG[q.difficulty]}`}>{q.difficulty}</span></span>
        </a>
      ))}
    </div>
  );
}

