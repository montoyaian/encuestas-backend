import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChartsService } from './charts.service';

@Controller('charts')
@UseGuards(AuthGuard('jwt'))
export class ChartsController {
  constructor(private readonly chartsService: ChartsService) {}

  @Get(':surveyId')
  getSurveyCharts(@Param('surveyId', ParseUUIDPipe) surveyId: string) {
    return this.chartsService.getSurveyCharts(surveyId);
  }
}