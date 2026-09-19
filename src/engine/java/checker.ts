import { CompileError } from './lexer';
import type { Expr, JType, MethodDecl, Program, Stmt, TypeNode, PrimName } from './ast';
import { T, arr, typeName, sameType, isNumeric, isIntegral, isBool } from './ast';
import { javaFloatingToString } from './values';

const WIDEN: Record<string, string[]> = {
  byte: ['short', 'int', 'long', 'float', 'double'],
  short: ['int', 'long', 'float', 'double'],
  char: ['int', 'long', 'float', 'double'],
  int: ['long', 'float', 'double'],
  long: ['float', 'double'],
  float: ['double'],
  double: [],
  boolean: [],
};

export function resolveTypeNode(tn: TypeNode, extraDims = 0): JType {
  let base: JType;
  switch (tn.base) {
    case 'byte': case 'short': case 'int': case 'long': case 'float': case 'double': case 'char': case 'boolean':
      base = { k: 'prim', n: tn.base as PrimName }; break;
    case 'void': base = T.void; break;
    case 'String': base = T.String; break;
    case 'Scanner': base = T.Scanner; break;
    case 'Random': base = T.Random; break;
    case 'StringBuilder': base = T.StringBuilder; break;
    case 'Object': base = { k: 'obj', n: 'Object' }; break;
    default: throw new CompileError(`cannot find symbol: class ${tn.base}`, tn.line, tn.col);
  }
  let t = base;
  for (let i = 0; i < tn.dims + extraDims; i++) t = arr(t);
  if (base.k === 'void' && tn.dims + extraDims > 0) throw new CompileError("'void' type not allowed here", tn.line, tn.col);
  return t;
}

export function binaryPromote(a: JType, b: JType): JType {
  const an = (a as { n: string }).n, bn = (b as { n: string }).n;
  if (an === 'double' || bn === 'double') return T.double;
  if (an === 'float' || bn === 'float') return T.float;
  if (an === 'long' || bn === 'long') return T.long;
  return T.int;
}
function unaryPromote(a: JType): JType {
  const n = (a as { n: string }).n;
  if (n === 'byte' || n === 'short' || n === 'char') return T.int;
  return a;
}

/** Compile-time constant value of an int/char expression (for narrowing assignments like byte b = 51). */
function constInt(e: Expr): number | null {
  switch (e.kind) {
    case 'lit': if (e.litType.k === 'prim' && (e.litType.n === 'int' || e.litType.n === 'char' || e.litType.n === 'short' || e.litType.n === 'byte')) return e.value as number; return null;
    case 'unary': { const v = constInt(e.e); if (v === null) return null; return e.op === '-' ? -v | 0 : e.op === '+' ? v : e.op === '~' ? ~v : null; }
    case 'cast': { const v = constInt(e.e); return v; }
    case 'bin': {
      const l = constInt(e.l), r = constInt(e.r);
      if (l === null || r === null) return null;
      switch (e.op) {
        case '+': return (l + r) | 0; case '-': return (l - r) | 0; case '*': return Math.imul(l, r);
        case '/': return r === 0 ? null : (l / r) | 0; case '%': return r === 0 ? null : l % r;
        default: return null;
      }
    }
    default: return null;
  }
}

/** Text of a compile-time constant expression used in String concatenation, or null. */
function constText(e: Expr): string | null {
  if (e.kind === 'lit') {
    const t = e.litType;
    if (t.k === 'String') return e.value as string;
    if (t.k === 'null') return null;
    if (t.k === 'prim') {
      if (t.n === 'char') return String.fromCharCode(e.value as number);
      if (t.n === 'boolean') return String(e.value);
      if (t.n === 'double') return javaFloatingToString(e.value as number);
      if (t.n === 'float') return javaFloatingToString(e.value as number, true);
      return String(e.value);
    }
    return null;
  }
  if (e.kind === 'bin') {
    if (e.cstr !== undefined) return e.cstr;
    if (e.ty && e.ty.k === 'prim' && (e.ty.n === 'int')) { const v = constInt(e); return v === null ? null : String(v); }
  }
  return null;
}

export function assignable(from: JType, to: JType, e?: Expr): boolean {
  if (sameType(from, to)) return true;
  if (from.k === 'null') return to.k !== 'prim';
  if (from.k === 'prim' && to.k === 'prim') {
    if (WIDEN[from.n].includes(to.n)) return true;
    // constant narrowing: int constant expression fitting into byte/short/char
    if (e && (to.n === 'byte' || to.n === 'short' || to.n === 'char') && (from.n === 'int' || from.n === 'char' || from.n === 'short' || from.n === 'byte')) {
      const c = constInt(e);
      if (c === null) return false;
      if (to.n === 'byte') return c >= -128 && c <= 127;
      if (to.n === 'short') return c >= -32768 && c <= 32767;
      return c >= 0 && c <= 65535;
    }
    return false;
  }
  if (to.k === 'obj' && to.n === 'Object') return from.k !== 'prim' && from.k !== 'void';
  return false;
}

