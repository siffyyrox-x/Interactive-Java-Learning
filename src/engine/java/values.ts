import type { JType } from './ast';
import { typeName } from './ast';

/** A Java String object. Literals are interned so == behaves like the JVM's string pool. */
export class JStr {
  readonly v: string;
  readonly id: number;
  private static nextId = 1;
  private static pool = new Map<string, JStr>();
  constructor(v: string) { this.v = v; this.id = JStr.nextId++; }
  static intern(v: string): JStr {
    let s = JStr.pool.get(v);
    if (!s) { s = new JStr(v); JStr.pool.set(v, s); }
    return s;
  }
  static resetPool() { JStr.pool.clear(); JStr.nextId = 1; }
}

export class JArray {
  readonly id: number;
  readonly elemType: JType;
  data: unknown[];
  private static nextId = 1;
  constructor(elemType: JType, data: unknown[]) { this.id = JArray.nextId++; this.elemType = elemType; this.data = data; }
  static resetIds() { JArray.nextId = 1; }
}

export class JStringBuilder {
  s = '';
  readonly id: number;
  private static nextId = 1;
  constructor(s = '') { this.s = s; this.id = JStringBuilder.nextId++; }
}

export type JValue = number | bigint | boolean | JStr | JArray | JStringBuilder | null | object;

export function defaultValue(t: JType): JValue {
  if (t.k === 'prim') {
    if (t.n === 'boolean') return false;
    if (t.n === 'long') return 0n;
    return 0;
  }
  return null;
}

// ------------------------------------------------------------------ numbers
/** Split a finite positive number's shortest round-trip decimal representation into digits and exponent. */
function shortestDigits(x: number, forFloat: boolean): { digits: string; exp: number } {
  // exp is the power of ten of the first digit: value = 0.d1d2d3... × 10^(exp+1)  →  d1.d2d3 × 10^exp
  let repr: string;
  if (forFloat) {
    repr = '';
    for (let p = 1; p <= 9; p++) {
      const s = x.toPrecision(p);
      if (Math.fround(parseFloat(s)) === x) { repr = s; break; }
    }
    if (!repr) repr = x.toPrecision(9);
    repr = parseFloat(repr).toExponential();
  } else {
    repr = x.toExponential(); // shortest round-trip digits
  }
  const m = /^(\d)(?:\.(\d+))?e([+-]\d+)$/.exec(repr)!;
  let digits = m[1] + (m[2] ?? '');
  digits = digits.replace(/0+$/, '') || '0';
  return { digits, exp: parseInt(m[3], 10) };
}

/** Java's Double.toString / Float.toString. */
export function javaFloatingToString(x: number, isFloat = false): string {
  if (Number.isNaN(x)) return 'NaN';
  if (x === Infinity) return 'Infinity';
  if (x === -Infinity) return '-Infinity';
  if (x === 0) return Object.is(x, -0) ? '-0.0' : '0.0';
  const neg = x < 0; const a = Math.abs(x);
  const { digits, exp } = shortestDigits(a, isFloat);
  let out: string;
  if (a >= 1e-3 && a < 1e7) {
    if (exp >= 0) {
      const intPart = digits.slice(0, exp + 1).padEnd(exp + 1, '0');
      const frac = digits.slice(exp + 1);
      out = intPart + '.' + (frac || '0');
    } else {
      out = '0.' + '0'.repeat(-exp - 1) + digits;
    }
  } else {
    out = digits[0] + '.' + (digits.slice(1) || '0') + 'E' + exp;
  }
  return (neg ? '-' : '') + out;
}

export function toInt32(x: number): number { return x | 0; }

/** Java's (int) cast from double: truncate toward zero, saturate, NaN → 0. */
export function d2i(x: number): number {
  if (Number.isNaN(x)) return 0;
  if (x >= 2147483647) return 2147483647;
  if (x <= -2147483648) return -2147483648;
  return Math.trunc(x);
}
export function d2l(x: number): bigint {
  if (Number.isNaN(x)) return 0n;
  if (x >= 9.223372036854776e18) return 9223372036854775807n;
  if (x <= -9.223372036854776e18) return -9223372036854775808n;
  return BigInt(Math.trunc(x));
}

// ------------------------------------------------------------------ string conversion
export function charStr(code: number): string { return String.fromCharCode(code); }

