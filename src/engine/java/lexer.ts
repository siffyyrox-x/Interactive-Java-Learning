/**
 * Lexer for the CSE110 Java subset.
 * Produces a flat token list with 1-based line/column positions.
 */

export type TokKind = 'ident' | 'keyword' | 'int' | 'long' | 'double' | 'float' | 'char' | 'string' | 'op' | 'eof';

export interface Token {
  kind: TokKind;
  text: string;
  /** Decoded value for literals. */
  value?: number | bigint | string;
  line: number;
  col: number;
}

export class CompileError extends Error {
  line: number;
  col: number;
  constructor(message: string, line: number, col = 1) {
    super(message);
    this.line = line;
    this.col = col;
  }
}

const KEYWORDS = new Set([
  'abstract', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'continue', 'default', 'do',
  'double', 'else', 'extends', 'final', 'finally', 'float', 'for', 'if', 'implements', 'import', 'instanceof',
  'int', 'interface', 'long', 'new', 'null', 'package', 'private', 'protected', 'public', 'return', 'short',
  'static', 'super', 'switch', 'this', 'throw', 'throws', 'try', 'void', 'while', 'true', 'false', 'var',
]);

// Longest operators first so that maximal munch works with a simple scan.
const OPS = [
  '>>>=', '<<=', '>>=', '>>>', '...', '->', '::', '++', '--', '&&', '||', '==', '!=', '<=', '>=', '+=', '-=', '*=', '/=',
  '%=', '&=', '|=', '^=', '<<', '>>', '+', '-', '*', '/', '%', '=', '<', '>', '!', '~', '?', ':', ';', ',', '.', '(', ')',
  '[', ']', '{', '}', '&', '|', '^', '@',
];

function decodeEscape(src: string, i: number, line: number, col: number): [string, number] {
  // src[i] is the character after the backslash
  const c = src[i];
  switch (c) {
    case 'n': return ['\n', i + 1];
    case 't': return ['\t', i + 1];
    case 'r': return ['\r', i + 1];
    case 'b': return ['\b', i + 1];
    case 'f': return ['\f', i + 1];
    case 's': return [' ', i + 1];
    case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7': {
      let j = i; let v = 0; let n = 0;
      while (j < src.length && n < 3 && src[j] >= '0' && src[j] <= '7') { v = v * 8 + (src.charCodeAt(j) - 48); j++; n++; }
      return [String.fromCharCode(v), j];
    }
    case '\\': return ['\\', i + 1];
    case '\'': return ['\'', i + 1];
    case '"': return ['"', i + 1];
    case 'u': {
      let j = i; while (src[j] === 'u') j++;
      const hex = src.slice(j, j + 4);
      if (!/^[0-9a-fA-F]{4}$/.test(hex)) throw new CompileError('illegal unicode escape', line, col);
      return [String.fromCharCode(parseInt(hex, 16)), j + 4];
    }
    default:
      throw new CompileError(`illegal escape character in literal: \\${c ?? ''}`, line, col);
  }
}

