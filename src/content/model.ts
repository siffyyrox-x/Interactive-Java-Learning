/** Content model shared by lessons, problems, exams and progress. */
import type { Rules } from '../engine/rules';
export type { Rules };

export type Exam = 'mid' | 'final';

export type TopicId =
  | 'flowcharts' | 'variables' | 'operators' | 'input' | 'conditions' | 'loops' | 'nested-loops' | 'digits' | 'tracing'
  | 'strings' | 'arrays' | 'array-build' | 'sorting' | 'methods' | 'recursion';

export interface Topic {
  id: TopicId;
  exam: Exam;
  order: number;
  title: string;
  short: string;
  /** One line describing what the learner will be able to do. */
  goal: string;
}

export type ProblemKind =
  /** Write a complete program; checked against hidden tests. */
  | 'code'
  /** Implement a program from a flowchart; checked by output. */
  | 'flowchart'
  /** Trace a program and fill a table with one row per loop iteration, plus the printed output. */
  | 'trace-table'
  /** Trace a program and write its exact output. */
  | 'trace-output';

export type Difficulty = 'Warm-up' | 'Practice' | 'Exam' | 'Challenge';

export interface Sample {
  input: string;
  /** Output as printed in the source material; verified against the reference solution in CI. */
  output?: string;
  note?: string;
}

export type FlowItem =
  | { kind: 'start' | 'end' | 'process' | 'io'; text: string; code?: string[] }
  | { kind: 'decision'; text: string; code?: string[]; yes: FlowItem[]; no: FlowItem[]; yesLabel?: string; noLabel?: string }
  | { kind: 'loop'; text: string; code?: string[]; body: FlowItem[] };

export interface Problem {
  id: string;
  title: string;
  topic: TopicId;
  kind: ProblemKind;
  difficulty: Difficulty;
  marks: number;
  /** Mini-markdown: paragraphs, `code`, **bold**, lines starting with "- " become bullets. */
  statement: string;
  restrictions?: string[];
  samples?: Sample[];
  /** Extra hidden test inputs (the reference solution produces the expected output). */
  tests?: string[];
  starter?: string;
  /** Reference solution — a complete Java program. For trace problems this is the program to trace. */
  solution: string;
  /** Progressive hints, weakest first. */
  hints: string[];
  /** The approach in a few ordered steps, shown with the solution. */
  plan?: string[];
  flowchart?: FlowItem[];
  /** trace-table: the variables that form the table columns, in order. */
  traceVars?: string[];
  /** Compare output exactly (no prompt tolerance). Used for tracing. */
  strict?: boolean;
  /** Exam restrictions enforced on the learner's code (checked on the syntax tree). */
  rules?: Rules;
  /** Tags used for search and the exam simulator. */
  tags?: string[];
}

/** Remove common indentation and surrounding blank lines from a template literal. */
export function dedent(s: string): string {
  const lines = s.replace(/\t/g, '    ').split('\n');
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  const indent = Math.min(...lines.filter(l => l.trim()).map(l => l.match(/^ */)![0].length));
  return lines.map(l => l.slice(indent)).join('\n');
}

/** Tag for Java source: keeps backslashes literally (String.raw) and removes indentation. */
export function java(strings: TemplateStringsArray, ...vals: unknown[]): string {
  return dedent(String.raw(strings, ...vals));
}

export const SCANNER_STARTER = java`
  import java.util.Scanner;

  public class Main {
      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          // write your solution here

      }
  }
`;

export const PLAIN_STARTER = java`
  public class Main {
      public static void main(String[] args) {
          // write your solution here

      }
  }
`;
