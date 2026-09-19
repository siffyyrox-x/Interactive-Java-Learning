import { java, SCANNER_STARTER, type Problem } from '../model';

// ============================================================ DECISION MAKING
export const conditionProblems: Problem[] = [
  {
    id: 'cd-eid-shopping', title: 'Eid Shopping Budget',
    topic: 'conditions', kind: 'code', difficulty: 'Exam', marks: 10,
    statement: `Karim's salary is **x** taka and he received a bonus of **75%** of his salary. He splits the total: **45%** for his wife, **45%** for his son, and **10%** saved (savings must never be touched).
- His wife wants a laptop costing **90,000**. His son wants a PS5 costing **70,000** plus an extra controller costing **7,000**.
- Print the four amounts with two decimals, then one line for the wife and one line for the son.
- If a budget is enough, print \`Shopping Done for Wife!\` (or \`Son!\`). If it is not enough but the other person's **leftover** covers the gap, print \`Shopping Done for Wife with remaining money from Son's budget!\` (or the Son version). Otherwise print \`Cannot do shopping for Wife even with remaining money from Son's budget!\` (or the Son version).`,
    samples: [
      { input: '110000', output: "Amount with Bonus: 192500.00\nWife Budget: 86625.00\nSon Budget: 86625.00\nSavings: 19250.00\nShopping Done for Wife with remaining money from Son's budget!\nShopping Done for Son!" },
      { input: '100000', output: "Amount with Bonus: 175000.00\nWife Budget: 78750.00\nSon Budget: 78750.00\nSavings: 17500.00\nCannot do shopping for Wife even with remaining money from Son's budget!\nShopping Done for Son!" },
    ],
    tests: ['150000', '80000', '106000'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              double x = sc.nextDouble();
              double total = x + x * 0.75;
              double wife = total * 0.45;
              double son = total * 0.45;
              double savings = total * 0.10;
              double laptop = 90000;
              double sonNeed = 70000 + 7000;

              System.out.printf("Amount with Bonus: %.2f%n", total);
              System.out.printf("Wife Budget: %.2f%n", wife);
              System.out.printf("Son Budget: %.2f%n", son);
              System.out.printf("Savings: %.2f%n", savings);

              double wifeLeft = wife - laptop;
              double sonLeft = son - sonNeed;

              if (wifeLeft >= 0) {
                  System.out.println("Shopping Done for Wife!");
              } else if (sonLeft >= 0 && wifeLeft + sonLeft >= 0) {
                  System.out.println("Shopping Done for Wife with remaining money from Son's budget!");
              } else {
                  System.out.println("Cannot do shopping for Wife even with remaining money from Son's budget!");
              }

              if (sonLeft >= 0) {
                  System.out.println("Shopping Done for Son!");
              } else if (wifeLeft >= 0 && sonLeft + wifeLeft >= 0) {
                  System.out.println("Shopping Done for Son with remaining money from Wife's budget!");
              } else {
                  System.out.println("Cannot do shopping for Son even with remaining money from Wife's budget!");
              }
          }
      }
    `,
    hints: [
      'total = x + 75% of x. Each share is a percentage of total, not of x.',
      'Work out each person\'s leftover (budget − cost). A negative leftover means that person is short.',
      'The wife can borrow only if the son is NOT short himself and his leftover covers her whole gap: sonLeft >= 0 && wifeLeft + sonLeft >= 0.',
    ],
    plan: ['Read x and compute total, the three shares.', 'Print the four amounts with printf("%.2f").', 'Compute wifeLeft and sonLeft.', 'Three-way if / else-if / else for the wife, then the same for the son.'],
    tags: ['if else', 'percentages', 'printf'],
  },
  {
    id: 'cd-washing-machine', title: 'Fuzzy Washing Machine',
    topic: 'conditions', kind: 'code', difficulty: 'Exam', marks: 10,
    statement: `A washing machine reads two integers: the **weight** of clothes (grams) and the **detergent** level (ml). Check the rules **in this order**:
- If either value is negative → \`INVALID INPUT\`
- If detergent is less than 20 → \`INSUFFICIENT DETERGENT\`
- If weight is more than 7000 → \`OVERLOADED\`
- Otherwise print \`Time Estimated: T minutes\` where T is 0 for weight 0, 25 for 1–2000, 35 for 2001–4000, and 45 for 4001–7000.`,
    samples: [
      { input: '2000 50', output: 'Time Estimated: 25 minutes' },
      { input: '7500 30', output: 'OVERLOADED' },
      { input: '3000 10', output: 'INSUFFICIENT DETERGENT' },
      { input: '-5 25', output: 'INVALID INPUT' },
    ],
    tests: ['0 20', '2001 20', '4000 99', '7000 20', '7001 5'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int weight = sc.nextInt();
              int detergent = sc.nextInt();
              if (weight < 0 || detergent < 0) {
                  System.out.println("INVALID INPUT");
              } else if (detergent < 20) {
                  System.out.println("INSUFFICIENT DETERGENT");
              } else if (weight > 7000) {
                  System.out.println("OVERLOADED");
              } else {
                  int time;
                  if (weight == 0) {
                      time = 0;
                  } else if (weight <= 2000) {
                      time = 25;
                  } else if (weight <= 4000) {
                      time = 35;
                  } else {
                      time = 45;
                  }
                  System.out.println("Time Estimated: " + time + " minutes");
              }
          }
      }
    `,
    hints: ['The order of checks matters: an error check that comes first "wins". Follow the order in the statement exactly.', 'Once the earlier branches have ruled out other cases, weight <= 2000 is enough for the 1–2000 range — you already know weight is not 0.'],
    tags: ['else if', 'ranges', 'validation'],
  },
  {
    id: 'cd-gym-plan', title: 'Gym Membership Choice',
    topic: 'conditions', kind: 'code', difficulty: 'Practice', marks: 8,
    statement: `The Basic Plan costs **x** taka per month. The Premium Plan costs **30% more** than Basic. If Cody takes Basic he also wants a swimming club costing **15% of the Basic price**. His budget is **y**.
- If he can afford Premium, print \`Premium Plan\`.
- Otherwise, if he can afford Basic with swimming, print \`Basic Plan with Swimming Club\`.
- Otherwise print \`Needs N more taka\` where N is the extra money needed for the cheaper option, with two decimals.`,
    samples: [{ input: '2000 2700', output: 'Premium Plan' }, { input: '2000 2400', output: 'Basic Plan with Swimming Club' }, { input: '2000 2000', output: 'Needs 300.00 more taka' }],
    tests: ['1000 1300', '1000 1150', '3500 100'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              double x = sc.nextDouble();
              double y = sc.nextDouble();
              double premium = x + x * 0.30;
              double basicWithSwim = x + x * 0.15;
              if (premium <= y) {
                  System.out.println("Premium Plan");
              } else if (basicWithSwim <= y) {
                  System.out.println("Basic Plan with Swimming Club");
              } else {
                  System.out.printf("Needs %.2f more taka%n", basicWithSwim - y);
              }
          }
      }
    `,
    hints: ['Compute both plan costs first. Try the better plan first — the order of the if / else-if decides which message wins.'],
    tags: ['else if', 'percentages', 'printf'],
  },
  {
    id: 'cd-tournament', title: 'Gaming Tournament Score',
    topic: 'conditions', kind: 'code', difficulty: 'Exam', marks: 10,
    statement: `A player starts with **s** points and plays three rounds.
- **Speed Round** — win: points increase by 40%; lose: decrease by 20%.
- **Strategy Round** — win: increase by 25%; lose: decrease by 10%.
- **Endurance Round** — if points are now **200 or more**, the player passes automatically and gains a 15% bonus. Otherwise they must play: win +30%, lose −25%.
- If the final score **exceeds 400**, add a Grand Master Bonus of 50 points.

