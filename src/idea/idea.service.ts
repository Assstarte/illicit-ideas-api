import { Injectable, HttpException, HttpStatus, ParseUUIDPipe, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { IdeaEntity } from './idea.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { IdeaDTO } from './idea.dto';
import { isUUID } from '@nestjs/common/utils/is-uuid'

@Injectable()
export class IdeaService {
    constructor(
        @InjectRepository(IdeaEntity)
        private ideaRepository: Repository<IdeaEntity>
    ) { }

    async showAll() {
        return await this.ideaRepository.find();
    }

    async create(data: IdeaDTO) {
        const idea = await this.ideaRepository.create(data);
        await this.ideaRepository.save(idea);
        return idea;
    }

    async read(id: string) {
        const idIsValid = isUUID(id);

        if (idIsValid) {
            const idea = await this.ideaRepository.findOne({
                where: { id }
            });

            if (!idea) {
                throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
            }

            return idea;
        } else {
            throw new BadRequestException('', 'Invalid ID syntax. Should be UUID');
        }

    }

    async update(id: string, data: Partial<IdeaDTO>) {
        const idIsValid = isUUID(id);
        if (idIsValid) {
            let idea = await this.ideaRepository.findOne({ id });
            if (!idea) {
                throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
            }
            await this.ideaRepository.update({ id }, data);

            idea = await this.ideaRepository.findOne({ where: {id} } );

            return idea;

        } else {
            throw new BadRequestException('', 'Invalid ID syntax. Should be UUID');
        }
    }

    async destroy(id: string) {
        const idIsValid = isUUID(id);
        if (idIsValid) {
            const idea = await this.ideaRepository.findOne({ id });
            if (!idea) {
                throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
            }
            await this.ideaRepository.delete({ id });
            return idea;
        } else {
            throw new BadRequestException('', 'Invalid ID syntax. Should be UUID');
        }
    }
}
