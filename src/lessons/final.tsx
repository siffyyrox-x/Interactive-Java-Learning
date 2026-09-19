import type { Lesson } from './types';
import { java } from '../content/model';
import { Watch, Predict, Quiz, P, Kid, Trap, Syntax, Steps, Table, ExamWalk, Pattern } from './widgets/basic';
import { StringLab, PoolDemo, ArrayRef, BuildArray, SortAnim, RecursionStack, PassByValue } from './widgets/final';

// ====================================================================== 10 · Strings
export const strings: Lesson = {
  topic: 'strings',
  intro: 'A String is a row of characters with numbered positions starting at 0. Final-exam String questions walk that row one character at a time — scanning, counting, pulling out numbers, and building a new String.',
  sections: [
    {
      id: 'indexes', title: 'Characters and indexes',
      body: () => <>
        <P>Pick a method and move the indexes. The highlighted tiles are exactly the characters the method looks at, and the result is what Java returns.</P>
        <StringLab />
        <Table head={['Method', 'Returns', 'Example on "Hello"']} rows={[
          ['length()', 'number of characters', '5'],
          ['charAt(i)', 'the char at index i', "charAt(1) → 'e'"],
          ['substring(a, b)', 'characters a … b−1', 'substring(1, 3) → "el"'],
          ['substring(a)', 'from a to the end', 'substring(3) → "lo"'],
          ['indexOf(x)', 'first position of x, or −1', 'indexOf("l") → 2'],
          ['equals(t)', 'same text?', 'equals("hello") → false'],
          ['equalsIgnoreCase(t)', 'same text ignoring case', 'true'],
          ['toUpperCase() / toLowerCase()', 'a new String', '"HELLO"'],
        ]} />
      </>,
    },
    {
      id: 'scan', title: 'Scanning character by character',
      body: () => <>
        <P>The loop <code>for (int i = 0; i &lt; s.length(); i++)</code> visits every character. Run it and watch the character tiles: the highlighted tile is <code>s.charAt(i)</code>.</P>
        <Watch code={java`
          String s = "Java 21 rocks";
          int vowels = 0, digits = 0;
          for (int i = 0; i < s.length(); i++) {
              char c = s.charAt(i);
              if ("aeiouAEIOU".indexOf(c) >= 0) vowels++;
              else if (c >= '0' && c <= '9') digits++;
          }
          System.out.println(vowels + " vowels, " + digits + " digits");
        `} />
        <Table head={['Test', 'Meaning']} rows={[
          ["c >= '0' && c <= '9'", 'c is a digit (or Character.isDigit(c))'],
          ["c >= 'a' && c <= 'z'", 'c is a lower-case letter'],
          ["c - '0'", 'the value of a digit character'],
          ["(char) (c - 32)", 'lower → upper case for a letter'],
        ]} />
      </>,
    },
    {
      id: 'build', title: 'Building a new String',
      body: () => <>
        <P>Strings never change — every <code>+</code> creates a new one. Start with <code>""</code> and add characters as you go. The order you add them decides the result.</P>
        <Predict code={java`
          String s = "stressed";
          String rev = "";
          for (int i = 0; i < s.length(); i++) {
              rev = s.charAt(i) + rev;
          }
          System.out.println(rev);
          String alt = "";
          for (int i = 0; i < s.length(); i += 2) alt += s.charAt(i);
          System.out.println(alt);
        `} why="Putting each char in front reverses the String. Stepping by 2 keeps indexes 0, 2, 4, 6." />
        <Trap><code>s.charAt(0) + s.charAt(1)</code> is int addition of two char codes, not "joined text". Start with <code>""</code> on the left: <code>"" + s.charAt(0) + s.charAt(1)</code>.</Trap>
      </>,
    },
    {
      id: 'numbers', title: 'Numbers hidden inside text',
      body: () => <>
        <P>A classic final question: sum the numbers embedded in a String like <code>"ab12cd3e45"</code>. Keep a <b>current number</b>; each digit extends it (<code>cur = cur * 10 + d</code>), and a non-digit ends it.</P>
        <ExamWalk id="st-embedded-sum" />
        <Trap>Do not forget the number that runs to the very end of the String — after the loop, add the last <code>cur</code>.</Trap>
      </>,
    },
    {
      id: 'equals', title: '== versus equals',
      body: () => <>
        <PoolDemo />
        <Quiz items={[
          { q: 'What does `"abc".substring(1, 1)` return?', options: ['"b"', '"" (empty)', '"a"', 'an exception'], answer: 1, why: 'From index 1 up to but not including 1: nothing.' },
          { q: '`"banana".indexOf("na")` is…', options: ['2', '3', '4', '-1'], answer: 0, why: 'The first "na" starts at index 2.' },
          { q: 'Last character of s?', options: ['s.charAt(s.length())', 's.charAt(s.length() - 1)', 's.charAt(-1)', 's.last()'], answer: 1, why: 'Indexes run 0 … length−1. charAt(length()) throws StringIndexOutOfBoundsException.' },
        ]} />
      </>,
    },
    {
      id: 'exam', title: 'Exam pattern: keep the first and last',
      body: () => <>
        <ExamWalk id="st-first-last-keeper" />
      </>,
    },
  ],
};