Input: s, then two booleans (Speed, Strategy). A third boolean (Endurance) is given **only if the endurance round must be played**. Print \`Final Score: <score>\`.`,
    samples: [
      { input: '100 true true true', output: 'Final Score: 227.5' },
      { input: '75 false true false', output: 'Final Score: 56.25' },
      { input: '300 true false', output: 'Final Score: 484.7', note: 'Endurance is not played, so only two booleans are given.' },
    ],
    tests: ['200 false false true', '50 true true false', '1000 true true'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              double s = sc.nextDouble();
              boolean speed = sc.nextBoolean();
              boolean strategy = sc.nextBoolean();

              if (speed) s = s * 1.40;
              else s = s * 0.80;

              if (strategy) s = s * 1.25;
              else s = s * 0.90;

              if (s >= 200) {
                  s = s * 1.15;
              } else {
                  boolean endurance = sc.nextBoolean();
                  if (endurance) s = s * 1.30;
                  else s = s * 0.75;
              }

              if (s > 400) {
                  s = s + 50;
              }
              System.out.println("Final Score: " + s);
          }
      }
    `,
    hints: ['A 40% increase is s * 1.40; a 20% decrease is s * 0.80.', 'Read the third boolean INSIDE the branch that plays the endurance round — reading it earlier would fail when it is not given.'],
    tags: ['if else', 'boolean input', 'percentages'],
  },
  {
    id: 'cd-electric-tiers', title: 'Tiered Electricity Bill',
    topic: 'conditions', kind: 'code', difficulty: 'Practice', marks: 6,
    statement: 'Units are charged in tiers: the **first 100** units cost 5 taka each, the **next 200** units cost 8 taka each, and every unit **above 300** costs 10 taka. Read the units used and print `Total bill: <amount>` as a whole number.',
    samples: [{ input: '80', output: 'Total bill: 400' }, { input: '250', output: 'Total bill: 1700' }, { input: '420', output: 'Total bill: 3300' }],
    tests: ['0', '100', '300', '301'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int units = sc.nextInt();
              int bill;
              if (units <= 100) {
                  bill = units * 5;
              } else if (units <= 300) {
                  bill = 100 * 5 + (units - 100) * 8;
              } else {
                  bill = 100 * 5 + 200 * 8 + (units - 300) * 10;
              }
              System.out.println("Total bill: " + bill);
          }
      }
    `,
    hints: ['Each tier only charges the units that fall inside it. For 250 units: 100 at 5 taka, then the remaining 150 at 8 taka.'],
    tags: ['else if', 'tiers'],
  },
  {
    id: 'cd-traffic-fine', title: 'Smart Traffic Fine',
    topic: 'conditions', kind: 'code', difficulty: 'Exam', marks: 8,
    statement: `Read the vehicle's **speed**, the **speed limit**, and the number of **past violations**.
- Within the limit → \`No fine\`
- Over by 1–10 km/h → fine 50; over by 11–30 → fine 150; over by more than 30 → fine 500 **and** a licence suspension.
- If there are 2 or more past violations, the fine is **doubled**.

Print \`Fine: $<amount>\`, and on the next line \`License suspended\` when it applies.`,
    samples: [{ input: '55 60 0', output: 'No fine' }, { input: '75 60 2', output: 'Fine: $300' }, { input: '100 60 1', output: 'Fine: $500\nLicense suspended' }],
    tests: ['61 60 5', '70 60 0', '90 60 3', '91 60 2'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int speed = sc.nextInt();
              int limit = sc.nextInt();
              int violations = sc.nextInt();
              int over = speed - limit;
              if (over <= 0) {
                  System.out.println("No fine");
              } else {
                  int fine;
                  boolean suspend = false;
                  if (over <= 10) {
                      fine = 50;
                  } else if (over <= 30) {
                      fine = 150;
                  } else {
                      fine = 500;
                      suspend = true;
                  }
                  if (violations >= 2) {
                      fine = fine * 2;
                  }
                  System.out.println("Fine: $" + fine);
                  if (suspend) {
                      System.out.println("License suspended");
                  }
              }
          }
      }
    `,
    hints: ['Compute how far over the limit the driver is first: over = speed − limit.', 'Doubling is a separate decision that applies after the base fine is known.'],
    tags: ['nested if', 'ranges'],
  },
  {
    id: 'cd-tri-seven', title: 'Divisibility Labels',
    topic: 'conditions', kind: 'code', difficulty: 'Warm-up', marks: 4,
    statement: 'Read an integer n. Print `TriSeven` if it is divisible by both 3 and 7, `Tri` if only by 3, `Seven` if only by 7, and otherwise print n itself.',
    samples: [{ input: '42', output: 'TriSeven' }, { input: '9', output: 'Tri' }, { input: '14', output: 'Seven' }, { input: '10', output: '10' }],
    tests: ['0', '-21', '1'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              if (n % 3 == 0 && n % 7 == 0) {
                  System.out.println("TriSeven");
              } else if (n % 3 == 0) {
                  System.out.println("Tri");
              } else if (n % 7 == 0) {
                  System.out.println("Seven");
              } else {
                  System.out.println(n);
              }
          }
      }
    `,
    hints: ['Check the "both" case first — otherwise 42 would stop at the "divisible by 3" branch.'],
    tags: ['else if', 'modulus'],
  },
  {
    id: 'cd-leap-year', title: 'Leap Year',
    topic: 'conditions', kind: 'code', difficulty: 'Warm-up', marks: 4,
    statement: 'Read a year. It is a leap year if it is divisible by 400, or divisible by 4 but not by 100. Print `Leap Year` or `Not Leap Year`.',
    samples: [{ input: '2024', output: 'Leap Year' }, { input: '1900', output: 'Not Leap Year' }, { input: '2000', output: 'Leap Year' }],
    tests: ['2023', '2100', '1600'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int year = sc.nextInt();
              if (year % 400 == 0 || (year % 4 == 0 && year % 100 != 0)) {
                  System.out.println("Leap Year");
              } else {
                  System.out.println("Not Leap Year");
              }
          }
      }
    `,
    hints: ['Translate the sentence directly: (divisible by 400) OR (divisible by 4 AND NOT divisible by 100).'],
    tags: ['logical operators'],
  },
  {
    id: 'cd-happy-hour', title: 'Happy Hour Discount',
    topic: 'conditions', kind: 'code', difficulty: 'Exam', marks: 8,
    statement: `A restaurant is open from **8** to **22** (8 AM to 10 PM). Happy hour is from **10 to 12** inclusive. A customer who visits at hour x during happy hour gets an **x% discount**.
Read the hour (int) and the total price (double).
- Outside opening hours → \`Invalid time\`
- During happy hour → \`Discount: x%\` then \`Total price: <price>\`
- Otherwise → \`No discount\` then \`Total price: <price>\`

Print prices with two decimals.`,
    samples: [{ input: '11 1000', output: 'Discount: 11%\nTotal price: 890.00' }, { input: '15 500', output: 'No discount\nTotal price: 500.00' }, { input: '23 700', output: 'Invalid time' }],
    tests: ['8 100', '10 250.5', '12 99.99', '22 10', '7 10'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int hour = sc.nextInt();
              double price = sc.nextDouble();
              if (hour < 8 || hour > 22) {
                  System.out.println("Invalid time");
              } else if (hour >= 10 && hour <= 12) {
                  double finalPrice = price - price * hour / 100;
                  System.out.println("Discount: " + hour + "%");
                  System.out.printf("Total price: %.2f%n", finalPrice);
              } else {
                  System.out.println("No discount");
                  System.out.printf("Total price: %.2f%n", price);
              }
          }
      }
    `,
    hints: ['Validate first: anything below 8 or above 22 is invalid.', 'The discount percentage IS the hour: price * hour / 100.'],
    tags: ['else if', 'validation', 'printf'],
  },
  {
    id: 'cd-loan-approval', title: 'Multi-Stage Loan Approval',
    topic: 'conditions', kind: 'code', difficulty: 'Challenge', marks: 10,
    statement: `Read the applicant's **credit score**, **monthly income**, **existing debt** and requested **loan amount**. Use only if / else.