export function lex(src: string): Token[] {
  const toks: Token[] = [];
  let i = 0, line = 1, col = 1;
  const n = src.length;
  const adv = (k = 1) => {
    for (let t = 0; t < k; t++) {
      if (src[i] === '\n') { line++; col = 1; } else { col++; }
      i++;
    }
  };

  while (i < n) {
    const c = src[i];
    // whitespace
    if (c === ' ' || c === '\t' || c === '\r' || c === '\n' || c === '\f') { adv(); continue; }
    // comments
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') adv(); continue; }
    if (c === '/' && src[i + 1] === '*') {
      const sl = line, sc = col;
      adv(2);
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) adv();
      if (i >= n) throw new CompileError('unclosed comment', sl, sc);
      adv(2); continue;
    }
    const sl = line, sc = col;
    // identifiers / keywords
    if (/[A-Za-z_$]/.test(c)) {
      let j = i; while (j < n && /[A-Za-z0-9_$]/.test(src[j])) j++;
      const text = src.slice(i, j);
      adv(j - i);
      toks.push({ kind: KEYWORDS.has(text) ? 'keyword' : 'ident', text, line: sl, col: sc });
      continue;
    }
    // numbers
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] ?? ''))) {
      let j = i;
      let text: string;
      if (c === '0' && (src[i + 1] === 'x' || src[i + 1] === 'X')) {
        j += 2; while (j < n && /[0-9a-fA-F_]/.test(src[j])) j++;
        let isLong = false;
        if (src[j] === 'L' || src[j] === 'l') { isLong = true; j++; }
        text = src.slice(i, j);
        const digits = text.replace(/[_lL]/g, '').slice(2);
        adv(j - i);
        if (isLong) toks.push({ kind: 'long', text, value: BigInt.asIntN(64, BigInt('0x' + digits)), line: sl, col: sc });
        else {
          const v = BigInt('0x' + digits);
          if (v > 0xffffffffn) throw new CompileError('integer number too large', sl, sc);
          toks.push({ kind: 'int', text, value: Number(BigInt.asIntN(32, v)), line: sl, col: sc });
        }
        continue;
      }
      if (c === '0' && (src[i + 1] === 'b' || src[i + 1] === 'B')) {
        j += 2; while (j < n && /[01_]/.test(src[j])) j++;
        let isLong = false;
        if (src[j] === 'L' || src[j] === 'l') { isLong = true; j++; }
        text = src.slice(i, j);
        const digits = text.replace(/[_lL]/g, '').slice(2);
        adv(j - i);
        const v = BigInt('0b' + digits);
        if (isLong) toks.push({ kind: 'long', text, value: BigInt.asIntN(64, v), line: sl, col: sc });
        else toks.push({ kind: 'int', text, value: Number(BigInt.asIntN(32, v)), line: sl, col: sc });
        continue;
      }
      while (j < n && /[0-9_]/.test(src[j])) j++;
      let isFloat = false;
      if (src[j] === '.' && /[0-9]/.test(src[j + 1] ?? '')) { isFloat = true; j++; while (j < n && /[0-9_]/.test(src[j])) j++; }
      else if (src[j] === '.' && !/[A-Za-z_]/.test(src[j + 1] ?? '')) { isFloat = true; j++; }
      if (src[j] === 'e' || src[j] === 'E') {
        let k = j + 1; if (src[k] === '+' || src[k] === '-') k++;
        if (/[0-9]/.test(src[k] ?? '')) { isFloat = true; j = k; while (j < n && /[0-9_]/.test(src[j])) j++; }
      }
      let suffix = '';
      if (/[fFdDlL]/.test(src[j] ?? '')) { suffix = src[j].toLowerCase(); j++; }
      text = src.slice(i, j);
      const clean = text.replace(/_/g, '').replace(/[fFdDlL]$/, '');
      adv(j - i);
      if (suffix === 'l') {
        if (isFloat) throw new CompileError("';' expected", sl, sc);
        toks.push({ kind: 'long', text, value: BigInt.asIntN(64, BigInt(clean)), line: sl, col: sc });
      } else if (suffix === 'f') {
        toks.push({ kind: 'float', text, value: Math.fround(parseFloat(clean)), line: sl, col: sc });
      } else if (suffix === 'd' || isFloat) {
        toks.push({ kind: 'double', text, value: parseFloat(clean), line: sl, col: sc });
      } else {
        // octal literal like 017
        let v: bigint;
        if (clean.length > 1 && clean[0] === '0') v = BigInt('0o' + clean.slice(1));
        else v = BigInt(clean);
        if (v > 2147483648n) throw new CompileError('integer number too large: ' + clean, sl, sc);
        // 2147483648 is only legal after unary minus; the parser checks that.
        toks.push({ kind: 'int', text, value: v === 2147483648n ? 2147483648 : Number(v), line: sl, col: sc });
      }
      continue;
    }
    // char literal
    if (c === '\'') {
      adv();
      let val: string;
      if (src[i] === '\\') {
        const [s, ni] = decodeEscape(src, i + 1, sl, sc);
        adv(ni - i); val = s;
      } else if (src[i] === '\'' || src[i] === '\n' || i >= n) {
        throw new CompileError('empty character literal', sl, sc);
      } else { val = src[i]; adv(); }
      if (src[i] !== '\'') throw new CompileError('unclosed character literal', sl, sc);
      adv();
      toks.push({ kind: 'char', text: src.slice(0, 0) + `'${val}'`, value: val, line: sl, col: sc });
      continue;
    }
    // string literal
    if (c === '"') {
      if (src.startsWith('"""', i)) throw new CompileError('text blocks are not supported here', sl, sc);
      adv();
      let val = '';
      while (i < n && src[i] !== '"') {
        if (src[i] === '\n') throw new CompileError('unclosed string literal', sl, sc);
        if (src[i] === '\\') { const [s, ni] = decodeEscape(src, i + 1, line, col); adv(ni - i); val += s; }
        else { val += src[i]; adv(); }
      }
      if (i >= n) throw new CompileError('unclosed string literal', sl, sc);
      adv();
      toks.push({ kind: 'string', text: JSON.stringify(val), value: val, line: sl, col: sc });
      continue;
    }
    // operators
    let matched = '';
    for (const op of OPS) { if (src.startsWith(op, i)) { matched = op; break; } }
    if (!matched) {
      const hint = c === '“' || c === '”' || c === '‘' || c === '’'
        ? ` (this is a "smart" quote — use a plain ${c === '‘' || c === '’' ? "'" : '"'} instead)` : '';
      throw new CompileError(`illegal character: '${c}'${hint}`, sl, sc);
    }
    adv(matched.length);
    toks.push({ kind: 'op', text: matched, line: sl, col: sc });
  }
  toks.push({ kind: 'eof', text: '<end of file>', line, col });
  return toks;
}
