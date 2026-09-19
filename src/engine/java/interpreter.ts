import type { Expr, JType, MethodDecl, Program, Stmt } from './ast';
import { T, typeName, isNumeric } from './ast';
import { CompileError } from './lexer';
import { JArray, JStr, JStringBuilder, type JValue, d2i, d2l, defaultValue, displayValue, javaFloatingToString, javaFormat, jToString, charStr, FormatError, arrayIdentity } from './values';

// ====================================================================== public types
export type StepKind = 'start' | 'stmt' | 'decl' | 'cond' | 'loop-check' | 'loop-update' | 'call' | 'return' | 'break' | 'continue' | 'switch' | 'end' | 'error';

export interface VarView { name: string; type: string; display: string; ref?: number; str?: string; changed?: boolean }
export interface FrameView { method: string; sig: string; line: number; vars: VarView[] }
export interface ArrView { id: number; type: string; values: string[]; refs?: (number | null)[] }
export interface LoopView { id: number; line: number; kind: string; iter: number }
export interface Highlight { arr?: number; idx?: number; write?: boolean; str?: string; strIdx?: number }

export interface Step {
  line: number;
  kind: StepKind;
  desc: string;
  frames: FrameView[];
  arrays: ArrView[];
  outLen: number;
  loops: LoopView[];
  hl: Highlight[];
  cond?: boolean;
  /** Input consumed so far (character offset into stdin). */
  inPos: number;
}

export interface IterRecord { loopId: number; line: number; depth: number; iter: number; vars: Record<string, string>; out: string; /** Number of trace steps recorded when the iteration ended. */ at: number }

export interface RunError { kind: 'compile' | 'runtime' | 'limit'; name: string; message: string; line: number; col?: number; friendly: string }

export interface RunResult {
  ok: boolean;
  output: string;
  error?: RunError;
  steps: Step[];
  iterations: IterRecord[];
  truncated: boolean;
  ops: number;
}

export interface RunOptions {
  stdin?: string;
  trace?: boolean;
  maxOps?: number;
  maxSteps?: number;
  maxDepth?: number;
}

// ====================================================================== internals
class JavaThrow extends Error {
  jname: string; jmsg: string; line: number;
  constructor(jname: string, jmsg: string, line: number) { super(`${jname}: ${jmsg}`); this.jname = jname; this.jmsg = jmsg; this.line = line; }
}
class LimitHit extends Error { line: number; constructor(msg: string, line: number) { super(msg); this.line = line; } }
class ExitSignal extends Error { code: number; constructor(code: number) { super('exit'); this.code = code; } }

const UNINIT = Symbol('uninit');
interface Slot { v: JValue | typeof UNINIT; ty: JType }
interface Frame { m: MethodDecl; scopes: Map<string, Slot>[]; line: number; ret: JValue }

const NORMAL = 0, BREAK = 1, CONTINUE = 2, RETURN = 3;
type Flow = 0 | 1 | 2 | 3;

const FRIENDLY: Record<string, string> = {
  'java.lang.ArithmeticException': 'An integer was divided by zero (with / or %). Integer division by zero is not allowed in Java.',
  'java.lang.ArrayIndexOutOfBoundsException': 'The program used an array index that does not exist. Valid indexes run from 0 to length − 1.',
  'java.lang.StringIndexOutOfBoundsException': 'The program asked for a character position that does not exist. Valid indexes run from 0 to length() − 1.',
  'java.lang.NegativeArraySizeException': 'An array was created with a negative size.',
  'java.lang.NullPointerException': 'The program used a variable that holds null (it does not refer to an object yet).',
  'java.util.InputMismatchException': 'The program asked for one type of input (for example an int) but the next input was something else.',
  'java.util.NoSuchElementException': 'The program tried to read more input than was provided. Add more values in the Input box.',
  'java.lang.NumberFormatException': 'A String could not be converted to a number because it does not contain a valid number.',
  'java.lang.StackOverflowError': 'The recursion went too deep — usually a missing or unreachable base case.',
  'java.lang.IllegalArgumentException': 'A method received an argument it does not accept.',
  'java.util.IllegalFormatConversionException': 'A printf format does not match the value — for example %d with a double. Use %f for double and %d for int.',
  'java.util.MissingFormatArgumentException': 'printf has more % placeholders than values.',
  'java.util.UnknownFormatConversionException': 'printf contains an unknown % code.',
};

// Java's java.util.Random (48-bit LCG) so seeded sequences match the JDK exactly.
class JRandom {
  private seed: bigint;
  constructor(seed: bigint) { this.seed = (seed ^ 0x5DEECE66Dn) & ((1n << 48n) - 1n); }
  private next(bits: number): number {
    this.seed = (this.seed * 0x5DEECE66Dn + 0xBn) & ((1n << 48n) - 1n);
    return Number(BigInt.asIntN(32, this.seed >> BigInt(48 - bits)));
  }
  nextInt(bound?: number, line = 0): number {
    if (bound === undefined) return this.next(32);
    if (bound <= 0) throw new JavaThrow('java.lang.IllegalArgumentException', 'bound must be positive', line);
    if ((bound & -bound) === bound) return Number((BigInt(bound) * BigInt(this.next(31))) >> 31n);
    let bits: number, val: number;
    do { bits = this.next(31); val = bits % bound; } while (((bits - val + (bound - 1)) | 0) < 0);
    return val;
  }
  nextDouble(): number { return (Number((BigInt(this.next(26)) << 27n) + BigInt(this.next(27)))) * 2 ** -53; }
  nextBoolean(): boolean { return this.next(1) !== 0; }
}

class JScanner { readonly kind = 'Scanner'; }

export class Interpreter {
  private prog: Program;
  private methods = new Map<string, MethodDecl>();
  private globals = new Map<string, Slot>();
  private frames: Frame[] = [];
  private out: string[] = [];
  private outLen = 0;
  private stdin: string;
  inPos = 0;
  private ops = 0;
  private maxOps: number;
  private maxSteps: number;
  private maxDepth: number;
  private tracing: boolean;
  steps: Step[] = [];
  iterations: IterRecord[] = [];
  truncated = false;
  private loops: LoopView[] = [];
  private hl: Highlight[] = [];
  private writes: string[] = [];
  private curLine = 0;
  private mathRandom = new JRandom(20260919n);

  constructor(prog: Program, opts: RunOptions) {
    this.prog = prog;
    this.stdin = (opts.stdin ?? '').replace(/\r\n?/g, '\n');
    this.tracing = !!opts.trace;
    this.maxOps = opts.maxOps ?? (opts.trace ? 400_000 : 5_000_000);
    this.maxSteps = opts.maxSteps ?? 4000;
    this.maxDepth = opts.maxDepth ?? 2500;
    for (const m of prog.methods) this.methods.set(m.sig!, m);
  }

  // ------------------------------------------------------------------ run
  run(): { ok: boolean; error?: RunError } {
    JStr.resetPool(); JArray.resetIds();
    const main = [...this.methods.values()].find(m => m.name === 'main' && m.params.length === 1)!;
    try {
      // static field initializers (run inside a temporary frame so expressions can resolve names)
      this.frames.push({ m: main, scopes: [new Map()], line: main.line, ret: null });
      for (const f of this.prog.fields) {
        for (const d of f.decl.decls) {
          const v = d.init ? (d.init.kind === 'arrinit' ? this.arrayInit(d.init, d.ty!) : this.coerce(this.eval(d.init), d.init.ty!, d.ty!)) : defaultValue(d.ty!);
          this.globals.set(d.name, { v, ty: d.ty! });
        }
      }
      this.frames.pop();
      const args = new JArray(T.String, []);
      this.frames.push({ m: main, scopes: [new Map([['args', { v: args, ty: { k: 'array', of: T.String } }]])], line: main.line, ret: null });
      this.step(main.line, 'start', 'The program starts: Java runs main first.');
      this.execBlock(main.body.body, false);
      this.frames.pop();
      this.step(main.endLine, 'end', 'main has finished — the program ends.', true);
      return { ok: true };
    } catch (err) {
      if (err instanceof ExitSignal) { this.step(this.curLine, 'end', `System.exit(${err.code}) ends the program immediately.`, true); return { ok: true }; }
      const e = this.toRunError(err);
      this.step(e.line || this.curLine, 'error', e.friendly, true);
      return { ok: false, error: e };
    }
  }

