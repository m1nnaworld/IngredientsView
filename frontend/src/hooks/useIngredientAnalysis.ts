import {useMutation} from '@tanstack/react-query';
import {ingredientsApi} from '@/api';

export function useIngredientAnalysis() {
  return useMutation({
    mutationFn: (ingredientText: string) =>
      ingredientsApi.analyzeIngredients(ingredientText).then(res => res.data),
  });
}
