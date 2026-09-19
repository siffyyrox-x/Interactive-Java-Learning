import { java, type Problem } from '../model';

const LINE_STARTER = java`
  import java.util.Scanner;

  public class Main {
      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          String s = sc.nextLine();
          // write your solution here

      }
  }
`;

const ARRAY_STARTER = java`
  import java.util.Scanner;

  public class Main {
      public static void main(String[] args) {
          Scanner sc = new Scanner(System.in);
          int n = sc.nextInt();
          int[] arr = new int[n];
          for (int i = 0; i < n; i++) {
              arr[i] = sc.nextInt();
          }
          // write your solution here

      }
  }
`;

const ARRAY_INPUT_NOTE = 'Input: n, then the n array elements.';
const BUILD_OUTPUT_NOTE = 'Print the new array\'s elements separated by single spaces (print `Empty` if it has no elements).';

// ============================================================ STRINGS
export const stringProblems: Problem[] = [
  {
    id: 'st-embedded-sum', title: 'Sum of Embedded Numbers',
    topic: 'strings', kind: 'code', difficulty: 'Exam', marks: 10,
    statement: 'Read a String of lowercase letters and digits. Consecutive digits form **one whole number**. Print the sum of all such numbers. Build each number manually: `num = num * 10 + (c - \'0\')`.',
    restrictions: ['Do not use Integer.parseInt() or Integer.valueOf().'],
    rules: { forbidCalls: ['Integer.parseInt', 'Integer.valueOf', 'Double.parseDouble'] },
    samples: [{ input: 'a12b3c45d8', output: '68' }, { input: 'ab12c3d45', output: '60' }],
    tests: ['abc', '7', 'x100y', '1a2b3c'],
    starter: LINE_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              String s = sc.nextLine();
              int total = 0, num = 0;
              boolean building = false;
              for (int i = 0; i < s.length(); i++) {
                  char c = s.charAt(i);
                  if (c >= '0' && c <= '9') {
                      num = num * 10 + (c - '0');
                      building = true;
                  } else if (building) {
                      total += num;
                      num = 0;
                      building = false;
                  }
              }
              if (building) {
                  total += num;
              }
              System.out.println(total);
          }
      }
    `,
    hints: ['c - \'0\' turns the character \'7\' into the number 7.', 'When a non-digit arrives after digits, the number is complete: add it and reset.', 'A number can also end at the very end of the String — add it after the loop.'],
    plan: ['Loop over every character.', 'Digit → extend num; non-digit → close the number if one was being built.', 'After the loop, close the final number.'],
    tags: ['String', 'charAt', 'manual parsing'],
  },
  {
    id: 'st-frequency-one', title: 'Characters That Appear Once',
    topic: 'strings', kind: 'code', difficulty: 'Exam', marks: 10,
    statement: 'Read a String. Build and print a new String containing only the characters that appear **exactly once** in the original, keeping their original order. Print `Empty` if there are none.',
    samples: [{ input: 'programming', output: 'poain' }, { input: 'aabb', output: 'Empty' }],
    tests: ['a', 'abcabcd', 'Mississippi'],
    starter: LINE_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              String s = sc.nextLine();
              String out = "";
              for (int i = 0; i < s.length(); i++) {
                  int count = 0;
                  for (int j = 0; j < s.length(); j++) {
                      if (s.charAt(j) == s.charAt(i)) {
                          count++;
                      }
                  }
                  if (count == 1) {
                      out += s.charAt(i);
                  }
              }
              if (out.equals("")) {
                  System.out.println("Empty");
              } else {
                  System.out.println(out);
              }
          }
      }
    `,
    hints: ['For every character, count how many times it appears in the whole String with an inner loop.', 'Append with out += s.charAt(i) — building a String character by character.'],
    tags: ['String', 'nested loop', 'frequency'],
  },
  {
    id: 'st-alternating-ends', title: 'Alternating Ends Builder',
    topic: 'strings', kind: 'code', difficulty: 'Exam', marks: 10,
    statement: 'Read a String and build a new one by taking the first character, then the last, then the second, then the second-last, and so on moving inward. Print it.',
    samples: [{ input: 'abcdefg', output: 'agbfced' }, { input: 'abcd', output: 'adbc' }],
    tests: ['a', 'ab', 'Programming'],
    starter: LINE_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              String s = sc.nextLine();
              String out = "";
              int left = 0, right = s.length() - 1;
              while (left <= right) {
                  out += s.charAt(left);
                  if (left != right) {
                      out += s.charAt(right);
                  }
                  left++;
                  right--;
              }
              System.out.println(out);
          }
      }
    `,
    hints: ['Use two indexes: one moving right from 0, one moving left from length() − 1.', 'When they meet in an odd-length String, add the middle character only once.'],
    tags: ['String', 'two pointers'],
  },
  {
    id: 'st-rle', title: 'Run-Length Encoder',
    topic: 'strings', kind: 'code', difficulty: 'Exam', marks: 10,
    statement: 'Read a lowercase String and compress each group of consecutive equal characters as the character followed by the group length. Groups of length 1 also show 1. Do not use an array for counting.',
    samples: [{ input: 'aaabbccccd', output: 'a3b2c4d1' }, { input: 'abc', output: 'a1b1c1' }],
    tests: ['z', 'zzzzzzzzzzzz', 'aabaa'],
    starter: LINE_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              String s = sc.nextLine();
              String out = "";
              int count = 1;
              for (int i = 1; i <= s.length(); i++) {
                  if (i < s.length() && s.charAt(i) == s.charAt(i - 1)) {
                      count++;
                  } else {
                      out += s.charAt(i - 1) + "" + count;
                      count = 1;
                  }
              }
              System.out.println(out);
          }
      }
    `,
    hints: ['Compare each character with the one before it. While they match, keep counting.', 'Close the last group by letting the loop run to i == length() and treating that as "different".', 's.charAt(i - 1) + "" + count — the "" makes it String concatenation instead of char + int arithmetic.'],
    tags: ['String', 'counting', 'char arithmetic'],
  },
  {
    id: 'st-first-last-keeper', title: 'First-and-Last Keeper',
    topic: 'strings', kind: 'code', difficulty: 'Exam', marks: 10,
    statement: 'Read a lowercase String. If a character appears more than once, keep only its **first and last** occurrence. If it appears once, keep it. Preserve the order of the kept characters and print the result.',
    samples: [{ input: 'banana', output: 'banna' }, { input: 'level', output: 'level' }],
    tests: ['aaaa', 'abc', 'abracadabra'],
    starter: LINE_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              String s = sc.nextLine();
              String out = "";
              for (int i = 0; i < s.length(); i++) {
                  char c = s.charAt(i);
                  if (i == s.indexOf(c) || i == s.lastIndexOf(c)) {
                      out += c;
                  }
              }
              System.out.println(out);
          }
      }
    `,
    hints: ['s.indexOf(c) is the first position of c and s.lastIndexOf(c) the last. Keep position i only if it is one of those two.'],
    tags: ['String', 'indexOf', 'lastIndexOf'],
  },
  {
    id: 'st-signed-sum', title: 'Signed Embedded Number Sum',
    topic: 'strings', kind: 'code', difficulty: 'Challenge', marks: 10,
    statement: 'A String contains lowercase letters, digits and minus signs. A minus sign **directly before** digits makes that number negative. Consecutive digits form one number. Print the total without using `Integer.parseInt()`.',
    rules: { forbidCalls: ['Integer.parseInt', 'Integer.valueOf'] },
    restrictions: ['Do not use Integer.parseInt() or Integer.valueOf().'],
    samples: [{ input: 'a12b-3c45d-8', output: '46' }],
    tests: ['-5', 'a-b-c', '10-10', 'x-1-1'],
    starter: LINE_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              String s = sc.nextLine();
              int total = 0;
              int i = 0;
              while (i < s.length()) {
                  int sign = 1;
                  if (s.charAt(i) == '-' && i + 1 < s.length() && Character.isDigit(s.charAt(i + 1))) {
                      sign = -1;
                      i++;
                  }
                  if (i < s.length() && Character.isDigit(s.charAt(i))) {
                      int num = 0;
                      while (i < s.length() && Character.isDigit(s.charAt(i))) {
                          num = num * 10 + (s.charAt(i) - '0');
                          i++;
                      }
                      total += sign * num;
                  } else {
                      i++;
                  }
              }
              System.out.println(total);
          }
      }
    `,
    hints: ['A while loop with a manual index is easier here than a for loop, because you move i forward by different amounts.', 'When you see "-" followed by a digit, remember the sign and step over the minus.'],
    tags: ['String', 'manual parsing', 'while'],
  },
  {
    id: 'st-simplify-terms', title: 'Simplify x-Terms and Constants',
    topic: 'strings', kind: 'code', difficulty: 'Challenge', marks: 10,
    statement: 'The input is an expression with signed whole-number x-terms and constants and no spaces, e.g. `12x-5+3x+9-4x-7`. Every x-term has a number in front of it. Combine the x-coefficients and the constants and print the result as `Ax+B` or `Ax-B` (omit the constant if it is 0).',
    rules: { forbidCalls: ['Integer.parseInt', 'Integer.valueOf'] },
    restrictions: ['Do not use Integer.parseInt().'],
    samples: [{ input: '12x-5+3x+9-4x-7', output: '11x-3' }, { input: '2x+3-3', output: '2x' }],
    tests: ['5x', '1x-1x+4', '-3x-7+10x+10'],
    starter: LINE_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              String s = sc.nextLine();
              int xTotal = 0, constant = 0;
              int i = 0;
              while (i < s.length()) {
                  int sign = 1;
                  if (s.charAt(i) == '+') {
                      i++;
                  } else if (s.charAt(i) == '-') {
                      sign = -1;
                      i++;
                  }
                  int num = 0;
                  while (i < s.length() && s.charAt(i) >= '0' && s.charAt(i) <= '9') {
                      num = num * 10 + (s.charAt(i) - '0');
                      i++;
                  }
                  if (i < s.length() && s.charAt(i) == 'x') {
                      xTotal += sign * num;
                      i++;
                  } else {
                      constant += sign * num;
                  }
              }
              String out = xTotal + "x";
              if (constant > 0) {
                  out += "+" + constant;
              } else if (constant < 0) {
                  out += constant;
              }
              System.out.println(out);
          }
      }
    `,
    hints: ['Each term is: an optional sign, some digits, then optionally an x.', 'After reading the digits, peek at the next character: x means coefficient, anything else means constant.'],
    tags: ['String', 'manual parsing'],
  },
  {
    id: 'st-vowels', title: 'Count Vowels',
    topic: 'strings', kind: 'code', difficulty: 'Warm-up', marks: 4,
    statement: 'Read a line of text and print how many vowels (a, e, i, o, u — upper or lower case) it contains, as `Vowels: N`.',
    samples: [{ input: 'Hello World', output: 'Vowels: 3' }],
    tests: ['xyz', 'AEIOU aeiou', 'Programming in Java'],
    starter: LINE_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              String s = sc.nextLine().toLowerCase();
              int count = 0;
              for (int i = 0; i < s.length(); i++) {
                  char c = s.charAt(i);
                  if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u') {
                      count++;
                  }
              }
              System.out.println("Vowels: " + count);
          }
      }
    `,
    hints: ['Convert the whole line to lower case once, so you only need to test five characters.'],
    tags: ['String', 'charAt', 'counting'],
  },
  {
    id: 'st-palindrome', title: 'Palindrome String',
    topic: 'strings', kind: 'code', difficulty: 'Practice', marks: 5,
    statement: 'Read a word and print `Palindrome` if it reads the same forwards and backwards, **ignoring upper/lower case**, otherwise `Not Palindrome`.',
    samples: [{ input: 'Level', output: 'Palindrome' }, { input: 'Java', output: 'Not Palindrome' }],
    tests: ['a', 'Racecar', 'ab'],
    starter: LINE_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              String s = sc.nextLine().toLowerCase();
              boolean same = true;
              for (int i = 0; i < s.length() / 2; i++) {
                  if (s.charAt(i) != s.charAt(s.length() - 1 - i)) {
                      same = false;
                      break;
                  }
              }
              if (same) {
                  System.out.println("Palindrome");
              } else {
                  System.out.println("Not Palindrome");
              }
          }
      }
    `,
    hints: ['Compare index i with index length() − 1 − i, only up to the middle.'],
    tags: ['String', 'palindrome'],
  },
  {
    id: 'st-reverse-words', title: 'Reverse the Word Order',
    topic: 'strings', kind: 'code', difficulty: 'Practice', marks: 6,
    statement: 'Read a sentence whose words are separated by single spaces and print the words in reverse order.',
    samples: [{ input: 'I love Java', output: 'Java love I' }],
    tests: ['one', 'a b c d e'],
    starter: LINE_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              String s = sc.nextLine();
              String[] words = s.split(" ");
              String out = "";
              for (int i = words.length - 1; i >= 0; i--) {
                  out += words[i];
                  if (i > 0) {
                      out += " ";
                  }
              }
              System.out.println(out);
          }
      }
    `,
    hints: ['s.split(" ") gives an array of the words.', 'Walk that array from the last index down to 0.'],
    tags: ['String', 'split', 'array'],
  },
  {
    id: 'st-capitalize', title: 'Capitalise Every Word',
    topic: 'strings', kind: 'code', difficulty: 'Practice', marks: 6,
    statement: 'Read a line of lowercase words separated by single spaces. Print it with the first letter of every word in upper case.',
    samples: [{ input: 'hello world from java', output: 'Hello World From Java' }],
    tests: ['a', 'the quick brown fox'],
    starter: LINE_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              String s = sc.nextLine();
              String out = "";
              for (int i = 0; i < s.length(); i++) {
                  char c = s.charAt(i);
                  if (i == 0 || s.charAt(i - 1) == ' ') {
                      out += Character.toUpperCase(c);
                  } else {
                      out += c;
                  }
              }
              System.out.println(out);
          }
      }
    `,
    hints: ['A character starts a word if it is at index 0 or the character before it is a space.'],
    tags: ['String', 'Character'],
  },
  {
    id: 'st-char-frequency', title: 'Character Frequency Report',
    topic: 'strings', kind: 'code', difficulty: 'Exam', marks: 8,
    statement: 'Read a word and print each **distinct** character with how many times it appears, in the order of first appearance, one per line as `c: count`.',
    samples: [{ input: 'hello', output: 'h: 1\ne: 1\nl: 2\no: 1' }],
    tests: ['aaa', 'abcab', 'banana'],
    starter: LINE_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              String s = sc.nextLine();
              for (int i = 0; i < s.length(); i++) {
                  char c = s.charAt(i);
                  if (s.indexOf(c) == i) {
                      int count = 0;
                      for (int j = 0; j < s.length(); j++) {
                          if (s.charAt(j) == c) {
                              count++;
                          }
                      }
                      System.out.println(c + ": " + count);
                  }
              }
          }
      }
    `,
    hints: ['A character is seen for the first time exactly when s.indexOf(c) == i. Only report it then.'],
    tags: ['String', 'frequency', 'nested loop'],
  },
  {
    id: 'st-caesar', title: 'Caesar Cipher',
    topic: 'strings', kind: 'code', difficulty: 'Exam', marks: 8,
    statement: 'Read a line of text, then a shift k (0–25) on the next line. Shift every letter forward by k in the alphabet, wrapping from z to a, keeping upper/lower case. Other characters stay the same.',
    samples: [{ input: 'Hello, World!\n3', output: 'Khoor, Zruog!' }],
    tests: ['xyz XYZ\n3', 'abc\n0', 'Java 110\n25'],
    starter: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              String s = sc.nextLine();
              int k = sc.nextInt();
              // write your solution here

          }
      }
    `,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              String s = sc.nextLine();
              int k = sc.nextInt();
              String out = "";
              for (int i = 0; i < s.length(); i++) {
                  char c = s.charAt(i);
                  if (c >= 'a' && c <= 'z') {
                      out += (char) ('a' + (c - 'a' + k) % 26);
                  } else if (c >= 'A' && c <= 'Z') {
                      out += (char) ('A' + (c - 'A' + k) % 26);
                  } else {
                      out += c;
                  }
              }
              System.out.println(out);
          }
      }
    `,
    hints: ['c - \'a\' gives the letter\'s position 0–25. Add k, take % 26 to wrap, then add back to \'a\'.', 'The result of char arithmetic is an int — cast it back with (char) before appending.'],
    tags: ['String', 'char arithmetic', 'casting'],
  },
  {
    id: 'st-remove-duplicates', title: 'Remove Repeated Characters',
    topic: 'strings', kind: 'code', difficulty: 'Practice', marks: 6,
    statement: 'Read a word and print it with every repeated character removed, keeping only the **first** occurrence of each.',
    samples: [{ input: 'programming', output: 'progamin' }],
    tests: ['aaaa', 'abc', 'Mississippi'],
    starter: LINE_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              String s = sc.nextLine();
              String out = "";
              for (int i = 0; i < s.length(); i++) {
                  char c = s.charAt(i);
                  if (out.indexOf(c) == -1) {
                      out += c;
                  }
              }
              System.out.println(out);
          }
      }
    `,
    hints: ['Before appending a character, check whether the result already contains it: out.indexOf(c) == -1.'],
    tags: ['String', 'indexOf'],
  },
  {
    id: 'st-methods-trace', title: 'String Methods Tracing',
    topic: 'strings', kind: 'trace-output', difficulty: 'Exam', marks: 8,
    statement: 'Write the exact output. Index carefully — the first character is at index 0, and `substring(a, b)` stops **before** b.', strict: true,
    solution: java`
      public class Main {
          public static void main(String[] args) {
              String s = "Programming";
              System.out.println(s.length());
              System.out.println(s.charAt(3) + s.charAt(4));
              System.out.println("" + s.charAt(3) + s.charAt(4));
              System.out.println(s.substring(3, 7));
              System.out.println(s.indexOf('m') + " " + s.lastIndexOf('m'));
              System.out.println(s.toUpperCase().replace('M', 'N'));
              String t = s.substring(0, 3);
              t += "fessor";
              System.out.println(t + " " + t.length());
              System.out.println(s.compareTo("Program"));
              System.out.println("abc".compareTo("abd"));
              System.out.println(s.contains("gram") + " " + s.equals("programming"));
          }
      }
    `,
    hints: ['charAt returns a char. Two chars added with + are added as numbers (their character codes), not joined.', 'compareTo returns the difference of the first differing characters, or the difference in lengths if one is a prefix of the other.'],
    tags: ['output', 'String', 'char arithmetic', 'compareTo'],
  },
];

// ============================================================ ARRAYS
export const arrayProblems: Problem[] = [
  {
    id: 'ar-stats', title: 'Max, Min and Average',
    topic: 'arrays', kind: 'code', difficulty: 'Warm-up', marks: 5,
    statement: `${ARRAY_INPUT_NOTE} Print \`Max: X\`, \`Min: Y\` and \`Average: Z\` (two decimals).`,
    samples: [{ input: '5\n55 80 70 95 60', output: 'Max: 95\nMin: 55\nAverage: 72.00' }],
    tests: ['1\n-4', '4\n1 2 3 4', '3\n-1 -2 -3'],
    starter: ARRAY_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              int[] arr = new int[n];
              for (int i = 0; i < n; i++) {
                  arr[i] = sc.nextInt();
              }
              int max = arr[0], min = arr[0], sum = 0;
              for (int i = 0; i < arr.length; i++) {
                  if (arr[i] > max) max = arr[i];
                  if (arr[i] < min) min = arr[i];
                  sum += arr[i];
              }
              System.out.println("Max: " + max);
              System.out.println("Min: " + min);
              System.out.printf("Average: %.2f%n", (double) sum / arr.length);
          }
      }
    `,
    hints: ['Start max and min at arr[0], not 0 — the array might be all negative.', 'Cast the sum to double before dividing to keep the decimals.'],
    tags: ['array', 'traversal', 'min max'],
  },
  {
    id: 'ar-linear-search', title: 'Linear Search',
    topic: 'arrays', kind: 'code', difficulty: 'Practice', marks: 5,
    statement: `${ARRAY_INPUT_NOTE} Then read a target. Print \`Found at index i\` for its **first** occurrence, or \`Not found\`.`,
    samples: [{ input: '5\n4 8 15 16 23\n15', output: 'Found at index 2' }, { input: '3\n1 2 3\n7', output: 'Not found' }],
    tests: ['4\n9 9 9 9\n9', '1\n0\n0', '3\n5 6 7\n7'],
    starter: ARRAY_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              int[] arr = new int[n];
              for (int i = 0; i < n; i++) {
                  arr[i] = sc.nextInt();
              }
              int target = sc.nextInt();
              int index = -1;
              for (int i = 0; i < arr.length; i++) {
                  if (arr[i] == target) {
                      index = i;
                      break;
                  }
              }
              if (index == -1) {
                  System.out.println("Not found");
              } else {
                  System.out.println("Found at index " + index);
              }
          }
      }
    `,
    hints: ['Use -1 to mean "not found yet", and break as soon as you find the first match.'],
    tags: ['array', 'search'],
  },
  {
    id: 'ar-two-sum', title: 'Two Sum',
    topic: 'arrays', kind: 'code', difficulty: 'Exam', marks: 10,
    statement: `${ARRAY_INPUT_NOTE} Then read a target. Find the **first** pair (in normal nested-loop order, i < j) whose sum equals the target and print \`a and b\`. If no pair exists print \`Not Found\`.`,
    samples: [{ input: '5\n1 2 3 4 5\n8', output: '3 and 5' }],
    tests: ['4\n2 7 11 15\n9', '3\n1 1 1\n5', '4\n-3 4 3 90\n0'],
    starter: ARRAY_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              int[] arr = new int[n];
              for (int i = 0; i < n; i++) {
                  arr[i] = sc.nextInt();
              }
              int target = sc.nextInt();
              boolean found = false;
              for (int i = 0; i < arr.length && !found; i++) {
                  for (int j = i + 1; j < arr.length; j++) {
                      if (arr[i] + arr[j] == target) {
                          System.out.println(arr[i] + " and " + arr[j]);
                          found = true;
                          break;
                      }
                  }
              }
              if (!found) {
                  System.out.println("Not Found");
              }
          }
      }
    `,
    hints: ['Start j at i + 1 so each pair is checked once and an element is never paired with itself.', 'break only leaves the inner loop — use a flag to stop the outer loop too.'],
    tags: ['array', 'pairs', 'nested loop'],
  },
  {
    id: 'ar-closest-pair', title: 'Closest Pair to Target',
    topic: 'arrays', kind: 'code', difficulty: 'Exam', marks: 10,
    statement: `${ARRAY_INPUT_NOTE} (n ≥ 2) Then read a target. Find two different elements whose sum is **closest** to the target (smallest absolute difference). On a tie keep the first pair found in normal nested-loop order. Print \`a and b\`.`,
    samples: [{ input: '4\n1 4 8 10\n15', output: '4 and 10' }, { input: '4\n2 7 11 18\n15', output: '2 and 11' }],
    tests: ['2\n5 5\n0', '5\n-1 3 8 2 9\n7', '3\n10 20 30\n100'],
    starter: ARRAY_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              int[] arr = new int[n];
              for (int i = 0; i < n; i++) {
                  arr[i] = sc.nextInt();
              }
              int target = sc.nextInt();
              int bestI = 0, bestJ = 1;
              int bestDiff = Math.abs(arr[0] + arr[1] - target);
              for (int i = 0; i < arr.length; i++) {
                  for (int j = i + 1; j < arr.length; j++) {
                      int diff = Math.abs(arr[i] + arr[j] - target);
                      if (diff < bestDiff) {
                          bestDiff = diff;
                          bestI = i;
                          bestJ = j;
                      }
                  }
              }
              System.out.println(arr[bestI] + " and " + arr[bestJ]);
          }
      }
    `,
    hints: ['Track the best pair\'s indexes and its difference while scanning all pairs.', 'Use < (not <=) so that a tie keeps the pair found first.'],
    tags: ['array', 'pairs', 'best candidate'],
  },
  {
    id: 'ar-second-largest', title: 'Second Largest Distinct Value',
    topic: 'arrays', kind: 'code', difficulty: 'Practice', marks: 6,
    statement: `${ARRAY_INPUT_NOTE} Print the second largest **distinct** value, or \`None\` if all elements are equal.`,
    samples: [{ input: '6\n4 9 2 9 7 1', output: '7' }, { input: '3\n5 5 5', output: 'None' }],
    tests: ['2\n1 2', '4\n-5 -1 -3 -1', '5\n10 9 8 7 6'],
    starter: ARRAY_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              int[] arr = new int[n];
              for (int i = 0; i < n; i++) {
                  arr[i] = sc.nextInt();
              }
              int max = arr[0];
              for (int i = 1; i < arr.length; i++) {
                  if (arr[i] > max) max = arr[i];
              }
              boolean found = false;
              int second = 0;
              for (int i = 0; i < arr.length; i++) {
                  if (arr[i] < max && (!found || arr[i] > second)) {
                      second = arr[i];
                      found = true;
                  }
              }
              if (found) {
                  System.out.println(second);
              } else {
                  System.out.println("None");
              }
          }
      }
    `,
    hints: ['Two passes are simplest: first find the maximum, then the largest value strictly smaller than it.'],
    tags: ['array', 'max'],
  },
  {
    id: 'ar-occurrences', title: 'Occurrences of Each Element',
    topic: 'arrays', kind: 'code', difficulty: 'Practice', marks: 6,
    statement: `${ARRAY_INPUT_NOTE} Print each distinct value with its number of occurrences, in the order the values first appear, as \`value: count\`.`,
    samples: [{ input: '6\n4 5 4 2 5 4', output: '4: 3\n5: 2\n2: 1' }],
    tests: ['1\n0', '4\n1 2 3 4', '5\n-1 -1 -1 -1 -1'],
    starter: ARRAY_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              int[] arr = new int[n];
              for (int i = 0; i < n; i++) {
                  arr[i] = sc.nextInt();
              }
              for (int i = 0; i < arr.length; i++) {
                  boolean seenBefore = false;
                  for (int j = 0; j < i; j++) {
                      if (arr[j] == arr[i]) {
                          seenBefore = true;
                          break;
                      }
                  }
                  if (!seenBefore) {
                      int count = 0;
                      for (int j = 0; j < arr.length; j++) {
                          if (arr[j] == arr[i]) count++;
                      }
                      System.out.println(arr[i] + ": " + count);
                  }
              }
          }
      }
    `,
    hints: ['Only report a value the first time you meet it: check the elements BEFORE index i.'],
    tags: ['array', 'frequency', 'nested loop'],
  },
  {
    id: 'ar-longest-run', title: 'Longest Increasing Run',
    topic: 'arrays', kind: 'code', difficulty: 'Exam', marks: 10,
    statement: `${ARRAY_INPUT_NOTE} Find the longest run of consecutive elements where every next value is **strictly greater**. Print its starting index and length as \`Start: s, Length: L\`. On a tie keep the earliest run.`,
    samples: [{ input: '8\n4 5 7 2 3 4 6 1', output: 'Start: 3, Length: 4' }],
    tests: ['1\n9', '5\n5 4 3 2 1', '6\n1 2 3 1 2 3'],
    starter: ARRAY_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              int[] arr = new int[n];
              for (int i = 0; i < n; i++) {
                  arr[i] = sc.nextInt();
              }
              int bestStart = 0, bestLen = 1;
              int start = 0, len = 1;
              for (int i = 1; i < arr.length; i++) {
                  if (arr[i] > arr[i - 1]) {
                      len++;
                  } else {
                      start = i;
                      len = 1;
                  }
                  if (len > bestLen) {
                      bestLen = len;
                      bestStart = start;
                  }
              }
              System.out.println("Start: " + bestStart + ", Length: " + bestLen);
          }
      }
    `,
    hints: ['Keep the current run (start, length) and the best run separately.', 'Extend the run when arr[i] > arr[i − 1]; otherwise a new run starts at i.'],
    tags: ['array', 'runs', 'best candidate'],
  },
  {
    id: 'ar-common', title: 'Common Elements of Two Arrays',
    topic: 'arrays', kind: 'code', difficulty: 'Practice', marks: 6,
    statement: 'Read the first array (n, then n values) and the second array (m, then m values). Print the values that appear in **both**, without repeats, in the order they appear in the first array, separated by spaces. Print `None` if there are none.',
    samples: [{ input: '5\n1 2 3 4 2\n4\n2 4 6 8', output: '2 4' }],
    tests: ['2\n1 2\n2\n3 4', '3\n5 5 5\n1\n5', '4\n9 8 7 6\n4\n6 7 8 9'],
    starter: ARRAY_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              int[] a = new int[n];
              for (int i = 0; i < n; i++) a[i] = sc.nextInt();
              int m = sc.nextInt();
              int[] b = new int[m];
              for (int i = 0; i < m; i++) b[i] = sc.nextInt();

              String out = "";
              for (int i = 0; i < a.length; i++) {
                  boolean inB = false;
                  for (int j = 0; j < b.length; j++) {
                      if (b[j] == a[i]) inB = true;
                  }
                  boolean earlier = false;
                  for (int j = 0; j < i; j++) {
                      if (a[j] == a[i]) earlier = true;
                  }
                  if (inB && !earlier) {
                      if (!out.equals("")) out += " ";
                      out += a[i];
                  }
              }
              if (out.equals("")) {
                  System.out.println("None");
              } else {
                  System.out.println(out);
              }
          }
      }
    `,
    hints: ['For each value of the first array, check (1) is it in the second array, and (2) did it already appear earlier in the first array?'],
    tags: ['array', 'nested loop'],
  },
  {
    id: 'ar-matrix-sums', title: 'Row and Column Sums',
    topic: 'arrays', kind: 'code', difficulty: 'Exam', marks: 8,
    statement: 'Read R and C, then an R × C grid of integers row by row into a 2D array. Print the sum of each row as `Row i: s` (i from 0), then each column as `Col j: s`.',
    samples: [{ input: '2 3\n1 2 3\n4 5 6', output: 'Row 0: 6\nRow 1: 15\nCol 0: 5\nCol 1: 7\nCol 2: 9' }],
    tests: ['1 1\n7', '3 2\n1 1\n2 2\n3 3'],
    starter: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int r = sc.nextInt();
              int c = sc.nextInt();
              int[][] grid = new int[r][c];
              // read the grid and print the sums

          }
      }
    `,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int r = sc.nextInt();
              int c = sc.nextInt();
              int[][] grid = new int[r][c];
              for (int i = 0; i < r; i++) {
                  for (int j = 0; j < c; j++) {
                      grid[i][j] = sc.nextInt();
                  }
              }
              for (int i = 0; i < r; i++) {
                  int sum = 0;
                  for (int j = 0; j < c; j++) sum += grid[i][j];
                  System.out.println("Row " + i + ": " + sum);
              }
              for (int j = 0; j < c; j++) {
                  int sum = 0;
                  for (int i = 0; i < r; i++) sum += grid[i][j];
                  System.out.println("Col " + j + ": " + sum);
              }
          }
      }
    `,
    hints: ['grid[i][j] is row i, column j. For column sums, the OUTER loop goes over columns.'],
    tags: ['2D array', 'nested loop'],
  },
  {
    id: 'ar-reference-trace', title: 'Array References Tracing',
    topic: 'arrays', kind: 'trace-output', difficulty: 'Exam', marks: 8,
    statement: 'Write the exact output. An array variable holds a **reference**: two variables can point at the same array object.', strict: true,
    solution: java`
      public class Main {
          public static void main(String[] args) {
              int[] a = {2, 4, 6};
              int[] b = a;
              int[] c = new int[3];
              for (int i = 0; i < a.length; i++) {
                  c[i] = a[i];
              }
              b[1] = 40;
              c[2] = 60;
              System.out.println(a[1] + " " + a[2]);
              System.out.println(b[1] + " " + c[1]);
              a = new int[] {7, 8};
              System.out.println(a.length + " " + b.length);
              System.out.println(b[0] + b[1] + b[2]);
              System.out.println((a == b) + " " + (b[1] == 40));
          }
      }
    `,
    hints: ['b = a copies the reference, not the elements: a and b are the same array until a is re-pointed.', 'c got its own new array, so changing c never affects a or b.'],
    tags: ['output', 'array', 'references', 'aliasing'],
  },
];

