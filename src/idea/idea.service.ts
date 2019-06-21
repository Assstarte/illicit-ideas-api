import { Injectable, HttpException, HttpStatus, ParseUUIDPipe, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { IdeaEntity } from './idea.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { IdeaDTO, IdeaRO } from './idea.dto';
import { isUUID } from '@nestjs/common/utils/is-uuid'
import { UserEntity } from '../user/user.entity';

@Injectable()
export class IdeaService {
    constructor(
        @InjectRepository(IdeaEntity)
        private ideaRepository: Repository<IdeaEntity>,
        @InjectRepository(UserEntity)
        private userRepository: Repository<UserEntity>,
    ) { }

    private toResponseObject(idea: IdeaEntity): IdeaRO {
        return {
            ...idea,
            author: idea.author.toResponseObject(false)
        };
    }

    private ensureOwnership(idea: IdeaEntity, userId: string) {
        if (idea.author.id !== userId) {
            throw new HttpException('Incorrect user', HttpStatus.UNAUTHORIZED);
        }
    }

    async showAll(): Promise<IdeaRO[]> {

        const ideas = await this.ideaRepository.find({
            relations: ['author']
        });
        return ideas.map((idea) => {
            return this.toResponseObject(idea);
        });

    }

    async create(userId: string, data: IdeaDTO): Promise<IdeaRO> {
        const user = await this.userRepository.findOne({
            where: {
                id: userId
            }
        });
        const idea = await this.ideaRepository.create({
            ...data,
            author: user
        });
        await this.ideaRepository.save(idea);
        return this.toResponseObject(idea);
    }

    async read(id: string): Promise<IdeaRO> {
        const idIsValid = isUUID(id);

        if (idIsValid) {
            const idea = await this.ideaRepository.findOne({
                where: { id },
                relations: ['author']
            });

            if (!idea) {
                throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
            }

            return this.toResponseObject(idea);
        } else {
            throw new BadRequestException('', 'Invalid ID syntax. Should be UUID');
        }

    }

    async update(id: string, userId: string, data: Partial<IdeaDTO>): Promise<IdeaRO> {
        const idIsValid = isUUID(id);
        if (idIsValid) {
            let idea = await this.ideaRepository.findOne({
                where: {
                    id
                },
                relations: ['author']
            });
            if (!idea) {
                throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
            }

            // Ensure that user which made request is actually the idea owner
            // prior to any modifications on data
            this.ensureOwnership(idea, userId);
            await this.ideaRepository.update({ id }, data);
            idea = await this.ideaRepository.findOne({
                where: {
                    id
                },
                relations: ['author']
            } );

            return this.toResponseObject(idea);

        } else {
            throw new BadRequestException('', 'Invalid ID syntax. Should be UUID');
        }
    }

    async destroy(id: string, userId: string) {
        const idIsValid = isUUID(id);
        if (idIsValid) {
            const idea = await this.ideaRepository.findOne({
                where: {
                    id
                },
                relations: ['author']
            });
            if (!idea) {
                throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
            }
            await this.ideaRepository.delete({ id });
            return this.toResponseObject(idea);
        } else {
            throw new BadRequestException('', 'Invalid ID syntax. Should be UUID');
        }
    }
}
