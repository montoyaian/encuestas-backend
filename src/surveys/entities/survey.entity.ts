import {
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Column,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { TargetRoleEnum } from './target-role.enum';
import { SurveyQuestion } from './survey-question.entity';
import { Response } from '../../responses/entities/response.entity';

@Entity({ name: 'surveys' })
@Index('idx_surveys_target_role', { synchronize: false })
@Index('idx_surveys_target_role_created_at', { synchronize: false })
export class Survey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'boolean',
    name: 'allow_multiple_responses',
    default: false,
  })
  allowMultipleResponses: boolean;

  @Column({
    type: 'enum',
    enum: TargetRoleEnum,
    array: true,
    name: 'target_role',
  })
  targetRole: TargetRoleEnum[];

  @OneToMany(() => SurveyQuestion, (question) => question.survey)
  questions: SurveyQuestion[];

  @OneToMany(() => Response, (response) => response.survey)
  responses: Response[];

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'created_at',
  })
  createdAt: Date;
}
