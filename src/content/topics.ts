import type { Topic, TopicId } from './model';

export const TOPICS: Topic[] = [
  { id: 'flowcharts', exam: 'mid', order: 1, title: 'Flowcharts', short: 'Flowcharts', goal: 'Read any flowchart and turn it into a complete Java program.' },
  { id: 'variables', exam: 'mid', order: 2, title: 'Variables & Data Types', short: 'Variables', goal: 'Choose the right type, declare it correctly and predict every cast.' },
  { id: 'operators', exam: 'mid', order: 3, title: 'Operators & Expressions', short: 'Operators', goal: 'Evaluate any expression by hand — precedence, integer division, %, ++ and --.' },
  { id: 'input', exam: 'mid', order: 4, title: 'User Input with Scanner', short: 'Input', goal: 'Read ints, doubles, words and lines without falling into the nextLine trap.' },
  { id: 'conditions', exam: 'mid', order: 5, title: 'Decision Making', short: 'Conditions', goal: 'Turn a word problem into if / else-if / switch logic that handles every case.' },
  { id: 'loops', exam: 'mid', order: 6, title: 'Loops', short: 'Loops', goal: 'Write while, do-while and for loops, and control them with break and continue.' },
  { id: 'nested-loops', exam: 'mid', order: 7, title: 'Nested Loops & Patterns', short: 'Nested loops', goal: 'Reason about an inner loop that restarts for every outer iteration.' },
  { id: 'digits', exam: 'mid', order: 8, title: 'Digit Processing & Checksums', short: 'Digits', goal: 'Peel digits with % and /, rebuild numbers, and solve checksum problems.' },
  { id: 'tracing', exam: 'mid', order: 9, title: 'Tracing & Trace Tables', short: 'Tracing', goal: 'Fill an exam trace table with one row per iteration and the exact output.' },
  { id: 'strings', exam: 'final', order: 10, title: 'Strings', short: 'Strings', goal: 'Scan, compare and build Strings character by character.' },
  { id: 'arrays', exam: 'final', order: 11, title: 'Arrays', short: 'Arrays', goal: 'Create, traverse, search and aggregate arrays — and understand references.' },
  { id: 'array-build', exam: 'final', order: 12, title: 'Building New Arrays', short: 'Array building', goal: 'Filter, partition, rotate and de-duplicate into a new array while keeping order.' },
  { id: 'sorting', exam: 'final', order: 13, title: 'Sorting & Searching', short: 'Sorting', goal: 'Trace and write selection sort and bubble sort, and search an array.' },
  { id: 'methods', exam: 'final', order: 14, title: 'Methods', short: 'Methods', goal: 'Split a problem into methods with parameters and return values.' },
  { id: 'recursion', exam: 'final', order: 15, title: 'Recursion & Recursion Tracing', short: 'Recursion', goal: 'Trace a call stack down to the base case and back up, in exact output order.' },
];

export const topicById = (id: TopicId) => TOPICS.find(t => t.id === id)!;
export const MID_TOPICS = TOPICS.filter(t => t.exam === 'mid');
export const FINAL_TOPICS = TOPICS.filter(t => t.exam === 'final');
