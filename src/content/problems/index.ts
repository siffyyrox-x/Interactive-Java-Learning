import type { Problem, TopicId } from '../model';
import { flowchartProblems } from './mid-flowcharts';
import { digitProblems } from './mid-digits';
import { tracingProblems } from './mid-tracing';
import { stringProblems, arrayProblems, arrayBuildProblems, sortingProblems, methodProblems, recursionProblems } from './final';
import { conditionProblems, loopProblems, nestedLoopProblems, operatorProblems } from './mid-scenarios';

export const PROBLEMS: Problem[] = [
  ...flowchartProblems,
  ...digitProblems,
  ...tracingProblems,
  ...conditionProblems,
  ...loopProblems,
  ...nestedLoopProblems,
  ...operatorProblems,
  ...stringProblems,
  ...arrayProblems,
  ...arrayBuildProblems,
  ...sortingProblems,
  ...methodProblems,
  ...recursionProblems,
];

export const problemById = (id: string) => PROBLEMS.find(p => p.id === id);
export const problemsForTopic = (t: TopicId) => PROBLEMS.filter(p => p.topic === t);