- Credit score below 600 → \`Rejected\`.
- Credit score 600–700: if debt exceeds 40% of income → \`Rejected\`; otherwise the application moves to the next stage.
- Next stage (every applicant who reaches it, including scores above 700): if the loan exceeds 5 × income it is conditionally approved — but if debt exceeds 50% of income it is \`Rejected\`, otherwise \`Conditionally Approved\`. If the loan is within 5 × income → \`Approved\`.`,
    samples: [{ input: '580 50000 0 10000', output: 'Rejected' }, { input: '650 50000 25000 100000', output: 'Rejected' }, { input: '720 50000 30000 400000', output: 'Rejected' }, { input: '720 50000 10000 400000', output: 'Conditionally Approved' }, { input: '690 50000 10000 200000', output: 'Approved' }],
    tests: ['600 1000 400 5000', '700 1000 401 10', '701 1000 600 5000', '800 1000 0 5001'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int score = sc.nextInt();
              double income = sc.nextDouble();
              double debt = sc.nextDouble();
              double loan = sc.nextDouble();

              if (score < 600) {
                  System.out.println("Rejected");
              } else if (score <= 700 && debt > income * 0.40) {
                  System.out.println("Rejected");
              } else {
                  if (loan > 5 * income) {
                      if (debt > income * 0.50) {
                          System.out.println("Rejected");
                      } else {
                          System.out.println("Conditionally Approved");
                      }
                  } else {
                      System.out.println("Approved");
                  }
              }
          }
      }
    `,
    hints: ['Decide what "moves to the next stage" means: it simply falls through to the same loan-amount checks the high scorers get.', 'Draw the decision tree first; each leaf is one println.'],
    tags: ['nested if', 'decision tree'],
  },
  {
    id: 'cd-health-insurance', title: 'Health Insurance Eligibility',
    topic: 'conditions', kind: 'code', difficulty: 'Practice', marks: 6,
    statement: `Read an employee's **age** (int), whether they have a **pre-existing condition** (boolean) and **years worked** (int).
- Age 20–40: eligible only if there is no pre-existing condition.
- Age 41–60: eligible only if they have worked **more than 5** years.
- Age above 60: eligible only if they have worked **more than 10** years.
- Younger than 20: not eligible.

Print \`Eligible\` or \`Not Eligible\`.`,
    samples: [{ input: '30 false 1', output: 'Eligible' }, { input: '45 true 5', output: 'Not Eligible' }, { input: '65 false 11', output: 'Eligible' }],
    tests: ['19 false 3', '40 true 20', '41 true 6', '60 false 5', '61 false 10'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int age = sc.nextInt();
              boolean condition = sc.nextBoolean();
              int years = sc.nextInt();
              boolean eligible;
              if (age >= 20 && age <= 40) {
                  eligible = !condition;
              } else if (age >= 41 && age <= 60) {
                  eligible = years > 5;
              } else if (age > 60) {
                  eligible = years > 10;
              } else {
                  eligible = false;
              }
              if (eligible) {
                  System.out.println("Eligible");
              } else {
                  System.out.println("Not Eligible");
              }
          }
      }
    `,
    hints: ['A boolean variable can store the result of a comparison directly: eligible = years > 5;'],
    tags: ['else if', 'boolean input'],
  },
  {
    id: 'cd-rps', title: 'Rock, Paper, Scissors',
    topic: 'conditions', kind: 'code', difficulty: 'Practice', marks: 5,
    statement: 'Two players choose 1 (Rock), 2 (Paper) or 3 (Scissors). Rock beats Scissors, Scissors beats Paper, Paper beats Rock. Print `Player 1 wins`, `Player 2 wins` or `Tie`. If either choice is not 1–3, print `Invalid choice`.',
    samples: [{ input: '1 3', output: 'Player 1 wins' }, { input: '1 2', output: 'Player 2 wins' }, { input: '2 2', output: 'Tie' }],
    tests: ['3 2', '2 3', '3 1', '2 1', '4 1', '1 0'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int p1 = sc.nextInt();
              int p2 = sc.nextInt();
              if (p1 < 1 || p1 > 3 || p2 < 1 || p2 > 3) {
                  System.out.println("Invalid choice");
              } else if (p1 == p2) {
                  System.out.println("Tie");
              } else if ((p1 == 1 && p2 == 3) || (p1 == 3 && p2 == 2) || (p1 == 2 && p2 == 1)) {
                  System.out.println("Player 1 wins");
              } else {
                  System.out.println("Player 2 wins");
              }
          }
      }
    `,
    hints: ['After handling invalid input and the tie, list the three ways player 1 can win. Anything else means player 2 wins.'],
    tags: ['logical operators', 'else if'],
  },
  {
    id: 'cd-overtime', title: 'Overtime Pay',
    topic: 'conditions', kind: 'code', difficulty: 'Practice', marks: 6,
    statement: 'A worker earns **200** taka per hour for the first 8 hours, **250** per hour for the next 2 hours, and **300** per hour for another 2 hours. Nobody may work more than 12 hours. Read the hours worked (int) and print `Pay: <amount>`, or `Invalid hours` if hours is negative or above 12.',
    samples: [{ input: '6', output: 'Pay: 1200' }, { input: '9', output: 'Pay: 1850' }, { input: '12', output: 'Pay: 2700' }],
    tests: ['0', '8', '10', '11', '13', '-1'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int h = sc.nextInt();
              if (h < 0 || h > 12) {
                  System.out.println("Invalid hours");
              } else {
                  int pay;
                  if (h <= 8) {
                      pay = h * 200;
                  } else if (h <= 10) {
                      pay = 8 * 200 + (h - 8) * 250;
                  } else {
                      pay = 8 * 200 + 2 * 250 + (h - 10) * 300;
                  }
                  System.out.println("Pay: " + pay);
              }
          }
      }
    `,
    hints: ['Same idea as tiered billing: only the hours inside each band get that band\'s rate.'],
    tags: ['else if', 'tiers'],
  },
  {
    id: 'cd-grade-switch', title: 'Grade with switch',
    topic: 'conditions', kind: 'code', difficulty: 'Practice', marks: 5,
    statement: 'Read a mark from 0 to 100. Using a `switch` on `mark / 10`, print the grade: 90–100 → `A`, 80–89 → `B`, 70–79 → `C`, 60–69 → `D`, below 60 → `F`. Print `Invalid mark` for anything outside 0–100.',
    samples: [{ input: '95', output: 'A' }, { input: '100', output: 'A' }, { input: '72', output: 'C' }, { input: '12', output: 'F' }],
    tests: ['89', '60', '59', '101', '-3'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int mark = sc.nextInt();
              if (mark < 0 || mark > 100) {
                  System.out.println("Invalid mark");
              } else {
                  switch (mark / 10) {
                      case 10:
                      case 9:
                          System.out.println("A");
                          break;
                      case 8:
                          System.out.println("B");
                          break;
                      case 7:
                          System.out.println("C");
                          break;
                      case 6:
                          System.out.println("D");
                          break;
                      default:
                          System.out.println("F");
                  }
              }
          }
      }
    `,
    hints: ['mark / 10 is integer division: 95 / 10 is 9 and 100 / 10 is 10.', 'Let case 10 fall through into case 9 so that 100 also prints A.'],
    tags: ['switch', 'fall-through'],
  },
];

