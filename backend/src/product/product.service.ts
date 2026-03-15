import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductIngredient } from './entities/productIngredient.entity';
import { OliveYoungCrawler, OliveYoungProduct } from '../crawler/oliveyoung.crawler';
import { HwahaeCrawler, HwahaeProduct } from '../crawler/hwahae.crawler';
import { IngredientParserService } from '../crawler/ingredientParser.service';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductIngredient)
    private readonly productIngredientRepo: Repository<ProductIngredient>,
    private readonly crawler: OliveYoungCrawler,
    private readonly hwahaeCrawler: HwahaeCrawler,
    private readonly parser: IngredientParserService,
  ) {}

  /** 제품 검색: DB 조회 → 없으면 올리브영 크롤링 */
  async search(keyword: string): Promise<Product[]> {
    // 1. 자체 DB 검색
    const cached = await this.productRepo
      .createQueryBuilder('p')
      .where('p.name ILIKE :keyword OR p.brand ILIKE :keyword', {
        keyword: `%${keyword}%`,
      })
      .leftJoinAndSelect('p.productIngredients', 'pi')
      .take(10)
      .getMany();

    if (cached.length > 0) {
      this.logger.log(`DB 캐시 히트: "${keyword}" → ${cached.length}건`);
      return cached;
    }

    // 2. 올리브영 크롤링
    this.logger.log(`DB 미스. 올리브영 크롤링 시작: "${keyword}"`);
    const oyCrawled = await this.crawler.searchAndCrawlAll(keyword, 5);
    if (oyCrawled.length) {
      const saved = await Promise.all(oyCrawled.map((p) => this.saveProduct(p)));
      return saved.filter(Boolean) as Product[];
    }

    // 3. 화해 크롤링 (올리브영 결과 없을 때 fallback)
    this.logger.log(`올리브영 결과 없음. 화해 크롤링 시작: "${keyword}"`);
    const hwahaeCrawled = await this.hwahaeCrawler.searchAndCrawlAll(keyword, 5);
    if (!hwahaeCrawled.length) return [];

    const hwahaeSaved = await Promise.all(hwahaeCrawled.map((p) => this.saveHwahaeProduct(p)));
    return hwahaeSaved.filter(Boolean) as Product[];
  }

  /** 바코드로 제품 조회: DB 조회 → 없으면 올리브영 검색 */
  async findByBarcode(barcode: string): Promise<Product | null> {
    // 1. 자체 DB
    const cached = await this.productRepo.findOne({
      where: { barcode },
      relations: ['productIngredients'],
    });
    if (cached) return cached;

    // 2. 올리브영 바코드 검색
    this.logger.log(`바코드 DB 미스. 올리브영 검색: ${barcode}`);
    const oyCrawled = await this.crawler.searchAndCrawlFirst(barcode);
    if (oyCrawled) return this.saveProduct(oyCrawled, barcode);

    // 3. 화해 바코드 검색 fallback
    this.logger.log(`올리브영 바코드 미스. 화해 검색: ${barcode}`);
    const hwahaeCrawled = await this.hwahaeCrawler.searchAndCrawlFirst(barcode);
    if (!hwahaeCrawled) return null;

    return this.saveHwahaeProduct(hwahaeCrawled);
  }

  /** rawIngredientText가 있지만 product_ingredients가 없는 제품에 성분 연결 생성 */
  async syncProductIngredients(): Promise<{ synced: number; skipped: number }> {
    const products = await this.productRepo
      .createQueryBuilder('p')
      .leftJoin('p.productIngredients', 'pi')
      .where('p.rawIngredientText IS NOT NULL')
      .andWhere('pi.id IS NULL')
      .getMany();

    let synced = 0;
    let skipped = 0;

    for (const product of products) {
      const parsedIngredients = await this.parser.parseAndMatch(product.rawIngredientText);
      const productIngredients = parsedIngredients
        .map((pi, index) => {
          if (!pi.ingredient) return null;
          return this.productIngredientRepo.create({
            productId: product.id,
            ingredientId: pi.ingredient.id,
            ingredientOrder: index,
          });
        })
        .filter(Boolean) as ProductIngredient[];

      if (productIngredients.length) {
        await this.productIngredientRepo.save(productIngredients);
        this.logger.log(`성분 동기화: ${product.name} → ${productIngredients.length}개 매칭`);
        synced++;
      } else {
        skipped++;
      }
    }

    return { synced, skipped };
  }

  /** 화해 크롤링 결과를 DB에 저장 */
  private async saveHwahaeProduct(data: HwahaeProduct): Promise<Product | null> {
    try {
      const existing = await this.productRepo.findOne({ where: { hwahaeId: data.hwahaeId } });
      if (existing) return existing;

      const parsedIngredients = data.rawIngredientText
        ? await this.parser.parseAndMatch(data.rawIngredientText)
        : [];

      const product = this.productRepo.create({
        name: data.name,
        brand: data.brand || null,
        category: data.category || null,
        imageUrl: data.imageUrl || null,
        hwahaeId: data.hwahaeId,
        hwahaeUrl: data.hwahaeUrl,
        rawIngredientText: data.rawIngredientText,
        source: 'hwahae',
      });
      const savedProduct = await this.productRepo.save(product);

      const productIngredients = parsedIngredients
        .map((pi, index) => {
          if (!pi.ingredient) return null;
          return this.productIngredientRepo.create({
            productId: savedProduct.id,
            ingredientId: pi.ingredient.id,
            ingredientOrder: index,
          });
        })
        .filter(Boolean) as ProductIngredient[];

      if (productIngredients.length) {
        await this.productIngredientRepo.save(productIngredients);
      }

      this.logger.log(`화해 제품 저장: ${savedProduct.name} (성분 ${productIngredients.length}개 매칭)`);

      return this.productRepo.findOne({
        where: { id: savedProduct.id },
        relations: ['productIngredients'],
      });
    } catch (err) {
      this.logger.error(`화해 제품 저장 실패: ${data.name}`, err.message);
      return null;
    }
  }

  /** 올리브영 크롤링 결과를 DB에 저장 */
  private async saveProduct(
    data: OliveYoungProduct,
    barcode?: string,
  ): Promise<Product | null> {
    try {
      // oliveyoungId 중복 체크
      const existing = await this.productRepo.findOne({
        where: { oliveyoungId: data.oliveyoungId },
      });
      if (existing) return existing;

      // 성분 파싱 및 매칭
      const parsedIngredients = data.rawIngredientText
        ? await this.parser.parseAndMatch(data.rawIngredientText)
        : [];

      // 제품 저장
      const product = this.productRepo.create({
        name: data.name,
        brand: data.brand || null,
        category: data.category || null,
        imageUrl: data.imageUrl || null,
        oliveyoungId: data.oliveyoungId,
        oliveyoungUrl: data.oliveyoungUrl,
        rawIngredientText: data.rawIngredientText,
        barcode: barcode ?? data.barcode ?? null,
        source: 'oliveyoung',
      });
      const savedProduct = await this.productRepo.save(product);

      // 성분 연결 저장
      const productIngredients = parsedIngredients
        .map((pi, index) => {
          if (!pi.ingredient) return null;
          return this.productIngredientRepo.create({
            productId: savedProduct.id,
            ingredientId: pi.ingredient.id,
            ingredientOrder: index,
          });
        })
        .filter(Boolean) as ProductIngredient[];

      if (productIngredients.length) {
        await this.productIngredientRepo.save(productIngredients);
      }

      this.logger.log(
        `제품 저장 완료: ${savedProduct.name} (성분 ${productIngredients.length}개 매칭)`,
      );

      return this.productRepo.findOne({
        where: { id: savedProduct.id },
        relations: ['productIngredients'],
      });
    } catch (err) {
      this.logger.error(`제품 저장 실패: ${data.name}`, err.message);
      return null;
    }
  }
}
