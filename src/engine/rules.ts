import { parse } from './java/parser';
import { Checker } from './java/checker';
import type { Expr, MethodDecl, Stmt } from './java/ast';

/** Exam restrictions that are checked against the learner's syntax tree, not just their output. */
export interface Rules {
  /** Midterm digit problems: no String/array variables and no String-conversion helpers. */
  noStringsOrArrays?: boolean;
  /** No for / while / do-while anywhere. */
  noLoops?: boolean;
  /** Do not use the / and % operators. */
  noDivMod?: boolean;
  /** Calls that are not allowed, e.g. "Integer.parseInt", "Arrays.sort". */
  forbidCalls?: string[];
  /** This method must exist, call itself, and contain no loops. */
  recursive?: string;
  /** These methods must be declared as static methods and be called. */
  requireMethods?: string[];
}

const STRING_HELPERS = ['charAt', 'toCharArray', 'split', 'substring', 'String.valueOf', 'Integer.toString', 'Integer.parseInt', 'length', 'Integer.toBinaryString'];

function walkStmt(s: Stmt, fs: (s: Stmt) => void, fe: (e: Expr) => void) {
  fs(s);
  const E = (e: Expr | null | undefined) => { if (e) walkExpr(e, fe); };
  switch (s.kind) {
    case 'vardecl': s.decls.forEach(d => E(d.init)); break;
    case 'expr': E(s.e); break;
    case 'if': E(s.c); walkStmt(s.then, fs, fe); if (s.els) walkStmt(s.els, fs, fe); break;
    case 'while': case 'dowhile': E(s.c); walkStmt(s.body, fs, fe); break;
    case 'for': s.init.forEach(x => walkStmt(x, fs, fe)); E(s.c); s.update.forEach(E); walkStmt(s.body, fs, fe); break;
    case 'foreach': E(s.iter); walkStmt(s.body, fs, fe); break;
    case 'switch': E(s.e); s.cases.forEach(c => c.body.forEach(x => walkStmt(x, fs, fe))); break;
    case 'return': E(s.e); break;
    case 'block': s.body.forEach(x => walkStmt(x, fs, fe)); break;
    default: break;
  }
}
function walkExpr(e: Expr, fe: (e: Expr) => void) {
  fe(e);
  const W = (x: Expr | null | undefined) => { if (x) walkExpr(x, fe); };
  switch (e.kind) {
    case 'field': W(e.obj); break;
    case 'index': W(e.arr); W(e.idx); break;
    case 'call': W(e.target); e.args.forEach(W); break;
    case 'new': e.args.forEach(W); break;
    case 'newarr': e.dimExprs.forEach(W); W(e.init); break;
    case 'arrinit': e.elems.forEach(W); break;
    case 'unary': W(e.e); break;
    case 'incdec': W(e.target); break;
    case 'bin': W(e.l); W(e.r); break;
    case 'assign': W(e.target); W(e.value); break;
    case 'cond': W(e.c); W(e.a); W(e.b); break;
    case 'cast': W(e.e); break;
    default: break;
  }
}

function callName(e: Expr & { kind: 'call' }): string {
  if (!e.target) return e.name;
  if (e.target.kind === 'name') return `${e.target.name}.${e.name}`;
  return e.name;
}

/** Returns human-readable rule violations (empty = all rules satisfied). Assumes the code compiles. */
export function checkRules(source: string, rules: Rules | undefined): string[] {
  if (!rules) return [];
  let prog;
  try { prog = parse(source); new Checker(prog).check(); } catch { return []; }
  const out = new Set<string>();
  const methods = new Map<string, MethodDecl>();
  for (const m of prog.methods) methods.set(m.name, m);

  for (const m of prog.methods) {
    const isMain = m.name === 'main';
    for (const p of m.params) {
      if (rules.noStringsOrArrays && !isMain && p.ty && (p.ty.k === 'String' || p.ty.k === 'array')) out.add('This problem does not allow Strings or arrays.');
    }
    walkStmt(m.body, s => {
      if (rules.noLoops && (s.kind === 'for' || s.kind === 'while' || s.kind === 'dowhile' || s.kind === 'foreach')) out.add('This problem must be solved without any loops.');
      if (rules.noStringsOrArrays && s.kind === 'vardecl' && s.decls.some(d => d.ty && (d.ty.k === 'String' || d.ty.k === 'array'))) {
        out.add('This problem does not allow String or array variables — work with the digits arithmetically (% and /).');
      }
    }, e => {
      if (e.kind === 'call') {
        const n = callName(e);
        if (rules.forbidCalls?.some(f => f === n || f === e.name)) out.add(`${n}(...) is not allowed in this problem.`);
        if (rules.noStringsOrArrays && e.target && e.target.ty?.k === 'String' && STRING_HELPERS.includes(e.name)) out.add('This problem does not allow String methods — use % and / on the number instead.');
        if (rules.noStringsOrArrays && STRING_HELPERS.includes(n)) out.add(`${n}(...) is not allowed — this problem must be solved arithmetically.`);
      }
      if (e.kind === 'newarr' && rules.noStringsOrArrays) out.add('This problem does not allow arrays.');
      if (rules.noDivMod && ((e.kind === 'bin' && (e.op === '/' || e.op === '%')) || (e.kind === 'assign' && (e.op === '/=' || e.op === '%=')))) out.add('The / and % operators are not allowed in this problem.');
    });
  }

  if (rules.recursive) {
    const m = methods.get(rules.recursive);
    if (!m) out.add(`Write a method named ${rules.recursive}.`);
    else {
      let calls = false, loops = false;
      walkStmt(m.body, s => { if (s.kind === 'for' || s.kind === 'while' || s.kind === 'dowhile' || s.kind === 'foreach') loops = true; },
        e => { if (e.kind === 'call' && !e.target && e.name === m.name) calls = true; });
      if (!calls) out.add(`${m.name} must be recursive — it has to call itself.`);
      if (loops) out.add(`${m.name} must not use a loop — solve it with recursion.`);
    }
  }
  for (const name of rules.requireMethods ?? []) {
    const m = methods.get(name);
    if (!m) { out.add(`Write and use a method named ${name}.`); continue; }
    let used = false;
    for (const other of prog.methods) {
      if (other === m) continue;
      walkStmt(other.body, () => {}, e => { if (e.kind === 'call' && !e.target && e.name === name) used = true; });
    }
    if (!used) out.add(`The method ${name} is declared but never called.`);
  }
  return [...out];
}
