import { CompileError, lex, type Token } from './lexer';
import type { Declarator, Expr, MethodDecl, Program, Stmt, SwitchCase, TypeNode, FieldDecl, Param } from './ast';
import { T } from './ast';

const PRIMS = new Set(['byte', 'short', 'int', 'long', 'float', 'double', 'char', 'boolean']);
/** Reference type names a declaration may start with. */
export const KNOWN_TYPES = new Set(['String', 'Scanner', 'Random', 'StringBuilder', 'Object']);
const UNSUPPORTED_TYPES = new Set(['ArrayList', 'List', 'HashMap', 'Map', 'HashSet', 'Set', 'Integer', 'Double', 'Character', 'Boolean', 'Long', 'File', 'FileWriter', 'PrintWriter', 'BufferedReader']);

const ASSIGN_OPS = new Set(['=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=', '>>>=']);

const BIN_PREC: Record<string, number> = {
  '||': 1, '&&': 2, '|': 3, '^': 4, '&': 5,
  '==': 6, '!=': 6,
  '<': 7, '>': 7, '<=': 7, '>=': 7,
  '<<': 8, '>>': 8, '>>>': 8,
  '+': 9, '-': 9,
  '*': 10, '/': 10, '%': 10,
};

export class Parser {
  private toks: Token[];
  private p = 0;
  private loopId = 0;

  constructor(src: string) { this.toks = lex(src); }

  // ------------------------------------------------------------ helpers
  private get t(): Token { return this.toks[this.p]; }
  private peek(k = 1): Token { return this.toks[Math.min(this.p + k, this.toks.length - 1)]; }
  private is(text: string): boolean { const t = this.t; return (t.kind === 'op' || t.kind === 'keyword') && t.text === text; }
  private isAt(k: number, text: string): boolean { const t = this.peek(k); return (t.kind === 'op' || t.kind === 'keyword') && t.text === text; }
  private next(): Token { const t = this.t; if (this.p < this.toks.length - 1) this.p++; return t; }
  private accept(text: string): boolean { if (this.is(text)) { this.next(); return true; } return false; }
  private expect(text: string, what?: string): Token {
    if (this.is(text)) return this.next();
    const t = this.t;
    // javac reports a missing ';' at the end of the previous token's line
    if (text === ';' || text === ')' || text === ']') {
      const prev = this.toks[Math.max(0, this.p - 1)];
      throw new CompileError(`'${text}' expected`, prev.line, prev.col + prev.text.length);
    }
    throw new CompileError(`${what ?? `'${text}'`} expected, but found ${this.describe(t)}`, t.line, t.col);
  }
  private describe(t: Token): string { return t.kind === 'eof' ? 'end of file' : `'${t.text}'`; }
  private ident(what = '<identifier>'): Token {
    const t = this.t;
    if (t.kind !== 'ident') {
      if (t.kind === 'keyword') throw new CompileError(`'${t.text}' is a reserved keyword and cannot be used as a name`, t.line, t.col);
      throw new CompileError(`${what} expected, but found ${this.describe(t)}`, t.line, t.col);
    }
    return this.next();
  }

  // ------------------------------------------------------------ program
  parseProgram(): Program {
    // imports / package
    while (this.is('import') || this.is('package')) {
      this.next();
      while (!this.is(';') && this.t.kind !== 'eof') this.next();
      this.expect(';');
    }
    // Look ahead for a class declaration
    let q = this.p;
    while (this.toks[q].kind === 'keyword' && ['public', 'final', 'abstract'].includes(this.toks[q].text)) q++;
    if (this.toks[q].kind === 'keyword' && this.toks[q].text === 'class') return this.parseClassProgram();
    return this.parseSnippet();
  }