// ============================================================ BUILDING NEW ARRAYS
function buildProblem(p: { id: string; title: string; statement: string; samples: { input: string; output: string }[]; tests: string[]; body: string; hints: string[]; difficulty?: Problem['difficulty']; tags: string[] }): Problem {
  return {
    id: p.id, title: p.title, topic: 'array-build', kind: 'code', difficulty: p.difficulty ?? 'Exam', marks: 10,
    statement: `${ARRAY_INPUT_NOTE} ${p.statement} ${BUILD_OUTPUT_NOTE}`,
    samples: p.samples, tests: p.tests, starter: ARRAY_STARTER, hints: p.hints, tags: ['array', 'new array', ...p.tags],
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              int[] arr = new int[n];
              for (int i = 0; i < n; i++) {
                  arr[i] = sc.nextInt();
              }
${p.body}
              if (out.length == 0) {
                  System.out.println("Empty");
              } else {
                  for (int i = 0; i < out.length; i++) {
                      System.out.print(out[i]);
                      if (i < out.length - 1) System.out.print(" ");
                  }
                  System.out.println();
              }
          }
      }
    `,
  };
}
const ind = (s: string) => s.split('\n').map(l => ' '.repeat(14) + l).join('\n');

export const arrayBuildProblems: Problem[] = [
  buildProblem({
    id: 'ab-move-zeroes', title: 'Move Zeroes to the End',
    statement: 'Create a new array with all non-zero values first (in their original order) followed by all the zeroes.',
    samples: [{ input: '5\n0 1 0 3 12', output: '1 3 12 0 0' }], tests: ['1\n0', '3\n1 2 3', '4\n0 0 0 5'],
    body: ind(`int[] out = new int[arr.length];
