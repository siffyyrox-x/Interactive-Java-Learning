import { useState } from 'react';
import type { Lesson } from './types';
import { java } from '../content/model';
import { Watch, Predict, Quiz, P, Kid, Trap, Syntax, Steps, Table, ExamWalk, Pattern } from './widgets/basic';
import { NestedGrid, DigitPeeler, MergeChecksum } from './widgets/midterm';
import { TraceTable, scoreTrace, emptyTrace } from '../components/TraceTable';

/** A small fill-in trace table used inside the tracing lesson. */
function TraceTry({ code, vars }: { code: string; vars: string[] }) {
  const [a, setA] = useState(emptyTrace());
  const [checked, setChecked] = useState(false);
  const [reveal, setReveal] = useState(false);
  const s = checked ? scoreTrace(code, vars, a) : null;
  return (
    <div className="widget">
      <div className="widget-title"><span>Your turn: fill the table</span><span className="muted">one row per iteration</span></div>
      <pre className="code">{code}</pre>
      <TraceTable solution={code} vars={vars} value={a} onChange={v => { setA(v); setChecked(false); }} checked={checked} reveal={reveal} />
      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn sm" onClick={() => setChecked(true)}>Check</button>
        <button className="btn ghost sm" onClick={() => setReveal(r => !r)}>{reveal ? 'Hide answers' : 'Reveal answers'}</button>
      </div>
      {s && <div className={`fb ${s.correct === s.total && s.outCorrect === s.outTotal ? 'ok' : 'info'}`} style={{ marginTop: 10 }}><span className="verdict">Table {s.correct}/{s.total} · Output {s.outCorrect}/{s.outTotal} lines</span>Wrong cells are marked in red. Step through the program above to find where your trace went off.</div>}
    </div>
  );
}