  private toRunError(err: unknown): RunError {
    if (err instanceof JavaThrow) {
      return { kind: 'runtime', name: err.jname, message: `Exception in thread "main" ${err.jname}${err.jmsg ? ': ' + err.jmsg : ''}`, line: err.line, friendly: FRIENDLY[err.jname] ?? 'The program stopped with an exception.' };
    }
    if (err instanceof LimitHit) {
      return { kind: 'limit', name: 'LimitExceeded', message: err.message, line: err.line, friendly: err.message };
    }
    if (err instanceof RangeError && /call stack/i.test(err.message)) {
      return { kind: 'runtime', name: 'java.lang.StackOverflowError', message: 'Exception in thread "main" java.lang.StackOverflowError', line: this.curLine, friendly: FRIENDLY['java.lang.StackOverflowError'] };
    }
    if (err instanceof CompileError) return { kind: 'compile', name: 'CompileError', message: err.message, line: err.line, col: err.col, friendly: err.message };
    const msg = err instanceof Error ? err.message : String(err);
    return { kind: 'runtime', name: 'InternalError', message: 'The lab could not run this program: ' + msg, line: this.curLine, friendly: 'The lab hit an internal problem running this code: ' + msg };
  }

  get output(): string { return this.out.join(''); }

  // ------------------------------------------------------------------ tracing
  private tick(line: number) {
    if (++this.ops > this.maxOps) {
      throw new LimitHit(`Stopped after ${this.maxOps.toLocaleString()} steps — the program is probably stuck in an infinite loop (check that the loop variable changes so the condition can become false).`, line);
    }
  }

  private step(line: number, kind: StepKind, descIn: string | (() => string), force = false, cond?: boolean) {
    this.curLine = line;
    if (!this.tracing) { this.hl = []; this.writes = []; return; }
    if (this.steps.length >= this.maxSteps && !force) { this.truncated = true; this.hl = []; this.writes = []; return; }
    const desc = typeof descIn === 'function' ? descIn() : descIn;
    const arrays = new Map<number, ArrView>();
    const collect = (v: unknown, ty: JType) => {
      if (!(v instanceof JArray) || arrays.has(v.id)) return;
      const view: ArrView = { id: v.id, type: typeName(ty), values: [], refs: [] };
      arrays.set(v.id, view);
      const n = Math.min(v.data.length, 80);
      for (let i = 0; i < n; i++) {
        const el = v.data[i];
        if (el instanceof JArray) { view.values.push(`#${el.id}`); view.refs!.push(el.id); collect(el, v.elemType); }
        else { view.values.push(el === null ? 'null' : displayValue(el as JValue, v.elemType)); view.refs!.push(null); }
      }
      if (v.data.length > n) view.values.push(`… ${v.data.length - n} more`);
    };
    const changed = new Set(this.writes);
    const frames: FrameView[] = this.frames.map((f, fi) => {
      const vars: VarView[] = [];
      for (const sc of f.scopes) for (const [name, slot] of sc) {
        if (name === 'args' && f.m.name === 'main' && fi === 0) continue;
        if (slot.v === UNINIT) { vars.push({ name, type: typeName(slot.ty), display: '?' }); continue; }
        const v = slot.v;
        const view: VarView = { name, type: typeName(slot.ty), display: displayValue(v, slot.ty) };
        if (v instanceof JArray) { view.ref = v.id; collect(v, slot.ty); }
        if (v instanceof JStr) view.str = v.v;
        if (fi === this.frames.length - 1 && changed.has(name)) view.changed = true;
        vars.push(view);
      }
      return { method: f.m.name, sig: f.m.sig ?? f.m.name, line: f.line, vars };
    });
    for (const [name, slot] of this.globals) {
      if (slot.v instanceof JArray) collect(slot.v, slot.ty);
      void name;
    }
    if (this.globals.size && frames.length) {
      frames.unshift({ method: 'static', sig: 'static fields', line: 0, vars: [...this.globals].map(([name, slot]) => ({ name, type: typeName(slot.ty), display: slot.v === UNINIT ? '?' : displayValue(slot.v as JValue, slot.ty), ref: slot.v instanceof JArray ? slot.v.id : undefined })) });
    }
    this.steps.push({ line, kind, desc, frames, arrays: [...arrays.values()], outLen: this.outLen, loops: this.loops.map(l => ({ ...l })), hl: this.hl, cond, inPos: this.inPos });
    this.hl = []; this.writes = [];
  }

  // ------------------------------------------------------------------ variables
  private get frame(): Frame { return this.frames[this.frames.length - 1]; }
  private findSlot(name: string): Slot {
    const f = this.frame;
    for (let i = f.scopes.length - 1; i >= 0; i--) { const s = f.scopes[i].get(name); if (s) return s; }
    const g = this.globals.get(name);
    if (g) return g;
    throw new JavaThrow('java.lang.Error', `unknown variable ${name}`, this.curLine);
  }
  private readVar(name: string, line: number): JValue {
    const s = this.findSlot(name);
    if (s.v === UNINIT) throw new CompileError(`variable ${name} might not have been initialized`, line, 1);
    return s.v;
  }

  // ------------------------------------------------------------------ conversions
  coerce(v: JValue, from: JType, to: JType): JValue {
    if (to.k !== 'prim' || from.k !== 'prim') return v;
    if (from.n === to.n) return v;
    const fn = from.n, tn = to.n;
    // to long
    if (tn === 'long') {
      if (typeof v === 'bigint') return v;
      return fn === 'double' || fn === 'float' ? d2l(v as number) : BigInt(v as number);
    }
    let x: number;
    if (typeof v === 'bigint') {
      if (tn === 'double') return Number(v);
      if (tn === 'float') return Math.fround(Number(v));
      x = Number(BigInt.asIntN(32, v));
    } else x = v as number;
    switch (tn) {
      case 'double': return x;
      case 'float': return Math.fround(x);
      case 'int': return fn === 'double' || fn === 'float' ? d2i(x) : x | 0;
      case 'short': { const i = fn === 'double' || fn === 'float' ? d2i(x) : x | 0; return (i << 16) >> 16; }
      case 'byte': { const i = fn === 'double' || fn === 'float' ? d2i(x) : x | 0; return (i << 24) >> 24; }
      case 'char': { const i = fn === 'double' || fn === 'float' ? d2i(x) : x | 0; return i & 0xffff; }
      default: return v;
    }
  }

  // ------------------------------------------------------------------ statements
  private execBlock(stmts: Stmt[], newScope = true): Flow {
    if (newScope) this.frame.scopes.push(new Map());
    try {
      for (const s of stmts) {
        const r = this.exec(s);
        if (r !== NORMAL) return r;
      }
      return NORMAL;
    } finally {
      if (newScope) this.frame.scopes.pop();
    }
  }

