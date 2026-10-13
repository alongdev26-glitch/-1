import { QUESTIONS, type Question, type Topic } from '../data/questions';

export type Answer = number | boolean;

export function shuffle<T>(arr: readonly T[], rnd: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Shuffle the options of a multiple-choice question, keeping the correct index right. */
export function shuffleOptions(q: Question, rnd: () => number = Math.random): Question {
  if (q.type !== 'choice') return q;
  const order = shuffle(q.options.map((_, i) => i), rnd);
  return { ...q, options: order.map((i) => q.options[i]!), answer: order.indexOf(q.answer) };
}

export function pickQuestions(
  count: number,
  topic: Topic | 'all' = 'all',
  rnd: () => number = Math.random,
  pool: readonly Question[] = QUESTIONS,
): Question[] {
  const filtered = topic === 'all' ? pool : pool.filter((q) => q.topic === topic);
  return shuffle(filtered, rnd).slice(0, count).map((q) => shuffleOptions(q, rnd));
}

export function isCorrect(q: Question, a: Answer): boolean {
  return q.answer === a;
}

export function scorePercent(correct: number, total: number): number {
  return total === 0 ? 0 : Math.round((correct / total) * 100);
}

export function wrongQuestions(questions: readonly Question[], answers: readonly Answer[]): Question[] {
  return questions.filter((q, i) => answers[i] !== undefined && !isCorrect(q, answers[i]!));
}

export function gradeMessage(pct: number): string {
  if (pct === 100) return 'מושלם! 🏆';
  if (pct >= 80) return 'כל הכבוד! 🎉';
  if (pct >= 60) return 'לא רע, אפשר לשפר 👍';
  return 'כדאי לתרגל עוד קצת 💪';
}
