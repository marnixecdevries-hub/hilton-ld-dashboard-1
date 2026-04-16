import { HotelCode, ScoreCriterion, ScoreCategory } from '@/types';

export const HOTELS: Record<HotelCode, string> = {
  AMSCS: 'Conrad Amsterdam',
  AMSAP: 'Waldorf Astoria Amsterdam',
  AMSHI: 'Hilton Amsterdam',
  AMSWA: 'DoubleTree Amsterdam Centraal Station',
  AMSHH: 'Hampton by Hilton Amsterdam',
  RTMHI: 'Hilton Rotterdam',
  SPLSO: 'Hilton Garden Inn Leiden',
  ANRHI: 'Hilton Antwerp',
};

export const HOTEL_CODES: HotelCode[] = Object.keys(HOTELS) as HotelCode[];

export const CRITERIA_LABELS: Record<ScoreCriterion, string> = {
  work_area: 'Work Area & Preparation',
  appearance: 'Trainer Appearance',
  body_language: 'Body Language',
  voice: 'Voice',
  attention: 'Attention',
  preparation: 'Preparation',
  demonstration: 'Demonstration',
  practice: 'Practice',
  follow_through: 'Follow Through',
  question_techniques: 'Question Techniques',
};

export const CATEGORY_CRITERIA: Record<ScoreCategory, ScoreCriterion[]> = {
  presentation: ['work_area', 'appearance', 'body_language', 'voice', 'attention'],
  delivery: ['preparation', 'demonstration', 'practice'],
  coaching: ['follow_through', 'question_techniques'],
};

export const CATEGORY_LABELS: Record<ScoreCategory, string> = {
  presentation: 'Presentation Skills',
  delivery: 'Training Delivery',
  coaching: 'Coaching',
};

export const SCORE_FIELDS: ScoreCriterion[] = [
  'work_area', 'appearance', 'body_language', 'voice', 'attention',
  'preparation', 'demonstration', 'practice',
  'follow_through', 'question_techniques',
];

export const COLORS = {
  hiltonBlue: '#002F61',
  hiltonBeige: '#F0E9E6',
  hiltonBlueLighter: '#1a4a7a',
  chartColors: ['#002F61', '#2563eb', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#ec4899'],
};
