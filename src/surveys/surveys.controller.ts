import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { Payload } from 'src/auth/models/payload.model';
import { CreateSurveyDto, UpdateSurveyDto } from './dto/surveydto';
import { SurveysService } from './surveys.service';

@Controller('surveys')
export class SurveysController {
  constructor(private readonly surveysService: SurveysService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  getAllSurveys(@CurrentUser() user: Payload) {
    return this.surveysService.findAllVisibleByProfile(user.profile, user.sub);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  getSurveyById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: Payload,
  ) {
    return this.surveysService.findOneVisibleByProfile(id, user.profile);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  createSurvey(@Body() body: CreateSurveyDto, @CurrentUser() user: Payload) {
    return this.surveysService.create(body, user.sub);
  }

  @Put(':id')
  updateSurvey(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateSurveyDto,
  ) {
    return this.surveysService.update(id, body);
  }

  @Delete(':id')
  deleteSurvey(@Param('id', ParseUUIDPipe) id: string) {
    return this.surveysService.remove(id);
  }

  @Get('created/by-me')
  @UseGuards(AuthGuard('jwt'))
  getSurveysCreatedByMe(@CurrentUser() user: Payload) {
    return this.surveysService.findByUserId(user.sub);
  }
}