  private parseClassProgram(): Program {
    while (this.accept('public') || this.accept('final') || this.accept('abstract')) { /* modifiers */ }
    this.expect('class');
    const name = this.ident('class name').text;
    if (this.is('extends') || this.is('implements')) throw new CompileError('inheritance is outside this course subset', this.t.line, this.t.col);
    this.expect('{');
    const methods: MethodDecl[] = [];
    const fields: FieldDecl[] = [];
    while (!this.is('}')) {
      if (this.t.kind === 'eof') throw new CompileError("reached end of file while parsing — a '}' is missing", this.t.line, this.t.col);
      this.parseMember(methods, fields);
    }
    this.expect('}');
    if (this.t.kind !== 'eof') {
      if (this.is('class') || this.is('public')) throw new CompileError('only one class per program is supported here', this.t.line, this.t.col);
      throw new CompileError(`class, interface, or enum expected, but found ${this.describe(this.t)}`, this.t.line, this.t.col);
    }
    return { className: name, methods, fields, snippet: false };
  }

  private parseMember(methods: MethodDecl[], fields: FieldDecl[]) {
    const startLine = this.t.line;
    let isStatic = false; let isFinal = false;
    for (;;) {
      if (this.accept('public') || this.accept('private') || this.accept('protected')) continue;
      if (this.accept('static')) { isStatic = true; continue; }
      if (this.accept('final')) { isFinal = true; continue; }
      if (this.is('@')) { this.next(); this.ident(); continue; }
      break;
    }
    if (this.is('class')) throw new CompileError('nested classes are outside this course subset', this.t.line, this.t.col);
    const type = this.parseType(true);
    const nameTok = this.ident('method or field name');
    if (this.is('(')) {
      methods.push(this.parseMethodRest(type, nameTok, isStatic, startLine));
    } else {
      const decl = this.parseDeclRest(type, nameTok, isFinal);
      fields.push({ decl, isStatic });
    }
  }

  private parseMethodRest(ret: TypeNode, nameTok: Token, isStatic: boolean, startLine: number): MethodDecl {
    this.expect('(');
    const params: Param[] = [];
    if (!this.is(')')) {
      do {
        this.accept('final');
        const ptype = this.parseType(false);
        if (this.accept('...')) ptype.dims++;
        const pname = this.ident('parameter name');
        let dims = 0; while (this.accept('[')) { this.expect(']'); dims++; }
        ptype.dims += dims;
        params.push({ type: ptype, name: pname.text, line: pname.line });
      } while (this.accept(','));
    }
    this.expect(')');
    if (this.accept('throws')) { do { this.ident(); } while (this.accept(',')); }
    if (!this.is('{')) throw new CompileError(`'{' expected to start the body of method ${nameTok.text}`, this.t.line, this.t.col);
    const body = this.parseBlock();
    return { name: nameTok.text, params, ret, body, line: startLine, endLine: body.endLine ?? body.line, isStatic };
  }

  private parseSnippet(): Program {
    const methods: MethodDecl[] = [];
    const fields: FieldDecl[] = [];
    const body: Stmt[] = [];
    const startLine = this.t.line;
    while (this.t.kind !== 'eof') {
      if (this.looksLikeMethod()) {
        const line = this.t.line;
        let isStatic = true;
        for (;;) {
          if (this.accept('public') || this.accept('private') || this.accept('protected')) continue;
          if (this.accept('static')) { isStatic = true; continue; }
          break;
        }
        const type = this.parseType(true);
        const nameTok = this.ident();
        methods.push(this.parseMethodRest(type, nameTok, isStatic, line));
      } else {
        body.push(this.parseStatement());
      }
    }
    const endLine = this.t.line;
    if (!methods.some(m => m.name === 'main')) {
      methods.push({
        name: 'main', params: [{ type: { base: 'String', dims: 1, line: startLine, col: 1 }, name: 'args', line: startLine }],
        ret: { base: 'void', dims: 0, line: startLine, col: 1 },
        body: { kind: 'block', body, line: startLine, col: 1, endLine }, line: startLine, endLine, isStatic: true,
      });
    } else if (body.length) {
      const s = body[0];
      throw new CompileError('statements must be inside a method when main is declared', s.line, s.col);
    }
    return { className: 'Main', methods, fields, snippet: true };
  }

