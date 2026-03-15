import { Injectable, Logger } from '@nestjs/common';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page } from 'puppeteer';

puppeteer.use(StealthPlugin());

export interface OliveYoungProduct {
  oliveyoungId: string;
  name: string;
  brand: string;
  category: string;
  imageUrl: string;
  barcode: string;
  oliveyoungUrl: string;
  rawIngredientText: string;
}

export interface OliveYoungSearchResult {
  oliveyoungId: string;
  name: string;
  brand: string;
  imageUrl: string;
  oliveyoungUrl: string;
}

const BASE_URL = 'https://www.oliveyoung.co.kr';
const SEARCH_URL = `${BASE_URL}/store/search/getSearchMain.do`;
const DETAIL_URL = `${BASE_URL}/store/goods/getGoodsDetail.do`;

@Injectable()
export class OliveYoungCrawler {
  private readonly logger = new Logger(OliveYoungCrawler.name);
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
    return page;
  }

  // ── 검색 ──────────────────────────────────────────────────
  async searchProducts(keyword: string): Promise<OliveYoungSearchResult[]> {
    const page = await this.newPage();
    try {
      await page.goto(`${SEARCH_URL}?query=${encodeURIComponent(keyword)}`, {
        waitUntil: 'networkidle2',
        timeout: 20000,
      });

      const results = await page.evaluate((baseUrl) => {
        return Array.from(document.querySelectorAll('.prd_info'))
          .slice(0, 10)
          .map((el) => {
            const anchor = el.querySelector<HTMLAnchorElement>('a[href*="goodsNo"]');
            const href = anchor?.href || '';
            const goodsMatch = href.match(/goodsNo=([A-Z0-9]+)/i);
            const oliveyoungId = goodsMatch?.[1] || '';
            if (!oliveyoungId) return null;

            // .prd_name에 브랜드명이 포함되어 있어 브랜드 텍스트 제거
            const nameEl = el.querySelector('.prd_name');
            const brandEl = el.querySelector('.prd_brand');
            const brandText = brandEl?.textContent?.trim() || '';
            const fullName = nameEl?.textContent?.trim() || '';
            // 브랜드명이 앞에 붙어있는 경우 제거
            const name = fullName.startsWith(brandText)
              ? fullName.slice(brandText.length).trim()
              : fullName;

            return {
              oliveyoungId,
              name,
              brand: brandText,
              imageUrl: (el.querySelector('img') as HTMLImageElement)?.src || '',
              oliveyoungUrl: `${baseUrl}/store/goods/getGoodsDetail.do?goodsNo=${oliveyoungId}`,
            };
          })
          .filter(Boolean);
      }, BASE_URL);

      this.logger.log(`검색 결과: "${keyword}" → ${results.length}건`);
      return results as OliveYoungSearchResult[];
    } catch (err) {
      this.logger.error(`올리브영 검색 실패: ${keyword}`, err.message);
      return [];
    } finally {
      await page.close();
    }
  }

  // ── 상세 크롤링 ───────────────────────────────────────────
  async crawlProductDetail(oliveyoungId: string): Promise<OliveYoungProduct | null> {
    const page = await this.newPage();
    try {
      await page.goto(`${DETAIL_URL}?goodsNo=${oliveyoungId}`, {
        waitUntil: 'networkidle2',
        timeout: 20000,
      });

      // 브랜드: 여러 셀렉터 순서대로 시도
      const brand = await page.evaluate(() => {
        const selectors = ['.prd_brand a', '.prd_brand', '.brand_name', '.goods_brand a', '.goods_brand'];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          const text = el?.textContent?.trim();
          if (text) return text;
        }
        return '';
      });

      // 카테고리: 브레드크럼 마지막 항목
      const category = await page.evaluate(() => {
        const selectors = ['.location .loc_dep a', '.loc_wrap li a', '.breadcrumb li a', '.gnb_category a'];
        for (const sel of selectors) {
          const items = Array.from(document.querySelectorAll(sel));
          // 홈/올리브영 제외하고 마지막 유의미한 항목
          const meaningful = items.filter(
            (el) => !['홈', '올리브영', 'HOME'].includes(el.textContent?.trim() || ''),
          );
          if (meaningful.length > 0) {
            return meaningful[meaningful.length - 1].textContent?.trim() || '';
          }
        }
        return '';
      });

      // 이미지: og:image 메타태그가 가장 안정적, 없으면 #mainImg / data-src 순서로 시도
      const imageUrl = await page.evaluate(() => {
        // og:image 메타태그
        const og = document.querySelector<HTMLMetaElement>('meta[property="og:image"]');
        if (og?.content) return og.content;

        // #mainImg (lazy-load: data-src 우선, src 차선)
        const mainImg = document.querySelector<HTMLImageElement>('#mainImg');
        if (mainImg) {
          return mainImg.getAttribute('data-src') || mainImg.src || '';
        }

        // .prd_img 내 첫 번째 img
        const prdImg = document.querySelector<HTMLImageElement>('.prd_img img');
        if (prdImg) {
          return prdImg.getAttribute('data-src') || prdImg.src || '';
        }

        return '';
      });

      // 제품명: 페이지 타이틀에서 추출 (가장 안정적)
      const title = await page.title();
      const name = title.replace('| 올리브영', '').replace(/\[.*?\]/g, '').trim();

      // "상품정보 제공고시" 클릭 → 성분 + 바코드 테이블 노출
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button'))
          .find((b) => b.textContent?.includes('상품정보 제공고시'));
        btn?.click();
      });
      await this.sleep(2000);

      // 성분 + 바코드 추출: th 텍스트로 판단
      const { rawIngredientText, barcode } = await page.evaluate(() => {
        let ingredientText = '';
        let barcodeText = '';

        document.querySelectorAll('th').forEach((th) => {
          const thText = th.textContent?.trim() || '';
          const td = th.nextElementSibling;
          if (!td) return;
          const tdText = td.textContent?.trim() || '';

          if (!ingredientText && (thText.includes('전성분') || thText.includes('성  분') || thText.includes('성분'))) {
            if (tdText.length > 5) ingredientText = tdText;
          }
          if (!barcodeText && (thText.includes('바코드') || thText === '바 코 드')) {
            if (tdText.length > 0) barcodeText = tdText;
          }
        });

        return { rawIngredientText: ingredientText, barcode: barcodeText };
      });

      if (!name && !brand) {
        this.logger.warn(`상품 정보 없음: goodsNo=${oliveyoungId}`);
        return null;
      }

      this.logger.log(
        `상세 크롤링: ${name} | 브랜드: ${brand || '없음'} | 카테고리: ${category || '없음'} | 성분 ${rawIngredientText ? rawIngredientText.length + '자' : '없음'}`,
      );

      return {
        oliveyoungId,
        name,
        brand,
        category,
        imageUrl,
        barcode,
        oliveyoungUrl: `${DETAIL_URL}?goodsNo=${oliveyoungId}`,
        rawIngredientText,
      };
    } catch (err) {
      this.logger.error(`상품 상세 크롤링 실패: ${oliveyoungId}`, err.message);
      return null;
    } finally {
      await page.close();
    }
  }

  // ── 검색 → 첫 번째 상세 ───────────────────────────────────
  async searchAndCrawlFirst(keyword: string): Promise<OliveYoungProduct | null> {
    const results = await this.searchProducts(keyword);
    if (!results.length) return null;
    await this.sleep(500);
    return this.crawlProductDetail(results[0].oliveyoungId);
  }

  // ── 검색 → 상위 N개 상세 ─────────────────────────────────
  async searchAndCrawlAll(keyword: string, limit = 5): Promise<OliveYoungProduct[]> {
    const results = await this.searchProducts(keyword);
    const products: OliveYoungProduct[] = [];

    for (const r of results.slice(0, limit)) {
      await this.sleep(600);
      const detail = await this.crawlProductDetail(r.oliveyoungId);
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

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
