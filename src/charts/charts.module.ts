import { Module } from '@nestjs/common';
import { ResponsesModule } from 'src/responses/responses.module';
import { SurveysModule } from 'src/surveys/surveys.module';
import { ChartsController } from './charts.controller';
import { ChartsService } from './charts.service';

@Module({
  imports: [SurveysModule, ResponsesModule],
  controllers: [ChartsController],
  providers: [ChartsService],
})
export class ChartsModule {}