  private exec(s: Stmt): Flow {
    this.tick(s.line);
    this.frame.line = s.line;
    this.curLine = s.line;
    switch (s.kind) {
      case 'empty': return NORMAL;
      case 'block': return this.execBlock(s.body);
      case 'vardecl': {
        const parts: string[] = [];
        for (const d of s.decls) {
          const scope = this.frame.scopes[this.frame.scopes.length - 1];
          if (d.init) {
            const v = d.init.kind === 'arrinit' ? this.arrayInit(d.init, d.ty!) : this.coerce(this.eval(d.init), d.init.ty!, d.ty!);
            scope.set(d.name, { v, ty: d.ty! });
            this.writes.push(d.name);
            parts.push(`${d.name} = ${this.show(v, d.ty!)}`);
          } else {
            scope.set(d.name, { v: UNINIT, ty: d.ty! });
            parts.push(`${d.name} (no value yet)`);
          }
        }
        this.step(s.line, 'decl', () => `Create ${typeName(s.decls[0].ty!)} ${parts.join(', ')}.`);
        return NORMAL;
      }
      case 'expr': {
        const before = this.outLen;
        const inBefore = this.inPos;
        const v = this.eval(s.e);
        void v;
        this.step(s.line, 'stmt', () => this.describeExprStmt(s.e, before, inBefore));
        return NORMAL;
      }
      case 'if': {
        const c = this.eval(s.c) as boolean;
        this.step(s.line, 'cond', () => `Check if (${this.src(s.c)}) → ${c}. ${c ? 'Run the if-block.' : s.els ? 'Skip to the else part.' : 'Skip the if-block.'}`, false, c);
        if (c) return this.execScoped(s.then);
        if (s.els) return this.execScoped(s.els);
        return NORMAL;
      }
      case 'while': return this.execWhile(s);
      case 'dowhile': return this.execDoWhile(s);
      case 'for': return this.execFor(s);
      case 'foreach': return this.execForEach(s);
      case 'switch': return this.execSwitch(s);
      case 'break': this.step(s.line, 'break', 'break — leave the nearest loop or switch immediately.'); return BREAK;
      case 'continue': this.step(s.line, 'continue', 'continue — skip the rest of this iteration and go to the next one.'); return CONTINUE;
      case 'return': {
        const f = this.frame;
        if (s.e) {
          const v = this.coerce(this.eval(s.e), s.e.ty!, f.m.retTy!);
          f.ret = v;
          this.step(s.line, 'return', `return ${this.show(v, f.m.retTy!)} — ${f.m.name} ends and sends this value back.`);
        } else {
          this.step(s.line, 'return', `return — ${f.m.name} ends here.`);
        }
        return RETURN;
      }
    }
  }

  /** if/else branches that are single statements still get their own scope in Java. */
  private execScoped(s: Stmt): Flow {
    if (s.kind === 'block') return this.execBlock(s.body);
    this.frame.scopes.push(new Map());
    try { return this.exec(s); } finally { this.frame.scopes.pop(); }
  }

  /** Run one loop body and record the iteration while the body's own variables are still in scope. */
  private execLoopBody(body: Stmt, loop: LoopView, outStart: number): Flow {
    this.frame.scopes.push(new Map());
    try {
      const stmts = body.kind === 'block' ? body.body : [body];
      for (const st of stmts) {
        const r = this.exec(st);
        if (r !== NORMAL) { this.recordIteration(loop, outStart); return r; }
      }
      this.recordIteration(loop, outStart);
      return NORMAL;
    } finally { this.frame.scopes.pop(); }
  }

  private pushLoop(id: number, line: number, kind: string): LoopView {
    const l = { id, line, kind, iter: 0 };
    this.loops.push(l);
    return l;
  }

  private recordIteration(loop: LoopView, outStart: number) {
    if (!this.tracing || this.iterations.length >= 600) return;
    const vars: Record<string, string> = {};
    for (const sc of this.frame.scopes) for (const [name, slot] of sc) {
      if (name === 'args') continue;
      vars[name] = slot.v === UNINIT ? '?' : (slot.v instanceof JArray ? `#${slot.v.id}` : jToString(slot.v as JValue, slot.ty));
    }
    for (const [name, slot] of this.globals) vars[name] = jToString(slot.v as JValue, slot.ty);
    this.iterations.push({ loopId: loop.id, line: loop.line, depth: this.frames.length, iter: loop.iter, vars, out: this.output.slice(outStart), at: this.steps.length });
  }

  private execWhile(s: Stmt & { kind: 'while' }): Flow {
    const loop = this.pushLoop(s.id, s.line, 'while');
    try {
      for (;;) {
        this.tick(s.line);
        const c = this.eval(s.c) as boolean;
        { const it = loop.iter + 1; this.step(s.line, 'loop-check', () => c ? `Check while (${this.src(s.c)}) → true, so run iteration ${it}.` : `Check while (${this.src(s.c)}) → false, so the loop ends.`, false, c); }
        if (!c) return NORMAL;
        loop.iter++;
        const r = this.execLoopBody(s.body, loop, this.outLen);
        if (r === BREAK) return NORMAL;
        if (r === RETURN) return RETURN;
      }
    } finally { this.loops.pop(); }
  }

  private execDoWhile(s: Stmt & { kind: 'dowhile' }): Flow {
    const loop = this.pushLoop(s.id, s.line, 'do-while');
    try {
      for (;;) {
        this.tick(s.line);
        loop.iter++;
        if (loop.iter === 1) this.step(s.line, 'stmt', 'do — the body runs first, before any check.');
        const r = this.execLoopBody(s.body, loop, this.outLen);
        if (r === BREAK) return NORMAL;
        if (r === RETURN) return RETURN;
        const c = this.eval(s.c) as boolean;
        this.step(s.condLine, 'loop-check', () => c ? `Check while (${this.src(s.c)}) → true, so run the body again.` : `Check while (${this.src(s.c)}) → false, so the loop ends.`, false, c);
        if (!c) return NORMAL;
      }
    } finally { this.loops.pop(); }
  }

  private execFor(s: Stmt & { kind: 'for' }): Flow {
    this.frame.scopes.push(new Map());
    const loop = this.pushLoop(s.id, s.line, 'for');
    try {
      for (const st of s.init) {
        if (st.kind === 'vardecl') this.exec(st);
        else if (st.kind === 'expr') { this.eval(st.e); this.step(s.line, 'stmt', `Initialise: ${this.src(st.e)} (runs only once).`); }
      }
      for (;;) {
        this.tick(s.line);
        let c = true;
        if (s.c) {
          c = this.eval(s.c) as boolean;
          { const it = loop.iter + 1; const cc = s.c; this.step(s.line, 'loop-check', () => c ? `Check ${this.src(cc)} → true, so run iteration ${it}.` : `Check ${this.src(cc)} → false, so the loop ends.`, false, c); }
        }
        if (!c) return NORMAL;
        loop.iter++;
        const r = this.execLoopBody(s.body, loop, this.outLen);
        if (r === BREAK) return NORMAL;
        if (r === RETURN) return RETURN;
        for (const u of s.update) this.eval(u);
        if (s.update.length) this.step(s.line, 'loop-update', () => `Update: ${s.update.map(u => this.src(u)).join(', ')} → ${this.writesText()}.`);
      }
    } finally { this.loops.pop(); this.frame.scopes.pop(); }
  }

  private execForEach(s: Stmt & { kind: 'foreach' }): Flow {
    const arrV = this.eval(s.iter);
    if (arrV === null) throw new JavaThrow('java.lang.NullPointerException', 'Cannot iterate over a null array', s.line);
    const a = arrV as JArray;
    const loop = this.pushLoop(s.id, s.line, 'for-each');
    try {
      for (let i = 0; i < a.data.length; i++) {
        this.tick(s.line);
        this.frame.scopes.push(new Map());
        try {
          const v = this.coerce(a.data[i] as JValue, a.elemType, s.elemTy!);
          this.frame.scopes[this.frame.scopes.length - 1].set(s.name, { v, ty: s.elemTy! });
          this.writes.push(s.name);
          this.hl.push({ arr: a.id, idx: i });
          loop.iter++;
          this.step(s.line, 'loop-check', () => `Next element: ${s.name} = ${this.show(v, s.elemTy!)} (index ${i}).`, false, true);
          const r = this.execLoopBody(s.body, loop, this.outLen);
          if (r === BREAK) return NORMAL;
          if (r === RETURN) return RETURN;
        } finally { this.frame.scopes.pop(); }
      }
      this.step(s.line, 'loop-check', 'No elements left — the for-each loop ends.', false, false);
      return NORMAL;
    } finally { this.loops.pop(); }
  }