// ============================================================ LOOPS
export const loopProblems: Problem[] = [
  {
    id: 'lp-alternating-signs', title: 'Alternating Signs',
    topic: 'loops', kind: 'code', difficulty: 'Practice', marks: 5,
    statement: 'Read N, then N positive integers. Print them on one line with alternating signs, starting with `+` for the first number, separated by single spaces.',
    samples: [{ input: '5\n10 20 30 40 50', output: '+10 -20 +30 -40 +50' }],
    tests: ['1\n7', '2\n3 3', '6\n1 2 3 4 5 6'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              for (int i = 1; i <= n; i++) {
                  int x = sc.nextInt();
                  if (i % 2 == 1) {
                      System.out.print("+" + x);
                  } else {
                      System.out.print("-" + x);
                  }
                  if (i < n) {
                      System.out.print(" ");
                  }
              }
              System.out.println();
          }
      }
    `,
    hints: ['Read each number inside the loop, right before you print it.', 'Odd positions (1, 3, 5...) get + and even positions get −.'],
    tags: ['for', 'input in a loop'],
  },
  {
    id: 'lp-series-odd', title: 'Alternating Odd Series',
    topic: 'loops', kind: 'code', difficulty: 'Practice', marks: 5,
    statement: 'Read N and print the value of Y for the first N terms of: **Y = 3 − 5 + 7 − 9 + 11 − ...**',
    samples: [{ input: '5', output: '7', note: '3 − 5 + 7 − 9 + 11 = 7' }, { input: '2', output: '-2' }],
    tests: ['1', '3', '10', '11'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              int y = 0;
              int term = 3;
              for (int i = 1; i <= n; i++) {
                  if (i % 2 == 1) {
                      y += term;
                  } else {
                      y -= term;
                  }
                  term += 2;
              }
              System.out.println(y);
          }
      }
    `,
    hints: ['Keep the current term in a variable: it starts at 3 and grows by 2.', 'Add on odd-numbered terms, subtract on even-numbered terms.'],
    tags: ['for', 'series'],
  },
  {
    id: 'lp-series-even', title: 'Alternating Even Series',
    topic: 'loops', kind: 'code', difficulty: 'Practice', marks: 5,
    statement: 'Read N and print the value of Y for the first N terms of: **Y = 2 − 4 + 6 − 8 + 10 − ...**',
    samples: [{ input: '5', output: '6' }, { input: '4', output: '-4' }],
    tests: ['1', '2', '9'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              int y = 0;
              for (int i = 1; i <= n; i++) {
                  int term = 2 * i;
                  if (i % 2 == 1) {
                      y += term;
                  } else {
                      y -= term;
                  }
              }
              System.out.println(y);
          }
      }
    `,
    hints: ['The i-th term is 2 * i.'],
    tags: ['for', 'series'],
  },
  {
    id: 'lp-mars-inflation', title: 'Mars Colony Inflation',
    topic: 'loops', kind: 'code', difficulty: 'Exam', marks: 10,
    statement: `A Mars colony imports oxygen cylinders and water reserves. Each month since January 1999 the oxygen price has risen by **p%** of the previous month's price, and water by **q%**. From January 1999 to January 2025 is **312 months**.
Read the 1999 prices of oxygen and water, then p and q. Using a loop over the months, print both current prices with two decimals, then which item's price has **increased more in total** (current − initial).`,
    samples: [
      { input: '120 20 1 1.5', output: 'Current price of an oxygen cylinder: 2675.78 Taka\nCurrent price of a unit of water reserve: 2081.78 Taka\nThe price of oxygen cylinders has increased more.' },
      { input: '45 15 1 2.3', output: 'Current price of an oxygen cylinder: 1003.42 Taka\nCurrent price of a unit of water reserve: 18083.77 Taka\nThe price of water reserves has increased more.' },
    ],
    tests: ['100 100 0.5 0.4', '10 10 1 1'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              double oxygen = sc.nextDouble();
              double water = sc.nextDouble();
              double p = sc.nextDouble();
              double q = sc.nextDouble();
              double oxygenStart = oxygen, waterStart = water;

              for (int month = 1; month <= 312; month++) {
                  oxygen = oxygen + oxygen * p / 100;
                  water = water + water * q / 100;
              }
              System.out.printf("Current price of an oxygen cylinder: %.2f Taka%n", oxygen);
              System.out.printf("Current price of a unit of water reserve: %.2f Taka%n", water);

              double oxygenRise = oxygen - oxygenStart;
              double waterRise = water - waterStart;
              if (oxygenRise > waterRise) {
                  System.out.println("The price of oxygen cylinders has increased more.");
              } else if (waterRise > oxygenRise) {
                  System.out.println("The price of water reserves has increased more.");
              } else {
                  System.out.println("Both prices have increased equally.");
              }
          }
      }
    `,
    hints: ['Each month the new price is the old price plus p% of the old price: price = price + price * p / 100.', 'Keep the starting prices before the loop so you can compute the total increase afterwards.'],
    tags: ['for', 'compound growth', 'printf'],
  },
  {
    id: 'lp-gcd', title: 'GCD by the Euclidean Method',
    topic: 'loops', kind: 'code', difficulty: 'Practice', marks: 6,
    statement: 'Read two positive integers. Put the larger in **a** and the smaller in **b**. Repeat: compute `a % b`, replace a with b and b with the remainder, until the remainder is 0. The last non-zero value (now in a) is the GCD. Print it.',
    samples: [{ input: '12 18', output: '6' }, { input: '9 7', output: '1' }],
    tests: ['5 5', '100 75', '1 1000', '270 192'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int x = sc.nextInt();
              int y = sc.nextInt();
              int a = Math.max(x, y);
              int b = Math.min(x, y);
              while (b != 0) {
                  int r = a % b;
                  a = b;
                  b = r;
              }
              System.out.println(a);
          }
      }
    `,
    hints: ['You need a temporary variable for the remainder so that a and b can both be replaced.'],
    tags: ['while', 'algorithm'],
  },
  {
    id: 'lp-factorial', title: 'Factorial',
    topic: 'loops', kind: 'code', difficulty: 'Warm-up', marks: 4,
    statement: 'Read n. If n is negative print `Invalid`. Otherwise print n! (n factorial) using a for loop. 0! is 1. Use `long` so values up to 20! fit.',
    samples: [{ input: '5', output: '120' }, { input: '0', output: '1' }, { input: '-3', output: 'Invalid' }],
    tests: ['1', '10', '20'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              if (n < 0) {
                  System.out.println("Invalid");
              } else {
                  long fact = 1;
                  for (int i = 1; i <= n; i++) {
                      fact *= i;
                  }
                  System.out.println(fact);
              }
          }
      }
    `,
    hints: ['Start the product at 1, not 0.', 'An int overflows after 12! — use long.'],
    tags: ['for', 'long'],
  },
  {
    id: 'lp-prime', title: 'Prime Check',
    topic: 'loops', kind: 'code', difficulty: 'Practice', marks: 5,
    statement: 'Read an integer n and print `Prime` if it is a prime number, otherwise `Not Prime`. Numbers below 2 are not prime.',
    samples: [{ input: '7', output: 'Prime' }, { input: '12', output: 'Not Prime' }, { input: '1', output: 'Not Prime' }],
    tests: ['2', '9', '97', '0', '-7', '7919'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              boolean prime = n >= 2;
              for (int i = 2; i * i <= n; i++) {
                  if (n % i == 0) {
                      prime = false;
                      break;
                  }
              }
              if (prime) {
                  System.out.println("Prime");
              } else {
                  System.out.println("Not Prime");
              }
          }
      }
    `,
    hints: ['Assume prime, then look for any divisor between 2 and n − 1. One divisor is enough to break.', 'Checking up to the square root (i * i <= n) is enough and much faster.'],
    tags: ['for', 'break', 'prime'],
  },
  {
    id: 'lp-fibonacci', title: 'Fibonacci Growth',
    topic: 'loops', kind: 'code', difficulty: 'Practice', marks: 5,
    statement: 'The first two terms are 0 and 1; every later term is the sum of the previous two. Read N (N ≥ 1) and print the first N terms separated by spaces.',
    samples: [{ input: '8', output: '0 1 1 2 3 5 8 13' }, { input: '1', output: '0' }],
    tests: ['2', '3', '20'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              int a = 0, b = 1;
              for (int i = 1; i <= n; i++) {
                  System.out.print(a);
                  if (i < n) System.out.print(" ");
                  int next = a + b;
                  a = b;
                  b = next;
              }
              System.out.println();
          }
      }
    `,
    hints: ['Keep the last two terms in two variables and slide them forward each iteration.'],
    tags: ['for', 'series'],
  },
  {
    id: 'lp-mystery-series', title: 'The Ancient Mystery Series',
    topic: 'loops', kind: 'code', difficulty: 'Exam', marks: 10,
    statement: `The series is: **0, 0, 2, 1, 4, 2, 6, 3, 8, 4, 10, 5, ...**
