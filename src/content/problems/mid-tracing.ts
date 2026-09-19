import { java, type Problem } from '../model';

const TABLE_HINTS = [
  'Work one line at a time and write every variable change immediately — never do two updates in your head.',
  'x++ gives the OLD value to the expression and then increases x. ++x increases first and gives the NEW value. The same goes for -- .',
  'In System.out.println(sum++), the OLD value of sum is printed and only then does sum increase. Record both.',
];
const TABLE_STATEMENT = 'Trace the program. Fill in the value of each listed variable at the **end of every loop iteration**, and the line printed during that iteration. Then write the complete output.';

export const tracingProblems: Problem[] = [
  {
    id: 'tr-mock-set1', title: 'Mock Set 1 — while loop with a flag',
    topic: 'tracing', kind: 'trace-table', difficulty: 'Exam', marks: 10,
    statement: TABLE_STATEMENT, traceVars: ['i', 'j', 'k', 'sum', 'flag'], strict: true,
    solution: java`
      public class MidA {
          public static void main(String[] args) {
              int i = 2, j = 0, sum = 1, k = 6;
              boolean flag = true;

              while (j < 6) {
                  i++;
                  if (flag) {
                      sum += i + k-- - j;
                      System.out.println(sum++);
                  } else {
                      sum += --k - i + j;
                      System.out.println(--sum);
                  }
                  flag = !flag;
                  j++;
              }
          }
      }
    `,
    hints: TABLE_HINTS, tags: ['trace table', 'while', 'postfix', 'prefix', 'boolean flag'],
  },
  {
    id: 'tr-mock-set2', title: 'Mock Set 2 — do-while',
    topic: 'tracing', kind: 'trace-table', difficulty: 'Exam', marks: 10,
    statement: TABLE_STATEMENT + ' Remember that a do-while body runs before the condition is checked.', traceVars: ['a', 'b', 'total', 'p', 'take'], strict: true,
    solution: java`
      public class MidB {
          public static void main(String[] args) {
              int a = 4, b = 9, total = 0, p = 1;
              boolean take = true;

              do {
                  if (take) {
                      total += a++ + --b;
                      System.out.println(total);
                  } else {
                      total -= ++a - b--;
                      System.out.println(total++);
                  }
                  take = !take;
                  p++;
              } while (p <= 5);
          }
      }
    `,
    hints: [...TABLE_HINTS.slice(0, 2), 'total -= ++a - b-- means total = total - (++a - b--). Evaluate the right side fully first.'],
    tags: ['trace table', 'do-while', 'postfix', 'prefix'],
  },
  {
    id: 'tr-mock-set3', title: 'Mock Set 3 — even/odd iterations',
    topic: 'tracing', kind: 'trace-table', difficulty: 'Exam', marks: 10,
    statement: TABLE_STATEMENT, traceVars: ['x', 'y', 'result', 'n'], strict: true,
    solution: java`
      public class MidC {
          public static void main(String[] args) {
              int x = 1, y = 7, result = 2, n = 0;

              while (n < 5) {
                  x += 2;
                  if (n % 2 == 0) {
                      result += x * 2 - y--;
                      System.out.println(result--);
                  } else {
                      result -= --y + x;
                      System.out.println(++result);
                  }
                  n++;
              }
          }
      }
    `,
    hints: TABLE_HINTS, tags: ['trace table', 'while', 'postfix', 'prefix'],
  },
  {
    id: 'tr-mock-set4', title: 'Mock Set 4 — for loop',
    topic: 'tracing', kind: 'trace-table', difficulty: 'Exam', marks: 10,
    statement: TABLE_STATEMENT + ' The table records c at the end of the body, before c++ runs.', traceVars: ['m', 'n', 'ans', 'c'], strict: true,
    solution: java`
      public class MidD {
          public static void main(String[] args) {
              int m = 3, n = 2, ans = 0, c;

              for (c = 0; c < 5; c++) {
                  if (c % 2 == 0) {
                      ans += m++ * n;
                      System.out.println(ans--);
                  } else {
                      ans += --m + n++;
                      System.out.println(++ans);
                  }
              }
          }
      }
    `,
    hints: [...TABLE_HINTS.slice(0, 2), 'ans += m++ * n multiplies the OLD m by n, adds that to ans, and only then increases m.'],
    tags: ['trace table', 'for', 'postfix', 'prefix'],
  },
  {
    id: 'tr-mock-set5', title: 'Mock Set 5 — alternating mode',
    topic: 'tracing', kind: 'trace-table', difficulty: 'Exam', marks: 10,
    statement: TABLE_STATEMENT, traceVars: ['i', 'j', 'value', 'step', 'mode'], strict: true,
    solution: java`
      public class MidE {
          public static void main(String[] args) {
              int i = 1, j = 8, value = 3, step = 0;
              boolean mode = false;

              while (step < 6) {
                  if (mode) {
                      value += ++i + j--;
                      System.out.println(value--);
                  } else {
                      value -= i++ - --j;
                      System.out.println(++value);
                  }
                  mode = !mode;
                  step++;
              }
          }
      }
    `,
    hints: TABLE_HINTS, tags: ['trace table', 'while', 'postfix', 'prefix'],
  },
  {
    id: 'tr-real-midterm', title: 'Midterm Trace — modulus inside the loop',
    topic: 'tracing', kind: 'trace-table', difficulty: 'Challenge', marks: 7,
    statement: TABLE_STATEMENT + ' Watch the operator precedence: % and * happen before + and -.', traceVars: ['i', 'sum', 't', 'k', 'j', 'flag'], strict: true,
    solution: java`
      public class MidA {
          public static void main(String[] args) {
              int i = 3, sum = 0, t = 3;
              int k = 4, j = 0;
              boolean flag = true;
              while (j < 7) {
                  i++;
                  if (flag == true) {
                      sum += t++ % i + 2 - 3 * k;
                      System.out.println(sum--);
                  } else {
                      sum += t-- % i + 3 - 5 * k;
                      System.out.println(sum++);
                  }
                  flag = !flag;
                  j++;
              }
          }
      }
    `,
    hints: ['t++ % i uses the OLD t, then t increases. % binds tighter than + and -, so compute t % i and 3 * k first.', 'Negative numbers are normal here: sum goes below zero quickly. Java keeps the sign for / and %.', TABLE_HINTS[2]],
    tags: ['trace table', 'while', 'modulus', 'precedence', 'real midterm'],
  },
  {
    id: 'tr-for-if-else', title: 'For Loop with if/else Output',
    topic: 'tracing', kind: 'trace-table', difficulty: 'Practice', marks: 5,
    statement: TABLE_STATEMENT, traceVars: ['i', 'sum'], strict: true,
    solution: java`
      class Main {
          public static void main(String[] args) {
              int sum = 0;
              for (int i = 1; i <= 4; i++) {
                  sum += i * 2;
                  if (sum % 3 == 0) {
                      System.out.println(sum);
                  } else {
                      System.out.println(i + "-" + sum);
                  }
              }
              System.out.println("Final " + sum);
          }
      }
    `,
    hints: ['i + "-" + sum is String concatenation: it prints the number, a dash, then the other number.', 'The last line runs once, after the loop has finished.'],
    tags: ['trace table', 'for', 'concatenation'],
  },
  {
    id: 'tr-digit-alternating', title: 'Digit Loop with an Alternating Sign',
    topic: 'tracing', kind: 'trace-table', difficulty: 'Practice', marks: 5,
    statement: TABLE_STATEMENT, traceVars: ['n', 'd', 'sum', 'sign'], strict: true,
    solution: java`
      class Main {
          public static void main(String[] args) {
              int n = 5724;
              int sum = 0;
              int sign = 1;
              while (n > 0) {
                  int d = n % 10;
                  sum += d * sign;
                  System.out.println(d + ":" + sum);
                  sign = -sign;
                  n /= 10;
              }
              System.out.println(sum);
          }
      }
    `,
    hints: ['d is the last digit of n in each round. sign flips between 1 and -1 every iteration.'],
    tags: ['trace table', 'digits', 'while'],
  },
  {
    id: 'tr-nested-running-total', title: 'Nested Loop Running Total',
    topic: 'tracing', kind: 'trace-output', difficulty: 'Practice', marks: 5,
    statement: 'Write the exact output of the program. `print` does not end the line; the empty `println()` does.', strict: true,
    solution: java`
      class Main {
          public static void main(String[] args) {
              int total = 1;
              for (int i = 1; i <= 3; i++) {
                  for (int j = 1; j <= 2; j++) {
                      total += i * j;
                      System.out.print(total + " ");
                  }
                  System.out.println();
              }
              System.out.println(total);
          }
      }
    `,
    hints: ['The inner loop runs twice for every value of i. Keep one running total across all six inner iterations.'],
    tags: ['output', 'nested loop'],
  },
  {
    id: 'tr-nested-break-continue', title: 'Nested Loop with break and continue',
    topic: 'tracing', kind: 'trace-output', difficulty: 'Exam', marks: 8,
    statement: 'Write the exact output. `continue` skips to the next j; `break` leaves only the inner loop — the `println("|" + i)` still runs for every i.', strict: true,
    solution: java`
      class Main {
          public static void main(String[] args) {
              int count = 0;
              for (int i = 1; i <= 4; i++) {
                  for (int j = 1; j <= 4; j++) {
                      if ((i + j) % 2 == 0) continue;
                      count += i + j;
                      if (count > 15) break;
                      System.out.print(count + " ");
                  }
                  System.out.println("|" + i);
              }
              System.out.println(count);
          }
      }
    `,
    hints: ['Only pairs where i + j is odd reach the count line.', 'Once count passes 15, every later inner loop breaks after its first counted pair — but count still grows first.'],
    tags: ['output', 'nested loop', 'break', 'continue'],
  },
  {
    id: 'tr-arith-problem17', title: 'Arithmetic Tracing — Problem 17',
    topic: 'operators', kind: 'trace-output', difficulty: 'Exam', marks: 8,
    statement: 'Write the exact output of the following code, line by line.', strict: true,
    solution: java`
      public class Main {
          public static void main(String[] args) {
              int p, y = 25, w = 14, j = 12, z = 2, c = 3;
              double d = 42;
              p = y / 3 % 2;
              System.out.println(y - p / 2);
              j *= 2;
              w = w / 2 * 3 - j;
              System.out.println(w % 2 + j);
              z += 8;
              d /= 2;
              c = z % c;
              d = 1 + d / c + 21;
              System.out.println(d / 2 + 3 + "c");
              c = c++ + c-- + z++ + z-- + ++c;
              System.out.println(c * 2 + d);
          }
      }
    `,
    hints: ['y / 3 % 2 is evaluated left to right: (25 / 3) % 2 with integer division.', 'd / 2 + 3 + "c": the two numbers are added first (left to right), then "c" is appended.', 'In c++ + c-- + ..., each operand uses the value c has at that moment. Write c after every single operand.'],
    tags: ['output', 'operators', 'precedence', 'postfix', 'double'],
  },
  {
    id: 'tr-arith-q25', title: 'Midterm-Style Arithmetic Table',
    topic: 'operators', kind: 'trace-output', difficulty: 'Exam', marks: 8,
    statement: 'Write the exact output.', strict: true,
    solution: java`
      class Main {
          public static void main(String[] args) {
              int p, y = 31, w = 16, j = 9, z = 5, c = 5;
              double d = 36;
              p = y / 4 % 3;
              System.out.println(y - p / 2);
              j *= 3;
              w = w / 2 * 3 - j;
              System.out.println(w % 5 + j);
              z += 7;
              d /= 4;
              c = z % c;
              d = 2 + d / c + 19;
              System.out.println(d / 2 + 4 + "x");
              c = c++ + c-- + z++ + --z + ++c;
              System.out.println(c * 2 + d);
          }
      }
    `,
    hints: ['Java keeps the sign of the left operand for %: a negative w gives a negative w % 5.', 'c * 2 + d mixes int and double — the result is a double, printed with .0 or decimals.'],
    tags: ['output', 'operators', 'precedence', 'postfix', 'double'],
  },
  {
    id: 'tr-arith-basic', title: 'Basic Variable Tracing',
    topic: 'operators', kind: 'trace-output', difficulty: 'Warm-up', marks: 3,
    statement: 'Write the exact output.', strict: true,
    solution: java`
      class Main {
          public static void main(String[] args) {
              int a = 8;
              int b = 5;
              System.out.println(a);
              System.out.println(b);
              a += b;
              b = a - b * 2;
              System.out.println(a);
              System.out.println(b);
              a = a / 3 + b % 4;
              System.out.println(a);
              System.out.println(a == b);
          }
      }
    `,
    hints: ['b = a - b * 2 uses the NEW a (13) and multiplies before subtracting.'],
    tags: ['output', 'operators'],
  },
  {
    id: 'tr-arith-precedence', title: 'Operator Precedence',
    topic: 'operators', kind: 'trace-output', difficulty: 'Practice', marks: 5,
    statement: 'Write the exact output.', strict: true,
    solution: java`
      class Main {
          public static void main(String[] args) {
              int x = 26;
              int y = 7;
              int z = 4;
              System.out.println(x + y * z);
              System.out.println((x + y) * z);
              System.out.println(x - y * z + x / z);
              System.out.println(x % y + z * y);
              y = x / y + z % y;
              System.out.println(y);
              z = x % z + y * 3;
              System.out.println(z);
              System.out.println(x + y * z - x / y);
          }
      }
    `,
    hints: ['*, / and % happen before + and -. Operators of the same level go left to right.'],
    tags: ['output', 'operators', 'precedence'],
  },
  {
    id: 'tr-arith-multistep', title: 'Multi-Step Arithmetic Tracing',
    topic: 'operators', kind: 'trace-output', difficulty: 'Practice', marks: 5,
    statement: 'Write the exact output.', strict: true,
    solution: java`
      class Main {
          public static void main(String[] args) {
              int p = 18;
              int q = 5;
              int r = 3;
              System.out.println(p - q + r);
              p = p + q * r - p / q;
              System.out.println(p);
              q = p % r + q * 2;
              System.out.println(q);
              r = p / q + r % q;
              System.out.println(r);
              System.out.println(p + q * r - p % q);
              System.out.println((p + q + r) / 4);
          }
      }
    `,
    hints: ['Every assignment changes a variable for all later lines. Keep a small table p | q | r and update it after each line.'],
    tags: ['output', 'operators'],
  },
  {
    id: 'tr-incdec-1', title: 'Increment and Decrement Tracing',
    topic: 'operators', kind: 'trace-output', difficulty: 'Challenge', marks: 8,
    statement: 'Write the exact output. Each operand is evaluated left to right and sees every change made before it.', strict: true,
    solution: java`
      class Main {
          public static void main(String[] args) {
              int x = 6;
              int y = 4;
              System.out.println(x + " " + y);
              x = ++x + y-- - --y;
              System.out.println(x + " " + y);
              y = x++ + ++y - x--;
              System.out.println(x + " " + y);
              x = ++x - --x + y++ - --y + x--;
              System.out.println(x + " " + y);
              System.out.println(++x + y-- - x++ + --y);
              System.out.println(x + " " + y);
          }
      }
    `,
    hints: ['In x = ... x-- ..., the assignment happens LAST and overwrites whatever the x-- did.', 'Write the value each operand contributes under it, and the variable value after it.'],
    tags: ['output', 'postfix', 'prefix'],
  },
  {
    id: 'tr-incdec-2', title: 'More Prefix/Postfix Tracing',
    topic: 'operators', kind: 'trace-output', difficulty: 'Challenge', marks: 8,
    statement: 'Write the exact output.', strict: true,
    solution: java`
      class Main {
          public static void main(String[] args) {
              int a = 5;
              int b = 8;
              a = a++ + ++a - --b;
              System.out.println(a + " " + b);
              b = ++a + b-- - a++;
              System.out.println(a + " " + b);
              a = b++ - --a + ++b;
              System.out.println(a + " " + b);
              System.out.println(a++ + --b - ++a + b--);
              System.out.println(a + " " + b);
          }
      }
    `,
    hints: ['a++ + ++a with a = 5: the first operand gives 5 (a becomes 6), the second makes a 7 and gives 7.'],
    tags: ['output', 'postfix', 'prefix'],
  },
  {
    id: 'tr-compound', title: 'Compound Assignment Tracing',
    topic: 'operators', kind: 'trace-output', difficulty: 'Exam', marks: 6,
    statement: 'Write the exact output.', strict: true,
    solution: java`
      class Main {
          public static void main(String[] args) {
              int a = 12, b = 5, c = 9;
              a -= b % 3 + c / 4;
              System.out.println(a);
              b += a++ - --c;
              System.out.println(a + " " + b + " " + c);
              c = a % b + b % a + c;
              System.out.println(c);
              System.out.println(a * b / c + a % c);
          }
      }
    `,
    hints: ['a -= X means a = a - (X): the whole right side is computed first.'],
    tags: ['output', 'compound assignment'],
  },
  {
    id: 'tr-boolean-basics', title: 'Boolean Basics',
    topic: 'conditions', kind: 'trace-output', difficulty: 'Warm-up', marks: 3,
    statement: 'Write the exact output.', strict: true,
    solution: java`
      class Main {
          public static void main(String[] args) {
              boolean a = (9 % 4 == 1) && true;
              boolean b = !a || (12 / 5 == 2);
              boolean c = (a && b) || false;
              System.out.println(a);
              System.out.println(b);
              System.out.println(c);
              System.out.println((a || b) && !c);
          }
      }
    `,
    hints: ['Evaluate the arithmetic inside each comparison first, then the comparison, then && / ||.'],
    tags: ['output', 'boolean', 'logical operators'],
  },
  {
    id: 'tr-boolean-expr', title: 'Boolean Expression Tracing',
    topic: 'conditions', kind: 'trace-output', difficulty: 'Practice', marks: 5,
    statement: 'Write the exact output.', strict: true,
    solution: java`
      class Main {
          public static void main(String[] args) {
              boolean a, b, c, d, e;
              a = (15 % 4 == 3) && true;
              b = (a || false) && !(8 / 3 == 3);
              c = !b || (a && true);
              d = (a && b) || (c && !false);
              e = (d && !b) || (a && c);
              System.out.println(a + " " + b);
              System.out.println(c + " " + d);
              System.out.println(e);
              System.out.println((a || b) && (d && !e));
          }
      }
    `,
    hints: ['8 / 3 is 2 in integer division, so 8 / 3 == 3 is false.'],
    tags: ['output', 'boolean'],
  },
  {
    id: 'tr-short-circuit', title: 'Short-Circuit Tracing',
    topic: 'conditions', kind: 'trace-output', difficulty: 'Challenge', marks: 8,
    statement: 'Write the exact output. `&&` and `||` stop as soon as the answer is known — the right side may never run, so its `++` never happens.', strict: true,
    solution: java`
      class Main {
          public static void main(String[] args) {
              int a = 2, b = 3, c = 4;
              boolean r1 = (++a > 2) || (b++ > 3);
              System.out.println(r1 + " " + a + " " + b + " " + c);
              boolean r2 = (b++ < 4) && (--c == 3);
              System.out.println(r2 + " " + a + " " + b + " " + c);
              boolean r3 = (a++ == 3) && (c++ == 3) || (b > 4);
              System.out.println(r3 + " " + a + " " + b + " " + c);
              System.out.println((r1 && r2) || !r3);
          }
      }
    `,
    hints: ['r1: the left side is already true, so || skips b++ entirely.', '&& binds tighter than ||: (A && B) || C.'],
    tags: ['output', 'short circuit', 'boolean', 'postfix'],
  },
  {
    id: 'tr-conditional', title: 'Conditional Tracing',
    topic: 'conditions', kind: 'trace-output', difficulty: 'Practice', marks: 4,
    statement: 'Write the exact output.', strict: true,
    solution: java`
      class Main {
          public static void main(String[] args) {
              int mark = 73;
              int bonus = 5;
              if (mark + bonus >= 80) {
                  System.out.println("A");
              } else if (mark >= 70 && bonus > 3) {
                  System.out.println("B+");
              } else {
                  System.out.println("B");
              }
              mark -= 10;
              if (mark % 2 == 1 || bonus % 2 == 0) {
                  System.out.println(mark + bonus);
              } else {
                  System.out.println(mark - bonus);
              }
          }
      }
    `,
    hints: ['Only the first true branch of an if / else-if chain runs.'],
    tags: ['output', 'if else'],
  },
  {
    id: 'tr-switch-fallthrough', title: 'Switch Fall-Through',
    topic: 'conditions', kind: 'trace-output', difficulty: 'Exam', marks: 6,
    statement: 'Write the exact output. A `case` without `break` falls through into the next case.', strict: true,
    solution: java`
      class Main {
          public static void main(String[] args) {
              int total = 0;
              for (int d = 1; d <= 5; d++) {
                  switch (d % 4) {
                      case 0:
                          total += 10;
                      case 1:
                          total += 1;
                          break;
                      case 2:
                          total *= 2;
                      default:
                          total -= 3;
                  }
                  System.out.println(d + ": " + total);
              }
          }
      }
    `,
    hints: ['d % 4 is 1, 2, 3, 0, 1 for d = 1..5.', 'case 2 has no break, so total *= 2 is followed by total -= 3.'],
    tags: ['output', 'switch', 'fall-through'],
  },
  {
    id: 'tr-casting', title: 'Type Conversion Tracing',
    topic: 'variables', kind: 'trace-output', difficulty: 'Practice', marks: 5,
    statement: 'Write the exact output. Pay attention to which values are int, float, double, char and String.', strict: true,
    solution: java`
      class Main {
          public static void main(String[] args) {
              int a = 15;
              int b = 4;
              System.out.println(a + b);
              float a1 = a;
              float b1 = b;
              String a2 = Integer.toString(a);
              String b2 = Integer.toString(b);
              System.out.println(a1 + b1);
              System.out.println(a1 == a);
              System.out.println(a2 + b2);
              System.out.println(a2 + "Hi" + b2);
              System.out.println("Hi" + Integer.toString(b + 1));
              System.out.println(a / b + " " + (double) a / b + " " + (double) (a / b));
              char c = 'A';
              System.out.println(c + 2);
              System.out.println((char) (c + 2));
              System.out.println((int) 7.99 + " " + (int) -7.99);
          }
      }
    `,
    hints: ['A float prints with a decimal point (19.0). Two Strings joined with + are concatenated, not added.', '(double) a / b casts a first; (double) (a / b) divides as ints first and only then converts.'],
    tags: ['output', 'casting', 'String', 'char'],
  },
  {
    id: 'tr-scanner-trap', title: 'The nextLine() Trap',
    topic: 'input', kind: 'trace-output', difficulty: 'Exam', marks: 5,
    statement: 'The user types exactly this input (three lines):\n\n`21`\n`Rahim Uddin`\n`3.5`\n\nWrite the exact output of the program.', strict: true,
    samples: [{ input: '21\nRahim Uddin\n3.5\n' }],
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int age = sc.nextInt();
              String name = sc.nextLine();
              String next = sc.nextLine();
              double gpa = sc.nextDouble();
              System.out.println("[" + name + "]");
              System.out.println("[" + next + "]");
              System.out.println(age + 1);
              System.out.println(gpa * 2);
          }
      }
    `,
    hints: ['nextInt() reads 21 but leaves the Enter key (the line break) in the input.', 'The first nextLine() therefore reads the rest of line 1 — which is empty.'],
    tags: ['output', 'Scanner', 'nextLine'],
  },
];
