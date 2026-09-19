import type { Lesson } from './types';
import { java, type FlowItem } from '../content/model';
import { Watch, Predict, Quiz, P, Kid, Trap, Syntax, Steps, J, Table, ExamWalk, Flow, Pattern } from './widgets/basic';
import { FlowShapes, NameCheck, CastLab, ExprStepper, IncDec, DivMod, ScannerSim, BranchExplorer, TruthTable } from './widgets/midterm';
import { Visualizer } from '../components/Visualizer';

// ====================================================================== 1 · Flowcharts
const SHOP_FLOW: FlowItem[] = [
  { kind: 'start', text: 'START' },
  { kind: 'process', text: 'price = 1200\nqty = 3', code: ['int price', 'int qty'] },
  { kind: 'process', text: 'total = price * qty', code: ['int total'] },
  {
    kind: 'decision', text: 'total > 3000?', code: ['if (total > 3000)'],
    yes: [{ kind: 'process', text: 'total = total - 300', code: ['total = total - 300'] }],
    no: [{ kind: 'io', text: 'PRINT "No discount"', code: ['"No discount"'] }],
  },
  { kind: 'io', text: 'PRINT total', code: ['System.out.println(total)'] },
  { kind: 'end', text: 'END' },
];
const SHOP_CODE = java`
  public class Main {
      public static void main(String[] args) {
          int price = 1200;
          int qty = 3;
          int total = price * qty;
          if (total > 3000) {
              total = total - 300;
          } else {
              System.out.println("No discount");
          }
          System.out.println(total);
      }
  }
`;

export const flowcharts: Lesson = {
  topic: 'flowcharts',
  intro: 'Every midterm opens with a flowchart worth 10 marks: you are given boxes and arrows and must write the complete Java program. It is the most mechanical question on the paper — once you know which shape becomes which statement, it is free marks.',
  sections: [
    {
      id: 'shapes', title: 'The six shapes',
      body: () => <>
        <P>A flowchart is a program drawn as a picture. Each shape has exactly one job, and each job has exactly one Java translation.</P>
        <FlowShapes />
        <Kid>Think of it as a board game: you put your finger on START, do what each box says, and follow the arrows. When you hit a diamond you answer yes or no and take that arrow.</Kid>
        <Quiz items={[
          { q: 'Which shape becomes an `if` statement?', options: ['Rectangle', 'Parallelogram', 'Diamond', 'Ellipse'], answer: 2, why: 'A diamond asks a yes/no question, which is exactly what `if (condition)` does.' },
          { q: 'A parallelogram says `PRINT balance`. What do you write?', options: ['balance = print;', 'System.out.println(balance);', 'if (balance) …', 'double balance;'], answer: 1, why: 'Parallelograms are input/output. PRINT is output, so `System.out.println`.' },
          { q: 'An arrow leaves a diamond and goes **back up** to the same diamond. What is it?', options: ['An if/else', 'A loop', 'A method call', 'An error in the chart'], answer: 1, why: 'A path that returns to a decision repeats — that is a `while` loop whose condition is the diamond.' },
        ]} />
      </>,
    },
    {
      id: 'translate', title: 'Box by box into Java',
      body: () => <>
        <P>Translate top to bottom. Rectangles at the top become declarations, the diamond becomes <code>if / else</code>, and whatever sits after the two branches join runs in both cases.</P>
        <Flow items={SHOP_FLOW} label="Shop discount flowchart" />
        <P>Press play below: the highlighted box in the flowchart moves in step with the highlighted line of Java.</P>
        <Visualizer source={SHOP_CODE} flowchart={SHOP_FLOW} title="Flowchart and code in sync" />
        <Steps items={[
          <>Write the class and <code>main</code> skeleton first — it is worth marks on its own.</>,
          <>Every name in the first rectangle becomes a declared variable. If any calculation can produce a decimal (a discount, a rate, a percentage), declare it <code>double</code>.</>,
          <>One statement per box, in arrow order.</>,
          <>A diamond becomes <code>if (condition) {'{'} TRUE path {'}'} else {'{'} FALSE path {'}'}</code>. Boxes after the branches join go after the closing brace.</>,
          <>PRINT boxes become <code>System.out.println</code> with the exact text in quotes.</>,
        ]} />
      </>,
    },
    {
      id: 'nested', title: 'Nested diamonds: option A, else option B',
      body: () => <>
        <P>Most midterm flowcharts follow one shape: <b>try option A; if it does not fit, try option B; if that does not fit either, report the shortage.</b> The second diamond sits on the FALSE arrow of the first, so the second <code>if</code> goes inside the first <code>else</code>.</P>
        <Syntax>{'if (A fits) { … } else { recompute for B; if (B fits) { … } else { shortage … } }'}</Syntax>
        <ExamWalk id="fc-hostel-meal" note={<>Declare every value from the first box as a <code>double</code>, compute the cost for option A, and nest the second decision inside the first <code>else</code>. Watch the flowchart light up as the code runs.</>} />
        <Trap>The cost variable is <b>reassigned</b> inside the else for option B — do not declare it a second time with <code>double</code>, or you get "variable is already defined".</Trap>
      </>,
    },
    {
      id: 'loops', title: 'Flowcharts with loops',
      body: () => <>
        <P>When an arrow travels back up into a diamond, the diamond is a loop condition. Everything on the path that returns to it goes inside the loop body; the FALSE arrow leaves the loop.</P>
        <ExamWalk id="fc-savings-loop" />
        <Predict code={java`
          int n = 1;
          while (n < 20) {
              n = n * 3;
          }
          System.out.println(n);
        `} why="1 → 3 → 9 → 27. After n becomes 27 the diamond (n < 20) answers FALSE and the loop exits." />
      </>,
    },
    {
      id: 'checklist', title: 'Exam checklist',
      body: () => <>
        <Table head={['Mark lost for…', 'Avoid it by…']} rows={[
          ['int where a decimal is needed', 'Using double for prices, rates, discounts and anything they touch'],
          ['Missing else branch', 'Checking that every diamond has both arrows written'],
          ['Printing the wrong text', 'Copying PRINT text exactly, including capitals and spaces'],
          ['Re-declaring a variable', 'Declaring once at the top, then only assigning'],
          ['Missing class / main', 'Writing the skeleton first, before anything else'],
        ]} />
        <Quiz items={[
          { q: '`discount = 0.08` appears in the first box. What type should `discount` be?', options: ['int', 'double', 'String', 'boolean'], answer: 1, why: '0.08 has a fraction. `int discount = 0.08;` is a compile error (possible lossy conversion).' },
          { q: 'Two diamonds: the second is reached only from the FALSE arrow of the first. How is it written?', options: ['Two separate ifs one after another', 'An if inside the first else', 'A while loop', 'A switch'], answer: 1, why: 'It only runs when the first condition failed, so it belongs inside the first else (an else-if chain is equivalent).' },
        ]} />
      </>,
    },
  ],
};

