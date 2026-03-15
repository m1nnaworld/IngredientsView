import {Injectable} from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): string {
    return '성분뷰 서버가 정상 동작 중입니다.';
  }
}
