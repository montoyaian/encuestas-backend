import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Response } from 'src/responses/entities/response.entity';
import { User } from 'src/users/entities/user.entity';
import { SurveyQuestion } from './entities/survey-question.entity';
import { Survey } from './entities/survey.entity';
import { SurveysController } from './surveys.controller';
import { SurveysService } from './surveys.service';

@Module({
  imports: [TypeOrmModule.forFeature([Survey, SurveyQuestion, User, Response])],
  controllers: [SurveysController],
  providers: [SurveysService],
  exports: [SurveysService],
})
export class SurveysModule {}