  /** At top level of a snippet: [modifiers] Type name ( ... ) { */
  private looksLikeMethod(): boolean {
    let q = this.p;
    let sawMod = false;
    while (this.toks[q].kind === 'keyword' && ['public', 'private', 'protected', 'static'].includes(this.toks[q].text)) { q++; sawMod = true; }
    const t0 = this.toks[q];
    const isType = (t0.kind === 'keyword' && (PRIMS.has(t0.text) || t0.text === 'void')) || (t0.kind === 'ident' && (KNOWN_TYPES.has(t0.text) || sawMod));
    if (!isType) return false;
    q++;
    while (this.toks[q].text === '[' && this.toks[q + 1].text === ']') q += 2;
    if (this.toks[q].kind !== 'ident') return false;
    return this.toks[q + 1].text === '(';
  }

  // ------------------------------------------------------------ types
  private isTypeStart(k = 0): boolean {
    const t = this.peek(k);
    if (t.kind === 'keyword' && PRIMS.has(t.text)) return true;
    return t.kind === 'ident' && KNOWN_TYPES.has(t.text);
  }

  private parseType(allowVoid: boolean): TypeNode {
    const t = this.t;
    let base: string;
    if (t.kind === 'keyword' && (PRIMS.has(t.text) || (allowVoid && t.text === 'void'))) base = this.next().text;
    else if (t.kind === 'keyword' && t.text === 'var') throw new CompileError("'var' is not used in this course — write the type explicitly", t.line, t.col);
    else if (t.kind === 'ident') {
      if (UNSUPPORTED_TYPES.has(t.text)) throw new CompileError(`${t.text} is outside the CSE110 subset this lab can run`, t.line, t.col);
      base = this.next().text;
      if (this.is('<')) throw new CompileError('generic types are outside this course subset', this.t.line, this.t.col);
    } else throw new CompileError(`<type> expected, but found ${this.describe(t)}`, t.line, t.col);
    let dims = 0;
    while (this.is('[') && this.isAt(1, ']')) { this.next(); this.next(); dims++; }
    return { base, dims, line: t.line, col: t.col };
  }

  // ------------------------------------------------------------ statements
  private parseBlock(): Stmt & { kind: 'block' } {
    const open = this.expect('{');
    const body: Stmt[] = [];
    while (!this.is('}')) {
      if (this.t.kind === 'eof') throw new CompileError("reached end of file while parsing — a '}' is missing", open.line, open.col);
      body.push(this.parseStatement());
    }
    const close = this.next();
    return { kind: 'block', body, line: open.line, col: open.col, endLine: close.line };
  }

  /** Is the current position a local variable declaration? */
  private isDeclStart(): boolean {
    if (this.is('final')) return true;
    const t = this.t;
    if (t.kind === 'keyword' && PRIMS.has(t.text)) return true;
    if (t.kind === 'keyword' && t.text === 'var') return true;
    if (t.kind === 'ident') {
      // Type ident  |  Type [ ] ident  |  Type<...
      let q = 1;
      while (this.peek(q).text === '[' && this.peek(q + 1).text === ']') q += 2;
      if (this.peek(q).kind === 'ident' && (KNOWN_TYPES.has(t.text) || UNSUPPORTED_TYPES.has(t.text) || /^[A-Z]/.test(t.text))) return true;
      if (this.peek(1).text === '<' && UNSUPPORTED_TYPES.has(t.text)) return true;
    }
    return false;
  }