// ====================================================================== 11 · Arrays
export const arrays: Lesson = {
  topic: 'arrays',
  intro: 'An array is a fixed row of boxes of one type, each with an index starting at 0. Traversing, searching and aggregating arrays is the backbone of the final exam.',
  sections: [
    {
      id: 'create', title: 'Creating and indexing',
      body: () => <>
        <Syntax>{'int[] a = new int[5];      // five zeros\nint[] b = {4, 8, 15, 16, 23};'}</Syntax>
        <P>Step through: the array panel shows each box; the box being read lights up blue and the one being written green.</P>
        <Watch code={java`
          int[] a = new int[5];
          for (int i = 0; i < a.length; i++) {
              a[i] = i * i;
          }
          a[2] = a[4] - a[1];
          System.out.println(a[2] + " " + a.length);
        `} />
        <Trap><code>a.length</code> has no brackets (unlike <code>s.length()</code>), and the last index is <code>a.length - 1</code>. <code>a[a.length]</code> throws ArrayIndexOutOfBoundsException.</Trap>
      </>,
    },
    {
      id: 'aggregate', title: 'Sum, max, min and average',
      body: () => <>
        <Pattern name="Max and its position" code={java`
          int max = a[0], pos = 0;
          for (int i = 1; i < a.length; i++) {
              if (a[i] > max) {
                  max = a[i];
                  pos = i;
              }
          }
        `}>Start from the first element — not from 0, which would be wrong for an all-negative array.</Pattern>
        <ExamWalk id="ar-stats" />
      </>,
    },
    {
      id: 'search', title: 'Searching and pairs',
      body: () => <>
        <P>Linear search checks each box until it finds the target. Pair problems need two loops, and the inner loop starts at <code>i + 1</code> so every pair is checked once.</P>
        <Watch code={java`
          int[] a = {3, 9, 4, 7, 1};
          int target = 11;
          for (int i = 0; i < a.length; i++) {
              for (int j = i + 1; j < a.length; j++) {
                  if (a[i] + a[j] == target) {
                      System.out.println(a[i] + " + " + a[j]);
                  }
              }
          }
        `} title="Every pair, once" />
        <ExamWalk id="ar-closest-pair" />
      </>,
    },
    {
      id: 'refs', title: 'References: two names, one array',
      body: () => <>
        <ArrayRef />
        <Predict code={java`
          int[] x = {1, 2, 3};
          int[] y = x;
          y[1] = 20;
          x = new int[] {7, 8, 9};
          x[0] = 70;
          System.out.println(y[0] + " " + y[1] + " " + x[0]);
        `} why="y and x share the first array, so y[1] = 20 is visible through both. Then x is pointed at a brand-new array; y still points to the old one." />
      </>,
    },
    {
      id: 'exam', title: 'Exam pattern: occurrences',
      body: () => <>
        <ExamWalk id="ar-occurrences" />
        <Quiz items={[
          { q: 'Default values in `new int[3]`?', options: ['random', '0 0 0', 'null null null', 'it does not compile'], answer: 1, why: 'Numeric arrays start filled with 0 (boolean with false, objects with null).' },
          { q: 'To visit an array backwards…', options: ['for (i = a.length; i >= 0; i--)', 'for (i = a.length - 1; i >= 0; i--)', 'for (i = 0; i < a.length; i--)', 'for (i = a.length - 1; i > 0; i--)'], answer: 1, why: 'Start at the last index and include 0.' },
        ]} />
      </>,
    },
  ],
};

