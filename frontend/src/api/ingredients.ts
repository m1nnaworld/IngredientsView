import {apiClient} from './client';
import {Ingredient, Product} from '@/types';

export const ingredientsApi = {
  analyzeIngredients: (ingredientText: string) =>
    apiClient.post<{ingredients: Ingredient[]; product: Product}>('/ingredients/analyze', {
      text: ingredientText,
    }),

  getIngredient: (id: number) =>
    apiClient.get<Ingredient>(`/ingredients/${id}`),

  searchIngredients: (query: string) =>
    apiClient.get<Ingredient[]>('/ingredients/search', {params: {q: query}}),
};
