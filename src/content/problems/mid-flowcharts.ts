import { java, PLAIN_STARTER, type Problem, type FlowItem } from '../model';

/**
 * The shape shared by the midterm "two options" flowcharts: try option A, else try option B,
 * else report the shortage. Each node lists fragments of the reference Java it corresponds to,
 * so the flowchart can light up in sync with the running code ("#2" = second occurrence).
 */
function twoOption(o: {
  init: string; initCode: string[];
  costA: string[]; costACode: string[]; cond: string;
  yesA: string; yesACode: string; leftA: string; leftACode: string; printLeft: string;
  costB: string[]; costBCode: string[];
  yesB: string; yesBCode: string;
  shortage: string; shortageCode: string; noMsg: string; noMsgCode: string; printShort: string;
}): FlowItem[] {
  return [
    { kind: 'start', text: 'START' },
    { kind: 'process', text: o.init, code: o.initCode },
    { kind: 'process', text: o.costA.join('\n'), code: o.costACode },
    {
      kind: 'decision', text: o.cond, code: [o.cond.replace('?', '') + '#1'],
      yes: [
        { kind: 'io', text: `PRINT "${o.yesA}"`, code: [o.yesACode] },
        { kind: 'process', text: o.leftA, code: [o.leftACode + '#1'] },
        { kind: 'io', text: `PRINT ${o.printLeft}`, code: [`System.out.println(${o.printLeft})#1`] },
      ],
      no: [
        { kind: 'process', text: o.costB.join('\n'), code: o.costBCode },
        {
          kind: 'decision', text: o.cond, code: [o.cond.replace('?', '') + '#2'],
          yes: [
            { kind: 'io', text: `PRINT "${o.yesB}"`, code: [o.yesBCode] },
            { kind: 'process', text: o.leftA, code: [o.leftACode + '#2'] },
            { kind: 'io', text: `PRINT ${o.printLeft}`, code: [`System.out.println(${o.printLeft})#2`] },
          ],
          no: [
            { kind: 'process', text: o.shortage, code: [o.shortageCode] },
            { kind: 'io', text: `PRINT "${o.noMsg}"`, code: [o.noMsgCode] },
            { kind: 'io', text: `PRINT ${o.printShort}`, code: [`System.out.println(${o.printShort})`] },
          ],
        },
      ],
    },
    { kind: 'end', text: 'END' },
  ];
}

const FLOW_HINTS = [
  'Every rectangle at the top becomes a variable declaration. Anything that can hold a decimal (prices after a discount, rates, costs) should be a double.',
  'Each diamond is an if. The TRUE arrow is the if-block; the FALSE arrow is the else-block. The second diamond sits inside the first else.',
  'Follow the arrows in order and write one statement per box. PRINT boxes become System.out.println(...).',
];

