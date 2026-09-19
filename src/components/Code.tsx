import { tokenizeJava } from '../lib/highlight';

export function JavaLine({ text }: { text: string }) {
  return <>{tokenizeJava(text).map((t, i) =>
    t.t === 'kw' ? <b key={i}>{t.s}</b> : t.t === 'com' ? <i key={i}>{t.s}</i> : t.t === 'str' ? <span key={i} className="s">{t.s}</span> : t.t === 'num' ? <span key={i} className="n">{t.s}</span> : <span key={i}>{t.s}</span>)}</>;
}

/** Static, syntax-highlighted Java block in the spec's pre.code style. */
export function Code({ code, numbers = false, hl = [] }: { code: string; numbers?: boolean; hl?: number[] }) {
  const lines = code.replace(/\n$/, '').split('\n');
  return (
    <pre className="code">{lines.map((l, i) => {
      const inner = <>{numbers && <span className="ln">{i + 1}</span>}<JavaLine text={l} /></>;
      return <span key={i}>{hl.includes(i + 1) ? <span className="hlline">{inner}</span> : inner}{i < lines.length - 1 ? '\n' : ''}</span>;
    })}</pre>
  );
}
