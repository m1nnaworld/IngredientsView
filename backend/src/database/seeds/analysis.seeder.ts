import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Ingredient } from '../../ingredients/entities/ingredient.entity';
import { IngredientAlias } from '../../ingredients/entities/ingredientAlias.entity';
import { IngredientCategory } from '../../ingredients/entities/ingredientCategory.entity';
import { CategoryInteraction } from '../../ingredients/entities/categoryInteraction.entity';
import { IngredientInteraction } from '../../ingredients/entities/ingredientInteraction.entity';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432'),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'password',
  database: process.env.DB_NAME ?? 'ingredient_view',
  entities: [Ingredient, IngredientAlias, IngredientCategory, CategoryInteraction, IngredientInteraction],
  synchronize: true,
});

// ── 데이터 타입 ─────────────────────────────────────────
interface CategorySeed {
  key: string;
  name: string;
  description: string;
  ingredients: string[];
}

interface CategoryInteractionSeed {
  categoryA: string;
  categoryB: string;
  type: 'conflict' | 'synergy' | 'caution';
  severity: number;
  reason: string;
  timeOfDay: string | null;
  source: string;
}

interface IngredientInteractionSeed {
  ingredientA: string;
  ingredientB: string;
  type: 'conflict' | 'synergy' | 'caution';
  severity: number;
  reason: string;
  source: string;
}

async function seed() {
  await dataSource.initialize();

  // pg_trgm 확장 활성화 (매칭 개선에 필요)
  await dataSource.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
  console.log('pg_trgm 확장 활성화 완료');

  const ingredientRepo = dataSource.getRepository(Ingredient);
  const categoryRepo = dataSource.getRepository(IngredientCategory);
  const categoryInteractionRepo = dataSource.getRepository(CategoryInteraction);
  const ingredientInteractionRepo = dataSource.getRepository(IngredientInteraction);

  const readJson = <T>(filename: string): T =>
    JSON.parse(fs.readFileSync(path.join(__dirname, 'data', filename), 'utf-8')) as T;

  // ── 1. 카테고리 시딩 ────────────────────────────────────
  const categoriesData = readJson<CategorySeed[]>('categories.json');
  const categoryMap = new Map<string, IngredientCategory>();
  let catInserted = 0;

  for (const item of categoriesData) {
    let category = await categoryRepo.findOne({ where: { key: item.key } });

    if (!category) {
      category = categoryRepo.create({
        key: item.key,
        name: item.name,
        description: item.description,
      });
      category = await categoryRepo.save(category);
      catInserted++;
    }

    categoryMap.set(item.key, category);

    // 성분 ↔ 카테고리 매핑
    const ingredients: Ingredient[] = [];
    for (const inciName of item.ingredients) {
      const ingredient = await ingredientRepo.findOne({
        where: { name: inciName },
        relations: ['categories'],
      });
      if (ingredient) {
        const alreadyMapped = (ingredient.categories ?? []).some((c) => c.id === category!.id);
        if (!alreadyMapped) {
          ingredients.push(ingredient);
        }
      }
    }

    if (ingredients.length > 0) {
      // 현재 categories 목록에 추가
      const updatedCategory = await categoryRepo.findOne({
        where: { id: category.id },
        relations: ['ingredients'],
      });
      if (updatedCategory) {
        updatedCategory.ingredients = [...(updatedCategory.ingredients ?? []), ...ingredients];
        await categoryRepo.save(updatedCategory);
      }
    }
  }

  console.log(`카테고리 시딩: ${catInserted}개 생성, ${categoriesData.length - catInserted}개 이미 존재`);

  // ── 2. 카테고리 상호작용 시딩 ───────────────────────────
  const catInteractionsData = readJson<CategoryInteractionSeed[]>('category_interactions.json');
  let catInterInserted = 0;
  let catInterSkipped = 0;

  for (const item of catInteractionsData) {
    const catA = categoryMap.get(item.categoryA);
    const catB = categoryMap.get(item.categoryB);

    if (!catA || !catB) {
      console.warn(`카테고리 없음: ${item.categoryA} 또는 ${item.categoryB}`);
      catInterSkipped++;
      continue;
    }

    // 중복 체크 (A-B 또는 B-A)
    const exists = await categoryInteractionRepo
      .createQueryBuilder('ci')
      .where(
        '(ci."categoryAId" = :a AND ci."categoryBId" = :b) OR (ci."categoryAId" = :b AND ci."categoryBId" = :a)',
        { a: catA.id, b: catB.id },
      )
      .getOne();

    if (exists) {
      catInterSkipped++;
      continue;
    }

    await categoryInteractionRepo.save(
      categoryInteractionRepo.create({
        categoryAId: catA.id,
        categoryBId: catB.id,
        type: item.type,
        severity: item.severity,
        reason: item.reason,
        timeOfDay: item.timeOfDay,
        source: item.source,
      }),
    );
    catInterInserted++;
  }

  console.log(`카테고리 상호작용: ${catInterInserted}개 삽입, ${catInterSkipped}개 스킵`);

  // ── 3. 성분 직접 상호작용 시딩 ──────────────────────────
  const ingInteractionsData = readJson<IngredientInteractionSeed[]>('ingredient_interactions.json');
  let ingInterInserted = 0;
  let ingInterSkipped = 0;

  for (const item of ingInteractionsData) {
    const ingA = await ingredientRepo.findOne({ where: { name: item.ingredientA } });
    const ingB = await ingredientRepo.findOne({ where: { name: item.ingredientB } });

    if (!ingA || !ingB) {
      console.warn(`성분 없음: ${item.ingredientA} 또는 ${item.ingredientB}`);
      ingInterSkipped++;
      continue;
    }

    // 작은 ID가 A, 큰 ID가 B (중복 방지)
    const [aId, bId] = ingA.id < ingB.id ? [ingA.id, ingB.id] : [ingB.id, ingA.id];

    const exists = await ingredientInteractionRepo.findOne({
      where: { ingredientAId: aId, ingredientBId: bId },
    });

    if (exists) {
      ingInterSkipped++;
      continue;
    }

    await ingredientInteractionRepo.save(
      ingredientInteractionRepo.create({
        ingredientAId: aId,
        ingredientBId: bId,
        type: item.type,
        severity: item.severity,
        reason: item.reason,
        source: item.source,
      }),
    );
    ingInterInserted++;
  }

  console.log(`성분 직접 상호작용: ${ingInterInserted}개 삽입, ${ingInterSkipped}개 스킵`);

  await dataSource.destroy();
  console.log('\n✅ 분석 시딩 완료!');
}

seed().catch((err) => {
  console.error('시딩 실패:', err);
  process.exit(1);
});