  private execSwitch(s: Stmt & { kind: 'switch' }): Flow {
    const v = this.eval(s.e);
    const isStr = s.e.ty!.k === 'String';
    let start = -1;
    for (let i = 0; i < s.cases.length && start < 0; i++) {
      const c = s.cases[i];
      if (c.labels === null) continue;
      for (const l of c.labels) {
        const lv = this.eval(l);
        const eq = isStr ? (v as JStr | null)?.v === (lv as JStr).v : this.coerce(lv, l.ty!, T.int) === this.coerce(v, s.e.ty!, T.int);
        if (eq) { start = i; break; }
      }
    }
    if (start < 0) start = s.cases.findIndex(c => c.labels === null);
    const shown = this.show(v, s.e.ty!);
    if (start < 0) { this.step(s.line, 'switch', `switch (${this.src(s.e)}) is ${shown} — no case matches and there is no default, so nothing runs.`); return NORMAL; }
    const target = s.cases[start];
    this.step(s.line, 'switch', `switch (${this.src(s.e)}) is ${shown} — jump to ${target.labels === null ? 'default' : 'case ' + target.labels.map(l => this.src(l)).join(', ')}.`);
    this.frame.scopes.push(new Map());
    try {
      if (target.arrow) {
        const r = this.execBlock(target.body, false);
        return r === BREAK ? NORMAL : r;
      }
      for (let i = start; i < s.cases.length; i++) {
        if (i > start) this.step(s.cases[i].line, 'switch', 'No break above, so execution falls through into this case too.');
        const r = this.execBlock(s.cases[i].body, false);
        if (r === BREAK) return NORMAL;
        if (r !== NORMAL) return r;
      }
      return NORMAL;
    } finally { this.frame.scopes.pop(); }
  }

  // ------------------------------------------------------------------ descriptions
  private writesText(): string {
    const f = this.frame;
    const uniq = [...new Set(this.writes)];
    return uniq.map(n => {
      for (let i = f.scopes.length - 1; i >= 0; i--) { const sl = f.scopes[i].get(n); if (sl) return `${n} = ${sl.v === UNINIT ? '?' : this.show(sl.v as JValue, sl.ty)}`; }
      const g = this.globals.get(n); if (g) return `${n} = ${this.show(g.v as JValue, g.ty)}`;
      return n;
    }).join(', ') || 'done';
  }

  private describeExprStmt(e: Expr, outBefore: number, inBefore: number): string {
    const printed = this.outLen > outBefore ? this.output.slice(outBefore) : '';
    const readIn = this.inPos > inBefore ? this.stdin.slice(inBefore, this.inPos).trim() : '';
    const parts: string[] = [];
    if (e.kind === 'call' && e.resolved?.startsWith('inst:PrintStream')) {
      const shown = printed.replace(/\n$/, '');
      parts.push(printed ? `Print ${JSON.stringify(shown)}${printed.endsWith('\n') ? ' and move to a new line' : ''}.` : 'Print nothing but end the line.');
    } else {
      const w = this.writesText();
      parts.push(`${this.src(e)}${w !== 'done' ? ` → ${w}` : ''}.`);
      if (printed) parts.push(`Printed ${JSON.stringify(printed.replace(/\n$/, ''))}.`);
    }
    if (readIn) parts.push(`Read ${JSON.stringify(readIn)} from the input.`);
    return parts.join(' ');
  }

  /** Reconstruct compact source text for an expression (for step descriptions). */
  src(e: Expr): string {
    switch (e.kind) {
      case 'lit': return e.raw;
      case 'name': return e.name;
      case 'field': return `${this.src(e.obj)}.${e.name}`;
      case 'index': return `${this.src(e.arr)}[${this.src(e.idx)}]`;
      case 'call': return `${e.target ? this.src(e.target) + '.' : ''}${e.name}(${e.args.map(a => this.src(a)).join(', ')})`;
      case 'new': return `new ${e.type.base}(${e.args.map(a => this.src(a)).join(', ')})`;
      case 'newarr': return `new ${e.base}${e.dimExprs.map(d => `[${this.src(d)}]`).join('')}${'[]'.repeat(e.extraDims)}${e.init ? ' {…}' : ''}`;
      case 'arrinit': return `{${e.elems.map(a => this.src(a)).join(', ')}}`;
      case 'unary': return `${e.op}${this.src(e.e)}`;
      case 'incdec': return e.prefix ? `${e.op}${this.src(e.target)}` : `${this.src(e.target)}${e.op}`;
      case 'bin': return `${this.srcP(e.l)} ${e.op} ${this.srcP(e.r)}`;
      case 'assign': return `${this.src(e.target)} ${e.op} ${this.src(e.value)}`;
      case 'cond': return `${this.srcP(e.c)} ? ${this.srcP(e.a)} : ${this.srcP(e.b)}`;
      case 'cast': return `(${e.type.base}${'[]'.repeat(e.type.dims)}) ${this.srcP(e.e)}`;
    }
  }
  private srcP(e: Expr): string { return e.kind === 'bin' || e.kind === 'cond' || e.kind === 'assign' ? `(${this.src(e)})` : this.src(e); }

  private show(v: JValue, t: JType): string {
    if (t.k === 'String' && v instanceof JStr) return JSON.stringify(v.v);
    if (t.k === 'prim' && t.n === 'char') return `'${charStr(v as number)}'`;
    if (v instanceof JArray) {
      const et = (t as { of: JType }).of;
      const items = v.data.slice(0, 8).map(x => x instanceof JArray ? '{…}' : this.show(x as JValue, et));
      return `{${items.join(', ')}${v.data.length > 8 ? ', …' : ''}}`;
    }
    return jToString(v, t);
  }

  // ------------------------------------------------------------------ expressions
  private arrayInit(e: Expr, t: JType): JArray {
    if (e.kind !== 'arrinit' || t.k !== 'array') throw new JavaThrow('java.lang.Error', 'bad array initializer', e.line);
    const data = e.elems.map(el => el.kind === 'arrinit' ? this.arrayInit(el, t.of) : this.coerce(this.eval(el), el.ty!, t.of));
    return new JArray(t.of, data);
  }

  private newArray(elem: JType, dims: number[], extra: number, line: number): JArray {
    const n = dims[0];
    if (n < 0) throw new JavaThrow('java.lang.NegativeArraySizeException', String(n), line);
    if (n > 5_000_000) throw new LimitHit('Array too large for the lab (over 5,000,000 elements).', line);
    let innerType = elem; for (let i = 1; i < dims.length + extra; i++) innerType = { k: 'array', of: innerType };
    const data: unknown[] = new Array(n);
    for (let i = 0; i < n; i++) data[i] = dims.length > 1 ? this.newArray(elem, dims.slice(1), extra, line) : (extra > 0 ? null : defaultValue(innerType));
    return new JArray(innerType, data);
  }

  private checkIndex(a: JArray, i: number, line: number) {
    if (i < 0 || i >= a.data.length) throw new JavaThrow('java.lang.ArrayIndexOutOfBoundsException', `Index ${i} out of bounds for length ${a.data.length}`, line);
  }

  private nonNull<T>(v: T | null, what: string, line: number): T {
    if (v === null) throw new JavaThrow('java.lang.NullPointerException', `Cannot ${what} because the value is null`, line);
    return v;
  }

