import { href } from '../lib/router';
import { useProgress } from '../lib/progress';
import { MID_TOPICS, FINAL_TOPICS, topicById } from '../content/topics';
import { PROBLEMS, problemById } from '../content/problems';
import { LESSONS } from '../lessons';
import { overallProgress } from '../components/Shell';
import { Visualizer } from '../components/Visualizer';
import { java, type Topic } from '../content/model';

const DEMO = java`
  public class Main {
      public static void main(String[] args) {
          int n = 5724, sum = 0;
          while (n > 0) {
              int d = n % 10;
              sum += d;
              n /= 10;
          }
          System.out.println("Digit sum = " + sum);
      }
  }
`;

export function TopicCard({ t }: { t: Topic }) {
  const p = useProgress();
  const probs = PROBLEMS.filter(q => q.topic === t.id);
  const lesson = LESSONS[t.id];
  const done = (p.sections[t.id] ?? []).length;
  return (
    <a className="topic-card" href={href('learn', t.id)}>
      <div className="spread" style={{ marginBottom: 4 }}>
        <span className="eyebrow" style={{ margin: 0 }}>{String(t.order).padStart(2, '0')} · {t.exam === 'mid' ? 'Midterm' : 'Final'}</span>
        <span className="mono tiny muted">{done}/{lesson.sections.length} sections</span>
      </div>
      <h4 style={{ marginBottom: 4 }}>{t.title}</h4>
      <p className="small muted" style={{ marginBottom: 8 }}>{t.goal}</p>
      <div className="dots-line" aria-label={`${probs.filter(q => p.solved[q.id]).length} of ${probs.length} problems solved`}>
        {probs.map(q => <i key={q.id} className={p.solved[q.id] ? 's' : p.tries[q.id] ? 't' : ''} />)}
      </div>
    </a>
  );
}

export function Home() {
  const p = useProgress();
  const o = overallProgress(p);
  const lastT = p.lastLesson ? topicById(p.lastLesson) : null;
  const lastP = p.lastProblem ? problemById(p.lastProblem) : null;
  const next = [...MID_TOPICS, ...FINAL_TOPICS].find(t => (p.sections[t.id] ?? []).length < LESSONS[t.id].sections.length);
  return (
    <main className="wrap">
      <section className="hero" style={{ marginBottom: 28 }}>
        <span className="eyebrow">// CSE110 · Java from zero to exam-ready</span>
        <h1>See every line of Java run.</h1>
        <p className="lede">Fifteen topics, each with its own interactive visualizations, and {PROBLEMS.length} long-form practice problems written in the style of real midterm and final papers — flowcharts, digit checksums, trace tables, array builders, String processing and recursion tracing. Everything runs in your browser.</p>
        <div className="big-actions" style={{ marginTop: 18 }}>
          <a className="btn" href={href('learn', next?.id ?? 'flowcharts')}>{o.doneSections ? 'Continue learning' : 'Start learning'} →</a>
          <a className="btn quiet" href={href('midterm')}>Midterm path</a>
          <a className="btn quiet" href={href('final')}>Final path</a>
        </div>
      </section>

      <div className="stack">
        <Visualizer source={DEMO} title="Try it — press play" footer={<p className="tiny muted" style={{ margin: '8px 12px 10px' }}>This is the engine behind every lesson and every solution: a Java interpreter that runs here, step by step, showing variables, output, loops, arrays and the call stack.</p>} />

        {(lastT || lastP) && (
          <div className="card tight">
            <span className="eyebrow">Pick up where you left off</span>
            <div className="row">
              {lastT && <a className="btn quiet sm" href={href('learn', lastT.id)}>Lesson · {lastT.title}</a>}
              {lastP && <a className="btn quiet sm" href={href('problem', lastP.id)}>Problem · {lastP.title}</a>}
            </div>
          </div>
        )}

        <div className="grid3">
          <div className="card tight"><span className="eyebrow">Solved</span><div className="stat">{o.solved}<span className="muted small"> / {o.total}</span></div></div>
          <div className="card tight"><span className="eyebrow">Lesson sections</span><div className="stat">{o.doneSections}<span className="muted small"> / {o.totalSections}</span></div></div>
          <div className="card tight"><span className="eyebrow">Day streak</span><div className="stat">{p.streak.days}</div></div>
        </div>

        <h3 className="rule">Midterm syllabus</h3>
        <div className="grid2">{MID_TOPICS.map(t => <TopicCard key={t.id} t={t} />)}</div>
        <h3 className="rule">Final syllabus</h3>
        <div className="grid2">{FINAL_TOPICS.map(t => <TopicCard key={t.id} t={t} />)}</div>

        <h3 className="rule">How it works</h3>
        <ol className="steps">
          <li><b>Learn</b> a topic section by section. Each section has its own visual: sliders, animated arrays, digit peelers, call stacks, and code you can step through.</li>
          <li><b>Practice</b> with full-length exam-style problems. Code is run against hidden tests; trace tables are marked cell by cell.</li>
          <li><b>Test</b> yourself with timed mock papers that mix the question types exactly as the midterm and final do, with partial marks.</li>
        </ol>
      </div>
    </main>
  );
}
