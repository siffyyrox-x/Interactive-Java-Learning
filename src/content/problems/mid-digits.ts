import { java, SCANNER_STARTER, type Problem } from '../model';

const NO_STRINGS = ['Use arithmetic, loops, and if/else only.', 'Do not use String, arrays, or collections.'];
const CHECKSUM_HINTS = [
  'Keep a copy of the original number before the first loop — the backward traversal destroys the value it works on.',
  'Backward traversal: d = n % 10 gives the last digit, n = n / 10 removes it. Track the position with a counter that starts at 1.',
  'Forward traversal without Strings: find the largest power of 10 not greater than the number (e.g. 100000000 for a 9-digit number). Then d = (num / div) % 10 and div = div / 10 walks from the left.',
];
const CHECKSUM_PLAN = [
  'Read the number and store a copy in original.',
  'Loop while n > 0: take d = n % 10, update checksum by the rule, then n = n / 10.',
  'Print the checksum line and the selection message.',
  'Build div = 1 and multiply by 10 while div * 10 <= original.',
  'Loop while div > 0: d = (original / div) % 10; print d if it matches the rule; div = div / 10.',
];

export const digitProblems: Problem[] = [
  {
    id: 'dg-weighted-checksum',
    title: 'Weighted Digit Checksum',
    topic: 'digits', kind: 'code', difficulty: 'Exam', marks: 10,
    statement: `You are given a positive integer. Traverse its digits **from right to left**, numbering positions from 1 at the rightmost digit.
- Add the digit at every **odd** position to checksum. Add **twice** the digit at every **even** position.
- After processing each digit, if checksum is 10 or more, keep only \`checksum % 10\`.
- After the traversal, if checksum is even, print all **even** digits of the original number from left to right. Otherwise print all **odd** digits from left to right.`,
    restrictions: NO_STRINGS,
    rules: { noStringsOrArrays: true },
    samples: [
      { input: '154897258', output: 'Checksum = 4\nThe checksum is even.\nEven digits: 4 8 2 8' },
      { input: '100003', output: 'Checksum = 5\nThe checksum is odd.\nOdd digits: 1 3' },
    ],
    tests: ['7', '2468', '13579', '987654321', '1000000'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int num = sc.nextInt();
              int original = num;

              int checksum = 0;
              int pos = 1;
              while (num > 0) {
                  int d = num % 10;
                  if (pos % 2 == 1) {
                      checksum += d;
                  } else {
                      checksum += 2 * d;
                  }
                  if (checksum >= 10) {
                      checksum = checksum % 10;
                  }
                  num = num / 10;
                  pos++;
              }
              System.out.println("Checksum = " + checksum);

              int div = 1;
              while (div * 10 <= original) {
                  div = div * 10;
              }
              if (checksum % 2 == 0) {
                  System.out.println("The checksum is even.");
                  System.out.print("Even digits:");
              } else {
                  System.out.println("The checksum is odd.");
                  System.out.print("Odd digits:");
              }
              while (div > 0) {
                  int d = (original / div) % 10;
                  if (d % 2 == checksum % 2) {
                      System.out.print(" " + d);
                  }
                  div = div / 10;
              }
              System.out.println();
          }
      }
    `,
    hints: CHECKSUM_HINTS,
    plan: CHECKSUM_PLAN,
    tags: ['checksum', 'digits', 'while', 'forward traversal'],
  },
  {
    id: 'dg-pair-difference',
    title: 'Pair-Difference Checksum',
    topic: 'digits', kind: 'code', difficulty: 'Exam', marks: 10,
    statement: `You are given a positive integer. Starting from the right, take **two digits at a time**. For every pair, add the absolute difference of the two digits to checksum.
- Remove both digits and continue. If one digit remains at the left end, add that digit to checksum.
- After every pair (or the remaining digit), keep only \`checksum % 10\`.
- If the final checksum is less than 5, print all digits **smaller than 5** from left to right. Otherwise print all digits **greater than or equal to 5** from left to right.`,
    restrictions: NO_STRINGS,
    rules: { noStringsOrArrays: true },
    samples: [
      { input: '154897258', output: 'Checksum = 1\nDigits smaller than 5: 1 4 2' },
      { input: '7362415', output: 'Checksum = 6\nDigits at least 5: 7 6 5' },
    ],
    tests: ['5', '90', '1234', '55555', '808080'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int num = sc.nextInt();
              int original = num;

              int checksum = 0;
              while (num > 0) {
                  if (num >= 10) {
                      int a = num % 10;
                      int b = (num / 10) % 10;
                      checksum += Math.abs(a - b);
                      num = num / 100;
                  } else {
                      checksum += num;
                      num = 0;
                  }
                  checksum = checksum % 10;
              }
              System.out.println("Checksum = " + checksum);

              int div = 1;
              while (div * 10 <= original) {
                  div = div * 10;
              }
              if (checksum < 5) {
                  System.out.print("Digits smaller than 5:");
              } else {
                  System.out.print("Digits at least 5:");
              }
              while (div > 0) {
                  int d = (original / div) % 10;
                  if ((checksum < 5 && d < 5) || (checksum >= 5 && d >= 5)) {
                      System.out.print(" " + d);
                  }
                  div = div / 10;
              }
              System.out.println();
          }
      }
    `,
    hints: [
      'In each round, check whether at least two digits remain (num >= 10). If so, the pair is num % 10 and (num / 10) % 10, and num / 100 removes both.',
      'If only one digit remains (num < 10), add num itself and stop.',
      CHECKSUM_HINTS[2],
    ],
    plan: CHECKSUM_PLAN,
    tags: ['checksum', 'digits', 'Math.abs'],
  },
  {
    id: 'dg-alternating-sum',
    title: 'Alternating-Sum Checksum',
    topic: 'digits', kind: 'code', difficulty: 'Exam', marks: 10,
    statement: `You are given a positive integer. Traverse its digits from right to left, starting with position 1 at the rightmost digit.