  eval(e: Expr): JValue {
    switch (e.kind) {
      case 'lit':
        if (e.litType.k === 'String') return JStr.intern(e.value as string);
        return e.value as JValue;
      case 'name': return this.readVar(e.name, e.line);
      case 'field': {
        const ot = e.obj.ty!;
        if (ot.k === 'static') return this.staticField(`${ot.n}.${e.name}`);
        const o = this.nonNull(this.eval(e.obj) as JArray | null, `read field "${e.name}"`, e.line);
        return o.data.length;
      }
      case 'index': {
        const a = this.nonNull(this.eval(e.arr) as JArray | null, 'load from array', e.line);
        const i = this.eval(e.idx) as number;
        this.checkIndex(a, i, e.line);
        this.hl.push({ arr: a.id, idx: i });
        return a.data[i] as JValue;
      }
      case 'call': return this.call(e);
      case 'new': return this.construct(e);
      case 'newarr': {
        if (e.init) return this.arrayInit(e.init, e.ty!);
        const dims = e.dimExprs.map(d => this.eval(d) as number);
        return this.newArray(this.baseType(e.base), dims, e.extraDims, e.line);
      }
      case 'arrinit': return this.arrayInit(e, e.ty!);
      case 'unary': {
        const v = this.eval(e.e);
        const t = e.ty!;
        if (e.op === '!') return !v;
        const pv = this.coerce(v, e.e.ty!, t);
        if (e.op === '+') return pv;
        if (e.op === '~') return typeof pv === 'bigint' ? BigInt.asIntN(64, ~pv) : ~(pv as number);
        if (typeof pv === 'bigint') return BigInt.asIntN(64, -pv);
        if (t.k === 'prim' && t.n === 'int') return (-(pv as number)) | 0;
        if (t.k === 'prim' && t.n === 'float') return Math.fround(-(pv as number));
        return -(pv as number);
      }
      case 'incdec': {
        const tt = e.target.ty!;
        const old = this.eval(e.target);
        let nv: JValue;
        if (typeof old === 'bigint') nv = BigInt.asIntN(64, e.op === '++' ? old + 1n : old - 1n);
        else {
          const x = (old as number) + (e.op === '++' ? 1 : -1);
          nv = this.coerce(x, T.double, tt);
          if (tt.k === 'prim' && (tt.n === 'double')) nv = x;
          if (tt.k === 'prim' && tt.n === 'float') nv = Math.fround(x);
          if (tt.k === 'prim' && tt.n === 'int') nv = x | 0;
        }
        this.store(e.target, nv);
        return e.prefix ? nv : old;
      }
      case 'bin': return this.binary(e);
      case 'assign': return this.assign(e);
      case 'cond': return this.eval(e.c) ? this.coerce(this.eval(e.a), e.a.ty!, e.ty!) : this.coerce(this.eval(e.b), e.b.ty!, e.ty!);
      case 'cast': {
        const v = this.eval(e.e);
        const to = e.ty!;
        return this.coerce(v, e.e.ty!, to);
      }
    }
  }

  private baseType(b: string): JType {
    switch (b) {
      case 'int': return T.int; case 'double': return T.double; case 'char': return T.char; case 'boolean': return T.boolean;
      case 'long': return T.long; case 'float': return T.float; case 'byte': return T.byte; case 'short': return T.short;
      case 'String': return T.String; default: return { k: 'obj', n: b as 'Scanner' };
    }
  }

  private store(target: Expr, v: JValue) {
    if (target.kind === 'name') {
      const s = this.findSlot(target.name);
      s.v = v;
      this.writes.push(target.name);
      return;
    }
    if (target.kind === 'index') {
      const a = this.nonNull(this.eval(target.arr) as JArray | null, 'store to array', target.line);
      const i = this.eval(target.idx) as number;
      this.checkIndex(a, i, target.line);
      a.data[i] = v;
      this.hl.push({ arr: a.id, idx: i, write: true });
      if (target.arr.kind === 'name') this.writes.push(`${target.arr.name}[${i}]`);
      return;
    }
    throw new JavaThrow('java.lang.Error', 'cannot assign to this expression', target.line);
  }

  private assign(e: Expr & { kind: 'assign' }): JValue {
    const tt = e.target.ty!;
    if (e.op === '=') {
      // Java evaluates the array reference and index before the right-hand side.
      if (e.target.kind === 'index') {
        const a = this.nonNull(this.eval(e.target.arr) as JArray | null, 'store to array', e.line);
        const i = this.eval(e.target.idx) as number;
        const v = this.coerce(this.eval(e.value), e.value.ty!, tt);
        this.checkIndex(a, i, e.line);
        a.data[i] = v;
        this.hl.push({ arr: a.id, idx: i, write: true });
        if (e.target.arr.kind === 'name') this.writes.push(`${e.target.arr.name}[${i}]`);
        return v;
      }
      const v = this.coerce(this.eval(e.value), e.value.ty!, tt);
      this.store(e.target, v);
      return v;
    }
    // compound: E1 op= E2  ≡  E1 = (T)((E1) op (E2)), E1 evaluated once
    let a: JArray | null = null; let idx = 0;
    let old: JValue;
    if (e.target.kind === 'index') {
      a = this.nonNull(this.eval(e.target.arr) as JArray | null, 'load from array', e.line);
      idx = this.eval(e.target.idx) as number;
      this.checkIndex(a, idx, e.line);
      old = a.data[idx] as JValue;
    } else old = this.eval(e.target);
    const rv = this.eval(e.value);
    const op = e.op.slice(0, -1);
    let res: JValue;
    if (e.opType!.k === 'String') res = new JStr(jToString(old, tt) + jToString(rv, e.value.ty!));
    else res = this.coerce(this.arith(op, old, tt, rv, e.value.ty!, e.opType!, e.line), e.opType!, tt);
    if (a) { a.data[idx] = res; this.hl.push({ arr: a.id, idx, write: true }); if (e.target.kind === 'index' && e.target.arr.kind === 'name') this.writes.push(`${e.target.arr.name}[${idx}]`); }
    else this.store(e.target, res);
    return res;
  }

  private arith(op: string, l: JValue, lt: JType, r: JValue, rt: JType, ot: JType, line: number): JValue {
    if (ot.k === 'prim' && ot.n === 'boolean') {
      const a = l as boolean, b = r as boolean;
      if (op === '&') return a && b; if (op === '|') return a || b; if (op === '^') return a !== b;
    }
    const n = (ot as { n: string }).n;
    if (op === '<<' || op === '>>' || op === '>>>') {
      const lv = this.coerce(l, lt, ot);
      const sh = Number(typeof r === 'bigint' ? r : r as number);
      if (typeof lv === 'bigint') {
        const s = BigInt(sh & 63);
        if (op === '<<') return BigInt.asIntN(64, lv << s);
        if (op === '>>') return lv >> s;
        return BigInt.asIntN(64, BigInt.asUintN(64, lv) >> s);
      }
      const x = lv as number, s = sh & 31;
      if (op === '<<') return x << s; if (op === '>>') return x >> s; return (x >>> s) | 0;
    }
    const a = this.coerce(l, lt, ot), b = this.coerce(r, rt, ot);
    if (n === 'long') {
      const x = a as bigint, y = b as bigint;
      switch (op) {
        case '+': return BigInt.asIntN(64, x + y); case '-': return BigInt.asIntN(64, x - y); case '*': return BigInt.asIntN(64, x * y);
        case '/': if (y === 0n) throw new JavaThrow('java.lang.ArithmeticException', '/ by zero', line); return BigInt.asIntN(64, x / y);
        case '%': if (y === 0n) throw new JavaThrow('java.lang.ArithmeticException', '/ by zero', line); return x % y;
        case '&': return x & y; case '|': return x | y; case '^': return x ^ y;
      }
    }
    const x = a as number, y = b as number;
    if (n === 'int') {
      switch (op) {
        case '+': return (x + y) | 0; case '-': return (x - y) | 0; case '*': return Math.imul(x, y);
        case '/': if (y === 0) throw new JavaThrow('java.lang.ArithmeticException', '/ by zero', line); return (x / y) | 0;
        case '%': if (y === 0) throw new JavaThrow('java.lang.ArithmeticException', '/ by zero', line); return (x % y) | 0;
        case '&': return x & y; case '|': return x | y; case '^': return x ^ y;
      }
    }
    let res: number;
    switch (op) {
      case '+': res = x + y; break; case '-': res = x - y; break; case '*': res = x * y; break;
      case '/': res = x / y; break; case '%': res = x % y; break;
      default: throw new JavaThrow('java.lang.Error', 'bad operator ' + op, line);
    }
    return n === 'float' ? Math.fround(res) : res;
  }

  private binary(e: Expr & { kind: 'bin' }): JValue {
    const op = e.op;
    if (op === '&&') return (this.eval(e.l) as boolean) ? (this.eval(e.r) as boolean) : false;
    if (op === '||') return (this.eval(e.l) as boolean) ? true : (this.eval(e.r) as boolean);
    const l = this.eval(e.l), r = this.eval(e.r);
    const lt = e.l.ty!, rt = e.r.ty!, ot = e.opType!;
    if (op === '+' && ot.k === 'String') return e.cstr !== undefined ? JStr.intern(e.cstr) : new JStr(jToString(l, lt) + jToString(r, rt));
    if (op === '==' || op === '!=') {
      let eq: boolean;
      if (ot.k === 'prim' && ot.n !== 'boolean') {
        const a = this.coerce(l, lt, ot), b = this.coerce(r, rt, ot);
        eq = a === b;
      } else eq = l === r;
      return op === '==' ? eq : !eq;
    }
    if (op === '<' || op === '>' || op === '<=' || op === '>=') {
      const a = this.coerce(l, lt, ot) as number | bigint, b = this.coerce(r, rt, ot) as number | bigint;
      switch (op) { case '<': return a < b; case '>': return a > b; case '<=': return a <= b; default: return a >= b; }
    }
    return this.arith(op, l, lt, r, rt, ot, e.line);
  }

