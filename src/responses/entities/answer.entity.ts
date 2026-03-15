import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Response } from './response.entity';
import { SurveyQuestion } from '../../surveys/entities/survey-question.entity';

@Entity({ name: 'answers' })
export class Answer {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Response, (response) => response.answers, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'response_id' })
  response: Response;

  @ManyToOne(() => SurveyQuestion, { nullable: false })
  @JoinColumn({ name: 'survey_question_id' })
  surveyQuestion: SurveyQuestion;

  @Column({ type: 'jsonb' })
  value: unknown;
}
