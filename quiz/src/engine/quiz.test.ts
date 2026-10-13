import { describe, expect, it } from 'vitest';
import { QUESTIONS } from '../data/questions';
import { isCorrect, pickQuestions, scorePercent, shuffleOptions, wrongQuestions } from './quiz';

describe('questions data', () => {
  it('is well formed', () => {
    for (const q of QUESTIONS) {
      expect(q.text.length).toBeGreaterThan(0);
      expect(q.explanation.length).toBeGreaterThan(0);
      if (q.type === 'choice') {
        expect(q.options).toHaveLength(4);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(4);
      }
    }
  });
});

describe('engine', () => {
  it('shuffleOptions keeps the correct answer', () => {
    for (const q of QUESTIONS.filter((x) => x.type === 'choice')) {
      const s = shuffleOptions(q);
      if (s.type === 'choice' && q.type === 'choice') {
        expect(s.options[s.answer]).toBe(q.options[q.answer]);
      }
    }
  });

  it('pickQuestions respects count and topic', () => {
    expect(pickQuestions(5)).toHaveLength(5);
    const qs = pickQuestions(50, 'מדעים');
    expect(qs.length).toBeGreaterThan(0);
    expect(qs.every((q) => q.topic === 'מדעים')).toBe(true);
  });

  it('grades and collects wrong answers', () => {
    const tf = QUESTIONS.find((q) => q.type === 'tf')!;
    expect(isCorrect(tf, tf.answer)).toBe(true);
    expect(isCorrect(tf, !tf.answer)).toBe(false);
    expect(wrongQuestions([tf, tf], [tf.answer, !tf.answer])).toHaveLength(1);
  });

  it('scorePercent', () => {
    expect(scorePercent(0, 0)).toBe(0);
    expect(scorePercent(7, 10)).toBe(70);
    expect(scorePercent(1, 3)).toBe(33);
  });
});