  // ------------------------------------------------------------------ calls
  private call(e: Expr & { kind: 'call' }): JValue {
    const res = e.resolved!;
    if (res.startsWith('user:')) return this.callUser(e, res.slice(5));
    if (res.startsWith('static:')) return this.callStatic(e, res.slice(7));
    return this.callInstance(e, res.slice(5));
  }

  private callUser(e: Expr & { kind: 'call' }, sig: string): JValue {
    const m = this.methods.get(sig)!;
    const args = e.args.map((a, i) => this.coerce(this.eval(a), a.ty!, m.params[i].ty!));
    if (this.frames.length >= this.maxDepth) throw new JavaThrow('java.lang.StackOverflowError', '', e.line);
    const scope = new Map<string, Slot>();
    m.params.forEach((p, i) => scope.set(p.name, { v: args[i], ty: p.ty! }));
    const callerLine = this.curLine;
    const argText = m.params.map((p, i) => `${p.name} = ${this.show(args[i], p.ty!)}`).join(', ');
    this.frames.push({ m, scopes: [scope], line: m.line, ret: null });
    this.writes.push(...m.params.map(p => p.name));
    this.step(m.line, 'call', () => `Call ${m.name}(${args.map((a, i) => this.show(a, m.params[i].ty!)).join(', ')}) — a new frame is pushed${argText ? ` with ${argText}` : ''}.`);
    let ret: JValue = null;
    try {
      const r = this.execBlock(m.body.body, false);
      ret = this.frame.ret;
      if (r !== RETURN && m.retTy!.k !== 'void') throw new JavaThrow('java.lang.Error', `missing return in ${m.name}`, m.endLine);
    } finally {
      this.frames.pop();
    }
    this.curLine = callerLine;
    if (this.frames.length) this.frame.line = callerLine;
    const callText = `${m.name}(${args.map((a, i) => this.show(a, m.params[i].ty!)).join(', ')})`;
    this.step(callerLine, 'return', () => m.retTy!.k === 'void' ? `Back in ${this.frame.m.name}: ${callText} has finished.` : `Back in ${this.frame.m.name}: ${callText} returned ${this.show(ret, m.retTy!)}.`);
    return ret;
  }

  private str(v: JValue, line: number, what = 'call a String method'): string { return this.nonNull(v as JStr | null, what, line).v; }

  private staticField(key: string): JValue {
    switch (key) {
      case 'Math.PI': return Math.PI; case 'Math.E': return Math.E;
      case 'Integer.MAX_VALUE': return 2147483647; case 'Integer.MIN_VALUE': return -2147483648;
      case 'Long.MAX_VALUE': return 9223372036854775807n; case 'Long.MIN_VALUE': return -9223372036854775808n;
      case 'Double.MAX_VALUE': return Number.MAX_VALUE; case 'Double.MIN_VALUE': return Number.MIN_VALUE;
      case 'System.out': return { printStream: true } as unknown as JValue;
      case 'System.in': return { inputStream: true } as unknown as JValue;
    }
    throw new JavaThrow('java.lang.Error', 'unknown field ' + key, this.curLine);
  }

  private parseIntStrict(s: string, line: number, radix = 10): number {
    if (!/^[+-]?\d+$/.test(s)) throw new JavaThrow('java.lang.NumberFormatException', `For input string: "${s}"`, line);
    const v = parseInt(s, radix);
    if (v > 2147483647 || v < -2147483648) throw new JavaThrow('java.lang.NumberFormatException', `For input string: "${s}"`, line);
    return v;
  }
  private parseDoubleStrict(s: string, line: number): number {
    const t = s.trim();
    if (!/^[+-]?(\d+\.?\d*([eE][+-]?\d+)?|\.\d+([eE][+-]?\d+)?|NaN|Infinity)[dDfF]?$/.test(t)) throw new JavaThrow('java.lang.NumberFormatException', t === '' ? 'empty String' : `For input string: "${s}"`, line);
    return parseFloat(t.replace(/[dDfF]$/, ''));
  }

