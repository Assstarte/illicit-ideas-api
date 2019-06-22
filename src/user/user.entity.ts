import { BeforeInsert, Column, CreateDateColumn, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

import { UserRO } from './user.dto';
import { IdeaEntity } from '../idea/idea.entity';

@Entity('user')
export class UserEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn()
    created: Date;

    @Column({
        type: 'text',
        unique: true
    })
    username: string;

    @Column('text')
    password: string;

    @OneToMany(type => IdeaEntity, idea => idea.author)
    ideas: IdeaEntity[];

    @ManyToMany(type => IdeaEntity, {
        cascade: true
    })
    @JoinTable()
    bookmarks: IdeaEntity[];

    @BeforeInsert()
    async hashPassword() {
        this.password = await bcrypt.hash(this.password, 10);
    }

    // =======Getters & Setters=======
    private get token() {
        const {id, username} = this;
        return jwt.sign({
            id,
            username
        }, process.env.JWT_SECRET, {expiresIn: '7d'})
    }
    // ===============================
    // =============Methods===========
    toResponseObject(exposeToken: boolean = true): UserRO {
        const {id, created, username, token} = this;
        return {
            id,
            created,
            username,
            token: exposeToken ? token : null,
            ideas: this.ideas || null,
            bookmarks: this.bookmarks || null
        };
    }

    async comparePassword(attempt: string) {
        return await bcrypt.compare(attempt, this.password);
    }
    // ===============================
}
