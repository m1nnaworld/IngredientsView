import {Injectable, NotFoundException, ForbiddenException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {Routine} from './entities/routine.entity';

@Injectable()
export class RoutinesService {
  constructor(
    @InjectRepository(Routine)
    private readonly routinesRepository: Repository<Routine>,
  ) {}

  async findAll(userId: number): Promise<Routine[]> {
    return this.routinesRepository.find({where: {userId}});
  }

  async findOne(id: number, userId: number): Promise<Routine> {
    const routine = await this.routinesRepository.findOne({where: {id}});
    if (!routine) {
      throw new NotFoundException('루틴을 찾을 수 없습니다.');
    }
    if (routine.userId !== userId) {
      throw new ForbiddenException('접근 권한이 없습니다.');
    }
    return routine;
  }

  async create(data: Partial<Routine> & {userId: number}): Promise<Routine> {
    const routine = this.routinesRepository.create(data);
    return this.routinesRepository.save(routine);
  }

  async update(id: number, userId: number, data: Partial<Routine>): Promise<Routine> {
    const routine = await this.findOne(id, userId);
    Object.assign(routine, data);
    return this.routinesRepository.save(routine);
  }

  async remove(id: number, userId: number): Promise<void> {
    const routine = await this.findOne(id, userId);
    await this.routinesRepository.remove(routine);
  }
}
