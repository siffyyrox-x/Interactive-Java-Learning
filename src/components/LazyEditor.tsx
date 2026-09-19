import { lazy, Suspense } from 'react';
import type { EditorProps } from './Editor';

const Editor = lazy(() => import('./Editor'));

/** The editor bundle loads on demand; a plain textarea stands in while it loads. */
export function CodeEditor(props: EditorProps & { title?: string; right?: React.ReactNode }) {
  return (
    <div className="editor">
      {(props.title || props.right) && <div className="editor-bar"><span>{props.title ?? 'Main.java'}</span><span className="row">{props.right}</span></div>}
      <Suspense fallback={<textarea className="editor-fallback" value={props.value} onChange={e => props.onChange(e.target.value)} aria-label={props.label ?? 'Java code editor'} spellCheck={false} />}>
        <Editor {...props} />
      </Suspense>
    </div>
  );
}
