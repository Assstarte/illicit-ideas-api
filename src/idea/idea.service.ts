import { Injectable, HttpException, HttpStatus, ParseUUIDPipe, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { IdeaEntity } from './idea.entity';
import { InjectRepository } from '@nestjs/typeorm';

import { IdeaDTO, IdeaRO } from './idea.dto';
import { isUUID } from '@nestjs/common/utils/is-uuid'
import { UserEntity } from '../user/user.entity';
import { Votes } from '../shared/votes.enum';

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
            author: idea.author.toResponseObject(false),
            upvotes: idea.upvotes || null,
            downvotes: idea.downvotes || null
        };
    }

    private ensureOwnership(idea: IdeaEntity, userId: string) {
        if (idea.author.id !== userId) {
            throw new HttpException('Incorrect user', HttpStatus.UNAUTHORIZED);
        }
    }

    private async vote(idea: IdeaEntity, user: UserEntity, vote: Votes) {
        // Check if the vote was already triggered and act accordingly
        const opposite = vote === Votes.UP ? Votes.DOWN : Votes.UP;

        if (
            idea[opposite].filter(voter => voter.id === user.id).length > 0 ||
            idea[vote].filter(voter => voter.id === user.id).length > 0
        ) {
            idea[opposite] = idea[opposite].filter(voter => voter.id !== user.id);
            idea[vote] = idea[vote].filter(voter => voter.id !== user.id);
            await this.ideaRepository.save(idea);
        } else if (
            idea[vote].filter(voter => voter.id === user.id).length < 1
        ) {
            idea[vote].push(user);
            await this.ideaRepository.save(idea);
        } else {
            throw new HttpException('Unable to cast vote', HttpStatus.BAD_REQUEST);
        }

        return idea;
    }

    async showAll(): Promise<IdeaRO[]> {

        const ideas = await this.ideaRepository.find({
            relations: ['author', 'upvotes', 'downvotes']
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
                relations: ['author', 'upvotes', 'downvotes']
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

    async upvote(id: string, userId: string) {
        let idea = await this.ideaRepository.findOne({
            where: {
                id
            },
            relations: ['author', 'upvotes', 'downvotes']
        });

        const user = await this.userRepository.findOne({
            where: {
                id: userId
            }
        });

        idea = await this.vote(idea, user, Votes.UP);
        return this.toResponseObject(idea);
    }

    async downvote(id: string, userId: string) {
        let idea = await this.ideaRepository.findOne({
            where: {
                id
            },
            relations: ['author', 'upvotes', 'downvotes']
        });

        const user = await this.userRepository.findOne({
            where: {
                id: userId
            }
        });

        idea = await this.vote(idea, user, Votes.DOWN);
        return this.toResponseObject(idea);
    }

    async bookmark(id: string, userId: string) {
        const idea = await this.ideaRepository.findOne({
            where: {
                id
            }
        });

        const user = await this.userRepository.findOne({
            where: {
                id: userId
            },
            relations: ['bookmarks']
        });

        if (user.bookmarks.filter(bookmark => bookmark.id === idea.id).length < 1) {
            user.bookmarks.push(idea);
            await this.userRepository.save(user);
        } else {
            throw new HttpException('Idea already bookmarked', HttpStatus.BAD_REQUEST);
        }

        return user.toResponseObject();
    }

    async unbookmark(id: string, userId: string) {
        const idea = await this.ideaRepository.findOne({
            where: {
                id
            }
        });

        const user = await this.userRepository.findOne({
            where: {
                id: userId
            },
            relations: ['bookmarks']
        });

        if (user.bookmarks.filter(bookmark => bookmark.id === idea.id).length > 0) {
            user.bookmarks = user.bookmarks.filter(bookmark => bookmark.id !== idea.id);
            await this.userRepository.save(user);
        } else {
            throw new HttpException('Idea is not bookmarked', HttpStatus.BAD_REQUEST);
        }

        return user.toResponseObject();
    }
}
