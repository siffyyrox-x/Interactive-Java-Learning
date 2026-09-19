import type { TopicId } from '../content/model';
import type { Lesson } from './types';
import { flowcharts, variables, operators, input, conditions } from './mid-a';
import { loops, nestedLoops, digits, tracing } from './mid-b';
import { strings, arrays, arrayBuild, sorting, methods, recursion } from './final';

export type { Lesson, LessonSection } from './types';

export const LESSONS: Record<TopicId, Lesson> = {
  flowcharts, variables, operators, input, conditions, loops, 'nested-loops': nestedLoops, digits, tracing,
  strings, arrays, 'array-build': arrayBuild, sorting, methods, recursion,
};
