import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {RoutinesService} from './routines.service';
import {RoutinesController} from './routines.controller';
import {Routine} from './entities/routine.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Routine])],
  controllers: [RoutinesController],
  providers: [RoutinesService],
})
export class RoutinesModule {}