int k = 0;
for (int i = 0; i < arr.length; i++) {
    if (arr[i] != 0) {
        out[k] = arr[i];
        k++;
    }
}`),
    hints: ['A new int array is already full of zeroes. Copy only the non-zero values using a separate output index k.'],
    tags: ['output index'],
  }),
  buildProblem({
    id: 'ab-sign-partition', title: 'Stable Sign Partition',
    statement: 'Create a new array with the negative values first and then the zero/positive values. Keep the relative order inside both groups.',
    samples: [{ input: '6\n-2 5 -1 0 3 -4', output: '-2 -1 -4 5 0 3' }], tests: ['3\n1 2 3', '3\n-1 -2 -3', '5\n0 -1 0 -1 0'],
    body: ind(`int[] out = new int[arr.length];
int k = 0;
for (int i = 0; i < arr.length; i++) {
    if (arr[i] < 0) out[k++] = arr[i];
}
for (int i = 0; i < arr.length; i++) {
    if (arr[i] >= 0) out[k++] = arr[i];
}`),
    hints: ['Two passes over the input: the first copies the negatives, the second copies the rest. One shared output index keeps going.'],
    tags: ['partition', 'two passes'],
  }),
  buildProblem({
    id: 'ab-negatives-last', title: 'Move Negatives to the End',
    statement: 'Create a new array with all zero/positive values first and all negative values after them, preserving relative order inside both groups.',
    samples: [{ input: '6\n3 -1 0 -5 7 -2', output: '3 0 7 -1 -5 -2' }], tests: ['1\n-1', '4\n-4 3 -2 1'],
    body: ind(`int[] out = new int[arr.length];