// ====================================================================== 2 · Variables
export const variables: Lesson = {
  topic: 'variables',
  intro: 'A variable is a named box that holds one value of one type. Choosing the type decides what the box can hold — and what happens when you pour a value of another type into it.',
  sections: [
    {
      id: 'boxes', title: 'Declaring and assigning',
      body: () => <>
        <Syntax>type name = value;</Syntax>
        <P>Watch each line create a box and then change its contents. The old value is crossed out when it is replaced — a variable only ever remembers its latest value.</P>
        <Watch code={java`
          int age = 19;
          double gpa = 3.75;
          char grade = 'A';
          boolean passed = true;
          String name = "Rahim";
          age = age + 1;
          System.out.println(name + " " + age + " " + gpa + " " + grade + " " + passed);
        `} />
        <Table head={['Type', 'Holds', 'Example']} rows={[
          ['int', 'whole numbers (about ±2.1 billion)', '42, -7'],
          ['long', 'bigger whole numbers', '9000000000L'],
          ['double', 'decimals', '3.75, 2.0'],
          ['char', 'one character, in single quotes', "'A', '7'"],
          ['boolean', 'true or false', 'true'],
          ['String', 'text, in double quotes', '"Hello"'],
        ]} />
      </>,
    },
    {
      id: 'names', title: 'Legal names',
      body: () => <>
        <P>Names may contain letters, digits, <code>_</code> and <code>$</code>, must not start with a digit, and must not be a reserved word. Exams love asking which names are invalid.</P>
        <NameCheck />
        <Quiz items={[
          { q: 'Which is a valid variable name?', options: ['2total', 'total-price', 'total_price', 'class'], answer: 2, why: 'Starts with a letter, only letters and underscore. The others start with a digit, contain -, or are a keyword.' },
          { q: 'Which is NOT valid?', options: ['$amount', '_count', 'myVar2', 'my var'], answer: 3, why: 'Spaces are never allowed in a name.' },
        ]} />
      </>,
    },
    {
      id: 'casting', title: 'Widening and casting',
      body: () => <>
        <P>Java will automatically put a smaller type into a bigger box (int → double). Going the other way loses information, so Java refuses unless you write a <b>cast</b>, and the cast <b>chops</b> the fraction — it never rounds.</P>
        <CastLab />
        <Predict code={java`
          double d = 9.99;
          int i = (int) d;
          double back = i;
          System.out.println(i);
          System.out.println(back);
          System.out.println((int) -2.7);
          System.out.println((double) 7 / 2);
          System.out.println((double) (7 / 2));
        `} why="(int) chops toward zero: 9.99 → 9 and −2.7 → −2. In the last two lines the cast position matters: casting 7 first gives 7.0 / 2 = 3.5, but casting after the integer division gives 3 → 3.0." />
        <Trap><code>int x = 5.0;</code> does not compile, even though 5.0 is a whole number. The type of the value is double, and that is what Java checks.</Trap>
      </>,
    },
    {
      id: 'char-math', title: 'char is a number in disguise',
      body: () => <>
        <P>Every char has a numeric code: <code>'A'</code> is 65, <code>'a'</code> is 97, <code>'0'</code> is 48. When you do arithmetic with a char it becomes that int.</P>
        <Predict code={java`
          char c = 'A';
          System.out.println(c + 1);
          System.out.println((char) (c + 1));
          System.out.println('7' - '0');
          System.out.println("" + c + 1);
        `} why="c + 1 is int arithmetic (65 + 1 = 66). Casting back gives 'B'. '7' − '0' = 55 − 48 = 7, which is how you turn a digit character into its value. Once a String is on the left, + means joining text." />
      </>,
    },
  ],
};

