import { Evaluation, ScoreCriterion, ParsedEvaluation } from '@/types';
import { CATEGORY_CRITERIA } from './constants';

export function computeAverages(data: ParsedEvaluation) {
  const presentationScores = CATEGORY_CRITERIA.presentation.map(c => data[`score_${c}` as keyof ParsedEvaluation] as number);
  const deliveryScores = CATEGORY_CRITERIA.delivery.map(c => data[`score_${c}` as keyof ParsedEvaluation] as number);
  const coachingScores = CATEGORY_CRITERIA.coaching.map(c => data[`score_${c}` as keyof ParsedEvaluation] as number);

  const avg = (arr: number[]) => Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2));

  return {
    avg_presentation: avg(presentationScores),
    avg_delivery: avg(deliveryScores),
    avg_coaching: avg(coachingScores),
    avg_overall: avg([...presentationScores, ...deliveryScores, ...coachingScores]),
  };
}

export function getScoreColor(score: number): string {
  if (score < 2.0) return 'bg-red-500 text-white';
  if (score < 3.0) return 'bg-orange-400 text-white';
  if (score < 3.5) return 'bg-yellow-300 text-gray-900';
  if (score < 4.0) return 'bg-yellow-100 text-gray-900';
  if (score < 4.5) return 'bg-green-200 text-gray-900';
  return 'bg-green-500 text-white';
}

export function getScoreBgHex(score: number): string {
  if (score < 2.0) return '#ef4444';
  if (score < 3.0) return '#fb923c';
  if (score < 3.5) return '#fde047';
  if (score < 4.0) return '#fef9c3';
  if (score < 4.5) return '#bbf7d0';
  return '#22c55e';
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function getScoreForCriterion(evaluation: Evaluation, criterion: ScoreCriterion): number {
  return evaluation[`score_${criterion}` as keyof Evaluation] as number;
}