  private parseDeclRest(type: TypeNode, firstName: Token, isFinal: boolean): Stmt & { kind: 'vardecl' } {
    const decls: Declarator[] = [];
    let nameTok = firstName;
    for (;;) {
      let dims = 0; while (this.accept('[')) { this.expect(']'); dims++; }
      let init: Expr | undefined;
      if (this.accept('=')) init = this.is('{') ? this.parseArrayInit() : this.parseExpr();
      decls.push({ name: nameTok.text, dims, init, line: nameTok.line, col: nameTok.col });
      if (!this.accept(',')) break;
      nameTok = this.ident('variable name');
    }
    const semi = this.expect(';');
    return { kind: 'vardecl', type, decls, isFinal, line: type.line, col: type.col, endLine: semi.line };
  }

  private parseLocalDecl(): Stmt & { kind: 'vardecl' } {
    const isFinal = this.accept('final');
    const type = this.parseType(false);
    const nameTok = this.ident('variable name');
    return this.parseDeclRest(type, nameTok, isFinal);
  }

  private parseStatement(): Stmt {
    const t = this.t;
    if (this.is('{')) return this.parseBlock();
    if (this.is(';')) { this.next(); return { kind: 'empty', line: t.line, col: t.col }; }
    if (this.is('if')) {
      this.next(); this.expect('(');
      const c = this.parseExpr(); this.expect(')');
      const then = this.parseStatement();
      let els: Stmt | null = null;
      if (this.accept('else')) els = this.parseStatement();
      return { kind: 'if', c, then, els, line: t.line, col: t.col };
    }
    if (this.is('while')) {
      this.next(); this.expect('(');
      const c = this.parseExpr(); this.expect(')');
      const body = this.parseStatement();
      return { kind: 'while', c, body, id: ++this.loopId, line: t.line, col: t.col };
    }
    if (this.is('do')) {
      this.next();
      const body = this.parseStatement();
      const w = this.expect('while'); this.expect('(');
      const c = this.parseExpr(); this.expect(')'); this.expect(';');
      return { kind: 'dowhile', c, body, id: ++this.loopId, condLine: w.line, line: t.line, col: t.col };
    }
    if (this.is('for')) return this.parseFor();
    if (this.is('switch')) return this.parseSwitch();
    if (this.is('break')) { this.next(); if (this.t.kind === 'ident') throw new CompileError('labeled break is outside this course subset', this.t.line, this.t.col); this.expect(';'); return { kind: 'break', line: t.line, col: t.col }; }
    if (this.is('continue')) { this.next(); this.expect(';'); return { kind: 'continue', line: t.line, col: t.col }; }
    if (this.is('return')) {
      this.next();
      const e = this.is(';') ? null : this.parseExpr();
      this.expect(';');
      return { kind: 'return', e, line: t.line, col: t.col };
    }
    if (this.is('else')) throw new CompileError("'else' without 'if' — check the braces and semicolons above it", t.line, t.col);
    if (this.is('try') || this.is('throw')) throw new CompileError('exceptions (try/throw) are outside this course subset', t.line, t.col);
    if (this.is('class')) throw new CompileError('a class cannot be declared here', t.line, t.col);
    if (this.isDeclStart()) return this.parseLocalDecl();
    const e = this.parseExpr();
    if (!this.is(';')) {
      const prev = this.toks[this.p - 1];
      throw new CompileError("';' expected", prev.line, prev.col + prev.text.length);
    }
    this.next();
    this.checkExprStatement(e);
    return { kind: 'expr', e, line: t.line, col: t.col };
  }

  private checkExprStatement(e: Expr) {
    if (e.kind === 'assign' || e.kind === 'incdec' || e.kind === 'call' || e.kind === 'new') return;
    throw new CompileError('not a statement', e.line, e.col);
  }