// ====================================================================== 3 · Operators
export const operators: Lesson = {
  topic: 'operators',
  intro: 'The midterm always contains expressions you must evaluate by hand. They are designed around three traps: integer division, the % operator and precedence. Master those and every expression question is mechanical.',
  sections: [
    {
      id: 'precedence', title: 'Precedence, one step at a time',
      body: () => <>
        <P><code>* / %</code> happen before <code>+ -</code>, and operators of the same level go left to right. Step through any expression below — each click performs exactly one operation, the way you should on paper.</P>
        <ExprStepper />
        <Table head={['Level', 'Operators', 'Direction']} rows={[
          ['1 (first)', '()  ++ --  !  (cast)', '—'],
          ['2', '*  /  %', 'left → right'],
          ['3', '+  -', 'left → right'],
          ['4', '<  <=  >  >=', '—'],
          ['5', '==  !=', '—'],
          ['6', '&&', 'left → right'],
          ['7', '||', 'left → right'],
          ['8 (last)', '=  +=  -=  *=  /=  %=', 'right → left'],
        ]} />
      </>,
    },
    {
      id: 'divmod', title: 'Integer division and %',
      body: () => <>
        <P>When both sides are <code>int</code>, <code>/</code> throws away the fraction and <code>%</code> gives the remainder. If either side is a double, you get real division.</P>
        <DivMod />
        <Predict code={java`
          System.out.println(17 / 5);
          System.out.println(17 % 5);
          System.out.println(17.0 / 5);
          System.out.println(-17 / 5);
          System.out.println(-17 % 5);
          System.out.println(5 % 17);
        `} why="17 / 5 = 3 remainder 2. With a double you get 3.4. For negatives, Java chops toward zero: −17 / 5 = −3 and the remainder keeps the sign of the left side: −2. A smaller number % a bigger one is just the smaller number." />
      </>,
    },
    {
      id: 'incdec', title: '++ and --: before or after?',
      body: () => <>
        <P><code>x++</code> hands out the <b>old</b> value, then increases x. <code>++x</code> increases first and hands out the <b>new</b> value. On a line by itself there is no difference.</P>
        <IncDec />
        <Predict code={java`
          int a = 5;
          int b = a++ + ++a;
          System.out.println(a + " " + b);
          int c = 10;
          c += c++ * 2;
          System.out.println(c);
        `} why="a++ gives 5 (a becomes 6), then ++a makes a 7 and gives 7: b = 12. For c: c += … means c = 10 + (c++ * 2). c++ gives 10, so c = 10 + 20 = 30 — the increment is overwritten by the assignment." />
      </>,
    },
    {
      id: 'compound', title: 'Compound assignment and the hidden cast',
      body: () => <>
        <P><code>x += 3</code> means <code>x = x + 3</code> — with one difference: a compound operator quietly casts the result back to x's type.</P>
        <Predict code={java`
          int x = 10;
          x -= 3;
          x *= 2;
          x /= 4;
          x %= 3;
          System.out.println(x);
          int y = 7;
          y += 2.9;
          System.out.println(y);
        `} why="10 → 7 → 14 → 3 → 0. For y: 7 + 2.9 = 9.9, and += casts back to int, chopping to 9. Writing y = y + 2.9 would not even compile." />
        <Quiz items={[
          { q: 'What is `10 + 7 / 2 * 3 % 4`?', options: ['11', '10', '13', '19'], answer: 0, why: '7 / 2 = 3, 3 * 3 = 9, 9 % 4 = 1, 10 + 1 = 11.' },
          { q: 'What is `(double) 9 / 2`?', options: ['4', '4.0', '4.5', 'compile error'], answer: 2, why: 'The cast applies to 9 first (9.0), so the division is real: 4.5.' },
          { q: 'What is `"Sum: " + 3 + 4`?', options: ['Sum: 7', 'Sum: 34', 'Sum: 3 4', 'error'], answer: 1, why: 'Left to right: "Sum: " + 3 is a String, then + 4 joins again.' },
        ]} />
      </>,
    },
    {
      id: 'exam', title: 'Exam pattern: evaluate the program',
      body: () => <>
        <P>Exams hand you a block of statements and ask for every printed line. Track each variable after every line — the visualizer below does exactly that.</P>
        <Watch code={java`
          int p = 7, q = 3;
          double r = p / q + p % q * 1.5;
          p += q-- * 2;
          q = p++ - --q;
          System.out.println(r);
          System.out.println(p + " " + q);
          System.out.println(p / 2.0 + q % 3);
        `} title="Every variable, every line" />
        <Pattern name="Swap two variables" code={java`
          int temp = a;
          a = b;
          b = temp;
        `}>Needed in sorting later. Without the temporary box the first value is lost.</Pattern>
      </>,
    },
  ],
};

