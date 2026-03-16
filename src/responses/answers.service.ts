import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Answer } from './entities/answer.entity';

@Injectable()
export class AnswersService {
  constructor(
    @InjectRepository(Answer)
    private readonly answerRepository: Repository<Answer>,
  ) {}

  async findBySurveyId(surveyId: string) {
    return this.answerRepository
      .createQueryBuilder('answer')
      .leftJoinAndSelect('answer.surveyQuestion', 'surveyQuestion')
      .leftJoin('answer.response', 'response')
      .where('response.survey_id = :surveyId', { surveyId })
      .orderBy('surveyQuestion.question_order', 'ASC')
      .getMany();
  }
}