  private parseFor(): Stmt {
    const t = this.next(); this.expect('(');
    // enhanced for?
    const save = this.p;
    if (this.isDeclStart()) {
      this.accept('final');
      const type = this.parseType(false);
      const nameTok = this.ident();
      if (this.accept(':')) {
        const iter = this.parseExpr(); this.expect(')');
        const body = this.parseStatement();
        return { kind: 'foreach', varType: type, name: nameTok.text, iter, body, id: ++this.loopId, line: t.line, col: t.col };
      }
      this.p = save;
    }
    const init: Stmt[] = [];
    if (!this.is(';')) {
      if (this.isDeclStart()) {
        init.push(this.parseLocalDecl()); // consumes ';'
      } else {
        do { const e = this.parseExpr(); this.checkExprStatement(e); init.push({ kind: 'expr', e, line: e.line, col: e.col }); } while (this.accept(','));
        this.expect(';');
      }
    } else this.expect(';');
    const c = this.is(';') ? null : this.parseExpr();
    this.expect(';');
    const update: Expr[] = [];
    if (!this.is(')')) { do { const e = this.parseExpr(); this.checkExprStatement(e); update.push(e); } while (this.accept(',')); }
    this.expect(')');
    const body = this.parseStatement();
    return { kind: 'for', init, c, update, body, id: ++this.loopId, line: t.line, col: t.col };
  }

  private parseSwitch(): Stmt {
    const t = this.next(); this.expect('(');
    const e = this.parseExpr(); this.expect(')'); this.expect('{');
    const cases: SwitchCase[] = [];
    while (!this.is('}')) {
      const ct = this.t;
      let labels: Expr[] | null;
      if (this.accept('default')) labels = null;
      else if (this.accept('case')) {
        labels = [this.parseTernary()];
        while (this.accept(',')) labels.push(this.parseTernary());
      } else throw new CompileError(`'case', 'default', or '}' expected, but found ${this.describe(this.t)}`, this.t.line, this.t.col);
      if (this.accept('->')) {
        let body: Stmt[];
        if (this.is('{')) body = [this.parseBlock()];
        else { const s = this.parseStatement(); body = [s]; }
        cases.push({ labels, body, arrow: true, line: ct.line });
      } else {
        this.expect(':');
        const body: Stmt[] = [];
        while (!this.is('case') && !this.is('default') && !this.is('}')) {
          if (this.t.kind === 'eof') throw new CompileError("'}' expected to close the switch", t.line, t.col);
          body.push(this.parseStatement());
        }
        cases.push({ labels, body, arrow: false, line: ct.line });
      }
    }
    const close = this.next();
    return { kind: 'switch', e, cases, line: t.line, col: t.col, endLine: close.line };
  }

  // ------------------------------------------------------------ expressions
  parseExpr(): Expr { return this.parseAssign(); }

  private parseAssign(): Expr {
    const lhs = this.parseTernary();
    const t = this.t;
    if (t.kind === 'op' && ASSIGN_OPS.has(t.text)) {
      this.next();
      if (lhs.kind !== 'name' && lhs.kind !== 'index' && lhs.kind !== 'field') throw new CompileError('unexpected type — the left side of an assignment must be a variable', lhs.line, lhs.col);
      const value = this.is('{') && t.text === '=' ? this.parseArrayInit() : this.parseAssign();
      return { kind: 'assign', op: t.text, target: lhs, value, line: lhs.line, col: lhs.col };
    }
    return lhs;
  }

  private parseTernary(): Expr {
    const c = this.parseBinary(1);
    if (this.accept('?')) {
      const a = this.parseTernary();
      this.expect(':');
      const b = this.parseTernary();
      return { kind: 'cond', c, a, b, line: c.line, col: c.col };
    }
    return c;
  }

  private parseBinary(minPrec: number): Expr {
    let left = this.parseUnary();
    for (;;) {
      const t = this.t;
      if (t.kind === 'keyword' && t.text === 'instanceof') throw new CompileError('instanceof is outside this course subset', t.line, t.col);
      const prec = t.kind === 'op' ? BIN_PREC[t.text] : undefined;
      if (prec === undefined || prec < minPrec) return left;
      this.next();
      const right = this.parseBinary(prec + 1);
      left = { kind: 'bin', op: t.text, l: left, r: right, line: left.line, col: left.col };
    }
  }