- Odd-positioned terms (1st, 3rd, 5th, ...) are the even numbers 0, 2, 4, ...
- Each even-positioned term is the previous term divided by 2.

Read n (1 ≤ n ≤ 20000) and print the n-th term. You **must** use a loop that generates the terms from the start — no direct formula.`,
    restrictions: ['Generate the terms one by one with a loop; a direct formula is not allowed.'],
    samples: [{ input: '10', output: '4' }, { input: '15', output: '14' }],
    tests: ['1', '2', '3', '20000', '19999'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              int term = 0;
              int even = 0;
              for (int pos = 1; pos <= n; pos++) {
                  if (pos % 2 == 1) {
                      term = even;
                      even += 2;
                  } else {
                      term = term / 2;
                  }
              }
              System.out.println(term);
          }
      }
    `,
    hints: ['Loop over positions 1..n and keep the current term.', 'On odd positions the term is the next even number (keep a counter that grows by 2); on even positions halve the previous term.'],
    tags: ['for', 'series'],
  },
  {
    id: 'lp-special-count', title: 'Count Special Numbers',
    topic: 'loops', kind: 'code', difficulty: 'Practice', marks: 5,
    statement: 'Read N, then N integers. Count how many are divisible by 3 **or** 5, but **not by both**. Print the count.',
    samples: [{ input: '6\n3 5 15 7 9 10', output: '4' }],
    tests: ['1\n15', '3\n0 1 2', '5\n30 33 35 -6 45'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              int count = 0;
              for (int i = 1; i <= n; i++) {
                  int x = sc.nextInt();
                  boolean by3 = x % 3 == 0;
                  boolean by5 = x % 5 == 0;
                  if ((by3 || by5) && !(by3 && by5)) {
                      count++;
                  }
              }
              System.out.println(count);
          }
      }
    `,
    hints: ['"One or the other but not both" is exclusive-or: (a || b) && !(a && b), or simply a != b for two booleans.'],
    tags: ['for', 'logical operators', 'counting'],
  },
  {
    id: 'lp-even-sum-odd-count', title: 'Positive Even Sum and Negative Odd Count',
    topic: 'loops', kind: 'code', difficulty: 'Practice', marks: 5,
    statement: 'Read 8 integers. Print the sum of the **positive even** numbers on the first line and the count of **negative odd** numbers on the second.',
    samples: [{ input: '4 -3 7 10 -5 0 -8 -1', output: '14\n3' }],
    tests: ['1 1 1 1 1 1 1 1', '-2 -4 -6 -8 2 4 6 8', '-1 -1 -1 -1 -1 -1 -1 -1'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int sum = 0, count = 0;
              for (int i = 1; i <= 8; i++) {
                  int n = sc.nextInt();
                  if (n > 0 && n % 2 == 0) {
                      sum += n;
                  }
                  if (n < 0 && n % 2 != 0) {
                      count++;
                  }
              }
              System.out.println(sum);
              System.out.println(count);
          }
      }
    `,
    hints: ['For a negative odd number, n % 2 is −1 in Java, not 1 — so test n % 2 != 0.'],
    tags: ['for', 'modulus sign'],
  },
  {
    id: 'lp-horcrux', title: 'The Horcrux Battle',
    topic: 'loops', kind: 'code', difficulty: 'Exam', marks: 10,
    statement: `Harry starts with **H** power and Voldemort with **V**. For each of **5** Horcruxes you read a boolean: was it destroyed?
- Destroyed: Harry gains 50, Voldemort loses 40.
- Not destroyed: Harry loses 20 × (the number of this attempt, 1 to 5), Voldemort gains 40.
- If at any point either power drops to **0 or below**, the other one wins immediately (stop processing).
- After all five: Harry wins if his power is greater. If it is less, he can still win if he has the Elder Wand **and** at least one Horcrux was destroyed. Otherwise Voldemort wins.

Input: H, V, five booleans, then the Elder Wand boolean. Print \`Winner: Harry\` or \`Winner: Voldemort\`.`,
    samples: [
      { input: '200 300\ntrue true false false false\nfalse', output: 'Winner: Voldemort' },
      { input: '300 250\nfalse false false true true\ntrue', output: 'Winner: Harry' },
    ],
    tests: ['50 400\nfalse false true true true\ntrue', '500 45\ntrue false false false false\nfalse', '100 100\ntrue true true true true\nfalse', '100 100\nfalse true false true false\nfalse'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int harry = sc.nextInt();
              int volde = sc.nextInt();
              int destroyed = 0;
              String winner = "";
              for (int attempt = 1; attempt <= 5; attempt++) {
                  boolean d = sc.nextBoolean();
                  if (d) {
                      harry += 50;
                      volde -= 40;
                      destroyed++;
                  } else {
                      harry -= 20 * attempt;
                      volde += 40;
                  }
                  if (harry <= 0) {
                      winner = "Voldemort";
                      break;
                  }
                  if (volde <= 0) {
                      winner = "Harry";
                      break;
                  }
              }
              if (winner.equals("")) {
                  boolean elderWand = sc.nextBoolean();
                  if (harry > volde) {
                      winner = "Harry";
                  } else if (harry < volde && elderWand && destroyed >= 1) {
                      winner = "Harry";
                  } else {
                      winner = "Voldemort";
                  }
              }
              System.out.println("Winner: " + winner);
          }
      }
    `,
    hints: ['The penalty grows with the attempt number, so use the loop counter: harry -= 20 * attempt.', 'Use break to stop as soon as someone reaches 0 — and remember whether the battle was already decided.'],
    tags: ['for', 'break', 'boolean input', 'game simulation'],
  },
  {
    id: 'lp-devil-number', title: "The Devil's Number",
    topic: 'loops', kind: 'code', difficulty: 'Challenge', marks: 10,
    statement: `The Devil's life force is a 5-digit number. **Jessy**, then **Sarah**, then **Oliver** guess its **last digit**; each starts with **10** power. The current player keeps guessing until they die.
- Correct guess → the last digit is removed. If the number becomes 0, print \`Congratulations! The Devil has been defeated!\` and stop.
- Wrong guess → the player's power drops by |guess − digit|. If power reaches **0 or below**, print \`<Name> has died!\` and the next friend continues.
- If all three die, print \`The Devil wins! Better luck next time!\`.

Input: the number, then the guesses in the order they are made.`,
    samples: [
      { input: '54321\n1 2 3 4 5', output: 'Congratulations! The Devil has been defeated!' },
      { input: '98765\n8 5 2 1\n6 2 3 6\n8 7 8 1 3', output: 'Jessy has died!\nSarah has died!\nOliver has died!\nThe Devil wins! Better luck next time!' },
    ],
    tests: ['11111\n1 1 1 1 1', '10000\n9 0 0 0 0 1', '99999\n0 0 9 9 9 9 9'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int devil = sc.nextInt();
              boolean won = false;
              for (int player = 1; player <= 3 && !won; player++) {
                  String name;
                  if (player == 1) name = "Jessy";
                  else if (player == 2) name = "Sarah";
                  else name = "Oliver";
                  int power = 10;
                  while (power > 0) {
                      int guess = sc.nextInt();
                      int digit = devil % 10;
                      if (guess == digit) {
                          devil = devil / 10;
                          if (devil == 0) {
                              won = true;
                              break;
                          }
                      } else {
                          power -= Math.abs(guess - digit);
                      }
                  }
                  if (!won) {
                      System.out.println(name + " has died!");
                  }
              }
              if (won) {
                  System.out.println("Congratulations! The Devil has been defeated!");
              } else {
                  System.out.println("The Devil wins! Better luck next time!");
              }
          }
      }
    `,
    hints: ['An outer loop over the three players, and an inner while loop that keeps reading guesses while the current player is alive.', 'A boolean flag (won) lets both loops stop once the number is fully removed.'],
    tags: ['nested loop', 'digits', 'game simulation', 'break'],
  },
  {
    id: 'lp-multiples', title: 'First Ten Multiples',
    topic: 'loops', kind: 'code', difficulty: 'Warm-up', marks: 3,
    statement: 'Read an integer n and print its first 10 positive multiples, each on its own line, in the form `n x i = result`.',
    samples: [{ input: '7', output: '7 x 1 = 7\n7 x 2 = 14\n7 x 3 = 21\n7 x 4 = 28\n7 x 5 = 35\n7 x 6 = 42\n7 x 7 = 49\n7 x 8 = 56\n7 x 9 = 63\n7 x 10 = 70' }],
    tests: ['1', '-3', '12'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              for (int i = 1; i <= 10; i++) {
                  System.out.println(n + " x " + i + " = " + (n * i));
              }
          }
      }
    `,
    hints: ['Put n * i in brackets inside the println, otherwise + would join the numbers as text.'],
    tags: ['for', 'concatenation'],
  },
];

