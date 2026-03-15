import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Product } from '../product/entities/product.entity';
import { ProductIngredient } from '../product/entities/productIngredient.entity';
import { Ingredient } from '../ingredients/entities/ingredient.entity';
import { CategoryInteraction } from '../ingredients/entities/categoryInteraction.entity';
import { IngredientInteraction } from '../ingredients/entities/ingredientInteraction.entity';

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

export interface IngredientCombination {
  type: 'conflict' | 'synergy' | 'caution';
  severity: number;
  reason: string;
  source: string;
  ingredientA: { id: number; name: string; nameKo: string };
  ingredientB: { id: number; name: string; nameKo: string };
  productA: { id: number; name: string } | null;
  productB: { id: number; name: string } | null;
}

export interface IngredientCombinationResult {
  combinations: IngredientCombination[];
  summary: { conflict: number; synergy: number; caution: number; total: number };
}

// ── Expert Tip 규칙 ─────────────────────────────────────────
interface TipRule {
  id: string;
  type: 'success' | 'tip' | 'warning';
  priority: number;
  requiredCategories: string[];
  forbiddenCategories?: string[];
  message: string;
}

const TIP_RULES: TipRule[] = [
  {
    id: 'vitamin_c_sunscreen',
    type: 'success',
    priority: 10,
    requiredCategories: ['vitamin_c', 'sunscreen'],
    message: '비타민 C는 아침에 자외선 차단제와 함께 사용할 때 항산화 시너지가 가장 높습니다. 현재 순서는 완벽합니다!',
  },
  {
    id: 'retinoid_no_spf',
    type: 'warning',
    priority: 9,
    requiredCategories: ['retinoid'],
    forbiddenCategories: ['sunscreen'],
    message: '레티노이드 사용 시 광과민성이 증가합니다. 루틴에 자외선 차단제(SPF)를 추가하는 것을 강력히 권장해요.',
  },
  {
    id: 'retinoid_aha_conflict',
    type: 'warning',
    priority: 10,
    requiredCategories: ['retinoid', 'aha'],
    message: '레티노이드와 AHA를 같은 날 사용하면 피부 자극이 심해질 수 있어요. 요일을 나눠 격일 사용하세요.',
  },
  {
    id: 'retinoid_bha_conflict',
    type: 'warning',
    priority: 9,
    requiredCategories: ['retinoid', 'bha'],
    message: '레티노이드와 BHA(살리실산)를 동시에 사용하면 피부가 얇아질 수 있어요. 저녁 루틴을 격일로 분리하세요.',
  },
  {
    id: 'ceramide_hyaluronate_synergy',
    type: 'success',
    priority: 7,
    requiredCategories: ['ceramide', 'hyaluronate'],
    message: '세라마이드와 히알루론산 조합은 보습의 완벽한 시너지예요. 히알루론산으로 수분을 채우고 세라마이드로 봉인하세요.',
  },
  {
    id: 'niacinamide_ceramide_synergy',
    type: 'success',
    priority: 7,
    requiredCategories: ['niacinamide', 'ceramide'],
    message: '나이아신아마이드와 세라마이드는 피부 장벽 강화의 황금 조합이에요. 지속 사용하면 민감성이 줄어들어요.',
  },
  {
    id: 'aha_spf_warning',
    type: 'tip',
    priority: 8,
    requiredCategories: ['aha'],
    forbiddenCategories: ['sunscreen'],
    message: 'AHA 성분은 피부를 자외선에 더 민감하게 만들어요. 아침 루틴에 자외선 차단제를 꼭 추가해주세요.',
  },
  {
    id: 'peptide_retinoid',
    type: 'tip',
    priority: 6,
    requiredCategories: ['peptide', 'retinoid'],
    message: '펩타이드와 레티노이드는 콜라겐 합성을 이중으로 촉진해요. 레티노이드는 저녁에, 펩타이드는 아침에 사용하면 시너지를 극대화할 수 있어요.',
  },
  {
    id: 'retinoid_no_ceramide',
    type: 'tip',
    priority: 5,
    requiredCategories: ['retinoid'],
    forbiddenCategories: ['ceramide'],
    message: '레티노이드 사용 후 피부 장벽이 약해질 수 있어요. 세라마이드 크림을 마지막 단계에 추가하면 자극을 크게 줄일 수 있어요.',
  },
  {
    id: 'vitamin_c_no_sunscreen',
    type: 'tip',
    priority: 6,
    requiredCategories: ['vitamin_c'],
    forbiddenCategories: ['sunscreen'],
    message: '비타민 C는 빛에 의해 산화되기 쉬워요. 아침 사용 시 반드시 자외선 차단제를 덧발라주세요.',
  },
];

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductIngredient)
    private readonly productIngredientRepo: Repository<ProductIngredient>,
    @InjectRepository(Ingredient)
    private readonly ingredientRepo: Repository<Ingredient>,
    @InjectRepository(CategoryInteraction)
    private readonly categoryInteractionRepo: Repository<CategoryInteraction>,
    @InjectRepository(IngredientInteraction)
    private readonly ingredientInteractionRepo: Repository<IngredientInteraction>,
  ) {}

  async analyzeRoutine(productIds: number[]): Promise<RoutineAnalysisResult> {
    // ── 1. 제품 + 성분 로드 ──────────────────────────────────
    const products = await this.productRepo.find({ where: { id: In(productIds) } });

    const productIngredients = await this.productIngredientRepo.find({
      where: { productId: In(productIds) },
      order: { ingredientOrder: 'ASC' },
    });

    const ingredientIds = [...new Set(productIngredients.map((pi) => pi.ingredientId))];

    if (ingredientIds.length === 0) return this.emptyResult();

    // ── 2. 성분 + 카테고리 로드 ──────────────────────────────
    const ingredients = await this.ingredientRepo.find({
      where: { id: In(ingredientIds) },
      relations: ['categories'],
    });

    const ingredientMap = new Map(ingredients.map((i) => [i.id, i]));
    const productMap = new Map(products.map((p) => [p.id, p]));

    const analysisIngredients: AnalysisIngredient[] = productIngredients
      .map((pi) => {
        const ingredient = ingredientMap.get(pi.ingredientId);
        const product = productMap.get(pi.productId);
        if (!ingredient || !product) return null;
        return {
          ingredientId: ingredient.id,
          name: ingredient.name,
          nameKo: ingredient.nameKo,
          ewgScoreMin: ingredient.ewgScoreMin,
          ewgScoreMax: ingredient.ewgScoreMax,
          functions: ingredient.functions ?? [],
          concerns: ingredient.concerns ?? [],
          categories: (ingredient.categories ?? []).map((c) => ({ key: c.key, name: c.name })),
          fromProduct: { id: product.id, name: product.name },
          order: pi.ingredientOrder,
        };
      })
      .filter(Boolean) as AnalysisIngredient[];

    // ── 3. 중복 성분 감지 ────────────────────────────────────
    const duplicates = this.detectDuplicates(productIngredients, ingredientMap, productMap);

    // ── 4. 상호작용 분석 ─────────────────────────────────────
    const conflicts: AnalysisConflict[] = [];
    const synergies: AnalysisConflict[] = [];
    const cautions: AnalysisConflict[] = [];

    if (ingredientIds.length >= 2) {
      const directInteractions = await this.ingredientInteractionRepo
        .createQueryBuilder('ii')
        .where('(ii."ingredientAId" IN (:...ids) AND ii."ingredientBId" IN (:...ids))', { ids: ingredientIds })
        .getMany();

      for (const interaction of directInteractions) {
        const ingA = ingredientMap.get(interaction.ingredientAId);
        const ingB = ingredientMap.get(interaction.ingredientBId);
        if (!ingA || !ingB) continue;

        const piA = productIngredients.find((pi) => pi.ingredientId === ingA.id);
        const piB = productIngredients.find((pi) => pi.ingredientId === ingB.id);
        const record: AnalysisConflict = {
          type: 'direct',
          interactionType: interaction.type,
          severity: interaction.severity,
          reason: interaction.reason,
          ingredientA: { id: ingA.id, name: ingA.name, nameKo: ingA.nameKo },
          ingredientB: { id: ingB.id, name: ingB.name, nameKo: ingB.nameKo },
          productA: { id: piA?.productId ?? 0, name: productMap.get(piA?.productId ?? 0)?.name ?? '' },
          productB: { id: piB?.productId ?? 0, name: productMap.get(piB?.productId ?? 0)?.name ?? '' },
        };
        if (interaction.type === 'conflict') conflicts.push(record);
        else if (interaction.type === 'synergy') synergies.push(record);
        else cautions.push(record);
      }
    }

    const allCategoryIds = ingredients.flatMap((i) => (i.categories ?? []).map((c) => c.id));
    const uniqueCategoryIds = [...new Set(allCategoryIds)];

    if (uniqueCategoryIds.length >= 2) {
      const categoryInteractions = await this.categoryInteractionRepo
        .createQueryBuilder('ci')
        .where('(ci."categoryAId" IN (:...ids) AND ci."categoryBId" IN (:...ids))', { ids: uniqueCategoryIds })
        .getMany();

      for (const interaction of categoryInteractions) {
        const ingrInCatA = ingredients.filter((i) => i.categories?.some((c) => c.id === interaction.categoryAId));
        const ingrInCatB = ingredients.filter((i) => i.categories?.some((c) => c.id === interaction.categoryBId));

        for (const ingA of ingrInCatA) {
          for (const ingB of ingrInCatB) {
            if (ingA.id === ingB.id) continue;
            const alreadyDirect = [...conflicts, ...synergies, ...cautions].some(
              (r) => r.type === 'direct' &&
                ((r.ingredientA.id === ingA.id && r.ingredientB.id === ingB.id) ||
                 (r.ingredientA.id === ingB.id && r.ingredientB.id === ingA.id)),
            );
            if (alreadyDirect) continue;

            const piA = productIngredients.find((pi) => pi.ingredientId === ingA.id);
            const piB = productIngredients.find((pi) => pi.ingredientId === ingB.id);
            const record: AnalysisConflict = {
              type: 'category',
              interactionType: interaction.type,
              severity: interaction.severity,
              reason: interaction.reason,
              ingredientA: { id: ingA.id, name: ingA.name, nameKo: ingA.nameKo },
              ingredientB: { id: ingB.id, name: ingB.name, nameKo: ingB.nameKo },
              productA: { id: piA?.productId ?? 0, name: productMap.get(piA?.productId ?? 0)?.name ?? '' },
              productB: { id: piB?.productId ?? 0, name: productMap.get(piB?.productId ?? 0)?.name ?? '' },
              timeOfDay: interaction.timeOfDay,
            };
            if (interaction.type === 'conflict') conflicts.push(record);
            else if (interaction.type === 'synergy') synergies.push(record);
            else cautions.push(record);
          }
        }
      }
    }

    // ── 5. Expert Tip 생성 ───────────────────────────────────
    const presentCategories = new Set(analysisIngredients.flatMap((ai) => ai.categories.map((c) => c.key)));
    const expertTips = this.generateTips(presentCategories);

    // ── 6. 점수 계산 ─────────────────────────────────────────
    const base = 100;
    const ewgPenalty = analysisIngredients.reduce((acc, ai) => {
      const score = ai.ewgScoreMax ?? 0;
      if (score >= 8) return acc + 10;
      if (score >= 6) return acc + 5;
      if (score >= 4) return acc + 2;
      return acc;
    }, 0);
    const conflictPenalty = conflicts.reduce((acc, c) => acc + ([0, 5, 8, 10, 15, 20][c.severity] ?? 20), 0);
    const cautionPenalty = cautions.reduce((acc, c) => acc + ([0, 2, 3, 5, 7, 10][c.severity] ?? 10), 0);
    const synergyBonus = Math.min(20, synergies.reduce((acc, s) => acc + ([0, 1, 2, 3, 4, 5][s.severity] ?? 5), 0));
    const final = Math.max(0, Math.min(100, base - ewgPenalty - conflictPenalty - cautionPenalty + synergyBonus));

    const grade = final >= 90 ? 'S' : final >= 75 ? 'A' : final >= 60 ? 'B' : final >= 40 ? 'C' : 'D';
    const summary =
      grade === 'S' ? '훌륭한 루틴이에요! 성분 궁합이 완벽합니다' :
      grade === 'A' ? '좋은 루틴이에요. 소소한 개선 여지가 있어요' :
      grade === 'B' ? '괜찮은 루틴이지만 일부 주의가 필요해요' :
      grade === 'C' ? '성분 충돌이 발견됐어요. 루틴 조정을 권장해요' :
      '심각한 성분 충돌이 있어요. 루틴을 재검토해주세요';

    this.logger.log(`분석 완료: ${productIds.length}개 제품, 점수 ${final}(${grade}), 충돌 ${conflicts.length}건, 중복 ${duplicates.length}건`);

    return {
      score: final, grade, summary,
      ingredients: analysisIngredients,
      duplicates,
      expertTips,
      conflicts, synergies, cautions,
      scoreBreakdown: { base, ewgPenalty, conflictPenalty: conflictPenalty + cautionPenalty, synergyBonus, final },
    };
  }

  private detectDuplicates(
    productIngredients: ProductIngredient[],
    ingredientMap: Map<number, Ingredient>,
    productMap: Map<number, Product>,
  ): DuplicateIngredient[] {
    const grouped = new Map<number, Set<number>>();
    for (const pi of productIngredients) {
      if (!grouped.has(pi.ingredientId)) grouped.set(pi.ingredientId, new Set());
      grouped.get(pi.ingredientId)!.add(pi.productId);
    }
    return [...grouped.entries()]
      .filter(([, pids]) => pids.size >= 2)
      .map(([ingId, pids]) => {
        const ingredient = ingredientMap.get(ingId);
        if (!ingredient) return null;
        return {
          ingredient: { id: ingredient.id, name: ingredient.name, nameKo: ingredient.nameKo },
          foundInProducts: [...pids].map((pid) => productMap.get(pid)).filter(Boolean).map((p) => ({ id: p!.id, name: p!.name })),
        };
      })
      .filter(Boolean) as DuplicateIngredient[];
  }

  private generateTips(presentCategories: Set<string>): ExpertTip[] {
    return TIP_RULES
      .filter((rule) => {
        const hasRequired = rule.requiredCategories.every((c) => presentCategories.has(c));
        const hasForbidden = rule.forbiddenCategories?.some((c) => presentCategories.has(c)) ?? false;
        return hasRequired && !hasForbidden;
      })
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3)
      .map((rule) => ({ id: rule.id, type: rule.type, message: rule.message }));
  }

  // ── 성분 조합 전용 분석 ───────────────────────────────────
  async analyzeIngredientCombinations(productIds: number[]): Promise<IngredientCombinationResult> {
    const products = await this.productRepo.find({ where: { id: In(productIds) } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const productIngredients = await this.productIngredientRepo.find({
      where: { productId: In(productIds) },
      order: { ingredientOrder: 'ASC' },
    });

    const ingredientIds = [...new Set(productIngredients.map((pi) => pi.ingredientId))];
    if (ingredientIds.length < 2) {
      return { combinations: [], summary: { conflict: 0, synergy: 0, caution: 0, total: 0 } };
    }

    const ingredients = await this.ingredientRepo.find({ where: { id: In(ingredientIds) } });
    const ingredientMap = new Map(ingredients.map((i) => [i.id, i]));

    const interactions = await this.ingredientInteractionRepo
      .createQueryBuilder('ii')
      .where('(ii."ingredientAId" IN (:...ids) AND ii."ingredientBId" IN (:...ids))', { ids: ingredientIds })
      .getMany();

    const combinations: IngredientCombination[] = interactions.map((interaction) => {
      const ingA = ingredientMap.get(interaction.ingredientAId)!;
      const ingB = ingredientMap.get(interaction.ingredientBId)!;

      const piA = productIngredients.find((pi) => pi.ingredientId === ingA.id);
      const piB = productIngredients.find((pi) => pi.ingredientId === ingB.id);
      const prodA = productMap.get(piA?.productId ?? 0);
      const prodB = productMap.get(piB?.productId ?? 0);

      return {
        type: interaction.type,
        severity: interaction.severity,
        reason: interaction.reason,
        source: interaction.source,
        ingredientA: { id: ingA.id, name: ingA.name, nameKo: ingA.nameKo ?? ingA.name },
        ingredientB: { id: ingB.id, name: ingB.name, nameKo: ingB.nameKo ?? ingB.name },
        productA: prodA ? { id: prodA.id, name: prodA.name } : null,
        productB: prodB ? { id: prodB.id, name: prodB.name } : null,
      };
    });

    combinations.sort((a, b) => {
      const typeOrder = { conflict: 0, caution: 1, synergy: 2 };
      return typeOrder[a.type] - typeOrder[b.type] || b.severity - a.severity;
    });

    const summary = {
      conflict: combinations.filter((c) => c.type === 'conflict').length,
      synergy: combinations.filter((c) => c.type === 'synergy').length,
      caution: combinations.filter((c) => c.type === 'caution').length,
      total: combinations.length,
    };

    this.logger.log(`성분 조합 분석: ${productIds.length}개 제품, ${combinations.length}건 상호작용`);
    return { combinations, summary };
  }

  private emptyResult(): RoutineAnalysisResult {
    return {
      score: 0, grade: 'D', summary: '분석할 성분 정보가 없어요',
      ingredients: [], duplicates: [], expertTips: [],
      conflicts: [], synergies: [], cautions: [],
      scoreBreakdown: { base: 100, ewgPenalty: 0, conflictPenalty: 0, synergyBonus: 0, final: 0 },
    };
  }
}