  private callStatic(e: Expr & { kind: 'call' }, key: string): JValue {
    const args = e.args.map(a => this.eval(a));
    const ats = e.args.map(a => a.ty!);
    const L = e.line;
    const num = (i: number, to: JType = T.double) => this.coerce(args[i], ats[i], to) as number;
    switch (key) {
      case 'Math.abs': {
        const t = e.ty!; const v = this.coerce(args[0], ats[0], t);
        if (typeof v === 'bigint') return v < 0n ? BigInt.asIntN(64, -v) : v;
        if (t.k === 'prim' && t.n === 'int') return v === -2147483648 ? v : Math.abs(v as number);
        return Math.abs(v as number);
      }
      case 'Math.max': case 'Math.min': {
        const t = e.ty!; const a = this.coerce(args[0], ats[0], t), b = this.coerce(args[1], ats[1], t);
        if (typeof a === 'bigint') return key === 'Math.max' ? (a > (b as bigint) ? a : b) : (a < (b as bigint) ? a : b);
        return key === 'Math.max' ? Math.max(a as number, b as number) : Math.min(a as number, b as number);
      }
      case 'Math.pow': return Math.pow(num(0), num(1));
      case 'Math.sqrt': return Math.sqrt(num(0));
      case 'Math.cbrt': return Math.cbrt(num(0));
      case 'Math.floor': return Math.floor(num(0));
      case 'Math.ceil': return Math.ceil(num(0));
      case 'Math.round': {
        const x = num(0);
        if (e.ty!.k === 'prim' && e.ty!.n === 'int') return Number.isNaN(x) ? 0 : d2i(Math.floor(x + 0.5));
        return Number.isNaN(x) ? 0n : d2l(Math.floor(x + 0.5));
      }
      case 'Math.random': return this.mathRandom.nextDouble();
      case 'Math.hypot': return Math.hypot(num(0), num(1));
      case 'Math.exp': return Math.exp(num(0));
      case 'Math.log': return Math.log(num(0));
      case 'Math.log10': return Math.log10(num(0));
      case 'Math.sin': return Math.sin(num(0)); case 'Math.cos': return Math.cos(num(0)); case 'Math.tan': return Math.tan(num(0));
      case 'Math.toRadians': return num(0) / 180 * Math.PI;
      case 'Math.toDegrees': return num(0) * 180 / Math.PI;
      case 'Math.signum': return Math.sign(num(0));
      case 'Math.floorDiv': { const a = num(0, T.int), b = num(1, T.int); if (b === 0) throw new JavaThrow('java.lang.ArithmeticException', '/ by zero', L); return Math.floor(a / b) | 0; }
      case 'Math.floorMod': { const a = num(0, T.int), b = num(1, T.int); if (b === 0) throw new JavaThrow('java.lang.ArithmeticException', '/ by zero', L); return (((a % b) + b) % b) | 0; }
      case 'Integer.parseInt': return this.parseIntStrict(this.str(args[0], L, 'parse null'), L);
      case 'Integer.valueOf': return ats[0].k === 'String' ? this.parseIntStrict(this.str(args[0], L), L) : args[0];
      case 'Integer.toString': return new JStr(String(args[0]));
      case 'Integer.toBinaryString': return new JStr(((args[0] as number) >>> 0).toString(2));
      case 'Integer.max': return Math.max(args[0] as number, args[1] as number);
      case 'Integer.min': return Math.min(args[0] as number, args[1] as number);
      case 'Long.parseLong': { const s = this.str(args[0], L); if (!/^[+-]?\d+$/.test(s)) throw new JavaThrow('java.lang.NumberFormatException', `For input string: "${s}"`, L); return BigInt.asIntN(64, BigInt(s)); }
      case 'Double.parseDouble': case 'Double.valueOf': return this.parseDoubleStrict(this.str(args[0], L), L);
      case 'Double.toString': return new JStr(javaFloatingToString(num(0)));
      case 'String.valueOf': return new JStr(ats[0].k === 'array' && (ats[0] as { of: JType }).of.k === 'prim' && ((ats[0] as { of: { n: string } }).of.n === 'char') ? (args[0] as JArray).data.map(c => charStr(c as number)).join('') : jToString(args[0], ats[0]));
      case 'String.format': return new JStr(this.format(args, ats, L));
      case 'Character.isDigit': return /[0-9]/.test(charStr(args[0] as number));
      case 'Character.isLetter': return /\p{L}/u.test(charStr(args[0] as number));
      case 'Character.isLetterOrDigit': return /[\p{L}0-9]/u.test(charStr(args[0] as number));
      case 'Character.isAlphabetic': return /\p{L}/u.test(charStr(args[0] as number));
      case 'Character.isUpperCase': return /\p{Lu}/u.test(charStr(args[0] as number));
      case 'Character.isLowerCase': return /\p{Ll}/u.test(charStr(args[0] as number));
      case 'Character.isWhitespace': return /[\s]/.test(charStr(args[0] as number)) && (args[0] as number) !== 160;
      case 'Character.toUpperCase': return charStr(args[0] as number).toUpperCase().charCodeAt(0);
      case 'Character.toLowerCase': return charStr(args[0] as number).toLowerCase().charCodeAt(0);
      case 'Character.getNumericValue': { const c = charStr(args[0] as number); if (/[0-9]/.test(c)) return c.charCodeAt(0) - 48; if (/[a-z]/i.test(c)) return c.toLowerCase().charCodeAt(0) - 87; return -1; }
      case 'Character.toString': return new JStr(charStr(args[0] as number));
      case 'Arrays.toString': {
        const a = args[0] as JArray | null;
        if (a === null) return JStr.intern('null');
        return new JStr('[' + a.data.map(x => jToString(x as JValue, a.elemType)).join(', ') + ']');
      }
      case 'Arrays.deepToString': {
        const deep = (a: JArray | null): string => a === null ? 'null' : '[' + a.data.map(x => x instanceof JArray ? deep(x) : jToString(x as JValue, a.elemType)).join(', ') + ']';
        return new JStr(deep(args[0] as JArray | null));
      }
      case 'Arrays.sort': {
        const a = this.nonNull(args[0] as JArray | null, 'sort', L);
        const et = a.elemType;
        if (et.k === 'String') a.data.sort((x, y) => { const s = (x as JStr).v, t = (y as JStr).v; return s < t ? -1 : s > t ? 1 : 0; });
        else if (et.k === 'prim' && et.n === 'long') a.data.sort((x, y) => ((x as bigint) < (y as bigint) ? -1 : (x as bigint) > (y as bigint) ? 1 : 0));
        else a.data.sort((x, y) => (x as number) - (y as number));
        this.writes.push(e.args[0].kind === 'name' ? e.args[0].name : 'array');
        return null;
      }
      case 'Arrays.fill': { const a = this.nonNull(args[0] as JArray | null, 'fill', L); const v = this.coerce(args[1], ats[1], a.elemType); a.data.fill(v); return null; }
      case 'Arrays.copyOf': {
        const a = this.nonNull(args[0] as JArray | null, 'copy', L); const n = args[1] as number;
        if (n < 0) throw new JavaThrow('java.lang.NegativeArraySizeException', String(n), L);
        const data = new Array(n); for (let i = 0; i < n; i++) data[i] = i < a.data.length ? a.data[i] : defaultValue(a.elemType);
        return new JArray(a.elemType, data);
      }
      case 'Arrays.equals': {
        const a = args[0] as JArray | null, b = args[1] as JArray | null;
        if (a === b) return true; if (!a || !b || a.data.length !== b.data.length) return false;
        return a.data.every((x, i) => (x instanceof JStr && b.data[i] instanceof JStr) ? x.v === (b.data[i] as JStr).v : x === b.data[i]);
      }
      case 'System.exit': throw new ExitSignal(args[0] as number);
      case 'System.currentTimeMillis': return 1758240000000n;
    }
    throw new JavaThrow('java.lang.Error', 'unsupported method ' + key, L);
  }

  private format(args: JValue[], ats: JType[], line: number): string {
    const fmt = this.str(args[0], line, 'format a null String');
    try {
      return javaFormat(fmt, args.slice(1).map((v, i) => ({ v, t: ats[i + 1] })));
    } catch (err) {
      if (err instanceof FormatError) throw new JavaThrow(err.javaName, err.message, line);
      throw err;
    }
  }

  private emit(s: string) { this.out.push(s); this.outLen += s.length; if (this.outLen > 400_000) throw new LimitHit('Output too long (over 400,000 characters) — the program is probably stuck printing in a loop.', this.curLine); }

  private printable(v: JValue, t: JType): string {
    if (t.k === 'array' && t.of.k === 'prim' && t.of.n === 'char' && v instanceof JArray) return v.data.map(c => charStr(c as number)).join('');
    if (v instanceof JArray) return arrayIdentity(v);
    return jToString(v, t);
  }