// ====================================================================== 4 · Input
export const input: Lesson = {
  topic: 'input',
  intro: 'Exam programs read their values with Scanner. It reads from a stream of characters, and the order you call its methods decides what each one gets.',
  sections: [
    {
      id: 'setup', title: 'Setting up Scanner',
      body: () => <>
        <J code={java`
          import java.util.Scanner;

          public class Main {
              public static void main(String[] args) {
                  Scanner sc = new Scanner(System.in);
                  System.out.print("Enter your age: ");
                  int age = sc.nextInt();
                  System.out.println("Next year you will be " + (age + 1));
              }
          }
        `} numbers />
        <Watch code={java`
          import java.util.Scanner;

          public class Main {
              public static void main(String[] args) {
                  Scanner sc = new Scanner(System.in);
                  System.out.print("Enter your age: ");
                  int age = sc.nextInt();
                  System.out.println("Next year you will be " + (age + 1));
              }
          }
        `} stdin="19" title="The input buffer is shown under the output" />
      </>,
    },
    {
      id: 'methods', title: 'nextInt, next, nextLine',
      body: () => <>
        <Table head={['Method', 'Reads', 'Stops at']} rows={[
          ['nextInt()', 'one whole number', 'whitespace — the ↵ is left behind'],
          ['nextDouble()', 'one decimal number', 'whitespace — the ↵ is left behind'],
          ['next()', 'one word', 'whitespace'],
          ['nextLine()', 'the rest of the current line', 'the ↵, which it consumes'],
        ]} />
        <ScannerSim />
      </>,
    },
    {
      id: 'trap', title: 'The nextLine trap',
      body: () => <>
        <P>After <code>nextInt()</code> the cursor sits just before the ↵. A following <code>nextLine()</code> reads "the rest of the line", which is empty. Fix it with one extra <code>sc.nextLine();</code> to throw away the leftover ↵.</P>
        <Predict stdin={'20\nRahim Uddin'} code={java`
          import java.util.Scanner;
          public class Main {
              public static void main(String[] args) {
                  Scanner sc = new Scanner(System.in);
                  int age = sc.nextInt();
                  String name = sc.nextLine();
                  System.out.println("[" + name + "] is " + age);
              }
          }
        `} why="name is the empty rest of line 1, so the brackets are empty. The actual name is never read." />
        <Trap title="Fix">Add <code>sc.nextLine();</code> right after <code>sc.nextInt();</code> — then the next <code>nextLine()</code> reads the full name.</Trap>
      </>,
    },
    {
      id: 'exam', title: 'Exam pattern: read, compute, print',
      body: () => <>
        <ExamWalk id="var-average" />
        <Quiz items={[
          { q: 'Input is `3 4.5 hello world`. Calls: nextInt, nextDouble, next. What does next() return?', options: ['hello world', 'hello', 'world', '4.5'], answer: 1, why: 'next() reads exactly one word.' },
          { q: 'Input `7↵`. You call nextInt() then nextLine(). What does nextLine() return?', options: ['7', 'an empty String', 'null', 'it waits forever'], answer: 1, why: 'Only the ↵ remains, so the rest of the line is "".' },
        ]} />
      </>,
    },
  ],
};

