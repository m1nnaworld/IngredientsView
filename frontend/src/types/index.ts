export * from './navigation';

export interface Ingredient {
  id: number;
  name: string;
  nameKo: string;
  description: string;
  rating: 'good' | 'neutral' | 'caution' | 'bad';
  functions: string[];
}

export interface Product {
  id: number;
  name: string;
  brand: string;
  category: string;
  imageUrl?: string;
  ingredients: Ingredient[];
  overallRating: number;
  analyzedAt: string;
}

export interface Routine {
  id: number;
  name: string;
  steps: RoutineStep[];
  createdAt: string;
}

export interface RoutineStep {
  order: number;
  product: Product;
  timeOfDay: 'morning' | 'evening' | 'both';
}

export interface User {
  id: number;
  email: string;
  nickname: string;
  skinType?: 'dry' | 'oily' | 'combination' | 'sensitive' | 'normal';
  skinConcerns?: string[];
}