export const flowchartProblems: Problem[] = [
  {
    id: 'fc-laptop',
    title: 'Laptop Purchase Decision',
    topic: 'flowcharts', kind: 'flowchart', difficulty: 'Exam', marks: 10,
    statement: 'Implement a complete Java program from the flowchart. Use `double` where a decimal result is possible. The program takes no input — every value is given in the flowchart.',
    flowchart: twoOption({
      init: 'savings = 85000\nstudent_discount = 0.08\nmodel_A_price = 92000\nmodel_B_price = 76000\naccessories = 4500',
      initCode: ['double savings', 'double student_discount', 'double model_A_price', 'double model_B_price', 'double accessories'],
      costA: ['final_cost = model_A_price *', '(1 - student_discount) + accessories'], costACode: ['double final_cost = model_A_price'],
      cond: 'final_cost <= savings?',
      yesA: 'Buy Model A', yesACode: '"Buy Model A"', leftA: 'balance = savings - final_cost', leftACode: 'balance = savings - final_cost', printLeft: 'balance',
      costB: ['final_cost = model_B_price *', '(1 - student_discount) + accessories'], costBCode: ['final_cost = model_B_price'],
      yesB: 'Buy Model B', yesBCode: '"Buy Model B"',
      shortage: 'shortage = final_cost - savings', shortageCode: 'shortage = final_cost - savings', noMsg: 'Save more', noMsgCode: '"Save more"', printShort: 'shortage',
    }),
    starter: PLAIN_STARTER,
    solution: java`
      public class Main {
          public static void main(String[] args) {
              double savings = 85000;
              double student_discount = 0.08;
              double model_A_price = 92000;
              double model_B_price = 76000;
              double accessories = 4500;

              double final_cost = model_A_price * (1 - student_discount) + accessories;
              if (final_cost <= savings) {
                  System.out.println("Buy Model A");
                  double balance = savings - final_cost;
                  System.out.println(balance);
              } else {
                  final_cost = model_B_price * (1 - student_discount) + accessories;
                  if (final_cost <= savings) {
                      System.out.println("Buy Model B");
                      double balance = savings - final_cost;
                      System.out.println(balance);
                  } else {
                      double shortage = final_cost - savings;
                      System.out.println("Save more");
                      System.out.println(shortage);
                  }
              }
          }
      }
    `,
    hints: FLOW_HINTS,
    plan: ['Declare the five given values as doubles.', 'Compute final_cost for Model A.', 'if final_cost <= savings: print, compute balance, print it.', 'else: recompute final_cost for Model B and repeat the same check inside the else.', 'If Model B also fails, compute and print the shortage.'],
    tags: ['flowchart', 'nested if', 'double'],
  },
  {
    id: 'fc-catering',
    title: 'Catering Package Selection',
    topic: 'flowcharts', kind: 'flowchart', difficulty: 'Exam', marks: 10,
    statement: 'Implement a complete Java program from the flowchart. Use `double` where a decimal result is possible.',
    flowchart: [
      { kind: 'start', text: 'START' },
      { kind: 'process', text: 'budget = 36000\nguests = 48\ndeluxe_plate = 850\nstandard_plate = 620\nhall_charge = 4500\nservice_rate = 0.05', code: ['double budget', 'int guests', 'double deluxe_plate', 'double standard_plate', 'double hall_charge', 'double service_rate'] },
      { kind: 'process', text: 'cost = guests * deluxe_plate + hall_charge\ntotal = cost + cost * service_rate', code: ['double cost = guests * deluxe_plate', 'double total = cost + cost * service_rate'] },
      {
        kind: 'decision', text: 'total <= budget?', code: ['total <= budget#1'],
        yes: [
          { kind: 'io', text: 'PRINT "Choose Deluxe"', code: ['"Choose Deluxe"'] },
          { kind: 'process', text: 'remaining = budget - total', code: ['remaining = budget - total#1'] },
          { kind: 'io', text: 'PRINT remaining', code: ['System.out.println(remaining)#1'] },
        ],
        no: [
          { kind: 'process', text: 'cost = guests * standard_plate + hall_charge\ntotal = cost + cost * service_rate', code: ['cost = guests * standard_plate', 'total = cost + cost * service_rate#2'] },
          {
            kind: 'decision', text: 'total <= budget?', code: ['total <= budget#2'],
            yes: [
              { kind: 'io', text: 'PRINT "Choose Standard"', code: ['"Choose Standard"'] },
              { kind: 'process', text: 'remaining = budget - total', code: ['remaining = budget - total#2'] },
              { kind: 'io', text: 'PRINT remaining', code: ['System.out.println(remaining)#2'] },
            ],
            no: [
              { kind: 'process', text: 'shortage = total - budget', code: ['shortage = total - budget'] },
              { kind: 'io', text: 'PRINT "Reduce the guest list"', code: ['"Reduce the guest list"'] },
              { kind: 'io', text: 'PRINT shortage', code: ['System.out.println(shortage)'] },
            ],
          },
        ],
      },
      { kind: 'end', text: 'END' },
    ],
    starter: PLAIN_STARTER,
    solution: java`
      public class Main {
          public static void main(String[] args) {
              double budget = 36000;
              int guests = 48;
              double deluxe_plate = 850;
              double standard_plate = 620;
              double hall_charge = 4500;
              double service_rate = 0.05;

              double cost = guests * deluxe_plate + hall_charge;
              double total = cost + cost * service_rate;
              if (total <= budget) {
                  System.out.println("Choose Deluxe");
                  double remaining = budget - total;
                  System.out.println(remaining);
              } else {
                  cost = guests * standard_plate + hall_charge;
                  total = cost + cost * service_rate;
                  if (total <= budget) {
                      System.out.println("Choose Standard");
                      double remaining = budget - total;
                      System.out.println(remaining);
                  } else {
                      double shortage = total - budget;
                      System.out.println("Reduce the guest list");
                      System.out.println(shortage);
                  }
              }
          }
      }
    `,
    hints: FLOW_HINTS,
    tags: ['flowchart', 'nested if', 'double'],
  },
  {
    id: 'fc-course-bundle',
    title: 'Course Bundle Selection',
    topic: 'flowcharts', kind: 'flowchart', difficulty: 'Exam', marks: 10,
    statement: 'Implement a complete Java program from the flowchart. Use `double` where a decimal result is possible.',
    flowchart: twoOption({
      init: 'wallet = 18000\ncourses = 4\nadvanced_fee = 4800\nbasic_fee = 3200\nregistration = 1200\nadvanced_discount = 0.10\nbasic_discount = 0.05',
      initCode: ['double wallet', 'int courses', 'double advanced_fee', 'double basic_fee', 'double registration', 'double advanced_discount', 'double basic_discount'],
      costA: ['cost = courses * advanced_fee + registration', 'cost = cost - cost * advanced_discount'], costACode: ['double cost = courses * advanced_fee', 'cost = cost - cost * advanced_discount'],
      cond: 'cost <= wallet?',
      yesA: 'Choose Advanced Bundle', yesACode: '"Choose Advanced Bundle"', leftA: 'balance = wallet - cost', leftACode: 'balance = wallet - cost', printLeft: 'balance',
      costB: ['cost = courses * basic_fee + registration', 'cost = cost - cost * basic_discount'], costBCode: ['cost = courses * basic_fee', 'cost = cost - cost * basic_discount'],
      yesB: 'Choose Basic Bundle', yesBCode: '"Choose Basic Bundle"',
      shortage: 'shortage = cost - wallet', shortageCode: 'shortage = cost - wallet', noMsg: 'Take fewer courses', noMsgCode: '"Take fewer courses"', printShort: 'shortage',
    }),
    starter: PLAIN_STARTER,
    solution: java`
      public class Main {
          public static void main(String[] args) {
              double wallet = 18000;
              int courses = 4;
              double advanced_fee = 4800;
              double basic_fee = 3200;
              double registration = 1200;
              double advanced_discount = 0.10;
              double basic_discount = 0.05;

              double cost = courses * advanced_fee + registration;
              cost = cost - cost * advanced_discount;
              if (cost <= wallet) {
                  System.out.println("Choose Advanced Bundle");
                  double balance = wallet - cost;
                  System.out.println(balance);
              } else {
                  cost = courses * basic_fee + registration;
                  cost = cost - cost * basic_discount;
                  if (cost <= wallet) {
                      System.out.println("Choose Basic Bundle");
                      double balance = wallet - cost;
                      System.out.println(balance);
                  } else {
                      double shortage = cost - wallet;
                      System.out.println("Take fewer courses");
                      System.out.println(shortage);
                  }
              }
          }
      }
    `,
    hints: FLOW_HINTS,
    tags: ['flowchart', 'nested if', 'double'],
  },
  {
    id: 'fc-delivery',
    title: 'Delivery Service Decision',
    topic: 'flowcharts', kind: 'flowchart', difficulty: 'Exam', marks: 10,
    statement: 'Implement a complete Java program from the flowchart. Use `double` where a decimal result is possible.',
    flowchart: twoOption({
      init: 'balance = 2500\ndistance = 18\nexpress_base = 700\nexpress_per_km = 120\nregular_base = 350\nregular_per_km = 75\ncoupon = 300',
      initCode: ['double balance', 'int distance', 'double express_base', 'double express_per_km', 'double regular_base', 'double regular_per_km', 'double coupon'],
      costA: ['cost = express_base + distance * express_per_km', 'cost = cost - coupon'], costACode: ['double cost = express_base', 'cost = cost - coupon#1'],
      cond: 'cost <= balance?',
      yesA: 'Use Express Delivery', yesACode: '"Use Express Delivery"', leftA: 'money_left = balance - cost', leftACode: 'money_left = balance - cost', printLeft: 'money_left',
      costB: ['cost = regular_base + distance * regular_per_km', 'cost = cost - coupon'], costBCode: ['cost = regular_base', 'cost = cost - coupon#2'],
      yesB: 'Use Regular Delivery', yesBCode: '"Use Regular Delivery"',
      shortage: 'shortage = cost - balance', shortageCode: 'shortage = cost - balance', noMsg: 'Collect from the shop', noMsgCode: '"Collect from the shop"', printShort: 'shortage',
    }),
    starter: PLAIN_STARTER,
    solution: java`
      public class Main {
          public static void main(String[] args) {
              double balance = 2500;
              int distance = 18;
              double express_base = 700;
              double express_per_km = 120;
              double regular_base = 350;
              double regular_per_km = 75;
              double coupon = 300;

              double cost = express_base + distance * express_per_km;
              cost = cost - coupon;
              if (cost <= balance) {
                  System.out.println("Use Express Delivery");
                  double money_left = balance - cost;
                  System.out.println(money_left);
              } else {
                  cost = regular_base + distance * regular_per_km;
                  cost = cost - coupon;
                  if (cost <= balance) {
                      System.out.println("Use Regular Delivery");
                      double money_left = balance - cost;
                      System.out.println(money_left);
                  } else {
                      double shortage = cost - balance;
                      System.out.println("Collect from the shop");
                      System.out.println(shortage);
                  }
              }
          }
      }
    `,
    hints: FLOW_HINTS,
    tags: ['flowchart', 'nested if', 'double'],
  },
  {
    id: 'fc-printing',
    title: 'Printing Package Selection',
    topic: 'flowcharts', kind: 'flowchart', difficulty: 'Exam', marks: 10,
    statement: 'Implement a complete Java program from the flowchart. Use `double` where a decimal result is possible.',
    flowchart: twoOption({
      init: 'budget = 5200\npages = 650\ncolor_rate = 8\nbw_rate = 3\nbinding = 350\ndiscount_rate = 0.10',
      initCode: ['double budget', 'int pages', 'double color_rate', 'double bw_rate', 'double binding', 'double discount_rate'],
      costA: ['cost = pages * color_rate + binding', 'cost = cost - cost * discount_rate'], costACode: ['double cost = pages * color_rate', 'cost = cost - cost * discount_rate#1'],
      cond: 'cost <= budget?',
      yesA: 'Print in Color', yesACode: '"Print in Color"', leftA: 'remaining = budget - cost', leftACode: 'remaining = budget - cost', printLeft: 'remaining',
      costB: ['cost = pages * bw_rate + binding', 'cost = cost - cost * discount_rate'], costBCode: ['cost = pages * bw_rate', 'cost = cost - cost * discount_rate#2'],
      yesB: 'Print in Black and White', yesBCode: '"Print in Black and White"',
      shortage: 'shortage = cost - budget', shortageCode: 'shortage = cost - budget', noMsg: 'Print fewer pages', noMsgCode: '"Print fewer pages"', printShort: 'shortage',
    }),
    starter: PLAIN_STARTER,
    solution: java`
      public class Main {
          public static void main(String[] args) {
              double budget = 5200;
              int pages = 650;
              double color_rate = 8;
              double bw_rate = 3;
              double binding = 350;
              double discount_rate = 0.10;

              double cost = pages * color_rate + binding;
              cost = cost - cost * discount_rate;
              if (cost <= budget) {
                  System.out.println("Print in Color");
                  double remaining = budget - cost;
                  System.out.println(remaining);
              } else {
                  cost = pages * bw_rate + binding;
                  cost = cost - cost * discount_rate;
                  if (cost <= budget) {
                      System.out.println("Print in Black and White");
                      double remaining = budget - cost;
                      System.out.println(remaining);
                  } else {
                      double shortage = cost - budget;
                      System.out.println("Print fewer pages");
                      System.out.println(shortage);
                  }
              }
          }
      }
    `,
    hints: FLOW_HINTS,
    tags: ['flowchart', 'nested if', 'double'],
  },
  {
    id: 'fc-family-trip',
    title: 'Family Trip Decision',
    topic: 'flowcharts', kind: 'flowchart', difficulty: 'Exam', marks: 10,
    statement: 'Implement a Java program from the flowchart. Rooms are shared by two people, so `(member + 1) / 2.0` rooms are needed. Notice the `2.0` — it forces a decimal division.',
    flowchart: [
      { kind: 'start', text: 'START' },
      { kind: 'process', text: 'saved_money = 21000\nmember = 7\nsajek_double_bedroom_price = 8000\nsrimangal_double_bedroom_price = 5000\ntrip_cost = 0.0', code: ['int saved_money', 'int member', 'int sajek_double_bedroom_price', 'int srimangal_double_bedroom_price', 'double trip_cost = 0.0'] },
      { kind: 'process', text: 'trip_cost = ((member + 1) / 2.0)\n* sajek_double_bedroom_price', code: ['/ 2.0) * sajek_double_bedroom_price'] },
      {
        kind: 'decision', text: 'trip_cost <= saved_money?', code: ['trip_cost <= saved_money#1'],
        yes: [
          { kind: 'io', text: 'PRINT "We are going to Sajek."', code: ['"We are going to Sajek."'] },
          { kind: 'process', text: 'money_left = saved_money - trip_cost\neach_share = money_left / member', code: ['money_left = saved_money - trip_cost#1', 'each_share = money_left / member#1'] },
          { kind: 'io', text: 'PRINT each_share', code: ['System.out.println(each_share)#1'] },
        ],
        no: [
          { kind: 'process', text: 'trip_cost = ((member + 1) / 2.0)\n* srimangal_double_bedroom_price', code: ['/ 2.0) * srimangal_double_bedroom_price'] },
          {
            kind: 'decision', text: 'trip_cost <= saved_money?', code: ['trip_cost <= saved_money#2'],
            yes: [
              { kind: 'io', text: 'PRINT "We are going to Shrimangal."', code: ['"We are going to Shrimangal."'] },
              { kind: 'process', text: 'money_left = saved_money - trip_cost\neach_share = money_left / member', code: ['money_left = saved_money - trip_cost#2', 'each_share = money_left / member#2'] },
              { kind: 'io', text: 'PRINT each_share', code: ['System.out.println(each_share)#2'] },
            ],
            no: [
              { kind: 'io', text: 'PRINT "I have to save more money\nto afford a family trip."', code: ['"I have to save more money to afford a family trip."'] },
            ],
          },
        ],
      },
      { kind: 'end', text: 'END' },
    ],
    starter: PLAIN_STARTER,
    solution: java`
      public class Main {
          public static void main(String[] args) {
              int saved_money = 21000;
              int member = 7;
              int sajek_double_bedroom_price = 8000;
              int srimangal_double_bedroom_price = 5000;
              double trip_cost = 0.0;

              trip_cost = ((member + 1) / 2.0) * sajek_double_bedroom_price;
              if (trip_cost <= saved_money) {
                  System.out.println("We are going to Sajek.");
                  double money_left = saved_money - trip_cost;
                  double each_share = money_left / member;
                  System.out.println(each_share);
              } else {
                  trip_cost = ((member + 1) / 2.0) * srimangal_double_bedroom_price;
                  if (trip_cost <= saved_money) {
                      System.out.println("We are going to Shrimangal.");
                      double money_left = saved_money - trip_cost;
                      double each_share = money_left / member;
                      System.out.println(each_share);
                  } else {
                      System.out.println("I have to save more money to afford a family trip.");
                  }
              }
          }
      }
    `,
    hints: ['(member + 1) / 2.0 gives 4.0 rooms for 7 people. With 2 instead of 2.0 the division would be integer division — still 4 here, but a different member count would break it.', ...FLOW_HINTS.slice(1)],
    tags: ['flowchart', 'nested if', 'double', 'integer division'],
  },
  {
    id: 'fc-hostel-meal',
    title: 'Hostel Meal Plan',
    topic: 'flowcharts', kind: 'flowchart', difficulty: 'Exam', marks: 10,
    statement: 'Implement the flowchart as a Java program. This time neither plan is affordable, so trace carefully which boxes actually run.',
    flowchart: twoOption({
      init: 'allowance = 7400\ndays = 30\npremium_meal = 290\nregular_meal = 250\nservice_fee = 450\nsubsidy = 0.03',
      initCode: ['double allowance', 'int days', 'double premium_meal', 'double regular_meal', 'double service_fee', 'double subsidy'],
      costA: ['plan_cost = days * premium_meal + service_fee', 'plan_cost = plan_cost - plan_cost * subsidy'], costACode: ['double plan_cost = days * premium_meal', 'plan_cost = plan_cost - plan_cost * subsidy#1'],
      cond: 'plan_cost <= allowance?',
      yesA: 'Take the Premium Plan', yesACode: '"Take the Premium Plan"', leftA: 'left_over = allowance - plan_cost', leftACode: 'left_over = allowance - plan_cost', printLeft: 'left_over',
      costB: ['plan_cost = days * regular_meal + service_fee', 'plan_cost = plan_cost - plan_cost * subsidy'], costBCode: ['plan_cost = days * regular_meal', 'plan_cost = plan_cost - plan_cost * subsidy#2'],
      yesB: 'Take the Regular Plan', yesBCode: '"Take the Regular Plan"',
      shortage: 'shortage = plan_cost - allowance', shortageCode: 'shortage = plan_cost - allowance', noMsg: 'Cook at home', noMsgCode: '"Cook at home"', printShort: 'shortage',
    }),
    starter: PLAIN_STARTER,
    solution: java`
      public class Main {
          public static void main(String[] args) {
              double allowance = 7400;
              int days = 30;
              double premium_meal = 290;
              double regular_meal = 250;
              double service_fee = 450;
              double subsidy = 0.03;

              double plan_cost = days * premium_meal + service_fee;
              plan_cost = plan_cost - plan_cost * subsidy;
              if (plan_cost <= allowance) {
                  System.out.println("Take the Premium Plan");
                  double left_over = allowance - plan_cost;
                  System.out.println(left_over);
              } else {
                  plan_cost = days * regular_meal + service_fee;
                  plan_cost = plan_cost - plan_cost * subsidy;
                  if (plan_cost <= allowance) {
                      System.out.println("Take the Regular Plan");
                      double left_over = allowance - plan_cost;
                      System.out.println(left_over);
                  } else {
                      double shortage = plan_cost - allowance;
                      System.out.println("Cook at home");
                      System.out.println(shortage);
                  }
              }
          }
      }
    `,
    hints: FLOW_HINTS,
    tags: ['flowchart', 'nested if', 'double'],
  },
  {
    id: 'fc-savings-loop',
    title: 'Savings Goal (loop flowchart)',
    topic: 'flowcharts', kind: 'flowchart', difficulty: 'Exam', marks: 10,
    statement: 'Some flowcharts contain a loop: an arrow that goes back up to a decision. Implement this one with a `while` loop. The program prints the balance at the end of every month until the goal is reached, then the number of months.',
    flowchart: [
      { kind: 'start', text: 'START' },
      { kind: 'process', text: 'balance = 2000\ngoal = 5000\nmonthly_saving = 600\nrate = 0.02\nmonths = 0', code: ['double balance', 'double goal', 'double monthly_saving', 'double rate', 'int months'] },
      {
        kind: 'loop', text: 'balance < goal?', code: ['while (balance < goal)'],
        body: [
          { kind: 'process', text: 'balance = balance + balance * rate\nbalance = balance + monthly_saving\nmonths = months + 1', code: ['balance = balance + balance * rate', 'balance = balance + monthly_saving', 'months = months + 1'] },
          { kind: 'io', text: 'PRINT months, balance', code: ['System.out.println("Month "'] },
        ],
      },
      { kind: 'io', text: 'PRINT "Goal reached in", months', code: ['"Goal reached in "'] },
      { kind: 'end', text: 'END' },
    ],
    starter: PLAIN_STARTER,
    solution: java`
      public class Main {
          public static void main(String[] args) {
              double balance = 2000;
              double goal = 5000;
              double monthly_saving = 600;
              double rate = 0.02;
              int months = 0;

              while (balance < goal) {
                  balance = balance + balance * rate;
                  balance = balance + monthly_saving;
                  months = months + 1;
                  System.out.println("Month " + months + ": " + balance);
              }
              System.out.println("Goal reached in " + months + " months");
          }
      }
    `,
    hints: [
      'The diamond with an arrow coming back into it is a loop condition, not an if. It becomes while (balance < goal).',
      'Everything on the loop path (the boxes the back-arrow comes from) goes inside the while block, in order.',
      'The FALSE arrow leaves the loop — the final PRINT goes after the closing brace. Print exactly: Month 1: <balance> then Goal reached in <months> months.',
    ],
    tags: ['flowchart', 'while', 'double'],
  },
];