// ====================================================================== 6 · Loops
export const loops: Lesson = {
  topic: 'loops',
  intro: 'A loop repeats a block while a condition stays true. Every loop question on the midterm — series, counting, GCD, primes, simulations — uses the same three parts: start, condition, change.',
  sections: [
    {
      id: 'while', title: 'while: check, run, repeat',
      body: () => <>
        <Syntax>{'initialise; while (condition) { body; change; }'}</Syntax>
        <P>Step through it and watch the loop counter pill: the condition is checked <b>before</b> every iteration, and one final time when it becomes false.</P>
        <Watch code={java`
          int count = 1;
          int sum = 0;
          while (count <= 5) {
              sum = sum + count;
              System.out.println("count=" + count + " sum=" + sum);
              count++;
          }
          System.out.println("done, count is " + count);
        `} />
        <Kid>A while loop is a bouncer at a door: before each person (iteration) enters, it checks the rule. The moment the rule fails, nobody else gets in — and the check that failed is the last one.</Kid>
        <Trap>Forget <code>count++</code> and the condition never changes — an infinite loop. The lab stops runaway programs and tells you.</Trap>
      </>,
    },
    {
      id: 'for', title: 'for and do-while',
      body: () => <>
        <P>A <code>for</code> loop packs the three parts into one line. A <code>do-while</code> runs the body first and checks afterwards, so it always runs at least once.</P>
        <Table head={['Loop', 'Checks', 'Runs at least once?', 'Use when…']} rows={[
          ['while', 'before', 'no', 'you do not know how many times (digits, GCD, input until 0)'],
          ['for', 'before', 'no', 'you know the count (1 to n, every index)'],
          ['do-while', 'after', 'yes', 'menus, "ask again until valid"'],
        ]} />
        <Predict code={java`
          for (int i = 10; i > 0; i -= 3) {
              System.out.print(i + " ");
          }
          System.out.println();
          int k = 100;
          do {
              System.out.println("k = " + k);
              k++;
          } while (k < 5);
        `} why="i goes 10, 7, 4, 1 and then −2 fails the test. The do-while prints once even though 100 < 5 is false from the start." />
      </>,
    },
    {
      id: 'accumulate', title: 'Accumulators, counters and series',
      body: () => <>
        <P>Nearly every loop problem keeps a running value: a <b>sum</b> starting at 0, a <b>product</b> starting at 1, a <b>count</b> starting at 0, or a <b>sign</b> flipping between +1 and −1.</P>
        <Pattern name="Alternating series" code={java`
          int sum = 0, sign = 1;
          for (int i = 1; i <= n; i++) {
              int term = 2 * i + 1;      // 3, 5, 7, 9, …
              sum += sign * term;
              sign = -sign;             // flip for the next term
          }
        `} />
        <ExamWalk id="lp-series-odd" input="5" />
      </>,
    },
    {
      id: 'control', title: 'break, continue and flags',
      body: () => <>
        <P><code>break</code> leaves the loop immediately. <code>continue</code> skips the rest of this iteration and goes to the next check (in a <code>for</code>, the update runs first).</P>
        <Predict code={java`
          for (int i = 1; i <= 10; i++) {
              if (i % 3 == 0) continue;
              if (i == 8) break;
              System.out.print(i + " ");
          }
          System.out.println();
        `} why="3 and 6 are skipped by continue; at 8 the loop breaks, so 7 is the last number printed." />
        <Pattern name="Prime check with a flag" code={java`
          boolean isPrime = n > 1;
          for (int d = 2; d * d <= n; d++) {
              if (n % d == 0) {
                  isPrime = false;
                  break;
              }
          }
        `}>Assume the answer is yes, look for one counter-example, and stop as soon as you find it.</Pattern>
        <ExamWalk id="lp-gcd" />
      </>,
    },
    {
      id: 'exam', title: 'Exam pattern: read until a stop value',
      body: () => <>
        <ExamWalk id="lp-even-sum-odd-count" />
        <Quiz items={[
          { q: 'How many times does `for (int i = 0; i < 10; i += 2)` run?', options: ['4', '5', '6', '10'], answer: 1, why: 'i = 0, 2, 4, 6, 8 — five iterations.' },
          { q: 'After `int i = 0; while (i < 5) i++;` what is i?', options: ['4', '5', '6', 'the loop never ends'], answer: 1, why: 'The loop stops when i < 5 is false, i.e. at i = 5.' },
          { q: 'A product accumulator should start at…', options: ['0', '1', '-1', 'the first input'], answer: 1, why: 'Anything times 0 is 0; 1 is the neutral value for multiplication.' },
        ]} />
      </>,
    },
  ],
};

