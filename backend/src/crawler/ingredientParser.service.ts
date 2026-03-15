import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ingredient } from '../ingredients/entities/ingredient.entity';
import { IngredientAlias } from '../ingredients/entities/ingredientAlias.entity';

export interface ParsedIngredient {
  rawName: string;
  ingredient: Ingredient | null;
  matchType: 'exact_inci' | 'exact_ko' | 'alias' | 'trigram' | 'unmatched';
}

@Injectable()
export class IngredientParserService {
  private readonly logger = new Logger(IngredientParserService.name);

  constructor(
    @InjectRepository(Ingredient)
    private readonly ingredientRepo: Repository<Ingredient>,
    @InjectRepository(IngredientAlias)
    private readonly aliasRepo: Repository<IngredientAlias>,
  ) {}

  /** 성분 텍스트를 파싱해서 DB 성분과 매칭 */
  async parseAndMatch(rawText: string): Promise<ParsedIngredient[]> {
    const names = this.splitIngredients(rawText);
    const results: ParsedIngredient[] = [];

    for (const rawName of names) {
      const result = await this.matchIngredient(rawName);
      if (result.matchType === 'unmatched') {
        this.logger.debug(`미매칭 성분: "${rawName}"`);
      }
      results.push(result);
    }

    const matched = results.filter((r) => r.ingredient).length;
    this.logger.log(`매칭 결과: ${matched}/${results.length}개 매칭`);

    return results;
  }

  /** 쉼표 구분 성분명 파싱 */
  splitIngredients(text: string): string[] {
    return text
      .split(',')
      .map((s) =>
        s
          .trim()
          .replace(/\(.*?\)/g, '') // 괄호 내용 제거: "글리세린(식물성)" → "글리세린"
          .replace(/[*·•·]/g, '')  // 특수문자 제거
          .replace(/\s+/g, ' ')
          .replace(/\.$/, '')
          .trim(),
      )
      .filter((s) => s.length > 0);
  }

  private async matchIngredient(rawName: string): Promise<ParsedIngredient> {
    const normalized = rawName.toUpperCase().trim();
    const trimmed = rawName.trim();

    // ① INCI명 완전 일치 (영문 대문자)
    const byInci = await this.ingredientRepo.findOne({ where: { name: normalized } });
    if (byInci) return { rawName, ingredient: byInci, matchType: 'exact_inci' };

    // ② 한글명 완전 일치
    const byKo = await this.ingredientRepo.findOne({ where: { nameKo: trimmed } });
    if (byKo) return { rawName, ingredient: byKo, matchType: 'exact_ko' };

    // ③ Alias 테이블 조회 (한글/영문 별칭)
    const alias = await this.aliasRepo.findOne({
      where: { alias: trimmed },
      relations: ['ingredient'],
    });
    if (alias?.ingredient) return { rawName, ingredient: alias.ingredient, matchType: 'alias' };

    // ④ pg_trgm 유사도 매칭 (한글명 기준, 유사도 ≥ 0.35)
    const byTrigram = await this.ingredientRepo
      .createQueryBuilder('i')
      .where('similarity(i."nameKo", :name) >= 0.35', { name: trimmed })
      .orderBy('similarity(i."nameKo", :name)', 'DESC')
      .setParameter('name', trimmed)
      .getOne();
    if (byTrigram) return { rawName, ingredient: byTrigram, matchType: 'trigram' };

    // ⑤ INCI 부분 일치 (마지막 수단 — false positive 가능성 있어 strict 사용)
    if (normalized.length >= 5) {
      const byPartial = await this.ingredientRepo
        .createQueryBuilder('i')
        .where('UPPER(i.name) = :name', { name: normalized })
        .getOne();
      if (byPartial) return { rawName, ingredient: byPartial, matchType: 'exact_inci' };
    }

    return { rawName, ingredient: null, matchType: 'unmatched' };
  }
}
