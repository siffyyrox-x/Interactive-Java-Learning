import { Fragment, type ReactNode } from 'react';

/** Inline markdown: `code`, **bold**, *italic*. Output is React nodes — never raw HTML. */
export function inline(text: string, keyBase = ''): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*\s][^*]*\*)/g;
  let last = 0, m: RegExpExecArray | null, k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (m[1]) out.push(<code key={keyBase + k++}>{tok.slice(1, -1)}</code>);
    else if (m[2]) out.push(<strong key={keyBase + k++}>{tok.slice(2, -2)}</strong>);
    else out.push(<em key={keyBase + k++}>{tok.slice(1, -1)}</em>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Block markdown: blank-line separated paragraphs and "- " bullet lists. */
export function Md({ text }: { text: string }) {
  const lines = text.split('\n');
  const blocks: ReactNode[] = [];
  let para: string[] = [], list: string[] = [];
  const flush = () => {
    if (para.length) { blocks.push(<p key={blocks.length}>{inline(para.join(' '), 'p' + blocks.length)}</p>); para = []; }
    if (list.length) { blocks.push(<ul className="dots" key={blocks.length}>{list.map((l, i) => <li key={i}>{inline(l, 'l' + i)}</li>)}</ul>); list = []; }
  };
  for (const raw of lines) {
    const l = raw.trim();
    if (!l) { flush(); continue; }
    if (l.startsWith('- ')) { if (para.length) { const p = para; para = []; blocks.push(<p key={blocks.length}>{inline(p.join(' '))}</p>); } list.push(l.slice(2)); }
    else { if (list.length) flush(); para.push(l); }
  }
  flush();
  return <Fragment>{blocks}</Fragment>;
}