// ====================================================================== 7 · Nested loops
export const nestedLoops: Lesson = {
  topic: 'nested-loops',
  intro: 'A loop inside a loop: the inner loop runs completely, from its start to its end, for every single iteration of the outer loop. Patterns, tables and "for each number, check its digits" problems are all built this way.',
  sections: [
    {
      id: 'grid', title: 'Rows and columns',
      body: () => <>
        <P>Picture the outer loop as the row and the inner loop as the column. Each numbered cell below is one run of the inner body, in the order Java executes them.</P>
        <NestedGrid />
        <Kid>A clock: the minute hand (inner loop) goes all the way round for every single tick of the hour hand (outer loop).</Kid>
      </>,
    },
    {
      id: 'patterns', title: 'Printing patterns',
      body: () => <>
        <Steps items={[
          'Write the pattern out and number the rows.',
          'For each row, count what is printed: how many spaces, how many stars or numbers.',
          'Turn each count into a formula of the row number i (for example n − i spaces, 2i − 1 stars).',
          'One inner loop per part of the row, then println() to end the row.',
        ]} />
        <Watch code={java`
          int n = 4;
          for (int i = 1; i <= n; i++) {
              for (int s = 1; s <= n - i; s++) System.out.print(" ");
              for (int j = 1; j <= 2 * i - 1; j++) System.out.print("*");
              System.out.println();
          }
        `} title="A pyramid: n − i spaces then 2i − 1 stars" startAtEnd />
        <ExamWalk id="nl-pyramid" />
      </>,
    },
    {
      id: 'check-each', title: 'For each number, inspect it',
      body: () => <>
        <P>The other big family: the outer loop walks through a range of numbers, the inner loop examines one number (its digits or its divisors). Reset the inner variables <b>inside</b> the outer loop — this is the most common bug.</P>
        <ExamWalk id="nl-digit-sum-prime" />
        <Trap>If <code>sum = 0</code> is declared before the outer loop, the second number starts with the first number's sum still in it.</Trap>
      </>,
    },
    {
      id: 'trace', title: 'Tracing nested loops',
      body: () => <>
        <Predict code={java`
          int total = 0;
          for (int i = 1; i <= 3; i++) {
              for (int j = i; j <= 3; j++) {
                  if (j == 2) continue;
                  total += i * j;
              }
              System.out.println("i=" + i + " total=" + total);
          }
        `} why="i=1: j = 1, 3 → 1 + 3 = 4. i=2: j = 2 is skipped, j = 3 → +6 = 10. i=3: j = 3 → +9 = 19." />
        <Quiz items={[
          { q: 'How many stars? `for (i = 0; i < 4; i++) for (j = 0; j < 3; j++) print("*")`', options: ['7', '12', '16', '3'], answer: 1, why: '4 outer × 3 inner = 12.' },
          { q: 'A `break` in the inner loop…', options: ['ends both loops', 'ends only the inner loop', 'ends the program', 'skips one inner iteration'], answer: 1, why: 'break only leaves the innermost loop it sits in; the outer loop continues.' },
        ]} />
      </>,
    },
  ],
};

// ====================================================================== 8 · Digits
export const digits: Lesson = {
  topic: 'digits',
  intro: 'The long midterm coding question is almost always a digit problem — a checksum, a PIN, an ID — and it usually forbids Strings and arrays. Everything is done with % 10 and / 10.',
  sections: [
    {
      id: 'peel', title: 'Peeling digits with % and /',
      body: () => <>
        <P><code>n % 10</code> is the last digit; <code>n / 10</code> removes it. Repeat until n is 0 and you have visited every digit from right to left.</P>
        <DigitPeeler />
        <Pattern name="Visit every digit" code={java`
          while (n > 0) {
              int d = n % 10;   // last digit
              // … use d …
              n = n / 10;       // drop it
          }
        `} />
      </>,
    },
    {
      id: 'build', title: 'Counting, reversing and rebuilding',
      body: () => <>
        <P>Three tools cover almost every question: count digits (add 1 per peel), reverse (<code>rev = rev * 10 + d</code>) and read from the left (divide by the largest power of 10).</P>
        <Predict code={java`
          int n = 4071;
          int rev = 0, count = 0, copy = n;
          while (copy > 0) {
              rev = rev * 10 + copy % 10;
              count++;
              copy /= 10;
          }
          System.out.println(rev + " " + count);
          int p = 1;
          for (int i = 1; i < count; i++) p *= 10;
          System.out.println(n / p + " " + n % 10);
        `} why="Reversed, 4071 becomes 1704 and has 4 digits. p = 1000, so n / p is the first digit (4) and n % 10 the last (1)." />
        <Trap>Always peel a <b>copy</b> of n. The loop destroys the number, and many questions need the original again at the end.</Trap>
      </>,
    },
    {
      id: 'position', title: 'Position-based rules',
      body: () => <>
        <P>Checksums often treat odd and even positions differently, counted from the left. When you peel from the right you can find the position from the total digit count, or read left to right with a divisor.</P>
        <ExamWalk id="dg-weighted-checksum" note={<>Count the digits first. Then walk with a divisor from the left so "position 1" really is the leftmost digit, and apply the rule for odd or even positions.</>} />
      </>,
    },
    {
      id: 'merge', title: 'The merge-last-two checksum',
      body: () => <>
        <P>A pattern seen on real midterms: repeatedly replace the last two digits by their sum (keeping only the last digit of the sum) until one digit remains.</P>
        <MergeChecksum />
        <ExamWalk id="dg-merge-checksum" />
      </>,
    },
    {
      id: 'exam', title: 'Restrictions and checklist',
      body: () => <>
        <Table head={['Restriction on the paper', 'What it means for you']} rows={[
          ['No Strings or arrays', 'Only int/long arithmetic with % and /. The checker here enforces it.'],
          ['No Math library', 'Build powers of 10 with a loop.'],
          ['Handle 0 / single digit', 'while (n > 0) never runs for 0 — decide what should print.'],
        ]} />
        <Quiz items={[
          { q: 'What is `(n / 100) % 10` for n = 58372?', options: ['3', '7', '8', '2'], answer: 0, why: '58372 / 100 = 583, and 583 % 10 = 3 — the hundreds digit.' },
          { q: 'To reverse n you repeat…', options: ['rev = rev + n % 10', 'rev = rev * 10 + n % 10', 'rev = n % 10 * 10', 'rev = rev / 10 + n'], answer: 1, why: 'Shift the reversed number left one place, then append the next digit.' },
        ]} />
      </>,
    },
  ],
};