  private parseUnary(): Expr {
    const t = this.t;
    if (t.kind === 'op') {
      if (t.text === '++' || t.text === '--') {
        this.next();
        const target = this.parseUnary();
        if (target.kind !== 'name' && target.kind !== 'index' && target.kind !== 'field') throw new CompileError('unexpected type — ++ and -- need a variable', target.line, target.col);
        return { kind: 'incdec', op: t.text, prefix: true, target, line: t.line, col: t.col };
      }
      if (t.text === '-' || t.text === '+' || t.text === '!' || t.text === '~') {
        this.next();
        // -2147483648 is a legal int literal only with the minus sign
        if (t.text === '-' && this.t.kind === 'int' && this.t.value === 2147483648) {
          const lit = this.next();
          return { kind: 'lit', value: -2147483648, litType: T.int, raw: '-' + lit.text, line: t.line, col: t.col };
        }
        const e = this.parseUnary();
        return { kind: 'unary', op: t.text, e, line: t.line, col: t.col };
      }
      if (t.text === '(' && this.isCast()) {
        this.next();
        const type = this.parseType(false);
        this.expect(')');
        const e = this.parseUnary();
        return { kind: 'cast', type, e, line: t.line, col: t.col };
      }
    }
    return this.parsePostfix(this.parsePrimary());
  }

  private isCast(): boolean {
    const a = this.peek(1);
    if (a.kind === 'keyword' && PRIMS.has(a.text)) {
      let q = 2; while (this.peek(q).text === '[' && this.peek(q + 1).text === ']') q += 2;
      return this.peek(q).text === ')';
    }
    if (a.kind === 'ident' && (KNOWN_TYPES.has(a.text) || UNSUPPORTED_TYPES.has(a.text))) {
      let q = 2; while (this.peek(q).text === '[' && this.peek(q + 1).text === ']') q += 2;
      if (this.peek(q).text !== ')') return false;
      const after = this.peek(q + 1);
      return after.kind === 'ident' || after.kind === 'string' || after.kind === 'int' || after.kind === 'char' || after.text === '(' || after.text === '!' || after.text === '~';
    }
    return false;
  }

  private parsePostfix(e: Expr): Expr {
    for (;;) {
      const t = this.t;
      if (this.is('.')) {
        this.next();
        const name = this.ident('member name');
        if (this.is('(')) {
          const args = this.parseArgs();
          e = { kind: 'call', target: e, name: name.text, args, line: name.line, col: name.col };
        } else {
          e = { kind: 'field', obj: e, name: name.text, line: name.line, col: name.col };
        }
      } else if (this.is('[')) {
        this.next();
        const idx = this.parseExpr();
        this.expect(']');
        e = { kind: 'index', arr: e, idx, line: e.line, col: e.col };
      } else if (this.is('++') || this.is('--')) {
        if (e.kind !== 'name' && e.kind !== 'index' && e.kind !== 'field') throw new CompileError('unexpected type — ++ and -- need a variable', e.line, e.col);
        this.next();
        e = { kind: 'incdec', op: t.text as '++' | '--', prefix: false, target: e, line: e.line, col: e.col };
      } else return e;
    }
  }

  private parseArgs(): Expr[] {
    this.expect('(');
    const args: Expr[] = [];
    if (!this.is(')')) { do { args.push(this.parseExpr()); } while (this.accept(',')); }
    this.expect(')');
    return args;
  }

  private parseArrayInit(): Expr {
    const open = this.expect('{');
    const elems: Expr[] = [];
    while (!this.is('}')) {
      elems.push(this.is('{') ? this.parseArrayInit() : this.parseExpr());
      if (!this.accept(',')) break;
    }
    this.expect('}', "'}' to close the array initializer");
    return { kind: 'arrinit', elems, line: open.line, col: open.col };
  }