  // ------------------------------------------------------------------ Scanner
  private skipWs() { while (this.inPos < this.stdin.length && /\s/.test(this.stdin[this.inPos])) this.inPos++; }
  private peekToken(): string | null {
    let p = this.inPos;
    while (p < this.stdin.length && /\s/.test(this.stdin[p])) p++;
    if (p >= this.stdin.length) return null;
    let q = p; while (q < this.stdin.length && !/\s/.test(this.stdin[q])) q++;
    return this.stdin.slice(p, q);
  }
  private takeToken(line: number): string {
    this.skipWs();
    if (this.inPos >= this.stdin.length) throw new JavaThrow('java.util.NoSuchElementException', '', line);
    const s = this.inPos; while (this.inPos < this.stdin.length && !/\s/.test(this.stdin[this.inPos])) this.inPos++;
    return this.stdin.slice(s, this.inPos);
  }
  private scannerCall(name: string, line: number): JValue {
    switch (name) {
      case 'nextInt': {
        const tok = this.peekToken();
        if (tok === null) throw new JavaThrow('java.util.NoSuchElementException', '', line);
        if (!/^[+-]?\d+$/.test(tok) || Math.abs(parseInt(tok, 10)) > 2147483648 || parseInt(tok, 10) > 2147483647) throw new JavaThrow('java.util.InputMismatchException', `For input string: "${tok}"`, line);
        this.takeToken(line); return parseInt(tok, 10);
      }
      case 'nextLong': {
        const tok = this.peekToken();
        if (tok === null) throw new JavaThrow('java.util.NoSuchElementException', '', line);
        if (!/^[+-]?\d+$/.test(tok)) throw new JavaThrow('java.util.InputMismatchException', `For input string: "${tok}"`, line);
        this.takeToken(line); return BigInt.asIntN(64, BigInt(tok));
      }
      case 'nextDouble': case 'nextFloat': {
        const tok = this.peekToken();
        if (tok === null) throw new JavaThrow('java.util.NoSuchElementException', '', line);
        if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(tok)) throw new JavaThrow('java.util.InputMismatchException', `For input string: "${tok}"`, line);
        this.takeToken(line); const v = parseFloat(tok); return name === 'nextFloat' ? Math.fround(v) : v;
      }
      case 'nextBoolean': {
        const tok = this.peekToken();
        if (tok === null) throw new JavaThrow('java.util.NoSuchElementException', '', line);
        if (!/^(true|false)$/i.test(tok)) throw new JavaThrow('java.util.InputMismatchException', `For input string: "${tok}"`, line);
        this.takeToken(line); return tok.toLowerCase() === 'true';
      }
      case 'next': return new JStr(this.takeToken(line));
      case 'nextLine': {
        if (this.inPos >= this.stdin.length) throw new JavaThrow('java.util.NoSuchElementException', 'No line found', line);
        const nl = this.stdin.indexOf('\n', this.inPos);
        const end = nl < 0 ? this.stdin.length : nl;
        const s = this.stdin.slice(this.inPos, end);
        this.inPos = nl < 0 ? this.stdin.length : nl + 1;
        return new JStr(s);
      }
      case 'hasNext': return this.peekToken() !== null;
      case 'hasNextInt': { const t = this.peekToken(); return t !== null && /^[+-]?\d+$/.test(t) && parseInt(t, 10) <= 2147483647 && parseInt(t, 10) >= -2147483648; }
      case 'hasNextDouble': { const t = this.peekToken(); return t !== null && /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(t); }
      case 'hasNextLine': return this.inPos < this.stdin.length;
      case 'close': return null;
    }
    throw new JavaThrow('java.lang.Error', 'unsupported Scanner method ' + name, line);
  }

  private construct(e: Expr & { kind: 'new' }): JValue {
    const args = e.args.map(a => this.eval(a));
    switch (e.type.base) {
      case 'Scanner': return new JScanner() as unknown as JValue;
      case 'Random': return new JRandom(args.length ? (typeof args[0] === 'bigint' ? args[0] : BigInt(args[0] as number)) : 42n) as unknown as JValue;
      case 'String': {
        if (!args.length) return new JStr('');
        const a = args[0];
        if (a instanceof JArray) return new JStr(a.data.map(c => charStr(c as number)).join(''));
        return new JStr(this.str(a, e.line));
      }
      case 'StringBuilder': return new JStringBuilder(args.length && args[0] instanceof JStr ? args[0].v : '');
    }
    throw new JavaThrow('java.lang.Error', 'cannot construct ' + e.type.base, e.line);
  }

  private callInstance(e: Expr & { kind: 'call' }, key: string): JValue {
    const [cls, name] = key.split('.');
    const L = e.line;
    if (cls === 'PrintStream') {
      this.eval(e.target!);
      const args = e.args.map(a => this.eval(a));
      const ats = e.args.map(a => a.ty!);
      if (name === 'println') this.emit((args.length ? this.printable(args[0], ats[0]) : '') + '\n');
      else if (name === 'print') this.emit(this.printable(args[0], ats[0]));
      else this.emit(this.format(args, ats, L));
      return null;
    }
    const recv = this.eval(e.target!);
    if (recv === null) throw new JavaThrow('java.lang.NullPointerException', `Cannot invoke "${cls}.${name}()" because the value is null`, L);
    const args = e.args.map(a => this.eval(a));
    const ats = e.args.map(a => a.ty!);
    if (cls === 'Scanner') return this.scannerCall(name, L);
    if (cls === 'Random') {
      const r = recv as unknown as JRandom;
      if (name === 'nextInt') return args.length ? r.nextInt(args[0] as number, L) : r.nextInt();
      if (name === 'nextDouble') return r.nextDouble();
      return r.nextBoolean();
    }
    if (cls === 'StringBuilder') {
      const sb = recv as JStringBuilder;
      switch (name) {
        case 'append': sb.s += this.printable(args[0], ats[0]); return sb;
        case 'toString': return new JStr(sb.s);
        case 'length': return sb.s.length;
        case 'reverse': sb.s = [...sb.s].reverse().join(''); return sb;
        case 'charAt': { const i = args[0] as number; if (i < 0 || i >= sb.s.length) throw new JavaThrow('java.lang.StringIndexOutOfBoundsException', `index ${i},length ${sb.s.length}`, L); return sb.s.charCodeAt(i); }
        case 'insert': { const i = args[0] as number; sb.s = sb.s.slice(0, i) + this.printable(args[1], ats[1]) + sb.s.slice(i); return sb; }
        case 'setCharAt': { const i = args[0] as number; sb.s = sb.s.slice(0, i) + charStr(args[1] as number) + sb.s.slice(i + 1); return null; }
        case 'deleteCharAt': { const i = args[0] as number; sb.s = sb.s.slice(0, i) + sb.s.slice(i + 1); return sb; }
      }
    }
    // String
    const s = (recv as JStr).v;
    const strArg = (i: number) => ats[i].k === 'String' ? this.str(args[i], L, 'use a null String') : charStr(args[i] as number);
    const sioobe = (msg: string) => new JavaThrow('java.lang.StringIndexOutOfBoundsException', msg, L);
    switch (name) {
      case 'length': return s.length;
      case 'charAt': {
        const i = args[0] as number;
        if (i < 0 || i >= s.length) throw sioobe(`Index ${i} out of bounds for length ${s.length}`);
        this.hl.push({ str: s, strIdx: i });
        return s.charCodeAt(i);
      }
      case 'substring': {
        const b = args[0] as number; const en = args.length > 1 ? args[1] as number : s.length;
        if (b < 0 || en > s.length || b > en) throw sioobe(`begin ${b}, end ${en}, length ${s.length}`);
        return b === 0 && en === s.length ? recv : new JStr(s.slice(b, en));
      }
      case 'indexOf': return args.length > 1 ? s.indexOf(strArg(0), Math.max(0, args[1] as number)) : s.indexOf(strArg(0));
      case 'lastIndexOf': {
        if (args.length > 1) { const from = args[1] as number; if (from < 0) return -1; return s.lastIndexOf(strArg(0), from); }
        return s.lastIndexOf(strArg(0));
      }
      case 'equals': return args[0] instanceof JStr && args[0].v === s;
      case 'equalsIgnoreCase': return args[0] instanceof JStr && args[0].v.toLowerCase() === s.toLowerCase();
      case 'compareTo': case 'compareToIgnoreCase': {
        let a = s, b = this.str(args[0], L);
        if (name === 'compareToIgnoreCase') { a = a.toLowerCase(); b = b.toLowerCase(); }
        const n = Math.min(a.length, b.length);
        for (let i = 0; i < n; i++) if (a.charCodeAt(i) !== b.charCodeAt(i)) return a.charCodeAt(i) - b.charCodeAt(i);
        return a.length - b.length;
      }
      case 'toUpperCase': return new JStr(s.toUpperCase());
      case 'toLowerCase': return new JStr(s.toLowerCase());
      case 'trim': { const t = s.replace(/^[\x00-\x20]+|[\x00-\x20]+$/g, ''); return t === s ? recv : new JStr(t); }
      case 'strip': return new JStr(s.trim());
      case 'isEmpty': return s.length === 0;
      case 'isBlank': return s.trim().length === 0;
      case 'contains': return s.includes(this.str(args[0], L));
      case 'startsWith': return s.startsWith(this.str(args[0], L));
      case 'endsWith': return s.endsWith(this.str(args[0], L));
      case 'replace': {
        if ((ats[0].k === 'String') !== (ats[1].k === 'String')) throw new CompileError('no suitable method found for replace — use two chars or two Strings', L, 1);
        return new JStr(s.split(strArg(0)).join(strArg(1)));
      }
      case 'replaceAll': return new JStr(s.replace(new RegExp(this.str(args[0], L), 'g'), this.str(args[1], L).replace(/\$(\d)/g, '$$$1')));
      case 'concat': return new JStr(s + this.str(args[0], L));
      case 'repeat': { const n = args[0] as number; if (n < 0) throw new JavaThrow('java.lang.IllegalArgumentException', 'count is negative: ' + n, L); return new JStr(s.repeat(n)); }
      case 'split': {
        const re = this.str(args[0], L);
        let parts = s.split(new RegExp(re));
        if (s.length === 0) parts = [''];
        else {
          // Java removes a leading empty string produced by a zero-width match at 0, and trailing empty strings
          if (parts.length > 1 && parts[0] === '' && new RegExp('^(?:' + re + ')').exec(s)?.[0] === '') parts.shift();
          while (parts.length > 1 && parts[parts.length - 1] === '') parts.pop();
          if (parts.length === 1 && parts[0] === '' ) parts = [];
        }
        return new JArray(T.String, parts.map(p => new JStr(p)));
      }
      case 'toCharArray': return new JArray(T.char, [...s].map(c => c.charCodeAt(0)));
      case 'matches': return new RegExp('^(?:' + this.str(args[0], L) + ')$').test(s);
    }
    throw new JavaThrow('java.lang.Error', `unsupported String method ${name}`, L);
  }
}

export { isNumeric };