/** Convert a runtime value to its Java string form, given its static type. */
export function jToString(v: JValue, t: JType): string {
  if (v === null) return 'null';
  if (t.k === 'prim') {
    switch (t.n) {
      case 'boolean': return v ? 'true' : 'false';
      case 'char': return charStr(v as number);
      case 'double': return javaFloatingToString(v as number, false);
      case 'float': return javaFloatingToString(v as number, true);
      case 'long': return (v as bigint).toString();
      default: return String(v);
    }
  }
  if (v instanceof JStr) return v.v;
  if (v instanceof JStringBuilder) return v.s;
  if (v instanceof JArray) return arrayIdentity(v);
  if (t.k === 'obj') return `java.util.${t.n}@${(0x1b6d3586).toString(16)}`;
  return String(v);
}

const ARR_CODE: Record<string, string> = { int: 'I', double: 'D', char: 'C', boolean: 'Z', long: 'J', float: 'F', byte: 'B', short: 'S' };
export function arrayIdentity(a: JArray): string {
  const code = (t: JType): string => t.k === 'prim' ? ARR_CODE[t.n] : t.k === 'array' ? '[' + code(t.of) : 'Ljava.lang.String;';
  const hash = ((a.id * 2654435761) >>> 0).toString(16);
  return '[' + code(a.elemType) + '@' + hash;
}

/** Short display form for the variables panel. */
export function displayValue(v: JValue, t: JType): string {
  if (v === null) return 'null';
  if (t.k === 'prim' && t.n === 'char') return `'${charStr(v as number)}'`;
  if (t.k === 'String' && v instanceof JStr) return JSON.stringify(v.v);
  if (v instanceof JArray) return `→ ${typeName(t)} #${v.id}`;
  if (v instanceof JStringBuilder) return JSON.stringify(v.s);
  if (t.k === 'obj') return t.n;
  return jToString(v, t);
}

// ------------------------------------------------------------------ formatting (printf / String.format)
/** Round a non-negative decimal digit string HALF_UP to `prec` fraction digits (Java Formatter behaviour). */
function roundHalfUpDecimal(a: number, prec: number): string {
  if (a === 0) return prec > 0 ? '0.' + '0'.repeat(prec) : '0';
  const { digits, exp } = shortestDigits(a, false);
  // Build integer string of digits scaled to have `prec` fraction digits.
  // value = 0.digits × 10^(exp+1)
  const pointPos = exp + 1; // number of digits before the decimal point
  let intDigits: string; let fracDigits: string;
  if (pointPos <= 0) { intDigits = '0'; fracDigits = '0'.repeat(-pointPos) + digits; }
  else if (pointPos >= digits.length) { intDigits = digits + '0'.repeat(pointPos - digits.length); fracDigits = ''; }
  else { intDigits = digits.slice(0, pointPos); fracDigits = digits.slice(pointPos); }
  const keep = fracDigits.slice(0, prec).padEnd(prec, '0');
  const roundUp = fracDigits.length > prec && fracDigits.charCodeAt(prec) >= 53; // '5'
  let num = BigInt(intDigits + keep);
  if (roundUp) num += 1n;
  let s = num.toString().padStart(prec + 1, '0');
  if (prec === 0) return s;
  return s.slice(0, s.length - prec) + '.' + s.slice(s.length - prec);
}

