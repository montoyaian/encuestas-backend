import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnswersService } from './answers.service';
import { Response } from './entities/response.entity';
import { Answer } from './entities/answer.entity';
import { ResponsesController } from './responses.controller';
import { ResponsesService } from 'src/responses/responses.service';
import { Survey } from 'src/surveys/entities/survey.entity';
import { SurveyQuestion } from 'src/surveys/entities/survey-question.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Response, Answer, Survey, SurveyQuestion, User])],
  controllers: [ResponsesController],
  providers: [ResponsesService, AnswersService],
  exports: [ResponsesService, AnswersService],
})
export class ResponsesModule {}
