/** A small, safe Java highlighter producing React-friendly tokens (no innerHTML). */
export type Tok = { t: 'kw' | 'str' | 'num' | 'com' | 'txt'; s: string };

const KW = new Set(['public', 'private', 'protected', 'static', 'final', 'class', 'void', 'int', 'long', 'double', 'float', 'char', 'boolean', 'byte', 'short', 'String', 'if', 'else', 'while', 'do', 'for', 'switch', 'case', 'default', 'break', 'continue', 'return', 'new', 'true', 'false', 'null', 'import', 'Scanner', 'Math', 'System', 'Arrays', 'Integer', 'Double', 'Character', 'Random', 'StringBuilder']);

export function tokenizeJava(line: string): Tok[] {
  const out: Tok[] = [];
  const re = /(\/\/.*$)|("(?:[^"\\]|\\.)*"?)|('(?:[^'\\]|\\.)*'?)|(\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?[fFdDlL]?\b)|([A-Za-z_$][\w$]*)|(\s+)|(.)/g;
  let m: RegExpExecArray | null;
  const push = (t: Tok['t'], s: string) => { const last = out[out.length - 1]; if (last && last.t === t) last.s += s; else out.push({ t, s }); };
  while ((m = re.exec(line))) {
    if (m[1]) push('com', m[1]);
    else if (m[2] || m[3]) push('str', m[2] ?? m[3]);
    else if (m[4]) push('num', m[4]);
    else if (m[5]) push(KW.has(m[5]) ? 'kw' : 'txt', m[5]);
    else push('txt', m[0]);
  }
  return out;
}