- **Add** digits in odd positions to checksum and **subtract** digits in even positions. After all digits are processed, replace checksum by its absolute value.
- If checksum is divisible by 3, print every digit of the original number that is divisible by 3, from left to right. Otherwise print every digit that is **not** divisible by 3. Treat 0 as divisible by 3.`,
    restrictions: NO_STRINGS,
    rules: { noStringsOrArrays: true },
    samples: [
      { input: '9081726', output: 'Checksum = 27\nDivisible-by-3 digits: 9 0 6' },
      { input: '8601543', output: 'Checksum = 5\nOther digits: 8 1 5 4' },
    ],
    tests: ['3', '11', '123456', '909090', '147'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int num = sc.nextInt();
              int original = num;

              int checksum = 0;
              int pos = 1;
              while (num > 0) {
                  int d = num % 10;
                  if (pos % 2 == 1) {
                      checksum += d;
                  } else {
                      checksum -= d;
                  }
                  num = num / 10;
                  pos++;
              }
              checksum = Math.abs(checksum);
              System.out.println("Checksum = " + checksum);

              int div = 1;
              while (div * 10 <= original) {
                  div = div * 10;
              }
              boolean byThree = checksum % 3 == 0;
              if (byThree) {
                  System.out.print("Divisible-by-3 digits:");
              } else {
                  System.out.print("Other digits:");
              }
              while (div > 0) {
                  int d = (original / div) % 10;
                  if ((d % 3 == 0) == byThree) {
                      System.out.print(" " + d);
                  }
                  div = div / 10;
              }
              System.out.println();
          }
      }
    `,
    hints: CHECKSUM_HINTS,
    plan: CHECKSUM_PLAN,
    tags: ['checksum', 'digits', 'Math.abs'],
  },
  {
    id: 'dg-square-sum',
    title: 'Square-Sum Checksum',
    topic: 'digits', kind: 'code', difficulty: 'Exam', marks: 10,
    statement: `You are given a positive integer. Traverse its digits from right to left. For each digit, add the **square** of the digit to checksum and immediately keep only \`checksum % 10\`.
- After all digits are processed, decide whether checksum is one of the prime digits 2, 3, 5 or 7.
- If it is, print all prime digits (2, 3, 5, 7) of the original number from left to right. Otherwise print all non-prime digits (0, 1, 4, 6, 8, 9) from left to right.`,
    restrictions: NO_STRINGS,
    rules: { noStringsOrArrays: true },
    samples: [
      { input: '21101108', output: 'Checksum = 2\nPrime digits: 2' },
      { input: '154897258', output: 'Checksum = 9\nNon-prime digits: 1 4 8 9 8' },
    ],
    tests: ['7', '2357', '1', '99', '460812'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int num = sc.nextInt();
              int original = num;

              int checksum = 0;
              while (num > 0) {
                  int d = num % 10;
                  checksum = (checksum + d * d) % 10;
                  num = num / 10;
              }
              System.out.println("Checksum = " + checksum);

              boolean primeSum = checksum == 2 || checksum == 3 || checksum == 5 || checksum == 7;
              int div = 1;
              while (div * 10 <= original) {
                  div = div * 10;
              }
              if (primeSum) {
                  System.out.print("Prime digits:");
              } else {
                  System.out.print("Non-prime digits:");
              }
              while (div > 0) {
                  int d = (original / div) % 10;
                  boolean primeDigit = d == 2 || d == 3 || d == 5 || d == 7;
                  if (primeDigit == primeSum) {
                      System.out.print(" " + d);
                  }
                  div = div / 10;
              }
              System.out.println();
          }
      }
    `,
    hints: CHECKSUM_HINTS,
    plan: CHECKSUM_PLAN,
    tags: ['checksum', 'digits', 'boolean'],
  },
  {
    id: 'dg-product-checksum',
    title: 'Non-Zero Product Checksum',
    topic: 'digits', kind: 'code', difficulty: 'Challenge', marks: 10,
    statement: `You are given a positive integer. Traverse its digits from right to left. Start checksum at **1**. Ignore every zero digit. For each non-zero digit set \`checksum = (checksum * digit) % 10\`.
- If checksum is even, print the digits in **even positions** of the original number, counting positions **from the left** starting at 1. If checksum is odd, print the digits in odd positions.
- Print the selected digits from left to right. You will need the number of digits before the forward traversal.`,
    restrictions: NO_STRINGS,
    rules: { noStringsOrArrays: true },
    samples: [
      { input: '21101108', output: 'Checksum = 6\nEven-position digits: 1 0 1 8' },
      { input: '100003', output: 'Checksum = 3\nOdd-position digits: 1 0 0' },
    ],
    tests: ['5', '10', '2468', '13579', '7070707'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int num = sc.nextInt();
              int original = num;

              int checksum = 1;
              while (num > 0) {
                  int d = num % 10;
                  if (d != 0) {
                      checksum = (checksum * d) % 10;
                  }
                  num = num / 10;
              }
              System.out.println("Checksum = " + checksum);

              int div = 1;
              while (div * 10 <= original) {
                  div = div * 10;
              }
              boolean even = checksum % 2 == 0;
              if (even) {
                  System.out.print("Even-position digits:");
              } else {
                  System.out.print("Odd-position digits:");
              }
              int pos = 1;
              while (div > 0) {
                  int d = (original / div) % 10;
                  if ((pos % 2 == 0) == even) {
                      System.out.print(" " + d);
                  }
                  div = div / 10;
                  pos++;
              }
              System.out.println();
          }
      }
    `,
    hints: [
      'Zero digits are skipped in the checksum only — they still count as positions in the forward traversal.',
      'Positions here are counted from the LEFT, so count pos while walking forward with the power-of-10 divisor.',
      CHECKSUM_HINTS[2],
    ],
    plan: CHECKSUM_PLAN,
    tags: ['checksum', 'digits', 'positions'],
  },
  {
    id: 'dg-merge-checksum',
    title: 'Merge-Last-Two Checksum',
    topic: 'digits', kind: 'code', difficulty: 'Exam', marks: 10,
    statement: `You are given an integer. Calculate a checksum by iterating **backward** over it:
