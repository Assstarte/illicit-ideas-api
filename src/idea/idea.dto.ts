import { IsString } from 'class-validator';

import { UserRO } from '../user/user.dto';
import { UserEntity } from '../user/user.entity';

export class IdeaDTO {
    @IsString()
    idea: string;

    @IsString()
    description: string;
}

// tslint:disable-next-line:max-classes-per-file
export class IdeaRO {
    id?: string;
    updated: Date;
    created: Date;
    idea: string;
    description: string;
    author: UserRO;
    upvotes?: any;
    downvotes?: any;
}