// ============================================================ NESTED LOOPS
export const nestedLoopProblems: Problem[] = [
  {
    id: 'nl-prime-game', title: "Ronaldo's Prime Digit Game",
    topic: 'nested-loops', kind: 'code', difficulty: 'Exam', marks: 10,
    statement: `Read a 4-digit number. Starting from the **last** digit and moving left, check whether each digit is prime (use a loop to test for divisors). The player has **3 lives**.
- Prime digit → print \`d is prime! (k/3 found)\`
- Not prime → lose a life and print \`d is not prime. Lives left: L\`
- After 3 primes are found print \`Congratulations! You won the game!\` and stop. If lives reach 0, or the digits run out first, print \`Game over! You lost.\``,
    samples: [
      { input: '2486', output: '6 is not prime. Lives left: 2\n8 is not prime. Lives left: 1\n4 is not prime. Lives left: 0\nGame over! You lost.' },
      { input: '3475', output: '5 is prime! (1/3 found)\n7 is prime! (2/3 found)\n4 is not prime. Lives left: 2\n3 is prime! (3/3 found)\nCongratulations! You won the game!' },
    ],
    tests: ['2357', '1109', '7722', '1000'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              int lives = 3, found = 0;
              boolean won = false;
              while (n > 0 && lives > 0 && !won) {
                  int d = n % 10;
                  boolean prime = d >= 2;
                  for (int i = 2; i < d; i++) {
                      if (d % i == 0) {
                          prime = false;
                      }
                  }
                  if (prime) {
                      found++;
                      System.out.println(d + " is prime! (" + found + "/3 found)");
                      if (found == 3) {
                          won = true;
                      }
                  } else {
                      lives--;
                      System.out.println(d + " is not prime. Lives left: " + lives);
                  }
                  n = n / 10;
              }
              if (won) {
                  System.out.println("Congratulations! You won the game!");
              } else {
                  System.out.println("Game over! You lost.");
              }
          }
      }
    `,
    hints: ['The outer loop peels digits; the inner loop tests one digit for divisors.', 'Remember 0 and 1 are not prime.', 'The outer loop must stop for three different reasons: digits run out, lives reach 0, or the game is won.'],
    tags: ['nested loop', 'prime', 'digits', 'game simulation'],
  },
  {
    id: 'nl-digit-sum-prime', title: 'Numbers with a Prime Digit Sum',
    topic: 'nested-loops', kind: 'code', difficulty: 'Exam', marks: 10,
    statement: 'Read two integers, a start and an end (start ≤ end). Print every number in that range (inclusive) whose **sum of digits is prime**, separated by `, ` and ending with a full stop. If there are none, print `None.`',
    samples: [{ input: '10 20', output: '11, 12, 14, 16, 20.' }, { input: '36 48', output: '38, 41, 43, 47.' }],
    tests: ['1 1', '1 10', '100 130', '90 91'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int start = sc.nextInt();
              int end = sc.nextInt();
              boolean first = true;
              for (int num = start; num <= end; num++) {
                  int sum = 0, t = num;
                  while (t > 0) {
                      sum += t % 10;
                      t /= 10;
                  }
                  boolean prime = sum >= 2;
                  for (int i = 2; i * i <= sum; i++) {
                      if (sum % i == 0) prime = false;
                  }
                  if (prime) {
                      if (!first) System.out.print(", ");
                      System.out.print(num);
                      first = false;
                  }
              }
              if (first) System.out.println("None.");
              else System.out.println(".");
          }
      }
    `,
    hints: ['For each number: one inner loop adds its digits, another tests the sum for primality.', 'Print ", " BEFORE every number except the first, and the full stop once at the end.'],
    tags: ['nested loop', 'digits', 'prime', 'formatting'],
  },
  {
    id: 'nl-contains-digit', title: 'Numbers Containing a Digit',
    topic: 'nested-loops', kind: 'code', difficulty: 'Practice', marks: 8,
    statement: 'Read a start, an end, and a digit D (0–9). Print every number from start to end (inclusive) that contains D, separated by `, ` and ending with a full stop. Print `None.` if there are none.',
    samples: [{ input: '20 50 3', output: '23, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 43.' }, { input: '15 29 7', output: '17, 27.' }],
    tests: ['1 9 0', '100 110 0', '5 5 5'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int start = sc.nextInt();
              int end = sc.nextInt();
              int d = sc.nextInt();
              boolean first = true;
              for (int num = start; num <= end; num++) {
                  boolean has = false;
                  int t = num;
                  while (t > 0) {
                      if (t % 10 == d) {
                          has = true;
                          break;
                      }
                      t /= 10;
                  }
                  if (has) {
                      if (!first) System.out.print(", ");
                      System.out.print(num);
                      first = false;
                  }
              }
              if (first) System.out.println("None.");
              else System.out.println(".");
          }
      }
    `,
    hints: ['Use a boolean "found" that is reset to false for every number, then set it true inside the digit loop.'],
    tags: ['nested loop', 'digits'],
  },
  {
    id: 'nl-triangle', title: 'Increasing Star Triangle',
    topic: 'nested-loops', kind: 'code', difficulty: 'Warm-up', marks: 4,
    statement: 'Read N and print a right triangle of stars with N rows: row i has i stars.',
    samples: [{ input: '4', output: '*\n**\n***\n****' }],
    tests: ['1', '6'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              for (int i = 1; i <= n; i++) {
                  for (int j = 1; j <= i; j++) {
                      System.out.print("*");
                  }
                  System.out.println();
              }
          }
      }
    `,
    hints: ['The outer loop is the row; the inner loop prints that row\'s stars with print, then println ends the row.'],
    tags: ['nested loop', 'pattern'],
  },
  {
    id: 'nl-pyramid', title: 'Number Pyramid',
    topic: 'nested-loops', kind: 'code', difficulty: 'Exam', marks: 8,
    statement: 'Read N and print a centred pyramid: row i has (N − i) spaces, then the numbers 1 up to i and back down to 1, with no spaces between numbers.',
    samples: [{ input: '4', output: '   1\n  121\n 12321\n1234321' }],
    tests: ['1', '5'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              for (int i = 1; i <= n; i++) {
                  for (int s = 1; s <= n - i; s++) {
                      System.out.print(" ");
                  }
                  for (int j = 1; j <= i; j++) {
                      System.out.print(j);
                  }
                  for (int j = i - 1; j >= 1; j--) {
                      System.out.print(j);
                  }
                  System.out.println();
              }
          }
      }
    `,
    hints: ['Each row is three inner loops in sequence: spaces, counting up, counting down.', 'The counting-down loop starts at i − 1 so the peak is not printed twice.'],
    strict: true,
    tags: ['nested loop', 'pattern'],
  },
  {
    id: 'nl-theater', title: 'Theater Seating',
    topic: 'nested-loops', kind: 'code', difficulty: 'Practice', marks: 6,
    statement: 'A theater has R rows with S seats each, numbered 1..S in every row. Any seat whose number is a multiple of 5 is reserved for VIPs. Use nested loops to count and print `General seats: X` and `VIP seats: Y`.',
    samples: [{ input: '3 12', output: 'General seats: 30\nVIP seats: 6' }],
    tests: ['1 4', '10 5', '7 23'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int rows = sc.nextInt();
              int seats = sc.nextInt();
              int general = 0, vip = 0;
              for (int r = 1; r <= rows; r++) {
                  for (int s = 1; s <= seats; s++) {
                      if (s % 5 == 0) {
                          vip++;
                      } else {
                          general++;
                      }
                  }
              }
              System.out.println("General seats: " + general);
              System.out.println("VIP seats: " + vip);
          }
      }
    `,
    hints: ['The seat number restarts at 1 in each row, so test the inner loop variable.'],
    tags: ['nested loop', 'counting'],
  },
  {
    id: 'nl-garden', title: 'Watering the Garden',
    topic: 'nested-loops', kind: 'code', difficulty: 'Exam', marks: 10,
    statement: `A garden has R rows and C columns (numbered from 1). The plot at row r, column c needs **r × c** litres. The gardener starts with a **full** can of the given capacity and waters the plots row by row. If a plot needs more than what is left in the can, he refills it to full capacity (counting one refill) before watering that plot. Assume every single plot needs no more than the capacity.
Print \`Total water used: W\` and \`Refills: K\`.`,
    samples: [{ input: '2 3 5', output: 'Total water used: 18\nRefills: 3', note: 'Needs 1, 2, 3, 2, 4, 6 — refills before the 3rd, 4th and 5th plots.' }],
    tests: ['1 1 1', '3 3 9', '4 5 20'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int rows = sc.nextInt();
              int cols = sc.nextInt();
              int capacity = sc.nextInt();
              int left = capacity;
              int used = 0, refills = 0;
              for (int r = 1; r <= rows; r++) {
                  for (int c = 1; c <= cols; c++) {
                      int need = r * c;
                      if (need > left) {
                          left = capacity;
                          refills++;
                      }
                      left -= need;
                      used += need;
                  }
              }
              System.out.println("Total water used: " + used);
              System.out.println("Refills: " + refills);
          }
      }
    `,
    hints: ['Track how much water is LEFT in the can, separately from the total used.', 'Refill before watering: check need > left first, then subtract.'],
    tags: ['nested loop', 'simulation'],
  },
  {
    id: 'nl-odd-even-multiply', title: 'Multiplication Made Fun',
    topic: 'nested-loops', kind: 'code', difficulty: 'Challenge', marks: 10,
    statement: `Read two positive integers. Walk the digits of the first integer **from left to right**. Multiply each **odd** digit by **all the odd digits** of the second integer, and each **even** digit by **all the even digits** of the second integer (also walked left to right). If the second integer has no digits of the needed kind, the result for that digit is 0.