int k = 0;
for (int i = 0; i < arr.length; i++) {
    if (arr[i] >= 0) out[k++] = arr[i];
}
for (int i = 0; i < arr.length; i++) {
    if (arr[i] < 0) out[k++] = arr[i];
}`),
    hints: ['Same two-pass idea as the sign partition, with the groups swapped.'],
    tags: ['partition', 'two passes'],
  }),
  buildProblem({
    id: 'ab-unique', title: 'Unique Array Builder',
    statement: 'Create a brand-new array (of exactly the right length) that contains only the **first occurrence** of each value, preserving order.',
    samples: [{ input: '5\n4 5 4 2 5', output: '4 5 2' }], tests: ['1\n9', '4\n1 1 1 1', '6\n3 1 3 2 1 3'],
    body: ind(`int[] temp = new int[arr.length];
int size = 0;
for (int i = 0; i < arr.length; i++) {
    boolean seen = false;
    for (int j = 0; j < size; j++) {
        if (temp[j] == arr[i]) {
            seen = true;
            break;
        }
    }
    if (!seen) {
        temp[size] = arr[i];
        size++;
    }
}
int[] out = new int[size];
for (int i = 0; i < size; i++) {
    out[i] = temp[i];
}`),
    hints: ['You do not know the final length in advance: fill a temporary array of the same length and count how many values you stored.', 'Then copy the first size values into a new array of exactly that size.'],
    tags: ['duplicates', 'temp array'],
  }),
  buildProblem({
    id: 'ab-single-occurrence', title: 'Single-Occurrence Array Builder',
    statement: 'Create a new array containing only the values that appear **exactly once** in the original, in their original order.',
    samples: [{ input: '7\n4 7 4 2 9 7 5', output: '2 9 5' }, { input: '4\n1 1 2 2', output: 'Empty' }], tests: ['1\n3', '5\n1 2 3 2 1'],
    body: ind(`int[] temp = new int[arr.length];