function groupThousands(intPart: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export interface FormatArg { v: JValue; t: JType }

export class FormatError extends Error {
  javaName: string;
  constructor(javaName: string, msg: string) { super(msg); this.javaName = javaName; }
}

export function javaFormat(fmt: string, args: FormatArg[]): string {
  let out = '';
  let ai = 0;
  const re = /%(\d+\$)?([-#+ 0,(]*)(\d+)?(\.\d+)?([a-zA-Z%])/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(fmt))) {
    out += fmt.slice(last, m.index);
    last = re.lastIndex;
    const [, , flags = '', widthS, precS, conv] = m;
    if (conv === 'n') { out += '\n'; continue; }
    if (conv === '%') { out += '%'; continue; }
    if (ai >= args.length) throw new FormatError('java.util.MissingFormatArgumentException', `Format specifier '${m[0]}'`);
    const arg = args[ai++];
    const width = widthS ? parseInt(widthS, 10) : 0;
    const prec = precS ? parseInt(precS.slice(1), 10) : -1;
    let s: string;
    const t = arg.t; const v = arg.v;
    const isIntType = t.k === 'prim' && (t.n === 'int' || t.n === 'long' || t.n === 'short' || t.n === 'byte');
    const isFloatType = t.k === 'prim' && (t.n === 'double' || t.n === 'float');
    switch (conv) {
      case 'd': {
        if (!isIntType) throw new FormatError('java.util.IllegalFormatConversionException', `d != ${javaBoxName(t)}`);
        let n = typeof v === 'bigint' ? v : BigInt(v as number);
        const neg = n < 0n; if (neg) n = -n;
        let body = n.toString();
        if (flags.includes(',')) body = groupThousands(body);
        s = (neg ? '-' : flags.includes('+') ? '+' : flags.includes(' ') ? ' ' : '') + body;
        if (flags.includes('0') && width > s.length) {
          const sign = /^[+\- ]/.test(s) ? s[0] : '';
          s = sign + body.padStart(width - sign.length, '0');
        }
        break;
      }
      case 'f': case 'e': case 'E': {
        if (!isFloatType) throw new FormatError('java.util.IllegalFormatConversionException', `${conv} != ${javaBoxName(t)}`);
        const x = v as number;
        const p = prec < 0 ? 6 : prec;
        if (Number.isNaN(x)) s = 'NaN';
        else if (!Number.isFinite(x)) s = x > 0 ? (flags.includes('+') ? '+Infinity' : 'Infinity') : '-Infinity';
        else if (conv === 'f') {
          const neg = x < 0 || Object.is(x, -0);
          let body = roundHalfUpDecimal(Math.abs(x), p);
          if (flags.includes(',')) { const [ip, fp] = body.split('.'); body = groupThousands(ip) + (fp !== undefined ? '.' + fp : ''); }
          s = (neg ? '-' : flags.includes('+') ? '+' : '') + body;
          if (flags.includes('0') && width > s.length) {
            const sign = /^[+-]/.test(s) ? s[0] : '';
            s = sign + body.padStart(width - sign.length, '0');
          }
        } else {
          const ex = Math.abs(x).toExponential(p);
          const mm = /^([\d.]+)e([+-])(\d+)$/.exec(ex)!;
          s = (x < 0 ? '-' : '') + mm[1] + 'e' + mm[2] + mm[3].padStart(2, '0');
          if (conv === 'E') s = s.toUpperCase();
        }
        break;
      }
      case 's': case 'S': {
        s = jToString(v, t);
        if (prec >= 0) s = s.slice(0, prec);
        if (conv === 'S') s = s.toUpperCase();
        break;
      }
      case 'c': {
        if (!(t.k === 'prim' && (t.n === 'char' || t.n === 'int'))) throw new FormatError('java.util.IllegalFormatConversionException', `c != ${javaBoxName(t)}`);
        s = charStr(v as number);
        break;
      }
      case 'b': case 'B': s = v === null ? 'false' : (t.k === 'prim' && t.n === 'boolean') ? String(v) : 'true'; if (conv === 'B') s = s.toUpperCase(); break;
      case 'x': case 'X': {
        if (!isIntType) throw new FormatError('java.util.IllegalFormatConversionException', `x != ${javaBoxName(t)}`);
        s = typeof v === 'bigint' ? BigInt.asUintN(64, v).toString(16) : ((v as number) >>> 0).toString(16);
        if (conv === 'X') s = s.toUpperCase();
        break;
      }
      default:
        throw new FormatError('java.util.UnknownFormatConversionException', `Conversion = '${conv}'`);
    }
    if (width > s.length) s = flags.includes('-') ? s.padEnd(width) : s.padStart(width);
    out += s;
  }
  out += fmt.slice(last);
  return out;
}

function javaBoxName(t: JType): string {
  if (t.k === 'prim') return { int: 'java.lang.Integer', long: 'java.lang.Long', double: 'java.lang.Double', float: 'java.lang.Float', char: 'java.lang.Character', boolean: 'java.lang.Boolean', byte: 'java.lang.Byte', short: 'java.lang.Short' }[t.n];
  if (t.k === 'String') return 'java.lang.String';
  return typeName(t);
}
