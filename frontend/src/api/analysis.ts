import { apiClient } from './client';

export interface AnalysisIngredient {
  ingredientId: number;
  name: string;
  nameKo: string;
  ewgScoreMin: number | null;
  ewgScoreMax: number | null;
  functions: string[];
  concerns: string[];
  categories: { key: string; name: string }[];
  fromProduct: { id: number; name: string };
  order: number;
}

export interface AnalysisConflict {
  type: 'direct' | 'category';
  interactionType: 'conflict' | 'synergy' | 'caution';
  severity: number;
  reason: string;
  ingredientA: { id: number; name: string; nameKo: string };
  ingredientB: { id: number; name: string; nameKo: string };
  productA: { id: number; name: string };
  productB: { id: number; name: string };
  timeOfDay?: string | null;
}

export interface DuplicateIngredient {
  ingredient: { id: number; name: string; nameKo: string };
  foundInProducts: { id: number; name: string }[];
}

export interface ExpertTip {
  id: string;
  type: 'success' | 'tip' | 'warning';
  message: string;
}

export interface RoutineAnalysisResult {
  score: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  summary: string;
  ingredients: AnalysisIngredient[];
  duplicates: DuplicateIngredient[];
  expertTips: ExpertTip[];
  conflicts: AnalysisConflict[];
  synergies: AnalysisConflict[];
  cautions: AnalysisConflict[];
  scoreBreakdown: {
    base: number;
    ewgPenalty: number;
    conflictPenalty: number;
    synergyBonus: number;
    final: number;
  };
}

export const analyzeRoutine = async (productIds: number[]): Promise<RoutineAnalysisResult> => {
  const { data } = await apiClient.post<RoutineAnalysisResult>('/analysis/routine', { productIds });
  return data;
};