int size = 0;
for (int i = 0; i < arr.length; i++) {
    int count = 0;
    for (int j = 0; j < arr.length; j++) {
        if (arr[i] == arr[j]) count++;
    }
    if (count == 1) temp[size++] = arr[i];
}
int[] out = new int[size];
for (int i = 0; i < size; i++) {
    out[i] = temp[i];
}`),
    hints: ['COUNT first (inner loop over the whole array), then BUILD into a temporary array.', 'Copy into an exact-size array at the end.'],
    tags: ['frequency', 'temp array'],
  }),
  buildProblem({
    id: 'ab-even-index-first', title: 'Even-Index First',
    statement: 'Create a new array containing the values at **even indexes** first, followed by the values at odd indexes, preserving order inside both groups.',
    samples: [{ input: '6\n10 20 30 40 50 60', output: '10 30 50 20 40 60' }], tests: ['1\n5', '5\n1 2 3 4 5'],
    difficulty: 'Practice',
    body: ind(`int[] out = new int[arr.length];
int k = 0;
for (int i = 0; i < arr.length; i += 2) out[k++] = arr[i];
for (int i = 1; i < arr.length; i += 2) out[k++] = arr[i];`),
    hints: ['Two loops that step by 2: one starting at index 0, one at index 1.'],
    tags: ['index arithmetic'],
  }),
  buildProblem({
    id: 'ab-rotate-left', title: 'Rotate Left by k',
    statement: 'Then read k (k ≥ 0, possibly larger than n). Create a new array rotated **left** by k positions.',
    samples: [{ input: '5\n1 2 3 4 5\n2', output: '3 4 5 1 2' }, { input: '3\n1 2 3\n7', output: '2 3 1' }], tests: ['1\n9\n100', '4\n1 2 3 4\n0', '4\n1 2 3 4\n4'],
    body: ind(`int k = sc.nextInt();
k = k % arr.length;
int[] out = new int[arr.length];
for (int i = 0; i < arr.length; i++) {
    out[i] = arr[(i + k) % arr.length];
}`),
    hints: ['Rotating by the array length gives the same array, so k = k % n first.', 'Element i of the result comes from index (i + k) % n of the original.'],
    tags: ['rotation', 'modulus'],
  }),
  buildProblem({
    id: 'ab-reverse-new', title: 'Reverse into a New Array',
    statement: 'Create a new array with the elements in reverse order (do not change the original).',
    samples: [{ input: '4\n1 2 3 4', output: '4 3 2 1' }], tests: ['1\n7', '5\n5 4 3 2 1'],
    difficulty: 'Warm-up',
    body: ind(`int[] out = new int[arr.length];
for (int i = 0; i < arr.length; i++) {
    out[i] = arr[arr.length - 1 - i];
}`),
    hints: ['out[i] takes its value from the mirror position arr.length − 1 − i.'],
    tags: ['reverse'],
  }),
  buildProblem({
    id: 'ab-even-positive', title: 'Even Positive Filter',
    statement: 'Create a new array of exactly the right size containing only the values that are both **even** and **positive**, in their original order.',
    samples: [{ input: '7\n4 -2 7 10 0 3 8', output: '4 10 8' }], tests: ['3\n1 3 5', '4\n2 2 -2 -2'],
    difficulty: 'Practice',
    body: ind(`int count = 0;