- Add the last two digits. If the sum is 10 or more, keep only \`sum % 10\`.
- Replace the last two digits with this single new digit. Repeat until only one digit is left — that digit is the checksum.
- If the checksum is even, print the even digits of the original number with **forward** iteration; otherwise print the odd digits.

For 154897258: 5 + 8 = 13 → 3, so the number becomes 15489723. Then 2 + 3 = 5 → 1548975, and so on until 9 remains.`,
    restrictions: NO_STRINGS,
    rules: { noStringsOrArrays: true },
    samples: [
      { input: '154897258', output: 'Checksum = 9\nThe checksum is odd.\nOdd digits of the Integer:\n1 5 9 7 5' },
      { input: '21101108', output: 'Checksum = 4\nThe checksum is even.\nEven digits of the Integer:\n2 0 0 8' },
    ],
    tests: ['6', '19', '99999', '1234567', '2020'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int num = sc.nextInt();
              int original = num;

              while (num >= 10) {
                  int last = num % 10;
                  int secondLast = (num / 10) % 10;
                  int sum = last + secondLast;
                  if (sum >= 10) {
                      sum = sum % 10;
                  }
                  num = (num / 100) * 10 + sum;
              }
              int checksum = num;
              System.out.println("Checksum = " + checksum);

              int div = 1;
              while (div * 10 <= original) {
                  div = div * 10;
              }
              if (checksum % 2 == 0) {
                  System.out.println("The checksum is even.");
                  System.out.println("Even digits of the Integer:");
              } else {
                  System.out.println("The checksum is odd.");
                  System.out.println("Odd digits of the Integer:");
              }
              boolean first = true;
              while (div > 0) {
                  int d = (original / div) % 10;
                  if (d % 2 == checksum % 2) {
                      if (!first) System.out.print(" ");
                      System.out.print(d);
                      first = false;
                  }
                  div = div / 10;
              }
              System.out.println();
          }
      }
    `,
    hints: [
      'Loop while num >= 10 (more than one digit). The last two digits are num % 10 and (num / 10) % 10.',
      'num / 100 removes both digits; multiplying by 10 and adding the new digit puts the new digit on the end: num = (num / 100) * 10 + sum.',
      CHECKSUM_HINTS[2],
    ],
    plan: ['Keep original.', 'While num has two or more digits, merge its last two digits into one.', 'The remaining single digit is the checksum.', 'Walk the original forwards with a power-of-10 divisor and print digits with the same parity as the checksum.'],
    tags: ['checksum', 'digits', 'real midterm'],
  },
  {
    id: 'dg-same-digit-count',
    title: 'Same Number of Digits',
    topic: 'digits', kind: 'code', difficulty: 'Practice', marks: 5,
    statement: 'Take two positive integers. Print `Equal` if both have the same number of digits; otherwise print `Not Equal`.',
    samples: [{ input: '1234 5678', output: 'Equal' }, { input: '123 45', output: 'Not Equal' }],
    tests: ['7 9', '10 99', '100000 99999'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int a = sc.nextInt();
              int b = sc.nextInt();
              int countA = 0, countB = 0;
              while (a > 0) {
                  countA++;
                  a = a / 10;
              }
              while (b > 0) {
                  countB++;
                  b = b / 10;
              }
              if (countA == countB) {
                  System.out.println("Equal");
              } else {
                  System.out.println("Not Equal");
              }
          }
      }
    `,
    hints: ['Count digits by repeatedly dividing by 10 until the number becomes 0.', 'Use two separate counters, one per number.'],
    tags: ['digits', 'counting'],
  },
  {
    id: 'dg-digit-sum-parity',
    title: 'Sum of Digits Parity',
    topic: 'digits', kind: 'code', difficulty: 'Practice', marks: 5,
    statement: 'Take a positive integer and add up its digits. Print `The sum is even.` if the sum is even, otherwise `The sum is odd.`',
    samples: [{ input: '2754', output: 'The sum is even.', note: '2 + 7 + 5 + 4 = 18' }, { input: '54637', output: 'The sum is odd.', note: '5 + 4 + 6 + 3 + 7 = 25' }],
    tests: ['1', '11', '99999'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              int sum = 0;
              while (n > 0) {
                  sum += n % 10;
                  n /= 10;
              }
              if (sum % 2 == 0) {
                  System.out.println("The sum is even.");
              } else {
                  System.out.println("The sum is odd.");
              }
          }
      }
    `,
    hints: ['sum += n % 10 adds the last digit; n /= 10 removes it.'],
    tags: ['digits', 'sum'],
  },
  {
    id: 'dg-reverse',
    title: 'Reverse a Number',
    topic: 'digits', kind: 'code', difficulty: 'Practice', marks: 5,
    statement: 'Take a positive integer and print the reversed number. Leading zeros of the result disappear, as they would for any int.',
    samples: [{ input: '5021', output: '1205' }, { input: '1200', output: '21' }],
    tests: ['7', '10', '987654321'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              int rev = 0;
              while (n > 0) {
                  rev = rev * 10 + n % 10;
                  n = n / 10;
              }
              System.out.println(rev);
          }
      }
    `,
    hints: ['rev = rev * 10 + digit shifts the digits already collected one place left and appends the new digit.'],
    tags: ['digits', 'reverse'],
  },
  {
    id: 'dg-palindrome',
    title: 'Palindrome Number',
    topic: 'digits', kind: 'code', difficulty: 'Practice', marks: 5,
    statement: 'Take a positive integer and print `Palindrome` if it reads the same forwards and backwards; otherwise print `Not Palindrome`.',
    samples: [{ input: '1221', output: 'Palindrome' }, { input: '1231', output: 'Not Palindrome' }],
    tests: ['7', '10', '12321', '123321', '1000021'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              int original = n, rev = 0;
              while (n > 0) {
                  rev = rev * 10 + n % 10;
                  n /= 10;
              }
              if (original == rev) {
                  System.out.println("Palindrome");
              } else {
                  System.out.println("Not Palindrome");
              }
          }
      }
    `,
    hints: ['Reverse a copy of the number, then compare the reverse with the original you kept.'],
    tags: ['digits', 'reverse', 'palindrome'],
  },
  {
    id: 'dg-binary-to-decimal',
    title: 'Binary to Decimal',
    topic: 'digits', kind: 'code', difficulty: 'Practice', marks: 5,
    statement: 'Take a binary number typed as an ordinary integer (only digits 0 and 1) and print its decimal value.',
    samples: [{ input: '1111', output: '15', note: '1·2³ + 1·2² + 1·2¹ + 1·2⁰' }, { input: '0101', output: '5' }],
    tests: ['0', '1', '10', '1000000', '1011011'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int bin = sc.nextInt();
              int dec = 0, power = 1;
              while (bin > 0) {
                  int bit = bin % 10;
                  dec += bit * power;
                  power *= 2;
                  bin /= 10;
              }
              System.out.println(dec);
          }
      }
    `,
    hints: ['The rightmost digit is worth 1, the next 2, then 4, 8... Keep a power variable that doubles each round.'],
    tags: ['digits', 'binary'],
  },
  {
    id: 'dg-decimal-to-binary',
    title: 'Decimal to Binary',
    topic: 'digits', kind: 'code', difficulty: 'Exam', marks: 5,
    statement: 'Take a positive decimal integer and print its binary equivalent as a number made of 0s and 1s. Do not use Strings.',
    samples: [{ input: '13', output: '1101' }, { input: '8', output: '1000' }],
    tests: ['1', '2', '255', '1000'],
    restrictions: ['Do not use String or Integer.toBinaryString.'],
    rules: { noStringsOrArrays: true, forbidCalls: ['Integer.toBinaryString'] },
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              int bin = 0, place = 1;
              while (n > 0) {
                  bin += (n % 2) * place;
                  place *= 10;
                  n /= 2;
              }
              System.out.println(bin);
          }
      }
    `,
    hints: ['n % 2 is the next binary digit (from the right) and n / 2 removes it.', 'Place each bit at 1, 10, 100, ... so the digits line up as a decimal-looking number.'],
    tags: ['digits', 'binary'],
  },
  {
    id: 'dg-first-last',
    title: 'First and Last Digit',
    topic: 'digits', kind: 'code', difficulty: 'Practice', marks: 5,
    statement: 'Take a positive integer and print `Same` if its first digit equals its last digit; otherwise print `Different`.',
    samples: [{ input: '7237', output: 'Same' }, { input: '8245', output: 'Different' }],
    tests: ['5', '10', '11', '90009'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              int last = n % 10;
              while (n >= 10) {
                  n /= 10;
              }
              int first = n;
              if (first == last) {
                  System.out.println("Same");
              } else {
                  System.out.println("Different");
              }
          }
      }
    `,
    hints: ['The last digit is n % 10. Divide by 10 while n >= 10 — what remains is the first digit.'],
    tags: ['digits'],
  },
  {
    id: 'dg-even-minus-odd',
    title: 'Even Digit Sum minus Odd Digit Sum',
    topic: 'digits', kind: 'code', difficulty: 'Practice', marks: 5,
    statement: 'Take a positive integer and print (sum of its even digits) − (sum of its odd digits).',
    samples: [{ input: '57248', output: '2', note: '(2 + 4 + 8) − (5 + 7) = 2' }],
    tests: ['1', '2468', '13579', '1000'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              int even = 0, odd = 0;
              while (n > 0) {
                  int d = n % 10;
                  if (d % 2 == 0) {
                      even += d;
                  } else {
                      odd += d;
                  }
                  n /= 10;
              }
              System.out.println(even - odd);
          }
      }
    `,
    hints: ['Keep two separate sums and decide which one each digit goes to with d % 2.'],
    tags: ['digits'],
  },
  {
    id: 'dg-min-max-digit',
    title: 'Smallest and Largest Digit',
    topic: 'digits', kind: 'code', difficulty: 'Practice', marks: 5,
    statement: 'A telecom company studies mobile numbers. Take a positive integer and print its smallest digit and its largest digit, in the format shown.',
    samples: [{ input: '58329', output: 'Smallest digit: 2\nLargest digit: 9' }, { input: '7', output: 'Smallest digit: 7\nLargest digit: 7' }],
    tests: ['1000', '90817', '5555'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              int min = 9, max = 0;
              while (n > 0) {
                  int d = n % 10;
                  if (d < min) min = d;
                  if (d > max) max = d;
                  n /= 10;
              }
              System.out.println("Smallest digit: " + min);
              System.out.println("Largest digit: " + max);
          }
      }
    `,
    hints: ['Start min at 9 and max at 0 — any real digit will replace them.'],
    tags: ['digits', 'min max'],
  },
  {
    id: 'dg-pin-frequency',
    title: 'PIN Digit Frequency',
    topic: 'digits', kind: 'code', difficulty: 'Exam', marks: 10,
    statement: 'A banking app records how often each digit appears in a PIN. Take the PIN as an integer and print the frequency of every digit from 0 to 9, one per line, as `digit: count`. You may not use arrays — use a loop over the ten digits with an inner loop over the PIN.',
    restrictions: ['Do not use arrays or Strings.'],
    rules: { noStringsOrArrays: true },
    samples: [{ input: '445899', output: 'Frequency of digits:\n0: 0\n1: 0\n2: 0\n3: 0\n4: 2\n5: 1\n6: 0\n7: 0\n8: 1\n9: 2' }],
    tests: ['1234', '1000000', '9'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int pin = sc.nextInt();
              System.out.println("Frequency of digits:");
              for (int digit = 0; digit <= 9; digit++) {
                  int count = 0;
                  int n = pin;
                  while (n > 0) {
                      if (n % 10 == digit) {
                          count++;
                      }
                      n /= 10;
                  }
                  System.out.println(digit + ": " + count);
              }
          }
      }
    `,
    hints: ['The outer loop picks a digit 0–9. The inner loop walks a fresh copy of the PIN and counts that digit.', 'Reset both the counter and the copy of the PIN at the start of every outer iteration.'],
    tags: ['digits', 'nested loop', 'frequency'],
  },
];