// ====================================================================== 12 · Building arrays
export const arrayBuild: Lesson = {
  topic: 'array-build',
  intro: 'The long final-exam coding question usually says: "create a new array containing …, keeping the original order." It always needs the same two ideas — count first to know the size, then copy with a second index k.',
  sections: [
    {
      id: 'k', title: 'i reads, k writes',
      body: () => <>
        <BuildArray />
        <Pattern name="Filter into a new array" code={java`
          int count = 0;
          for (int i = 0; i < a.length; i++)
              if (a[i] % 2 == 0) count++;

          int[] result = new int[count];
          int k = 0;
          for (int i = 0; i < a.length; i++) {
              if (a[i] % 2 == 0) {
                  result[k] = a[i];
                  k++;
              }
          }
        `} />
      </>,
    },
    {
      id: 'partition', title: 'Partition: one group, then the other',
      body: () => <>
        <P>To move all negatives to the end while keeping order, copy in two passes: first everything that is not negative, then the negatives. Same k continues through both passes.</P>
        <Watch code={java`
          int[] a = {4, -2, 7, -9, 0, 3};
          int[] r = new int[a.length];
          int k = 0;
          for (int i = 0; i < a.length; i++) if (a[i] >= 0) r[k++] = a[i];
          for (int i = 0; i < a.length; i++) if (a[i] < 0) r[k++] = a[i];
          for (int i = 0; i < r.length; i++) System.out.print(r[i] + " ");
          System.out.println();
        `} title="Two passes, one k" />
        <ExamWalk id="ab-negatives-last" />
      </>,
    },
    {
      id: 'unique', title: 'Unique and single-occurrence',
      body: () => <>
        <P>"Unique" keeps the first copy of each value; "single occurrence" keeps only values that appear exactly once. Both need a helper check — an inner loop that counts or searches.</P>
        <Table head={['Array', 'Unique (remove duplicates)', 'Single occurrence']} rows={[
          ['3 1 3 2 1 5', '3 1 2 5', '2 5'],
        ]} />
        <ExamWalk id="ab-single-occurrence" />
      </>,
    },
    {
      id: 'rotate', title: 'Rotations and index formulas',
      body: () => <>
        <P>Rotating left by k: the element at index i moves to <code>(i - k + n) % n</code>, or equivalently <code>result[i] = a[(i + k) % n]</code>. The % wraps the index back to the start.</P>
        <Predict code={java`
          int[] a = {10, 20, 30, 40, 50};
          int k = 2, n = a.length;
          int[] r = new int[n];
          for (int i = 0; i < n; i++) r[i] = a[(i + k) % n];
          for (int v : r) System.out.print(v + " ");
          System.out.println();
        `} why="r[0] = a[2], r[1] = a[3], r[2] = a[4], r[3] = a[0], r[4] = a[1]." />
        <Quiz items={[
          { q: 'Why count before creating the result array?', options: ['Arrays cannot be resized after creation', 'It is faster', 'Java requires it for int arrays', 'To sort the array'], answer: 0, why: 'An array has a fixed length. You must know how many elements pass before calling new int[count].' },
          { q: 'In the copy loop, when does k increase?', options: ['every iteration', 'only when an element is written', 'never', 'when i is even'], answer: 1, why: 'k is the next free slot in the result; it only moves after you fill one.' },
        ]} />
      </>,
    },
  ],
};