for (int i = 0; i < arr.length; i++) {
    if (arr[i] > 0 && arr[i] % 2 == 0) count++;
}
int[] out = new int[count];
int k = 0;
for (int i = 0; i < arr.length; i++) {
    if (arr[i] > 0 && arr[i] % 2 == 0) out[k++] = arr[i];
}`),
    hints: ['Pass 1 counts how many values qualify; pass 2 fills an array of exactly that size.'],
    tags: ['filter', 'two passes'],
  }),
];

const MERGE: Problem = {
  id: 'ab-merge-alternate', title: 'Merge Two Arrays Alternately',
  topic: 'array-build', kind: 'code', difficulty: 'Exam', marks: 10,
  statement: 'Read two arrays (each as a length followed by its values). Build a new array taking one element from the first, then one from the second, alternately. When one array runs out, append the rest of the other. Print the result separated by spaces.',
  samples: [{ input: '3\n1 3 5\n5\n2 4 6 8 10', output: '1 2 3 4 5 6 8 10' }],
  tests: ['1\n7\n1\n8', '4\n1 1 1 1\n1\n0', '2\n5 6\n3\n7 8 9'],
  starter: ARRAY_STARTER,
  solution: java`
    import java.util.Scanner;

    public class Main {
        public static void main(String[] args) {
            Scanner sc = new Scanner(System.in);
            int n = sc.nextInt();
            int[] a = new int[n];
            for (int i = 0; i < n; i++) a[i] = sc.nextInt();
            int m = sc.nextInt();
            int[] b = new int[m];
            for (int i = 0; i < m; i++) b[i] = sc.nextInt();

            int[] out = new int[a.length + b.length];
            int i = 0, j = 0, k = 0;
            while (i < a.length || j < b.length) {
                if (i < a.length) out[k++] = a[i++];
                if (j < b.length) out[k++] = b[j++];
            }
            for (int x = 0; x < out.length; x++) {
                System.out.print(out[x]);
                if (x < out.length - 1) System.out.print(" ");
            }
            System.out.println();
        }
    }
  `,
  hints: ['Three indexes: i in the first array, j in the second, k in the output.', 'Loop while EITHER array still has elements, and take from each one only if it has some left.'],
  tags: ['array', 'new array', 'merge'],
};
arrayBuildProblems.push(MERGE);

// ============================================================ SORTING
export const sortingProblems: Problem[] = [
  {
    id: 'so-selection', title: 'Selection Sort',
    topic: 'sorting', kind: 'code', difficulty: 'Exam', marks: 10,
    statement: `${ARRAY_INPUT_NOTE} Sort the array in **increasing** order using selection sort (repeatedly find the smallest remaining value and swap it into place) and print it separated by spaces.`,
    restrictions: ['Do not use Arrays.sort().'],
    rules: { forbidCalls: ['Arrays.sort'] },
    samples: [{ input: '5\n7 3 5 1 9', output: '1 3 5 7 9' }],
    tests: ['1\n4', '4\n4 3 2 1', '6\n2 -1 2 -1 0 0'],
    starter: ARRAY_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              int[] arr = new int[n];
              for (int i = 0; i < n; i++) {
                  arr[i] = sc.nextInt();
              }
              for (int i = 0; i < arr.length - 1; i++) {
                  int min = i;
                  for (int j = i + 1; j < arr.length; j++) {
                      if (arr[j] < arr[min]) {
                          min = j;
                      }
                  }
                  int temp = arr[i];
                  arr[i] = arr[min];
                  arr[min] = temp;
              }
              for (int i = 0; i < arr.length; i++) {
                  System.out.print(arr[i]);
                  if (i < arr.length - 1) System.out.print(" ");
              }
              System.out.println();
          }
      }
    `,
    hints: ['For each position i, find the INDEX of the smallest value in arr[i..end].', 'Swap with a temporary variable — assigning a[i] = a[min] first would destroy the old a[i].'],
    tags: ['sorting', 'selection sort', 'swap'],
  },
  {
    id: 'so-bubble-swaps', title: 'Bubble Sort Swap Count',
    topic: 'sorting', kind: 'code', difficulty: 'Exam', marks: 10,
    statement: `${ARRAY_INPUT_NOTE} Sort the array in increasing order with bubble sort (repeatedly compare neighbours and swap them if they are out of order). Print the sorted array separated by spaces, then \`Swaps: S\` — the total number of swaps performed.`,
    rules: { forbidCalls: ['Arrays.sort'] },
    restrictions: ['Do not use Arrays.sort().'],
    samples: [{ input: '4\n4 1 3 2', output: '1 2 3 4\nSwaps: 4' }],
    tests: ['1\n1', '5\n1 2 3 4 5', '5\n5 4 3 2 1'],
    starter: ARRAY_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              int[] arr = new int[n];
              for (int i = 0; i < n; i++) {
                  arr[i] = sc.nextInt();
              }
              int swaps = 0;
              for (int i = 0; i < arr.length - 1; i++) {
                  for (int j = 0; j < arr.length - 1 - i; j++) {
                      if (arr[j] > arr[j + 1]) {
                          int temp = arr[j];
                          arr[j] = arr[j + 1];
                          arr[j + 1] = temp;
                          swaps++;
                      }
                  }
              }
              for (int i = 0; i < arr.length; i++) {
                  System.out.print(arr[i]);
                  if (i < arr.length - 1) System.out.print(" ");
              }
              System.out.println();
              System.out.println("Swaps: " + swaps);
          }
      }
    `,
    hints: ['Inner loop compares arr[j] with arr[j + 1]; its upper bound shrinks by one each pass because the largest value has already bubbled to the end.'],
    tags: ['sorting', 'bubble sort', 'swap'],
  },
  {
    id: 'so-rank-students', title: 'Rank Students by Marks',
    topic: 'sorting', kind: 'code', difficulty: 'Challenge', marks: 10,
    statement: 'Read n, then n lines each containing a name (one word) and a mark. Sort the students by mark in **decreasing** order (keep the original order for equal marks — use a stable sort such as bubble sort). Print `name: mark` lines.',
    rules: { forbidCalls: ['Arrays.sort'] },
    samples: [{ input: '4\nAyan 70\nNisa 85\nRafi 78\nToma 90', output: 'Toma: 90\nNisa: 85\nRafi: 78\nAyan: 70' }],
    tests: ['1\nSolo 50', '3\nA 5\nB 5\nC 6'],
    starter: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              String[] names = new String[n];
              int[] marks = new int[n];
              for (int i = 0; i < n; i++) {
                  names[i] = sc.next();
                  marks[i] = sc.nextInt();
              }
              // sort both arrays together and print

          }
      }
    `,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              String[] names = new String[n];
              int[] marks = new int[n];
              for (int i = 0; i < n; i++) {
                  names[i] = sc.next();
                  marks[i] = sc.nextInt();
              }
              for (int i = 0; i < n - 1; i++) {
                  for (int j = 0; j < n - 1 - i; j++) {
                      if (marks[j] < marks[j + 1]) {
                          int t = marks[j];
                          marks[j] = marks[j + 1];
                          marks[j + 1] = t;
                          String s = names[j];
                          names[j] = names[j + 1];
                          names[j + 1] = s;
                      }
                  }
              }
              for (int i = 0; i < n; i++) {
                  System.out.println(names[i] + ": " + marks[i]);
              }
          }
      }
    `,
    hints: ['These are parallel arrays: whenever you swap two marks, swap the matching names too.', 'Use < for decreasing order, and only swap when strictly out of order so equal marks keep their order.'],
    tags: ['sorting', 'parallel arrays', 'String array'],
  },
  {
    id: 'so-selection-trace', title: 'Selection Sort Pass-by-Pass',
    topic: 'sorting', kind: 'trace-output', difficulty: 'Exam', marks: 8,
    statement: 'The program prints the array after every pass of selection sort. Write the exact output.', strict: true,
    solution: java`
      import java.util.Arrays;

      public class Main {
          public static void main(String[] args) {
              int[] a = {29, 10, 14, 37, 13};
              for (int i = 0; i < a.length - 1; i++) {
                  int min = i;
                  for (int j = i + 1; j < a.length; j++) {
                      if (a[j] < a[min]) min = j;
                  }
                  int t = a[i];
                  a[i] = a[min];
                  a[min] = t;
                  System.out.println("Pass " + (i + 1) + ": " + Arrays.toString(a));
              }
          }
      }
    `,
    hints: ['Each pass puts exactly one value in its final place: pass 1 moves the minimum to index 0.', 'A pass whose minimum is already in place swaps an element with itself — the array does not change.'],
    tags: ['output', 'sorting', 'selection sort'],
  },
];

// ============================================================ METHODS
export const methodProblems: Problem[] = [
  {
    id: 'me-marks-analyzer', title: 'Method-Based Marks Analyzer',
    topic: 'methods', kind: 'code', difficulty: 'Exam', marks: 10,
    statement: `${ARRAY_INPUT_NOTE} Write and use three methods: \`getAverage(int[] a)\` returning a double, \`getHighest(int[] a)\` returning an int, and \`countAboveAverage(int[] a)\` returning an int. Print \`Avg=X, Highest=Y, Above Avg=Z\` using the returned values.`,
    rules: { requireMethods: ['getAverage', 'getHighest', 'countAboveAverage'] },
    samples: [{ input: '4\n70 85 90 80', output: 'Avg=81.25, Highest=90, Above Avg=2' }, { input: '5\n55 80 70 95 60', output: 'Avg=72.0, Highest=95, Above Avg=2' }],
    tests: ['1\n50', '3\n60 60 60'],
    starter: java`
      import java.util.Scanner;

      public class Main {
          static double getAverage(int[] a) {
              // TODO
              return 0;
          }

          static int getHighest(int[] a) {
              // TODO
              return 0;
          }

          static int countAboveAverage(int[] a) {
              // TODO
              return 0;
          }

          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              int[] marks = new int[n];
              for (int i = 0; i < n; i++) {
                  marks[i] = sc.nextInt();
              }
              System.out.println("Avg=" + getAverage(marks) + ", Highest=" + getHighest(marks) + ", Above Avg=" + countAboveAverage(marks));
          }
      }
    `,
    solution: java`
      import java.util.Scanner;

      public class Main {
          static double getAverage(int[] a) {
              int sum = 0;
              for (int i = 0; i < a.length; i++) {
                  sum += a[i];
              }
              return (double) sum / a.length;
          }

          static int getHighest(int[] a) {
              int max = a[0];
              for (int i = 1; i < a.length; i++) {
                  if (a[i] > max) max = a[i];
              }
              return max;
          }

          static int countAboveAverage(int[] a) {
              double avg = getAverage(a);
              int count = 0;
              for (int i = 0; i < a.length; i++) {
                  if (a[i] > avg) count++;
              }
              return count;
          }

          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              int[] marks = new int[n];
              for (int i = 0; i < n; i++) {
                  marks[i] = sc.nextInt();
              }
              System.out.println("Avg=" + getAverage(marks) + ", Highest=" + getHighest(marks) + ", Above Avg=" + countAboveAverage(marks));
          }
      }
    `,
    hints: ['Each method does one job and RETURNS its answer — it does not print.', 'countAboveAverage can call getAverage instead of repeating the sum loop.', 'Cast before dividing: (double) sum / a.length.'],
    tags: ['methods', 'return values', 'array parameter'],
  },
  {
    id: 'me-rotate-right', title: 'Rotate Right Using a Method',
    topic: 'methods', kind: 'code', difficulty: 'Exam', marks: 10,
    statement: `${ARRAY_INPUT_NOTE} Then read k. Write a method \`rotateRight(int[] arr, int k)\` that **returns a new array** rotated k positions to the right. It must work even when k is larger than the array length. Print the returned array separated by spaces.`,
    rules: { requireMethods: ['rotateRight'] },
    samples: [{ input: '5\n1 2 3 4 5\n2', output: '4 5 1 2 3' }, { input: '3\n7 8 9\n5', output: '8 9 7' }],
    tests: ['1\n4\n9', '4\n1 2 3 4\n0'],
    starter: java`
      import java.util.Scanner;

      public class Main {
          static int[] rotateRight(int[] arr, int k) {
              // TODO: return a NEW rotated array
              return arr;
          }

          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              int[] arr = new int[n];
              for (int i = 0; i < n; i++) {
                  arr[i] = sc.nextInt();
              }
              int k = sc.nextInt();
              int[] result = rotateRight(arr, k);
              for (int i = 0; i < result.length; i++) {
                  System.out.print(result[i]);
                  if (i < result.length - 1) System.out.print(" ");
              }
              System.out.println();
          }
      }
    `,
    solution: java`
      import java.util.Scanner;

      public class Main {
          static int[] rotateRight(int[] arr, int k) {
              int n = arr.length;
              k = k % n;
              int[] out = new int[n];
              for (int i = 0; i < n; i++) {
                  out[(i + k) % n] = arr[i];
              }
              return out;
          }

          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              int[] arr = new int[n];
              for (int i = 0; i < n; i++) {
                  arr[i] = sc.nextInt();
              }
              int k = sc.nextInt();
              int[] result = rotateRight(arr, k);
              for (int i = 0; i < result.length; i++) {
                  System.out.print(result[i]);
                  if (i < result.length - 1) System.out.print(" ");
              }
              System.out.println();
          }
      }
    `,
    hints: ['Rotating right by k moves the element at index i to index (i + k) % n.', 'Reduce k with k % n first.'],
    tags: ['methods', 'array return', 'rotation'],
  },
  {
    id: 'me-closest-student', title: 'Closest-Mark Student',
    topic: 'methods', kind: 'code', difficulty: 'Challenge', marks: 10,
    statement: `The names are {Ayan, Nisa, Rafi, Toma} and the marks {70, 85, 78, 90} (parallel arrays, already in the starter). Read a student name. If it is not in the list print \`Invalid Input\`. Otherwise find **another** student whose mark has the smallest absolute difference (first one on a tie) and print \`<name>, Difference=<d>\`. Use at least two methods: \`findStudent(String[] names, String target)\` returning the index or −1, and \`closestStudent(int[] marks, int idx)\` returning the index of the closest other student.`,
    rules: { requireMethods: ['findStudent', 'closestStudent'] },
    samples: [{ input: 'Rafi', output: 'Nisa, Difference=7' }, { input: 'Zara', output: 'Invalid Input' }],
    tests: ['Ayan', 'Toma', 'Nisa', 'rafi'],
    starter: java`
      import java.util.Scanner;

      public class Main {
          // write findStudent and closestStudent here

          public static void main(String[] args) {
              String[] names = {"Ayan", "Nisa", "Rafi", "Toma"};
              int[] marks = {70, 85, 78, 90};
              Scanner sc = new Scanner(System.in);
              String target = sc.next();
              // use your methods here

          }
      }
    `,
    solution: java`
      import java.util.Scanner;

      public class Main {
          static int findStudent(String[] names, String target) {
              for (int i = 0; i < names.length; i++) {
                  if (names[i].equals(target)) {
                      return i;
                  }
              }
              return -1;
          }

          static int closestStudent(int[] marks, int idx) {
              int best = -1, bestDiff = 0;
              for (int i = 0; i < marks.length; i++) {
                  if (i == idx) continue;
                  int diff = Math.abs(marks[i] - marks[idx]);
                  if (best == -1 || diff < bestDiff) {
                      bestDiff = diff;
                      best = i;
                  }
              }
              return best;
          }

          public static void main(String[] args) {
              String[] names = {"Ayan", "Nisa", "Rafi", "Toma"};
              int[] marks = {70, 85, 78, 90};
              Scanner sc = new Scanner(System.in);
              String target = sc.next();
              int idx = findStudent(names, target);
              if (idx == -1) {
                  System.out.println("Invalid Input");
              } else {
                  int c = closestStudent(marks, idx);
                  System.out.println(names[c] + ", Difference=" + Math.abs(marks[c] - marks[idx]));
              }
          }
      }
    `,
    hints: ['Compare Strings with equals, never ==.', 'Skip the student themself with if (i == idx) continue;', 'Name matching is case-sensitive: "rafi" is not in the list.'],
    tags: ['methods', 'String array', 'parallel arrays', 'best candidate'],
  },
  {
    id: 'me-count-primes', title: 'isPrime Method',
    topic: 'methods', kind: 'code', difficulty: 'Practice', marks: 8,
    statement: 'Write a method `isPrime(int n)` that returns a boolean. Read N, then N integers, and print the primes among them separated by spaces, then `Count: C` on the next line. If there are no primes, print an empty first line.',
    rules: { requireMethods: ['isPrime'] },
    samples: [{ input: '6\n2 4 7 9 11 1', output: '2 7 11\nCount: 3' }],
    tests: ['1\n1', '5\n13 17 19 23 29', '3\n0 -7 49'],
    starter: java`
      import java.util.Scanner;

      public class Main {
          static boolean isPrime(int n) {
              // TODO
              return false;
          }

          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              // read N numbers and use isPrime

          }
      }
    `,
    solution: java`
      import java.util.Scanner;

      public class Main {
          static boolean isPrime(int n) {
              if (n < 2) return false;
              for (int i = 2; i * i <= n; i++) {
                  if (n % i == 0) return false;
              }
              return true;
          }

          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              int count = 0;
              String line = "";
              for (int i = 0; i < n; i++) {
                  int x = sc.nextInt();
                  if (isPrime(x)) {
                      if (count > 0) line += " ";
                      line += x;
                      count++;
                  }
              }
              System.out.println(line);
              System.out.println("Count: " + count);
          }
      }
    `,
    hints: ['A method can return as soon as it knows the answer: return false on the first divisor.'],
    tags: ['methods', 'boolean return', 'prime'],
  },
  {
    id: 'me-pass-by-value', title: 'Parameters and Return Values Tracing',
    topic: 'methods', kind: 'trace-output', difficulty: 'Exam', marks: 8,
    statement: 'Write the exact output. Primitive parameters receive a **copy** of the value; array parameters receive a copy of the **reference**.', strict: true,
    solution: java`
      public class Main {
          static int change(int x, int[] arr) {
              x = x * 2;
              arr[0] = arr[0] + x;
              arr = new int[] {100, 200};
              arr[1] = 999;
              return x + arr[0];
          }

          static void show(int a, int b) {
              System.out.println(a + " " + b);
              a = b;
          }

          public static void main(String[] args) {
              int x = 5;
              int[] data = {1, 2};
              int r = change(x, data);
              System.out.println(x + " " + r);
              System.out.println(data[0] + " " + data[1]);
              show(x, data[0]);
              show(data[1], r);
              System.out.println(x);
          }
      }
    `,
    hints: ['Inside change, x is a separate copy: doubling it never touches main\'s x.', 'arr[0] = ... changes main\'s array; after arr = new int[]{...} the method works on a different array.'],
    tags: ['output', 'methods', 'pass by value', 'references'],
  },
];

