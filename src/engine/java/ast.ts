/** AST and static types for the CSE110 Java subset. */

export type PrimName = 'byte' | 'short' | 'int' | 'long' | 'float' | 'double' | 'char' | 'boolean';

export type JType =
  | { k: 'prim'; n: PrimName }
  | { k: 'String' }
  | { k: 'array'; of: JType }
  | { k: 'null' }
  | { k: 'void' }
  | { k: 'obj'; n: 'Scanner' | 'Random' | 'Object' | 'PrintStream' | 'InputStream' | 'StringBuilder' }
  /** A class name used as a static qualifier, e.g. Math in Math.max. */
  | { k: 'static'; n: string };

export const T = {
  int: { k: 'prim', n: 'int' } as JType,
  long: { k: 'prim', n: 'long' } as JType,
  double: { k: 'prim', n: 'double' } as JType,
  float: { k: 'prim', n: 'float' } as JType,
  char: { k: 'prim', n: 'char' } as JType,
  byte: { k: 'prim', n: 'byte' } as JType,
  short: { k: 'prim', n: 'short' } as JType,
  boolean: { k: 'prim', n: 'boolean' } as JType,
  String: { k: 'String' } as JType,
  null: { k: 'null' } as JType,
  void: { k: 'void' } as JType,
  Scanner: { k: 'obj', n: 'Scanner' } as JType,
  Random: { k: 'obj', n: 'Random' } as JType,
  StringBuilder: { k: 'obj', n: 'StringBuilder' } as JType,
};

export function arr(of: JType): JType { return { k: 'array', of }; }

export function typeName(t: JType): string {
  switch (t.k) {
    case 'prim': return t.n;
    case 'String': return 'String';
    case 'array': return typeName(t.of) + '[]';
    case 'null': return 'null';
    case 'void': return 'void';
    case 'obj': return t.n;
    case 'static': return t.n;
  }
}

export function sameType(a: JType, b: JType): boolean {
  if (a.k !== b.k) return false;
  if (a.k === 'prim') return a.n === (b as { n: string }).n;
  if (a.k === 'array') return sameType(a.of, (b as { of: JType }).of);
  if (a.k === 'obj' || a.k === 'static') return a.n === (b as { n: string }).n;
  return true;
}

export const isNumeric = (t: JType) => t.k === 'prim' && t.n !== 'boolean';
export const isIntegral = (t: JType) => t.k === 'prim' && (t.n === 'int' || t.n === 'long' || t.n === 'short' || t.n === 'byte' || t.n === 'char');
export const isBool = (t: JType) => t.k === 'prim' && t.n === 'boolean';
export const isRef = (t: JType) => t.k === 'String' || t.k === 'array' || t.k === 'null' || t.k === 'obj';

export interface Pos { line: number; col: number }

export interface TypeNode extends Pos { base: string; dims: number }

// ---------------- expressions ----------------
interface EBase extends Pos { ty?: JType }

export type Expr =
  | (EBase & { kind: 'lit'; value: number | bigint | string | boolean | null; litType: JType; raw: string })
  | (EBase & { kind: 'name'; name: string })
  | (EBase & { kind: 'field'; obj: Expr; name: string })
  | (EBase & { kind: 'index'; arr: Expr; idx: Expr })
  | (EBase & { kind: 'call'; target: Expr | null; name: string; args: Expr[]; resolved?: string })
  | (EBase & { kind: 'new'; type: TypeNode; args: Expr[] })
  | (EBase & { kind: 'newarr'; base: string; dimExprs: Expr[]; extraDims: number; init?: Expr })
  | (EBase & { kind: 'arrinit'; elems: Expr[] })
  | (EBase & { kind: 'unary'; op: '-' | '+' | '!' | '~'; e: Expr })
  | (EBase & { kind: 'incdec'; op: '++' | '--'; prefix: boolean; target: Expr })
  | (EBase & { kind: 'bin'; op: string; l: Expr; r: Expr; opType?: JType; /** compile-time constant String value */ cstr?: string })
  | (EBase & { kind: 'assign'; op: string; target: Expr; value: Expr; opType?: JType })
  | (EBase & { kind: 'cond'; c: Expr; a: Expr; b: Expr })
  | (EBase & { kind: 'cast'; type: TypeNode; e: Expr });

// ---------------- statements ----------------
interface SBase extends Pos { endLine?: number }

export interface Declarator { name: string; dims: number; init?: Expr; line: number; col: number; ty?: JType }

export interface SwitchCase { labels: Expr[] | null; body: Stmt[]; arrow: boolean; line: number }

export type Stmt =
  | (SBase & { kind: 'vardecl'; type: TypeNode; decls: Declarator[]; isFinal: boolean })
  | (SBase & { kind: 'expr'; e: Expr })
  | (SBase & { kind: 'if'; c: Expr; then: Stmt; els: Stmt | null })
  | (SBase & { kind: 'while'; c: Expr; body: Stmt; id: number })
  | (SBase & { kind: 'dowhile'; c: Expr; body: Stmt; id: number; condLine: number })
  | (SBase & { kind: 'for'; init: Stmt[]; c: Expr | null; update: Expr[]; body: Stmt; id: number })
  | (SBase & { kind: 'foreach'; varType: TypeNode; name: string; iter: Expr; body: Stmt; id: number; elemTy?: JType })
  | (SBase & { kind: 'switch'; e: Expr; cases: SwitchCase[] })
  | (SBase & { kind: 'break' })
  | (SBase & { kind: 'continue' })
  | (SBase & { kind: 'return'; e: Expr | null })
  | (SBase & { kind: 'block'; body: Stmt[] })
  | (SBase & { kind: 'empty' });

export interface Param { type: TypeNode; name: string; ty?: JType; line: number }

export interface MethodDecl {
  name: string;
  params: Param[];
  ret: TypeNode;
  retTy?: JType;
  body: Stmt & { kind: 'block' };
  line: number;
  endLine: number;
  isStatic: boolean;
  /** Key used for overload resolution, e.g. "max(int,int)". */
  sig?: string;
}

export interface FieldDecl { decl: Stmt & { kind: 'vardecl' }; isStatic: boolean }

export interface Program {
  className: string;
  methods: MethodDecl[];
  fields: FieldDecl[];
  /** True when the source had no class wrapper and was treated as a snippet. */
  snippet: boolean;
}