Print the results separated by \`, \`.`,
    samples: [{ input: '123456 234567', output: '105, 96, 315, 192, 525, 288', note: '1×3×5×7 = 105, then 2×2×4×6 = 96, ...' }],
    tests: ['7 2468', '20 11', '9 9', '1357 13'],
    restrictions: ['Do not use String or arrays.'],
    rules: { noStringsOrArrays: true },
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int a = sc.nextInt();
              int b = sc.nextInt();
              int divA = 1;
              while (divA * 10 <= a) divA *= 10;
              int divB = 1;
              while (divB * 10 <= b) divB *= 10;

              boolean first = true;
              while (divA > 0) {
                  int d = (a / divA) % 10;
                  int product = d;
                  boolean any = false;
                  for (int div = divB; div > 0; div /= 10) {
                      int e = (b / div) % 10;
                      if (e % 2 == d % 2) {
                          product *= e;
                          any = true;
                      }
                  }
                  if (!any) product = 0;
                  if (!first) System.out.print(", ");
                  System.out.print(product);
                  first = false;
                  divA /= 10;
              }
              System.out.println();
          }
      }
    `,
    hints: ['You need forward traversal of BOTH numbers — build a power-of-10 divisor for each.', 'For every digit of the first number, restart the walk over the second number from its leftmost digit.', 'Use a flag to detect "no matching digits".'],
    tags: ['nested loop', 'digits', 'forward traversal'],
  },
  {
    id: 'nl-weekly-tasks', title: 'Weekly Task Tracker',
    topic: 'nested-loops', kind: 'code', difficulty: 'Exam', marks: 10,
    statement: `A team has **5 workers**. For each worker, read the tasks completed on each of the **7 days**. For every worker print \`Worker k: T tasks - Goal met\` if T ≥ 50, otherwise \`Worker k: T tasks - Goal not met\`. Finally print \`Company total: X\` followed by \`Company goal achieved\` if X ≥ 250 or \`Company goal not achieved\`.`,
    samples: [{ input: '7 7 7 7 7 7 8\n5 5 5 5 5 5 5\n10 10 10 10 10 0 0\n1 2 3 4 5 6 7\n9 9 9 9 9 9 9', output: 'Worker 1: 50 tasks - Goal met\nWorker 2: 35 tasks - Goal not met\nWorker 3: 50 tasks - Goal met\nWorker 4: 28 tasks - Goal not met\nWorker 5: 63 tasks - Goal met\nCompany total: 226\nCompany goal not achieved' }],
    tests: ['10 10 10 10 10 10 10\n10 10 10 10 10 10 10\n10 10 10 10 10 10 10\n10 10 10 10 10 10 10\n10 10 10 10 10 10 10', '0 0 0 0 0 0 0\n0 0 0 0 0 0 0\n0 0 0 0 0 0 0\n0 0 0 0 0 0 0\n0 0 0 0 0 0 50'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int companyTotal = 0;
              for (int w = 1; w <= 5; w++) {
                  int total = 0;
                  for (int day = 1; day <= 7; day++) {
                      total += sc.nextInt();
                  }
                  if (total >= 50) {
                      System.out.println("Worker " + w + ": " + total + " tasks - Goal met");
                  } else {
                      System.out.println("Worker " + w + ": " + total + " tasks - Goal not met");
                  }
                  companyTotal += total;
              }
              System.out.println("Company total: " + companyTotal);
              if (companyTotal >= 250) {
                  System.out.println("Company goal achieved");
              } else {
                  System.out.println("Company goal not achieved");
              }
          }
      }
    `,
    hints: ['Reset the worker total to 0 at the start of every outer iteration — a very common exam mistake is to declare it outside.'],
    tags: ['nested loop', 'input in a loop', 'accumulator'],
  },
];

// ============================================================ OPERATORS / VARIABLES / INPUT
export const operatorProblems: Problem[] = [
  {
    id: 'op-no-loop-sevens', title: 'Sum of Sevens without a Loop',
    topic: 'operators', kind: 'code', difficulty: 'Exam', marks: 8,
    statement: 'The series is **7 + 7 − 7 + 7 + 7 − 7 + 7 + 7 − 7 + ...** up to the n-th term (n > 0). Read n and print the sum. You are **not** allowed to use any loop — use integer division and the remainder.',
    restrictions: ['No loops allowed.'],
    rules: { noLoops: true },
    samples: [{ input: '3', output: '7' }, { input: '7', output: '21' }, { input: '11', output: '35' }],
    tests: ['1', '2', '1000', '1001'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int n = sc.nextInt();
              int groups = n / 3;
              int rest = n % 3;
              int sum = groups * 7;
              if (rest == 1) {
                  sum += 7;
              } else if (rest == 2) {
                  sum += 14;
              }
              System.out.println(sum);
          }
      }
    `,
    hints: ['Every complete group of three terms (7 + 7 − 7) adds exactly 7.', 'n / 3 counts complete groups; n % 3 tells you how many terms are left over (0, 1 or 2).'],
    tags: ['integer division', 'modulus', 'no loops'],
  },
  {
    id: 'op-clock-angle', title: 'Clock Hand Angles',
    topic: 'operators', kind: 'code', difficulty: 'Exam', marks: 8,
    statement: 'Read the time as hours (12-hour format) and minutes. The hour hand moves 30° per hour **plus** 0.5° per minute; the minute hand moves 6° per minute. Print the smaller and the larger angle between the hands.',
    samples: [{ input: '4 35', output: 'Smaller angle: 72.5 degrees\nLarger angle: 287.5 degrees' }, { input: '8 2', output: 'Smaller angle: 131.0 degrees\nLarger angle: 229.0 degrees' }],
    tests: ['12 0', '3 0', '6 0', '9 45'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int hours = sc.nextInt();
              int minutes = sc.nextInt();
              double hourAngle = (hours % 12) * 30 + minutes * 0.5;
              double minuteAngle = minutes * 6;
              double diff = Math.abs(hourAngle - minuteAngle);
              double smaller = diff;
              if (diff > 180) {
                  smaller = 360 - diff;
              }
              double larger = 360 - smaller;
              System.out.println("Smaller angle: " + smaller + " degrees");
              System.out.println("Larger angle: " + larger + " degrees");
          }
      }
    `,
    hints: ['Measure both hands from 12:00, take the absolute difference, and if it is over 180 the other side is the smaller angle.', 'Use hours % 12 so that 12 o\'clock counts as 0.'],
    tags: ['double', 'Math.abs', 'formula'],
  },
  {
    id: 'op-div-mod-manual', title: 'Division and Remainder by Hand',
    topic: 'operators', kind: 'code', difficulty: 'Practice', marks: 6,
    statement: 'Read two positive integers a and b. Compute a / b **without** using `/`, and a % b **without** using `%` (repeated subtraction works). Print `a / b = Q` and `a % b = R` with the real numbers in place of a, b, Q and R.',
    restrictions: ['Do not use the / or % operators.'],
    rules: { noDivMod: true },
    samples: [{ input: '17 5', output: '17 / 5 = 3\n17 % 5 = 2' }],
    tests: ['5 17', '20 4', '1 1', '100 7'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int a = sc.nextInt();
              int b = sc.nextInt();
              int q = 0;
              int r = a;
              while (r >= b) {
                  r -= b;
                  q++;
              }
              System.out.println(a + " / " + b + " = " + q);
              System.out.println(a + " % " + b + " = " + r);
          }
      }
    `,
    hints: ['Subtract b from a copy of a as many times as possible. The number of subtractions is the quotient; what is left is the remainder.'],
    tags: ['while', 'operators'],
  },
  {
    id: 'op-seconds', title: 'Seconds to Hours, Minutes and Seconds',
    topic: 'operators', kind: 'code', difficulty: 'Warm-up', marks: 4,
    statement: 'Read a number of seconds and print how many hours, minutes and seconds it is, in the form `H hours M minutes S seconds`.',
    samples: [{ input: '10000', output: '2 hours 46 minutes 40 seconds' }],
    tests: ['0', '59', '3600', '86399'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int total = sc.nextInt();
              int hours = total / 3600;
              int minutes = total % 3600 / 60;
              int seconds = total % 60;
              System.out.println(hours + " hours " + minutes + " minutes " + seconds + " seconds");
          }
      }
    `,
    hints: ['/ gives how many whole units fit; % gives what is left over.'],
    tags: ['integer division', 'modulus'],
  },
  {
    id: 'op-rotate-three', title: 'Rotate Three Values',
    topic: 'variables', kind: 'code', difficulty: 'Warm-up', marks: 4,
    statement: 'Read a, b and c. Move the values so that the value of a goes to b, b goes to c, and c goes to a. Print `a = .., b = .., c = ..`.',
    samples: [{ input: '1 2 3', output: 'a = 3, b = 1, c = 2' }],
    tests: ['7 7 7', '-1 0 1'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int a = sc.nextInt();
              int b = sc.nextInt();
              int c = sc.nextInt();
              int temp = c;
              c = b;
              b = a;
              a = temp;
              System.out.println("a = " + a + ", b = " + b + ", c = " + c);
          }
      }
    `,
    hints: ['Save one value in a temporary variable first, otherwise it is overwritten before you can move it.'],
    tags: ['variables', 'swap'],
  },
  {
    id: 'var-average', title: 'Average without Losing Decimals',
    topic: 'variables', kind: 'code', difficulty: 'Warm-up', marks: 4,
    statement: 'Read three integer marks and print their average with exactly two decimals as `Average: X`. Watch out: dividing an int sum by 3 throws the decimals away.',
    samples: [{ input: '70 85 91', output: 'Average: 82.00' }, { input: '1 2 2', output: 'Average: 1.67' }],
    tests: ['0 0 1', '100 100 99'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int a = sc.nextInt();
              int b = sc.nextInt();
              int c = sc.nextInt();
              double avg = (a + b + c) / 3.0;
              System.out.printf("Average: %.2f%n", avg);
          }
      }
    `,
    hints: ['(a + b + c) / 3 is integer division. Divide by 3.0, or cast the sum to double first.'],
    tags: ['double', 'casting', 'printf'],
  },
  {
    id: 'var-triangle-area', title: 'Triangle Area from Three Sides',
    topic: 'variables', kind: 'code', difficulty: 'Practice', marks: 5,
    statement: 'Read the three sides x, y and z of a valid triangle. With s = (x + y + z) / 2, the area is √(s(s − x)(s − y)(s − z)). Print `Area: A` with two decimals.',
    samples: [{ input: '3 4 5', output: 'Area: 6.00' }],
    tests: ['5 5 5', '7 8 9', '2.5 2.5 4'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              double x = sc.nextDouble();
              double y = sc.nextDouble();
              double z = sc.nextDouble();
              double s = (x + y + z) / 2;
              double area = Math.sqrt(s * (s - x) * (s - y) * (s - z));
              System.out.printf("Area: %.2f%n", area);
          }
      }
    `,
    hints: ['Math.sqrt(value) returns the square root as a double.'],
    tags: ['double', 'Math.sqrt', 'printf'],
  },
  {
    id: 'in-name-card', title: 'Student ID Card',
    topic: 'input', kind: 'code', difficulty: 'Practice', marks: 5,
    statement: 'Read a student ID (int) on the first line, the full name on the second line (it may contain spaces), and the CGPA (double) on the third. Print exactly:\n\n`ID: <id>`\n`Name: <name>`\n`CGPA: <cgpa with two decimals>`',
    samples: [{ input: '24101007\nNusrat Jahan Mim\n3.8', output: 'ID: 24101007\nName: Nusrat Jahan Mim\nCGPA: 3.80' }],
    tests: ['1\nA\n4', '99\nMd. Abdullah Al Mamun\n2.755'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              int id = sc.nextInt();
              sc.nextLine();
              String name = sc.nextLine();
              double cgpa = sc.nextDouble();
              System.out.println("ID: " + id);
              System.out.println("Name: " + name);
              System.out.printf("CGPA: %.2f%n", cgpa);
          }
      }
    `,
    hints: ['next() stops at the first space — use nextLine() for a full name.', 'After nextInt(), the rest of the first line (just the line break) is still waiting. Call sc.nextLine() once to throw it away before reading the name.'],
    tags: ['Scanner', 'nextLine', 'printf'],
  },
  {
    id: 'in-merge-words', title: 'Read and Combine',
    topic: 'input', kind: 'code', difficulty: 'Warm-up', marks: 3,
    statement: 'Read two words and an integer n (all on one line, separated by spaces). Print the two words joined with a hyphen, then the second word\'s length plus n.',
    samples: [{ input: 'blue sky 4', output: 'blue-sky\n7' }],
    tests: ['a b 0', 'Dhaka City -3'],
    starter: SCANNER_STARTER,
    solution: java`
      import java.util.Scanner;

      public class Main {
          public static void main(String[] args) {
              Scanner sc = new Scanner(System.in);
              String a = sc.next();
              String b = sc.next();
              int n = sc.nextInt();
              System.out.println(a + "-" + b);
              System.out.println(b.length() + n);
          }
      }
    `,
    hints: ['next() reads one word at a time, skipping spaces.'],
    tags: ['Scanner', 'next'],
  },
];