// ====================================================================== 9 · Tracing
const DEMO_TRACE = java`
  public class Main {
      public static void main(String[] args) {
          int x = 1, y = 10;
          for (int i = 0; i < 4; i++) {
              if (i % 2 == 0) {
                  x += i;
              } else {
                  y -= x;
                  System.out.println(x + y);
              }
          }
      }
  }
`;
export const tracing: Lesson = {
  topic: 'tracing',
  intro: 'The third midterm question is a trace table: run the program by hand and write every variable at the end of every iteration, plus the output. It rewards patience and a strict routine, not cleverness.',
  sections: [
    {
      id: 'routine', title: 'The routine',
      body: () => <>
        <Steps items={[
          'Draw the columns: iteration, every variable that changes, and output.',
          'Write the starting values before the loop.',
          'Go through the body line by line; update a variable only when its line runs.',
          'Evaluate postfix/prefix carefully: x++ uses the old value, ++x the new one.',
          'At the end of the body, copy the current values into the row, then check the loop condition again.',
        ]} />
        <P>Step through this program: the Trace table panel under the visualizer fills in one row each time an iteration ends — exactly the table you write on paper.</P>
        <Watch code={DEMO_TRACE} title="Watch the trace build up" />
      </>,
    },
    {
      id: 'try', title: 'Fill a table yourself',
      body: () => <TraceTry code={DEMO_TRACE} vars={['i', 'x', 'y']} />,
    },
    {
      id: 'tricks', title: 'The tricks examiners use',
      body: () => <>
        <Predict code={java`
          int a = 5, b = 2;
          boolean flag = true;
          for (int k = 0; k < 3; k++) {
              if (flag) {
                  a += b++ * 2;
              } else {
                  a -= --b + k;
              }
              flag = !flag;
              System.out.println(a + " " + b);
          }
        `} why="A flag that flips every iteration alternates the two branches. Track b's postfix and prefix changes separately from the value used in the expression." />
        <Kid>Examiners mix three things in one loop: a flag that flips, a ++/-- inside an expression, and a print of a postfix value like println(sum++). Slow down on exactly those lines.</Kid>
      </>,
    },
    {
      id: 'exam', title: 'Exam pattern: full trace table',
      body: () => <>
        <P>This is the size and style of a real midterm trace question. Try it in practice mode first; then use the visualizer to find exactly where your trace diverged.</P>
        <ExamWalk id="tr-mock-set1" />
      </>,
    },
  ],
};