  private parsePrimary(): Expr {
    const t = this.t;
    switch (t.kind) {
      case 'int':
        if (t.value === 2147483648) throw new CompileError('integer number too large: 2147483648', t.line, t.col);
        this.next(); return { kind: 'lit', value: t.value as number, litType: T.int, raw: t.text, line: t.line, col: t.col };
      case 'long': this.next(); return { kind: 'lit', value: t.value as bigint, litType: T.long, raw: t.text, line: t.line, col: t.col };
      case 'double': this.next(); return { kind: 'lit', value: t.value as number, litType: T.double, raw: t.text, line: t.line, col: t.col };
      case 'float': this.next(); return { kind: 'lit', value: t.value as number, litType: T.float, raw: t.text, line: t.line, col: t.col };
      case 'char': this.next(); return { kind: 'lit', value: (t.value as string).charCodeAt(0), litType: T.char, raw: t.text, line: t.line, col: t.col };
      case 'string': this.next(); return { kind: 'lit', value: t.value as string, litType: T.String, raw: t.text, line: t.line, col: t.col };
      case 'ident':
        this.next();
        if (this.is('(')) {
          const args = this.parseArgs();
          return { kind: 'call', target: null, name: t.text, args, line: t.line, col: t.col };
        }
        return { kind: 'name', name: t.text, line: t.line, col: t.col };
      case 'keyword':
        if (t.text === 'true' || t.text === 'false') { this.next(); return { kind: 'lit', value: t.text === 'true', litType: T.boolean, raw: t.text, line: t.line, col: t.col }; }
        if (t.text === 'null') { this.next(); return { kind: 'lit', value: null, litType: T.null, raw: 'null', line: t.line, col: t.col }; }
        if (t.text === 'new') return this.parseNew();
        if (t.text === 'this') throw new CompileError("'this' is not available in static code", t.line, t.col);
        if (PRIMS.has(t.text) && this.isAt(1, '.')) throw new CompileError(`${t.text} is a primitive type and has no members`, t.line, t.col);
        throw new CompileError(`illegal start of expression: '${t.text}'`, t.line, t.col);
      case 'op':
        if (t.text === '(') {
          this.next();
          const e = this.parseExpr();
          this.expect(')');
          return e;
        }
        throw new CompileError(`illegal start of expression: '${t.text}'`, t.line, t.col);
      default:
        throw new CompileError(`illegal start of expression: ${this.describe(t)}`, t.line, t.col);
    }
  }

  private parseNew(): Expr {
    const nt = this.next();
    const tt = this.t;
    let base: string;
    if (tt.kind === 'keyword' && PRIMS.has(tt.text)) base = this.next().text;
    else if (tt.kind === 'ident') {
      if (UNSUPPORTED_TYPES.has(tt.text)) throw new CompileError(`${tt.text} is outside the CSE110 subset this lab can run`, tt.line, tt.col);
      base = this.next().text;
    } else throw new CompileError(`<identifier> expected after new`, tt.line, tt.col);
    if (this.is('[')) {
      const dimExprs: Expr[] = [];
      let extraDims = 0;
      while (this.is('[')) {
        this.next();
        if (this.is(']')) { this.next(); extraDims++; continue; }
        if (extraDims > 0) throw new CompileError("']' expected", this.t.line, this.t.col);
        dimExprs.push(this.parseExpr());
        this.expect(']');
      }
      let init: Expr | undefined;
      if (this.is('{')) {
        if (dimExprs.length) throw new CompileError('array creation with both dimension expression and initialization is illegal', this.t.line, this.t.col);
        init = this.parseArrayInit();
      } else if (!dimExprs.length) throw new CompileError('array dimension missing', this.t.line, this.t.col);
      return { kind: 'newarr', base, dimExprs, extraDims, init, line: nt.line, col: nt.col };
    }
    if (PRIMS.has(base)) throw new CompileError("'[' expected", this.t.line, this.t.col);
    const args = this.parseArgs();
    return { kind: 'new', type: { base, dims: 0, line: tt.line, col: tt.col }, args, line: nt.line, col: nt.col };
  }
}

export function parse(src: string): Program {
  return new Parser(src).parseProgram();
}