// ====================================================================== 13 · Sorting
export const sorting: Lesson = {
  topic: 'sorting',
  intro: 'You need two sorts for the final: selection sort and bubble sort. Exams ask you to write them, count their swaps, or show the array after each pass — so learn to see the passes.',
  sections: [
    {
      id: 'selection', title: 'Selection sort',
      body: () => <>
        <P>For each position i, find the smallest value in the rest of the array and swap it into position i. After pass i, positions 0 … i are final.</P>
        <SortAnim />
        <Pattern name="Selection sort" code={java`
          for (int i = 0; i < a.length - 1; i++) {
              int min = i;
              for (int j = i + 1; j < a.length; j++) {
                  if (a[j] < a[min]) min = j;
              }
              int t = a[i]; a[i] = a[min]; a[min] = t;
          }
        `} />
      </>,
    },
    {
      id: 'bubble', title: 'Bubble sort',
      body: () => <>
        <P>Compare neighbours and swap them when they are out of order. Each pass carries the largest remaining value to the end — switch the animation above to <b>bubble</b> and count the swaps.</P>
        <Pattern name="Bubble sort with a swap counter" code={java`
          int swaps = 0;
          for (int i = 0; i < a.length - 1; i++) {
              for (int j = 0; j < a.length - 1 - i; j++) {
                  if (a[j] > a[j + 1]) {
                      int t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;
                      swaps++;
                  }
              }
          }
        `} />
        <Predict code={java`
          int[] a = {5, 1, 4, 2};
          for (int i = 0; i < a.length - 1; i++) {
              for (int j = 0; j < a.length - 1 - i; j++) {
                  if (a[j] > a[j + 1]) {
                      int t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;
                  }
              }
              for (int v : a) System.out.print(v + " ");
              System.out.println();
          }
        `} prompt="Write the array after each pass." />
      </>,
    },
    {
      id: 'parallel', title: 'Sorting two arrays together',
      body: () => <>
        <P>When names and marks sit in two arrays, every swap in the marks array must be repeated in the names array, or the names end up attached to the wrong marks.</P>
        <ExamWalk id="so-rank-students" />
        <Quiz items={[
          { q: 'Selection sort on n elements makes at most how many swaps?', options: ['n − 1', 'n²', 'n(n−1)/2', '1'], answer: 0, why: 'One swap per pass, and there are n − 1 passes.' },
          { q: 'To sort in descending order you change…', options: ['the loop bounds', 'the comparison (< to >)', 'the swap', 'nothing'], answer: 1, why: 'Only the comparison decides the order.' },
        ]} />
      </>,
    },
  ],
};

// ====================================================================== 14 · Methods
export const methods: Lesson = {
  topic: 'methods',
  intro: 'A method is a named, reusable block that takes inputs (parameters) and may give back one result (return value). Final questions ask you to split a program into methods, and to trace calls.',
  sections: [
    {
      id: 'anatomy', title: 'Anatomy of a method',
      body: () => <>
        <Syntax>{'public static returnType name(type param1, type param2) {\n    …\n    return value;\n}'}</Syntax>
        <P>Watch the call stack: calling a method pushes a new frame with its own variables; <code>return</code> pops it and hands the value back to the exact spot of the call.</P>
        <Watch code={java`
          public class Main {
              public static void main(String[] args) {
                  int a = 7, b = 3;
                  int big = max(a, b);
                  double avg = average(a, b);
                  System.out.println(big + " " + avg);
              }
              public static int max(int x, int y) {
                  if (x > y) return x;
                  return y;
              }
              public static double average(int x, int y) {
                  return (x + y) / 2.0;
              }
          }
        `} />
        <Kid>A method is a vending machine: you put in arguments, it does its work behind the panel, and one item comes out. What happens inside does not change the coins in your pocket.</Kid>
      </>,
    },
    {
      id: 'values', title: 'What a method can and cannot change',
      body: () => <>
        <PassByValue />
        <Predict code={java`
          public class Main {
              public static void main(String[] args) {
                  int n = 4;
                  int[] arr = {1, 2, 3};
                  n = twice(n);
                  bump(arr);
                  System.out.println(n + " " + arr[0] + " " + arr[2]);
              }
              public static int twice(int n) {
                  n = n * 2;
                  return n;
              }
              public static void bump(int[] a) {
                  for (int i = 0; i < a.length; i++) a[i] += 10;
              }
          }
        `} why="twice returns 8, and main stores it. bump changes the elements through the shared array reference." />
      </>,
    },
    {
      id: 'design', title: 'Splitting a problem into methods',
      body: () => <>
        <Steps items={[
          'Read the question and list every task it names (read, compute, check, print).',
          'Give each task a method: what goes in (parameters) and what comes out (return type, or void).',
          'Write main last: it only calls the methods in order.',
          'Test each method on its own with a small value.',
        ]} />
        <ExamWalk id="me-marks-analyzer" />
      </>,
    },
    {
      id: 'exam', title: 'Exam pattern: a method that works on an array',
      body: () => <>
        <ExamWalk id="me-rotate-right" />
        <Quiz items={[
          { q: 'A method declared `void` …', options: ['returns 0', 'returns nothing', 'must print', 'cannot have parameters'], answer: 1, why: 'void means no return value; you may still write a bare `return;` to leave early.' },
          { q: 'Code after a `return` in the same block…', options: ['runs after returning', 'is unreachable — a compile error', 'runs only once', 'is skipped silently'], answer: 1, why: 'Java rejects statements that can never run.' },
        ]} />
      </>,
    },
  ],
};

