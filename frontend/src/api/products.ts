import { apiClient } from './client';

export interface ProductSearchResult {
  id: number;
  name: string;
  brand: string;
  imageUrl: string;
  oliveyoungId: string;
  rawIngredientText: string;
  productIngredients: { ingredientId: number; ingredientOrder: number }[];
}

export const searchProducts = async (keyword: string): Promise<ProductSearchResult[]> => {
  // 크롤링 포함으로 최대 30초 타임아웃
  const { data } = await apiClient.get('/products/search', {
    params: { q: keyword },
    timeout: 30000,
  });
  return data;
};

export const getProductByBarcode = async (barcode: string): Promise<ProductSearchResult | null> => {
  const { data } = await apiClient.get(`/products/barcode/${barcode}`, {
    timeout: 30000,
  });
  return data?.id ? data : null;
};
