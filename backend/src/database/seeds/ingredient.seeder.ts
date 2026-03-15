import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Ingredient } from '../../ingredients/entities/ingredient.entity';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432'),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'password',
  database: process.env.DB_NAME ?? 'ingredient_view',
  entities: [Ingredient],
  synchronize: false,
});

interface SeedIngredient {
  inci_name: string;
  name_ko: string;
  ewg_score_min: number | null;
  ewg_score_max: number | null;
  functions: string[];
  description: string;
  concerns: string[];
  source: string;
  is_verified: boolean;
}

async function seed() {
  await dataSource.initialize();
  const repo = dataSource.getRepository(Ingredient);

  const dataFiles = ['data/ingredients.json', 'data/gpt_ingredients.json'];
  const data: SeedIngredient[] = dataFiles.flatMap((file) => {
    const filePath = path.join(__dirname, file);
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as SeedIngredient[];
  });

  let inserted = 0;
  let skipped = 0;

  for (const item of data) {
    const exists = await repo.findOne({ where: { name: item.inci_name } });
    if (exists) {
      skipped++;
      continue;
    }

    const ingredient = repo.create({
      name: item.inci_name,
      nameKo: item.name_ko,
      ewgScoreMin: item.ewg_score_min,
      ewgScoreMax: item.ewg_score_max,
      functions: item.functions,
      description: item.description,
      concerns: item.concerns,
      source: item.source,
      isVerified: item.is_verified,
    });

    await repo.save(ingredient);
    inserted++;
  }

  await dataSource.destroy();
  console.log(`시딩 완료: ${inserted}개 삽입, ${skipped}개 스킵 (중복)`);
}

seed().catch((err) => {
  console.error('시딩 실패:', err);
  process.exit(1);
});