// ====================================================================== 5 · Conditions
const GRADE_CODE = java`
  int marks = VALUE;
  if (marks >= 90) {
      System.out.println("A");
  } else if (marks >= 80) {
      System.out.println("B");
  } else if (marks >= 70) {
      System.out.println("C");
  } else {
      System.out.println("F");
  }
`;
export const conditions: Lesson = {
  topic: 'conditions',
  intro: 'Condition questions are word problems: a shop, a bill, a fine, a tax bracket. The skill is turning the rules in the paragraph into a chain of tests that covers every case exactly once.',
  sections: [
    {
      id: 'chain', title: 'if / else if / else',
      body: () => <>
        <P>Java tests the conditions top to bottom and runs the <b>first</b> one that is true, then skips the rest. Drag the slider and see which branch runs.</P>
        <BranchExplorer code={GRADE_CODE} min={40} max={100} init={84} label="marks" />
        <Trap>Order matters. If you test <code>marks &gt;= 70</code> first, a mark of 95 prints C. In a chain, go from the strictest condition to the loosest.</Trap>
      </>,
    },
    {
      id: 'logic', title: '&&, || and !',
      body: () => <>
        <TruthTable />
        <Predict code={java`
          int age = 20;
          boolean member = false;
          System.out.println(age >= 18 && member);
          System.out.println(age >= 18 || member);
          System.out.println(!(age < 18) && !member);
          int x = 0;
          System.out.println(x != 0 && 10 / x > 1);
        `} why="The last line would divide by zero — but && stops as soon as the left side is false, so 10 / x never runs. That is short-circuit evaluation." />
      </>,
    },
    {
      id: 'ranges', title: 'Ranges and tiers',
      body: () => <>
        <P>Tiered bills (electricity, tax) charge different rates for different slices. Compute each slice separately — the exam wants the arithmetic shown, not one magic formula.</P>
        <ExamWalk id="cd-electric-tiers" />
      </>,
    },
    {
      id: 'switch', title: 'switch and fall-through',
      body: () => <>
        <P><code>switch</code> jumps to the matching case and runs <b>everything below it</b> until a <code>break</code>. Forgetting a break is the most common switch trap.</P>
        <Predict code={java`
          int day = 2;
          switch (day) {
              case 1: System.out.println("Mon");
              case 2: System.out.println("Tue");
              case 3: System.out.println("Wed");
                  break;
              case 4: System.out.println("Thu");
              default: System.out.println("Other");
          }
        `} why="Jumps to case 2, prints Tue, falls through into case 3 and prints Wed, then break." />
      </>,
    },
    {
      id: 'exam', title: 'Exam pattern: a full scenario',
      body: () => <>
        <ExamWalk id="cd-eid-shopping" />
        <Quiz items={[
          { q: 'What is wrong with `if (x > 5); { System.out.println("big"); }`?', options: ['Nothing', 'The ; ends the if, so the block always runs', 'It does not compile', 'It never prints'], answer: 1, why: 'The semicolon is an empty statement that the if controls. The block after it is just a normal block.' },
          { q: 'How do you compare two Strings s and t?', options: ['s == t', 's.equals(t)', 's = t', 's.compare(t)'], answer: 1, why: '== asks whether they are the same object, not the same text.' },
        ]} />
      </>,
    },
  ],
};