// ====================================================================== 15 · Recursion
export const recursion: Lesson = {
  topic: 'recursion',
  intro: 'A recursive method calls itself on a smaller problem until it reaches a base case. The final exam always has a recursion tracing question — you must list every line of output in the exact order, including the lines printed on the way back up.',
  sections: [
    {
      id: 'stack', title: 'Down to the base case, back up',
      body: () => <>
        <RecursionStack />
        <Kid>Russian dolls: you open each doll (a call) until you reach the smallest solid one (the base case). Then you close them again in reverse order — that is the "on the way back" part.</Kid>
      </>,
    },
    {
      id: 'before-after', title: 'Printing before and after the call',
      body: () => <>
        <P>A print <b>before</b> the recursive call happens on the way down (in call order). A print <b>after</b> it happens on the way back up (in reverse order).</P>
        <Predict code={java`
          public class Main {
              public static void main(String[] args) {
                  go(3);
              }
              public static void go(int n) {
                  if (n == 0) {
                      System.out.println("base");
                      return;
                  }
                  System.out.println("in " + n);
                  go(n - 1);
                  System.out.println("out " + n);
              }
          }
        `} />
      </>,
    },
    {
      id: 'two-calls', title: 'Two calls: a tree',
      body: () => <>
        <P>When a method calls itself twice, the calls form a tree. Java finishes the whole left branch before starting the right one. The visualizer draws the call tree as it grows.</P>
        <Watch code={java`
          public class Main {
              public static void main(String[] args) {
                  System.out.println(f(4));
              }
              public static int f(int n) {
                  if (n <= 1) return n;
                  return f(n - 1) + f(n - 2);
              }
          }
        `} title="Fibonacci call tree" />
        <Trap>Without a base case (or with one that is never reached) the calls never stop and Java throws StackOverflowError. Try <code>f(-1)</code> with a base case of <code>n == 0</code> in the Lab.</Trap>
      </>,
    },
    {
      id: 'writing', title: 'Writing a recursive method',
      body: () => <>
        <Steps items={[
          'Base case: the smallest input whose answer you know without recursion.',
          'Recursive case: express the answer for n using the answer for a smaller input.',
          'Make sure every call moves closer to the base case.',
        ]} />
        <Table head={['Problem', 'Base case', 'Recursive case']} rows={[
          ['sum of digits', 'n == 0 → 0', 'n % 10 + sum(n / 10)'],
          ['power bᵉ', 'e == 0 → 1', 'b * power(b, e − 1)'],
          ['reverse a String', 'length ≤ 1 → s', 'rev(s.substring(1)) + s.charAt(0)'],
          ['array minimum from i', 'i == last → a[i]', 'min(a[i], minFrom(a, i + 1))'],
        ]} />
        <ExamWalk id="rc-digit-sum" />
      </>,
    },
    {
      id: 'exam', title: 'Exam pattern: recursion tracing',
      body: () => <>
        <ExamWalk id="rc-mock1" />
        <Quiz items={[
          { q: 'How many times is f called in total for f(4) with f(n) = f(n−1) + f(n−2), base n ≤ 1?', options: ['4', '5', '9', '16'], answer: 2, why: 'f(4) → f(3), f(2); f(3) → f(2), f(1); each f(2) → f(1), f(0). Counting every node of the tree gives 9.' },
          { q: 'Output lines printed after the recursive call appear…', options: ['in call order', 'in reverse call order', 'only once', 'never'], answer: 1, why: 'They run as each call returns, deepest first.' },
        ]} />
      </>,
    },
  ],
};
