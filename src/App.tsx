import { useEffect } from 'react';
import { useRoute } from './lib/router';
import { useProgress } from './lib/progress';
import { TopBar, Footer } from './components/Shell';
import { Home } from './pages/Home';
import { LearnIndex, LessonPage } from './pages/Learn';
import { PracticePage, ProblemPage } from './pages/Practice';
import { LabPage } from './pages/Lab';
import { PrepPage, TestHub, ExamPage } from './pages/Exams';
import { ProgressPage } from './pages/ProgressPage';
import type { TopicId } from './content/model';
import { TOPICS } from './content/topics';

function NotFound() {
  return <main className="wrap"><div className="card"><span className="eyebrow">404</span><h1>Nothing here</h1><p>That page does not exist. <a href="#/">Go to the start</a>.</p></div></main>;
}

export default function App() {
  const route = useRoute();
  const p = useProgress();
  useEffect(() => {
    document.documentElement.dataset.theme = p.theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', p.theme === 'dark' ? '#0d1117' : '#f6f7f9');
  }, [p.theme]);
  const [a] = route.params;
  const isTopic = (x?: string): x is TopicId => !!x && TOPICS.some(t => t.id === x);
  let page;
  switch (route.page) {
    case 'home': page = <Home />; break;
    case 'learn': page = isTopic(a) ? <LessonPage topic={a} section={route.params[1]} /> : a ? <NotFound /> : <LearnIndex />; break;
    case 'practice': page = <PracticePage topic={isTopic(a) ? a : undefined} />; break;
    case 'problem': page = a ? <ProblemPage id={a} /> : <NotFound />; break;
    case 'lab': page = <LabPage />; break;
    case 'midterm': page = <PrepPage exam="mid" />; break;
    case 'final': page = <PrepPage exam="final" />; break;
    case 'test': page = <TestHub />; break;
    case 'exam': page = a ? <ExamPage id={a} /> : <TestHub />; break;
    case 'progress': page = <ProgressPage />; break;
    default: page = <NotFound />;
  }
  return (
    <>
      <TopBar page={route.page} />
      <div id="main-content" key={route.page + '/' + route.params.join('/')}>{page}</div>
      <Footer />
    </>
  );
}