const an = (w: string) => (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w;

function convertMsg(from: JType, to: JType): string {
  if (from.k === 'prim' && to.k === 'prim' && isNumeric(from) && isNumeric(to)) return `incompatible types: possible lossy conversion from ${typeName(from)} to ${typeName(to)}`;
  return `incompatible types: ${typeName(from)} cannot be converted to ${typeName(to)}`;
}

// ------------------------------------------------------------------ builtin signatures
type Sig = { params: (JType | 'any' | 'num' | 'arr' | 'str|char' | 'prim|str')[]; ret: JType | ((args: JType[]) => JType); varargs?: boolean };
const num = 'num' as const; const any = 'any' as const;
const same = (i: number) => (a: JType[]) => unaryPromote(a[i]);
const promo = (a: JType[]) => binaryPromote(a[0], a[1]);

export const STATIC_METHODS: Record<string, Sig[]> = {
  'Math.abs': [{ params: [num], ret: same(0) }],
  'Math.max': [{ params: [num, num], ret: promo }],
  'Math.min': [{ params: [num, num], ret: promo }],
  'Math.pow': [{ params: [T.double, T.double], ret: T.double }],
  'Math.sqrt': [{ params: [T.double], ret: T.double }],
  'Math.cbrt': [{ params: [T.double], ret: T.double }],
  'Math.floor': [{ params: [T.double], ret: T.double }],
  'Math.ceil': [{ params: [T.double], ret: T.double }],
  'Math.round': [{ params: [num], ret: (a) => ((a[0] as { n: string }).n === 'float' ? T.int : T.long) }],
  'Math.random': [{ params: [], ret: T.double }],
  'Math.hypot': [{ params: [T.double, T.double], ret: T.double }],
  'Math.exp': [{ params: [T.double], ret: T.double }],
  'Math.log': [{ params: [T.double], ret: T.double }],
  'Math.log10': [{ params: [T.double], ret: T.double }],
  'Math.sin': [{ params: [T.double], ret: T.double }],
  'Math.cos': [{ params: [T.double], ret: T.double }],
  'Math.tan': [{ params: [T.double], ret: T.double }],
  'Math.toRadians': [{ params: [T.double], ret: T.double }],
  'Math.toDegrees': [{ params: [T.double], ret: T.double }],
  'Math.signum': [{ params: [T.double], ret: T.double }],
  'Math.floorDiv': [{ params: [T.int, T.int], ret: T.int }],
  'Math.floorMod': [{ params: [T.int, T.int], ret: T.int }],
  'Integer.parseInt': [{ params: [T.String], ret: T.int }],
  'Integer.valueOf': [{ params: [T.String], ret: T.int }, { params: [T.int], ret: T.int }],
  'Integer.toString': [{ params: [T.int], ret: T.String }],
  'Integer.toBinaryString': [{ params: [T.int], ret: T.String }],
  'Integer.max': [{ params: [T.int, T.int], ret: T.int }],
  'Integer.min': [{ params: [T.int, T.int], ret: T.int }],
  'Long.parseLong': [{ params: [T.String], ret: T.long }],
  'Double.parseDouble': [{ params: [T.String], ret: T.double }],
  'Double.valueOf': [{ params: [T.String], ret: T.double }],
  'Double.toString': [{ params: [T.double], ret: T.String }],
  'String.valueOf': [{ params: [any], ret: T.String }],
  'String.format': [{ params: [T.String], ret: T.String, varargs: true }],
  'Character.isDigit': [{ params: [T.char], ret: T.boolean }],
  'Character.isLetter': [{ params: [T.char], ret: T.boolean }],
  'Character.isLetterOrDigit': [{ params: [T.char], ret: T.boolean }],
  'Character.isAlphabetic': [{ params: [T.int], ret: T.boolean }],
  'Character.isUpperCase': [{ params: [T.char], ret: T.boolean }],
  'Character.isLowerCase': [{ params: [T.char], ret: T.boolean }],
  'Character.isWhitespace': [{ params: [T.char], ret: T.boolean }],
  'Character.toUpperCase': [{ params: [T.char], ret: T.char }],
  'Character.toLowerCase': [{ params: [T.char], ret: T.char }],
  'Character.getNumericValue': [{ params: [T.char], ret: T.int }],
  'Character.toString': [{ params: [T.char], ret: T.String }],
  'Arrays.toString': [{ params: ['arr'], ret: T.String }],
  'Arrays.deepToString': [{ params: ['arr'], ret: T.String }],
  'Arrays.sort': [{ params: ['arr'], ret: T.void }],
  'Arrays.fill': [{ params: ['arr', any], ret: T.void }],
  'Arrays.copyOf': [{ params: ['arr', T.int], ret: (a) => a[0] }],
  'Arrays.equals': [{ params: ['arr', 'arr'], ret: T.boolean }],
  'System.exit': [{ params: [T.int], ret: T.void }],
  'System.currentTimeMillis': [{ params: [], ret: T.long }],
};

export const STATIC_FIELDS: Record<string, JType> = {
  'Math.PI': T.double, 'Math.E': T.double,
  'Integer.MAX_VALUE': T.int, 'Integer.MIN_VALUE': T.int,
  'Long.MAX_VALUE': T.long, 'Long.MIN_VALUE': T.long,
  'Double.MAX_VALUE': T.double, 'Double.MIN_VALUE': T.double,
  'System.out': { k: 'obj', n: 'PrintStream' }, 'System.in': { k: 'obj', n: 'InputStream' },
};
const STATIC_CLASSES = new Set(['Math', 'Integer', 'Long', 'Double', 'String', 'Character', 'Arrays', 'System', 'Float', 'Boolean']);

const INSTANCE_METHODS: Record<string, Record<string, Sig[]>> = {
  String: {
    length: [{ params: [], ret: T.int }],
    charAt: [{ params: [T.int], ret: T.char }],
    substring: [{ params: [T.int], ret: T.String }, { params: [T.int, T.int], ret: T.String }],
    indexOf: [{ params: ['str|char'], ret: T.int }, { params: ['str|char', T.int], ret: T.int }],
    lastIndexOf: [{ params: ['str|char'], ret: T.int }, { params: ['str|char', T.int], ret: T.int }],
    equals: [{ params: [any], ret: T.boolean }],
    equalsIgnoreCase: [{ params: [T.String], ret: T.boolean }],
    compareTo: [{ params: [T.String], ret: T.int }],
    compareToIgnoreCase: [{ params: [T.String], ret: T.int }],
    toUpperCase: [{ params: [], ret: T.String }],
    toLowerCase: [{ params: [], ret: T.String }],
    trim: [{ params: [], ret: T.String }],
    strip: [{ params: [], ret: T.String }],
    isEmpty: [{ params: [], ret: T.boolean }],
    isBlank: [{ params: [], ret: T.boolean }],
    contains: [{ params: [T.String], ret: T.boolean }],
    startsWith: [{ params: [T.String], ret: T.boolean }],
    endsWith: [{ params: [T.String], ret: T.boolean }],
    replace: [{ params: ['str|char', 'str|char'], ret: T.String }],
    replaceAll: [{ params: [T.String, T.String], ret: T.String }],
    concat: [{ params: [T.String], ret: T.String }],
    repeat: [{ params: [T.int], ret: T.String }],
    split: [{ params: [T.String], ret: arr(T.String) }],
    toCharArray: [{ params: [], ret: arr(T.char) }],
    matches: [{ params: [T.String], ret: T.boolean }],
  },
  Scanner: {
    nextInt: [{ params: [], ret: T.int }], nextDouble: [{ params: [], ret: T.double }], nextLong: [{ params: [], ret: T.long }],
    nextFloat: [{ params: [], ret: T.float }], nextBoolean: [{ params: [], ret: T.boolean }], next: [{ params: [], ret: T.String }],
    nextLine: [{ params: [], ret: T.String }], hasNext: [{ params: [], ret: T.boolean }], hasNextInt: [{ params: [], ret: T.boolean }],
    hasNextLine: [{ params: [], ret: T.boolean }], hasNextDouble: [{ params: [], ret: T.boolean }], close: [{ params: [], ret: T.void }],
  },
  Random: {
    nextInt: [{ params: [], ret: T.int }, { params: [T.int], ret: T.int }], nextDouble: [{ params: [], ret: T.double }], nextBoolean: [{ params: [], ret: T.boolean }],
  },
  StringBuilder: {
    append: [{ params: [any], ret: T.StringBuilder }], toString: [{ params: [], ret: T.String }], length: [{ params: [], ret: T.int }],
    reverse: [{ params: [], ret: T.StringBuilder }], charAt: [{ params: [T.int], ret: T.char }], insert: [{ params: [T.int, any], ret: T.StringBuilder }],
    setCharAt: [{ params: [T.int, T.char], ret: T.void }], deleteCharAt: [{ params: [T.int], ret: T.StringBuilder }],
  },
  PrintStream: {
    println: [{ params: [], ret: T.void }, { params: [any], ret: T.void }],
    print: [{ params: [any], ret: T.void }],
    printf: [{ params: [T.String], ret: T.void, varargs: true }],
    format: [{ params: [T.String], ret: T.void, varargs: true }],
  },
};

function matchParam(p: Sig['params'][number], a: JType, e: Expr): boolean {
  if (p === 'any') return a.k !== 'void';
  if (p === 'num') return isNumeric(a) && !(a.k === 'prim' && a.n === 'char' && false);
  if (p === 'arr') return a.k === 'array';
  if (p === 'str|char') return a.k === 'String' || (a.k === 'prim' && (a.n === 'char'));
  if (p === 'prim|str') return a.k === 'prim' || a.k === 'String';
  return assignable(a, p, e);
}

// ------------------------------------------------------------------ checker
interface VarInfo { ty: JType; isField: boolean; isFinal: boolean }
type Assigned = Set<string> | null; // null = unreachable path

export class Checker {
  private methods = new Map<string, MethodDecl[]>();
  private fields = new Map<string, VarInfo>();
  private scopes: Map<string, VarInfo>[] = [];
  private current!: MethodDecl;
  private loopDepth = 0;
  private switchDepth = 0;
  private prog: Program;

  constructor(prog: Program) { this.prog = prog; }

  check(): void {
    const p = this.prog;
    for (const f of p.fields) {
      const d = f.decl;
      for (const dc of d.decls) {
        const ty = resolveTypeNode(d.type, dc.dims);
        dc.ty = ty;
        if (this.fields.has(dc.name)) throw new CompileError(`variable ${dc.name} is already defined in class ${p.className}`, dc.line, dc.col);
        if (dc.init) {
          this.scopes = [new Map()];
          this.current = { name: '<clinit>', params: [], ret: d.type, body: { kind: 'block', body: [], line: 0, col: 0 }, line: 0, endLine: 0, isStatic: true };
          const it = dc.init.kind === 'arrinit' ? this.checkArrayInit(dc.init, ty) : this.expr(dc.init, new Set());
          if (!assignable(it, ty, dc.init)) throw new CompileError(convertMsg(it, ty), dc.init.line, dc.init.col);
        }
        this.fields.set(dc.name, { ty, isField: true, isFinal: d.isFinal });
      }
      if (!f.isStatic) {
        // instance field used from static context is reported at use sites; keep simple
        for (const dc of d.decls) this.fields.get(dc.name)!.isField = true;
      }
    }
    for (const m of p.methods) {
      m.retTy = resolveTypeNode(m.ret);
      for (const prm of m.params) prm.ty = resolveTypeNode(prm.type);
      m.sig = `${m.name}(${m.params.map(x => typeName(x.ty!)).join(',')})`;
      const list = this.methods.get(m.name) ?? [];
      if (list.some(o => o.sig === m.sig)) throw new CompileError(`method ${m.sig} is already defined in class ${p.className}`, m.line, 1);
      list.push(m);
      this.methods.set(m.name, list);
    }
    const mains = this.methods.get('main') ?? [];
    const main = mains.find(m => m.params.length === 1 && m.params[0].ty && sameType(m.params[0].ty, arr(T.String)));
    if (!main) throw new CompileError('no main method found — add: public static void main(String[] args)', 1, 1);
    if (!main.isStatic) throw new CompileError('main must be static: public static void main(String[] args)', main.line, 1);
    for (const m of p.methods) this.checkMethod(m);
  }

  private checkMethod(m: MethodDecl) {
    this.current = m;
    this.scopes = [new Map()];
    const assigned = new Set<string>();
    for (const prm of m.params) {
      if (this.scopes[0].has(prm.name)) throw new CompileError(`variable ${prm.name} is already defined in method ${m.sig}`, prm.line, 1);
      this.scopes[0].set(prm.name, { ty: prm.ty!, isField: false, isFinal: false });
      assigned.add(prm.name);
    }
    this.loopDepth = 0; this.switchDepth = 0;
    const out = this.block(m.body.body, assigned, false);
    if (out !== null && m.retTy!.k !== 'void') {
      throw new CompileError(`missing return statement — method ${m.name} must return ${an(typeName(m.retTy!))} on every path`, m.body.endLine ?? m.endLine, 1);
    }
  }

  private lookup(name: string): VarInfo | undefined {
    for (let i = this.scopes.length - 1; i >= 0; i--) { const v = this.scopes[i].get(name); if (v) return v; }
    return this.fields.get(name);
  }
  private declareLocal(name: string, ty: JType, line: number, col: number, isFinal = false) {
    for (const s of this.scopes) if (s.has(name)) throw new CompileError(`variable ${name} is already defined in method ${this.current.sig ?? this.current.name}`, line, col);
    this.scopes[this.scopes.length - 1].set(name, { ty, isField: false, isFinal });
  }

  // ------------------------------------------------------------ statements (return set of definitely-assigned vars, or null if cannot complete)
  private block(stmts: Stmt[], inA: Assigned, newScope = true): Assigned {
    if (newScope) this.scopes.push(new Map());
    let a: Assigned = inA;
    for (let i = 0; i < stmts.length; i++) {
      if (a === null) {
        const s = stmts[i];
        if (s.kind !== 'empty') throw new CompileError('unreachable statement — nothing after a return, break or continue in the same block can run', s.line, s.col);
        continue;
      }
      a = this.stmt(stmts[i], a);
    }
    if (newScope) this.scopes.pop();
    return a;
  }

  private cond(e: Expr, a: Set<string>, what: string): JType {
    const t = this.expr(e, a);
    if (!isBool(t)) {
      if (e.kind === 'assign' && e.op === '=') throw new CompileError(`incompatible types: ${typeName(t)} cannot be converted to boolean — did you mean == instead of = ?`, e.line, e.col);
      throw new CompileError(`incompatible types: ${typeName(t)} cannot be converted to boolean (the ${what} condition must be true/false)`, e.line, e.col);
    }
    return t;
  }

  private stmt(s: Stmt, a: Set<string>): Assigned {
    switch (s.kind) {
      case 'empty': return a;
      case 'block': return this.block(s.body, new Set(a));
      case 'vardecl': {
        const out = new Set(a);
        for (const d of s.decls) {
          const ty = resolveTypeNode(s.type, d.dims);
          d.ty = ty;
          if (ty.k === 'void') throw new CompileError("'void' type not allowed here", s.line, s.col);
          if (d.init) {
            const it = d.init.kind === 'arrinit' ? this.checkArrayInit(d.init, ty) : this.expr(d.init, out);
            if (!assignable(it, ty, d.init)) throw new CompileError(convertMsg(it, ty), d.init.line, d.init.col);
            this.declareLocal(d.name, ty, d.line, d.col, s.isFinal);
            out.add(d.name);
          } else {
            this.declareLocal(d.name, ty, d.line, d.col, s.isFinal);
            out.delete(d.name);
          }
        }
        return out;
      }
      case 'expr': {
        const out = new Set(a);
        const t = this.expr(s.e, out);
        void t;
        return out;
      }
      case 'if': {
        const ca = new Set(a);
        const ct = this.cond(s.c, ca, 'if');
        void ct;
        const constTrue = s.c.kind === 'lit' && s.c.value === true;
        this.scopes.push(new Map());
        const t = this.stmt(s.then, new Set(ca));
        this.scopes.pop();
        let e: Assigned = ca;
        if (s.els) { this.scopes.push(new Map()); e = this.stmt(s.els, new Set(ca)); this.scopes.pop(); }
        if (constTrue && !s.els) return t === null ? ca : t;
        return meet(t, e);
      }
      case 'while': {
        const ca = new Set(a);
        this.cond(s.c, ca, 'while');
        this.loopDepth++; this.scopes.push(new Map());
        const bodyOut = this.stmt(s.body, new Set(ca));
        this.scopes.pop(); this.loopDepth--;
        const infinite = s.c.kind === 'lit' && s.c.value === true;
        if (infinite) return hasBreak(s.body) ? union(ca, bodyOut) : null;
        return ca;
      }
      case 'dowhile': {
        this.loopDepth++; this.scopes.push(new Map());
        const bodyOut = this.stmt(s.body, new Set(a));
        this.scopes.pop(); this.loopDepth--;
        const base = bodyOut ?? new Set(a);
        const ca = new Set(base);
        this.cond(s.c, ca, 'do-while');
        const infinite = s.c.kind === 'lit' && s.c.value === true;
        if (infinite) return hasBreak(s.body) ? ca : null;
        if (bodyOut === null && !hasContinue(s.body) && !hasBreak(s.body)) return null;
        return bodyOut === null ? new Set(a) : ca;
      }
      case 'for': {
        this.scopes.push(new Map());
        let ia: Set<string> = new Set(a);
        for (const st of s.init) { const r = this.stmt(st, ia); ia = r ?? ia; }
        if (s.c) this.cond(s.c, ia, 'for');
        this.loopDepth++; this.scopes.push(new Map());
        const bodyOut = this.stmt(s.body, new Set(ia));
        this.scopes.pop(); this.loopDepth--;
        const ua = new Set(bodyOut ?? ia);
        for (const u of s.update) this.expr(u, ua);
        this.scopes.pop();
        const infinite = s.c === null || (s.c.kind === 'lit' && s.c.value === true);
        const outerNames = new Set([...ia].filter(n => this.lookup(n) !== undefined));
        if (infinite) return hasBreak(s.body) ? union(new Set(outerNames), bodyOut) : null;
        return outerNames;
      }
      case 'foreach': {
        const it = this.expr(s.iter, a);
        if (it.k !== 'array') throw new CompileError(`for-each not applicable to expression type ${typeName(it)}`, s.iter.line, s.iter.col);
        const vt = resolveTypeNode(s.varType);
        if (!assignable(it.of, vt)) throw new CompileError(convertMsg(it.of, vt), s.line, s.col);
        s.elemTy = vt;
        this.scopes.push(new Map());
        this.declareLocal(s.name, vt, s.line, s.col);
        this.loopDepth++;
        const ba = new Set(a); ba.add(s.name);
        this.stmt(s.body, ba);
        this.loopDepth--;
        this.scopes.pop();
        return a;
      }
      case 'switch': {
        const ea = new Set(a);
        const et = this.expr(s.e, ea);
        const okType = (et.k === 'prim' && (et.n === 'int' || et.n === 'char' || et.n === 'short' || et.n === 'byte')) || et.k === 'String';
        if (!okType) throw new CompileError(`switch on ${typeName(et)} is not allowed — use int, char or String`, s.e.line, s.e.col);
        const seen = new Set<string>();
        let hasDefault = false;
        this.switchDepth++;
        this.scopes.push(new Map());
        let fall: Assigned = null;
        let allOut: Assigned = null;
        let first = true;
        for (const c of s.cases) {
          if (c.labels === null) { if (hasDefault) throw new CompileError('duplicate default label', c.line, 1); hasDefault = true; }
          else for (const l of c.labels) {
            const lt = this.expr(l, new Set(ea));
            if (l.kind !== 'lit' && constInt(l) === null) throw new CompileError('constant expression required in case label', l.line, l.col);
            if (!assignable(lt, et, l) && !(et.k === 'String' && lt.k === 'String')) throw new CompileError(convertMsg(lt, et), l.line, l.col);
            const key = l.kind === 'lit' ? String(l.value) : String(constInt(l));
            if (seen.has(key)) throw new CompileError('duplicate case label', l.line, l.col);
            seen.add(key);
          }
          const entry = c.arrow || first || fall === null ? new Set(ea) : meetSet(fall, ea);
          first = false;
          const out = this.block(c.body, entry, false);
          if (c.arrow) { allOut = meet(allOut, out); fall = null; }
          else fall = out;
        }
        if (fall !== null) allOut = meet(allOut, fall);
        this.scopes.pop();
        this.switchDepth--;
        const brk = s.cases.some(c => c.body.some(st => hasBreak(st, true) || containsBreakForSwitch(st)));
        if (!hasDefault) return ea;
        if (allOut === null && !brk && !s.cases.some(c => c.arrow)) return null;
        // Lenient definite assignment: a variable counts as assigned after the switch when every
        // case group assigns it somewhere. javac is stricter in rare shapes; the runtime still
        // catches a genuinely uninitialised read, so valid programs are never rejected.
        let common: Set<string> | null = null;
        for (const c of s.cases) {
          const names = new Set<string>(); for (const st of c.body) collectAssigned(st, names);
          const prev: Set<string> | null = common;
          common = prev === null ? names : new Set([...prev].filter((n: string) => names.has(n)));
        }
        return union(ea, common);
      }
      case 'break':
        if (this.loopDepth === 0 && this.switchDepth === 0) throw new CompileError('break outside switch or loop', s.line, s.col);
        return null;
      case 'continue':
        if (this.loopDepth === 0) throw new CompileError('continue outside of loop', s.line, s.col);
        return null;
      case 'return': {
        const rt = this.current.retTy!;
        if (s.e) {
          if (rt.k === 'void') throw new CompileError('incompatible types: unexpected return value — this method is void', s.e.line, s.e.col);
          const t = this.expr(s.e, new Set(a));
          if (!assignable(t, rt, s.e)) throw new CompileError(convertMsg(t, rt), s.e.line, s.e.col);
        } else if (rt.k !== 'void') {
          throw new CompileError(`incompatible types: missing return value — this method must return ${an(typeName(rt))}`, s.line, s.col);
        }
        return null;
      }
    }
  }

  private checkArrayInit(e: Expr, target: JType): JType {
    if (e.kind !== 'arrinit') return this.expr(e, new Set());
    if (target.k !== 'array') throw new CompileError(`illegal initializer for ${typeName(target)}`, e.line, e.col);
    for (const el of e.elems) {
      const t = el.kind === 'arrinit' ? this.checkArrayInit(el, target.of) : this.expr(el, new Set(this.allNames()));
      if (!assignable(t, target.of, el)) throw new CompileError(convertMsg(t, target.of), el.line, el.col);
    }
    e.ty = target;
    return target;
  }
  private allNames(): string[] { const r: string[] = []; for (const s of this.scopes) for (const k of s.keys()) r.push(k); return r; }

  // ------------------------------------------------------------ expressions
  /** Type-check an expression, annotate it, and add definitely-assigned names to `a`. */
  expr(e: Expr, a: Set<string>): JType {
    const t = this.exprInner(e, a);
    e.ty = t;
    return t;
  }

  private exprInner(e: Expr, a: Set<string>): JType {
    switch (e.kind) {
      case 'lit': return e.litType;
      case 'name': {
        const v = this.lookup(e.name);
        if (!v) {
          if (STATIC_CLASSES.has(e.name)) return { k: 'static', n: e.name };
          if (this.methods.has(e.name)) throw new CompileError(`cannot find symbol: variable ${e.name} — to call the method write ${e.name}(...)`, e.line, e.col);
          const guess = this.suggest(e.name);
          throw new CompileError(`cannot find symbol: variable ${e.name}${guess ? ` — did you mean ${guess}?` : ''}`, e.line, e.col);
        }
        if (!v.isField && !a.has(e.name)) throw new CompileError(`variable ${e.name} might not have been initialized`, e.line, e.col);
        return v.ty;
      }
      case 'field': {
        const ot = this.exprMaybeStatic(e.obj, a);
        if (ot.k === 'static') {
          const key = `${ot.n}.${e.name}`;
          const ft = STATIC_FIELDS[key];
          if (!ft) throw new CompileError(`cannot find symbol: ${key}`, e.line, e.col);
          return ft;
        }
        if (ot.k === 'array') {
          if (e.name === 'length') return T.int;
          throw new CompileError(`cannot find symbol: ${e.name} — arrays only have the field length`, e.line, e.col);
        }
        if (ot.k === 'String' && e.name === 'length') throw new CompileError('cannot find symbol: length — for a String write length() with brackets', e.line, e.col);
        throw new CompileError(`cannot find symbol: ${e.name} on ${typeName(ot)}`, e.line, e.col);
      }
      case 'index': {
        const at = this.expr(e.arr, a);
        if (at.k !== 'array') {
          if (at.k === 'String') throw new CompileError('array required, but String found — use s.charAt(i) to read a character', e.line, e.col);
          throw new CompileError(`array required, but ${typeName(at)} found`, e.line, e.col);
        }
        const it = this.expr(e.idx, a);
        if (!assignable(it, T.int)) throw new CompileError(convertMsg(it, T.int) + ' (array index must be an int)', e.idx.line, e.idx.col);
        return at.of;
      }
      case 'call': return this.checkCall(e, a);
      case 'new': {
        const tn = e.type.base;
        const argTs = e.args.map(x => this.expr(x, a));
        if (tn === 'Scanner') {
          if (argTs.length !== 1 || !(argTs[0].k === 'obj' && argTs[0].n === 'InputStream')) throw new CompileError('this lab supports new Scanner(System.in)', e.line, e.col);
          return T.Scanner;
        }
        if (tn === 'Random') {
          if (argTs.length > 1 || (argTs.length === 1 && !assignable(argTs[0], T.long))) throw new CompileError('no suitable constructor found for Random', e.line, e.col);
          return T.Random;
        }
        if (tn === 'String') {
          if (argTs.length === 0) return T.String;
          if (argTs.length === 1 && (argTs[0].k === 'String' || (argTs[0].k === 'array' && sameType(argTs[0], arr(T.char))))) return T.String;
          throw new CompileError('no suitable constructor found for String', e.line, e.col);
        }
        if (tn === 'StringBuilder') return T.StringBuilder;
        throw new CompileError(`cannot find symbol: class ${tn}`, e.type.line, e.type.col);
      }
      case 'newarr': {
        let base: JType = resolveTypeNode({ base: e.base, dims: 0, line: e.line, col: e.col });
        for (const d of e.dimExprs) {
          const dt = this.expr(d, a);
          if (!assignable(dt, T.int)) throw new CompileError(convertMsg(dt, T.int) + ' (array size must be an int)', d.line, d.col);
        }
        const total = e.dimExprs.length + e.extraDims;
        let t = base; for (let i = 0; i < total; i++) t = arr(t);
        if (e.init) this.checkArrayInit(e.init, t);
        return t;
      }
      case 'arrinit': throw new CompileError('array initializer is only allowed in a declaration — write new int[]{...}', e.line, e.col);
      case 'unary': {
        const t = this.expr(e.e, a);
        if (e.op === '!') { if (!isBool(t)) throw new CompileError(`bad operand type ${typeName(t)} for unary operator '!'`, e.line, e.col); return T.boolean; }
        if (e.op === '~') { if (!isIntegral(t)) throw new CompileError(`bad operand type ${typeName(t)} for unary operator '~'`, e.line, e.col); return unaryPromote(t); }
        if (!isNumeric(t)) throw new CompileError(`bad operand type ${typeName(t)} for unary operator '${e.op}'`, e.line, e.col);
        return unaryPromote(t);
      }
      case 'incdec': {
        const t = this.lvalue(e.target, a, true);
        if (!isNumeric(t)) throw new CompileError(`bad operand type ${typeName(t)} for unary operator '${e.op}'`, e.line, e.col);
        return t;
      }
      case 'bin': return this.checkBin(e, a);
      case 'assign': {
        if (e.op === '=') {
          const vt = e.value.kind === 'arrinit' ? null : this.expr(e.value, a);
          const tt = this.lvalue(e.target, a, false);
          if (vt === null) { this.checkArrayInit(e.value, tt); throw new CompileError('array initializer is only allowed in a declaration — write new int[]{...}', e.value.line, e.value.col); }
          if (!assignable(vt, tt, e.value)) throw new CompileError(convertMsg(vt, tt), e.value.line, e.value.col);
          if (e.target.kind === 'name') a.add(e.target.name);
          return tt;
        }
        const tt = this.lvalue(e.target, a, true);
        const vt = this.expr(e.value, a);
        const op = e.op.slice(0, -1);
        if (op === '+' && tt.k === 'String') { if (vt.k === 'void') throw new CompileError("'void' type not allowed here", e.value.line, e.value.col); e.opType = T.String; return tt; }
        if (['+', '-', '*', '/', '%'].includes(op)) {
          if (!isNumeric(tt) || !isNumeric(vt)) throw new CompileError(`bad operand types for binary operator '${op}' (${typeName(tt)} and ${typeName(vt)})`, e.line, e.col);
          e.opType = binaryPromote(tt, vt);
          return tt;
        }
        if (['&', '|', '^'].includes(op)) {
          if (isBool(tt) && isBool(vt)) { e.opType = T.boolean; return tt; }
          if (!isIntegral(tt) || !isIntegral(vt)) throw new CompileError(`bad operand types for binary operator '${op}'`, e.line, e.col);
          e.opType = binaryPromote(tt, vt); return tt;
        }
        // shifts
        if (!isIntegral(tt) || !isIntegral(vt)) throw new CompileError(`bad operand types for binary operator '${op}'`, e.line, e.col);
        e.opType = unaryPromote(tt);
        return tt;
      }
      case 'cond': {
        this.cond(e.c, a, '?:');
        const ta = this.expr(e.a, new Set(a));
        const tb = this.expr(e.b, new Set(a));
        if (sameType(ta, tb)) return ta;
        if (isNumeric(ta) && isNumeric(tb)) {
          // int constant with char/short/byte keeps the narrower type (JLS 15.25) — simplified
          if (ta.k === 'prim' && tb.k === 'prim' && ta.n === 'char' && tb.n === 'int' && constInt(e.b) !== null) return T.char;
          if (ta.k === 'prim' && tb.k === 'prim' && tb.n === 'char' && ta.n === 'int' && constInt(e.a) !== null) return T.char;
          return binaryPromote(unaryPromote(ta), unaryPromote(tb));
        }
        if (ta.k === 'null' && tb.k !== 'prim') return tb;
        if (tb.k === 'null' && ta.k !== 'prim') return ta;
        if (ta.k === 'String' || tb.k === 'String') throw new CompileError(`incompatible types in conditional expression: ${typeName(ta)} and ${typeName(tb)}`, e.line, e.col);
        throw new CompileError(`incompatible types in conditional expression: ${typeName(ta)} and ${typeName(tb)}`, e.line, e.col);
      }
      case 'cast': {
        const to = resolveTypeNode(e.type);
        const from = this.expr(e.e, a);
        if (to.k === 'prim' && from.k === 'prim') {
          if ((to.n === 'boolean') !== (from.n === 'boolean')) throw new CompileError(`incompatible types: ${typeName(from)} cannot be converted to ${typeName(to)}`, e.line, e.col);
          return to;
        }
        if (to.k === 'prim' && from.k === 'String') throw new CompileError(`incompatible types: String cannot be converted to ${typeName(to)} — use Integer.parseInt(...) to read a number from a String`, e.line, e.col);
        if (to.k === 'String' && from.k === 'prim') throw new CompileError(`incompatible types: ${typeName(from)} cannot be converted to String — use String.valueOf(...) or "" + value`, e.line, e.col);
        if (assignable(from, to)) return to;
        throw new CompileError(`incompatible types: ${typeName(from)} cannot be converted to ${typeName(to)}`, e.line, e.col);
      }
    }
  }

  private exprMaybeStatic(e: Expr, a: Set<string>): JType {
    if (e.kind === 'name' && !this.lookup(e.name) && STATIC_CLASSES.has(e.name)) { e.ty = { k: 'static', n: e.name }; return e.ty; }
    if (e.kind === 'field' && e.obj.kind === 'name' && e.obj.name === 'System' && !this.lookup('System')) {
      const t = STATIC_FIELDS[`System.${e.name}`];
      if (!t) throw new CompileError(`cannot find symbol: System.${e.name}`, e.line, e.col);
      e.obj.ty = { k: 'static', n: 'System' };
      e.ty = t; return t;
    }
    return this.expr(e, a);
  }

  private lvalue(t: Expr, a: Set<string>, mustBeAssigned: boolean): JType {
    if (t.kind === 'name') {
      const v = this.lookup(t.name);
      if (!v) throw new CompileError(`cannot find symbol: variable ${t.name}`, t.line, t.col);
      if (v.isFinal) throw new CompileError(`cannot assign a value to final variable ${t.name}`, t.line, t.col);
      if (mustBeAssigned && !v.isField && !a.has(t.name)) throw new CompileError(`variable ${t.name} might not have been initialized`, t.line, t.col);
      t.ty = v.ty;
      return v.ty;
    }
    if (t.kind === 'index') return this.expr(t, a);
    if (t.kind === 'field') {
      const ft = this.expr(t, a);
      if (t.name === 'length') throw new CompileError('cannot assign a value to final variable length', t.line, t.col);
      return ft;
    }
    throw new CompileError('unexpected type — required: variable', t.line, t.col);
  }

  private checkBin(e: Expr & { kind: 'bin' }, a: Set<string>): JType {
    const op = e.op;
    if (op === '&&' || op === '||') {
      const lt = this.expr(e.l, a);
      const ra = new Set(a); // assignments on the right are not definite
      const rt = this.expr(e.r, ra);
      if (!isBool(lt) || !isBool(rt)) throw new CompileError(`bad operand types for binary operator '${op}' (${typeName(lt)} and ${typeName(rt)}) — both sides must be true/false`, e.line, e.col);
      return T.boolean;
    }
    const lt = this.expr(e.l, a);
    const rt = this.expr(e.r, a);
    if (lt.k === 'void' || rt.k === 'void') throw new CompileError("'void' type not allowed here — this method does not return a value", (lt.k === 'void' ? e.l : e.r).line, (lt.k === 'void' ? e.l : e.r).col);
    if (op === '+' && (lt.k === 'String' || rt.k === 'String')) {
      e.opType = T.String;
      // Compile-time constant concatenation ("ja" + "va") is interned, so == sees the pooled literal.
      const l = constText(e.l), r = constText(e.r);
      if (l !== null && r !== null) e.cstr = l + r;
      return T.String;
    }
    const bad = () => new CompileError(`bad operand types for binary operator '${op}' (${typeName(lt)} and ${typeName(rt)})`, e.line, e.col);
    switch (op) {
      case '+': case '-': case '*': case '/': case '%':
        if (!isNumeric(lt) || !isNumeric(rt)) throw bad();
        e.opType = binaryPromote(lt, rt);
        return e.opType;
      case '<': case '>': case '<=': case '>=':
        if (!isNumeric(lt) || !isNumeric(rt)) {
          if (lt.k === 'String' && rt.k === 'String') throw new CompileError(`bad operand types for binary operator '${op}' — compare Strings with compareTo()`, e.line, e.col);
          throw bad();
        }
        e.opType = binaryPromote(lt, rt);
        return T.boolean;
      case '==': case '!=':
        if (isNumeric(lt) && isNumeric(rt)) { e.opType = binaryPromote(lt, rt); return T.boolean; }
        if (isBool(lt) && isBool(rt)) { e.opType = T.boolean; return T.boolean; }
        if ((lt.k !== 'prim' && rt.k !== 'prim') && (lt.k === 'null' || rt.k === 'null' || sameType(lt, rt) || (lt.k === 'obj' && lt.n === 'Object') || (rt.k === 'obj' && rt.n === 'Object'))) { e.opType = lt.k === 'null' ? rt : lt; return T.boolean; }
        if ((lt.k === 'String' && rt.k === 'prim') || (rt.k === 'String' && lt.k === 'prim')) throw new CompileError(`incomparable types: ${typeName(lt)} and ${typeName(rt)} — a String and ${an(lt.k === 'prim' ? typeName(lt) : typeName(rt))} can't be compared with ${op}`, e.line, e.col);
        throw new CompileError(`incomparable types: ${typeName(lt)} and ${typeName(rt)}`, e.line, e.col);
      case '&': case '|': case '^':
        if (isBool(lt) && isBool(rt)) { e.opType = T.boolean; return T.boolean; }
        if (isIntegral(lt) && isIntegral(rt)) { e.opType = binaryPromote(lt, rt); return e.opType; }
        throw bad();
      case '<<': case '>>': case '>>>':
        if (!isIntegral(lt) || !isIntegral(rt)) throw bad();
        e.opType = unaryPromote(lt);
        return e.opType;
    }
    throw bad();
  }

  private checkCall(e: Expr & { kind: 'call' }, a: Set<string>): JType {
    // user-defined static method
    if (e.target === null) {
      const cands = this.methods.get(e.name);
      const argTs = e.args.map(x => this.expr(x, a));
      if (!cands) {
        if (e.name === 'println' || e.name === 'print' || e.name === 'printf') throw new CompileError(`cannot find symbol: method ${e.name} — write System.out.${e.name}(...)`, e.line, e.col);
        throw new CompileError(`cannot find symbol: method ${e.name}(${argTs.map(typeName).join(',')})`, e.line, e.col);
      }
      const m = this.pickOverload(cands, argTs, e.args);
      if (!m) {
        const c0 = cands[0];
        throw new CompileError(`method ${e.name} cannot be applied to given types — required: (${c0.params.map(p => typeName(p.ty!)).join(',')}), found: (${argTs.map(typeName).join(',')})`, e.line, e.col);
      }
      if (!m.isStatic && this.current.isStatic) throw new CompileError(`non-static method ${m.sig} cannot be referenced from a static context — add the word static to its declaration`, e.line, e.col);
      e.resolved = 'user:' + m.sig;
      return m.retTy!;
    }
    const tt = this.exprMaybeStatic(e.target, a);
    const argTs = e.args.map(x => this.expr(x, a));
    if (tt.k === 'static') {
      const key = `${tt.n}.${e.name}`;
      const sigs = STATIC_METHODS[key];
      if (!sigs) throw new CompileError(`cannot find symbol: method ${key}(${argTs.map(typeName).join(',')})`, e.line, e.col);
      const r = this.pickBuiltin(sigs, argTs, e.args);
      if (!r) throw new CompileError(`no suitable method found for ${key}(${argTs.map(typeName).join(',')})`, e.line, e.col);
      e.resolved = 'static:' + key;
      return r;
    }
    let cls: string;
    if (tt.k === 'String') cls = 'String';
    else if (tt.k === 'obj') cls = tt.n;
    else if (tt.k === 'array') throw new CompileError(`cannot find symbol: method ${e.name}() on an array — use .length (no brackets) or a loop`, e.line, e.col);
    else if (tt.k === 'prim') throw new CompileError(`${typeName(tt)} cannot be dereferenced — ${typeName(tt)} is a primitive type and has no methods`, e.line, e.col);
    else throw new CompileError(`cannot find symbol: method ${e.name}`, e.line, e.col);
    const table = INSTANCE_METHODS[cls];
    const sigs = table?.[e.name];
    if (!sigs) {
      if (cls === 'String' && e.name === 'size') throw new CompileError('cannot find symbol: method size() — for a String use length()', e.line, e.col);
      throw new CompileError(`cannot find symbol: method ${e.name}(${argTs.map(typeName).join(',')}) in ${cls}`, e.line, e.col);
    }
    const r = this.pickBuiltin(sigs, argTs, e.args);
    if (!r) throw new CompileError(`no suitable method found for ${e.name}(${argTs.map(typeName).join(',')}) in ${cls}`, e.line, e.col);
    if (r.k === 'void' && cls === 'PrintStream') { /* fine */ }
    e.resolved = `inst:${cls}.${e.name}`;
    return r;
  }

  private pickBuiltin(sigs: Sig[], argTs: JType[], args: Expr[]): JType | null {
    for (const s of sigs) {
      if (s.varargs ? argTs.length < s.params.length : argTs.length !== s.params.length) continue;
      let ok = true;
      for (let i = 0; i < s.params.length; i++) if (!matchParam(s.params[i], argTs[i], args[i])) { ok = false; break; }
      if (s.varargs) for (let i = s.params.length; i < argTs.length; i++) if (argTs[i].k === 'void') ok = false;
      if (ok) return typeof s.ret === 'function' ? s.ret(argTs) : s.ret;
    }
    return null;
  }

  private pickOverload(cands: MethodDecl[], argTs: JType[], args: Expr[]): MethodDecl | null {
    const applicable = cands.filter(m => m.params.length === argTs.length && m.params.every((p, i) => assignable(argTs[i], p.ty!, args[i])));
    if (!applicable.length) return null;
    // exact match first, else most specific (first whose params are all assignable to the others')
    const exact = applicable.find(m => m.params.every((p, i) => sameType(p.ty!, argTs[i])));
    if (exact) return exact;
    for (const m of applicable) if (applicable.every(o => o === m || m.params.every((p, i) => assignable(p.ty!, o.params[i].ty!)))) return m;
    return applicable[0];
  }

  private suggest(name: string): string | null {
    const names = [...this.allNames(), ...this.fields.keys()];
    const lower = name.toLowerCase();
    return names.find(n => n.toLowerCase() === lower) ?? null;
  }
}

function meet(a: Assigned, b: Assigned): Assigned {
  if (a === null) return b;
  if (b === null) return a;
  return new Set([...a].filter(x => b.has(x)));
}
function meetSet(a: Set<string>, b: Set<string>): Set<string> { return new Set([...a].filter(x => b.has(x))); }
function union(a: Set<string>, b: Assigned): Set<string> { if (b === null) return a; return new Set([...a, ...b]); }

/** Does the statement contain a break that targets the enclosing loop (not a nested loop/switch)? */
function hasBreak(s: Stmt, forSwitch = false): boolean {
  switch (s.kind) {
    case 'break': return true;
    case 'block': return s.body.some(x => hasBreak(x, forSwitch));
    case 'if': return hasBreak(s.then, forSwitch) || (s.els ? hasBreak(s.els, forSwitch) : false);
    case 'switch': return forSwitch ? false : false; // a break inside a switch targets the switch
    default: return false; // nested loops own their breaks
  }
}
function containsBreakForSwitch(s: Stmt): boolean {
  switch (s.kind) {
    case 'break': return true;
    case 'block': return s.body.some(containsBreakForSwitch);
    case 'if': return containsBreakForSwitch(s.then) || (s.els ? containsBreakForSwitch(s.els) : false);
    default: return false;
  }
}
function collectAssignedExpr(e: Expr | null | undefined, out: Set<string>) {
  if (!e) return;
  switch (e.kind) {
    case 'assign': if (e.target.kind === 'name') out.add(e.target.name); collectAssignedExpr(e.value, out); break;
    case 'bin': collectAssignedExpr(e.l, out); collectAssignedExpr(e.r, out); break;
    case 'call': e.args.forEach(x => collectAssignedExpr(x, out)); break;
    case 'cond': collectAssignedExpr(e.c, out); collectAssignedExpr(e.a, out); collectAssignedExpr(e.b, out); break;
    case 'unary': collectAssignedExpr(e.e, out); break;
    default: break;
  }
}
function collectAssigned(s: Stmt, out: Set<string>) {
  switch (s.kind) {
    case 'expr': collectAssignedExpr(s.e, out); break;
    case 'block': s.body.forEach(x => collectAssigned(x, out)); break;
    case 'if': collectAssignedExpr(s.c, out); collectAssigned(s.then, out); if (s.els) collectAssigned(s.els, out); break;
    case 'while': case 'dowhile': collectAssigned(s.body, out); break;
    case 'for': s.init.forEach(x => collectAssigned(x, out)); collectAssigned(s.body, out); break;
    case 'foreach': collectAssigned(s.body, out); break;
    case 'switch': s.cases.forEach(c => c.body.forEach(x => collectAssigned(x, out))); break;
    case 'vardecl': break;
    default: break;
  }
}
function hasContinue(s: Stmt): boolean {
  switch (s.kind) {
    case 'continue': return true;
    case 'block': return s.body.some(hasContinue);
    case 'if': return hasContinue(s.then) || (s.els ? hasContinue(s.els) : false);
    case 'switch': return s.cases.some(c => c.body.some(hasContinue));
    default: return false;
  }
}
