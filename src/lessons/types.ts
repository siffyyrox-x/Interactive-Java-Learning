import type { ReactNode } from 'react';
import type { TopicId } from '../content/model';

export interface LessonSection { id: string; title: string; body: () => ReactNode }
export interface Lesson { topic: TopicId; intro: string; sections: LessonSection[] }
