import type { ReactNode } from 'react';
import { href } from '../lib/router';
import { actions, useProgress } from '../lib/progress';
import { PROBLEMS } from '../content/problems';
import { LESSONS } from '../lessons';

const GROUPS: [string, string][][] = [
  [['learn', 'Learn'], ['practice', 'Practice'], ['lab', 'Lab']],
  [['midterm', 'Midterm'], ['final', 'Final'], ['test', 'Test']],
  [['progress', 'Progress']],
];

export function overallProgress(p: ReturnType<typeof useProgress>) {
  const solved = PROBLEMS.filter(q => p.solved[q.id]).length;
  const totalSections = Object.values(LESSONS).reduce((a, l) => a + l.sections.length, 0);
  const doneSections = Object.entries(p.sections).reduce((a, [t, s]) => a + Math.min(s.length, LESSONS[t as keyof typeof LESSONS]?.sections.length ?? 0), 0);
  return { solved, total: PROBLEMS.length, pct: Math.round(((solved / PROBLEMS.length) * 0.7 + (doneSections / Math.max(1, totalSections)) * 0.3) * 100), doneSections, totalSections };
}

export function TopBar({ page }: { page: string }) {
  const p = useProgress();
  const o = overallProgress(p);
  const active = page === 'problem' ? 'practice' : page === 'exam' ? 'test' : page;
  return (
    <header className="topbar">
      <div className="wrap">
        <div className="topbar-row">
          <a className="brand" href={href('home')}><b>CSE110</b><span>Interactive Java Learning Lab</span></a>
          <div className="counter">
            <span title="Problems solved on this browser"><strong>{o.solved}</strong>/{o.total} solved</span>
            <button className="icon-btn" onClick={() => actions.setTheme(p.theme === 'dark' ? 'light' : 'dark')} aria-label={`Switch to ${p.theme === 'dark' ? 'light' : 'dark'} theme`} title="Theme">
              {p.theme === 'dark'
                ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
                : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>}
            </button>
          </div>
        </div>
        <nav className="tabbar" aria-label="Main">
          {GROUPS.map((g, k) => (
            <div className="tabgroup" key={k}>
              {g.map(([id, label]) => <a key={id} className={`tab${active === id ? ' active' : ''}`} href={href(id)} aria-current={active === id ? 'page' : undefined}>{label}</a>)}
            </div>
          ))}
        </nav>
        <div className="track" role="progressbar" aria-valuenow={o.pct} aria-valuemin={0} aria-valuemax={100} aria-label="Overall progress"><i style={{ width: `${o.pct}%` }} /></div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div>
          <span className="eyebrow" style={{ marginBottom: 4 }}>Credit</span>
          <strong>Created by Sifat Sadakin</strong><br />
          FYAT Mentor &amp; Undergraduate Teaching Assistant at OAA (Office of Academic Advising)<br />
          <a href="https://www.linkedin.com/in/sifat-sadakin-815b82243/" target="_blank" rel="noreferrer">LinkedIn</a>
        </div>
        <div className="tiny" style={{ alignSelf: 'flex-end' }}>Runs entirely in your browser · progress stays on this device</div>
      </div>
    </footer>
  );
}

export function Page({ children }: { children: ReactNode }) { return <main className="wrap">{children}</main>; }
