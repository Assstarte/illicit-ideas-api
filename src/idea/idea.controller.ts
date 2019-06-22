import { Controller, Get, Post, Put, Delete, Body, Param, UsePipes, Logger, UseGuards } from '@nestjs/common';
import { IdeaService } from './idea.service';
import { IdeaDTO } from './idea.dto';
import { ValidationPipe } from '../shared/validation.pipe';
import { AuthGuard } from '../shared/auth.guard';
import { User } from '../user/user.decorator';
import { UserEntity } from '../user/user.entity';

@Controller('api/ideas')
export class IdeaController {
    private logger = new Logger('IdeaController');
    constructor(
        private ideaService: IdeaService,
    ) { }

    private logData(options: any) {
        options.user && this.logger.log('USER' + JSON.stringify(options.user));
        options.data && this.logger.log('DATA' + JSON.stringify(options.data));
        options.id && this.logger.log('IDEA' + JSON.stringify(options.id));
    }

    @Get()
    showAllIdeas() {
        return this.ideaService.showAll();
    }

    @Post()
    @UseGuards(new AuthGuard())
    @UsePipes(new ValidationPipe())
    createIdea(@User('id') user, @Body() data: IdeaDTO) {
        this.logData({user, data})
        return this.ideaService.create(user, data);
    }

    @Get(':id')
    readIdea(@Param('id') id: string) {
        return this.ideaService.read(id);
    }

    @Put(':id')
    @UseGuards(new AuthGuard())
    @UsePipes(new ValidationPipe())
    updateIdea(@Param('id') id: string, @User('id') user: string, @Body() data: Partial<IdeaDTO>) {
        this.logData({
            id,
            user,
            data
        });
        return this.ideaService.update(id, user, data);
    }

    @Delete(':id')
    @UseGuards(new AuthGuard())
    destroyIdea(@Param('id') id: string, @User('id') user: string) {
        this.logData({
            id,
            user
        });
        return this.ideaService.destroy(id, user);
    }

    @Post(':id/upvote')
    @UseGuards(new AuthGuard())
    upvoteIdea(@Param('id') id: string, @User('id') userId: string) {
        this.logData({
            id,
            userId
        });

        return this.ideaService.upvote(id, userId);
    }

    @Post(':id/downvote')
    @UseGuards(new AuthGuard())
    downvoteIdea(@Param('id') id: string, @User('id') userId: string) {
        this.logData({
            id,
            userId
        });

        return this.ideaService.downvote(id, userId);
    }

    @Post(':id/bookmark')
    @UseGuards(new AuthGuard())
    bookmarkIdea(@Param('id') id: string, @User('id') userId: string) {
        this.logData({
            id,
            userId
        });

        return this.ideaService.bookmark(id, userId);
    }

    @Delete(':id/bookmark')
    @UseGuards(new AuthGuard())
    unbookmarkIdea(@Param('id') id: string, @User('id') userId: string) {
        this.logData({
            id,
            userId
        });

        return this.ideaService.unbookmark(id, userId);
    }
}
