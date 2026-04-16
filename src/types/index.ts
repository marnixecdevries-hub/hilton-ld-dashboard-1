export interface Evaluation {
  id: string;
  hotel_code: HotelCode;
  training_name: string;
  trainer_name: string;
  trainer_department: string;
  manager_name: string;
  manager_department: string;
  evaluation_date: string;
  score_work_area: number;
  score_appearance: number;
  score_body_language: number;
  score_voice: number;
  score_attention: number;
  score_preparation: number;
  score_demonstration: number;
  score_practice: number;
  score_follow_through: number;
  score_question_techniques: number;
  avg_presentation: number;
  avg_delivery: number;
  avg_coaching: number;
  avg_overall: number;
  strengths: string;
  development_areas: string;
  notes_work_area: string | null;
  notes_appearance: string | null;
  notes_body_language: string | null;
  notes_voice: string | null;
  notes_attention: string | null;
  notes_preparation: string | null;
  notes_demonstration: string | null;
  notes_practice: string | null;
  notes_follow_through: string | null;
  notes_question_techniques: string | null;
  created_at: string;
}

export type HotelCode = 'AMSCS' | 'AMSAP' | 'AMSHI' | 'AMSWA' | 'AMSHH' | 'RTMHI' | 'SPLSO' | 'ANRHI';

export type ScoreCriterion =
  | 'work_area' | 'appearance' | 'body_language' | 'voice' | 'attention'
  | 'preparation' | 'demonstration' | 'practice'
  | 'follow_through' | 'question_techniques';

export type ScoreCategory = 'presentation' | 'delivery' | 'coaching';

export interface HotelBenchmark {
  hotel_code: HotelCode;
  avg_presentation: number;
  avg_delivery: number;
  avg_coaching: number;
  avg_overall: number;
  evaluation_count: number;
}

export interface TrainerSummary {
  trainer_name: string;
  hotel_code: HotelCode;
  trainer_department: string;
  evaluation_count: number;
  latest_overall: number;
  avg_overall: number;
}

export interface ParsedEvaluation {
  hotel_code: string;
  training_name: string;
  trainer_name: string;
  trainer_department: string;
  manager_name: string;
  manager_department: string;
  evaluation_date: string;
  score_work_area: number;
  score_appearance: number;
  score_body_language: number;
  score_voice: number;
  score_attention: number;
  score_preparation: number;
  score_demonstration: number;
  score_practice: number;
  score_follow_through: number;
  score_question_techniques: number;
  strengths: string;
  development_areas: string;
  notes_work_area: string;
  notes_appearance: string;
  notes_body_language: string;
  notes_voice: string;
  notes_attention: string;
  notes_preparation: string;
  notes_demonstration: string;
  notes_practice: string;
  notes_follow_through: string;
  notes_question_techniques: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ParseResult {
  success: boolean;
  data?: ParsedEvaluation[];
  errors?: ValidationError[];
}

export interface Filters {
  hotels: HotelCode[];
  department: string;
  dateFrom: string;
  dateTo: string;
}
