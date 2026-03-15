import { Injectable, Logger } from '@nestjs/common';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page } from 'puppeteer';

puppeteer.use(StealthPlugin());

export interface HwahaeProduct {
  hwahaeId: string;
  name: string;
  brand: string;
  category: string;
  imageUrl: string;
  hwahaeUrl: string;
  rawIngredientText: string;
  rating: number | null; // 화해 유저 평점
}

export interface HwahaeSearchResult {
  hwahaeId: string;
  name: string;
  brand: string;
  imageUrl: string;
  hwahaeUrl: string;
  rating: number | null;
}

const BASE_URL = 'https://www.hwahae.co.kr';
const SEARCH_URL = `${BASE_URL}/search`;

@Injectable()
export class HwahaeCrawler {
  private readonly logger = new Logger(HwahaeCrawler.name);
  private browser: Browser | null = null;

  // ── 브라우저 싱글톤 관리 ──────────────────────────────────
  private async getBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.connected) {
      this.browser = await puppeteer.launch({
        headless: 'new' as any,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--lang=ko-KR',
        ],
      });
    }
    return this.browser;
  }

  private async newPage(): Promise<Page> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'ko-KR,ko;q=0.9' });
    await page.setViewport({ width: 1280, height: 900 });
    // 화해는 React SPA — 불필요한 리소스 차단으로 속도 향상
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      if (['font', 'media'].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });
    return page;
  }

  // ── 제품 검색 ─────────────────────────────────────────────
  async searchProducts(keyword: string): Promise<HwahaeSearchResult[]> {
    const page = await this.newPage();
    try {
      await page.goto(`${SEARCH_URL}?query=${encodeURIComponent(keyword)}`, {
        waitUntil: 'networkidle2',
        timeout: 25000,
      });

      // React 렌더링 대기
      await this.waitForAny(page, [
        '[class*="ProductCard"]',
        '[class*="product-card"]',
        '[class*="ProductListItem"]',
        '[class*="item-wrap"]',
        '.product-item',
        'li[class*="product"]',
        'a[href*="/ingredients/"]',
      ], 8000).catch(() => null);

      const results = await page.evaluate((baseUrl: string) => {
        // 화해 제품 카드 패턴 — 여러 selector를 순서대로 시도
        const cardSelectors = [
          '[class*="ProductCard"]',
          '[class*="product-card"]',
          '[class*="ProductListItem"]',
          '[class*="item-wrap"]',
          '.product-item',
          'li[class*="product"]',
        ];

        let cards: Element[] = [];
        for (const sel of cardSelectors) {
          const found = Array.from(document.querySelectorAll(sel));
          if (found.length > 0) { cards = found; break; }
        }

        // anchor href로 직접 수집 (fallback)
        if (cards.length === 0) {
          cards = Array.from(
            new Set(
              Array.from(document.querySelectorAll('a[href*="/ingredients/"]'))
                .map((a) => a.closest('li, article, [class*="item"], [class*="card"]') || a),
            ),
          ) as Element[];
        }

        return cards.slice(0, 10).map((card) => {
          // 링크에서 id 추출
          const anchor = card.querySelector<HTMLAnchorElement>('a[href*="/ingredients/"]')
            ?? (card as HTMLAnchorElement);
          const href = anchor?.href || '';
          const idMatch = href.match(/\/ingredients\/(\d+)/);
          const hwahaeId = idMatch?.[1] || '';
          if (!hwahaeId) return null;

          // 제품명
          const nameSelectors = [
            '[class*="product-name"]',
            '[class*="ProductName"]',
            '[class*="name"]',
            'h3',
            'h4',
            'p',
          ];
          let name = '';
          for (const sel of nameSelectors) {
            const el = card.querySelector(sel);
            const text = el?.textContent?.trim();
            if (text && text.length > 1 && text.length < 100) { name = text; break; }
          }

          // 브랜드
          const brandSelectors = [
            '[class*="brand"]',
            '[class*="Brand"]',
            'span[class*="company"]',
          ];
          let brand = '';
          for (const sel of brandSelectors) {
            const el = card.querySelector(sel);
            const text = el?.textContent?.trim();
            if (text && text.length > 0) { brand = text; break; }
          }

          // 이미지
          const img = card.querySelector<HTMLImageElement>('img');
          const imageUrl = img?.getAttribute('data-src') || img?.src || '';

          // 평점
          const ratingEl = card.querySelector('[class*="rating"], [class*="Rating"], [class*="score"]');
          const ratingText = ratingEl?.textContent?.trim() || '';
          const rating = ratingText ? parseFloat(ratingText) : null;

          return {
            hwahaeId,
            name,
            brand,
            imageUrl: imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`,
            hwahaeUrl: `${baseUrl}/ingredients/${hwahaeId}`,
            rating: rating && !isNaN(rating) ? rating : null,
          };
        }).filter(Boolean);
      }, BASE_URL);

      this.logger.log(`화해 검색: "${keyword}" → ${results.length}건`);
      return results as HwahaeSearchResult[];
    } catch (err) {
      this.logger.error(`화해 검색 실패: ${keyword}`, err.message);
      return [];
    } finally {
      await page.close();
    }
  }

  // ── 제품 상세 크롤링 ──────────────────────────────────────
  async crawlProductDetail(hwahaeId: string): Promise<HwahaeProduct | null> {
    const page = await this.newPage();
    const url = `${BASE_URL}/ingredients/${hwahaeId}`;
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 25000 });

      // 전성분 섹션 로드 대기
      await this.waitForAny(page, [
        '[class*="ingredient"]',
        '[class*="Ingredient"]',
        '[class*="full-ingredient"]',
        'section[class*="info"]',
      ], 8000).catch(() => null);

      // ── 제품명
      const name = await page.evaluate(() => {
        const selectors = [
          '[class*="product-name"]',
          '[class*="ProductName"]',
          'h1[class*="name"]',
          'h1',
          'meta[property="og:title"]',
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          const text = sel.includes('meta')
            ? (el as HTMLMetaElement)?.content
            : el?.textContent?.trim();
          if (text && text.length > 1) return text;
        }
        return document.title.split('|')[0].trim();
      });

      // ── 브랜드
      const brand = await page.evaluate(() => {
        const selectors = [
          '[class*="brand-name"]',
          '[class*="BrandName"]',
          '[class*="company-name"]',
          '[class*="brand"]',
          'a[href*="/brand/"]',
          'a[href*="/brands/"]',
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          const text = el?.textContent?.trim();
          if (text && text.length > 0) return text;
        }
        return '';
      });

      // ── 카테고리 (브레드크럼 or 태그)
      const category = await page.evaluate(() => {
        const selectors = [
          '[class*="breadcrumb"] a',
          '[class*="Breadcrumb"] a',
          '[class*="category"]',
          '[class*="Category"]',
          '[class*="tag"]',
        ];
        for (const sel of selectors) {
          const items = Array.from(document.querySelectorAll(sel));
          const meaningful = items.filter((el) => {
            const t = el.textContent?.trim() || '';
            return t.length > 0 && !['홈', 'HOME', '화해'].includes(t);
          });
          if (meaningful.length > 0) {
            return meaningful[meaningful.length - 1].textContent?.trim() || '';
          }
        }
        return '';
      });

      // ── 이미지
      const imageUrl = await page.evaluate(() => {
        const og = document.querySelector<HTMLMetaElement>('meta[property="og:image"]');
        if (og?.content) return og.content;

        const imgSelectors = [
          '[class*="product-image"] img',
          '[class*="ProductImage"] img',
          '[class*="main-image"] img',
          '[class*="thumbnail"] img',
          'img[class*="product"]',
        ];
        for (const sel of imgSelectors) {
          const img = document.querySelector<HTMLImageElement>(sel);
          if (img) return img.getAttribute('data-src') || img.src || '';
        }
        return '';
      });

      // ── 전성분 텍스트
      const rawIngredientText = await page.evaluate(() => {
        // 전성분 레이블 근처에 있는 텍스트 탐색
        const labelPatterns = ['전성분', '성분', 'Ingredient', 'INGREDIENT', 'Full Ingredient'];

        // 방법 1: 전성분 heading/label → sibling/next element
        for (const pattern of labelPatterns) {
          const allEls = Array.from(document.querySelectorAll('*'));
          const labelEl = allEls.find(
            (el) =>
              el.children.length === 0 &&
              (el.textContent?.trim() === pattern ||
                el.textContent?.includes(pattern)),
          );
          if (labelEl) {
            // 다음 형제 요소나 부모의 다음 형제
            const sibling =
              labelEl.nextElementSibling ||
              labelEl.parentElement?.nextElementSibling;
            const text = sibling?.textContent?.trim() || '';
            if (text.length > 20 && text.includes(',')) return text;
          }
        }

        // 방법 2: 쉼표가 많이 포함된 긴 텍스트 노드를 전성분으로 간주
        const candidates = Array.from(
          document.querySelectorAll(
            '[class*="ingredient"] p, [class*="ingredient"] span, [class*="Ingredient"] p, ' +
            '[class*="full-ingredient"], [class*="FullIngredient"], ' +
            '[class*="ingredient-text"], [class*="ingredientText"]',
          ),
        );
        for (const el of candidates) {
          const text = el.textContent?.trim() || '';
          if (text.length > 30 && (text.includes(',') || text.includes('、'))) return text;
        }

        // 방법 3: 가장 긴 쉼표-포함 텍스트 (최후 수단)
        let longest = '';
        document.querySelectorAll('p, span, div').forEach((el) => {
          if (el.children.length === 0) {
            const text = el.textContent?.trim() || '';
            if (text.length > longest.length && text.includes(',')) longest = text;
          }
        });
        return longest.length > 50 ? longest : '';
      });

      // ── 평점
      const rating = await page.evaluate(() => {
        const selectors = [
          '[class*="rating-score"]',
          '[class*="RatingScore"]',
          '[class*="average-score"]',
          '[class*="score"]',
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          const text = el?.textContent?.trim();
          if (text) {
            const num = parseFloat(text);
            if (!isNaN(num) && num > 0 && num <= 5) return num;
          }
        }
        return null;
      });

      if (!name) {
        this.logger.warn(`화해 상품 정보 없음: hwahaeId=${hwahaeId}`);
        return null;
      }

      this.logger.log(
        `화해 상세: ${name} | 브랜드: ${brand || '없음'} | 카테고리: ${category || '없음'} | 성분: ${rawIngredientText ? rawIngredientText.length + '자' : '없음'}`,
      );

      return {
        hwahaeId,
        name,
        brand,
        category,
        imageUrl,
        hwahaeUrl: url,
        rawIngredientText,
        rating,
      };
    } catch (err) {
      this.logger.error(`화해 상세 크롤링 실패: ${hwahaeId}`, err.message);
      return null;
    } finally {
      await page.close();
    }
  }

  // ── 검색 → 첫 번째 상세 ───────────────────────────────────
  async searchAndCrawlFirst(keyword: string): Promise<HwahaeProduct | null> {
    const results = await this.searchProducts(keyword);
    if (!results.length) return null;
    await this.sleep(500);
    return this.crawlProductDetail(results[0].hwahaeId);
  }

  // ── 검색 → 상위 N개 상세 ─────────────────────────────────
  async searchAndCrawlAll(keyword: string, limit = 5): Promise<HwahaeProduct[]> {
    const results = await this.searchProducts(keyword);
    const products: HwahaeProduct[] = [];

    for (const r of results.slice(0, limit)) {
      await this.sleep(700);
      const detail = await this.crawlProductDetail(r.hwahaeId);
      if (detail) products.push(detail);
    }

    return products;
  }

  // ── 종료 ──────────────────────────────────────────────────
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // ── 헬퍼 ──────────────────────────────────────────────────
  private waitForAny(page: Page, selectors: string[], timeout: number): Promise<void> {
    return Promise.any(
      selectors.map((sel) =>
        page.waitForSelector(sel, { timeout }).then(() => undefined),
      ),
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