// ============================================================ RECURSION
const REC_HINTS = [
  'Go DOWN first: keep calling until the base case — nothing after the recursive call has run yet.',
  'Then come back UP: each call resumes on the line after its recursive call, in reverse order, and prints/returns there.',
  'Write a small table: call, parameter values, value returned from below, what it prints, what it returns.',
];

export const recursionProblems: Problem[] = [
  {
    id: 'rc-mock1', title: 'Mock Final 1 — Recursion Tracing',
    topic: 'recursion', kind: 'trace-output', difficulty: 'Exam', marks: 10,
    statement: 'Trace the program and write the exact output in order.', strict: true,
    samples: [{ input: '', output: '-5\n3\n-5\n12' }],
    solution: java`
      public class Main {
          public static void main(String[] args) {
              int[] a = {7, 12, 4, 9};
              System.out.println(trace(a, 0));
          }

          static int trace(int[] a, int i) {
              if (i == a.length - 1) return a[i];
              int x = trace(a, i + 1);
              System.out.println(a[i] - x);
              if (a[i] > x) return a[i];
              else return x;
          }
      }
    `,
    hints: REC_HINTS, tags: ['recursion tracing', 'array'],
  },
  {
    id: 'rc-mock2', title: 'Mock Final 2 — Recursion Tracing',
    topic: 'recursion', kind: 'trace-output', difficulty: 'Exam', marks: 10,
    statement: 'Trace the program and write the exact output in order.', strict: true,
    samples: [{ input: '', output: '25\n18\n12\n5' }],
    solution: java`
      public class Main {
          public static void main(String[] args) {
              int[] a = {18, 7, 11, 5};
              System.out.println(calc(a, a.length - 1));
          }

          static int calc(int[] a, int i) {
              if (i == 0) return a[0];
              int x = calc(a, i - 1);
              System.out.println(x + a[i]);
              if (a[i] < x) return a[i];
              else return x;
          }
      }
    `,
    hints: REC_HINTS, tags: ['recursion tracing', 'array'],
  },
  {
    id: 'rc-mock3', title: 'Mock Final 3 — Recursion Tracing',
    topic: 'recursion', kind: 'trace-output', difficulty: 'Exam', marks: 10,
    statement: 'Trace the program and write the exact output in order.', strict: true,
    samples: [{ input: '', output: '2\n6\n11\n7\n6' }],
    solution: java`
      public class Main {
          public static void main(String[] args) {
              int[] a = {3, 8, 5, 2};
              System.out.println(count(a, 0));
          }

          static int count(int[] a, int i) {
              if (i == a.length) return 0;
              int x = count(a, i + 1);
              System.out.println(a[i] + x);
              if (a[i] % 2 == 0) return x + 1;
              else return x + 2;
          }
      }
    `,
    hints: REC_HINTS, tags: ['recursion tracing', 'array'],
  },
  {
    id: 'rc-before-after', title: 'Printing Before and After the Call',
    topic: 'recursion', kind: 'trace-output', difficulty: 'Practice', marks: 6,
    statement: 'Write the exact output. There is a print **before** and a print **after** the recursive call.', strict: true,
    solution: java`
      public class Main {
          static void show(int n) {
              if (n == 0) {
                  System.out.println("base");
                  return;
              }
              System.out.println("down " + n);
              show(n - 1);
              System.out.println("up " + n);
          }

          public static void main(String[] args) {
              show(3);
          }
      }
    `,
    hints: ['Prints before the call appear while the stack grows (3, 2, 1); prints after it appear while it unwinds (1, 2, 3).'],
    tags: ['recursion tracing', 'call stack'],
  },
  {
    id: 'rc-mystery', title: 'Mystery Recursion with Two Calls',
    topic: 'recursion', kind: 'trace-output', difficulty: 'Challenge', marks: 10,
    statement: 'Write the exact output. Each call may make **two** recursive calls — trace the left one completely before the right one starts.', strict: true,
    solution: java`
      public class Main {
          static int f(int n) {
              if (n <= 1) {
                  System.out.print(n + " ");
                  return n;
              }
              int a = f(n - 1);
              int b = f(n - 2);
              System.out.print("[" + n + "] ");
              return a + b;
          }

          public static void main(String[] args) {
              int r = f(4);
              System.out.println();
              System.out.println(r);
          }
      }
    `,
    hints: ['Draw the call tree: f(4) calls f(3) then f(2); f(3) calls f(2) then f(1), and so on.', 'A node prints "[n]" only after BOTH of its children have finished.'],
    tags: ['recursion tracing', 'call tree'],
  },
  {
    id: 'rc-string-trace', title: 'Recursion on a String',
    topic: 'recursion', kind: 'trace-output', difficulty: 'Exam', marks: 8,
    statement: 'Write the exact output.', strict: true,
    solution: java`
      public class Main {
          static String build(String s, int i) {
              if (i == s.length()) return "";
              String rest = build(s, i + 1);
              System.out.println(i + ": " + rest);
              if (s.charAt(i) == 'a') return rest + "A";
              return s.charAt(i) + rest;
          }

          public static void main(String[] args) {
              System.out.println(build("java", 0));
          }
      }
    `,
    hints: ['The deepest call (i == 4) returns "" first; then i = 3, 2, 1, 0 each print and return, in that order.'],
    tags: ['recursion tracing', 'String'],
  },
  {
    id: 'rc-digit-sum', title: 'Recursive Digit Sum',
    topic: 'recursion', kind: 'code', difficulty: 'Practice', marks: 6,
    statement: 'Write a **recursive** method `digitSum(int n)` that returns the sum of the digits of a non-negative integer, without any loop. The starter reads n and prints the result.',
    rules: { recursive: 'digitSum' },
    samples: [{ input: '3407', output: '14' }],
    tests: ['0', '9', '99999', '1000000'],
    starter: java`
      import java.util.Scanner;

      public class Main {
          static int digitSum(int n) {
              // TODO: recursive, no loops
              return 0;
          }

          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              System.out.println(digitSum(n));
          }
      }
    `,
    solution: java`
      import java.util.Scanner;

      public class Main {
          static int digitSum(int n) {
              if (n == 0) return 0;
              return n % 10 + digitSum(n / 10);
          }

          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              System.out.println(digitSum(n));
          }
      }
    `,
    hints: ['Base case: a number with no digits left (n == 0) has digit sum 0.', 'Recursive case: the last digit plus the digit sum of the rest: n % 10 + digitSum(n / 10).'],
    tags: ['recursion', 'digits'],
  },
  {
    id: 'rc-power', title: 'Recursive Power',
    topic: 'recursion', kind: 'code', difficulty: 'Practice', marks: 6,
    statement: 'Write a **recursive** method `power(int base, int exp)` returning base^exp as a long, for exp ≥ 0, without loops or Math.pow.',
    rules: { recursive: 'power', forbidCalls: ['Math.pow'] },
    samples: [{ input: '2 10', output: '1024' }, { input: '5 0', output: '1' }],
    tests: ['3 4', '-2 3', '10 12'],
    starter: java`
      import java.util.Scanner;

      public class Main {
          static long power(int base, int exp) {
              // TODO: recursive, no loops
              return 0;
          }

          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int base = sc.nextInt();
              int exp = sc.nextInt();
              System.out.println(power(base, exp));
          }
      }
    `,
    solution: java`
      import java.util.Scanner;

      public class Main {
          static long power(int base, int exp) {
              if (exp == 0) return 1;
              return base * power(base, exp - 1);
          }

          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int base = sc.nextInt();
              int exp = sc.nextInt();
              System.out.println(power(base, exp));
          }
      }
    `,
    hints: ['Base case: anything to the power 0 is 1.', 'base^exp = base × base^(exp − 1).'],
    tags: ['recursion', 'math'],
  },
  {
    id: 'rc-array-min', title: 'Recursive Array Minimum',
    topic: 'recursion', kind: 'code', difficulty: 'Exam', marks: 8,
    statement: `${ARRAY_INPUT_NOTE} Write a **recursive** method \`findMin(int[] a, int i)\` that returns the smallest value among \`a[i]\` to the end of the array, without loops. main calls \`findMin(arr, 0)\`.`,
    rules: { recursive: 'findMin' },
    samples: [{ input: '5\n7 3 9 1 4', output: '1' }],
    tests: ['1\n-5', '4\n2 2 2 2', '6\n9 8 7 6 5 4'],
    starter: java`
      import java.util.Scanner;

      public class Main {
          static int findMin(int[] a, int i) {
              // TODO: recursive, no loops
              return 0;
          }

          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              int[] arr = new int[n];
              for (int i = 0; i < n; i++) {
                  arr[i] = sc.nextInt();
              }
              System.out.println(findMin(arr, 0));
          }
      }
    `,
    solution: java`
      import java.util.Scanner;

      public class Main {
          static int findMin(int[] a, int i) {
              if (i == a.length - 1) return a[i];
              int restMin = findMin(a, i + 1);
              if (a[i] < restMin) return a[i];
              return restMin;
          }

          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              int[] arr = new int[n];
              for (int i = 0; i < n; i++) {
                  arr[i] = sc.nextInt();
              }
              System.out.println(findMin(arr, 0));
          }
      }
    `,
    hints: ['Base case: at the last index the minimum of one element is that element.', 'Otherwise compare a[i] with the minimum of the rest (the recursive call).'],
    tags: ['recursion', 'array'],
  },
  {
    id: 'rc-fib-sum', title: 'Sum of the First n Fibonacci Numbers',
    topic: 'recursion', kind: 'code', difficulty: 'Exam', marks: 8,
    statement: 'Write a **recursive** method `fib(int n)` returning the n-th Fibonacci number (fib(0) = 0, fib(1) = 1). Then a second recursive method `fibSum(int n)` returning fib(0) + fib(1) + ... + fib(n − 1). Read n (1 ≤ n ≤ 20) and print `fibSum(n)`.',
    rules: { recursive: 'fibSum' },
    samples: [{ input: '6', output: '12', note: '0 + 1 + 1 + 2 + 3 + 5' }],
    tests: ['1', '2', '20'],
    starter: java`
      import java.util.Scanner;

      public class Main {
          // write fib and fibSum here

          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              System.out.println(fibSum(n));
          }

          static int fibSum(int n) {
              return 0;
          }
      }
    `,
    solution: java`
      import java.util.Scanner;

      public class Main {
          static int fib(int n) {
              if (n <= 1) return n;
              return fib(n - 1) + fib(n - 2);
          }

          static int fibSum(int n) {
              if (n == 0) return 0;
              return fib(n - 1) + fibSum(n - 1);
          }

          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              System.out.println(fibSum(n));
          }
      }
    `,
    hints: ['fibSum(n) = fib(n − 1) + fibSum(n − 1), and fibSum(0) = 0.'],
    tags: ['recursion', 'fibonacci'],
  },
];
